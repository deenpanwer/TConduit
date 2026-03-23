"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext, Suspense } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, orderBy, startAt, endAt, getDocs } from "firebase/firestore";
import { useAuth } from "./use-auth";
import { format, parse, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cacheOrchestrator } from "@/lib/cache-orchestrator";

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
    hourlyActivity: Record<string, { seconds: number; keystrokes: number; mouseClicks: number }>;
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

function URLSync({ onDateFound }: { onDateFound: (date: Date) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        const parsed = parse(dateParam, 'yyyy-MM-dd', new Date());
        onDateFound(parsed);
      } catch (e) {}
    }
  }, [searchParams, onDateFound]);

  return null;
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [personnelData, setPersonnelData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, _setSelectedDate] = useState(new Date());

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
        // Query by ID (YYYY-MM-DD...) instead of 'date' field to ensure robustness
        const q = query(
          shiftsRef,
          orderBy("__name__"),
          startAt(startStr),
          endAt(endStr + "\uf8ff")
        );
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

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const isToday = isSameDay(selectedDate, new Date());

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

    // --- STEP 1: SYNC PERSONNEL LIST (GLOBAL ORG VIEW) ---
    // Establishes the baseline roster of employees for the target organization.
    const q = query(
      collection(db, "users"), 
      where("orgId", "==", targetOrgId)
    );

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

      const isPrivileged = userData?.role === 'Owner' || userData?.role === 'Admin' || !!userData?.ownedOrgId;

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
          const shiftsRef = collection(db, "users", p.id, "workShifts");
          const qShifts = query(
              shiftsRef, 
              orderBy("__name__"), 
              startAt(dateStr), 
              endAt(dateStr + "\uf8ff")
          );
          
          const shiftSnap = await getDocs(qShifts);
          const shifts = shiftSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          archivalData[p.id] = {
            ...p,
            workShifts: shifts,
            heartbeat: null // Past dates are "set-in-stone", no live heartbeat
          };
        }));

        setPersonnelData(archivalData);
        // Commit to vault for future instant loads
        cacheOrchestrator.set(targetOrgId, dateStr, archivalData);
        setLoading(false);
        return;
      }

      // --- LIVE MODE: REAL-TIME SYNCHRONIZATION ---
      // Attaches dedicated listeners for Heartbeats and Shifts for the current date.
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
        const qShifts = query(
            shiftsRef, 
            orderBy("__name__"), 
            startAt(dateStr), 
            endAt(dateStr + "\uf8ff")
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
    };
  }, [userData?.ownedOrgId, userData?.orgId, user?.uid, authLoading, clearListeners, selectedDate]);

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

  // --- STATS DERIVATION (REACTIVE AGGREGATION) ---
  // Calculates organization-wide metrics on-the-fly from the personnelData map.
  // This derivation is highly efficient as it executes in-memory.
  const stats = (() => {
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
    const hourlyActivity: Record<string, { seconds: number; keystrokes: number; mouseClicks: number }> = {};

    Object.values(personnelData).forEach(p => {
      // 1. Live Pulse Tracking
      if (p.heartbeat?.isCurrentlyRunning) activeCount++;
      
      // 2. Lifecycle Metrics
      totalSecondsAllTime += (p.totalSeconds || 0);

      // 3. Shift-Level Aggregation
      p.workShifts?.forEach((s: any) => {
        // Normalization: Source of Truth is always liveMetrics.totalSeconds
        const shiftMetrics = s.liveMetrics || s.metrics || {};
        const shiftSeconds = shiftMetrics.totalSeconds || s.totalSeconds || 0;
        totalSecondsToday += shiftSeconds;

        // Aggregate High-Density Metrics
        totalKeystrokes += (shiftMetrics.keystrokes || s.keystrokes || 0);
        totalMouseClicks += (shiftMetrics.mouseClicks || s.mouseClicks || 0);
        totalMouseDistance += (shiftMetrics.mouseDistance || s.mouseDistance || 0);

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
            if (!hourlyActivity[hour]) hourlyActivity[hour] = { seconds: 0, keystrokes: 0, mouseClicks: 0 };
            const hMetrics = data.metrics || data;
            hourlyActivity[hour].seconds += (hMetrics.totalSeconds || hMetrics.seconds || 0);
            hourlyActivity[hour].keystrokes += (hMetrics.keystrokes || 0);
            hourlyActivity[hour].mouseClicks += (hMetrics.mouseClicks || 0);
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
      hourlyActivity
    };
  })();

  return (
    <TeamContext.Provider value={{ employees, owner, stats, loading, selectedDate, setSelectedDate, fetchMonthMetrics }}>
      <Suspense fallback={null}>
        <URLSync onDateFound={_setSelectedDate} />
      </Suspense>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);