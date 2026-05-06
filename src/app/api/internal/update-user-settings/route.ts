import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();

    const body = await req.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json({ error: "userId and updates are required" }, { status: 400 });
    }

    // List of allowed fields to update for security
    const allowedFields = [
      'accessLocked', 
      'screenshotInterval', 
      'shiftSyncInterval', 
      'blurScreenshots',
      'active',
      'talked'
    ];

    const filteredUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
    }

    await adminDb.collection("users").doc(userId).update({
      ...filteredUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, message: "User settings updated successfully" });
  } catch (error: any) {
    console.error("Update User Settings API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
