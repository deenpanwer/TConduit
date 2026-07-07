import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * DAILY AI UPDATE CRON JOB
 * 
 * Logic:
 * 1. Fetch all trialing organizations with active time left.
 * 2. Calculate Metrics for "Today" (Task completion, CRM leads, EMS hours).
 *    - Tasks completed uses the new flagged/completedDate system from TasksContext.
 * 3. Send WhatsApp Template: ai_manager_daily_update_v1 to the owner.
 * 4. Send a Pushover notification to the team with full metadata + message details.
 */

// --- Pushover Helper ---
const PUSHOVER_USER = 'ugshfubjs4igoqvk1s16o6ycdskoqz';
const PUSHOVER_TOKEN = 'a1mhx6fgw5qmn3gebsbwi9a1d1wbo8';

async function sendPushoverAlert(title: string, message: string) {
  try {
    // Pushover has a 1024 char limit on message, truncate if needed
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

// --- Subtask flattener (mirrors TasksContext logic) ---
interface SubtaskData {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string;
  completedByName?: string;
  completedAt?: string;
  completedDate?: string;
  subtasks?: SubtaskData[];
  [key: string]: any;
}

function flattenSubtasks(subs: SubtaskData[]): SubtaskData[] {
  const result: SubtaskData[] = [];
  const traverse = (list: SubtaskData[]) => {
    list.forEach(item => {
      result.push(item);
      if (item.subtasks && item.subtasks.length > 0) {
        traverse(item.subtasks);
      }
    });
  };
  traverse(subs);
  return result;
}

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
  const todayDateStr = `${pktNow.getUTCFullYear()}-${String(pktNow.getUTCMonth() + 1).padStart(2, '0')}-${String(pktNow.getUTCDate()).padStart(2, '0')}`;
  const startOfTodayTimestamp = admin.firestore.Timestamp.fromDate(startOfTodayUtc);

  console.log(`Cron execution started. PKT: ${pktNow.toISOString()}, Boundary UTC: ${startOfTodayUtc.toISOString()}, Today: ${todayDateStr}`);

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

    // 4. Calculate Metrics — NEW SYSTEM using flagged + completedDate/completedAt

    // A. Tasks Completed Today (using the new TasksContext completion system)
    const tasksRef = db.collection("organizations").doc(orgId).collection("tasks");
    const allTasksSnap = await tasksRef.get();

    const completedTasksToday: { title: string; completedByName: string; completedAt: string }[] = [];
    const completedSubtasksToday: { taskTitle: string; subtaskTitle: string; completedByName: string; completedAt: string }[] = [];

    for (const taskDoc of allTasksSnap.docs) {
      const task = taskDoc.data();

      // Check parent task completion (flagged === true with completedDate matching today)
      if (task.flagged === true) {
        const taskCompletedToday = 
          (task.completedDate && task.completedDate === todayDateStr) ||
          (task.completedAt && task.completedAt >= startOfTodayIso);

        if (taskCompletedToday) {
          completedTasksToday.push({
            title: task.title || 'Untitled Task',
            completedByName: task.completedByName || 'Unknown',
            completedAt: task.completedAt || '',
          });
        }
      }

      // Check subtask completions (recursively)
      if (task.subtasks && Array.isArray(task.subtasks)) {
        const allSubs = flattenSubtasks(task.subtasks);
        for (const sub of allSubs) {
          if (sub.completed === true) {
            const subCompletedToday =
              (sub.completedDate && sub.completedDate === todayDateStr) ||
              (sub.completedAt && sub.completedAt >= startOfTodayIso);

            if (subCompletedToday) {
              completedSubtasksToday.push({
                taskTitle: task.title || 'Untitled Task',
                subtaskTitle: sub.title || 'Untitled Subtask',
                completedByName: sub.completedByName || 'Unknown',
                completedAt: sub.completedAt || '',
              });
            }
          }
        }
      }
    }

    const tasksDoneCount = completedTasksToday.length;

    // B. CRM Deals Created Today (Try Timestamp, fallback to String, with createdDate fallback)
    const crmRef = db.collection("organizations").doc(orgId).collection("crm_entities");
    let dealsCount = 0;

    const dealsTsSnap = await crmRef
      .where("type", "==", "deal")
      .where("createdAt", ">=", startOfTodayTimestamp)
      .get();
    
    if (dealsTsSnap.size > 0) {
        dealsCount = dealsTsSnap.size;
    } else {
        const dealsIsoSnap = await crmRef
            .where("type", "==", "deal")
            .where("createdAt", ">=", startOfTodayIso)
            .get();
        dealsCount = dealsIsoSnap.size;
    }

    if (dealsCount === 0) {
        const dealsDateSnap = await crmRef
            .where("type", "==", "deal")
            .where("createdDate", "==", todayDateStr)
            .get();
        dealsCount = dealsDateSnap.size;
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
    const cleanPhone = String(ownerWhatsapp).replace(/\+/g, '').replace(/\s/g, '');
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
                        { type: "text", text: String(dealsCount) },
                        { type: "text", text: String(totalHoursToday) }
                    ]
                }
            ]
        }
    };

    let waStatus: any = null;

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

        waStatus = await whatsappRes.json();
        console.log(`Meta Response:`, JSON.stringify(waStatus, null, 2));

        results.push({ 
            org: orgData.name, 
            metrics: { tasksDoneCount, dealsCount: dealsCount, totalHoursToday },
            completedTasksToday,
            completedSubtasksToday,
            waStatus 
        });

    } catch (waErr: any) {
        console.error(`WhatsApp delivery failed for org ${orgId}:`, waErr);
    }

    // 6. Send Pushover Alert to Team with full details
    try {
      let pushMsg = `📊 ORG: ${orgData.name} (${orgId})\n`;
      pushMsg += `👤 OWNER: ${ownerData.name || ownerData.displayName || 'N/A'} (${ownerData.email || 'N/A'})\n`;
      pushMsg += `📱 PHONE: ${cleanPhone}\n\n`;

      pushMsg += `📈 METRICS SENT:\n`;
      pushMsg += `• Tasks Done: ${tasksDoneCount}\n`;
      pushMsg += `• Subtasks Done: ${completedSubtasksToday.length}\n`;
      pushMsg += `• CRM Deals Created: ${dealsCount}\n`;
      pushMsg += `• EMS Hours: ${totalHoursToday}h\n\n`;

      if (completedTasksToday.length > 0) {
        pushMsg += `✅ TASKS COMPLETED:\n`;
        for (const t of completedTasksToday) {
          pushMsg += `• "${t.title}" by ${t.completedByName}\n`;
        }
        pushMsg += `\n`;
      }

      if (completedSubtasksToday.length > 0) {
        pushMsg += `✅ SUBTASKS COMPLETED:\n`;
        for (const s of completedSubtasksToday.slice(0, 10)) {
          pushMsg += `• "${s.subtaskTitle}" (${s.taskTitle}) by ${s.completedByName}\n`;
        }
        if (completedSubtasksToday.length > 10) {
          pushMsg += `  ...+${completedSubtasksToday.length - 10} more\n`;
        }
        pushMsg += `\n`;
      }

      pushMsg += `📤 WA STATUS: ${waStatus ? JSON.stringify(waStatus).substring(0, 200) : 'FAILED'}`;

      await sendPushoverAlert(`📋 Daily Update → ${orgData.name}`, pushMsg);
    } catch (pushErr) {
      console.error('Pushover alert failed:', pushErr);
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
    console.error("Cron GET Error:", error);
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
    console.error("Cron POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
