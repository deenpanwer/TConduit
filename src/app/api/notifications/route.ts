
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { auth } from 'firebase-admin';
import webPush from 'web-push';

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:info@traconomics.com', // Replace with your contact email
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[Notifications API] VAPID keys not set. Push notifications are disabled.');
}

interface UserData {
    uid: string;
    ownedOrgId?: string;
    pushSubscriptions?: webPush.PushSubscription[];
    [key: string]: any;
}

async function getUserFromSession(session: string): Promise<UserData | null> {
  try {
    const decodedToken = await auth().verifySessionCookie(session, true);
    const adminDb = getFirebaseAdmin()!.firestore();
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (userDoc.exists) {
      return { uid: userDoc.id, ...userDoc.data() } as UserData;
    }
    console.log('[Notifications API] User document not found for UID:', decodedToken.uid);
    return null;
  } catch (error) {
    console.error('[Notifications API] Session verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('\n--- [Notifications API] Received GET request ---');
  const admin = getFirebaseAdmin();
  
  // --- FIX: Correctly get the cookie from the store ---
  const cookieStore = cookies();
  const session = (await cookieStore).get('__session')?.value;

  if (!admin || !session) {
    console.log('[Notifications API] Unauthorized: Admin SDK not ready or session cookie missing.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[Notifications API] Session cookie found.');

  const userData = await getUserFromSession(session);

  if (!userData || !userData.ownedOrgId || !userData.uid) {
    console.log('[Notifications API] Aborting: User data or org ID not found.', { uid: userData?.uid, orgId: userData?.ownedOrgId });
    return NextResponse.json({ error: 'User or organization not found' }, { status: 403 });
  }
  console.log(`[Notifications API] Authenticated user ${userData.uid} for org ${userData.ownedOrgId}.`);

  try {
    const adminDb = admin.firestore();
    const inAppNotifications: any[] = [];
    const batch = adminDb.batch();

    const messagesQuery = adminDb.collectionGroup('messages')
      .where('orgId', '==', userData.ownedOrgId)
      .where('notified', '==', false)
      .orderBy('timestamp', 'desc');

    console.log('[Notifications API] Querying for new messages...');
    const messageSnapshot = await messagesQuery.get();
    console.log(`[Notifications API] Found ${messageSnapshot.size} potential new message(s).`);

    if (messageSnapshot.empty) {
      console.log('[Notifications API] No new messages to process. Exiting.');
      return NextResponse.json({ notifications: [] });
    }

    for (const doc of messageSnapshot.docs) {
      const message = doc.data();
      
      if (message.senderId !== userData.uid) {
        console.log(`[Notifications API] Found a message for user ${userData.uid} from sender ${message.senderId}.`);
        const employeeDoc = await adminDb.collection('users').doc(message.senderId).get();
        const employeeName = employeeDoc.exists ? employeeDoc.data()?.name : 'An employee';

        const notificationPayload = {
            type: 'new_message',
            title: `New Message from ${employeeName}`,
            description: message.text,
        };

        inAppNotifications.push(notificationPayload);

        if (userData.pushSubscriptions && Array.isArray(userData.pushSubscriptions) && userData.pushSubscriptions.length > 0) {
          console.log(`[Notifications API] User has ${userData.pushSubscriptions.length} push subscriptions. Preparing to send push notifications.`);
          const pushPromises = userData.pushSubscriptions.map(subscription => 
              webPush.sendNotification(subscription, JSON.stringify(notificationPayload))
                .then(() => console.log(`[Notifications API] Successfully sent push to an endpoint.`))
                .catch(error => {
                    console.error(`[Notifications API] Push notification failed for ${userData.uid}:`, error.body);
                })
          );
          await Promise.all(pushPromises);
        } else {
          console.log('[Notifications API] User has no push subscriptions. Skipping push notification.');
        }

        batch.update(doc.ref, { notified: true });
      } else {
        // This case is for messages sent BY the current user. We just mark them as notified.
        batch.update(doc.ref, { notified: true });
      }
    }

    await batch.commit();
    console.log('[Notifications API] Batch commit successful. Sending in-app notifications to client.');
    console.log('--- [Notifications API] Request finished ---');
    return NextResponse.json({ notifications: inAppNotifications });

  } catch (error) {
    console.error('[Notifications API] A critical error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
