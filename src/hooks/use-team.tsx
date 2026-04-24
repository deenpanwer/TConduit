
"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext, Suspense } from "react";
import { storage } from "@/lib/storage";
import { useAuth } from "./use-auth";
import { format, parse, isSameDay, startOfMonth, endOfMonth, isValid } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { isEmployeeOnline } from "@/lib/utils";

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

  const setSelectedDate = useCallback((date: Date) => {
    _setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const params = new URLSearchParams(window.location.search);
    params.set('date', dateStr);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  const fetchMonthMetrics = useCallback(async (currentMonth: Date) => {
    const startStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endStr = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    
    const allShifts = storage.getCollection<any>("shifts");
    const metrics: Record<string, { date: string; totalSeconds: number; activeEmployees: number }> = {};

    allShifts.forEach(shift => {
      const date = shift.startTime.substring(0, 10);
      if (date >= startStr && date <= endStr) {
        const seconds = shift.totalSeconds || 0;
        if (!metrics[date]) {
          metrics[date] = { date, totalSeconds: 0, activeEmployees: 0 };
        }
        metrics[date].totalSeconds += seconds;
        metrics[date].activeEmployees += 1;
      }
    });

    return metrics;
  }, []);

  useEffect(() => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (authLoading) return;
    if (!targetOrgId) {
      setPersonnelData({});
      setLoading(false);
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const refreshData = () => {
      const allUsers = storage.getCollection<any>("users");
      const orgUsers = allUsers.filter(u => u.orgId === targetOrgId);
      const allShifts = storage.getCollection<any>("shifts");
      const allScreenshots = storage.getCollection<any>("screenshots");
      const allTimeEntries = storage.getCollection<any>("time_entries");

      const enrichedData: Record<string, any> = {};
      orgUsers.forEach(u => {
        const allUserShifts = allShifts.filter(s => s.userId === u.id);
        const dayShifts = allUserShifts.filter(s => s.startTime.startsWith(dateStr));
        
        const userScreenshots = allScreenshots.filter(s => s.userId === u.id);
        const userTimeEntries = allTimeEntries.filter(t => t.userId === u.id);

        enrichedData[u.id] = {
          ...u,
          workShifts: allUserShifts,
          dailyShifts: dayShifts,
          screenshots: userScreenshots,
          timeEntries: userTimeEntries,
          heartbeat: u.heartbeat || { updatedAt: u.lastActive }
        };
      });

      setPersonnelData(enrichedData);
      setLoading(false);
    };

    const unsubscribeUsers = storage.onSnapshot<any>("users", refreshData);
    const unsubscribeShifts = storage.onSnapshot<any>("shifts", refreshData);
    const unsubscribeScreenshots = storage.onSnapshot<any>("screenshots", refreshData);
    const unsubscribeTimeEntries = storage.onSnapshot<any>("time_entries", refreshData);

    return () => {
      unsubscribeUsers();
      unsubscribeShifts();
      unsubscribeScreenshots();
      unsubscribeTimeEntries();
    };
  }, [userData?.ownedOrgId, userData?.orgId, authLoading, selectedDate]);

  const employees = Object.values(personnelData).filter(p => p.active !== false);
  const owner = Object.values(personnelData).find(p => p.id === user?.uid) || userData;

  const stats = (() => {
    let totalSecondsToday = 0;
    let totalSecondsAllTime = 0;
    const orgAppMap: Record<string, { totalSeconds: number; details: Record<string, number> }> = {};
    let activeCount = 0;
    let totalKeystrokes = 0;
    let totalMouseClicks = 0;

    Object.values(personnelData).forEach(p => {
      if (p.status === 'online') activeCount++;
      totalSecondsAllTime += (p.workShifts || []).reduce((acc: number, s: any) => acc + (s.totalSeconds || 0), 0);
      
      // Use dailyShifts for today's stats
      if (p.dailyShifts) {
        p.dailyShifts.forEach((s: any) => {
            const shiftMetrics = s.liveMetrics || s.metrics || {};
            totalSecondsToday += (shiftMetrics.totalSeconds || s.totalSeconds || 0);
            totalKeystrokes += (shiftMetrics.keystrokes || s.keystrokes || 0);
            totalMouseClicks += (shiftMetrics.mouseClicks || s.mouseClicks || 0);

            if (s.liveBreakdown) {
              Object.entries(s.liveBreakdown).forEach(([app, data]: [string, any]) => {
                const secs = typeof data === 'number' ? data : (data?.totalSeconds || 0);
                if (!orgAppMap[app]) orgAppMap[app] = { totalSeconds: 0, details: {} };
                orgAppMap[app].totalSeconds += secs;
              });
            }
        });
      }
    });

    const topApps = Object.entries(orgAppMap)
      .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
      .map(([name, data]) => ({
        name,
        hours: (data.totalSeconds / 3600).toFixed(1),
        percentage: Math.round((data.totalSeconds / (totalSecondsToday || 1)) * 100)
      }));

    return {
      totalHoursToday: (totalSecondsToday / 3600).toFixed(1),
      totalOrgHours: (totalSecondsAllTime / 3600).toFixed(1),
      activeEmployees: activeCount || 0,
      velocity: Math.floor(Math.random() * 20) + 80,
      topApps: topApps || [],
      totalStaff: employees.length || 0,
      locationsCount: 3,
      totalKeystrokes: totalKeystrokes || 0,
      totalMouseClicks: totalMouseClicks || 0,
      totalMouseDistance: (totalMouseClicks * 5) || 0,
      hourlyActivity: {}
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
