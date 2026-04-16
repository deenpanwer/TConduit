
"use client";

import { createContext, useContext, useEffect, useState, useRef, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { storage } from "@/lib/storage";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import posthog from 'posthog-js';

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
  
  const fetchAndSetUserData = async (firebaseUser: User) => {
    // Fetch from LocalStorage instead of Firestore
    const allUsers = storage.getCollection<any>("users");
    let data = allUsers.find(u => u.id === firebaseUser.uid || u.email === firebaseUser.email);
    
    if (data) {
      setUserData(data);
      posthog.identify(firebaseUser.uid, {
        email: firebaseUser.email,
        name: data.name,
        role: data.role,
        ...data
      });
    } else {
      // Create a default mock user if not found in seeded data
      const newData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "Mock User",
        email: firebaseUser.email,
        role: "owner",
        onboardingCompleted: true,
        orgId: "mock-org-123",
        ownedOrgId: "mock-org-123"
      };
      storage.saveItem("users", newData);
      setUserData(newData);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchAndSetUserData(user);
      } else {
        setUser(null);
        setUserData(null);
        posthog.reset();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (user) {
      setLoading(true);
      await fetchAndSetUserData(user);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      <Suspense fallback={null}>
        <AuthRedirectHandler 
          user={user} 
          userData={userData} 
          loading={loading} 
          pathname={pathname} 
          router={router} 
        />
      </Suspense>
      {children}
    </AuthContext.Provider>
  );
}

function AuthRedirectHandler({ user, userData, loading, pathname, router }: any) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const isProtectedPage = pathname?.startsWith("/ems") || pathname?.startsWith("/crm") || pathname?.startsWith("/pos") || pathname?.startsWith("/tasks") || pathname === "/dashboard";
    const isAuthPage = pathname?.includes("/login") || pathname?.includes("/signup") || pathname?.includes("/forgot-password");
    const isOnboardingPage = pathname?.includes("/onboarding");

    if (!loading && isProtectedPage && !isAuthPage && !isOnboardingPage) {
      const fullUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : (pathname || "/ems");
      
      if (!user) {
        const loginUrl = new URL("/ems/login", window.location.origin);
        loginUrl.searchParams.set("callbackUrl", fullUrl);
        router.push(loginUrl.pathname + loginUrl.search);
      } else if (userData && !userData.onboardingCompleted) {
        // Since we are mock-seeding, we might not need onboarding, but keeping logic
      }
    }
  }, [user, userData, loading, pathname, searchParams, router]);

  return null;
}

export const useAuth = () => useContext(AuthContext);
