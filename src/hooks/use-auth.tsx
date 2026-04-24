"use client";

import { createContext, useContext, useEffect, useState, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { storage } from "@/lib/storage";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import posthog from 'posthog-js';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

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
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchAndSetUserData(firebaseUser);
      } else if (IS_DEMO) {
        // Automatically inject demo user if no real session exists
        setUser({ uid: 'demo-123', email: 'demo@example.com', displayName: 'Demo' } as User);
        setUserData(MOCK_USER_DATA);
      } else {
        setUser(null);
        setUserData(null);
        posthog.reset();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchAndSetUserData = async (firebaseUser: User) => {
    const allUsers = storage.getCollection<any>("users");
    let data = allUsers.find(u => u.id === firebaseUser.uid || u.email === firebaseUser.email);
    
    if (!data && IS_DEMO) data = MOCK_USER_DATA;

    if (data) {
      setUserData(data);
      posthog.identify(firebaseUser.uid, { email: firebaseUser.email, ...data });
    }
  };

  const refreshUserData = async () => {
    if (user) await fetchAndSetUserData(user);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      <Suspense fallback={null}>
        <AuthRedirectHandler user={user} userData={userData} loading={loading} pathname={pathname} router={router} />
      </Suspense>
      {children}
    </AuthContext.Provider>
  );
}

function AuthRedirectHandler({ user, userData, loading, pathname, router }: any) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (IS_DEMO) return; // Completely disable auto-redirects in Demo Mode

    const isProtectedPage = pathname?.startsWith("/ems") || pathname?.startsWith("/crm") || pathname?.startsWith("/pos") || pathname?.startsWith("/tasks") || pathname === "/dashboard";
    const isAuthPage = pathname?.includes("/login") || pathname?.includes("/signup") || pathname?.includes("/forgot-password");

    if (!loading && isProtectedPage && !isAuthPage) {
      if (!user) {
        router.push("/ems/login");
      }
    }
  }, [user, userData, loading, pathname, router]);

  return null;
}

export const useAuth = () => useContext(AuthContext);
