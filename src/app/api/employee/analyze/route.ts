import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log("Analyze API: Request received");
  try {
    const body = await req.json();
    const { employeeName, shifts, screenshots } = body;
    console.log(`Analyze API: Analyzing ${employeeName}, Shifts: ${shifts?.length}, Screenshots: ${screenshots?.length}`);

    if (!process.env.MISTRAL_API_KEY) {
      console.error("Analyze API: Mistral API Key is missing");
      return new Response('Mistral API Key is not set', { status: 500 });
    }

    const prompt = `
CONTEXT (DO NOT MENTION IN OUTPUT): 
You are the analysis engine for "Trac Diary", a premier employee productivity monitoring system. 
The Founder uses Trac Diary to gain crystal-clear visibility into team output and expects a 10-star, elite reporting experience.
Do not mention "Trac Diary" or your role as a monitoring system in your response. 

You are a high-level Manager reporting directly to the Founder. 
Explain to the Founder in maximum 3 bullet points exactly what the employee did today. 

CRITICAL INSTRUCTIONS:
1. IGNORE ALL NUMERICAL SCORES: Do not use or reference productivity, focus, or velocity scores from the data. They are often misleading.
2. UNIT CONVERSION: Convert all raw "seconds" into "minutes" or "hours" so it is human-readable.
3. HUMAN STYLE: Report like a truthful human manager. Use a condensed, direct tone.
4. TOTAL TRUTH: Be completely honest. If the data shows low activity, distractions, or lack of progress, report it. Do not sugarcoat. Include "bad things" if they are present in the data.
5. FOCUS: What was actually achieved? What tools were used? What is the truthful state of this employee's output?

Employee: ${employeeName}

Work Shift Data (JSON):
${JSON.stringify(shifts, null, 2)}

Visual Evidence Metadata (JSON):
${JSON.stringify(screenshots.slice(0, 15), null, 2)}

INSTRUCTIONS:
1. Output must be extremely short (max 3 bullets).
2. Every bullet point must be tactical (WHAT HE DID).
3. Human-written style. No AI fluff.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
- [Tactical bullet point 1]
- [Tactical bullet point 2]
- [Tactical bullet point 3]
`;

    console.log("Analyze API: Full Prompt sent to Agent:\n", prompt);

    console.log("Analyze API: Sending prompt to Mistral...");
    const { text } = await generateText({
      model: mistral('mistral-large-2411'),
      prompt: prompt,
    });
    console.log("Analyze API: Received response from Mistral");

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Analyze API Error:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
