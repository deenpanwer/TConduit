import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const { orgId, clientEmail, allowedScopes, branding } = await req.json();

    if (!orgId || !clientEmail) {
      return NextResponse.json({ error: "Missing required fields (orgId, clientEmail)" }, { status: 400 });
    }

    const emailToRegister = clientEmail.trim().toLowerCase();

    // Check limit of 3 active client shares
    const sharesSnap = await admin.firestore().collection("organizations").doc(orgId).collection("client_shares").get();
    if (sharesSnap.size >= 3) {
      return NextResponse.json({ error: "Maximum limit of 3 active client shares reached. Please remove an existing client." }, { status: 400 });
    }

    const newShareRef = admin.firestore().collection("organizations").doc(orgId).collection("client_shares").doc();
    const shareId = newShareRef.id;

    const batch = admin.firestore().batch();

    const shareData = {
      id: shareId,
      orgId,
      clientEmail: emailToRegister,
      allowedScopes: Array.isArray(allowedScopes) ? allowedScopes : [],
      isCustomBranded: false,
      createdAt: new Date().toISOString(),
      branding: branding || {
        logoUrl: "",
        titleText: "Welcome to the Client Portal",
        descriptionText: "Enter your email address below to access your tasks and updates.",
        buttonText: "Access Portal",
        welcomeMessage: "Access granted!"
      }
    };
    batch.set(newShareRef, shareData);

    const emailDocRef = admin.firestore().collection("organizations").doc(orgId).collection("client_emails").doc(emailToRegister);
    batch.set(emailDocRef, {
      shareId,
      allowedScopes: Array.isArray(allowedScopes) ? allowedScopes : [],
      createdAt: new Date().toISOString()
    });

    await batch.commit();

    return NextResponse.json({ success: true, shareId, shareData });
  } catch (error: any) {
    console.error("Client share creation API error:", error);
    return NextResponse.json({ error: error.message || "Failed to create client share" }, { status: 500 });
  }
}
