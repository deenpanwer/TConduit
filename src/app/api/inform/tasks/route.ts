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
  console.log('\n--- [Inform Tasks API] Received POST request ---');
  
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
    const { orgId, employeeId, employeeName, type, taskId, taskTitle, details } = payload;

    if (!orgId || !type || !employeeName || !employeeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Find target recipients (Owners, Managers, Founders)
    const db = admin.firestore();
    const recipientsQuery = db.collection('users')
      .where('orgId', '==', orgId)
      .where('role', 'in', ['Owner', 'Manager', 'Founder', 'owner', 'manager', 'founder']);
    
    const ownerQuery = db.collection('users')
      .where('ownedOrgId', '==', orgId);

    const [recipientsSnap, ownersSnap] = await Promise.all([
      recipientsQuery.get(),
      ownerQuery.get()
    ]);

    const recipientDocs = [...recipientsSnap.docs];
    ownersSnap.docs.forEach(doc => {
      if (!recipientDocs.some(rd => rd.id === doc.id)) {
        recipientDocs.push(doc);
      }
    });

    console.log(`[Inform Tasks API] Found ${recipientDocs.length} potential recipients in org ${orgId}.`);

    const notificationPayload = {
      type: 'task_event',
      title: type === 'task_done' ? 'Task Completed' : (type === 'subtask_done' ? 'Subtask Finished' : 'New Task Comment'),
      description: `${employeeName}: ${details || `${taskTitle} updated.`}`,
      data: {
        employeeId,
        taskId,
        type,
        orgId,
        url: `/tasks/${taskId}`
      }
    };

    const pushPromises: Promise<any>[] = [];

    // 4. Filter and Send
    for (const doc of recipientDocs) {
      const userData = doc.data();
      const prefs = userData.notificationPreferences || {};
      
      const globalMute = prefs.globalMute === true;
      const tasksEnabled = prefs.categories?.tasks !== false;
      const isEmployeeMuted = Array.isArray(prefs.mutedEmployees) && prefs.mutedEmployees.includes(employeeId);

      const shouldNotify = !globalMute && tasksEnabled && !isEmployeeMuted;

      if (shouldNotify && userData.pushSubscriptions && Array.isArray(userData.pushSubscriptions)) {
        userData.pushSubscriptions.forEach((sub: any) => {
          pushPromises.push(
            webPush.sendNotification(sub, JSON.stringify(notificationPayload)).catch(() => {})
          );
        });
      }
    }

    await Promise.all(pushPromises);
    return NextResponse.json({ status: 'success', recipientsNotified: recipientDocs.length });

  } catch (error: any) {
    console.error('[Inform Tasks API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
