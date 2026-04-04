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
}

export async function POST(request: NextRequest) {
  console.log('\n--- [Inform Chats API] Received POST request ---');
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  try {
    // 1. Authenticate the Employee (Reporter)
    const decodedToken = await admin.auth().verifyIdToken(token);
    const reporterUid = decodedToken.uid;

    // 2. Parse and Validate Payload
    const payload = await request.json();
    const { orgId, employeeId, employeeName, type, recipientId, details } = payload;

    if (!orgId || !type || !employeeName || !employeeId || !recipientId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Find target recipient document (Specified by recipientId)
    const db = admin.firestore();
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    
    if (!recipientDoc.exists) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
    }

    const userData = recipientDoc.data() || {};
    const prefs = userData.notificationPreferences || {};
    
    // Check if the recipient belongs to the same org for security
    const belongsToOrg = userData.orgId === orgId || userData.ownedOrgId === orgId;
    if (!belongsToOrg) {
      return NextResponse.json({ error: 'Recipient not in organization' }, { status: 403 });
    }

    // 4. Filter by Preferences
    const globalMute = prefs.globalMute === true;
    const chatsEnabled = prefs.categories?.chats !== false;
    const isEmployeeMuted = Array.isArray(prefs.mutedEmployees) && prefs.mutedEmployees.includes(employeeId);

    const shouldNotify = !globalMute && chatsEnabled && !isEmployeeMuted;

    if (shouldNotify && userData.pushSubscriptions && Array.isArray(userData.pushSubscriptions)) {
      console.log(`[Inform Chats API] Dispatching to ${userData.name || recipientId}.`);

      const notificationPayload = {
        type: 'chat_event',
        title: `Message from ${employeeName}`,
        description: details || 'Sent a direct message.',
        data: {
          employeeId,
          type,
          orgId,
          url: `/dashboard/chat?id=${employeeId}`
        }
      };

      const pushPromises = userData.pushSubscriptions.map((sub: any) => 
        webPush.sendNotification(sub, JSON.stringify(notificationPayload)).catch(() => {})
      );

      await Promise.all(pushPromises);
      return NextResponse.json({ status: 'success', notified: true });
    } else {
      console.log(`[Inform Chats API] Skipping ${userData.name || recipientId} due to preferences or no subscriptions.`);
      return NextResponse.json({ status: 'success', notified: false });
    }

  } catch (error: any) {
    console.error('[Inform Chats API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
