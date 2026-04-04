import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * API Route: Delete User
 * 
 * This route handles the permanent deletion of a user from both 
 * Firebase Authentication and the Firestore 'users' collection.
 * 
 * @param {Request} req - The incoming request containing userId
 */
export async function POST(req: Request) {
  try {
    // 1. Initialize Firebase Admin SDK
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();
    const adminAuth = admin.auth();

    // 2. Parse request body
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    console.log(`Starting deletion process for user: ${userId}`);

    // 3. Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(userId);
      console.log(`Successfully deleted user ${userId} from Firebase Auth`);
    } catch (authError: any) {
      // If user doesn't exist in Auth, we continue to delete Firestore data
      if (authError.code === 'auth/user-not-found') {
        console.warn(`User ${userId} not found in Firebase Auth, proceeding with Firestore cleanup.`);
      } else {
        throw authError;
      }
    }

    // 4. Delete Firestore User Document
    // Note: This only deletes the main document. 
    // Subcollections (like sessions) will remain as "orphaned" unless recursive delete is used.
    await adminDb.collection("users").doc(userId).delete();
    console.log(`Successfully deleted user document for ${userId} from Firestore`);

    return NextResponse.json({ 
      success: true, 
      message: "User permanently removed from Auth and Firestore." 
    });

  } catch (error: any) {
    console.error("Delete User API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
