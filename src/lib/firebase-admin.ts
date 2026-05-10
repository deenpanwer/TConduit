import * as admin from 'firebase-admin';

/**
 * Lazy-initializes the Firebase Admin SDK only when needed.
 * This function should be called within server-side functions (e.g., API routes)
 * to ensure environment variables are loaded.
 * Returns the admin instance or null if initialization fails.
 */
export function getFirebaseAdmin() {
  // 1. Prevent running in the browser
  if (typeof window !== 'undefined') {
    console.error("getFirebaseAdmin should not be called in the browser.");
    return null;
  }

  // 2. Check if already initialized
  if (admin.apps.length > 0) {
    return admin;
  }

  // 3. Check for required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace escaped newlines in the private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
    return null;
  }

  // 4. Initialize the app
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: `https://${projectId}.firebaseio.com`,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
    return admin;
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    return null;
  }
}