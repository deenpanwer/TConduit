import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
