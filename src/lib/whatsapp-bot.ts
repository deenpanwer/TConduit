import { Chat, Attachment } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createRedisState } from "@chat-adapter/state-redis";
import { getTracAiAgent } from "@/lib/ai/agents/trac-ai";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { generateText } from "ai";
import { uploadToFirebaseStorage } from "./storage-utils";
import { initLogger, traced } from "braintrust";

// Initialize Braintrust Observability Logger
initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || "tracai",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

/**
 * Singleton instance of the WhatsApp Bot.
 */
let chatInstance: Chat | null = null;

/**
 * Initializes the WhatsApp Bot using Chat SDK with Redis state.
 */
export const getWhatsAppBot = () => {
    if (chatInstance) return chatInstance;

    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN!;
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL!;
    const host = upstashUrl.replace("https://", "");
    
    // Explicitly using the full connection string format for the Redis adapter
    const redisUrl = `rediss://default:${upstashToken}@${host}:6379`;

    console.log("[WhatsApp] Initializing bot with Redis state...");

    chatInstance = new Chat({
        userName: "Trac AI",
        adapters: {
            whatsapp: createWhatsAppAdapter({
                accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
                phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
                verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
                appSecret: process.env.WHATSAPP_APP_SECRET!,
            }),
        },
        state: createRedisState({
            url: redisUrl,
        }),
        dedupeTtlMs: 600_000,
    });

    // Register event handlers once during initialization
    registerWhatsAppHandlers(chatInstance);

    return chatInstance;
};

/**
 * Registers global event handlers for the WhatsApp bot.
 */
function registerWhatsAppHandlers(bot: Chat) {
    bot.onDirectMessage(async (thread, message) => {
        console.log(`[WhatsApp] Received message from ${message.author.userId}: "${message.text}" (${message.attachments?.length || 0} attachments)`);
        
        // Prevent the bot from responding to its own messages
        if (message.author.isMe) {
            console.log("[WhatsApp] Ignoring self-message");
            return;
        }

        try {
            const from = message.author.userId;

            const admin = getFirebaseAdmin();
            if (!admin) {
                console.error("[WhatsApp] Firebase Admin not initialized");
                return;
            }

            const db = admin.firestore();
            const usersRef = db.collection("users");

            // Look up user by WhatsApp number
            console.log(`[WhatsApp] Looking up user with phone: +${from}`);
            const userQuery = await usersRef.where("whatsapp", "==", `+${from}`).limit(1).get();

            if (userQuery.empty) {
                console.warn(`[WhatsApp] No user found for +${from}`);
                await thread.post(`I couldn't find an account associated with this number (+${from}). Please ensure your WhatsApp is registered in the Trac dashboard.`);
                return;
            }

            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;
            const orgId = userData.ownedOrgId || userData.orgId;

            console.log(`[WhatsApp] User identified: ${userId}, Org: ${orgId}`);

            if (!orgId) {
                console.warn(`[WhatsApp] User ${userId} has no Org ID`);
                await thread.post("Your account is not yet associated with an organization. Please complete your onboarding.");
                return;
            }

            const agent = getTracAiAgent(orgId, userId);
            console.log("[WhatsApp] Agent initialized, processing history and attachments...");

            try {
                await thread.startTyping();

                // Path for this chat's messages in Firestore
                const chatId = `whatsapp-${from}`;
                const chatRef = db.collection("users").doc(userId).collection("chats").doc(chatId);
                const messagesRef = chatRef.collection("messages");

                // 1. Handle Attachments (Multimodal Support)
                const imageParts: any[] = [];
                const attachmentDocs: any[] = [];

                if (message.attachments && message.attachments.length > 0) {
                    for (const attachment of message.attachments) {
                        // Support for images - download and upload to Firebase Storage
                        if (attachment.mimeType?.startsWith("image/") && attachment.fetchData) {
                            try {
                                const buffer = await attachment.fetchData();
                                const timestamp = Date.now();
                                const fileName = attachment.name || `image_${timestamp}.jpg`;
                                
                                // Proper path mapping matching Firestore structure: users/{userId}/chats/{chatId}/attachments/{filename}
                                const storagePath = `users/${userId}/chats/${chatId}/attachments/${timestamp}_${fileName}`;
                                
                                console.log(`[WhatsApp] Uploading attachment to: ${storagePath}`);
                                const publicUrl = await uploadToFirebaseStorage(buffer, storagePath, attachment.mimeType);

                                // Add base64 for immediate AI processing
                                imageParts.push({
                                    type: "image",
                                    image: buffer.toString("base64")
                                });

                                // Store metadata for Firestore persistence
                                attachmentDocs.push({
                                    type: "image",
                                    url: publicUrl,
                                    mimeType: attachment.mimeType,
                                    name: fileName
                                });
                            } catch (uploadError) {
                                console.error("[WhatsApp] Failed to process attachment:", uploadError);
                            }
                        }
                    }
                }

                // 2. Fetch last 10 messages from history for context
                const historySnapshot = await messagesRef.orderBy("createdAt", "desc").limit(10).get();
                console.log(`[WhatsApp] Found ${historySnapshot.size} historical messages`);

                const history = historySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Extract text from parts array or fallback to data.text
                    const messageText = data.parts?.map((p: any) => {
                        if (p.type === 'text') return p.text;
                        if (p.type === 'image') return `[Image: ${p.url}]`;
                        return '';
                    }).join('\n') || data.text || "";

                    return {
                        role: data.role,
                        content: messageText
                    };
                }).reverse();

                // Format history to be injected directly into the user message prompt
                let historyText = "";
                if (history.length > 0) {
                    historyText = "--- RECENT CONVERSATION HISTORY ---\n";
                    for (const msg of history) {
                        const sender = msg.role === "user" ? "User" : "Trac AI";
                        historyText += `${sender}: ${msg.content}\n`;
                    }
                    historyText += "-----------------------------------\n\n";
                    console.log(`[WhatsApp] Injecting ${history.length} historical messages into prompt:\n${historyText}`);
                }

                // 3. Construct current message content
                // Multi-modal content is passed as an array of parts
                const currentContent: any[] = [];
                if (historyText || message.text) {
                    currentContent.push({ 
                        type: "text", 
                        text: historyText + (message.text || "") 
                    });
                }
                currentContent.push(...imageParts);

                // 4. Generate AI response (using history prepended to current message context, tracked by Braintrust)
                const result = await traced(async (span: any) => {
                    const genResult = await agent.generate({
                        messages: [
                            { role: "user", content: currentContent }
                        ] as any,
                    });

                    span.log({
                        input: historyText + (message.text || (attachmentDocs.length > 0 ? "[Image Sent]" : "")),
                        output: genResult.text,
                        metrics: genResult.usage ? {
                            prompt_tokens: genResult.usage.inputTokens,
                            completion_tokens: genResult.usage.outputTokens,
                            tokens: genResult.usage.totalTokens
                        } : undefined,
                        metadata: {
                            userId,
                            orgId,
                            chatId,
                            platform: 'whatsapp',
                            model: 'pixtral-large-2411',
                            historyCount: history.length,
                            attachmentsCount: attachmentDocs.length
                        }
                    });

                    return genResult;
                }, { 
                    name: "WhatsApp AI Response"
                });

                // Clean up formatting for WhatsApp
                let cleanResponse = result.text
                    .replace(/\*\*(.*?)\*\*/g, "*$1*")
                    .replace(/\* (.*?)\*/g, "*$1*")
                    .replace(/\*(.*?) \*/g, "*$1*");

                console.log("[WhatsApp] AI response generated:", cleanResponse);

                // 5. Post response to WhatsApp
                await thread.post(cleanResponse);
                console.log("[WhatsApp] Response posted to thread");

                // 6. Persist BOTH messages to Firestore (User + AI)
                // User Message (including any attachments)
                await messagesRef.add({
                    role: "user",
                    parts: [
                        { type: "text", text: message.text || (attachmentDocs.length > 0 ? "[Image Sent]" : "") },
                        ...attachmentDocs
                    ],
                    createdAt: new Date().toISOString()
                });

                // AI Response
                await messagesRef.add({
                    role: "assistant",
                    parts: [{ type: "text", text: cleanResponse }],
                    createdAt: new Date().toISOString()
                });

                // Update Chat Summary (Metadata)
                await chatRef.set({
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastMessage: cleanResponse.substring(0, 100),
                    orgId,
                    title: "WhatsApp Conversation"
                }, { merge: true });

            } catch (error) {
                console.error("[WhatsApp] AI AI Flow Error:", error);
                await thread.post("I encountered an error processing your request. Please try again later.");
            }
        } catch (error) {
            console.error("[WhatsApp] Event Handler Error:", error);
        }
    });
}

/**
 * Dispatches webhook events to the WhatsApp adapter.
 */
export const handleWhatsAppEvent = async (bot: Chat, req: Request, options?: any) => {
    // The SDK's handleWebhook expects a Request object and handles both GET and POST
    return await bot.webhooks.whatsapp(req, options);
};
