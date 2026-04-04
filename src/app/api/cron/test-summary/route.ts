import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
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
  console.warn("VAPID details are missing. Push notifications will be disabled for this test route.");
}

// --- Helper Functions (copied from daily-summary) ---

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

async function sendPushNotification(subscription: any, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error: any) {
    console.error("Push notification send error:", error.statusCode);
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, error: "Subscription expired." };
    }
    return { success: false, error: error.message };
  }
}


// --- Main API Route for Testing a Single Org ---

export async function GET(req: Request) {
  console.log("[Cron Test Summary Debug] GET API route handler invoked.");
  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }
  const adminDb = admin.firestore();

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "Organization ID is missing." }, { status: 400 });
  }

  try {
    const orgDoc = await adminDb.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: `Organization with ID ${orgId} not found.` }, { status: 404 });
    }
    
    const orgData = orgDoc.data();
    const orgName = orgData?.name || "the company";

    const ownerSnap = await adminDb.collection("users").where("ownedOrgId", "==", orgId).limit(1).get();
    if (ownerSnap.empty) {
      return NextResponse.json({ error: `No owner found for organization ${orgId}.` }, { status: 404 });
    }
      
    const owner = ownerSnap.docs[0].data();
    const ownerId = ownerSnap.docs[0].id;
    
    if (!owner.pushSubscriptions || owner.pushSubscriptions.length === 0) {
      return NextResponse.json({
        message: "Test completed.",
        status: "Skipped",
        reason: "Owner has no push subscriptions.",
        ownerId: ownerId,
        orgId: orgId,
      });
    }

    const staffSnap = await adminDb.collection("users").where("orgId", "==", orgId).get();
    console.log(`[Cron Test Summary Debug] Found ${staffSnap.docs.length} staff members for orgId: ${orgId}`);
    staffSnap.docs.forEach(doc => {
      console.log(`  Staff ID: ${doc.id}, Name: ${doc.data().name}`);
    });
    
    // Fetch the single latest shift for each employee
    console.log(`[Cron Test Summary Debug] Querying for the latest shift for each employee.`);

    const analysisPayload = await Promise.all(staffSnap.docs.map(async (doc) => {
      const employee = doc.data();
      const employeeId = doc.id;
      
      console.log(`[Cron Test Summary Debug] Processing latest shift for employee ID: ${employeeId}, Name: ${employee.name}`);
      const shiftsRef = adminDb.collection("users").doc(employeeId).collection("workShifts");
      
      console.log(`[Cron Test Summary Debug] About to execute query for the latest shift for employee ${employeeId}.`);
      // Query for the single latest shift
      const shiftsSnap = await shiftsRef
        .orderBy('startTime', 'desc') // Order by startTime descending
        .limit(1) // Take only the latest one
        .get();
        
      console.log(`[Cron Test Summary Debug] Latest shift query executed for employee ${employeeId}. Found ${shiftsSnap.docs.length} shifts.`);
      
      // Extract shift data, will be empty if no shifts found
      const shifts = shiftsSnap.docs.map(shiftDoc => shiftDoc.data());
      
      return {
        employeeName: employee.name,
        shifts: shifts, // This will be an empty array if no shifts found, or an array with one shift
      };
    }));

    // Filter out employees if no shifts were found at all (even the latest one)
    const activeEmployeesPayload = analysisPayload.filter(e => e.shifts.length > 0);

    if (activeEmployeesPayload.length === 0) {
      return NextResponse.json({ 
        message: "Test completed.",
        status: "Skipped",
        reason: "No employees had any shifts found.", // Updated reason for clarity
        orgId: orgId,
      });
    }

    const summaryText = await generateActivitySummary(activeEmployeesPayload, orgName);
    
    const notificationPayload = JSON.stringify({
      title: "TEST: Your Team's Brief",
      body: summaryText,
                data: { url: "/tasks" }    });
    
    const sendResults = [];
    for (const sub of owner.pushSubscriptions) {
      const result = await sendPushNotification(sub, notificationPayload);
      sendResults.push(result);
    }
    
    return NextResponse.json({
      message: "Test summary notification sent.",
      status: "Processed",
      orgId: orgId,
      orgName: orgName,
      ownerId: ownerId,
      summary: summaryText,
      results: sendResults,
    });

  } catch (error: any) {
    console.error(`Cron Test Summary Error for org ${orgId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
