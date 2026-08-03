import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);

  if (formatted.endsWith(".00")) {
    return formatted.slice(0, -3);
  }

  return formatted;
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
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
  
  // Cut-off threshold / grace period: 15 minutes (900,000 ms)
  // Desktop app heartbeat pulses every 1 minute.
  const STALE_THRESHOLD_MS = 15 * 60 * 1000;

  return diffMs < STALE_THRESHOLD_MS;
}
