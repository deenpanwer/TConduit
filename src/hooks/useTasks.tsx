"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  increment as firestoreIncrement,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "./use-auth";
import { requestNotificationPermission, sendBrowserNotification, subscribeUserToPush } from "@/lib/notifications";
import { toast } from "sonner";
import { getISOWeek, getYear } from "date-fns";

// --- 1. Types & Constants ---

export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "todo" | "in_progress" | "review" | "done";

export interface Draft {
  id: string; // Temporary ID starting with 'draft_'
  title: string;
  status: Status;
  parentId?: string; // For subtasks, notes, etc.
  groupId?: string; // Group/Bucket the draft belongs to
  type?: 'task' | 'subtask' | 'resource' | 'image' | 'voiceNote' | 'nestedDescription';
  createdAt: number;
  
  // Optional task fields for full task drafts
  description?: string;
  priority?: Priority;
  assignees?: string[];
  dueDate?: string;
  coverImage?: string;
  leaderPoints?: number;
  deadlineHours?: number;
  subtasks?: Subtask[];
  resources?: Resource[];
  attachments?: Attachment[];
  voiceNotes?: Attachment[];
  nestedDescriptions?: NestedDescription[];
  images?: NestedImage[];
  comments?: Comment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size: number; // bytes
  duration?: number; // optional duration for media files
  createdAt: any;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string | null; 
  pointsAwarded?: number; // The exact points given for this subtask
  descriptions?: NestedDescription[];
  resources?: Resource[];
  images?: NestedImage[];
  subtasks?: Subtask[];
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: any;
}

export interface NestedDescription {
  id: string;
  text: string;
  createdAt: any;
}

export interface NestedImage {
  id: string;
  title: string;
  url: string;
  createdAt: any;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  createdAt: any;
  descriptions?: NestedDescription[];
  images?: NestedImage[];
}

export interface TaskGroup {
  id: string;
  name: string;
  order: number;
  createdAt: any;
}

export interface HistoryEntry {
    id: string;
    userId: string;
    action: string;
    details: any;
    createdAt: any;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignees: string[]; 
  dueDate?: string;
  coverImage?: string;
  tags: string[];
  subtasks: Subtask[];
  resources?: Resource[];
  attachments?: Attachment[];
  voiceNotes?: Attachment[];
  nestedDescriptions?: NestedDescription[];
  images?: NestedImage[];
  comments: Comment[];
  history: HistoryEntry[];
  flagged?: boolean;
  groupId?: string;
  isDeleted?: boolean;
  leaderPoints?: number; // Total points for this task
  deadlineHours?: number; // Estimated hours to complete
  flaggedPointsAwarded?: number; // Points given for final completion
  createdAt: any;
  updatedAt: any;
}

// --- 2. State Management (Reducer) ---

type Action =
  | { type: "SET_TASKS"; tasks: Task[] }
  | { type: "ADD_OR_UPDATE_TASK"; task: Task }
  | { type: "DELETE_TASK"; taskId: string };

const taskReducer = (state: Task[], action: Action): Task[] => {
  switch (action.type) {
    case "SET_TASKS":
      return action.tasks;
    case "ADD_OR_UPDATE_TASK":
      const existingIndex = state.findIndex((t) => t.id === action.task.id);
      if (existingIndex > -1) {
        const newState = [...state];
        newState[existingIndex] = action.task;
        return newState;
      }
      return [...state, action.task];
    case "DELETE_TASK":
      return state.filter((t) => t.id !== action.taskId);
    default:
      return state;
  }
};

// --- 3. Context Definition ---

interface TasksContextType {
  tasks: Task[];
  groups: TaskGroup[];
  loading: boolean;
  drafts: Draft[];
  hasPending: boolean;
  updateDraft: (id: string, updates: Partial<Draft>) => void;
  deleteDraft: (id: string) => void;
  finalizeDraft: (id: string) => Promise<string | null>;
  addTask: (
    title: string, 
    status: Status, 
    description?: string, 
    priority?: Priority, 
    assignees?: string[], 
    leaderPoints?: number, 
    deadlineHours?: number,
    subtasks?: Subtask[],
    resources?: Resource[],
    attachments?: Attachment[],
    voiceNotes?: Attachment[],
    nestedDescriptions?: NestedDescription[],
    images?: NestedImage[],
    groupId?: string
  ) => Promise<string | null>;
  updateTask: (taskId: string, updates: Partial<Task>, action?: string, skipHistory?: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  bulkUpdateTasks: (updates: Record<string, Partial<Task>>, actionName?: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  addTaskGroup: (name: string) => Promise<string | null>;
  updateTaskGroup: (groupId: string, updates: Partial<TaskGroup>) => Promise<void>;
  deleteTaskGroup: (groupId: string) => Promise<void>;
  canManageTasks: boolean;
  isSyncing: boolean;
}

const TasksContext = createContext<TasksContextType>({
  tasks: [],
  groups: [],
  loading: true,
  drafts: [],
  hasPending: false,
  updateDraft: () => {},
  deleteDraft: () => {},
  finalizeDraft: async () => null,
  addTask: async () => null,
  updateTask: async () => {},
  deleteTask: async () => {},
  bulkUpdateTasks: async () => {},
  addComment: async () => {},
  addTaskGroup: async () => null,
  updateTaskGroup: async () => {},
  deleteTaskGroup: async () => {},
  canManageTasks: false,
  isSyncing: false,
});

// --- 4. Provider Component ---

const SYNC_STORAGE_KEY = 'trac_pending_task_syncs';
const DRAFTS_STORAGE_KEY = 'trac_ghost_drafts';

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user, userData, loading: authLoading } = useAuth();
  const [remoteTasks, dispatch] = useReducer(taskReducer, []);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Partial<Task>>>({});
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const hasPending = useMemo(() => Object.keys(pendingUpdates).length > 0, [pendingUpdates]);

  // Optimistic UI: Merge remote tasks + local pending updates + ghost drafts
  const tasks = useMemo(() => {
    // 1. Process remote tasks with pending updates
    const mergedRemote = remoteTasks.map((task: Task) => {
        const pending = pendingUpdates[task.id];
        if (pending) {
            return { ...task, ...pending };
        }
        return task;
    });

    // 2. Filter out deleted tasks
    const activeTasks = mergedRemote.filter(t => !t.isDeleted);

    // 3. For now, we only return Task objects. Drafts will be handled separately in the UI 
    // or we can wrap them in a Task-like structure. 
    // Let's keep them separate but provided via context for the QuickAdd rows to show them.
    return activeTasks;
  }, [remoteTasks, pendingUpdates]);

  const orgId = userData?.ownedOrgId || userData?.orgId;
  const userRole = userData?.role?.toLowerCase();
  const canManageTasks = userRole === 'owner' || userRole === 'manager' || userRole === 'founder' || userRole === 'hr' || userRole === 'ops';

  // Load drafts and pending updates from localStorage
  useEffect(() => {
    const savedPending = localStorage.getItem(SYNC_STORAGE_KEY);
    if (savedPending) {
        try { setPendingUpdates(JSON.parse(savedPending)); } catch (e) {}
    }
    const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (savedDrafts) {
        try { setDrafts(JSON.parse(savedDrafts)); } catch (e) {}
    }
  }, []);

  // Persist drafts to localStorage
  useEffect(() => {
    if (drafts.length > 0) {
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } else {
        localStorage.removeItem(DRAFTS_STORAGE_KEY);
    }
  }, [drafts]);

  const updateDraft = useCallback((id: string, updates: Partial<Draft>) => {
    setDrafts(prev => {
        const existing = prev.find(d => d.id === id);
        
        // Helper to check if a draft has meaningful content
        const hasContent = (d: Partial<Draft>) => {
            return !!(
                (d.title && d.title.trim().length > 0) || 
                (d.description && d.description.trim().length > 0) || 
                (d.voiceNotes && d.voiceNotes.length > 0) || 
                (d.attachments && d.attachments.length > 0) ||
                (d.subtasks && d.subtasks.length > 0) ||
                (d.resources && d.resources.length > 0) ||
                (d.images && d.images.length > 0) ||
                (d.nestedDescriptions && d.nestedDescriptions.length > 0)
            );
        };

        if (existing) {
            const next = { ...existing, ...updates };
            // If it becomes completely empty, remove it (Ghost logic)
            if (!hasContent(next)) {
                return prev.filter(d => d.id !== id);
            }
            return prev.map(d => d.id === id ? next : d);
        }

        // For new drafts, only create if they have content
        if (!hasContent(updates)) {
            return prev;
        }

        const type = updates.type || 'task';
        return [...prev, { 
            id, 
            title: '', 
            status: 'todo', 
            type, 
            createdAt: Date.now(), 
            ...updates 
        }];
    });
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  }, []);

  const addTask = useCallback(
    async (
      title: string, 
      status: Status, 
      description: string = "", 
      priority: Priority = "medium", 
      assignees: string[] = [],
      leaderPoints: number = 0,
      deadlineHours: number = 0,
      subtasks: Subtask[] = [],
      resources: Resource[] = [],
      attachments: Attachment[] = [],
      voiceNotes: Attachment[] = [],
      nestedDescriptions: NestedDescription[] = [],
      images: NestedImage[] = [],
      groupId?: string
    ): Promise<string | null> => {
      console.log("useTasks: addTask called", { title, status, orgId, userId: user?.uid, canManageTasks, groupId });
      
      if (!orgId || !user) {
        console.error("useTasks: Missing orgId or user");
        return null;
      }
      if (!canManageTasks) {
        console.error("useTasks: User does not have permission to manage tasks");
        return null;
      }

      const deepClean = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map((v: any) => deepClean(v));
        } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
          return Object.entries(obj).reduce((acc: any, [key, value]) => {
            if (value !== undefined) acc[key] = deepClean(value);
            return acc;
          }, {} as any);
        }
        return obj === undefined ? null : obj;
      };
  
      const rawTask: any = {
        title,
        description,
        status,
        priority,
        assignees,
        subtasks,
        resources,
        attachments,
        voiceNotes,
        nestedDescriptions,
        images,
        groupId,
        comments: [],
        tags: [],
        flagged: false,
        isDeleted: false,
        leaderPoints,
        deadlineHours,
        history: [
            {
                id: Date.now().toString(),
                userId: user.uid,
                action: 'created',
                details: { title, status, description, priority, assignees, leaderPoints, deadlineHours, subtasksCount: subtasks.length, resourcesCount: resources.length, attachmentsCount: attachments.length, voiceNotesCount: voiceNotes.length, nestedDescriptionsCount: nestedDescriptions.length, imagesCount: images.length, groupId },
                createdAt: new Date(),
            }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      };

      const newTask = deepClean(rawTask);

      try {
        const tasksCollection = collection(db, "organizations", orgId, "tasks");
        const docRef = await addDoc(tasksCollection, newTask);
        console.log("useTasks: Task created successfully", docRef.id);

        // Notify assignees (if any) about the new task
        if (assignees.length > 0) {
          assignees.forEach(assigneeId => {
            if (assigneeId !== user.uid) {
               fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: assigneeId,
                        title: `New task assigned: "${title}"`,
                        body: `Priority: ${priority}`,
                        data: { taskId: docRef.id }
                    })
                });
            }
          });
        }

        return docRef.id;
      } catch (error) {
        console.error("useTasks: Error adding task:", error);
        return null;
      }
    },
    [orgId, user, canManageTasks]
  );

  const finalizeDraft = useCallback(async (id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (!draft || !draft.title.trim()) {
        setDrafts(prev => prev.filter(d => d.id !== id));
        return null;
    }

    // Check if it's a main task or a sub-item
    if (draft.parentId) {
        // Sub-items are finalized by the component that owns them (HierarchicalUI)
        // This function will just return the draft ID to signify "ready to finalize"
        return id;
    }

    const taskId = await addTask(
        draft.title.trim(), 
        draft.status,
        draft.description || "",
        draft.priority || "medium",
        draft.assignees || [],
        draft.leaderPoints || 0,
        draft.deadlineHours || 0,
        draft.subtasks || [],
        draft.resources || [],
        draft.attachments || [],
        draft.voiceNotes || [],
        draft.nestedDescriptions || [],
        draft.images || [],
        draft.groupId
    );
    
    if (taskId) {
        setDrafts(prev => prev.filter(d => d.id !== id));
    }
    return taskId;
  }, [drafts, addTask]);

  // Flush pending updates to Firestore
  const flushUpdates = useCallback(async (updatesToFlush: Record<string, Partial<Task>>) => {
    if (!orgId || !user || Object.keys(updatesToFlush).length === 0) return;

    setIsSyncing(true);
    const batch = writeBatch(db);
    const now = serverTimestamp();

    for (const [taskId, updates] of Object.entries(updatesToFlush)) {
        const taskDocRef = doc(db, "organizations", orgId, "tasks", taskId);
        
        // We need to handle history and other logic for each task
        // For simplicity in the batch, we just update the fields and updatedAt.
        // Complex logic (like points) might need more care if we want it perfect in bulk.
        
        const finalUpdates = Object.entries(updates).reduce((acc: any, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
        }, {} as any);

        batch.update(taskDocRef, {
            ...finalUpdates,
            updatedAt: now
        });
    }

    try {
        await batch.commit();
        // Remove successfully flushed updates from pending
        setPendingUpdates(prev => {
            const next = { ...prev };
            for (const taskId in updatesToFlush) {
                delete next[taskId];
            }
            return next;
        });
    } catch (error) {
        console.error("Error flushing task updates:", error);
    } finally {
        setIsSyncing(false);
    }
  }, [orgId, user]);

  // Debounced Syncing
  useEffect(() => {
    if (Object.keys(pendingUpdates).length === 0) return;

    const timeoutId = setTimeout(() => {
        flushUpdates(pendingUpdates);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [pendingUpdates, flushUpdates]);

  // Flush on tab close or background
  useEffect(() => {
    const handleFlush = () => {
        if (Object.keys(pendingUpdates).length > 0) {
            flushUpdates(pendingUpdates);
        }
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            handleFlush();
        }
    };

    window.addEventListener('beforeunload', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
        window.removeEventListener('beforeunload', handleFlush);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pendingUpdates, flushUpdates]);

  const awardPointsToUser = useCallback(async (userId: string, points: number, taskId: string, taskTitle: string, details: string, type: 'subtask' | 'full_completion') => {
    if (points === 0) return;
    
    const now = new Date();
    const year = getYear(now).toString();
    const weekNumber = getISOWeek(now);
    const weekKey = `week_${weekNumber}`;

    const userPointsRef = doc(db, "users", userId, "points_ledger", year, "weeks", weekKey);

    try {
        await setDoc(userPointsRef, {
            totalPoints: firestoreIncrement(points),
            updatedAt: serverTimestamp(),
            history: [{
                id: Date.now().toString(),
                taskId,
                taskTitle,
                details,
                points,
                type,
                timestamp: new Date()
            }, ...( (await getDoc(userPointsRef)).data()?.history || [] ).slice(0, 49)] // Keep last 50 entries
        }, { merge: true });
        
        if (points > 0) {
            toast.success(`Awarded ${points.toFixed(1)} points!`);
        } else {
            toast.info(`Deducted ${Math.abs(points).toFixed(1)} points.`);
        }
    } catch (error) {
        console.error("Error awarding points:", error);
    }
  }, []);

  useEffect(() => {
    // Request permission for notifications when the app loads.
    requestNotificationPermission().then(permission => {
        if (permission === 'granted' && user?.uid) {
            subscribeUserToPush(user.uid);
        }
    });
  }, [user?.uid]);

  const addTaskGroup = useCallback(async (name: string) => {
    if (!orgId || !canManageTasks) return null;
    try {
        const groupsCollection = collection(db, "organizations", orgId, "taskGroups");
        const docRef = await addDoc(groupsCollection, {
            name,
            order: groups.length,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding task group:", e);
        return null;
    }
  }, [orgId, canManageTasks, groups.length]);

  const updateTaskGroup = useCallback(async (groupId: string, updates: Partial<TaskGroup>) => {
    if (!orgId || !canManageTasks) return;
    try {
        const groupRef = doc(db, "organizations", orgId, "taskGroups", groupId);
        await updateDoc(groupRef, updates);
    } catch (e) {
        console.error("Error updating task group:", e);
    }
  }, [orgId, canManageTasks]);

  const deleteTaskGroup = useCallback(async (groupId: string) => {
    if (!orgId || !canManageTasks) return;
    try {
        const groupRef = doc(db, "organizations", orgId, "taskGroups", groupId);
        await deleteDoc(groupRef);
        
        // Move tasks from deleted group to no group (default)
        const tasksToMove = tasks.filter(t => t.groupId === groupId);
        if (tasksToMove.length > 0) {
            const batch = writeBatch(db);
            tasksToMove.forEach(task => {
                const taskRef = doc(db, "organizations", orgId, "tasks", task.id);
                batch.update(taskRef, { groupId: null });
            });
            await batch.commit();
        }
    } catch (e) {
        console.error("Error deleting task group:", e);
    }
  }, [orgId, canManageTasks, tasks]);

  useEffect(() => {
    if (!orgId) return;

    const groupsCollection = collection(db, "organizations", orgId, "taskGroups");
    const q = query(groupsCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedGroups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as TaskGroup[];
        setGroups(updatedGroups.sort((a, b) => a.order - b.order));
    });

    return () => unsubscribe();
  }, [orgId]);

  useEffect(() => {
    if (!orgId) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    const tasksCollection = collection(db, "organizations", orgId, "tasks");
    
    // We'll use a ref to track the unsubscribe function so we can clean it up safely
    let unsubscribe: () => void = () => {};

    // Fetch org data to check for departments
    getDoc(doc(db, "organizations", orgId)).then(orgDoc => {
      const orgData = orgDoc.data();
      const hasDepartments = (orgData?.departments?.length || 0) > 0;
      
      let q = query(tasksCollection, where("isDeleted", "==", false));

      // If Manager and Org has departments, restrict to their dept + unassigned
      if (userRole === 'manager' && hasDepartments && userData?.department && !(userData?.ownedOrgId)) {
        const dept = userData.department || "unassigned";
        q = query(
          tasksCollection, 
          where("isDeleted", "==", false), 
          where("department", "in", [dept, "unassigned"])
        );
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const rawData = change.doc.data();
            const data = { 
                ...rawData,
                id: change.doc.id,
            } as Task;

            if (change.type === "added" || change.type === "modified") {
              dispatch({ type: "ADD_OR_UPDATE_TASK", task: data });
            }
            if (change.type === "removed") {
              dispatch({ type: "DELETE_TASK", taskId: change.doc.id });
            }
          });
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching tasks:", error);
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orgId, authLoading, userRole, userData?.department, userData?.ownedOrgId]);

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>, actionName: string = 'updated', skipHistory: boolean = false) => {
      if (!orgId || !user) return;

      const currentTask = tasks.find((t: Task) => t.id === taskId);
      if (!currentTask) return;

      const cleanUpdates = { ...updates };

      // Helper to deeply clean objects of undefined values
      const deepClean = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map((v: any) => deepClean(v));
        } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
          return Object.entries(obj).reduce((acc: any, [key, value]) => {
            acc[key] = deepClean(value);
            return acc;
          }, {} as any);
        }
        return obj === undefined ? null : obj;
      };

      // --- Point Awarding Logic (Keep this but maybe it needs to be careful with debouncing) ---
      // For now, we'll keep it as is, but it will be part of the pending update.
      if (currentTask.leaderPoints && currentTask.leaderPoints > 0) {
        if (updates.subtasks && JSON.stringify(updates.subtasks) !== JSON.stringify(currentTask.subtasks)) {
            const oldSubs = currentTask.subtasks || [];
            const newSubs = [...updates.subtasks];
            const pointsPerSub = currentTask.leaderPoints / (oldSubs.length || 1);
            
            newSubs.forEach((sub, idx) => {
                const oldSub = oldSubs.find((s: Subtask) => s.id === sub.id);
                if (oldSub) {
                    if (!oldSub.completed && sub.completed) {
                        sub.pointsAwarded = pointsPerSub;
                        sub.completedBy = user.uid;
                        awardPointsToUser(user.uid, pointsPerSub, taskId, currentTask.title, `Completed subtask: ${sub.title}`, 'subtask');
                    } else if (oldSub.completed && !sub.completed) {
                        const earner = oldSub.completedBy || user.uid;
                        const deduction = oldSub.pointsAwarded || pointsPerSub;
                        awardPointsToUser(earner, -deduction, taskId, currentTask.title, `Unchecked subtask: ${sub.title}`, 'subtask');
                        sub.pointsAwarded = 0;
                        sub.completedBy = null;
                    }
                }
            });
            cleanUpdates.subtasks = newSubs;
        }

        if (updates.flagged !== undefined && updates.flagged !== currentTask.flagged) {
            if (updates.flagged === true) {
                const awardedSoFar = (currentTask.subtasks || []).reduce((acc: number, s: Subtask) => acc + (s.pointsAwarded || 0), 0);
                const remainingPoints = Math.max(0, currentTask.leaderPoints - awardedSoFar);
                if (remainingPoints > 0) {
                    awardPointsToUser(user.uid, remainingPoints, taskId, currentTask.title, `Marked task as complete`, 'full_completion');
                    (cleanUpdates as any).flaggedPointsAwarded = remainingPoints;
                }
            } else if (updates.flagged === false) {
                const deduction = currentTask.flaggedPointsAwarded || 0;
                if (deduction > 0) {
                    awardPointsToUser(user.uid, -deduction, taskId, currentTask.title, `Unmarked task as complete`, 'full_completion');
                    (cleanUpdates as any).flaggedPointsAwarded = 0;
                }
            }
        }
      }

      const finalUpdates = deepClean(cleanUpdates);

      // Optimistic Update: Push to pendingUpdates
      setPendingUpdates(prev => ({
        ...prev,
        [taskId]: { ...(prev[taskId] || {}), ...finalUpdates }
      }));

      // NOTE: History is omitted for minor "word-by-word" updates to avoid polluting the DB.
      // We only log history in flushUpdates if we want, or keep it simple.
    },
    [orgId, user, tasks, awardPointsToUser]
  );

  const addComment = useCallback(
    async (taskId: string, text: string) => {
      if (!orgId || !user) return;
      const currentTask = tasks.find((t: Task) => t.id === taskId);
      if (!currentTask) return;

      const newComment: Comment = {
        id: Date.now().toString(),
        userId: user.uid,
        text,
        createdAt: new Date(),
      };

      const updates = {
        comments: [...(currentTask.comments || []), newComment],
      };

      await updateTask(taskId, updates, 'comment_added');
      toast.success(`Comment added to "${currentTask.title}"`);
      
      // Send push notification to all assignees (except current user)
      const notifyList = new Set(currentTask.assignees || []);
      notifyList.forEach(uId => {
        if (uId !== user.uid) {
            fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: uId,
                    title: `New comment on "${currentTask.title}"`,
                    body: text,
                    data: { taskId }
                })
            });
        }
      });
    },
    [orgId, user, tasks, updateTask]
  );


  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!orgId || !canManageTasks) return;
      // Soft delete: keep the doc, but mark it hidden
      await updateTask(taskId, { isDeleted: true }, 'deleted');
    },
    [orgId, canManageTasks, updateTask]
  );

  const bulkUpdateTasks = useCallback(
    async (updates: Record<string, Partial<Task>>, actionName: string = 'bulk_updated') => {
      if (!orgId || !user) return;
      
      const batch = writeBatch(db);
      const now = serverTimestamp();

      Object.entries(updates).forEach(([taskId, taskUpdates]) => {
        const taskDocRef = doc(db, "organizations", orgId, "tasks", taskId);
        const currentTask = tasks.find((t: Task) => t.id === taskId);
        
        if (currentTask) {
          const historyEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            userId: user.uid,
            action: actionName,
            details: taskUpdates,
            createdAt: new Date(),
          };

          const finalUpdates = Object.entries(taskUpdates).reduce((acc: any, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          }, {} as any);

          batch.update(taskDocRef, {
            ...finalUpdates,
            updatedAt: now,
            history: [...(currentTask.history || []), historyEntry]
          });
        }
      });

      try {
        await batch.commit();
        toast.success(`Successfully saved ${Object.keys(updates).length} tasks`);
      } catch (error) {
        console.error("Error bulk updating tasks:", error);
        toast.error("Failed to save some changes");
      }
    },
    [orgId, user, tasks]
  );

  return (
    <TasksContext.Provider
      value={{ tasks, groups, loading, drafts, hasPending, updateDraft, deleteDraft, finalizeDraft, addTask, updateTask, deleteTask, bulkUpdateTasks, addComment, addTaskGroup, updateTaskGroup, deleteTaskGroup, canManageTasks, isSyncing }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);