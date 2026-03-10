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
} from "firebase/firestore";
import { useAuth } from "./use-auth";
import { requestNotificationPermission, sendBrowserNotification } from "@/lib/notifications";
import { toast } from "sonner";

// --- 1. Types & Constants ---

export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "todo" | "in_progress" | "review" | "done";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string; 
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
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
  comments: Comment[];
  history: HistoryEntry[];
  flagged?: boolean;
  isDeleted?: boolean;
  audioBase64?: string; // TESTING ONLY: Direct Base64 audio
  audioMimeType?: string; // e.g. 'audio/webm;codecs=opus'
  audioDuration?: number; // Duration in seconds
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
  addTask: (title: string, status: Status, description?: string, priority?: Priority, assignees?: string[], audioData?: { base64: string; mimeType: string; duration: number }) => Promise<string | null>;
  updateTask: (taskId: string, updates: Partial<Task>, action?: string, skipHistory?: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  canManageTasks: boolean;
}

const TasksContext = createContext<TasksContextType>({
  tasks: [],
  loading: true,
  addTask: async () => null,
  updateTask: async () => {},
  deleteTask: async () => {},
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

  useEffect(() => {
    // Request permission for notifications when the app loads.
    // This is a simple approach; a more robust solution might tie this
    // to a user action in the settings.
    requestNotificationPermission();
  }, []);

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
      audioData?: { base64: string; mimeType: string; duration: number }
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

      const newTask: Omit<Task, 'id'> = {
        title,
        description,
        status,
        priority,
        assignees,
        subtasks: [],
        comments: [],
        tags: [],
        flagged: false,
        isDeleted: false,
        audioBase64: audioData?.base64,
        audioMimeType: audioData?.mimeType,
        audioDuration: audioData?.duration,
        history: [
            {
                id: Date.now().toString(),
                userId: user.uid,
                action: 'created',
                details: { title, status, description, priority, assignees, hasAudio: !!audioData },
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
      
      // RUTHLESS LOGGING: Only log if moving to "done", if it's a manual save, or a comment
      const isMovingToDone = updates.status === 'done';
      const isManualSave = actionName === 'manual_save';
      const isComment = actionName === 'comment_added';
      const isDeletion = actionName === 'deleted';

      if (!skipHistory && (isMovingToDone || isManualSave || isComment || isDeletion)) {
        const historyEntry = {
            id: Date.now().toString(),
            userId: user.uid,
            action: actionName,
            details: updates,
            createdAt: new Date(),
        };
        history = [...history, historyEntry];
      }
      
      const taskToUpdate = {
        ...updates,
        updatedAt: serverTimestamp(),
        history
      };

      try {
        await updateDoc(taskDocRef, taskToUpdate);
        if (updates.flagged) {
          const notificationTitle = `Task Completed`;
          const notificationBody = `"${currentTask.title}" has been marked as complete.`;
          toast.success(notificationBody);
          sendBrowserNotification(notificationTitle, {
            body: notificationBody,
            tag: `task-completed-${taskId}`,
          });
        }
      } catch (error) {
        console.error("Error updating task: ", error);
      }
    },
    [orgId, user, tasks]
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
      
      // Send browser notification
      sendBrowserNotification(`New comment on "${currentTask.title}"`, {
        body: newComment.text,
        tag: `comment-${taskId}`, // Use a tag to prevent spamming notifications for the same task
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

  return (
    <TasksContext.Provider
      value={{ tasks, loading, addTask, updateTask, deleteTask, addComment, canManageTasks }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);