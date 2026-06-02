import { mistral } from '@ai-sdk/mistral';
import { streamText } from 'ai';
import { initLogger } from 'braintrust';

export const runtime = 'edge';

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, taskContext, image, images, orgName, userName } = await req.json();

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

    // 4. CALL MISTRAL PIXTRAL
    const sentMessages = [
      ...coreMessages,
      { role: 'user', content: userContent }
    ];

    const result = await streamText({
      model: mistral('pixtral-12b-2409'),
      system: systemPrompt,
      messages: sentMessages,
      temperature: 0.2, // Low temperature for high precision
      onFinish({ text, usage, finishReason }) {
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

    // Return the stream to the Electron HUD
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('[Copilot API Error]:', error);
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
