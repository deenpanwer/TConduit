import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * DAILY AI UPDATE CRON JOB
 * 
 * Logic:
 * 1. Fetch all trialing organizations with active time left.
 * 2. Calculate Metrics for "Today" (Task completion, CRM leads, EMS hours).
 * 3. Send WhatsApp Template: ai_manager_daily_update_v1 to the owner.
 */

async function executeUpdate() {
  const admin = getFirebaseAdmin();
  if (!admin) throw new Error("Firebase Admin failed to initialize");
  const db = admin.firestore();

  // 1. Define "Today" boundaries in PKT (UTC+5)
  const now = new Date();
  const pktOffset = 5 * 60 * 60 * 1000;
  const pktNow = new Date(now.getTime() + pktOffset);
  
  const startOfTodayPkt = new Date(pktNow);
  startOfTodayPkt.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC for queries
  const startOfTodayUtc = new Date(startOfTodayPkt.getTime() - pktOffset);
  const startOfTodayIso = startOfTodayUtc.toISOString();
  const startOfTodayTimestamp = admin.firestore.Timestamp.fromDate(startOfTodayUtc);

  console.log(`Cron execution started. PKT: ${pktNow.toISOString()}, Boundary UTC: ${startOfTodayUtc.toISOString()}`);

  // 2. Fetch all Active Trialing Organizations
  const orgsSnap = await db.collection("organizations")
    .where("subscriptionStatus", "==", "trialing")
    .get();

  const results: any[] = [];

  for (const orgDoc of orgsSnap.docs) {
    const orgData = orgDoc.data();
    const orgId = orgDoc.id;
    const expiry = orgData.subscriptionExpiry?.toDate?.() || new Date(orgData.subscriptionExpiry);

    // Skip if trial expired
    if (expiry < now) {
        console.log(`Skipping Org ${orgId} (${orgData.name}): Trial expired.`);
        continue;
    }

    // 3. Find Organization Owner for WhatsApp delivery
    const ownerQuery = await db.collection("users")
        .where("ownedOrgId", "==", orgId)
        .where("role", "in", ["owner", "Founder", "Manager", "Ops", "HR"])
        .limit(1)
        .get();

    if (ownerQuery.empty) continue;

    const ownerDoc = ownerQuery.docs[0];
    const ownerData = ownerDoc.data();
    const ownerWhatsapp = ownerData.whatsapp || ownerData.whatsAppNumber;

    if (!ownerWhatsapp) continue;

    // 4. Calculate Metrics with Hybrid Data Type Support (Robustness)
    
    // A. Tasks Done (Try Timestamp, fallback to String)
    const tasksRef = db.collection("organizations").doc(orgId).collection("tasks");
    let tasksDoneCount = 0;
    
    // Attempt 1: Timestamp Query
    const tasksTsSnap = await tasksRef
      .where("status", "==", "done")
      .where("updatedAt", ">=", startOfTodayTimestamp)
      .get();
    
    if (tasksTsSnap.size > 0) {
        tasksDoneCount = tasksTsSnap.size;
    } else {
        // Attempt 2: ISO String Query (Fallback)
        const tasksIsoSnap = await tasksRef
            .where("status", "==", "done")
            .where("updatedAt", ">=", startOfTodayIso)
            .get();
        tasksDoneCount = tasksIsoSnap.size;
    }

    // B. CRM Leads (Try Timestamp, fallback to String)
    const crmRef = db.collection("organizations").doc(orgId).collection("crm");
    let leadsCount = 0;

    const leadsTsSnap = await crmRef
      .where("type", "==", "lead")
      .where("createdAt", ">=", startOfTodayTimestamp)
      .get();
    
    if (leadsTsSnap.size > 0) {
        leadsCount = leadsTsSnap.size;
    } else {
        const leadsIsoSnap = await crmRef
            .where("type", "==", "lead")
            .where("createdAt", ">=", startOfTodayIso)
            .get();
        leadsCount = leadsIsoSnap.size;
    }

    // C. EMS Total Hours (ISO String startTime is the standard here)
    const [empSnap, manSnap] = await Promise.all([
        db.collection("users").where("orgId", "==", orgId).get(),
        db.collection("users").where("ownedOrgId", "==", orgId).get()
    ]);

    const userDocs = new Map();
    empSnap.forEach(d => userDocs.set(d.id, d));
    manSnap.forEach(d => userDocs.set(d.id, d));

    let totalSecondsToday = 0;
    for (const [uid, uDoc] of userDocs) {
        const shiftsSnap = await uDoc.ref.collection("workShifts")
            .where("startTime", ">=", startOfTodayIso)
            .get();
        
        shiftsSnap.forEach((s: any) => {
            const d = s.data();
            totalSecondsToday += (d.liveMetrics?.totalSeconds || 0);
        });
    }

    const totalHoursToday = (totalSecondsToday / 3600).toFixed(1);

    // 5. Send WhatsApp Template with Detailed Logging
    const cleanPhone = ownerWhatsapp.replace(/\+/g, '').replace(/\s/g, '');
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const metaPayload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: "ai_manager_daily_update_v1",
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: String(tasksDoneCount) },
                        { type: "text", text: String(leadsCount) },
                        { type: "text", text: String(totalHoursToday) }
                    ]
                }
            ]
        }
    };

    try {
        console.log(`Sending WhatsApp to ${cleanPhone} for Org: ${orgData.name}...`);
        console.log(`Payload:`, JSON.stringify(metaPayload, null, 2));

        const whatsappRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metaPayload)
        });

        const waStatus = await whatsappRes.json();
        console.log(`Meta Response:`, JSON.stringify(waStatus, null, 2));

        results.push({ 
            org: orgData.name, 
            metrics: { tasksDoneCount, leadsCount, totalHoursToday },
            waStatus 
        });

    } catch (waErr: any) {
        console.error(`WhatsApp delivery failed for org ${orgId}:`, waErr);
    }
  }

  return {
    success: true, 
    processedCount: results.length,
    details: results
  };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const result = await executeUpdate();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const result = await executeUpdate();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
