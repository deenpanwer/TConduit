import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const body = await req.json();
    const { targetUserId, orgId, name, role, appLockPassword, appLockPaused, active } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target User ID is required" }, { status: 400 });
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(targetUserId);

    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (appLockPassword !== undefined) updateData.appLockPassword = appLockPassword;
    if (appLockPaused !== undefined) updateData.appLockPaused = appLockPaused;
    if (active !== undefined) updateData.active = active;

    // 1. Update primary User document
    await userRef.set(updateData, { merge: true });

    // 2. Also update in Organization employees subcollection if orgId provided
    if (orgId) {
      try {
        const empRef = db.collection("organizations").doc(orgId).collection("employees").doc(targetUserId);
        const empSnap = await empRef.get();
        if (empSnap.exists) {
          const empUpdate: Record<string, any> = {};
          if (name !== undefined) empUpdate.name = name;
          if (role !== undefined) empUpdate.role = role;
          if (active !== undefined) empUpdate.active = active;
          if (Object.keys(empUpdate).length > 0) {
            await empRef.set(empUpdate, { merge: true });
          }
        }
      } catch (orgErr) {
        console.warn("Failed to update org employee doc:", orgErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Admin Update Employee Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update employee" }, { status: 500 });
  }
}
