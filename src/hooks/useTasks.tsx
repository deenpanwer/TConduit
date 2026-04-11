"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useReducer,
  useCallback,
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
  loading: boolean;
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
    images?: NestedImage[]
  ) => Promise<string | null>;
  updateTask: (taskId: string, updates: Partial<Task>, action?: string, skipHistory?: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  bulkUpdateTasks: (updates: Record<string, Partial<Task>>, actionName?: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  canManageTasks: boolean;
}

const TasksContext = createContext<TasksContextType>({
  tasks: [],
  loading: true,
  addTask: async () => null,
  updateTask: async () => {},
  deleteTask: async () => {},
  bulkUpdateTasks: async () => {},
  addComment: async () => {},
  canManageTasks: false,
});

// --- 4. Provider Component ---

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user, userData, loading: authLoading } = useAuth();
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [loading, setLoading] = useState(true);

  const orgId = userData?.ownedOrgId || userData?.orgId;
  const userRole = userData?.role?.toLowerCase();
  const canManageTasks = userRole === 'owner' || userRole === 'manager' || userRole === 'founder';

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

  useEffect(() => {
    if (!orgId) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    const tasksCollection = collection(db, "organizations", orgId, "tasks");
    // Filter out deleted tasks from the real-time stream
    const q = query(tasksCollection, where("isDeleted", "==", false));

    const unsubscribe = onSnapshot(
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

    return () => unsubscribe();
  }, [orgId, authLoading]);

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
      images: NestedImage[] = []
    ): Promise<string | null> => {
      console.log("useTasks: addTask called", { title, status, orgId, userId: user?.uid, canManageTasks });
      
      if (!orgId || !user) {
        console.error("useTasks: Missing orgId or user");
        return null;
      }
      if (!canManageTasks) {
        console.error("useTasks: User does not have permission to manage tasks");
        return null;
      }

      const newTask: any = {
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
                details: { title, status, description, priority, assignees, leaderPoints, deadlineHours, subtasksCount: subtasks.length, resourcesCount: resources.length, attachmentsCount: attachments.length, voiceNotesCount: voiceNotes.length, nestedDescriptionsCount: nestedDescriptions.length, imagesCount: images.length },
                createdAt: new Date(),
            }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

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
                  title: `New Task Assigned`,
                  body: `You've been assigned to: "${title}"`,
                  data: { taskId: docRef.id }
                })
              });
            }
          });
        }

        return docRef.id;
      } catch (error) {
        console.error("Error adding task: ", error);
        return null;
      }
    },
    [orgId, user, canManageTasks]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>, actionName: string = 'updated', skipHistory: boolean = false) => {
      if (!orgId || !user) return;

      const taskDocRef = doc(db, "organizations", orgId, "tasks", taskId);
      const currentTask = tasks.find(t => t.id === taskId);
      if (!currentTask) return;

      let history = currentTask.history || [];
      const cleanUpdates = { ...updates };

      // Helper to deeply clean objects of undefined values
      const deepClean = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(v => deepClean(v));
        } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
          return Object.entries(obj).reduce((acc, [key, value]) => {
            acc[key] = deepClean(value);
            return acc;
          }, {} as any);
        }
        return obj === undefined ? null : obj;
      };
      // --- Point Awarding Logic ---
      if (currentTask.leaderPoints && currentTask.leaderPoints > 0) {
        // 1. Subtask Toggled
        if (updates.subtasks && JSON.stringify(updates.subtasks) !== JSON.stringify(currentTask.subtasks)) {
            const oldSubs = currentTask.subtasks || [];
            const newSubs = [...updates.subtasks];
            const pointsPerSub = currentTask.leaderPoints / (oldSubs.length || 1);
            
            newSubs.forEach((sub, idx) => {
                const oldSub = oldSubs.find(s => s.id === sub.id);
                if (oldSub) {
                    // Subtask marked as COMPLETED
                    if (!oldSub.completed && sub.completed) {
                        sub.pointsAwarded = pointsPerSub;
                        sub.completedBy = user.uid;
                        awardPointsToUser(user.uid, pointsPerSub, taskId, currentTask.title, `Completed subtask: ${sub.title}`, 'subtask');
                    }
                    // Subtask UNCHECKED
                    else if (oldSub.completed && !sub.completed) {
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
        // 2. Full Task Completion (Flagged)
        if (updates.flagged !== undefined && updates.flagged !== currentTask.flagged) {
            if (updates.flagged === true) {
                // Award remaining points
                const awardedSoFar = (currentTask.subtasks || []).reduce((acc, s) => acc + (s.pointsAwarded || 0), 0);
                const remainingPoints = Math.max(0, currentTask.leaderPoints - awardedSoFar);
                if (remainingPoints > 0) {
                    awardPointsToUser(user.uid, remainingPoints, taskId, currentTask.title, `Marked task as complete`, 'full_completion');
                    (cleanUpdates as any).flaggedPointsAwarded = remainingPoints;
                }
            } else if (updates.flagged === false) {
                // Deduct whatever was awarded for final completion
                const deduction = currentTask.flaggedPointsAwarded || 0;
                if (deduction > 0) {
                    awardPointsToUser(user.uid, -deduction, taskId, currentTask.title, `Unmarked task as complete`, 'full_completion');
                    (cleanUpdates as any).flaggedPointsAwarded = 0;
                }
            }
        }
      }

      // RUTHLESS LOGGING: Only log if moving to "done", if it's a manual save, or a comment
      const isMovingToDone = updates.status === 'done';
      const isManualSave = actionName === 'manual_save';
      const isComment = actionName === 'comment_added';
      const isDeletion = actionName === 'deleted';

      const finalUpdates = deepClean(cleanUpdates);

      if (!skipHistory && (isMovingToDone || isManualSave || isComment || isDeletion)) {
        const historyEntry = {
            id: Date.now().toString(),
            userId: user.uid,
            action: actionName,
            details: finalUpdates,
            createdAt: new Date(),
        };
        history = [...history, historyEntry];
      }

      const taskToUpdate = {
        ...finalUpdates,
        updatedAt: serverTimestamp(),
        history: deepClean(history)
      };

      try {
        await updateDoc(taskDocRef, taskToUpdate);
        // If task is completed, notify the assignees or others
        if (finalUpdates.status === 'done') {
            const notificationTitle = `Task Completed`;
            const notificationBody = `"${currentTask.title}" has been marked as complete.`;
            toast.success(notificationBody);
            
            // Send push notifications to all other assignees and the owner
            const notifyList = new Set([...(currentTask.assignees || [])]);
            
            notifyList.forEach(uId => {
                if (uId !== user.uid) {
                    fetch('/api/notifications/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: uId,
                            title: notificationTitle,
                            body: notificationBody,
                            data: { taskId }
                        })
                    });
                }
            });
        }
      } catch (error) {
        console.error("Error updating task: ", error);
      }
    },
    [orgId, user, tasks, awardPointsToUser]
  );

  const addComment = useCallback(
    async (taskId: string, text: string) => {
      if (!orgId || !user) return;
      const currentTask = tasks.find(t => t.id === taskId);
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
        const currentTask = tasks.find(t => t.id === taskId);
        
        if (currentTask) {
          const historyEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            userId: user.uid,
            action: actionName,
            details: taskUpdates,
            createdAt: new Date(),
          };

          const finalUpdates = Object.entries(taskUpdates).reduce((acc, [key, value]) => {
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
      value={{ tasks, loading, addTask, updateTask, deleteTask, bulkUpdateTasks, addComment, canManageTasks }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);