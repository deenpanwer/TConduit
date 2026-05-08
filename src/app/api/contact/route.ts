import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message, company, phone } = body;

    const admin = getFirebaseAdmin();
    if (!admin) {
      console.error('Firebase Admin failed to initialize');
      return NextResponse.json(
        { error: 'Internal server error: Database connection failed' },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    
    // Store in root collection 'public-contact'
    const leadDoc = await db.collection('public-contact').add({
      name,
      email,
      subject: subject || 'New Website Inquiry',
      message,
      company: company || 'N/A',
      phone: phone || 'N/A',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
      metadata: {
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        referer: req.headers.get('referer') || 'direct'
      }
    });

    // Send Emergency Pushover Notification
    try {
      const PUSHOVER_USER = 'uj9fnutvd6k69fjmc3h86kqta1rck3';
      const PUSHOVER_TOKEN = 'airu99cyutatoy28gm1mtmt6atjmfx';

      const pushoverRes = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: PUSHOVER_TOKEN,
          user: PUSHOVER_USER,
          title: `NEW LEAD: ${name || 'Anonymous'}`,
          message: `Subject: ${subject || 'No Subject'}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nCompany: ${company || 'N/A'}\n\nMessage: ${message || 'No content'}`,
          priority: '2', // Emergency priority
          retry: '30',   // Retry every 30 seconds
          expire: '3600', // Keep retrying for 1 hour
          sound: 'persistent' // Loud, repeating sound
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
      message: 'Your message has been received. We will get back to you shortly.' 
    });

  } catch (error: any) {
    console.error('Contact API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again later.' },
      { status: 500 }
    );
  }
}
