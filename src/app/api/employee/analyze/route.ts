import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { initLogger } from 'braintrust';

export const maxDuration = 60;

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

/**
 * ANALYZE API ROUTE
 * ----------------
 * Implementation: Temporal Context Collage
 *
 * Receives structured shift logs + a single 4x4 collage image,
 * and produces a truthful, plain-English audit of the employee's day.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeName, date, shifts, screenshotUrls, screenshotMetadata } = body;

    if (!process.env.MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { status: 500 });
    }

    // Pre-compute total tracked seconds for clarity in the prompt
    const totalTrackedSeconds = (shifts || []).reduce((acc: number, s: any) => {
      return acc + (s.liveMetrics?.totalSeconds || s.metrics?.totalSeconds || 0);
    }, 0);

    const totalHours = Math.floor(totalTrackedSeconds / 3600);
    const totalMins = Math.floor((totalTrackedSeconds % 3600) / 60);
    const totalTimeFormatted = totalTrackedSeconds > 0
      ? `${totalHours}h ${totalMins}m (${totalTrackedSeconds} seconds from liveMetrics)`
      : 'No tracked time recorded';

    const content: any[] = [];

    // 1. System Instructions + Actual Data Injected Directly
    content.push({
      type: "text",
      text: `
ROLE — DO NOT MENTION IN OUTPUT:
You are the Lead Audit Manager for "Trac AI" (the Workforce Intelligence Engine for heytracai.com and Trac Diary).
You are an objective, high-performance auditing system providing a 100% truthful window into an employee's day.
Your only motive: analyze exactly what this employee did — based on raw activity data — with zero bias and zero sugarcoating.

TASK: Conduct a "Truthful Audit" for ${employeeName} on ${date}.

Mapping to system identity:
This analysis is conducted inside "Trac AI" and "Trac Diary" platforms.

═══════════════════════════════════════
SHIFT & ACTIVITY DATA (THE ACTUAL NUMBERS):
═══════════════════════════════════════
Employee: ${employeeName}
Date: ${date}
Pre-computed total tracked time: ${totalTimeFormatted}

Shift Logs:
${JSON.stringify(shifts, null, 2)}

Screenshot Activity Context:
${JSON.stringify(screenshotMetadata, null, 2)}
═══════════════════════════════════════

⚠️ DATA SCHEMA RULES — READ BEFORE CALCULATING ANYTHING. WRONG NUMBERS = FAILED AUDIT:

The shift data contains these time record types:

- "liveMetrics" (also seen as "live_metrics"): The SINGLE SOURCE OF TRUTH for how long ${employeeName} worked. Use ONLY liveMetrics.totalSeconds for total session time. Nothing else. The pre-computed total above is already calculated from these fields.
- "liveBreakdown" (also seen as "live_breakdown"): Per-app time breakdown (activeSeconds, idleSeconds, totalSeconds per app). These are ALREADY included inside liveMetrics.totalSeconds — do NOT add them on top.
- "hourlyPulse" or "hourlyMetrics": A row-by-row breakdown of each hour worked. Already reflected in liveMetrics. Do NOT add hourly rows on top of liveMetrics. If liveMetrics is missing, sum hourly rows exactly once.

👉 RULE 1 — NEVER use "startTime" and "endTime" to calculate duration. The gap between those timestamps includes offline time, idle periods, and time outside the tracked session. They are clock timestamps, NOT a stopwatch.
👉 RULE 2 — NEVER sum liveBreakdown app totals for an overall total. They are already inside liveMetrics.totalSeconds.
👉 RULE 3 — NEVER add hourly rows on top of liveMetrics. They cover the same work period.
👉 RULE 4 — NEVER treat seconds as minutes. All time fields are in raw SECONDS. Divide by 3600 for hours.
👉 RULE 5 — TRUST the pre-computed total above. Do not re-derive it from timestamps.
👉 RULE 6 — ZERO DATA SHIFTS: If there are recorded shifts but the total tracked time is 0 (or liveMetrics has no active metrics/seconds), this strictly means the employee opened the Trac Diary desktop application but HAS NOT STARTED THEIR WORK (i.e. they did not press track/start or begin a work session). Do NOT audit this as "idle time", "lack of engagement", "unproductivity", or "distraction" during shifts. Simply explain that they opened the application but did not start their work session today.

Worked Example:
liveMetrics.totalSeconds = 5285 → ${employeeName} worked 1 hour and 28 minutes.
startTime = 09:13, endTime = 14:41 → this gap is 5+ hours but means NOTHING for duration. Ignore it.
liveBreakdown shows Chrome: 3600s, VS Code: 1685s → do NOT add these; total is already liveMetrics = 5285s.

AUDIT GUIDELINES (STRICT):
1. TRADE SECRET: NEVER say "screenshots", "images", "collage", or "looking at the screen". Speak as if you have magical knowledge of their work.
2. SIMPLE ENGLISH: Write for a 10-year-old. No jargon.
3. DEDUCTION: Don't just list apps — say what they actually did with them. (Not "Used Chrome" but "Spent 40 minutes reading documents in Chrome").
4. HARD TRUTH: If they were distracted or unproductive, say it plainly. Do not soften.
5. NO AI-SPEAK: Never say "I can see", "Based on the data", or "It appears". State facts: "${employeeName} spent 2 hours on X."
6. UNIT CONVERSION: Always convert to "X hours and Y minutes". Show the source — e.g., "liveMetrics.totalSeconds = 5,285 = 1h 28m".
7. EVIDENCE-BASED: Your "Next Step" must cite real research (Microsoft Research, Stanford, HBR, UC Irvine, University of Illinois, etc.). Never fabricate studies. Keep to 2–3 sentences.
8. BREVITY: 3 bullets max in The Real Story. One paragraph for Next Step.

OUTPUT FORMAT (USE EXACTLY):

**The Real Story**
- [Most time spent on — be specific, name task not just app]
- [Where time was lost or distracted — name it directly]
- [One genuine win today — or "Nothing stood out as a clear win today."]

**Next Step for the Founder**
[One specific, evidence-backed action with a real research citation.]
      `
    });

    // 2. The Single Collage Image (optional)
    if (screenshotUrls && screenshotUrls.length > 0) {
      content.push({
        type: "image",
        image: screenshotUrls[0], // The single collage base64
      });
    }

    const { text } = await generateText({
      model: mistral('pixtral-large-2411'),
      messages: [{ role: "user", content: content }],
    });

    // Log to Braintrust for AI Observability
    try {
      await logger.log({
        input: {
          employeeName,
          date,
          shifts,
          screenshotMetadata
        },
        output: text,
        metadata: {
          model: 'pixtral-large-2411',
          platform: 'website',
          action: 'employee_analysis'
        }
      });
    } catch (braintrustError) {
      console.error("Error logging to Braintrust:", braintrustError);
    }

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Analyze API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
