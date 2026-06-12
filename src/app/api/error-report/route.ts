import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      errorMessage,
      stackTrace,
      additionalContext,
      deviceInfo,
      appContext,
      userMeta
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

    // Store in root collection 'error-reports'
    const reportDoc = await db.collection('error-reports').add({
      errorMessage: errorMessage || 'Unknown Error',
      stackTrace: stackTrace || null,
      additionalContext: additionalContext || null,
      deviceInfo: deviceInfo || null,
      appContext: appContext || null,
      userMeta: userMeta || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        referer: req.headers.get('referer') || 'direct'
      }
    });

    // Send Emergency Pushover Notification
    try {
      const PUSHOVER_USER = 'ugshfubjs4igoqvk1s16o6ycdskoqz';
      const PUSHOVER_TOKEN = 'a1mhx6fgw5qmn3gebsbwi9a1d1wbo8';

      // Build structured notification body with high priority fields at the top
      let messageContent = '';

      // 1. User Identification (highest priority)
      if (userMeta) {
        messageContent += `👤 USER: ${userMeta.name || 'Unknown'} (${userMeta.email || 'No Email'})\n`;
        messageContent += `• UID: ${userMeta.uid || 'N/A'}\n`;
        if (userMeta.role) messageContent += `• Role: ${userMeta.role}\n`;
        messageContent += `\n`;
      } else {
        messageContent += `👤 USER: Unknown User\n\n`;
      }

      // 2. Error Location
      if (appContext && appContext.url) {
        messageContent += `📍 LOCATION: ${appContext.url}\n\n`;
      }

      // 3. Error Details
      messageContent += `💥 ERROR: ${errorMessage || 'Unknown Error'}\n\n`;

      // 4. User Feedback / Comments
      if (additionalContext && additionalContext.trim()) {
        messageContent += `📝 USER FEEDBACK:\n"${additionalContext.trim()}"\n\n`;
      }

      // 5. Device Information
      if (deviceInfo) {
        messageContent += `📱 DEVICE INFORMATION:\n`;
        if (deviceInfo.device) messageContent += `• Device: ${deviceInfo.device}\n`;
        if (deviceInfo.os) messageContent += `• OS: ${deviceInfo.os}\n`;
        if (deviceInfo.browser) messageContent += `• Browser: ${deviceInfo.browser}\n`;
        if (deviceInfo.screen) messageContent += `• Screen: ${deviceInfo.screen}\n`;
        if (deviceInfo.memory) messageContent += `• Memory: ${deviceInfo.memory}\n`;
        if (deviceInfo.cpu) messageContent += `• CPU Cores: ${deviceInfo.cpu}\n`;
        messageContent += `\n`;
      }

      // 6. Call Stack Trace
      if (stackTrace) {
        // Truncate stack trace to not exceed Pushover message limit (5120 chars total)
        const maxStackLength = 1500;
        const truncatedStack = stackTrace.length > maxStackLength
          ? stackTrace.substring(0, maxStackLength) + '\n... [TRUNCATED]'
          : stackTrace;
        messageContent += `📁 DIAGNOSTIC STACK TRACE:\n${truncatedStack}`;
      }

      const pushoverRes = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: PUSHOVER_TOKEN,
          user: PUSHOVER_USER,
          title: `⚠️ TRAC AI ERROR`,
          message: messageContent,
          priority: '1', // High priority, bypasses quiet hours but not alarm-level repeating
          sound: 'falling' // Unique attention-grabbing sound for errors
        })
      });

      if (!pushoverRes.ok) {
        console.error('Pushover notification failed:', await pushoverRes.text());
      }
    } catch (pushError) {
      console.error('Error sending Pushover alert:', pushError);
    }

    return NextResponse.json({
      success: true,
      message: 'Error report submitted successfully. Thank you for your feedback!'
    });

  } catch (error: any) {
    console.error('Error Report API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to process error report. Please try again later.' },
      { status: 500 }
    );
  }
}
