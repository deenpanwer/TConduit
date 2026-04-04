import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserAvatar(user: any) {
  if (!user) return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=fallback`;
  const avatar = user.imageUrl || user.photoUrl || user.photoURL;
  if (avatar) return avatar;
  const seed = user.email || user.id || user.uid || "anonymous";
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}`;
}

/**
 * Robust Online Status Checker
 * --------------------------
 * An employee is only "Online" if:
 * 1. The `isCurrentlyRunning` flag is true (explicitly active).
 * 2. The `updatedAt` heartbeat is NOT stale (threshold: 5 minutes).
 * 
 * This prevents "Ghost Online" states during power outages or app crashes
 * where the machine couldn't send an "Offline" signal.
 */
export function isEmployeeOnline(employee: any): boolean {
  if (!employee?.heartbeat?.isCurrentlyRunning) return false;
  
  const lastActiveRaw = employee.heartbeat.updatedAt;
  if (!lastActiveRaw) return false;

  let lastActiveDate: Date | null = null;

  // Handle Firestore Timestamp, ISO String, or Date object
  if (lastActiveRaw.toDate) {
    lastActiveDate = lastActiveRaw.toDate();
  } else if (lastActiveRaw.seconds) {
    lastActiveDate = new Date(lastActiveRaw.seconds * 1000);
  } else {
    lastActiveDate = new Date(lastActiveRaw);
  }

  if (!lastActiveDate || !isValid(lastActiveDate)) return false;

  const now = new Date();
  const diffMs = now.getTime() - lastActiveDate.getTime();
  
  // Cut-off threshold: 5 minutes (300,000 ms)
  // Most heartbeat pulses occur every 1-2 minutes.
  const STALE_THRESHOLD_MS = 5 * 60 * 1000;

  return diffMs < STALE_THRESHOLD_MS;
}