
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();

    const body = await request.json();
    const { platform, deviceCapabilities } = body;

    // Try multiple sources for IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : (request.headers.get('x-real-ip') || (request as any).ip || 'N/A');

    // Robust Geo-extraction (works best on Vercel)
    const geo = {
      city: request.headers.get('x-vercel-ip-city') || (request as any).geo?.city || 'N/A',
      country: request.headers.get('x-vercel-ip-country') || (request as any).geo?.country || 'N/A',
      region: request.headers.get('x-vercel-ip-country-region') || (request as any).geo?.region || 'N/A',
      latitude: request.headers.get('x-vercel-ip-latitude') || (request as any).geo?.latitude || 'N/A',
      longitude: request.headers.get('x-vercel-ip-longitude') || (request as any).geo?.longitude || 'N/A',
    };

    const userAgent = request.headers.get('user-agent') || 'N/A';

    const pwaEvent = {
      timestamp: FieldValue.serverTimestamp(),
      platform: platform || 'N/A',
      ip,
      geo,
      userAgent,
      ...(deviceCapabilities || {}), // Merge browser-collected info
    };

    // Add a new document to the pwaInstalls collection
    await adminDb.collection('pwaInstalls').add(pwaEvent);

    return NextResponse.json({ success: true, message: 'PWA installation event logged' });
  } catch (error) {
    console.error('Error logging PWA installation event:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
