import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

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
      const isClient = data.isClient === true || role === "client";
      const targetOrgId = data.ownedOrgId || data.orgId;

      // Only include organization owners / non-client accounts in main dashboard list
      if ((role === "owner" || data.ownedOrgId) && !isClient) {
        let displayName = data.name || data.displayName || "Unknown User";

        const user = {
          id: doc.id,
          name: displayName,
          email: data.email || data.clientEmail || "No Email",
          role: isClient ? "client" : (data.role || "owner"),
          ownedOrgId: targetOrgId,
          orgName: data.orgName,
          totalVisits: data.totalVisits || 0,
          visits: data.visits || {},
          whatsAppNumber: data.whatsAppNumber || data.whatsapp || null,
          talked: data.talked || false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
        ownerUsers.push(user);
        if (targetOrgId) {
          orgIdsToFetch.push(targetOrgId);
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

    // 3. Fetch Recent Sessions across the entire system using Collection Group
    let recentSessions: any[] = [];
    try {
      const sessionsSnap = await adminDb.collectionGroup("sessions")
        .orderBy("startTime", "desc")
        .limit(50)
        .get();

      sessionsSnap.forEach(doc => {
        const data = doc.data();
        recentSessions.push({
          id: doc.id,
          userId: doc.ref.parent.parent?.id,
          startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
          endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : data.endTime,
          lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate().toISOString() : data.lastSeen,
          initialLoadTimeMs: data.initialLoadTimeMs,
          durationSeconds: data.durationSeconds,
          pathname: data.pathname,
          device: data.device || {},
          pageViews: data.pageViews || {},
        });
      });
    } catch (sessionError) {
      console.error("Failed to fetch global sessions (likely missing index):", sessionError);
      // We continue without sessions so the rest of the dashboard works
    }

    // 4. Merge and enrich data
    const enrichedUsers = await Promise.all(ownerUsers.map(async (user) => {
      const orgData = user.ownedOrgId ? orgDataMap[user.ownedOrgId] : null;
      
      // Attempt to get sessions from global top 50
      let userSessions = recentSessions.filter(s => s.userId === user.id);
      let totalSessionCount = user.totalVisits || 0;

      // Always check for the latest session and count if we want reliable data from the "sessions folder"
      try {
        const personalSessionSnap = await adminDb.collection("users").doc(user.id).collection("sessions")
          .orderBy("startTime", "desc")
          .limit(5)
          .get();
        
        // Update the count based on actual sessions in the sub-collection
        totalSessionCount = personalSessionSnap.size;

        // If we didn't find any sessions in the global feed, or we want the freshest 5 for the owner
        if (userSessions.length === 0 && personalSessionSnap.size > 0) {
          const latestDoc = personalSessionSnap.docs[0];
          const data = latestDoc.data();
          userSessions = [{
            id: latestDoc.id,
            userId: user.id,
            startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
            endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : data.endTime,
            lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate().toISOString() : data.lastSeen,
            initialLoadTimeMs: data.initialLoadTimeMs,
            durationSeconds: data.durationSeconds,
            pathname: data.pathname,
            device: data.device || {},
            pageViews: data.pageViews || {},
          }];
        }
      } catch (e) {
        console.error(`Failed to fetch personal sessions for ${user.id}`, e);
      }

      const lastSession = userSessions[0];
      
      let lastActivity = user.updatedAt || user.createdAt || null;
      if (lastSession) {
        lastActivity = lastSession.startTime;
      } else if (orgData) {
        const orgUpdate = orgData.updatedAt;
        if (orgUpdate && (!lastActivity || new Date(orgUpdate) > new Date(lastActivity))) {
          lastActivity = orgUpdate;
        }
      }

      return {
        ...user,
        orgData,
        lastActivity,
        totalVisits: totalSessionCount, // Use the aggregated count from sessions folder
        recentSessions: userSessions
      };
    }));

    // Sort by last activity descending
    enrichedUsers.sort((a, b) => {
      const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ 
      users: enrichedUsers,
      globalSessions: recentSessions // Also return the global feed
    });
  } catch (error: any) {
    console.error("Internal Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
