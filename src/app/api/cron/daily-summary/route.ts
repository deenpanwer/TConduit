import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import webpush from "web-push";

// --- Initialize Web Push ---
if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// --- AI Summary Logic ---
async function generateActivitySummary(orgData: any, orgName: string): Promise<string> {
  const prompt = `
  CONTEXT: You are an organizational analyzer for the founder of ${orgName}.
  Analyze the following employee shift data and provide a 1-2 sentence summary of progress.
  
  Organization Data:
  ${JSON.stringify(orgData, null, 2)}

  INSTRUCTIONS:
  1. Max 20 words.
  2. Plain English.
  3. Focus on what was actually done in the latest shifts.
  4. No fluff.
  `;

  try {
    const { text } = await generateText({
      model: mistral('mistral-small-2506'),
      prompt: prompt,
    });
    return text.replace(/\n/g, " ").trim();
  } catch (error) {
    console.error(`[AI Error] Summary failed for ${orgName}:`, error);
    return "Team activity recorded. Check dashboard for details.";
  }
}

// --- Push Execution ---
async function sendPushNotification(subscription: any, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error: any) {
    // 410 (Gone) or 404 (Not Found) means the token is no longer valid
    return { success: false, statusCode: error.statusCode };
  }
}

// --- Main Cron Handler ---
export async function GET(req: Request) {
  const startTime = Date.now();
  console.log(`[Cron Job Started] 4-Hour Summary Sync: ${new Date().toISOString()}`);

  // 1. Security Check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!adminDb) return NextResponse.json({ error: "Firebase Not Ready" }, { status: 500 });

  try {
    const orgsSnap = await adminDb.collection("organizations").get();
    const reports = [];

    // 2. Iterate through Organizations
    for (const orgDoc of orgsSnap.docs) {
      const orgId = orgDoc.id;
      const orgName = orgDoc.data().name || "Company";

      // A. Identify Owner & Subscriptions
      const ownerSnap = await adminDb.collection("users").where("ownedOrgId", "==", orgId).limit(1).get();
      if (ownerSnap.empty) continue;

      const ownerDoc = ownerSnap.docs[0];
      const ownerData = ownerDoc.data();
      const subscriptions = ownerData.pushSubscriptions || [];

      if (subscriptions.length === 0) {
        console.log(`[Cron Log] Skipped ${orgName}: No subscriptions.`);
        continue;
      }

      // B. Fetch Employee Activity (Same logic as your test route)
      const staffSnap = await adminDb.collection("users").where("orgId", "==", orgId).get();
      
      const activityPayload = await Promise.all(staffSnap.docs.map(async (doc) => {
        const employee = doc.data();
        const shiftsSnap = await adminDb.collection("users").doc(doc.id)
          .collection("workShifts")
          .orderBy('startTime', 'desc')
          .limit(1)
          .get();

        return {
          employeeName: employee.name,
          latestShift: shiftsSnap.docs.map(s => s.data())[0] || null
        };
      }));

      const activeActivity = activityPayload.filter(a => a.latestShift !== null);

      if (activeActivity.length === 0) {
        console.log(`[Cron Log] Skipped ${orgName}: No recent activity.`);
        continue;
      }

      // C. Generate AI Summary
      const summaryText = await generateActivitySummary(activeActivity, orgName);

      // D. Dispatch Notifications
      const payload = JSON.stringify({
        title: "Team Update",
        body: summaryText,
        data: { url: "/dashboard" }
      });

      let sentCount = 0;
      let failedSubs: any[] = [];

      for (const sub of subscriptions) {
        const res = await sendPushNotification(sub, payload);
        if (res.success) sentCount++;
        else if (res.statusCode === 410 || res.statusCode === 404) {
            failedSubs.push(sub);
        }
      }

      // E. Cleanup Expired Subs (Production-level maintenance)
      if (failedSubs.length > 0) {
        const updatedSubs = subscriptions.filter((s: any) => !failedSubs.includes(s));
        await adminDb.collection("users").doc(ownerDoc.id).update({ pushSubscriptions: updatedSubs });
        console.log(`[Cron Log] Cleaned up ${failedSubs.length} expired subs for user ${ownerDoc.id}`);
      }

      reports.push({
        orgName,
        recipient: ownerData.email,
        summary: summaryText,
        notificationsSent: sentCount
      });
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Cron Job Finished] Processed ${reports.length} orgs in ${duration}s`);

    return NextResponse.json({
      status: "Success",
      processedCount: reports.length,
      details: reports
    });

  } catch (error: any) {
    console.error("[Cron Fatal Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
