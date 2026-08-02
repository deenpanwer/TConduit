import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const { email, orgId, shareId } = await req.json();

    if (!email || !orgId || !shareId) {
      return NextResponse.json({ error: "Missing required fields (email, orgId, shareId)" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch the client share document
    const shareRef = admin.firestore().collection("organizations").doc(orgId).collection("client_shares").doc(shareId);
    const shareSnap = await shareRef.get();

    if (!shareSnap.exists) {
      return NextResponse.json({ error: "Invalid share link or portal has been deleted." }, { status: 404 });
    }

    const shareData = shareSnap.data();
    const registeredEmail = (shareData?.clientEmail || "").trim().toLowerCase();

    // 2. Validate email match
    if (registeredEmail !== normalizedEmail) {
      return NextResponse.json({ error: "Access Denied. Your email is not registered for this portal." }, { status: 401 });
    }

    // 3. Create deterministic UID to prevent user profile collision
    const hash = crypto.createHash("sha256").update(`${normalizedEmail}_${orgId}`).digest("hex");
    const uid = `client_${hash}`;

    // 4. Ensure client user document exists in Firestore so security rules succeed
    await admin.firestore().collection("users").doc(uid).set({
      uid,
      email: normalizedEmail,
      orgId,
      ownedOrgId: orgId,
      role: "client",
      isClient: true,
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 5. Create custom claims and generate custom token
    const customClaims = {
      role: "client",
      isClient: true,
      clientEmail: normalizedEmail,
      orgId: orgId,
      clientShareId: shareId
    };

    const token = await admin.auth().createCustomToken(uid, customClaims);

    return NextResponse.json({
      success: true,
      token,
      orgId,
      shareId,
      allowedScopes: shareData?.allowedScopes || []
    });
  } catch (error: any) {
    console.error("Client verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
