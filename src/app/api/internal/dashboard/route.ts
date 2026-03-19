import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();

    // 1. Fetch all users who are owners or have an ownedOrgId
    // Using Admin SDK bypasses security rules
    const usersSnap = await adminDb.collection("users").get();
    
    const ownerUsers: any[] = [];
    const orgIdsToFetch: string[] = [];

    usersSnap.forEach((doc) => {
      const data = doc.data();
      const role = (data.role || "").toLowerCase();
      // Only include owners or those with an ownedOrgId
      if (role === "owner" || data.ownedOrgId) {
        const user = {
          id: doc.id,
          name: data.name || data.displayName || "Unknown User",
          email: data.email || "No Email",
          role: data.role || "owner",
          ownedOrgId: data.ownedOrgId,
          orgName: data.orgName,
          totalVisits: data.totalVisits || 0,
          visits: data.visits || {},
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
        ownerUsers.push(user);
        if (data.ownedOrgId) {
          orgIdsToFetch.push(data.ownedOrgId);
        }
      }
    });

    // 2. Fetch Organizations in parallel chunks if needed, but for now fetch all unique
    const uniqueOrgIds = Array.from(new Set(orgIdsToFetch));
    const orgDataMap: Record<string, any> = {};

    // Fetch orgs in batches of 10 to avoid URI length issues if we were using where-in
    // but here we just fetch each one as requested since we are server-side.
    await Promise.all(
      uniqueOrgIds.map(async (orgId) => {
        const orgDoc = await adminDb.collection("organizations").doc(orgId).get();
        if (orgDoc.exists) {
          const d = orgDoc.data();
          orgDataMap[orgId] = { 
            id: orgDoc.id, 
            ...d,
            subscriptionExpiry: d?.subscriptionExpiry?.toDate ? d.subscriptionExpiry.toDate().toISOString() : d?.subscriptionExpiry,
            updatedAt: d?.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d?.updatedAt,
            createdAt: d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d?.createdAt,
          };
        }
      })
    );

    // 3. Merge and enrich data
    const enrichedUsers = ownerUsers.map(user => {
      const orgData = user.ownedOrgId ? orgDataMap[user.ownedOrgId] : null;
      
      // Calculate last activity
      let lastActivity = user.updatedAt || user.createdAt || null;
      if (orgData) {
        const orgUpdate = orgData.updatedAt;
        if (orgUpdate && (!lastActivity || new Date(orgUpdate) > new Date(lastActivity))) {
          lastActivity = orgUpdate;
        }
      }

      return {
        ...user,
        orgData,
        lastActivity
      };
    });

    // Sort by last activity descending
    enrichedUsers.sort((a, b) => {
      const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch (error: any) {
    console.error("Internal Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
