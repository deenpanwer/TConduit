
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();

    const body = await req.json();
    const { selectedVerticals, metadata: clientMetadata } = body;

    if (!selectedVerticals || !Array.isArray(selectedVerticals)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const docRef = await adminDb.collection('yc').add({
      selectedVerticals,
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        userAgent: req.headers.get('user-agent'),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        referer: req.headers.get('referer'),
        geo: {
            country: req.headers.get('x-vercel-ip-country'),
            region: req.headers.get('x-vercel-ip-country-region'),
            city: req.headers.get('x-vercel-ip-city'),
        },
        ...(clientMetadata || {}),
      },
    });

    return NextResponse.json({ success: true, docId: docRef.id });
  } catch (error) {
    console.error('Error in /api/yc route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
