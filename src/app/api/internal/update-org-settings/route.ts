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
    const { orgId, updates } = body;

    if (!orgId || !updates) {
      return NextResponse.json({ error: "orgId and updates are required" }, { status: 400 });
    }

    // Allowed feature toggle and tier level fields for organization settings
    const allowedFields = [
      'disableLeaderboard',
      'disableCrm',
      'disableTasks',
      'disableDocs',
      'disableCeoLeads',
      'isStandard',
      'isPremium'
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

    await adminDb.collection("organizations").doc(orgId).update({
      ...filteredUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, message: "Organization settings updated successfully", updates: filteredUpdates });
  } catch (error: any) {
    console.error("Update Org Settings API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
