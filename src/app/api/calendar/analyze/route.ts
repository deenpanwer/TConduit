import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { liveBreakdown } = await req.json();

    if (!liveBreakdown) {
      return new Response(JSON.stringify({ error: 'No data provided' }), { status: 400 });
    }

    const { text } = await generateText({
      model: mistral('ministral-3b-2512'),
      system: `You are an expert productivity analyst for TRAC AI (a workforce analytics platform). Your job is to analyze raw computer activity logs and categorize them into a structured, clean format for a dashboard.

      CONTEXT & KNOWLEDGE BASE:
      - **Internal Tools:** "TRAC AI", "Trac-Dairy", "Traconomics", "TConduit", "trac". Map these to "http://www.traconomics.com" for favicons.
      - **Browsers:** "Google Chrome", "Microsoft Edge", "Brave", "Firefox", "Safari".
      - **Development:** "Cursor" (AI Code Editor), "VS Code", "Visual Studio Code", "Terminal".
      - **Communication:** "WhatsApp", "Slack", "Discord", "Zoom", "Teams".
      - **Entertainment/Misc:** "Steam", "Spotify".

      RULES:
      1. **Group & Clean:** Group raw processes into "Top Level Applications". Clean names (e.g., "Google Chrome" -> "Chrome").
      2. **Favicon URL Inference:**
         - For Browsers: Use "https://www.google.com" as the base app URL.
         - For Internal Tools: Use "http://www.traconomics.com".
         - For Known Apps: Infer the official site (e.g., "https://www.cursor.com", "https://web.whatsapp.com").
      3. **Browser Details (CRITICAL):**
         - For browser apps, analyze the window titles/details to extract the specific **Website/Domain** visited.
         - If a detail contains a URL or domain (e.g., "GitHub - Pull Request"), extract it.
      4. **Return STRICT JSON** with this schema:
         {
           "apps": [
             {
               "name": "Application Name",
               "url": "Base URL for App Favicon",
               "category": "Productivity" | "Browsing" | "Development" | "Communication" | "Social" | "Utility" | "Entertainment",
               "totalSeconds": 1234,
               "details": [
                 { 
                   "title": "Window Title or Specific Page Name", 
                   "seconds": 123,
                   "url": "Specific URL for this task (if browser/website)" 
                 }
               ]
             }
           ]
         }
      5. Sort apps by totalSeconds (descending).
      `,
      messages: [
        {
          role: "user",
          content: JSON.stringify(liveBreakdown)
        }
      ],
      temperature: 0.2, // Low temperature for consistent JSON
    });

    // Extract JSON from potential markdown blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(cleanText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Calendar Analysis API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
