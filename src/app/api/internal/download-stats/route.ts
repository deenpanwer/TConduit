
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();

    // Fetch all download events, ordered by timestamp descending
    const [downloadsSnap, pwaSnap] = await Promise.all([
      adminDb.collection('tracDiaryDownloads').orderBy('timestamp', 'desc').get(),
      adminDb.collection('pwaInstalls').orderBy('timestamp', 'desc').get()
    ]);

    const downloads = downloadsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
      };
    });

    const pwaInstalls = pwaSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
      };
    });

    return NextResponse.json({ 
      count: downloads.length,
      downloads,
      pwaCount: pwaInstalls.length,
      pwaInstalls
    });
  } catch (error: any) {
    console.error('Error fetching download stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
