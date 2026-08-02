import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const { orgId, shareId, branding } = await req.json();

    if (!orgId || !shareId || !branding) {
      return NextResponse.json({ error: "Missing required fields (orgId, shareId, branding)" }, { status: 400 });
    }

    const shareRef = admin.firestore().collection("organizations").doc(orgId).collection("client_shares").doc(shareId);
    await shareRef.set({ branding, isCustomBranded: true }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update branding API error:", error);
    return NextResponse.json({ error: error.message || "Failed to update branding" }, { status: 500 });
  }
}
