import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

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
    const allDocs = [...ownerSnap.docs, ...staffSnap.docs];

    // Fetch heartbeats in parallel for all staff
    const staffWithHeartbeats = await Promise.all(allDocs.map(async (doc) => {
      if (seenIds.has(doc.id)) return null;
      seenIds.add(doc.id);
      
      const d = doc.data();
      
      // Fetch heartbeat sub-collection document
      const hbDoc = await adminDb.collection("users").doc(doc.id).collection("live").doc("heartbeat").get();
      const heartbeat = hbDoc.exists ? hbDoc.data() : null;

      // Fetch recent sessions for this user (most recent 5)
      const recentSessions: any[] = [];
      try {
        const sessionsSnap = await adminDb.collection("users").doc(doc.id).collection("sessions")
          .orderBy("startTime", "desc")
          .limit(5)
          .get();

        sessionsSnap.forEach(sDoc => {
          const sData = sDoc.data();
          recentSessions.push({
            id: sDoc.id,
            startTime: sData.startTime?.toDate ? sData.startTime.toDate().toISOString() : sData.startTime,
            endTime: sData.endTime?.toDate ? sData.endTime.toDate().toISOString() : sData.endTime,
            initialLoadTimeMs: sData.initialLoadTimeMs,
            durationSeconds: sData.durationSeconds,
            pathname: sData.pathname,
            device: sData.device || {},
            pageViews: sData.pageViews || {},
          });
        });
      } catch (sessionError) {
        console.error(`Failed to fetch sessions for user ${doc.id}:`, sessionError);
        // Continue without sessions for this user
      }

      return {
        id: doc.id,
        name: d.name || d.displayName || "Unknown",
        email: d.email,
        role: d.role,
        photoUrl: d.photoUrl || d.photoURL,
        totalVisits: d.totalVisits || 0,
        recentSessions: recentSessions, // Use real session data
        lastLoginLocation: d.lastLoginLocation || null,
        lastLoginAppVersion: d.lastLoginAppVersion || null,
        lastLoginOs: d.lastLoginOs || null,
        lastLoginIpAddress: d.lastLoginIpAddress || null,
        currentVersion: d.currentVersion || null,
        isPWA: d.isPWA || false,
        notificationsEnabled: d.notificationsEnabled || false,
        whatsAppNumber: d.whatsAppNumber || d.whatsapp || null,
        accessLocked: d.accessLocked || false,
        active: d.active !== false,
        screenshotInterval: d.screenshotInterval || 10,
        shiftSyncInterval: d.shiftSyncInterval || 30,
        blurScreenshots: d.blurScreenshots || false,
        onboardingProfile: d.onboardingProfile || null,
        heartbeat: heartbeat ? {
          ...heartbeat,
          lastActive: heartbeat.lastActive?.toDate ? heartbeat.lastActive.toDate().toISOString() : heartbeat.lastActive
        } : null,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        lastActivity: recentSessions[0]?.startTime || (d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null))
      };
    }));

    staffWithHeartbeats.forEach(s => {
      if (s) staff.push(s);
    });

    // 3. Fetch Client Shares / Portal Clients for this organization
    const clientSharesSnap = await adminDb.collection("organizations").doc(orgId).collection("client_shares").get();
    const clientShares: any[] = [];
    clientSharesSnap.forEach(cDoc => {
      const cData = cDoc.data();
      clientShares.push({
        id: cDoc.id,
        clientEmail: cData.clientEmail || cData.email,
        allowedScopes: cData.allowedScopes || [],
        createdAt: cData.createdAt?.toDate ? cData.createdAt.toDate().toISOString() : cData.createdAt,
        branding: cData.branding || {},
      });
    });

    return NextResponse.json({ org: orgData, staff, clientShares });
  } catch (error: any) {
    console.error("Org Details API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
