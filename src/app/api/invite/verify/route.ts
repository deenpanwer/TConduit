import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Firebase admin failed to initialize" }, { status: 500 });
  }

  try {
    const db = admin.firestore();
    const snap = await db.collection("organizations")
      .where("inviteCode", "==", code)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    return NextResponse.json({
      valid: true,
      org: {
        id: doc.id,
        name: data.name || ""
      }
    });
  } catch (error: any) {
    console.error("Error in verify invite API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
