import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * API Route: Delete Organization
 * 
 * This route is highly destructive. It performs the following steps:
 * 1. Finds all users associated with the provided orgId (Members and Owners).
 * 2. Removes each of these users from Firebase Authentication.
 * 3. Deletes each user's document from the Firestore 'users' collection.
 * 4. Finally, deletes the organization document from the 'organizations' collection.
 * 
 * @param {Request} req - The incoming request containing orgId
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
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    console.log(`Starting massive deletion process for organization: ${orgId}`);

    // 3. Find all users associated with this organization
    // We check both 'orgId' (staff) and 'ownedOrgId' (founders/owners)
    const staffSnap = await adminDb.collection("users").where("orgId", "==", orgId).get();
    const ownerSnap = await adminDb.collection("users").where("ownedOrgId", "==", orgId).get();
    
    // Use a Set to avoid duplicates if a user somehow matches both
    const userIds = new Set<string>();
    staffSnap.forEach(doc => userIds.add(doc.id));
    ownerSnap.forEach(doc => userIds.add(doc.id));

    console.log(`Found ${userIds.size} users linked to this organization.`);

    // 4. Cleanup Users (Auth + Firestore)
    // We iterate through each user ID to perform the cleanup
    const userDeletionPromises = Array.from(userIds).map(async (userId) => {
      try {
        // A. Remove from Firebase Authentication
        await adminAuth.deleteUser(userId);
        console.log(`Deleted user ${userId} from Auth.`);
      } catch (authErr: any) {
        if (authErr.code !== 'auth/user-not-found') {
          console.error(`Auth deletion error for ${userId}:`, authErr.message);
        }
      }
      
      // B. Remove from Firestore 'users' collection
      await adminDb.collection("users").doc(userId).delete();
      console.log(`Deleted user ${userId} from Firestore.`);
    });

    // Wait for all user cleanups to finish
    await Promise.all(userDeletionPromises);

    // 5. Finally, Delete the Organization itself
    await adminDb.collection("organizations").doc(orgId).delete();
    console.log(`Successfully deleted organization document: ${orgId}`);

    return NextResponse.json({ 
      success: true, 
      message: `Organization and ${userIds.size} associated users have been permanently removed.` 
    });

  } catch (error: any) {
    console.error("Delete Organization API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
