import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { parseISO } from 'date-fns';

export const maxDuration = 60;

/**
 * Sorts and cleans screenshots to prevent massive payload sizes.
 * Filters out blurred images and returns the top 3 latest valid screenshots.
 */
function getLatestScreenshots(screenshotUrls: string[], screenshotMetadata: any[]): { url: string, metadata: any }[] {
    if (!screenshotUrls || !screenshotMetadata || screenshotUrls.length === 0) {
        return [];
    }

    const validScreenshots = screenshotUrls
        .map((url, index) => ({ url, metadata: screenshotMetadata[index] }))
        .filter(({ metadata }) => metadata && !metadata.isBlurred);

    validScreenshots.sort((a, b) => {
        const getTs = (m: any) => {
            if (!m?.timestamp) return 0;
            // Handle Firestore Timestamps
            if (m.timestamp.toDate) return m.timestamp.toDate().getTime();
            // Handle ISO strings
            try {
                return parseISO(m.timestamp).getTime();
            } catch {
                return 0;
            }
        };
        return getTs(b.metadata) - getTs(a.metadata);
    });

    return validScreenshots.slice(0, 3);
}

export async function POST(req: Request) {
    // This log will appear in your terminal, not the browser console.
    console.log(">>> SUPERVISE API: POST request received");

    try {
        const body = await req.json();
        const { employeeName, date, screenshotUrls, screenshotMetadata } = body;

        if (!process.env.MISTRAL_API_KEY) {
            console.error("Supervise API: MISTRAL_API_KEY is missing from environment variables");
            return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const latestScreenshots = getLatestScreenshots(screenshotUrls, screenshotMetadata);
        
        if (latestScreenshots.length === 0) {
            return new Response(JSON.stringify({ inferredIntent: "No clear activity detected to analyze." }), { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Clean metadata: Extracting only text context to keep the request body slim
        const cleanContext = latestScreenshots.map(s => ({
            app: s.metadata?.activity?.name || "Unknown Application",
            title: s.metadata?.activity?.title || "No Window Title",
        }));

        const { text } = await generateText({
            model: mistral('pixtral-large-2411'),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze the activity of ${employeeName} on ${date}. 
                            Context: ${JSON.stringify(cleanContext)}.
                            Instruction: Write a single, concise sentence (max 15 words) describing their current work intent. 
                            Focus on the goal (e.g., "Reviewing financial spreadsheets" or "Coding a new feature").`
                        },
                        ...latestScreenshots.map(s => ({
                            type: "image" as const,
                            image: s.url
                        }))
                    ],
                },
            ],
        });

        console.log(">>> SUPERVISE API: Successfully generated intent");

        return new Response(JSON.stringify({ inferredIntent: text.trim() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Supervise API Error:', error);
        
        let statusCode = 500;
        let errorMessage = error.message || "An internal error occurred";

        if (errorMessage.includes("Unauthorized") || errorMessage.includes("api key")) {
            statusCode = 401;
            errorMessage = "AI Provider Authorization Failed. Check MISTRAL_API_KEY.";
        }

        return new Response(JSON.stringify({ error: errorMessage }), { 
            status: statusCode, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}