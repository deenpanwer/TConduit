import { createAgentUIStreamResponse } from 'ai';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { getTracAiAgent } from '@/lib/ai/agents/trac-ai';

// Increase duration for complex tool-calling sequences
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, chatId, orgId, userId } = await req.json();

    if (!orgId || !userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const agent = getTracAiAgent(orgId, userId);

    const result = await createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      onFinish: async ({ responseMessage }) => {
        if (chatId && userId) {
            try {
                const text = responseMessage.parts
                    .filter((p): p is any => p.type === 'text')
                    .map(p => p.text)
                    .join('');

                const toolInvocations = responseMessage.parts
                    .filter((p): p is any => p.type.startsWith('tool-') || p.type === 'dynamic-tool')
                    .map(p => ({
                        ...p,
                        toolName: p.type.startsWith('tool-') ? p.type.slice(5) : p.toolName,
                        args: p.input,
                        result: p.output
                    }));

                // 1. Persist the AI response as a NEW document in the sub-collection
                const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
                await addDoc(messagesRef, {
                    role: 'assistant',
                    parts: responseMessage.parts,
                    toolInvocations,
                    createdAt: new Date().toISOString()
                });

                // Update the chat with any new user message parts (like images) that were passed in
                // if they haven't been persisted yet. 
                // The frontend usually adds the user message, but we ensure the structure matches.

                // 2. Update Chat Summary (Metadata)
                const chatRef = doc(db, 'users', userId, 'chats', chatId);
                await setDoc(chatRef, {
                    updatedAt: serverTimestamp(),
                    lastMessage: text.substring(0, 100),
                    orgId,
                }, { merge: true });

            } catch (e) {
                console.error("Error persisting AI response:", e);
            }
        }
      }
    });

    return result;

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process chat request",
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}