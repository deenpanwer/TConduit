import { tool } from 'ai';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const createTaskTool = tool({
  description: 'Create a new task and assign it to an employee or the whole team',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
    userId: z.string().describe('The ID of the user creating the task'),
    title: z.string().describe('Task title'),
    description: z.string().describe('Detailed task description'),
    assigneeId: z.string().optional().describe('The ID of the employee to assign to (optional)'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  }),
  execute: async ({ orgId, userId, title, description, assigneeId, priority }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();
    const tasksCollection = db.collection('organizations').doc(orgId).collection('tasks');

    const newTask = {
      title,
      description,
      status: 'todo',
      priority,
      assignees: assigneeId ? [assigneeId] : [],
      subtasks: [],
      resources: [],
      attachments: [],
      voiceNotes: [],
      nestedDescriptions: [],
      images: [],
      comments: [],
      tags: [],
      flagged: false,
      isDeleted: false,
      leaderPoints: 0,
      deadlineHours: 0,
      history: [
          {
              id: Date.now().toString(),
              userId,
              action: 'created',
              details: { title, status: 'todo', description, priority, assigneeId },
              createdAt: new Date().toISOString(),
          }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await tasksCollection.add(newTask);
    return { success: true, taskId: docRef.id, title };
  },
});
