"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, orderBy, startAt, endAt } from "firebase/firestore";
import { useAuth } from "./use-auth";
import { format } from "date-fns";

/**
 * TeamContext: The Global Organization Data Orchestrator
 * --------------------------------------------------
 * Centrally manages real-time synchronization with Firestore sub-collections.
 * Shared across the entire application to minimize listeners and ensure data consistency.
 */

interface TeamContextType {
  employees: any[];
  owner: any | null;
  stats: any | null;
  loading: boolean;
}

const TeamContext = createContext<TeamContextType>({
  employees: [],
  owner: null,
  stats: null,
  loading: true,
});

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user, userData, loading: authLoading } = useAuth();
  const [personnelData, setPersonnelData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // Track active sub-listeners globally to prevent duplicate attachments
  const listenersRef = useRef<Record<string, (() => void)[]>>({});
  const personnelListRef = useRef<string[]>([]);

  const clearListeners = useCallback(() => {
    Object.values(listenersRef.current).forEach(unsubs => unsubs.forEach(unsub => unsub()));
    listenersRef.current = {};
    personnelListRef.current = [];
  }, []);

  useEffect(() => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    
    // Safety check: If user logs out or org changes, clear everything
    if (authLoading) return;
    if (!targetOrgId) {
      clearListeners();
      setPersonnelData({});
      setLoading(false);
      return;
    }

    // --- STEP 1: SYNC PERSONNEL LIST ---
    const q = query(
      collection(db, "users"), 
      where("orgId", "==", targetOrgId)
    );

    const unsubscribePersonnel = onSnapshot(q, (snapshot) => {
      const allPersonnel = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const currentUids = allPersonnel.map(p => p.id);

      // Handle removals
      personnelListRef.current.forEach(uid => {
        if (!currentUids.includes(uid)) {
          if (listenersRef.current[uid]) {
            listenersRef.current[uid].forEach(unsub => unsub());
            delete listenersRef.current[uid];
          }
          setPersonnelData(prev => {
            const next = { ...prev };
            delete next[uid];
            return next;
          });
        }
      });
      personnelListRef.current = currentUids;

      const isPrivileged = userData?.role === 'Owner' || userData?.role === 'Admin' || !!userData?.ownedOrgId;

      allPersonnel.forEach(p => {
        setPersonnelData(prev => ({
          ...prev,
          [p.id]: {
            workShifts: [],
            heartbeat: null,
            ...prev[p.id],
            ...p
          }
        }));

        const isSelf = p.id === user?.uid;
        if (!isPrivileged && !isSelf) return;
        if (listenersRef.current[p.id]) return;

        const userUnsubs: (() => void)[] = [];

        // --- STEP 2: SYNC LIVE HEARTBEAT ---
        const hbRef = doc(db, "users", p.id, "live", "heartbeat");
        const unsubHb = onSnapshot(hbRef, (snap) => {
          const hbData = snap.exists() ? snap.data() : null;
          setPersonnelData(prev => ({
            ...prev,
            [p.id]: { ...prev[p.id], heartbeat: hbData }
          }));
        }, (err) => console.warn(`HB Error ${p.id}:`, err.message));
        userUnsubs.push(unsubHb);

        // --- STEP 3: SYNC TODAY'S SHIFTS (TARGETED) ---
        const shiftsRef = collection(db, "users", p.id, "workShifts");
        const qShifts = query(
            shiftsRef, 
            orderBy("__name__"), 
            startAt(todayStr), 
            endAt(todayStr + "\uf8ff")
        );

        const unsubShifts = onSnapshot(qShifts, (snap) => {
          const shifts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setPersonnelData(prev => ({
            ...prev,
            [p.id]: { ...prev[p.id], workShifts: shifts }
          }));
        }, (err) => console.warn(`Shifts Error ${p.id}:`, err.message));
        userUnsubs.push(unsubShifts);

        listenersRef.current[p.id] = userUnsubs;
      });

      setLoading(false);
    }, (err) => {
      console.error("Global personnel list error:", err);
      setLoading(false);
    });

    return () => {
      unsubscribePersonnel();
      // Note: We don't clear sub-listeners here to maintain the cache across navigation
      // They are only cleared if the user/org context actually changes.
    };
  }, [userData?.ownedOrgId, userData?.orgId, user?.uid, authLoading, clearListeners]);

  // Derive final data
  const employees = Object.values(personnelData).filter(p => {
    // Always exclude inactive users
    if (p.active === false) {
      return false;
    }

    // Handle owners
    if (p.role === 'Owner') {
      // Include owner ONLY if they have 'lastLoginAppVersion'
      return p.hasOwnProperty('lastLoginAppVersion');
    }

    // For non-owners, include them unless they are the currently logged-in user
    return p.id !== user?.uid;
  });
  const owner = Object.values(personnelData).find(p => p.id === user?.uid) || 
                Object.values(personnelData).find(p => p.role === 'Owner') || 
                userData;

  const stats = (() => {
    let totalSecondsToday = 0;
    let totalSecondsAllTime = 0;
    const orgAppMap: Record<string, number> = {};
    let activeCount = 0;
    let totalVelocity = 0;
    let velocityCount = 0;

    Object.values(personnelData).forEach(p => {
      if (p.heartbeat?.isCurrentlyRunning) activeCount++;
      totalSecondsAllTime += (p.totalSeconds || 0);

      p.workShifts?.forEach((s: any) => {
        totalSecondsToday += (s.liveMetrics?.totalSeconds || 0);
        if (s.liveBreakdown) {
          Object.entries(s.liveBreakdown).forEach(([app, secs]) => {
            orgAppMap[app] = (orgAppMap[app] || 0) + (secs as number);
          });
        }
        if (s.cognitiveReport?.velocity) {
          totalVelocity += s.cognitiveReport.velocity;
          velocityCount++;
        }
      });
    });

    const topApps = Object.entries(orgAppMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, secs]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        hours: (secs / 3600).toFixed(1),
        percentage: Math.round((secs / (totalSecondsToday || 1)) * 100)
      }));

    return {
      totalHoursToday: (totalSecondsToday / 3600).toFixed(1),
      totalOrgHours: (totalSecondsAllTime / 3600).toFixed(1),
      activeEmployees: activeCount,
      velocity: velocityCount > 0 ? Math.round(totalVelocity / velocityCount) : 100,
      topApps,
      totalStaff: employees.length,
      locationsCount: new Set(Object.values(personnelData).map(p => p.lastLoginLocation?.country)).size
    };
  })();

  return (
    <TeamContext.Provider value={{ employees, owner, stats, loading }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);