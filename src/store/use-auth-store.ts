import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthType = 'google' | 'password' | null;

export interface LastUser {
  uid: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  authType: AuthType;
}

interface AuthStore {
  savedUsers: LastUser[];
  saveUser: (user: LastUser) => void;
  removeUser: (uid: string) => void;
  clearAll: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      savedUsers: [],
      saveUser: (user) => set((state) => {
        const filtered = state.savedUsers.filter(u => u.uid !== user.uid);
        const newList = [user, ...filtered];
        
        const googleUsers = newList.filter(u => u.authType === 'google').slice(0, 1);
        const passwordUsers = newList.filter(u => u.authType === 'password').slice(0, 2);
        
        const finalUsers = newList.filter(u => googleUsers.includes(u) || passwordUsers.includes(u));
        
        return { savedUsers: finalUsers };
      }),
      removeUser: (uid) => set((state) => ({
        savedUsers: state.savedUsers.filter(u => u.uid !== uid)
      })),
      clearAll: () => set({ savedUsers: [] }),
    }),
    {
      name: 'trac-auth-store', // name of the item in the storage
    }
  )
);
