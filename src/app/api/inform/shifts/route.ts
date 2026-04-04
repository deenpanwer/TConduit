import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import webPush from 'web-push';

// Configure VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:info@traconomics.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[Inform Shifts API] VAPID keys not set. Push notifications are disabled.');
}

export async function POST(request: NextRequest) {
  console.log('\n--- [Inform Shifts API] Received POST request ---');
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Internal Server Error: Firebase Admin not ready' }, { status: 500 });
  }

  try {
    // 1. Authenticate the Employee (Reporter)
    const decodedToken = await admin.auth().verifyIdToken(token);
    const reporterUid = decodedToken.uid;
    console.log(`[Inform Shifts API] Authenticated reporter: ${reporterUid}`);

    // 2. Parse and Validate Payload
    const payload = await request.json();
    const { orgId, type, employeeName, employeeId, details } = payload;

    if (!orgId || !type || !employeeName || !employeeId) {
      return NextResponse.json({ error: 'Missing required fields in payload' }, { status: 400 });
    }

    // 3. Find target recipients (Owners, Managers, Founders)
    const db = admin.firestore();
    const recipientsQuery = db.collection('users')
      .where('orgId', '==', orgId)
      .where('role', 'in', ['Owner', 'Manager', 'Founder', 'owner', 'manager', 'founder']);
    
    // Also include those where ownedOrgId == orgId (Owners)
    const ownerQuery = db.collection('users')
      .where('ownedOrgId', '==', orgId);

    const [recipientsSnap, ownersSnap] = await Promise.all([
      recipientsQuery.get(),
      ownerQuery.get()
    ]);

    const recipientDocs = [...recipientsSnap.docs];
    // Add owners from ownedOrgId query if not already present
    ownersSnap.docs.forEach(doc => {
      if (!recipientDocs.some(rd => rd.id === doc.id)) {
        recipientDocs.push(doc);
      }
    });

    console.log(`[Inform Shifts API] Found ${recipientDocs.length} potential recipients in org ${orgId}.`);

    const notificationPayload = {
      type: 'shift_event',
      title: type === 'leave_request' ? 'New Leave Request' : 'New Shift Claim',
      description: `${employeeName}: ${details || (type === 'leave_request' ? 'Applied for leave.' : 'Claimed an open shift.')}`,
      data: {
        employeeId,
        type,
        orgId,
        url: '/dashboard/shifts'
      }
    };

    const pushPromises: Promise<any>[] = [];

    // 4. Filter based on preferences and send push
    for (const doc of recipientDocs) {
      const userData = doc.data();
      const prefs = userData.notificationPreferences || {};
      
      // Default Logic: If field is missing, default to TRUE (except globalMute which defaults to false)
      const globalMute = prefs.globalMute === true; // Default false
      const shiftsEnabled = prefs.categories?.shifts !== false; // Default true
      const isEmployeeMuted = Array.isArray(prefs.mutedEmployees) && prefs.mutedEmployees.includes(employeeId);

      const shouldNotify = !globalMute && shiftsEnabled && !isEmployeeMuted;

      if (shouldNotify && userData.pushSubscriptions && Array.isArray(userData.pushSubscriptions)) {
        console.log(`[Inform Shifts API] Dispatching to ${userData.name || doc.id} (${userData.pushSubscriptions.length} subscriptions).`);
        
        userData.pushSubscriptions.forEach((sub: any) => {
          pushPromises.push(
            webPush.sendNotification(sub, JSON.stringify(notificationPayload))
              .catch(err => {
                console.error(`[Inform Shifts API] Failed to send push to ${doc.id}:`, err.statusCode === 410 ? 'Subscription expired/removed' : err);
                // Optionally: Remove expired subscriptions from Firestore here
              })
          );
        });
      } else {
        console.log(`[Inform Shifts API] Skipping ${userData.name || doc.id} (Muted or no subscriptions).`);
      }
    }

    await Promise.all(pushPromises);
    console.log('[Inform Shifts API] Dispatch cycle complete.');

    return NextResponse.json({ status: 'success', recipientsNotified: recipientDocs.length });

  } catch (error: any) {
    console.error('[Inform Shifts API] Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
