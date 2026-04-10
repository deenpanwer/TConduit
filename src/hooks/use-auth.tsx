"use client";

import { createContext, useContext, useEffect, useState, useRef, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  
  // --- DETAILED ANALYTICS TRACKING REFS ---
  // We use refs to store session information across re-renders without triggering them.
  
  // Tracks if the main session logging has already occurred for this page load.
  const sessionLogged = useRef(false);
  // Stores the Firestore document ID of the CURRENT session in the `users/{id}/sessions` subcollection.
  const sessionId = useRef<string | null>(null);
  // Records the start time of the session to calculate duration on exit.
  const sessionStartTime = useRef<number>(Date.now());

  /**
   * This effect tracks user navigation within the app *after* the initial session has been logged.
   * For every page change, it increments a counter for that specific page in the current session document.
   * This gives us a detailed view of the user's journey during a single visit.
   */
  useEffect(() => {
    // Only run if we have a user and a valid session ID.
    const isProtectedPage = pathname?.startsWith("/ems") || pathname?.startsWith("/crm") || pathname?.startsWith("/pos") || pathname?.startsWith("/tasks") || pathname === "/dashboard";
    if (user && sessionId.current && isProtectedPage) {
      // Create a reference to the specific session document.
      const sessionDocRef = doc(db, "users", user.uid, "sessions", sessionId.current);
      // Sanitize the URL path to be a valid Firestore key (replace '/' with '_').
      const safePath = pathname.replace(/\//g, '_') || "root";
      
      // Atomically increment the view count for the current page path.
      // We use dot notation to update a field within the 'pageViews' map.
      updateDoc(sessionDocRef, {
        [`pageViews.${safePath}`]: increment(1)
      }).catch((e) => {
        // Silently catch errors. We don't want analytics to crash the app.
        console.error("Failed to update page view count:", e);
      });
    }
  }, [pathname, user]); // Re-run this effect whenever the path or user changes.

  const fetchAndSetUserData = async (firebaseUser: User) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
      
      // --- Log Session Start (New, More Robust Logic) ---
      // This block runs ONLY ONCE per user session.
      if (!sessionLogged.current) {
        sessionLogged.current = true; // Mark session as logged for this app instance.
        
        // --- Gather Performance and Device Data ---
        const loadTime = getPageLoadTime();
        const deviceData = getDeviceCapabilities();
        const pushSubscription = await getPushSubscription();
        const safePath = (window.location.pathname || "/").replace(/\//g, '_') || "root";

        try {
          // --- STEP 1: Create the Detailed Session Document ---
          // A new document is added to the `sessions` subcollection for the current user.
          // This contains all the rich, detailed information about this specific visit.
          const sessionDoc = await addDoc(collection(db, "users", firebaseUser.uid, "sessions"), {
            startTime: serverTimestamp(), // Firestore server-side timestamp.
            pathname: window.location.pathname,
            initialLoadTimeMs: loadTime,
            device: deviceData, // The full device capabilities object.
            // Map to store page view counts for this session.
            pageViews: {
              [safePath]: 1
            }
          });
          
          // Store the ID of the newly created session document.
          sessionId.current = sessionDoc.id;

          // --- STEP 2: Update the Main User Document (Summary Info) ---
          // We perform a separate, small update on the main user document.
          // This is for quick access to summary data without needing to query the subcollection.
          await updateDoc(userDocRef, {
            totalVisits: increment(1), // Increment the user's total visit count.
            lastVisitAt: serverTimestamp(), // Update the last visit timestamp.
            // Store device status summary.
            deviceStatus: {
              isPWA: deviceData.isPWA,
              notificationsEnabled: deviceData.notificationsEnabled,
              userAgent: deviceData.userAgent,
              lastUpdated: serverTimestamp()
            },
            // Add push subscription if it exists.
            ...(pushSubscription ? { pushSubscriptions: arrayUnion(JSON.parse(JSON.stringify(pushSubscription))) } : {}),
          });

        } catch (e) {
          console.error("Failed to log detailed visit stats:", e);
        }
      }
      
      // --- PostHog Analytics Integration ---
      posthog.identify(firebaseUser.uid, {
        email: firebaseUser.email,
        name: data.displayName || data.name,
        role: data.role,
        is_verified: firebaseUser.emailVerified,
        ...data
      });

      const orgId = data.ownedOrgId || data.orgId;
      if (orgId) {
        posthog.group('organization', orgId, {
          name: data.companyName || orgId,
          id: orgId
        });
      }
    } else {
      setUserData(null);
      posthog.identify(firebaseUser.uid, {
        email: firebaseUser.email,
        is_verified: firebaseUser.emailVerified,
      });
    }
  };

  /**
   * This effect is responsible for logging the total duration of the user's session.
   * It attaches listeners to 'beforeunload' and 'visibilitychange' to robustly capture
   * when the user leaves the page. This is a "best-effort" attempt.
   */
  useEffect(() => {
    const logDuration = async () => {
      // Only run if we have a user and a valid session ID.
      if (user && sessionId.current) {
        // Calculate the total duration in seconds.
        const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
        // We only proceed if the duration is meaningful.
        if (durationSeconds > 0) {
          const sessionDocRef = doc(db, "users", user.uid, "sessions", sessionId.current);
          
          try {
            // Update the session document with the final duration and end time.
            await updateDoc(sessionDocRef, {
              durationSeconds: durationSeconds,
              endTime: serverTimestamp()
            });
          } catch (e) {
            // Silently fail. This write can sometimes be interrupted by the browser closing.
          }
        }
      }
    };

    // Fired when the tab becomes hidden or visible.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logDuration();
      }
    };

    // Add event listeners.
    window.addEventListener("beforeunload", logDuration);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function to remove listeners when the component unmounts.
    return () => {
      logDuration(); // Final attempt to log duration.
      window.removeEventListener("beforeunload", logDuration);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]); // Re-run if the user object changes.

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          body: JSON.stringify({ session: idToken }),
        });
        
        setUser(user);
        await fetchAndSetUserData(user);
      } else {
        await fetch("/api/auth/session", { method: "DELETE" });
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
        const onboardingUrl = new URL("/ems/onboarding", window.location.origin);
        onboardingUrl.searchParams.set("callbackUrl", fullUrl);
        router.push(onboardingUrl.pathname + onboardingUrl.search);
      }
    }
  }, [user, userData, loading, pathname, searchParams, router]);

  return null;
}

export const useAuth = () => useContext(AuthContext);
