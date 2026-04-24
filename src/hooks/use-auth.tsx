"use client";

import { createContext, useContext, useEffect, useState, Suspense } from "react";
import { User } from "firebase/auth";
// These imports remain to prevent breaking references, even if unused
import { auth } from "@/lib/firebase";
import { storage } from "@/lib/storage";
import { useRouter, usePathname } from "next/navigation";
import posthog from 'posthog-js';

// --- DEMO DATA ---
const MOCK_USER = {
  uid: "demo-user-123",
  email: "demo@example.com",
  displayName: "Demo Admin",
} as User;

const MOCK_USER_DATA = {
  id: "demo-user-123",
  name: "Demo Admin",
  email: "demo@example.com",
  role: "owner",
  onboardingCompleted: true,
  orgId: "mock-org-123",
  ownedOrgId: "mock-org-123"
};

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: MOCK_USER,
  userData: MOCK_USER_DATA,
  loading: false,
  refreshUserData: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with dummy data so UI components find a user immediately
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [userData, setUserData] = useState<any | null>(MOCK_USER_DATA);
  const [loading, setLoading] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    // We disable the Firebase listener to prevent it from overwriting our mock state
    /*
    const unsubscribe = onAuthStateChanged(auth, async (user) => { ... });
    return () => unsubscribe();
    */
    
    // Identify demo user in Posthog if needed
    posthog.identify(MOCK_USER.uid, {
      email: MOCK_USER.email,
      name: MOCK_USER_DATA.name,
      role: MOCK_USER_DATA.role,
    });
  }, []);

  const refreshUserData = async () => {
    setUserData(MOCK_USER_DATA);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {/* AuthRedirectHandler is commented out to prevent client-side 
        redirection logic from checking for a "real" Firebase session.
      */}
      {/* <Suspense fallback={null}>
        <AuthRedirectHandler 
          user={user} 
          userData={userData} 
          loading={loading} 
          pathname={pathname} 
          router={router} 
        />
      </Suspense> 
      */}
      {children}
    </AuthContext.Provider>
  );
}

// Keep the hook exported so components don't crash
export const useAuth = () => useContext(AuthContext);
