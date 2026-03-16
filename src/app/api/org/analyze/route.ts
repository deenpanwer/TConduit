import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgData, date, orgName } = body;

    if (!process.env.MISTRAL_API_KEY) {
      return new Response('Mistral API Key is not set', { status: 500 });
    }

    const prompt = `
CONTEXT (DO NOT MENTION IN OUTPUT): 
You are the organizational analysis engine for "Trac Diary", a premier employee productivity monitoring system. 
The Founder uses Trac Diary to gain crystal-clear visibility into collective team output and expects a 10-star, elite reporting experience.
Do not mention "Trac Diary" or your role as a monitoring system in your response. 

You are reporting to the Founder of ${orgName || "the Organization"}. 
Explain in very simple, plain English (like you are talking to a 5th grader) exactly what the team did today.

Organization Data (JSON):
${JSON.stringify(orgData, null, 2)}

CRITICAL INSTRUCTIONS:
1. BE VERY SHORT: Use only 2 or 3 short bullet points.
2. PLAIN ENGLISH: Use very simple words that a kid would understand. No business jargon.
3. IGNORE SCORES: Do not look at or use any "scores" from the data.
4. EASY TIME: Change all "seconds" into "minutes" or "hours".
5. TELL THE TRUTH: Be 100% honest. If the team was lazy, distracted, or worked on the wrong things, say so. Mention both the good and the bad.
6. NO AI FLUFF: Do not use robotic or flowery language. Just the facts.
7. SUGGESTION: Based on your analysis, provide a concise suggested action for the Founder. If no action is warranted, state "No action required". This suggestion should be specific and actionable, e.g., "Suggest a team meeting to address X", or "Recommend a new tool for Y", or "No action required as team is on track".

FORMAT:
- [Short, simple point 1]
- [Short, simple point 2]
`;

    const { text } = await generateText({
      model: mistral('mistral-small-2506'),
      prompt: prompt,
    });

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Org Analyze API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
