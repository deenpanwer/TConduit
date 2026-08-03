import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      reportId,
      errorMessage,
      stackTrace,
      additionalContext,
      deviceInfo,
      appContext,
      userMeta,
      isElectron
    } = body;

    const admin = getFirebaseAdmin();
    if (!admin) {
      console.error('Firebase Admin failed to initialize');
      return NextResponse.json(
        { error: 'Internal server error: Database connection failed' },
        { status: 500 }
      );
    }

    const db = admin.firestore();

    const PUSHOVER_USER = 'up7a9283nbp36s1y58no8qrsmbxsbk';
    const PUSHOVER_TOKEN = 'a6maptij9j7xkv2yrqbc6r98t69c3k';

    // Helper to send pushover notification
    const sendPushoverAlert = async (title: string, userM: any, appC: any, errM: string, contextM: string | null, devI: any, stack: string | null) => {
      try {
        let messageContent = '';

        if (userM) {
          messageContent += `👤 USER: ${userM.name || 'Unknown'} (${userM.email || 'No Email'})\n`;
          messageContent += `• UID: ${userM.uid || 'N/A'}\n`;
          if (userM.role) messageContent += `• Role: ${userM.role}\n`;
          if (userM.orgId) messageContent += `• Org ID: ${userM.orgId}\n`;
          if (userM.companyName) messageContent += `• Company: ${userM.companyName}\n`;
          messageContent += `\n`;
        } else {
          messageContent += `👤 USER: Unknown User\n\n`;
        }

        if (appC && appC.url) {
          messageContent += `📍 LOCATION: ${appC.url}\n\n`;
        }

        messageContent += `💥 ERROR: ${errM || 'Unknown Error'}\n\n`;

        if (contextM && contextM.trim()) {
          messageContent += `📝 USER FEEDBACK:\n"${contextM.trim()}"\n\n`;
        }

        if (devI) {
          messageContent += `📱 DEVICE INFORMATION:\n`;
          if (devI.device) messageContent += `• Device: ${devI.device}\n`;
          if (devI.os) messageContent += `• OS: ${devI.os}\n`;
          if (devI.browser) messageContent += `• Browser: ${devI.browser}\n`;
          if (devI.screen) messageContent += `• Screen: ${devI.screen}\n`;
          if (devI.memory) messageContent += `• Memory: ${devI.memory}\n`;
          if (devI.cpu) messageContent += `• CPU Cores: ${devI.cpu}\n`;
          messageContent += `\n`;
        }

        if (stack) {
          const maxStackLength = 1500;
          const truncatedStack = stack.length > maxStackLength
            ? stack.substring(0, maxStackLength) + '\n... [TRUNCATED]'
            : stack;
          messageContent += `📁 DIAGNOSTIC STACK TRACE:\n${truncatedStack}`;
        }

        const pushoverRes = await fetch('https://api.pushover.net/1/messages.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: AbortSignal.timeout(5000),
          body: new URLSearchParams({
            token: PUSHOVER_TOKEN,
            user: PUSHOVER_USER,
            title: title,
            message: messageContent,
            priority: '1',
            sound: 'falling'
          })
        });

        if (!pushoverRes.ok) {
          console.error('Pushover notification failed:', await pushoverRes.text());
        }
      } catch (pushError) {
        console.error('Error sending Pushover alert:', pushError);
      }
    };

    // CASE 1: Updating an existing error report with a user message
    if (reportId) {
      if (!additionalContext || !additionalContext.trim()) {
        return NextResponse.json({
          success: true,
          message: 'No user message provided; report already submitted automatically.'
        });
      }

      const docRef = db.collection('error-reports').doc(reportId);
      const docSnap = await docRef.get();
      const existingData = docSnap.exists ? docSnap.data() : {};

      const trimmedMsg = additionalContext.trim();

      await docRef.update({
        additionalContext: trimmedMsg,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Re-send Pushover alert ONLY because there is a new user message
      const effectiveUserMeta = userMeta || existingData?.userMeta || null;
      const effectiveAppContext = appContext || existingData?.appContext || null;
      const effectiveErrMsg = errorMessage || existingData?.errorMessage || 'Unknown Error';
      const effectiveDeviceInfo = deviceInfo || existingData?.deviceInfo || null;
      const effectiveStack = stackTrace || existingData?.stackTrace || null;

      await sendPushoverAlert(
        `⚠️ TRAC AI ERROR (User Note Added)`,
        effectiveUserMeta,
        effectiveAppContext,
        effectiveErrMsg,
        trimmedMsg,
        effectiveDeviceInfo,
        effectiveStack
      );

      return NextResponse.json({
        success: true,
        reportId: reportId,
        message: 'User message appended to error report successfully.'
      });
    }

    // CASE 2: New automatic error report submission
    const reportDoc = await db.collection('error-reports').add({
      errorMessage: errorMessage || 'Unknown Error',
      stackTrace: stackTrace || null,
      additionalContext: additionalContext || null,
      deviceInfo: deviceInfo || null,
      appContext: appContext || null,
      userMeta: userMeta || null,
      isElectron: !!isElectron,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        referer: req.headers.get('referer') || 'direct'
      }
    });

    // Send initial Pushover notification
    await sendPushoverAlert(
      `⚠️ TRAC AI ERROR`,
      userMeta,
      appContext,
      errorMessage,
      additionalContext,
      deviceInfo,
      stackTrace
    );

    return NextResponse.json({
      success: true,
      reportId: reportDoc.id,
      message: 'Error report submitted successfully.'
    });

  } catch (error: any) {
    console.error('Error Report API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to process error report. Please try again later.' },
      { status: 500 }
    );
  }
}
