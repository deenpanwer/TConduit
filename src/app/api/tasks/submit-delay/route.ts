import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/tasks/submit-delay
 *
 * Endpoint for employees to submit a delay explanation or propose a deadline extension.
 *
 * CRITICAL RULE:
 * The task's actual 'dueDate' is NEVER modified by this submission.
 * Proposed dates are stored as 'proposedDate' inside 'extensionRequests' with status: 'pending'
 * until explicitly approved by the task creator/manager.
 */

export async function POST(req: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin failed to initialize" }, { status: 500 });
    }
    const db = admin.firestore();

    const body = await req.json();
    const { orgId, taskId, userId, userName, reason, proposedDate } = body;

    if (!orgId || !taskId || !userId || !reason?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, taskId, userId, reason" },
        { status: 400 }
      );
    }

    const taskRef = db.collection("organizations").doc(orgId).collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const taskData = taskSnap.data() || {};
    const taskTitle = taskData.title || "Untitled Task";
    const nowIso = new Date().toISOString();

    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (proposedDate) {
      // 1. Propose Deadline Extension (Does NOT change task.dueDate directly)
      const newExtensionRequest = {
        id: crypto.randomUUID(),
        userId,
        userName: userName || "Employee",
        reason: reason.trim(),
        proposedDate: String(proposedDate),
        status: "pending",
        createdAt: nowIso,
      };

      const currentRequests = taskData.extensionRequests || [];
      updates.extensionRequests = [...currentRequests, newExtensionRequest];

      // Notify the manager/task creator about the extension request
      const managerId = taskData.createdById || taskData.creatorId || taskData.ownerId;
      if (managerId && managerId !== userId) {
        const notifRef = db.collection("organizations").doc(orgId).collection("notifications").doc();
        await notifRef.set({
          id: notifRef.id,
          orgId,
          type: "extension_request",
          taskId,
          taskTitle,
          senderId: userId,
          senderName: userName || "Employee",
          recipientId: managerId,
          details: reason.trim(),
          proposedDate: String(proposedDate),
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAtLocal: nowIso,
        });
      }
    } else {
      // 2. Submit Delay Reason only
      const newDelayReason = {
        id: crypto.randomUUID(),
        userId,
        userName: userName || "Employee",
        reason: reason.trim(),
        createdAt: nowIso,
      };

      const currentReasons = taskData.delayReasons || [];
      updates.delayReasons = [...currentReasons, newDelayReason];

      // Notify manager
      const managerId = taskData.createdById || taskData.creatorId || taskData.ownerId;
      if (managerId && managerId !== userId) {
        const notifRef = db.collection("organizations").doc(orgId).collection("notifications").doc();
        await notifRef.set({
          id: notifRef.id,
          orgId,
          type: "delay_reason",
          taskId,
          taskTitle,
          senderId: userId,
          senderName: userName || "Employee",
          recipientId: managerId,
          details: reason.trim(),
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAtLocal: nowIso,
        });
      }
    }

    // Apply updates to the task document (task.dueDate is preserved unchanged)
    await taskRef.update(updates);

    // Resolve any pending overdue_prompt notifications for this employee on this task
    const orgPromptsSnap = await db
      .collection("organizations")
      .doc(orgId)
      .collection("notifications")
      .where("type", "==", "overdue_prompt")
      .where("taskId", "==", taskId)
      .where("recipientId", "==", userId)
      .where("status", "==", "pending")
      .get();

    const userPromptsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .where("type", "==", "overdue_prompt")
      .where("taskId", "==", taskId)
      .where("status", "==", "pending")
      .get();

    const resolveBatch = db.batch();
    orgPromptsSnap.docs.forEach((d) => {
      resolveBatch.update(d.ref, {
        status: "resolved",
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    userPromptsSnap.docs.forEach((d) => {
      resolveBatch.update(d.ref, {
        status: "resolved",
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await resolveBatch.commit();

    return NextResponse.json({
      success: true,
      message: proposedDate ? "Deadline extension proposed successfully" : "Delay reason submitted successfully",
      taskId,
      proposedDate: proposedDate || null,
    });
  } catch (error: any) {
    console.error("[Submit Task Delay Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
