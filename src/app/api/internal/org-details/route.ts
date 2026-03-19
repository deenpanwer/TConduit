import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    // 1. Fetch Organization Document
    const orgDoc = await adminDb.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgData = {
      id: orgDoc.id,
      ...orgDoc.data(),
      subscriptionExpiry: orgDoc.data()?.subscriptionExpiry?.toDate ? orgDoc.data()?.subscriptionExpiry.toDate().toISOString() : orgDoc.data()?.subscriptionExpiry,
      createdAt: orgDoc.data()?.createdAt?.toDate ? orgDoc.data()?.createdAt.toDate().toISOString() : orgDoc.data()?.createdAt,
    };

    // 2. Fetch all staff members (users where orgId == orgId or ownedOrgId == orgId)
    // We can't do a multi-collection query easily, so we'll query users by orgId
    const staffSnap = await adminDb.collection("users").where("orgId", "==", orgId).get();
    const ownerSnap = await adminDb.collection("users").where("ownedOrgId", "==", orgId).get();
    
    const staff: any[] = [];
    const seenIds = new Set();

    [...ownerSnap.docs, ...staffSnap.docs].forEach(doc => {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        const d = doc.data();
        staff.push({
          id: doc.id,
          name: d.name || d.displayName || "Unknown",
          email: d.email,
          role: d.role,
          photoUrl: d.photoUrl || d.photoURL,
          totalVisits: d.totalVisits || 0,
          visits: d.visits || {},
          lastActivity: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null)
        });
      }
    });

    // Sort staff by role (Owner first) then name
    staff.sort((a, b) => {
      if (a.role?.toLowerCase() === "owner" || a.role?.toLowerCase() === "founder") return -1;
      if (b.role?.toLowerCase() === "owner" || b.role?.toLowerCase() === "founder") return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return NextResponse.json({ org: orgData, staff });
  } catch (error: any) {
    console.error("Org Details API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
