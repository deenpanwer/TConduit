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
} else {
  console.warn("VAPID details are missing. Push notifications will be disabled for this cron job.");
}

// --- Helper Functions ---

/**
 * Generates a concise summary of team activity using an AI model.
 * Replicates the logic from /api/org/analyze
 */
async function generateActivitySummary(orgData: any, orgName: string): Promise<string> {
  const prompt = `
  CONTEXT (DO NOT MENTION IN OUTPUT): 
  You are the organizational analysis engine for "Trac Diary", a premier employee productivity monitoring system.
  The Founder uses Trac Diary to gain crystal-clear visibility into collective team output.
  Do not mention "Trac Diary" or your role as a monitoring system in your response. 

  You are sending a daily summary push notification to the Founder of ${orgName}.
  Explain in 1-2 very short, plain English bullet points what the team did today.

  Organization Data (JSON):
  ${JSON.stringify(orgData, null, 2)}

  CRITICAL INSTRUCTIONS:
  1. BE EXTREMELY SHORT: Aim for a total of 15-20 words max. This is for a push notification.
  2. PLAIN & DIRECT: Use simple words. No business jargon.
  3. FOCUS ON HIGHLIGHTS: What is the single most important thing the founder should know?
  4. NO AI FLUFF: Just the facts. Be direct and honest.

  EXAMPLE FORMAT:
  - Team focused on R&D for 3 hours.
  - John spent 2 hours on the new website design.
  `;

  try {
    const { text } = await generateText({
      model: mistral('mistral-small-2506'),
      prompt: prompt,
    });
    return text.replace(/\n/g, " ").trim();
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return "Couldn't generate a summary for today's activity.";
  }
}

/**
 * Sends a push notification to a user.
 */
async function sendPushNotification(subscription: any, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error: any) {
    console.error("Push notification send error:", error.statusCode);
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription is no longer valid, should be removed.
      return { success: false, error: "Subscription expired." };
    }
    return { success: false, error: error.message };
  }
}


// --- Main API Route ---

export async function GET(req: Request) {
  // Temporarily disabled for testing of the single-org route.
  return NextResponse.json(
    { message: "The daily-summary cron job is temporarily disabled." },
    { status: 503, statusText: "Service Unavailable" }
  );

  // 1. Secure the endpoint
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }

  try {
    // 2. Fetch all organizations
    const orgsSnap = await adminDb.collection("organizations").get();
    if (orgsSnap.empty) {
      return NextResponse.json({ message: "No organizations found." });
    }

    const processedOrgs = [];

    // 3. Process each organization
    for (const orgDoc of orgsSnap.docs) {
      const orgData = orgDoc.data();
      const orgId = orgDoc.id;
      const orgName = orgData.name || "the company";

      // Find the owner of the organization
      const ownerSnap = await adminDb.collection("users").where("ownedOrgId", "==", orgId).limit(1).get();
      if (ownerSnap.empty) {
        processedOrgs.push({ orgId, orgName, status: "Skipped", reason: "No owner found." });
        continue;
      }
      
      const owner = ownerSnap.docs[0].data();
      const ownerId = ownerSnap.docs[0].id;
      
      // Ensure owner has push subscriptions
      if (!owner.pushSubscriptions || owner.pushSubscriptions.length === 0) {
        processedOrgs.push({ orgId, orgName, status: "Skipped", reason: "Owner has no push subscriptions." });
        continue;
      }

      // We need to gather the org's employee data to generate a summary
      // This is a placeholder for the actual data structure your /analyze route expects
      const staffSnap = await adminDb.collection("users").where("orgId", "==", orgId).get();
      const staffData = staffSnap.docs.map(doc => doc.data());
      
      const analysisPayload = {
          employees: staffData.map(s => ({
              name: s.name,
              // This is a simplified example. You should populate this with
              // the actual productivity data needed for the AI summary.
              tasksCompleted: s.tasksCompleted || 0, 
              timeTracked: s.timeTracked || 0,
          }))
      };

      // 4. Generate AI Summary
      const summaryText = await generateActivitySummary(analysisPayload, orgName);
      
      // 5. Send Notification
      const notificationPayload = JSON.stringify({
        title: `Your Team's Daily Brief`,
        body: summaryText,
        data: { url: "/dashboard/tasks" } // Deep link to the dashboard
      });
      
      let notificationsSent = 0;
      for (const sub of owner.pushSubscriptions) {
        const result = await sendPushNotification(sub, notificationPayload);
        if (result.success) {
          notificationsSent++;
        }
        // Optional: Handle expired subscriptions by removing them from the user doc
      }
      
      processedOrgs.push({ orgId, orgName, ownerId, status: "Processed", summary: summaryText, notificationsSent });
    }

    return NextResponse.json({
      message: "Daily summary cron job completed.",
      results: processedOrgs,
    });

  } catch (error: any) {
    console.error("Cron Daily Summary Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
