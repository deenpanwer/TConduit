import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { format } from "date-fns";
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export interface OrgIntel {
  orgName: string;
  founderName: string;
  totalHours: string;
  totalStaff: number;
  topPerformer: string;
  performanceIndex: string[];
  aiSummary: string | null;
  aiPayload: any;
}

async function generateAISummary(orgName: string, intel: any): Promise<string | null> {
  if (!process.env.MISTRAL_API_KEY) {
    console.warn("MISTRAL_API_KEY is not set. Skipping AI summary.");
    return null;
  }

  // SERVER-SIDE LOGGING: Full Raw Dump
  console.log("\n\n#########################################################");
  console.log(`[${new Date().toISOString()}] TRAC AI INTELLIGENCE PIPELINE - RAW DATA MODE`);
  console.log("ORGANIZATION:", orgName);
  console.log("FULL PAYLOAD BEING SENT TO MISTRAL LARGE:");
  console.log(JSON.stringify(intel, null, 2));
  console.log("#########################################################\n\n");

  const prompt = `
CONTEXT (DO NOT MENTION IN OUTPUT): 
You are the organizational analysis engine for "Trac / Trac Diary", an Electron-based employee monitoring system. 
You are reporting to the Founder of ${orgName || "the Organization"}. 
Explain in very simple, plain English (like you are talking to a 5-year-old) exactly what the team did today.

Organization Data (JSON):
${JSON.stringify(intel, null, 2)}

CRITICAL INSTRUCTIONS:
1. DATA SOURCE: You are receiving RAW workShift objects. These may vary in schema (Legacy vs Modern). Use your intelligence to parse the pulses, app breakdowns, and session data.
2. BE VERY SHORT: Use only 2 or 3 tiny bullet points. Each bullet should be a short snippet (1 sentence max).
3. PLAIN ENGLISH: Use very simple words. No business jargon. No "velocity", "anomaly", or "yield".
4. IDENTITY: "Trac" or "Trac Diary" in the logs is the monitoring software itself.
5. TELL THE TRUTH: Be 100% honest based on the raw metrics. If the team was lazy or worked on the wrong things, say so. 
6. NO AI FLUFF: Do not use robotic or flowery language. Just the facts.

FORMAT:
- [Snippet 1]
- [Snippet 2]
`;

  try {
    const { text } = await generateText({
      model: mistral('mistral-large-2411'),
      prompt: prompt,
    });
    return text;
  } catch (error) {
    console.error("AI Summary Generation Error:", error);
    return null;
  }
}

export async function generateOrgIntelligence(orgId: string, customDate?: string): Promise<OrgIntel> {
  const admin = getFirebaseAdmin();
  if (!admin) throw new Error("Firebase Admin initialization failed");
  const db = admin.firestore();
  
  const dateStr = customDate || format(new Date(), "yyyy-MM-dd");
  
  // 1. Fetch Org Info
  const orgDoc = await db.collection("organizations").doc(orgId).get();
  const orgData = orgDoc.data();
  
  // 2. Fetch all employees in this org
  const personnelSnap = await db.collection("users")
    .where("orgId", "==", orgId)
    .get();
  
  const personnel = personnelSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  let totalSecondsToday = 0;
  let topWorkScore = -1;
  let topWorkerName = "---";
  const perfIndex: string[] = [];
  const rawDataForAI: any[] = [];

  // 3. Aggregate Shifts for each employee
  for (const p of personnel as any[]) {
    const shiftSnap = await db.collection("users")
        .doc(p.id)
        .collection("workShifts")
        .where("__name__", ">=", dateStr)
        .where("__name__", "<=", dateStr + "\uf8ff")
        .get();
    
    let userSeconds = 0;
    const userAppBreakdown: Record<string, number> = {};
    const rawShifts: any[] = []; // Entire raw shift objects for AI

    shiftSnap.docs.forEach(d => {
      const s = d.data();
      const seconds = s.liveMetrics?.totalSeconds || 0;
      userSeconds += seconds;

      // Aggregating for Human Markdown
      if (s.liveBreakdown) {
        Object.entries(s.liveBreakdown).forEach(([app, data]) => {
            const secs = typeof data === 'number' ? data : (data as any)?.totalSeconds || 0;
            userAppBreakdown[app] = (userAppBreakdown[app] || 0) + secs;
        });
      }

      // Add entire raw shift to AI array
      rawShifts.push({
        id: d.id,
        ...s
      });
    });

    const totalHours = (userSeconds / 3600).toFixed(1);
    totalSecondsToday += userSeconds;

    const sortedApps = Object.entries(userAppBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, secs]) => `${name} (${(secs/3600).toFixed(1)}h)`);

    rawDataForAI.push({
      name: p.name,
      role: p.role,
      totalHours: totalHours,
      rawWorkShifts: rawShifts // SENDING EVERYTHING
    });

    if (userSeconds > topWorkScore) {
      topWorkScore = userSeconds;
      topWorkerName = p.name;
    }

    const roleStr = p.role ? ` [${p.role}]` : '';
    if (userSeconds > 0) {
        const appLines = sortedApps.map(app => `  - ${app}`).join('\n');
        perfIndex.push(`👤 ${p.name.split(' ')[0]}${roleStr} : ${totalHours} HRS\n${appLines}`);
    } else {
        perfIndex.push(`👤 ${p.name.split(' ')[0]}${roleStr} : ABSENT (No Data)`);
    }
  }

  if (totalSecondsToday === 0) {
    throw new Error("No work recorded for any employee on this date. Report generation cancelled.");
  }

  const aiPayload = {
    date: dateStr,
    employees: rawDataForAI
  };

  const aiSummary = await generateAISummary(orgData?.orgName || "Organization", aiPayload);

  return {
    orgName: orgData?.orgName || "Organization",
    founderName: orgData?.ownerName || "Founder",
    totalHours: (totalSecondsToday / 3600).toFixed(1),
    totalStaff: personnel.length,
    topPerformer: topWorkerName,
    performanceIndex: perfIndex,
    aiSummary,
    aiPayload
  };
}

export function formatMarkdownReport(intel: OrgIntel, dateStr?: string): string {
  const displayDate = dateStr ? format(new Date(dateStr), "MMM dd").toUpperCase() : format(new Date(), "MMM dd").toUpperCase();
  
  let body = `*TRAC DAILY REPORT // ${displayDate}*\n\n`;
  
  if (intel.aiSummary) {
    body += `📊 *TODAYS CEO SUMMARY:*
${intel.aiSummary}\n\n`;
  }

  body += `⚡ *TOTAL WORK DONE:* ${intel.totalHours} HRS\n`;
  body += `👥 *TOTAL STAFF:* ${intel.totalStaff}\n\n`;
  
  body += `*-- WHO DID WHAT TODAY --*\n`;
  if (intel.performanceIndex.length > 0) {
    body += intel.performanceIndex.join('\n') + '\n';
  } else {
    body += `No work recorded today.\n`;
  }
  
  body += `\n🏆 *BEST LEADER:* ${intel.topPerformer}\n`;

  body += `\nFor a more detailed audit visit: traconomics.com/dashboard`;

  return body;
}
