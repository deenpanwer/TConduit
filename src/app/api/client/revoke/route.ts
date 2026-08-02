import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const { orgId, shareId, clientEmail } = await req.json();

    if (!orgId || !shareId || !clientEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const batch = admin.firestore().batch();
    const shareRef = admin.firestore().collection("organizations").doc(orgId).collection("client_shares").doc(shareId);
    const emailRef = admin.firestore().collection("organizations").doc(orgId).collection("client_emails").doc(clientEmail.trim().toLowerCase());

    batch.delete(shareRef);
    batch.delete(emailRef);

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Client share revoke API error:", error);
    return NextResponse.json({ error: error.message || "Failed to revoke client share" }, { status: 500 });
  }
}
