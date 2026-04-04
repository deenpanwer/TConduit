import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export const maxDuration = 60;

/**
 * SUPERVISE API ROUTE
 * -------------------
 * Implementation: Embedding Clustering (Temporal Context Compression)
 * 
 * TECHNIQUE: 
 * Instead of sending multiple individual images to the AI (which increases costs and latency),
 * we send a single client-generated collage. The AI treats this as one "frame" but can 
 * deduce temporal progress or task variety from the clustered sub-images.
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employeeName, date, screenshotUrls, screenshotMetadata } = body;

        // Validation
        if (!process.env.MISTRAL_API_KEY) {
            return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { status: 500 });
        }

        if (!screenshotUrls || screenshotUrls.length === 0) {
            return new Response(JSON.stringify({ inferredIntent: "No activity detected." }), { status: 200 });
        }

        // --- CONTEXT EXTRACTION ---
        // We extract textual context from all images provided in metadata 
        // to give the AI secondary confirmation of the active applications.
        const fullContext = (screenshotMetadata || []).map((m: any) => ({
            app: m?.activity?.name || "Unknown",
            title: m?.activity?.title || "No Title",
        }));

        const { text } = await generateText({
            model: mistral('ministral-3b-2512'),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `
                            ROLE: You are the Lead Audit Manager for "Trac AI" (the Workforce Intelligence Engine for Traconomics.com and Trac Diary). 
                            You have magical, perfect knowledge of work activity.

                            TASK: Deduce exactly what ${employeeName} is doing right now on ${date}.
                            
                            INPUTS:
                            1. ACTIVITY DATA: A cluster of work captures and app logs: ${JSON.stringify(fullContext)}.

                            CORE GUIDELINES (STRICT):
                            - TRADE SECRET: NEVER mention "screenshots", "images", "collage", or "visuals". Talk about the work itself.
                            - SIMPLE VOCABULARY: Use very simple words that a 10-year-old would understand. No big jargon.
                            - DEDUCTION: Describe the literal work goal (e.g., "Writing a new computer program" instead of "Coding").
                            - NO AI-SPEAK: Do not say "I can see" or "Looking at". Just state the fact.
                            - MAXIMUM 15 words.
                            - Output a single, professional sentence.`
                        },
                        {
                            type: "image",
                            image: screenshotUrls[0] // This is the single Collage Base64
                        }
                    ],
                },
            ],
        });

        return new Response(JSON.stringify({ inferredIntent: text.trim().replace(/^"|"$/g, '') }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Supervise API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}