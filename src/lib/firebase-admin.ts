import * as admin from 'firebase-admin';

/**
 * Lazy-initializes the Firebase Admin SDK only when needed.
 * Returns null during build-time or in the browser to prevent crashes.
 */
function getFirebaseAdmin() {
  // 1. Prevent running in the browser
  if (typeof window !== 'undefined') return null;

  // 2. Check for required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // If we are in the build phase, these might be missing. 
    // We return null silently so the module can load without crashing.
    return null;
  }

  // 3. Initialize if not already initialized
  if (!admin.apps.length) {
    try {
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error:', error.message);
      return null;
    }
  }

  return admin;
}

// Export getters that won't crash the build
export const adminDb = getFirebaseAdmin()?.firestore() as admin.firestore.Firestore;
export const adminAuth = getFirebaseAdmin()?.auth() as admin.auth.Auth;