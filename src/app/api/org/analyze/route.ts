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
CONTEXT — DO NOT MENTION IN OUTPUT:
You are the organizational analysis engine for "Trac Diary|traconomics.com|Trac Ai|Trac Dairy" (so these are our platforms the part of employee productivity adn monitoring system), a premier employee productivity monitoring system.
The Founder uses Trac Diary to gain crystal-clear visibility into collective team output and expects a 10-star, elite reporting experience.
Do not mention "Trac Diary" or your role as a monitoring system in your response.
You are reporting to the Founder of ${orgName || "the Organization"}.
Explain in very simple, plain English (like you are talking to a 5th grader) exactly what the team did today.

Organization Data (JSON):
${JSON.stringify(orgData, null, 2)}

⚠️ DATA SCHEMA RULES — READ BEFORE CALCULATING ANYTHING. WRONG NUMBERS = FAILED AUDIT:

The data contains these time record types per employee:

- "liveMetrics" (also seen as "live_metrics"): The SINGLE SOURCE OF TRUTH for how long an employee worked. Use ONLY liveMetrics.totalSeconds for total session time. Nothing else.
- "liveBreakdown" (also seen as "live_breakdown"): Per-app time breakdown (activeSeconds, idleSeconds, totalSeconds per app). These are already included inside liveMetrics.totalSeconds — do NOT add them on top.
- "hourlyMetrics" (also seen as "hourly_metrics"): A row-by-row breakdown of each individual hour worked. These are already reflected in liveMetrics. Do NOT add hourly rows on top of liveMetrics. If liveMetrics is missing, sum hourly rows exactly once.

👉 RULE 1 — NEVER use "startTime" and "endTime" to calculate how long someone worked. The gap between those timestamps includes offline time, system idle, and time outside the tracked session. They are clock timestamps, not a stopwatch. Ignore them for duration.
👉 RULE 2 — NEVER add liveBreakdown app totals together for an overall total. They are already inside liveMetrics.totalSeconds.
👉 RULE 3 — NEVER add hourlyMetrics rows on top of liveMetrics. They cover the same work.
👉 RULE 4 — NEVER treat seconds as minutes. All time fields are in raw seconds. Divide by 3600 for hours. Divide by 60 for minutes.

Worked Example:
liveMetrics.totalSeconds = 5285 → employee worked 1 hour and 28 minutes.
startTime = 02:13, endTime = 14:41 → this gap means NOTHING for duration. Ignore it.
hourlyMetrics shows 3 rows of 1 hour each + liveMetrics shows 3 hours → employee worked 3 hours, NOT 6.

CRITICAL INSTRUCTIONS:
1. BE VERY SHORT: Use only 2 or 3 short bullet points per section.
2. PLAIN ENGLISH: Use very simple words. No business jargon.
3. IGNORE SCORES: Do not look at or use any "scores" from the data.
4. EASY TIME: Convert all seconds into "X hours and Y minutes" before writing. Show the math source — e.g., "liveMetrics shows 5,285 seconds = 1 hour 28 minutes".
5. TELL THE TRUTH: Be 100% honest. If the team was distracted or unproductive, say so clearly. Mention both the good and the bad.
6. NO AI FLUFF: No robotic or flowery language. Just the facts. Never say "I can see", "Based on the data", or "It appears".
7. EVIDENCE-BASED SUGGESTION: Provide one specific, actionable suggestion for the Founder grounded in real, well-established research — e.g., studies on focus time, distraction recovery, task-switching costs, or optimal session length (sources: Microsoft Research, Harvard Business Review, Stanford, University of Illinois, CleverTap, etc.). Do NOT invent studies. If no action is needed, write "No action required — team is on track." Keep it to 2–3 sentences max.

FORMAT:

**Team Overview**
- [Short, honest point about what the team spent their time on today — name apps or tasks, not scores]
- [Any pattern across the team — good or bad — stated plainly]
- [Optional third point if there is something important that doesn't fit above]

**Suggested Action for the Founder**
[One specific, evidence-backed action. Briefly cite the research. E.g., "A University of Illinois study found that brief mental breaks every 90 minutes prevent focus decline — consider encouraging the team to step away briefly between long sessions."]
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
