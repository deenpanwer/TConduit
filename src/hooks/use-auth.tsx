"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import posthog from 'posthog-js';
import { getPageLoadTime, getDeviceCapabilities, getPushSubscription } from "@/lib/performance";

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
  
  // Track if session start has been logged for this load
  const sessionLogged = useRef(false);
  const sessionId = useRef<string | null>(null);
  const sessionStartTime = useRef<number>(Date.now());

  // Page View Tracker
  useEffect(() => {
    if (user && sessionId.current && pathname?.startsWith("/dashboard")) {
      const userDocRef = doc(db, "users", user.uid);
      // Dot notation to increment nested counter
      // sanitized path for firestore key
      const safePath = pathname.replace(/\//g, '_') || "root";
      
      updateDoc(userDocRef, {
        [`visits.${sessionId.current}.pageViews.${safePath}`]: increment(1)
      }).catch(() => {});
    }
  }, [pathname, user]);

  const fetchAndSetUserData = async (firebaseUser: User) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
      
      // LOG SESSION START (Only once per load)
      if (!sessionLogged.current) {
        sessionLogged.current = true;
        sessionId.current = Date.now().toString();
        const loadTime = getPageLoadTime();
        const deviceData = getDeviceCapabilities();
        const pushSubscription = await getPushSubscription();
        
        try {
          // Atomic update: increment count AND add to the visits map
          const safePath = (window.location.pathname || "/").replace(/\//g, '_') || "root";
          await updateDoc(userDocRef, {
            totalVisits: increment(1),
            lastVisitAt: serverTimestamp(),
            deviceStatus: {
              isPWA: deviceData.isPWA,
              notificationsEnabled: deviceData.notificationsEnabled,
              userAgent: deviceData.userAgent,
              lastUpdated: serverTimestamp()
            },
            ...(pushSubscription ? { pushSubscriptions: arrayUnion(JSON.parse(JSON.stringify(pushSubscription))) } : {}),
            [`visits.${sessionId.current}`]: {
              startTime: serverTimestamp(),
              pathname: window.location.pathname,
              initialLoadTimeMs: loadTime,
              device: deviceData,
              durationSeconds: 0,
              pageViews: {
                [safePath]: 1
              }
            }
          });
        } catch (e) {
          console.error("Failed to log visit stats:", e);
        }
      }
      
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

  // LOG SESSION DURATION (on cleanup/unload)
  useEffect(() => {
    const logDuration = async () => {
      if (user && sessionId.current) {
        const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
        const userDocRef = doc(db, "users", user.uid);
        
        try {
          await updateDoc(userDocRef, {
            [`visits.${sessionId.current}.durationSeconds`]: durationSeconds,
            [`visits.${sessionId.current}.endTime`]: serverTimestamp()
          });
        } catch (e) {
          // Silently fail on exit
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logDuration();
      }
    };

    window.addEventListener("beforeunload", logDuration);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      logDuration();
      window.removeEventListener("beforeunload", logDuration);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

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