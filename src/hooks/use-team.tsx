"use client";

import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, Suspense } from "react";
import { db } from "@/lib/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import { useAuth } from "./use-auth";
import { format, parse } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { generateDemoEmployeesData } from "@/lib/demo-data";

// --- CONSTANTS ---
const LOCAL_STORAGE_KEY = 'trac_demo_personnel';

// --- TYPES ---
interface TeamContextType {
  employees: any[];
  owner: any | null;
  stats: any | null;
  loading: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  addDemoEmployees: (count: number) => Promise<void>;
  removeDemoEmployee: (uid: string) => void;
  clearAllDemoEmployees: () => void;
}

const TeamContext = createContext<TeamContextType>({
  employees: [],
  owner: null,
  stats: null,
  loading: true,
  selectedDate: new Date(),
  setSelectedDate: () => {},
  addDemoEmployees: async () => {},
  removeDemoEmployee: () => {},
  clearAllDemoEmployees: () => {},
});


// --- Helper Component for URL Date Sync ---
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


// --- MAIN PROVIDER ---
export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [personnelData, setPersonnelData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, _setSelectedDate] = useState(new Date());

  const unsubRef = useRef<() => void | undefined>();

  // --- Date Management ---
  const setSelectedDate = useCallback((date: Date) => {
    _setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const params = new URLSearchParams(window.location.search);
    params.set('date', dateStr);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  // --- Local-First Demo Management ---
  const addDemoEmployees = useCallback(async (count: number) => {
    const orgId = userData?.ownedOrgId || userData?.orgId;
    if (!orgId) return;

    const newStaffData = generateDemoEmployeesData(orgId, count);
    
    setPersonnelData(prev => {
      const next = { ...prev };
      newStaffData.forEach(s => { next[s.id] = s; });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [userData]);

  const removeDemoEmployee = useCallback((uid: string) => {
    setPersonnelData(prev => {
      const next = { ...prev };
      if (next[uid]?.id.startsWith('demo_')) {
        delete next[uid];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const clearAllDemoEmployees = useCallback(() => {
    setPersonnelData(prev => {
      const next: Record<string, any> = {};
      // Keep the real user, remove all demo users
      if (user?.uid && prev[user.uid]) {
        next[user.uid] = prev[user.uid];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [user?.uid]);

  // --- Data Sync Effect ---
  useEffect(() => {
    // Unsubscribe from previous listener
    if (unsubRef.current) {
      unsubRef.current();
    }

    // 1. Initialize from localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let initialData = {};
    if (saved) {
      try {
        initialData = JSON.parse(saved);
      } catch (e) { console.error("Failed to parse demo data from localStorage", e); }
    }
    setPersonnelData(initialData);

    // 2. Only sync the REAL authenticated user from Firestore
    if (user?.uid) {
      const userDocRef = doc(db, "users", user.uid);
      unsubRef.current = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const firestoreData = snap.data();
          setPersonnelData(prev => ({
            ...prev,
            [user.uid]: { ...prev[user.uid], ...firestoreData, id: user.uid }
          }));
        }
        setLoading(false);
      }, (error) => {
        console.error("Firestore listener error for user:", error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [user?.uid, authLoading]);

  // --- DERIVED STATE ---
  const employees = Object.values(personnelData).filter(p => p && p.id !== user?.uid && p.active !== false);
  const owner = personnelData[user?.uid || ''] || userData;

  const stats = useMemo(() => {
    // This logic works as-is because it iterates over `personnelData`, which now contains both local and real data.
    // However, the `workShifts` for demo users are not real-time. We will adjust based on selectedDate.
    let totalSecondsToday = 0;
    const orgAppMap: Record<string, number> = {};
    let activeCount = 0;
    
    Object.values(personnelData).forEach(p => {
      if (!p) return;
      if (p.heartbeat?.isCurrentlyRunning) activeCount++;

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const todayShifts = p.workShifts?.filter((s:any) => s.id.startsWith(dateStr)) || [];
      
      todayShifts.forEach((s: any) => {
        const shiftSeconds = s.liveMetrics?.totalSeconds || 0;
        totalSecondsToday += shiftSeconds;
        if (s.liveBreakdown) {
          Object.entries(s.liveBreakdown).forEach(([app, data]) => {
            const secs = typeof data === 'number' ? data : (data as any)?.totalSeconds || 0;
            orgAppMap[app] = (orgAppMap[app] || 0) + secs;
          });
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
      activeEmployees: activeCount,
      topApps,
      totalStaff: employees.length,
    };
  }, [personnelData, selectedDate, employees.length]);

  return (
    <TeamContext.Provider value={{ employees, owner, stats, loading, selectedDate, setSelectedDate, addDemoEmployees, removeDemoEmployee, clearAllDemoEmployees }}>
      <Suspense fallback={null}>
        <URLSync onDateFound={_setSelectedDate} />
      </Suspense>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);