import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * CRON: Scan Missed / Overdue Tasks & Dispatch Overdue Prompts to Assignees
 *
 * Logic:
 * 1. Iterate over all active organizations.
 * 2. Fetch all uncompleted tasks with a dueDate in the past (dueDate < now).
 * 3. For each assigned employee:
 *    - Check if they already submitted a delay reason or a pending extension request on this task.
 *    - Check if a pending 'overdue_prompt' notification already exists.
 *    - If not, create an 'overdue_prompt' notification.
 *
 * NOTE: The task's actual dueDate is NEVER modified directly by overdue scans or employee submissions.
 *       New dates requested by employees are strictly recorded as 'proposedDate' under 'extensionRequests'
 *       until explicitly approved by a manager.
 */

// Helper to safely parse task due dates
function parseTaskDueDate(val: any): Date | null {
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

async function executeScanMissedTasks() {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw new Error("Firebase Admin failed to initialize");
  }
  const db = admin.firestore();

  const now = new Date();
  const orgsSnap = await db.collection("organizations").get();

  let totalOrgsScanned = 0;
  let totalTasksChecked = 0;
  let totalOverdueDetected = 0;
  let totalPromptsCreated = 0;
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

    const tasksSnap = await db
      .collection("organizations")
      .doc(orgId)
      .collection("tasks")
      .get();

    if (tasksSnap.empty) continue;

    for (const taskDoc of tasksSnap.docs) {
      totalTasksChecked++;
      const task = taskDoc.data();
      const taskId = taskDoc.id;

      // 1. Check completion status
      const isCompleted = task.flagged === true || task.status === "done" || task.status === "completed";
      if (isCompleted) continue;

      // 2. Check if task has a due date in the past
      const dueDate = parseTaskDueDate(task.dueDate);
      if (!dueDate) continue;

      if (dueDate.getTime() >= now.getTime()) {
        continue; // Not yet overdue
      }

      totalOverdueDetected++;

      // 3. Find assignees
      const rawAssignees: any[] = Array.isArray(task.assignees)
        ? task.assignees
        : task.assigneeId
        ? [task.assigneeId]
        : task.assignedTo
        ? [task.assignedTo]
        : [];

      // Extract string IDs (handling object assignees or raw string IDs)
      const assigneeIds = rawAssignees
        .map((a) => (typeof a === "object" && a !== null ? a.id || a.uid : a))
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      if (assigneeIds.length === 0) continue;

      const delayReasons: any[] = task.delayReasons || [];
      const extensionRequests: any[] = task.extensionRequests || [];

      for (const employeeId of assigneeIds) {
        // Check if employee already submitted a delay explanation or has a pending extension
        const hasSubmittedDelay = delayReasons.some((r) => r.userId === employeeId);
        const hasPendingExtension = extensionRequests.some(
          (r) => r.userId === employeeId && r.status === "pending"
        );

        if (hasSubmittedDelay || hasPendingExtension) {
          continue;
        }

        // Check if a pending overdue prompt already exists in organizations/{orgId}/notifications
        const existingOrgPromptSnap = await db
          .collection("organizations")
          .doc(orgId)
          .collection("notifications")
          .where("type", "==", "overdue_prompt")
          .where("taskId", "==", taskId)
          .where("recipientId", "==", employeeId)
          .where("status", "==", "pending")
          .get();

        if (!existingOrgPromptSnap.empty) {
          continue;
        }

        // Check if a pending prompt already exists in users/{employeeId}/notifications
        const existingUserPromptSnap = await db
          .collection("users")
          .doc(employeeId)
          .collection("notifications")
          .where("type", "==", "overdue_prompt")
          .where("taskId", "==", taskId)
          .where("status", "==", "pending")
          .get();

        if (!existingUserPromptSnap.empty) {
          continue;
        }

        // Create the overdue prompt notification
        const notifId = db.collection("organizations").doc(orgId).collection("notifications").doc().id;
        const taskTitle = task.title || "Untitled Task";
        const dueDateIso = dueDate.toISOString();

        const notifPayload = {
          id: notifId,
          orgId: orgId,
          type: "overdue_prompt",
          taskId: taskId,
          taskTitle: taskTitle,
          senderId: "system",
          recipientId: employeeId,
          status: "pending",
          dueDate: dueDateIso,
          title: `Overdue Task: ${taskTitle}`,
          body: `Your task "${taskTitle}" is past its due date. Please submit an explanation or propose a deadline extension.`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAtLocal: new Date().toISOString(),
        };

        // Write to both organization notifications & user notifications for universal client synchronization
        await Promise.all([
          db.collection("organizations").doc(orgId).collection("notifications").doc(notifId).set(notifPayload),
          db.collection("users").doc(employeeId).collection("notifications").doc(notifId).set(notifPayload),
        ]);

        totalPromptsCreated++;
        createdDetails.push({
          notificationId: notifId,
          orgId,
          taskId,
          taskTitle,
          employeeId,
          dueDate: dueDateIso,
        });
      }
    }
  }

  return {
    success: true,
    timestamp: now.toISOString(),
    stats: {
      totalOrgsScanned,
      totalTasksChecked,
      totalOverdueDetected,
      totalPromptsCreated,
    },
    promptsCreated: createdDetails,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      const token = req.nextUrl.searchParams.get("key");
      if (!token || token !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await executeScanMissedTasks();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Cron Missed Tasks GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await executeScanMissedTasks();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Cron Missed Tasks POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
