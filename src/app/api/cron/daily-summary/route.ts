import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import webpush from "web-push";
import { initLogger } from 'braintrust';

export const maxDuration = 60; 

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

// --- Initialize Web Push ---
if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// --- Pushover Helper ---
const PUSHOVER_USER = 'up7a9283nbp36s1y58no8qrsmbxsbk';
const PUSHOVER_TOKEN = 'a6maptij9j7xkv2yrqbc6r98t69c3k';

async function sendPushoverAlert(title: string, message: string) {
  try {
    const truncatedMessage = message.length > 1024
      ? message.substring(0, 1020) + '\n...'
      : message;

    const res = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title,
        message: truncatedMessage,
        priority: '0',
        sound: 'pushover',
      })
    });

    if (!res.ok) {
      console.error('Pushover notification failed:', await res.text());
    }
  } catch (err) {
    console.error('Error sending Pushover alert:', err);
  }
}

// --- AI Summary Logic ---
async function generateActivitySummary(orgData: any, orgName: string): Promise<{ title: string; body: string }> {
  const prompt = `
  CONTEXT — DO NOT MENTION IN OUTPUT:
You are the notification engine for "Trac AI" (Trac AI / Trac Diary).
You are writing a push notification sent to the founder of ${orgName}.
Your only goal is to make them tap and open Trac right now.

Organization Data (JSON):
${JSON.stringify(orgData, null, 2)}

⚠️ DATA SCHEMA RULES — READ BEFORE CALCULATING ANYTHING:
The data has TWO time record types that cover the SAME work — do not add them together:
- "hourly_metrics": Hour-by-hour breakdown rows.
- "live_metrics": The already-summed daily total.
👉 Use ONLY "live_metrics" for totals. If only "hourly_metrics" exist, sum them once. Never double-count.

NOTIFICATION PSYCHOLOGY RULES (based on behavioral research):
1. OPEN WITH A NUMBER OR NAME: Notifications that lead with a specific stat or employee name get significantly higher open rates (Localytics, 2023). Pull one real, specific data point from the shift — e.g., "3 of your 5 employees..." or "Your team only hit 40% active time today..."
2. LEAVE THE GAP OPEN: Use the "curiosity gap" principle (Loewenstein, 1994) — reveal just enough to make them need to know the rest. Never give the full picture. Tease, don't tell.
3. NO GENERIC CTAs: "Visit dashboard" is ignored. End with a short, specific hook that implies something is waiting — e.g., "See who." or "Find out why." or "Check before EOD."
4. UNDER 15 WORDS TOTAL: Research on mobile push notifications shows open rates drop sharply above 10–15 words (CleverTap, 2022). Be ruthless with length.
5. NO JARGON, NO FLUFF: Write like a text from a trusted colleague, not a SaaS tool.
6. NO BRAND NAME IN BODY: Do not say "Trac AI" inside the notification text. The app name is already visible as the sender.

OUTPUT FORMAT:
Return a single, minified JSON object with two keys: "title" and "body". Do not add any extra text, characters, or markdown.
- "title" (string, max 5 words): [Specific, curiosity-triggering hook]
- "body" (string, max 10 words): [One data-grounded fact that leaves a gap + micro CTA]

Example of the RIGHT JSON output:
{"title":"One person carried today.","body":"The rest? You\'ll want to see this."}

Example of the WRONG JSON output (and wrong tone):
{"title":"Team Productivity Update","body":"Your team made progress today. Visit your Trac AI dashboard for full employee insights."}
  `;

  try {
    const { text } = await generateText({
      model: mistral('mistral-small-2506'),
      prompt: prompt,
    });
    
    // Log to Braintrust for AI Observability
    try {
      await logger.log({
        input: { orgData, orgName },
        output: text,
        metadata: {
          model: 'mistral-small-2506',
          platform: 'cron',
          action: 'daily_summary'
        }
      });
    } catch (braintrustError) {
      console.error("Error logging to Braintrust:", braintrustError);
    }

    // AI response should be a clean JSON string.
    try {
      const parsed = JSON.parse(text);
      if (parsed.title && parsed.body) {
        return { title: parsed.title, body: parsed.body };
      }
      throw new Error("Parsed JSON is missing 'title' or 'body' keys.");
    } catch (e: any) {
       console.error(`[AI Parse Error] Failed to parse JSON for ${orgName}. Error: ${e.message}. Raw AI Output:`, text);
       throw new Error(`JSON parsing failed: ${e.message}`);
    }
  } catch (error) {
    console.error(`[AI Error] Summary generation failed for ${orgName}:`, error);
    return { 
        title: `Activity Update for ${orgName}`,
        body: "New team activity recorded. Visit your dashboard for insights."
    };
  }
}


// --- Push Execution ---
async function sendPushNotification(subscription: any, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error: any) {
    // 410 (Gone) or 404 (Not Found) means the push token is no longer valid
    return { success: false, statusCode: error.statusCode };
  }
}

// --- Main API Route ---
export async function GET(req: Request) {
  const startTime = Date.now();
  console.log(`[Cron Triggered] Trac AI Sync - Start Time: ${new Date().toISOString()}`);

  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }
  const adminDb = admin.firestore();

  try {
    // 1. Fetch all organizations
    const orgsSnap = await adminDb.collection("organizations").get();
    const reports = [];

    // 2. Process each organization
    const now = new Date();
    for (const orgDoc of orgsSnap.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();
      const orgName = orgData.name || "the company";

      // Skip org if subscription or trial has expired
      const expiry = orgData.subscriptionExpiry?.toDate?.() || (orgData.subscriptionExpiry ? new Date(orgData.subscriptionExpiry) : null);
      if (expiry && expiry.getTime() < now.getTime()) {
        console.log(`[Cron Log] Skipped Org ${orgId} (${orgName}): Subscription/Trial expired.`);
        continue;
      }
      if (orgData.subscriptionStatus === "expired" || orgData.subscriptionStatus === "cancelled") {
        console.log(`[Cron Log] Skipped Org ${orgId} (${orgName}): Subscription cancelled/expired.`);
        continue;
      }

      // A. Find the owner to get their push subscriptions
      const ownerSnap = await adminDb.collection("users").where("ownedOrgId", "==", orgId).limit(1).get();
      if (ownerSnap.empty) {
        console.log(`[Cron Log] Skipped ${orgName}: No owner found.`);
        continue;
      }
      
      const ownerDoc = ownerSnap.docs[0];
      const ownerData = ownerDoc.data();
      const subscriptions = ownerData.pushSubscriptions || [];
      
      if (subscriptions.length === 0) {
        console.log(`[Cron Log] Skipped ${orgName}: No push subscriptions for ${ownerData.email}`);
        continue;
      }

      // B. Fetch Staff and their LATEST shifts
      const staffSnap = await adminDb.collection("users").where("orgId", "==", orgId).get();
      
      const activityPayload = await Promise.all(staffSnap.docs.map(async (doc) => {
        const employee = doc.data();
        const shiftsRef = adminDb.collection("users").doc(doc.id).collection("workShifts");
        
        const shiftsSnap = await shiftsRef
          .orderBy('startTime', 'desc')
          .limit(1)
          .get();
          
        return {
          employeeName: employee.name,
          latestShift: shiftsSnap.docs.map(s => s.data())[0] || null
        };
      }));

      // Filter out employees without active shifts
      const activeActivity = activityPayload.filter(a => a.latestShift !== null);

      if (activeActivity.length === 0) {
        console.log(`[Cron Log] Skipped ${orgName}: No active shifts found in latest data.`);
        continue;
      }

      // --- LOGGING DATA SENT TO AI ---
      console.log(`[AI Payload Debug] Sending JSON for ${orgName}:`, JSON.stringify(activeActivity));

      // C. Generate AI Summary with Trac AI Context
      const summary = await generateActivitySummary(activeActivity, orgName);
      
      // D. Prepare and Send Notification
      const notificationPayload = JSON.stringify({
        title: summary.title,
        body: summary.body,
        data: { url: "/dashboard" }
      });
      
      let sentCount = 0;
      let expiredSubs: any[] = [];

      for (const sub of subscriptions) {
        const result = await sendPushNotification(sub, notificationPayload);
        if (result.success) {
          sentCount++;
        } else if (result.statusCode === 410 || result.statusCode === 404) {
          expiredSubs.push(sub);
        }
      }

      // E. Production Cleanup: Remove dead subscriptions from user doc
      if (expiredSubs.length > 0) {
        const updatedSubs = subscriptions.filter((s: any) => !expiredSubs.includes(s));
        await adminDb.collection("users").doc(ownerDoc.id).update({ 
          pushSubscriptions: updatedSubs 
        });
        console.log(`[Cleanup] Removed ${expiredSubs.length} dead tokens for user ${ownerData.email}`);
      }
      
      reports.push({
        orgName,
        recipient: ownerData.email,
        summary: summary,
        notificationsSent: sentCount,
        dataSentToAI: activeActivity // Log the shifts data in the final API response
      });

      // F. Send Pushover Alert to Team with full details
      try {
        let pushMsg = `📊 ORG: ${orgName} (${orgId})\n`;
        pushMsg += `👤 OWNER: ${ownerData.name || ownerData.displayName || 'N/A'} (${ownerData.email || 'N/A'})\n`;
        pushMsg += `📱 SUBSCRIPTIONS: ${subscriptions.length} total, ${sentCount} delivered, ${expiredSubs.length} expired\n\n`;

        pushMsg += `🤖 AI NOTIFICATION SENT:\n`;
        pushMsg += `• Title: "${summary.title}"\n`;
        pushMsg += `• Body: "${summary.body}"\n\n`;

        pushMsg += `📋 SHIFT DATA (${activeActivity.length} employees):\n`;
        for (const emp of activeActivity.slice(0, 8)) {
          const shift = emp.latestShift;
          const hrs = shift?.liveMetrics?.totalSeconds ? (shift.liveMetrics.totalSeconds / 3600).toFixed(1) : '0';
          const active = shift?.liveMetrics?.activePercentage ? `${Math.round(shift.liveMetrics.activePercentage)}%` : 'N/A';
          pushMsg += `• ${emp.employeeName}: ${hrs}h (${active} active)\n`;
        }
        if (activeActivity.length > 8) {
          pushMsg += `  ...+${activeActivity.length - 8} more\n`;
        }

        await sendPushoverAlert(`🔔 Daily Summary → ${orgName}`, pushMsg);
      } catch (pushErr) {
        console.error('Pushover alert failed:', pushErr);
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Cron Finished] Processed ${reports.length} orgs in ${duration}s`);

    return NextResponse.json({
      message: "Trac AI Summary Sync complete.",
      duration: `${duration}s`,
      results: reports,
    });

  } catch (error: any) {
    console.error("Fatal Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
