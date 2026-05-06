import { createAgentUIStreamResponse } from 'ai';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

                // Atomic Update of the entire chat "dump"
                const assistantMsg = {
                    id: responseMessage.id || crypto.randomUUID(),
                    role: 'assistant',
                    parts: responseMessage.parts,
                    toolInvocations,
                    createdAt: new Date().toISOString()
                };

                const fullHistory = [...messages, assistantMsg];

                const chatRef = doc(db, 'users', userId, 'chats', chatId);
                await setDoc(chatRef, {
                    messages: fullHistory,
                    updatedAt: serverTimestamp(),
                    lastMessage: text.substring(0, 100),
                    orgId,
                    title: messages[0]?.content || messages[0]?.parts?.[0]?.text?.substring(0, 40) || 'New Chat'
                }, { merge: true });

            } catch (e) {
                console.error("Error persisting chat dump:", e);
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