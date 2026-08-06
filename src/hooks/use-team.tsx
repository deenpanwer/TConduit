
"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext, Suspense, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, orderBy, startAt, endAt, getDocs, limit } from "firebase/firestore";
import { useAuth } from "./use-auth";
import { format, parse, isSameDay, startOfMonth, endOfMonth, isValid } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cacheOrchestrator } from "@/lib/cache-orchestrator";
import { isEmployeeOnline } from "@/lib/utils";
import { generateDummyData } from "@/lib/dummy-data";

/**
 * TeamContext: The Global Organization Data Orchestrator
 * --------------------------------------------------
 * Centrally manages real-time synchronization with Firestore sub-collections.
 * Shared across the entire application to minimize listeners and ensure data consistency.
 * Hybrid Cache: Today's data is live; historical data is cached in IndexedDB.
 */

interface TeamContextType {
  employees: any[];
  owner: any | null;
  stats: {
    totalHoursToday: string;
    totalOrgHours: string;
    activeEmployees: number;
    velocity: number;
    topApps: { name: string; hours: string; percentage: number; details?: Record<string, number> }[];
    totalStaff: number;
    locationsCount: number;
    // New High-Density Metrics
    totalKeystrokes: number;
    totalMouseClicks: number;
    totalMouseDistance: number;
    totalMouseScrolls: number;
    totalBreakSeconds: number;
    hourlyActivity: Record<string, { seconds: number; keystrokes: number; mouseClicks: number; mouseDistance: number; mouseScrolls: number }>;
  } | null;
  loading: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  fetchMonthMetrics: (currentMonth: Date) => Promise<Record<string, { date: string; totalSeconds: number; activeEmployees: number }>>;
}

const TeamContext = createContext<TeamContextType>({
  employees: [],
  owner: null,
  stats: null,
  loading: true,
  selectedDate: new Date(),
  setSelectedDate: () => {},
  fetchMonthMetrics: async () => ({}),
});

function URLSync({ selectedDate, onDateFound }: { selectedDate: Date; onDateFound: (date: Date) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        const parsed = parse(dateParam, 'yyyy-MM-dd', new Date());
        if (isValid(parsed) && format(parsed, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
          onDateFound(parsed);
        }
      } catch (e) {}
    }
  }, [searchParams, selectedDate, onDateFound]);

  return null;
}

export function TeamProvider({ children, overrideOrgId }: { children: React.ReactNode; overrideOrgId?: string }) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [personnelData, setPersonnelData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, _setSelectedDate] = useState(new Date());

  // Add a 60-second ticker to force re-evaluation of staleness (online/offline)
  // This ensures the UI reflects status changes (e.g. 5-min threshold) even when no Firestore updates occur.
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Cache for monthly metrics to avoid re-fetching
  const monthCacheRef = useRef<Record<string, Record<string, { date: string; totalSeconds: number; activeEmployees: number }>>>({});

  const setSelectedDate = useCallback((date: Date) => {
    _setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const params = new URLSearchParams(window.location.search);
    params.set('date', dateStr);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);
  
  // Track active sub-listeners globally to prevent duplicate attachments
  const listenersRef = useRef<Record<string, (() => void)[]>>({});
  const personnelListRef = useRef<string[]>([]);

  const clearListeners = useCallback(() => {
    Object.values(listenersRef.current).forEach(unsubs => unsubs.forEach(unsub => unsub()));
    listenersRef.current = {};
    personnelListRef.current = [];
  }, []);

  const fetchMonthMetrics = useCallback(async (currentMonth: Date) => {
    // Use the current personnelData state as the source of truth for users
    const usersToFetch = Object.values(personnelData).filter(p => p.active !== false); // Only active users
    
    // Cache Key includes user count to prevent caching empty/partial states during initial load
    const monthKey = `${format(currentMonth, 'yyyy-MM')}-${usersToFetch.length}`;
    
    // Return cached if available
    if (monthCacheRef.current[monthKey]) {
      return monthCacheRef.current[monthKey];
    }

    const startStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endStr = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    console.log(`[useTeam] Fetching month metrics for ${monthKey}. Users found: ${usersToFetch.length}`);

    const metrics: Record<string, { date: string; totalSeconds: number; activeEmployees: number }> = {};

    await Promise.all(usersToFetch.map(async (p) => {
      try {
        const shiftsRef = collection(db, "users", p.id, "workShifts");
        const q = query(shiftsRef, orderBy("startTime", "desc"), limit(100));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
             console.log(`[useTeam] Found ${snapshot.size} shifts for ${p.name || p.id}`);
        }

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Fallback: extract date from ID if field is missing
          const date = data.date || doc.id.substring(0, 10);
          // Support both legacy and modern metrics location
          const seconds = data.liveMetrics?.totalSeconds || data.metrics?.totalSeconds || data.totalSeconds || 0;

          if (!metrics[date]) {
            metrics[date] = { date, totalSeconds: 0, activeEmployees: 0 };
          }

          if (seconds > 0) {
            metrics[date].totalSeconds += seconds;
            metrics[date].activeEmployees += 1;
          }
        });
      } catch (e) {
        console.warn(`Failed to fetch shifts for ${p.id} in ${monthKey}`, e);
      }
    }));

    // Cache the result
    monthCacheRef.current[monthKey] = metrics;
    return metrics;
  }, [personnelData]); // Re-create if personnel list changes

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    const targetOrgId = overrideOrgId || userData?.ownedOrgId || userData?.orgId;
    
    // Safety check: If user logs out or org changes, clear everything
    if (authLoading) return;
    if (!targetOrgId) {
      clearListeners();
      setPersonnelData({});
      setLoading(false);
      return;
    }

    const dateStr = selectedDateKey;
    const isToday = isSameDay(selectedDate, new Date());

    // --- STEP 0: SYNC ORGANIZATION SETTINGS (DUMMY DATA FLAG) ---
    const unsubOrg = onSnapshot(doc(db, "organizations", targetOrgId), (snap) => {
      const orgData = snap.data();
      const showDummy = orgData?.showDummyData;
      
      if (showDummy && isToday) {
        const dummyPersonnel = generateDummyData(targetOrgId);
        setPersonnelData(prev => ({
          ...prev,
          ...dummyPersonnel
        }));
        setLoading(false);
      } else {
        // Reactive Removal: Clear dummy data if the flag is disabled
        setPersonnelData(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            if (key.startsWith('dummy_')) delete next[key];
          });
          return next;
        });
      }
    });

    // --- HYBRID CACHE ORCHESTRATION ---
    // If viewing a past date, attempt to hydrate state from IndexedDB instantly.
    // This bypasses the network and provides a "Gem" like rapid-load experience.
    if (!isToday) {
      cacheOrchestrator.get(targetOrgId, dateStr).then(cached => {
        if (cached) {
          setPersonnelData(cached);
          setLoading(false);
        }
      });
    }

    // Clear sub-listeners when date changes to force fresh sync for the new range
    Object.values(listenersRef.current).forEach(unsubs => unsubs.forEach(unsub => unsub()));
    listenersRef.current = {};
    personnelListRef.current = [];

    // --- STEP 1: SYNC PERSONNEL LIST (GLOBAL ORG VIEW) ---
    // Establishes the baseline roster of employees for the target organization.
    const isClient = !!overrideOrgId;
    const role = isClient ? 'client' : userData?.role?.toLowerCase();
    const isManager = isClient ? false : role === 'manager';
    const isOwner = isClient ? false : (role === 'owner' || role === 'founder' || role === 'hr' || role === 'ops' || !!userData?.ownedOrgId);
    const userDept = isClient ? null : userData?.department;

    let q = query(
      collection(db, "users"), 
      where("orgId", "==", targetOrgId)
    );

    // Only restrict Managers; Owners/Founders/HR/Ops see everything
    if (isManager && userDept && !isOwner) {
      q = query(
        collection(db, "users"),
        where("orgId", "==", targetOrgId),
        where("department", "==", userDept)
      );
    }

    const unsubscribePersonnel = onSnapshot(q, async (snapshot) => {
      const allPersonnel = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const currentUids = allPersonnel.map(p => p.id);

      // --- CLEANUP: HANDLE DEPARTED PERSONNEL ---
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

      // --- BATCH PROCESSING: ARCHIVE MODE (HISTORICAL DATA) ---
      // For past dates, we avoid real-time listeners (N-listeners) to save cost and performance.
      // We perform a one-time "Batch Fetch" and commit the result to the local vault.
      if (!isToday) {
        const archivalData: Record<string, any> = {};
        
        await Promise.all(allPersonnel.map(async (p) => {
          /**
           * SCHEMA COMPATIBILITY NOTICE:
           * This query handles both Legacy (flat) and Modern (nested) shift documents.
           * The normalization happens in the derivation logic (stats calculation).
           * 
           * PHASE-OUT GUIDE (For Future Maintainers):
           * 1. Ensure all users' 'lastLoginAppVersion' is >= 2.0.0.
           * 2. Remove 'cognitiveReport' fallbacks in stats derivation.
           * 3. Assume liveBreakdown[app] is always an object, not a number.
           */
          try {
            const shiftsRef = collection(db, "users", p.id, "workShifts");
            const qShifts = query(shiftsRef, orderBy("startTime", "desc"), limit(30));
            
            const shiftSnap = await getDocs(qShifts);
            const shifts = shiftSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            archivalData[p.id] = {
              ...p,
              workShifts: shifts,
              heartbeat: null // Past dates are "set-in-stone", no live heartbeat
            };
          } catch (error) {
            console.warn(`[useTeam] Failed to fetch archival shifts for ${p.id}:`, error);
            archivalData[p.id] = {
              ...p,
              workShifts: [],
              heartbeat: null
            };
          }
        }));

        setPersonnelData(archivalData);
        // Commit to vault for future instant loads
        cacheOrchestrator.set(targetOrgId, dateStr, archivalData);
        setLoading(false);
        return;
      }

      // --- LIVE MODE: REAL-TIME SYNCHRONIZATION ---
      // Fetch initial shifts for all personnel and attach dedicated listeners for Heartbeats and Shifts
      await Promise.all(allPersonnel.map(async (p) => {
        // Fetch initial shift snapshots to prevent 0-hour delay on page load
        let initialShifts: any[] = personnelData[p.id]?.workShifts || [];
        try {
          const shiftsRef = collection(db, "users", p.id, "workShifts");
          const qShifts = query(shiftsRef, orderBy("startTime", "desc"), limit(30));
          const snap = await getDocs(qShifts);
          initialShifts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn(`[useTeam] Failed initial shift fetch for ${p.id}:`, e);
        }

        setPersonnelData(prev => {
          const currentShifts = prev[p.id]?.workShifts;
          const finalShifts = (currentShifts && currentShifts.length > 0) ? currentShifts : initialShifts;
          return {
            ...prev,
            [p.id]: {
              ...prev[p.id],
              ...p,
              workShifts: finalShifts,
              heartbeat: prev[p.id]?.heartbeat || null
            }
          };
        });

        if (listenersRef.current[p.id]) return;

        const userUnsubs: (() => void)[] = [];

        // --- STEP 2: SYNC LIVE HEARTBEAT (PULSE) ---
        const hbRef = doc(db, "users", p.id, "live", "heartbeat");
        const unsubHb = onSnapshot(hbRef, (snap) => {
          const hbData = snap.exists() ? snap.data() : null;
          setPersonnelData(prev => ({
            ...prev,
            [p.id]: { ...prev[p.id], heartbeat: hbData }
          }));
        }, (err) => console.warn(`HB Error ${p.id}:`, err.message));
        userUnsubs.push(unsubHb);

        // --- STEP 3: SYNC LIVE SHIFTS (ACTIVITY MONITORING) ---
        const shiftsRef = collection(db, "users", p.id, "workShifts");
        const qShifts = query(shiftsRef, orderBy("startTime", "desc"), limit(30));

        const unsubShifts = onSnapshot(qShifts, (snap) => {
          const shifts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setPersonnelData(prev => ({
            ...prev,
            [p.id]: { ...prev[p.id], workShifts: shifts }
          }));
        }, (err) => console.warn(`Shifts Error ${p.id}:`, err.message));
        userUnsubs.push(unsubShifts);

        listenersRef.current[p.id] = userUnsubs;
      }));

      setLoading(false);
    }, (err) => {
      console.error("Global personnel list error:", err);
      setLoading(false);
    });

    return () => {
      unsubOrg();
      unsubscribePersonnel();
    };
  }, [userData?.ownedOrgId, userData?.orgId, user?.uid, authLoading, clearListeners, selectedDateKey]);

  const employees = useMemo(() => {
    return Object.values(personnelData).filter(p => {
      // Always exclude inactive users and client profiles
      if (p.active === false || p.role === 'client' || p.isClient === true) return false;

      // Handle owners
      const role = p.role?.toLowerCase();
      if (role === 'owner') {
        // Include owner ONLY if they have 'lastLoginAppVersion' (meaning they use the Electron app)
        return p.hasOwnProperty('lastLoginAppVersion');
      }

      // For non-owners, include them unless they are the currently logged-in user
      // EXCEPTION: Logged-in users should see themselves if they are a Manager/Admin/Owner 
      // OR if they have completed the employee onboarding (meaning they are using the Desktop app to track time).
      if (p.id === user?.uid) {
        const myRole = userData?.role?.toLowerCase();
        const isPrivilegedUser = myRole === 'owner' || myRole === 'admin' || myRole === 'manager' || !!userData?.ownedOrgId;
        const usesDesktopApp = !!p.employeeOnboardingV1Complete || p.hasOwnProperty('lastLoginAppVersion');
        return isPrivilegedUser || usesDesktopApp;
      }

      return true;
    });
  }, [personnelData, user?.uid, userData?.role, userData?.ownedOrgId]);

  const owner = useMemo(() => Object.values(personnelData).find(p => p.id === user?.uid) || 
                Object.values(personnelData).find(p => p.role?.toLowerCase() === 'owner') || 
                userData, [personnelData, user?.uid, userData]);

  const parseShiftDateStr = (ts: any): string => {
    if (!ts) return "";
    let d: Date | null = null;
    if (ts?.toDate && typeof ts.toDate === "function") d = ts.toDate();
    else if (ts?.seconds) d = new Date(ts.seconds * 1000);
    else if (ts instanceof Date) d = ts;
    else if (typeof ts === "number") d = new Date(ts);
    else if (typeof ts === "string") {
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
    return d ? format(d, "yyyy-MM-dd") : "";
  };

  // --- STATS DERIVATION (REACTIVE AGGREGATION) ---
  // Calculates organization-wide metrics on-the-fly from the personnelData map.
  // This derivation is highly efficient as it executes in-memory.
  const stats = (() => {
    const targetDateStr = format(selectedDate, "yyyy-MM-dd");
    let totalSecondsToday = 0;
    let totalSecondsAllTime = 0;
    const orgAppMap: Record<string, { totalSeconds: number; details: Record<string, number> }> = {};
    let activeCount = 0;
    let totalVelocity = 0;
    let velocityCount = 0;

    // High-Density Aggregates
    let totalKeystrokes = 0;
    let totalMouseClicks = 0;
    let totalMouseDistance = 0;
    let totalMouseScrolls = 0;
    let totalBreakSeconds = 0;
    const hourlyActivity: Record<string, { seconds: number; keystrokes: number; mouseClicks: number; mouseDistance: number; mouseScrolls: number }> = {};

    Object.values(personnelData).forEach(p => {
      // 1. Live Pulse Tracking (Staleness Checked)
      if (isEmployeeOnline(p)) activeCount++;
      
      // 2. Lifecycle Metrics
      totalSecondsAllTime += (p.totalSeconds || 0);

      // 3. Shift-Level Aggregation for Target Date
      p.workShifts?.forEach((s: any) => {
        const sDate = s.dateStr || s.workDate || parseShiftDateStr(s.startTime) || parseShiftDateStr(s.clockIn) || (s.id?.includes('_') ? s.id.split('_')[0] : "");
        if (sDate !== targetDateStr) return;

        // Normalization: Source of Truth is always liveMetrics.totalSeconds
        const shiftMetrics = s.liveMetrics || s.metrics || {};
        const shiftSeconds = shiftMetrics.totalSeconds || s.totalSeconds || 0;
        totalSecondsToday += shiftSeconds;

        // Aggregate High-Density Metrics
        totalKeystrokes += (shiftMetrics.keystrokes || s.keystrokes || 0);
        totalMouseClicks += (shiftMetrics.mouseClicks || s.mouseClicks || 0);
        totalMouseDistance += (shiftMetrics.mouseDistance || s.mouseDistance || 0);
        totalMouseScrolls += (shiftMetrics.mouseScrolls || shiftMetrics.mouseScroll || shiftMetrics.scrollDistance || s.mouseScrolls || s.scrollDistance || 0);
        totalBreakSeconds += (shiftMetrics.breakSeconds || 0);

        // Application Breakdown: Handles both number (Legacy) and object (Modern) formats.
        if (s.liveBreakdown) {
          Object.entries(s.liveBreakdown).forEach(([app, data]) => {
            const isLegacy = typeof data === 'number';
            const secs = isLegacy ? data : (data as any)?.totalSeconds || 0;
            const details = isLegacy ? {} : (data as any)?.details || {};

            if (!orgAppMap[app]) orgAppMap[app] = { totalSeconds: 0, details: {} };
            orgAppMap[app].totalSeconds += secs;
            
            // Merge details (window titles)
            Object.entries(details).forEach(([title, time]) => {
              orgAppMap[app].details[title] = (orgAppMap[app].details[title] || 0) + (time as number);
            });
          });
        }

        // Hourly Pulse Aggregation (New high-density structure)
        if (s.hourlyPulse) {
          Object.entries(s.hourlyPulse).forEach(([hour, data]: [string, any]) => {
            if (!hourlyActivity[hour]) hourlyActivity[hour] = { seconds: 0, keystrokes: 0, mouseClicks: 0, mouseDistance: 0, mouseScrolls: 0 };
            const hMetrics = data.metrics || data;
            hourlyActivity[hour].seconds += (hMetrics.totalSeconds || hMetrics.seconds || 0);
            hourlyActivity[hour].keystrokes += (hMetrics.keystrokes || 0);
            hourlyActivity[hour].mouseClicks += (hMetrics.mouseClicks || 0);
            hourlyActivity[hour].mouseDistance += (hMetrics.mouseDistance || hMetrics.distance || 0);
            hourlyActivity[hour].mouseScrolls += (hMetrics.mouseScrolls || hMetrics.mouseScroll || hMetrics.scrollDistance || hMetrics.scrollAmount || 0);
          });
        }

        // Productivity Velocity: Fallback for older schemas (cognitiveReport)
        const velocity = s.velocity ?? s.cognitiveReport?.velocity;
        if (velocity !== undefined && velocity !== null) {
          totalVelocity += velocity;
          velocityCount++;
        }
      });
    });

    // 4. Transform App Map to Sorted Array
    const topApps = Object.entries(orgAppMap)
      .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
      .map(([name, data]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        hours: (data.totalSeconds / 3600).toFixed(1),
        percentage: Math.round((data.totalSeconds / (totalSecondsToday || 1)) * 100),
        details: data.details
      }));

    return {
      totalHoursToday: (totalSecondsToday / 3600).toFixed(1),
      totalOrgHours: (totalSecondsAllTime / 3600).toFixed(1),
      activeEmployees: activeCount,
      velocity: velocityCount > 0 ? Math.round(totalVelocity / velocityCount) : 100,
      topApps,
      totalStaff: employees.length,
      locationsCount: new Set(Object.values(personnelData).map(p => p.lastLoginLocation?.country)).size,
      totalKeystrokes,
      totalMouseClicks,
      totalMouseDistance,
      totalMouseScrolls,
      totalBreakSeconds,
      hourlyActivity
    };
  })();

  return (
    <TeamContext.Provider value={{ employees, owner, stats, loading, selectedDate, setSelectedDate, fetchMonthMetrics }}>
      <Suspense fallback={null}>
        <URLSync selectedDate={selectedDate} onDateFound={_setSelectedDate} />
      </Suspense>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
