import { tool } from 'ai';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const getOrganizationDetailsTool = tool({
  description: 'Get details about the organization including its name, invite code, subscription status, and creation date.',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
  }),
  execute: async ({ orgId }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();
    const docRef = db.collection('organizations').doc(orgId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: "Organization not found" };
    }

    const data = docSnap.data();
    if (!data) return { success: false, error: "No organization data found" };

    // Safely extract dates
    const getDateString = (val: any) => {
      if (!val) return undefined;
      if (val.toDate) return val.toDate().toISOString();
      if (val instanceof Date) return val.toISOString();
      if (val.seconds) return new Date(val.seconds * 1000).toISOString();
      return new Date(val).toISOString();
    };

    return {
      id: docSnap.id,
      name: data.orgName || data.name || "Unknown Organization",
      inviteCode: data.inviteCode || "No invite code generated",
      subscriptionExpiry: getDateString(data.subscriptionExpiry),
      createdAt: getDateString(data.createdAt),
      showDummyData: !!data.showDummyData,
    };
  },
});
