import { tool } from 'ai';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const listTasksTool = tool({
  description: 'Get a list of tasks in the organization with optional filters',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional().describe('Filter by status'),
    assigneeId: z.string().optional().describe('Filter by assignee ID'),
    limit: z.number().optional().default(20).describe('Limit the number of results'),
  }),
  execute: async ({ orgId, status, assigneeId, limit }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();
    let q = db.collection('organizations').doc(orgId).collection('tasks')
      .where('isDeleted', '==', false);

    if (status) {
      q = q.where('status', '==', status);
    }

    if (assigneeId) {
      q = q.where('assignees', 'array-contains', assigneeId);
    }

    const snapshot = await q.limit(limit).get();
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      status: doc.data().status,
      priority: doc.data().priority,
      assignees: doc.data().assignees,
    }));

    return { success: true, tasks };
  },
});

export const getTaskDetailsTool = tool({
  description: 'Get the full details of a specific task including subtasks, nested notes, and history',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
    taskId: z.string().describe('The ID of the task to retrieve'),
  }),
  execute: async ({ orgId, taskId }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();
    const docRef = db.collection('organizations').doc(orgId).collection('tasks').doc(taskId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: "Task not found" };
    }

    const data = docSnap.data();
    return { success: true, task: { id: docSnap.id, ...data } };
  },
});

export const updateTaskTool = tool({
  description: 'Update an existing task with granular changes (internal use or after approval)',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
    taskId: z.string().describe('The ID of the task to update'),
    userId: z.string().describe('The ID of the user performing the update'),
    updates: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      assignees: z.array(z.string()).optional(),
      subtasks: z.array(z.any()).optional(),
      deadlineHours: z.number().optional(),
      leaderPoints: z.number().optional(),
    }).describe('The fields to update'),
  }),
  execute: async ({ orgId, taskId, userId, updates }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();
    const taskRef = db.collection('organizations').doc(orgId).collection('tasks').doc(taskId);

    const docSnap = await taskRef.get();
    if (!docSnap.exists) return { success: false, error: "Task not found" };

    const currentTask = docSnap.data() || {};

    const historyEntry = {
      id: Date.now().toString(),
      userId,
      action: 'updated',
      details: updates,
      createdAt: new Date().toISOString(),
    };

    const finalUpdates = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      history: admin.firestore.FieldValue.arrayUnion(historyEntry),
    };

    await taskRef.update(finalUpdates);
    return { success: true, taskId, title: updates.title || currentTask.title };
  },
});

export const proposeTaskActionTool = tool({
  description: 'Propose a task-related action (create, update, or delete) for human approval',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
    userId: z.string().describe('The ID of the user proposing the action'),
    actionType: z.enum(['create', 'update', 'delete']).describe('The type of action'),
    taskId: z.string().optional().describe('The target task ID (required for update/delete)'),
    params: z.any().describe('The arguments for the action (e.g., task details or updates)'),
    reason: z.string().optional().describe('Reason for this proposal'),
  }),
  execute: async ({ orgId, userId, actionType, taskId, params, reason }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();
    const proposalsRef = db.collection('organizations').doc(orgId).collection('proposals');

    const proposal = {
      type: actionType,
      status: 'pending',
      targetId: taskId || null,
      payload: params,
      reason: reason || null,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await proposalsRef.add(proposal);

    return {
      success: true,
      approvalId: docRef.id,
      type: 'approval_required',
      actionType,
      message: `I have created a proposal for ${actionType} action. Please approve or reject it.`
    };
  },
});

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
