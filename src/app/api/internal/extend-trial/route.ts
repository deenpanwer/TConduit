import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { orgId, days } = await req.json();

    if (!orgId || !days) {
      return NextResponse.json({ error: "orgId and days are required" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const orgRef = adminDb.collection("organizations").doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const currentExpiry = orgDoc.data()?.subscriptionExpiry?.toDate ? orgDoc.data()?.subscriptionExpiry.toDate() : (orgDoc.data()?.subscriptionExpiry ? new Date(orgDoc.data()?.subscriptionExpiry) : new Date());
    
    // Calculate new expiry: if already expired, start from now. If not expired, add to current.
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    await orgRef.update({
      subscriptionExpiry: admin.firestore.Timestamp.fromDate(newExpiry),
      subscriptionStatus: "trialing", // Ensure it's active
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      newExpiry: newExpiry.toISOString() 
    });
  } catch (error: any) {
    console.error("Extend Trial API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
