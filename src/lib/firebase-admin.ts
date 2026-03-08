import * as admin from 'firebase-admin';

function getDb() {
  if (!admin.apps.length) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const formattedPrivateKey = privateKey ? privateKey.replace(/\\n/g, '\n') : undefined;

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedPrivateKey,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
  return admin.firestore();
}

function getAuth() {
  if (!admin.apps.length) getDb(); // Triggers init
  return admin.auth();
}

export const adminDb = typeof window === 'undefined' ? getDb() : null as any;
export const adminAuth = typeof window === 'undefined' ? getAuth() : null as any;
