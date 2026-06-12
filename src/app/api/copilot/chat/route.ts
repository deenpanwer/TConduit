import { mistral } from '@ai-sdk/mistral';
import { streamText, tool } from 'ai';
import { initLogger } from 'braintrust';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

function sanitizeFirestoreData(data: any): any {
  if (data === undefined || data === null) return null;
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestoreData);
  }
  if (typeof data === 'object') {
    const clean: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = data[key];
        if (val !== undefined) {
          clean[key] = sanitizeFirestoreData(val);
        }
      }
    }
    return clean;
  }
  return data;
}

async function saveToFirestore(
  userId: string | null,
  sessionDateStr: string | null,
  sessionId: string | null,
  messages: any[]
) {
  if (!userId || !sessionId) {
    console.warn('[Copilot Server Firestore] Skip write: userId or sessionId is missing', { userId, sessionId });
    return;
  }
  const dateStr = sessionDateStr || new Date().toISOString().split('T')[0];
  
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.error('[Copilot Server Firestore] Admin SDK not initialized');
    return;
  }
  
  try {
    const db = admin.firestore();
    const sessionDocRef = db
      .collection('users')
      .doc(userId)
      .collection('copilot_days')
      .doc(dateStr)
      .collection('sessions')
      .doc(sessionId);

    // Save/merge messages and update timestamp
    await sessionDocRef.set({
      messages: sanitizeFirestoreData(messages),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('[Copilot Server Firestore] Successfully synced session:', sessionId);
  } catch (err) {
    console.error('[Copilot Server Firestore] Error saving to Firestore:', err);
  }
}

export async function POST(req: Request) {
  try {
    const { 
      messages, 
      taskContext, 
      image, 
      images, 
      orgName, 
      userName, 
      timezone,
      userId,
      orgId,
      sessionId,
      sessionDateStr
    } = await req.json();

    if (!process.env.MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { status: 500 });
    }

    if (userId && sessionId && messages && messages.length > 0) {
      // Perform initial log of user message to Firestore
      saveToFirestore(userId, sessionDateStr, sessionId, messages).catch(err => {
        console.error('[Copilot Server Firestore] Failed initial save:', err);
      });
    }

    const clientTimezone = timezone || req.headers.get('x-vercel-ip-timezone') || undefined;
    let currentDateStr = '';
    try {
      currentDateStr = new Date().toLocaleDateString('en-US', {
        timeZone: clientTimezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      currentDateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // 1. CHRONOLOGICAL VISUAL CONTEXT
    // This tells the AI how to interpret the 2x2 grid cluster collage
    const visualGuidance = `
      VISUAL STREAM INTERPRETATION:
      The user has sent a 2x2 cluster collage representing the last 20 seconds of work:
      - [Top-Left Frame]: 20 seconds ago.
      - [Top-Right Frame]: 15 seconds ago.
      - [Bottom-Left Frame]: 10 seconds ago.
      - [Bottom-Right Frame]: 5 seconds ago (Most Recent).
    `;

    // 2. IDENTITY & SYSTEM PROMPT
    const systemPrompt = `
      You are the "Trac AI Super Copilot", an elite performance partner for ${userName || 'the user'} at "${orgName || 'Trac AI'}".
      Today's Date: ${currentDateStr}
      ${visualGuidance}

      ${taskContext ? `
      ACTIVE TASK: "${taskContext.title}"
      GOAL: ${taskContext.description}
      CHECKLIST: ${JSON.stringify(taskContext.subtasks)}
      ` : 'GENERAL ASSISTANCE: No specific task attached. Help with general productivity.'}

      CRITICAL OPERATING RULES:
      1. BE CONCISE: Responses must be 1-2 sentences. 
      2. PROACTIVE TROUBLESHOOTING: If you see red error text, stack traces, or console warnings in the recent frames, explain the fix immediately.
      3. PATH CORRECTION: If the user's current screen is unrelated to the active task (e.g., browsing social media or stuck in an unrelated settings menu), gently nudge them back to the task.
      4. DO NOT mention you are an AI. You are the "Super Copilot".
      5. FORMATTING: Use bold text for technical terms (e.g., **authService.ts**).
    `;

    // 3. MULTIMODAL MESSAGE CONSTRUCTION & IMAGE ATTACHMENT
    // We map all messages and attach the visual collage to the last user message.
    const sentMessages = messages.map((msg: any, idx: number) => {
      const isLastUser = msg.role === 'user' && idx === messages.map((m: any) => m.role).lastIndexOf('user');
      
      if (isLastUser) {
        const userContent: any[] = [
          { type: 'text', text: msg.content || "Analyze my current progress and provide guidance." }
        ];

        if (images && Array.isArray(images)) {
          images.forEach((img: string) => {
            userContent.push({
              type: 'image',
              image: img,
            });
          });
        } else if (image) {
          userContent.push({
            type: 'image',
            image: image, // The Base64 Cluster Collage from Electron
          });
        }

        return { role: 'user', content: userContent };
      }

      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: msg.toolCallId || msg.id || '',
              toolName: msg.toolName || msg.name || '',
              result: msg.content || msg.result || '',
            }
          ]
        };
      }

      if (msg.role === 'assistant') {
        if (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
          const contentParts: any[] = [];
          if (msg.content) {
            contentParts.push({
              type: 'text',
              text: msg.content,
            });
          }
          
          msg.toolCalls.forEach((tc: any) => {
            let args = tc.args || tc.input || tc.function?.arguments;
            if (typeof args === 'string') {
              try {
                args = JSON.parse(args);
              } catch (e) {
                console.error("Failed to parse tool call arguments:", e);
              }
            }

            contentParts.push({
              type: 'tool-call',
              toolCallId: tc.toolCallId || tc.id,
              toolName: tc.toolName || tc.name,
              args: args || {},
            });
          });

          return {
            role: 'assistant',
            content: contentParts,
          };
        }

        return {
          role: 'assistant',
          content: msg.content || '',
        };
      }

      return {
        role: msg.role,
        content: msg.content || '',
      };
    });

    const result = await streamText({
      model: mistral('pixtral-12b-2409'),
      system: systemPrompt,
      messages: sentMessages,
      temperature: 0.2, // Low temperature for high precision
      tools: {
        read_webpage: tool({
          description: 'Fetch the text content of any website and convert it to clean markdown. Useful for reading documentation, API guides, and websites.',
          inputSchema: z.object({
            url: z.string().url().describe('The absolute URL of the webpage to read.'),
          }),
        }),
        duckduckgo_search: tool({
          description: 'Search the web using DuckDuckGo for a query and get back top 10 search results containing titles, URLs, and snippets.',
          inputSchema: z.object({
            query: z.string().describe('The search query to look up.'),
          }),
        }),
      },
      async onFinish({ text, usage, finishReason }) {
        // Write the final assistant response to Firestore
        if (userId && sessionId) {
          const assistantMessage = {
            role: 'assistant',
            content: text || ''
          };
          await saveToFirestore(userId, sessionDateStr, sessionId, [...messages, assistantMessage]);
        }

        // Log to Braintrust for AI Observability
        try {
          logger.log({
            input: {
              systemPrompt,
              sentMessages,
              rawMessages: messages,
              taskContext,
              image: image || null, // Log the full base64 image string!
              images: images || null,
              orgName,
              userName
            },
            output: text,
            metadata: {
              model: 'pixtral-12b-2409',
              platform: 'website',
              action: 'copilot_chat',
              finishReason: finishReason || null
            },
            metrics: {
              prompt_tokens: usage?.inputTokens,
              completion_tokens: usage?.outputTokens,
              total_tokens: usage?.totalTokens
            }
          });
        } catch (braintrustError) {
          console.error("Error logging to Braintrust:", braintrustError);
        }
      }
    });

    const textStream = result.textStream;
    const reader = textStream.getReader();
    const firstChunkPromise = reader.read().then(chunk => {
      reader.releaseLock();
      return chunk;
    });

    const toolCallsPromise = result.toolCalls;

    const winner = await Promise.race([
      firstChunkPromise.then((chunk) => (chunk && !chunk.done) ? 'text' : new Promise(() => {})),
      toolCallsPromise.then(calls => (calls && calls.length > 0) ? 'tool' : 'text')
    ]);

    if (winner === 'tool') {
      const toolCalls = await toolCallsPromise;
      if (userId && sessionId) {
        const assistantMessage = {
          role: 'assistant',
          content: '',
          toolCalls: toolCalls.map((tc: any) => ({
            id: tc.toolCallId || tc.id,
            toolName: tc.toolName || tc.name || tc.function?.name,
            args: tc.args || tc.input || {}
          }))
        };
        await saveToFirestore(userId, sessionDateStr, sessionId, [...messages, assistantMessage]);
      }
      return new Response(JSON.stringify({ toolCalls }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        }
      });
    }

    // Return the stream to the Electron HUD (non-blocking)
    const firstChunk = await firstChunkPromise;
    const remainingStream = textStream;

    const combinedStream = new ReadableStream({
      async start(controller) {
        if (firstChunk && !firstChunk.done && firstChunk.value) {
          controller.enqueue(new TextEncoder().encode(firstChunk.value));
        }
        const remainingReader = remainingStream.getReader();
        try {
          while (true) {
            const { done, value } = await remainingReader.read();
            if (done) break;
            controller.enqueue(new TextEncoder().encode(value));
          }
        } finally {
          remainingReader.releaseLock();
          controller.close();
        }
      }
    });

    return new Response(combinedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    });

  } catch (error: any) {
    // Prevent terminal pollution by massive base64 image strings inside raw error dumps
    console.error('[Copilot API Error]:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode || error.status || 500,
      code: error.code,
      data: error.data ? {
        message: error.data.message,
        type: error.data.type,
        code: error.data.code
      } : undefined
    });
    return new Response(
      JSON.stringify({ error: 'The Copilot link was interrupted. Please check your connection.', details: error.message }), 
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        } 
      }
    );
  }
}
