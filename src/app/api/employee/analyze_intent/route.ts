import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { format, parseISO } from 'date-fns'; // For date parsing

export const maxDuration = 60;

// Helper to sort screenshots by timestamp and get the latest 3
function getLatestScreenshots(screenshotUrls: string[], screenshotMetadata: any[]): { url: string, metadata: any }[] {
    if (!screenshotUrls || !screenshotMetadata || screenshotUrls.length === 0 || screenshotMetadata.length === 0) {
        return [];
    }

    // Combine URLs and metadata, filter out blurred images
    const validScreenshots = screenshotUrls
        .map((url, index) => ({ url, metadata: screenshotMetadata[index] }))
        .filter(({ metadata }) => !(metadata && metadata.isBlurred === true));

    // Sort by timestamp, assuming metadata.timestamp is a Firestore Timestamp or ISO string
    validScreenshots.sort((a, b) => {
        const tsA = a.metadata?.timestamp?.toDate ? a.metadata.timestamp.toDate() : parseISO(a.metadata?.timestamp);
        const tsB = b.metadata?.timestamp?.toDate ? b.metadata.timestamp.toDate() : parseISO(b.metadata?.timestamp);

        if (!tsA || !tsB) return 0; // Cannot compare if timestamps are invalid

        return tsB.getTime() - tsA.getTime(); // Descending order (latest first)
    });

    return validScreenshots.slice(0, 3); // Return the top 3
}


export async function POST(req: Request) {
    console.log("Analyze Intent API: Request received");
    try {
        const body = await req.json();
        const { employeeName, date, shifts, screenshotUrls, screenshotMetadata } = body;
        
        console.log(`Analyze Intent API: Analyzing intent for ${employeeName} on ${date}. Shifts: ${shifts?.length}, Screenshots: ${screenshotUrls?.length}`);

        if (!process.env.MISTRAL_API_KEY) {
            console.error("Analyze Intent API: Mistral API Key is missing");
            return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        console.log("Analyze Intent API: MISTRAL_API_KEY present.");

        // Get the latest 3 valid screenshots
        const latestScreenshots = getLatestScreenshots(screenshotUrls, screenshotMetadata);
        
        if (latestScreenshots.length === 0) {
            console.warn("Analyze Intent API: No valid screenshots found to analyze intent.");
            // Depending on desired behavior, might return an empty result or a message
            return new Response(JSON.stringify({ inferredIntent: "No recent activity data available to infer intent." }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const content: any[] = [];

        // Add text prompt for AI role and goal
        content.push({
            type: "text",
            text: `
                CONTEXT: You are an AI assistant for "Trac Diary", a productivity analysis tool.
                Your goal is to infer the specific intent and actions of an employee based on recent activity.
                Analyze the provided screenshots and activity data to answer the question: "What is ${employeeName} trying to accomplish right now?"
                
                CRITICAL INSTRUCTIONS:
                1. BE SPECIFIC: Instead of general statements like "working on Chrome", infer specific actions like "fixing a bug on the login page", "researching marketing strategies for Q4", "collaborating on a design mock-up", "debugging a new feature rollout", or "onboarding a new client".
                2. INFER INTENT: Focus on the *purpose* behind the actions. What is the likely goal of the activity observed?
                3. PRIORITIZE RECENT ACTIVITY: Base your analysis primarily on the latest 3 screenshots provided.
                4. CONCISE OUTPUT: Provide a single, clear sentence summarizing the inferred intent.
                5. FACTUAL BASIS: Your inference must be directly supported by the visual and contextual data. If unsure, state that intent cannot be precisely determined.
                6. IGNORE SCORES: Do not mention or rely on any numerical productivity scores.
            `
        });

        // Add the latest 3 screenshots as image inputs
        latestScreenshots.forEach(({ url, metadata }) => {
            content.push({
                type: "image",
                image: url
            });
        });

        // Add shift data and screenshot metadata as text for context
        content.push({
            type: "text",
            text: `
                WORK SHIFT DATA (JSON):
                ${JSON.stringify(shifts, null, 2)}

                SCREENSHOT METADATA (JSON - provides context about activity during screenshots):
                ${JSON.stringify(screenshotMetadata, null, 2)}
            `
        });
        
        console.log("Analyze Intent API: Sending prompt to Mistral for intent inference...");
        const { text } = await generateText({
            model: mistral('pixtral-large-2411'), // Using the same model as the other route
            messages: [{ role: "user", content: content }],
        });
        console.log("Analyze Intent API: Received response from Mistral");

        return new Response(JSON.stringify({ inferredIntent: text.trim() }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Analyze Intent API Error:', error);
        let statusCode = 500;
        let errorMessage = error.message;

        if (error.message && (error.message.includes("Unauthorized") || error.message.includes("api key"))) {
            statusCode = 401;
            errorMessage = "AI Provider Authorization Failed. Please check your API key.";
        }

        return new Response(JSON.stringify({ error: errorMessage, stack: error.stack }), { 
            status: statusCode,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
