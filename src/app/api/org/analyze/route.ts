import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { initLogger } from 'braintrust';

export const maxDuration = 60;

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgData, date, orgName } = body;

    if (!process.env.MISTRAL_API_KEY) {
      return new Response('Mistral API Key is not set', { status: 500 });
    }

    // Pre-compute per-employee totals to prevent AI from doing math from timestamps
    const computedSummary = (orgData || []).map((emp: any) => {
      const totalSeconds = (emp.shifts || []).reduce((acc: number, s: any) => {
        return acc + (s.liveMetrics?.totalSeconds || s.metrics?.totalSeconds || 0);
      }, 0);
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      return {
        name: emp.name,
        trackedTimeFormatted: totalSeconds > 0 ? `${hours}h ${mins}m (${totalSeconds}s from liveMetrics)` : 'No tracked time',
        trackedSeconds: totalSeconds,
      };
    });

    const totalOrgSeconds = computedSummary.reduce((acc: number, e: any) => acc + e.trackedSeconds, 0);
    const orgHours = Math.floor(totalOrgSeconds / 3600);
    const orgMins = Math.floor((totalOrgSeconds % 3600) / 60);

    const prompt = `
CONTEXT — DO NOT MENTION IN OUTPUT:
You are the organizational analysis engine for "Trac AI" — a premier employee productivity monitoring platform.
You are reporting directly to the Founder of ${orgName || "the Organization"}.
Explain in very simple, plain English (like you are talking to a 5th grader) exactly what the team did today.
Do NOT mention "Trac Diary", "Trac AI", or your role as a monitoring system in your response.

═══════════════════════════════════════
PRE-COMPUTED TOTALS (USE THESE — DO NOT RE-DERIVE FROM TIMESTAMPS):
═══════════════════════════════════════
Organization: ${orgName || 'The Organization'}
Date: ${date}
Total team tracked time: ${orgHours}h ${orgMins}m (${totalOrgSeconds} seconds)

Per-employee tracked time:
${computedSummary.map((e: any) => `  - ${e.name}: ${e.trackedTimeFormatted}`).join('\n')}
═══════════════════════════════════════

Full Organization Data (JSON):
${JSON.stringify(orgData, null, 2)}

⚠️ DATA SCHEMA RULES — READ BEFORE CALCULATING ANYTHING. WRONG NUMBERS = FAILED AUDIT:

The data contains these time record types per employee:

- "liveMetrics": The SINGLE SOURCE OF TRUTH for how long each employee worked. Use ONLY liveMetrics.totalSeconds. Nothing else. The pre-computed totals above are already calculated from these fields — trust them.
- "liveBreakdown": Per-app time breakdown (activeSeconds, idleSeconds, totalSeconds per app). These are ALREADY included inside liveMetrics.totalSeconds — do NOT add them on top.
- "hourlyPulse": A row-by-row hourly breakdown of the exact same data. Do NOT add hourly rows on top of liveMetrics or liveBreakdown. They are identical datasets.

👉 RULE 1 — NEVER use "startTime" or "endTime" (or their Local equivalents) to calculate how long someone worked. Those timestamps include offline time, idle periods, and breaks. They are clock timestamps, NOT a stopwatch. You may mention their local timezone.
👉 RULE 2 — NEVER add liveBreakdown app totals together for an overall total. They are already inside liveMetrics.totalSeconds.
👉 RULE 3 — NEVER add hourlyPulse rows on top of liveMetrics. If you add hourlyPulse to liveMetrics, you will artificially double the employee's tracked time. NEVER DO THIS.
👉 RULE 4 — NEVER treat seconds as minutes. All time fields are in raw SECONDS. Divide by 3600 for hours.
👉 RULE 5 — TRUST the pre-computed totals at the top. Do not re-derive them from startTime/endTime.

Worked Example:
liveMetrics.totalSeconds = 5285 → employee worked 1 hour and 28 minutes.
startTime = 09:13, endTime = 14:41 → this gap is 5+ hours and means NOTHING for duration. Ignore it.
liveBreakdown shows Chrome: 2000s, Slack: 3285s → total is still 5285s (liveMetrics), NOT 5285 + 2000 + 3285.

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

    // Log to Braintrust for AI Observability
    try {
      await logger.log({
        input: { orgData, date, orgName },
        output: text,
        metadata: {
          model: 'mistral-small-2506',
          platform: 'website',
          action: 'org_analysis'
        }
      });
    } catch (braintrustError) {
      console.error("Error logging to Braintrust:", braintrustError);
    }

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
