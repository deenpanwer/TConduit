import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const body = await req.json();
    const { 
      uid: existingUid, 
      email, 
      password, 
      displayName, 
      designation, 
      department, 
      salary, 
      whatsapp, 
      orgId, 
      createdBy,
      role
    } = body;

    let uid = existingUid;

    if (!uid) {
      try {
        // Create new Auth User
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName,
        });
        uid = userRecord.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // Self-heal: Retrieve the existing user's UID and proceed with writing the Firestore document
          const existingUser = await admin.auth().getUserByEmail(email);
          uid = existingUser.uid;
        } else {
          throw authError;
        }
      }
    }

    // Now write to Firestore using Admin SDK (bypassing client-side rules)
    const commonFields = {
      name: displayName || '',
      email: email || '',
      designation: designation || '',
      department: department || '',
      baseSalary: Number(salary) || 0,
      whatsappNumber: whatsapp || '',
      systemPassword: password || '',
      orgId,
      role: role || 'employee',
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userRef = admin.firestore().collection('users').doc(uid);

    if (!existingUid) {
      // Fetch org invite code for the profile
      const orgRef = admin.firestore().collection('organizations').doc(orgId);
      const orgDoc = await orgRef.get();
      const inviteCode = orgDoc.exists ? orgDoc.data()?.inviteCode : '';

      // New Employee specific fields (Provenance & Defaults)
      await userRef.set(
        {
          ...commonFields,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          attachedAt: admin.firestore.FieldValue.serverTimestamp(),
          onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: createdBy || 'unknown',
          creationMode: 'owner-created',
          onboardingProfile: { inviteCode },
          accessLocked: false,
          autoTrackApps: [],
          autoTrackOnboardingComplete: false,
          blurScreenshots: false,
          disableScreenshots: false,
          webBlockerEnabled: false,
          employeeOnboardingV1Complete: true, // Now website onboarding is marked complete
          enableManualTimeTracking: false,
          orgStatus: 'active',
          screenshotInterval: 5,
          shiftSyncInterval: 1,
        },
        { merge: true }
      );
    } else {
      // Update existing employee
      await userRef.set(commonFields, { merge: true });
    }

    return NextResponse.json({ uid });
  } catch (error: any) {
    console.error("Error saving employee:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
