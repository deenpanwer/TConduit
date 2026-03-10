import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log("Analyze API: Request received");
  try {
    const body = await req.json();
    const { employeeName, date, shifts, screenshotUrls, screenshotMetadata } = body;
    console.log(`Analyze API: Analyzing ${employeeName}, Shifts: ${shifts?.length}, Screenshot URLs: ${screenshotUrls?.length}`);

    if (!process.env.MISTRAL_API_KEY) {
      console.error("Analyze API: Mistral API Key is missing");
      return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    console.log("Analyze API: MISTRAL_API_KEY present, length:", process.env.MISTRAL_API_KEY.length);

    const content: any[] = [];

    // Add main text prompt
    content.push({
      type: "text",
      text: `
        CONTEXT: You are the analysis engine for "Trac Diary", a premier employee productivity monitoring system. 
        You are a high-level Manager reporting directly to the Founder. 
        Explain to the Founder in maximum 3 bullet points exactly what ${employeeName} did on ${date}. 
        
        CRITICAL INSTRUCTIONS:
        1. IGNORE ALL NUMERICAL SCORES: Do not use or reference productivity, focus, or velocity scores from the data.
        They are often misleading.
        2. UNIT CONVERSION: Convert all raw "seconds" into "minutes" or "hours" so it is human-readable.
        3. HUMAN STYLE: Report like a truthful human manager. Use a condensed, direct tone.
        4. TOTAL TRUTH: Be completely honest. If the data shows low activity, distractions, or lack of progress, report it.
        Do not sugarcoat. Include "bad things" if they are present in the data.
        5. FOCUS: What was actually achieved? What tools were used? What is the truthful state of this employee's output?
      `
    });

    // Add image URLs as multimodal inputs
    if (screenshotUrls && screenshotUrls.length > 0) {
      screenshotUrls.forEach((url: string) => {
        content.push({
          type: "image", // Correct type for ai-sdk
          image: url     // Correct key for ai-sdk, directly assigning URL
        });
      });
    }

    // Add shift data (including hourlyPulse) and screenshot metadata as text
    content.push({
      type: "text",
      text: `
        WORK SHIFT DATA (JSON):
        ${JSON.stringify(shifts, null, 2)}

        SCREENSHOT METADATA (JSON - provides context about activity during screenshots):
        ${JSON.stringify(screenshotMetadata, null, 2)}
      `
    });

    // Add prompt for Hourly Pulse Data separately
    content.push({
      type: "text",
      text: `
        HOURLY PULSE DATA (JSON - shows activity levels minute-by-minute if available in shift.hourlyPulse):
        (NOTE: This might be nested under 'shift.hourlyPulse')
      `
    });
    
    console.log("Analyze API: Sending prompt to Mistral...");
    const { text } = await generateText({
      model: mistral('pixtral-large-2411'),
      messages: [{ role: "user", content: content }],
    });
    console.log("Analyze API: Received response from Mistral");

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Analyze API Error:', error);
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
