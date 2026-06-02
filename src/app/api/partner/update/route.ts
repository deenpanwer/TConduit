import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const { partnerId, updates } = await req.json();

    if (!partnerId) {
      return NextResponse.json({ error: "Missing partnerId" }, { status: 400 });
    }

    // Safely perform the update on the partner document bypassing client security rules
    const partnerRef = admin.firestore().collection("partners").doc(partnerId);
    await partnerRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Partner Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
