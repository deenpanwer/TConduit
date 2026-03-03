"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
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
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
      
      // Identify the user and link properties
      posthog.identify(firebaseUser.uid, {
        email: firebaseUser.email,
        name: data.displayName || data.name,
        role: data.role,
        is_verified: firebaseUser.emailVerified,
        ...data
      });

      // Group the user into their organization
      const orgId = data.ownedOrgId || data.orgId;
      if (orgId) {
        posthog.group('organization', orgId, {
          name: data.companyName || orgId,
          id: orgId
        });
      }
    } else {
      setUserData(null);
      // Fallback identify if no user document exists yet
      posthog.identify(firebaseUser.uid, {
        email: firebaseUser.email,
        is_verified: firebaseUser.emailVerified,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        // Set unique cookie
        await fetch("/api/auth/session", {
          method: "POST",
          body: JSON.stringify({ session: idToken }),
        });
        
        setUser(user);
        await fetchAndSetUserData(user);
      } else {
        // Clear unique cookie
        await fetch("/api/auth/session", { method: "DELETE" });
        setUser(null);
        setUserData(null);
        posthog.reset(); // Reset PostHog on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userData) {
      console.log("useAuth: userData updated", new Date().toISOString(), {
        uid: user?.uid,
        orgId: userData.orgId,
        ownedOrgId: userData.ownedOrgId,
        role: userData.role,
        // Add other relevant fields if needed
      });
    }
  }, [userData, user]);

  const refreshUserData = async () => {
    if (user) {
      setLoading(true);
      await fetchAndSetUserData(user);
      setLoading(false);
    }
  };

  // Safety Net: Client-side redirect if session is lost
  useEffect(() => {
    if (!loading && !user && pathname?.startsWith("/dashboard") && !pathname?.includes("/login") && !pathname?.includes("/signup") && !pathname?.includes("/forgot-password")) {
      router.push("/dashboard/login");
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);