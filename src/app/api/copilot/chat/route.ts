import { mistral } from '@ai-sdk/mistral';
import { streamText } from 'ai';

export const runtime = 'edge';

/**
 * TRAC AI SUPER COPILOT - API ROUTE
 * 
 * Target Path: /api/copilot/chat
 * AI Provider: Mistral Pixtral (12B-2409)
 * SDK: Vercel AI SDK (ai)
 */

export async function POST(req: Request) {
  try {
    const { messages, taskContext, image, orgName, userName } = await req.json();

    if (!process.env.MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { status: 500 });
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

    // 3. MULTIMODAL MESSAGE CONSTRUCTION
    const lastMessage = messages[messages.length - 1];
    const coreMessages = messages.slice(0, -1);
    
    const userContent: any[] = [
      { type: 'text', text: lastMessage.content || "Analyze my current progress and provide guidance." }
    ];

    if (image) {
      userContent.push({
        type: 'image',
        image: image, // The Base64 Cluster Collage from Electron
      });
    }

    // 4. CALL MISTRAL PIXTRAL
    const result = await streamText({
      model: mistral('pixtral-12b-2409'),
      system: systemPrompt,
      messages: [
        ...coreMessages,
        { role: 'user', content: userContent }
      ],
      temperature: 0.2, // Low temperature for high precision
    });

    // Return the stream to the Electron HUD
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('[Copilot API Error]:', error);
    return new Response(
      JSON.stringify({ error: 'The Copilot link was interrupted. Please check your connection.', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
