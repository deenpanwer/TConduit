import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }
    const db = admin.firestore();

    const body = await req.json();
    const {
      targetUserId,
      targetUserName,
      orgId,
      issuerId,
      issuerName,
      issuerRole,
      tier,
      category,
      title,
      message,
    } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (!tier || ![1, 2, 3].includes(Number(tier))) {
      return NextResponse.json({ error: "Invalid warning tier. Must be 1, 2, or 3" }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Warning reason/message is required" }, { status: 400 });
    }

    const warningTier = Number(tier) as 1 | 2 | 3;
    const tierLabels: Record<1 | 2 | 3, string> = {
      1: "Tier 1: Notice",
      2: "Tier 2: Formal Caution",
      3: "Tier 3: Critical Alert"
    };

    const notificationId = `warning_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const notificationRef = db
      .collection("users")
      .doc(targetUserId)
      .collection("notifications")
      .doc(notificationId);

    const warningData = {
      id: notificationId,
      type: "warning",
      tier: warningTier,
      tierLabel: tierLabels[warningTier],
      category: category || "General",
      title: title?.trim() || `${tierLabels[warningTier]} Warning`,
      message: message.trim(),
      details: message.trim(),
      issuerId: issuerId || "admin",
      issuerName: issuerName || "Management",
      issuerRole: issuerRole || "Manager",
      recipientId: targetUserId,
      recipientName: targetUserName || "Staff Member",
      orgId: orgId || "",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtLocal: new Date().toISOString(),
      acknowledgedAt: null,
      acknowledgementNote: null,
    };

    await notificationRef.set(warningData);

    return NextResponse.json({
      success: true,
      message: `Tier ${warningTier} warning issued successfully`,
      warning: warningData,
    });
  } catch (error: any) {
    console.error("[Issue Warning API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to issue warning" },
      { status: 500 }
    );
  }
}
