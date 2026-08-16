import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * CRON: Scan CRM Missed Follow-ups & Dispatch Employee Notifications
 *
 * Logic:
 * 1. Iterate over all active organizations in Firestore.
 * 2. For each org, fetch custom CRM fields from crm_config to identify follow-up date keys.
 * 3. Fetch all assigned, non-deleted leads/entities.
 * 4. Check if the follow-up timestamp has passed (followUpDate < now).
 * 5. Check if a notification already exists under users/{assignedUserId}/notifications for that lead & date.
 * 6. If not, create a 'crm_missed_followup' notification doc nested under that user's notifications.
 */

// Helper to safely parse any Firestore or string date
function parseFollowUpDate(val: any): Date | null {
  if (!val) return null;
  if (val && typeof val.toDate === "function") {
    return val.toDate();
  }
  if (val && val.seconds !== undefined) {
    return new Date(val.seconds * 1000);
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "string" || typeof val === "number") {
    const cleanStr = typeof val === "string" ? val.replace(/(\d+)(st|nd|rd|th)/gi, "$1") : val;
    const parsed = new Date(cleanStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

async function executeScanMissedFollowups() {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw new Error("Firebase Admin failed to initialize");
  }
  const db = admin.firestore();

  const now = new Date();
  const orgsSnap = await db.collection("organizations").get();

  let totalOrgsScanned = 0;
  let totalLeadsChecked = 0;
  let totalMissedDetected = 0;
  let totalNotificationsCreated = 0;
  const createdDetails: any[] = [];

  for (const orgDoc of orgsSnap.docs) {
    const orgId = orgDoc.id;
    const orgData = orgDoc.data() || {};

    // Skip org if subscription or trial has expired
    const expiry = orgData.subscriptionExpiry?.toDate?.() || (orgData.subscriptionExpiry ? new Date(orgData.subscriptionExpiry) : null);
    if (expiry && expiry.getTime() < now.getTime()) {
      continue;
    }
    if (orgData.subscriptionStatus === "expired" || orgData.subscriptionStatus === "cancelled") {
      continue;
    }

    totalOrgsScanned++;

    // 1. Fetch CRM Config to find custom date field keys for follow-ups
    let followUpKeys: string[] = ["nextFollowUp", "next_follow_up", "followUpDate", "follow_up", "followupDate", "lastInteraction"];
    
    try {
      const configDoc = await db.collection("organizations").doc(orgId).collection("crm_config").doc("main").get();
      if (configDoc.exists) {
        const configData = configDoc.data();
        const fields: any[] = configData?.fields || [];
        fields.forEach((f) => {
          const label = (f.label || "").toLowerCase();
          const key = (f.key || "").toLowerCase();
          if ((label.includes("follow") || key.includes("follow")) && f.type === "date") {
            if (!followUpKeys.includes(f.key)) {
              followUpKeys.unshift(f.key);
            }
          }
        });
      }
    } catch (e) {
      console.warn(`[Cron Missed Followups] Failed to read crm_config for org ${orgId}:`, e);
    }

    // 2. Fetch CRM Entities that are active (isDeleted == false)
    const entitiesSnap = await db
      .collection("organizations")
      .doc(orgId)
      .collection("crm_entities")
      .where("isDeleted", "==", false)
      .get();

    if (entitiesSnap.empty) continue;

    for (const entityDoc of entitiesSnap.docs) {
      totalLeadsChecked++;
      const entity = entityDoc.data();
      const entityId = entityDoc.id;
      const entityData = entity.data || {};

      // Determine Assigned User ID
      const assignedUserId =
        entityData.assignedTo ||
        entity.assignedTo ||
        entityData.assignee ||
        entity.assignee ||
        entityData.assignedUserId ||
        entity.assignedUserId;

      if (!assignedUserId || typeof assignedUserId !== "string") {
        continue; // Unassigned leads don't trigger personal missed follow-up notifications
      }

      // Check for follow-up date across candidate keys
      let followUpVal: any = null;
      let usedKey = "";

      for (const k of followUpKeys) {
        if (entityData[k] !== undefined && entityData[k] !== null && entityData[k] !== "") {
          followUpVal = entityData[k];
          usedKey = k;
          break;
        }
        if (entity[k] !== undefined && entity[k] !== null && entity[k] !== "") {
          followUpVal = entity[k];
          usedKey = k;
          break;
        }
      }

      if (!followUpVal) continue;

      const followUpDate = parseFollowUpDate(followUpVal);
      if (!followUpDate) continue;

      // Check if the follow-up date has passed
      if (followUpDate.getTime() < now.getTime()) {
        totalMissedDetected++;

        const followUpDateIso = followUpDate.toISOString();
        const leadName = entity.name || entityData.name || entityData.leadName || entity.leadName || "Lead";

        // Check if user already has an active notification for this lead & date
        const existingNotifsSnap = await db
          .collection("users")
          .doc(assignedUserId)
          .collection("notifications")
          .where("type", "==", "crm_missed_followup")
          .where("leadId", "==", entityId)
          .get();

        let alreadyNotified = false;
        for (const notifDoc of existingNotifsSnap.docs) {
          const notifData = notifDoc.data();
          // If already notified for this exact follow-up date, or if there's an unresolved pending notification for this lead
          if (notifData.followUpDate === followUpDateIso || notifData.status === "pending") {
            alreadyNotified = true;
            break;
          }
        }

        if (!alreadyNotified) {
          const notificationRef = db
            .collection("users")
            .doc(assignedUserId)
            .collection("notifications")
            .doc();

          const newNotification = {
            id: notificationRef.id,
            orgId: orgId,
            type: "crm_missed_followup",
            leadId: entityId,
            leadName: leadName,
            followUpDate: followUpDateIso,
            title: `Missed Follow-up on ${leadName}`,
            body: `You have missed your scheduled follow-up for ${leadName}. Click to submit a reason.`,
            senderId: "system",
            recipientId: assignedUserId,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAtLocal: new Date().toISOString(),
          };

          await notificationRef.set(newNotification);
          totalNotificationsCreated++;
          createdDetails.push({
            notificationId: notificationRef.id,
            userId: assignedUserId,
            orgId: orgId,
            leadId: entityId,
            leadName: leadName,
            missedDate: followUpDateIso,
          });
        }
      }
    }
  }

  return {
    success: true,
    timestamp: now.toISOString(),
    stats: {
      totalOrgsScanned,
      totalLeadsChecked,
      totalMissedDetected,
      totalNotificationsCreated,
    },
    createdNotifications: createdDetails,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow query param token as alternative for cron dispatchers
      const token = req.nextUrl.searchParams.get("key");
      if (!token || token !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await executeScanMissedFollowups();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Cron Missed Followups GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await executeScanMissedFollowups();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Cron Missed Followups POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
