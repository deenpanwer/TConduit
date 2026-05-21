import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const { email, password, displayName, photoURL } = await req.json();

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      photoURL,
    });

    return NextResponse.json({ uid: userRecord.uid });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
