import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import webpush from "web-push";

/**
 * CONFIGURATION: Increase timeout to 60s for AI processing.
 * Essential for looping through multiple organizations and AI generation.
 */
export const maxDuration = 60; 

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
  /**
   * CONTEXT: Trac AI | Traconomics | Trac Diary | Trac Dairy
   * Branding injected to ensure AI understands the software's identity.
   */
  const prompt = `
  CONTEXT: 
  You are the organizational analyzer for "Trac AI" (also known as Traconomics, Trac Diary, or Trac Dairy). 
  Trac AI is an employee productivity monitoring system.
  You are sending a push notification to the founder of ${orgName}.

  GOAL:
  Based on the employee shift data, provide a 1-sentence summary of team progress and a call to action to visit the dashboard for more details.

  Organization Data (JSON):
  ${JSON.stringify(orgData, null, 2)}

  INSTRUCTIONS:
  1. BE EXTREMELY SHORT: Max 25 words total. 
  2. STRUCTURE: [Actionable Summary]. Visit your Trac AI dashboard for full employee insights.
  3. PLAIN ENGLISH: No jargon, just direct facts.
  4. BRANDING: Use the name "Trac AI" in the call to action.
  `;

  try {
    const { text } = await generateText({
      model: mistral('mistral-small-2506'),
      prompt: prompt,
    });
    return text.replace(/\n/g, " ").trim();
  } catch (error) {
    console.error(`[AI Error] Summary failed for ${orgName}:`, error);
    return "New team activity recorded. Visit your Trac AI dashboard for full productivity insights.";
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

  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }

  try {
    // 1. Fetch all organizations
    const orgsSnap = await adminDb.collection("organizations").get();
    const reports = [];

    // 2. Process each organization
    for (const orgDoc of orgsSnap.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();
      const orgName = orgData.name || "the company";

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
      const summaryText = await generateActivitySummary(activeActivity, orgName);
      
      // D. Prepare and Send Notification
      const notificationPayload = JSON.stringify({
        title: "Trac AI | Team Brief",
        body: summaryText,
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
        summary: summaryText,
        notificationsSent: sentCount,
        dataSentToAI: activeActivity // Log the shifts data in the final API response
      });
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
