import { getFirebaseAdmin } from "./firebase-admin";

/**
 * Uploads a file buffer to Firebase Storage and returns a publicly accessible signed URL.
 * 
 * @param buffer - The file data buffer.
 * @param path - The full path in the storage bucket (e.g., "users/{uid}/chats/{chatId}/attachments/{filename}").
 * @param mimeType - The MIME type of the file.
 * @returns The public URL of the uploaded file.
 */
export async function uploadToFirebaseStorage(
  buffer: Buffer,
  path: string,
  mimeType: string
): Promise<string> {
  const admin = getFirebaseAdmin();
  if (!admin) throw new Error("Firebase Admin not initialized");

  const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
  const file = bucket.file(path);

  // Upload the buffer to the specified path
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
    public: true, // Make the file publicly accessible
  });

  // For Firebase Storage, the public URL follows a standard format or we can get a signed URL
  // We'll use a permanent public URL if possible, or a long-lived signed URL.
  // Note: 'public: true' makes it accessible via the media link.
  
  // Alternative: return the standard public URL format
  // https://storage.googleapis.com/{bucket}/{path}
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}
