import { createAgentUIStreamResponse } from 'ai';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getTracAiAgent } from '@/lib/ai/agents/trac-ai';
import { initLogger } from 'braintrust';
import { waitUntil } from '@vercel/functions';

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

// Utility to recursively remove undefined values which crash Firestore
const removeUndefined = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = removeUndefined(obj[key]);
    }
  }
  return newObj;
};

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, chatId, orgId, userId, userName, userRole, timezone } = body;
    const platform = 'website';

    console.log(`[CHAT_API] Request received: chatId=${chatId}, userId=${userId}`);

    if (!orgId || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const agent = getTracAiAgent(orgId, userId, { userName, userRole, timezone, platform });
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    const result = await createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      onStepFinish: async (step) => {
        if (step.usage) {
          totalUsage.promptTokens += step.usage.inputTokens || 0;
          totalUsage.completionTokens += step.usage.outputTokens || 0;
          totalUsage.totalTokens += step.usage.totalTokens || 0;
        }
      },
      onFinish: async ({ messages: finalMessages }) => {
        console.log(`[CHAT_API] onFinish triggered for chatId=${chatId}`);

        const persistPromise = (async () => {
          if (chatId && userId) {
            try {
              // Initialize Admin SDK for robust server-side execution
              const admin = getFirebaseAdmin();
              if (!admin) throw new Error("Firebase Admin SDK not initialized");
              const dbAdmin = admin.firestore();

              const aiMessage = finalMessages[finalMessages.length - 1];
              const parts = aiMessage.parts || [];

              let text = parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('');

              if (!text && (aiMessage as any).content) {
                text = (aiMessage as any).content;
              }

              const toolInvocations = parts
                .filter((p: any) => p.toolCallId)
                .reduce((acc: any[], p: any) => {
                  const existing = acc.find(t => t.toolCallId === p.toolCallId);
                  if (existing) {
                    if (p.result || p.output) {
                      existing.result = p.result || p.output;
                    }
                  } else {
                    acc.push({
                      toolCallId: p.toolCallId,
                      toolName: p.toolName,
                      args: p.args || p.input,
                      result: p.result || p.output
                    });
                  }
                  return acc;
                }, []);

              console.log(`[CHAT_API] Captured ${toolInvocations.length} tool invocations`);

              // Create a descriptive summary for the UI if text is empty but tools were used
              let summaryText = text.substring(0, 100);
              if (!summaryText && toolInvocations.length > 0) {
                const toolNames = toolInvocations.map(t => t.toolName.replace(/_/g, ' ')).join(', ');
                summaryText = `[AI Action: ${toolNames}]`;
              } else if (!summaryText) {
                summaryText = "Empty response";
              }

              // 1. Persist to Firestore via Admin SDK
              try {
                const messagesRef = dbAdmin.collection('users').doc(userId).collection('chats').doc(chatId).collection('messages');
                await messagesRef.add(removeUndefined({
                  role: 'assistant',
                  parts: parts,
                  toolInvocations,
                  createdAt: new Date().toISOString()
                }));

                const chatRef = dbAdmin.collection('users').doc(userId).collection('chats').doc(chatId);
                const safeUpdate = removeUndefined({
                  lastMessage: "Trac AI: " + summaryText,
                  orgId,
                });
                safeUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();

                await chatRef.set(safeUpdate, { merge: true });

                console.log(`[CHAT_API] Admin Firestore persistence success`);
              } catch (firestoreError: any) {
                console.error("[CHAT_API] Firestore Persistence Error:", firestoreError.message);
              }

              // 2. Log to Braintrust (Clean Payload)
              try {
                console.log(`[CHAT_API] Logging to Braintrust...`);
                // Strip complex objects for Braintrust schema validation
                const cleanInputMessages = messages.map((m: any) => ({
                  role: m.role,
                  content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || m.parts)
                }));

                // Extract full tool execution trace (input arguments + output results)
                const toolExecutionsTrace = parts
                  .filter((p: any) => p.type && p.type.startsWith('tool-'))
                  .map((p: any) => ({
                    toolName: p.type.replace('tool-', ''),
                    input: p.input,
                    output: p.output
                  }));

                // Prepare comprehensive Braintrust output
                let braintrustOutput: any = text;

                if (toolExecutionsTrace.length > 0) {
                  if (text) {
                    // If we have both text and tools, combine them into an object for full observability
                    braintrustOutput = {
                      text: text,
                      _toolExecutions: toolExecutionsTrace
                    };
                  } else {
                    // If only tools were used
                    braintrustOutput = { _toolExecutions: toolExecutionsTrace };
                  }
                } else if (!text) {
                  braintrustOutput = "Empty output";
                }

                await logger.log({
                  input: cleanInputMessages, // Pass array directly for native Braintrust Chat UI rendering
                  output: braintrustOutput,
                  metrics: {
                    prompt_tokens: totalUsage.promptTokens,
                    completion_tokens: totalUsage.completionTokens,
                    tokens: totalUsage.totalTokens
                  },
                  metadata: {
                    userId,
                    orgId,
                    chatId,
                    model: 'pixtral-12b-2409',
                    platform: 'website',
                    toolInvocations: toolInvocations.map(t => t.toolName)
                  }
                });

                await logger.flush();
                console.log(`[CHAT_API] Braintrust flush success`);
              } catch (braintrustError: any) {
                console.error("[CHAT_API] Braintrust Error:", braintrustError.message);
              }

            } catch (e: any) {
              console.error("[CHAT_API] Critical Persistence Error:", e.message);
            }
          }
        })();

        // Explicitly wait for background persistence to finish before Vercel kills the container
        waitUntil(persistPromise);
      }
    });

    return result;

  } catch (error: any) {
    console.error("[CHAT_API] Fatal Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500 }
    );
  }
}
