import { tool } from 'ai';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const listEmployeesTool = tool({
  description: 'Get the list of all employees in the organization',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
    department: z.string().optional().describe('Filter by department'),
  }),
  execute: async ({ orgId, department }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();
    let q = db.collection('users').where('orgId', '==', orgId);

    if (department) {
      q = q.where('department', '==', department);
    }

    const snapshot = await q.get();
    const employees = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter((p: any) => p.active !== false);

    return employees.map((e: any) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      department: e.department
    }));
  },
});
