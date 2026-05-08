"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { db } from "@/lib/firebase";
import { 
  collection, query, getDocs, 
  orderBy, startAt, endAt, doc, onSnapshot 
} from "firebase/firestore";
import { 
  format, parseISO, differenceInSeconds, isSameDay, 
  eachDayOfInterval, subDays, addMinutes, startOfDay
} from "date-fns";
import { isEmployeeOnline } from "@/lib/utils";
import { faker } from "@faker-js/faker";

export interface AttendanceLog {
  userId: string;
  userName: string;
  avatar?: string;
  date: string;
  shift: string; // "Recurring" or specific times
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number; // Decimal hours
  activeTime: number; // Decimal hours
  breakTime: number; // Decimal hours
  status: 'online' | 'offline' | 'on-break' | 'away';
  isVerified?: boolean;
  isFlagged?: boolean;
}

export function useAttendance() {
  const { userData } = useAuth();
  const { employees, loading: teamLoading } = useTeam();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  
  const orgId = userData?.ownedOrgId || userData?.orgId;

  // Listen to organization settings
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "organizations", orgId), (snap) => {
      if (snap.exists()) {
        setOrgData(snap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, [orgId]);

  // Memoize settings to prevent downstream infinite loops
  const attendanceSettings = useMemo(() => orgData?.attendanceSettings || {}, [orgData]);
  const offDays = useMemo(() => orgData?.settings?.offDays || [], [orgData]);
  const holidays = useMemo(() => orgData?.holidays || [], [orgData]);

  /**
   * Process shift documents into a single attendance log for a day
   */
  const processDayLogs = useCallback((employee: any, dateStr: string, shifts: any[]): AttendanceLog => {
    if (!shifts || shifts.length === 0) {
      const defaults = employee.trackingSettings?.shiftDefaults;
      return {
        userId: String(employee.id || ""),
        userName: String(employee.name || "Unknown"),
        avatar: employee.avatar || employee.photoUrl,
        date: String(dateStr),
        shift: defaults 
          ? `${defaults.startTime} - ${defaults.endTime}`
          : "Not Set",
        clockIn: null,
        clockOut: null,
        totalHours: 0,
        activeTime: 0,
        breakTime: 0,
        status: 'offline'
      };
    }

    // Sort shifts by start time
    const sortedShifts = [...shifts].sort((a, b) => {
      const aStart = a.startTime || (typeof a.id === 'string' ? a.id.split('_')[1] : "00:00") || "00:00";
      const bStart = b.startTime || (typeof b.id === 'string' ? b.id.split('_')[1] : "00:00") || "00:00";
      return String(aStart).localeCompare(String(bStart));
    });

    const firstShift = sortedShifts[0];
    const lastShift = sortedShifts[sortedShifts.length - 1];

    const clockIn = firstShift.startTime || firstShift.liveMetrics?.startTime || null;
    const clockOut = lastShift.endTime || lastShift.liveMetrics?.endTime || null;

    let totalSeconds = 0;
    let activeSeconds = 0;
    let idleSeconds = 0;

    const isToday = isSameDay(parseISO(dateStr), new Date());

    shifts.forEach(s => {
      const metrics = s.liveMetrics || s.metrics || {};
      activeSeconds += (metrics.activeSeconds || metrics.totalSeconds || 0);
      idleSeconds += (metrics.idleSeconds || 0);
    });

    if (clockIn && clockOut) {
      try {
        const start = new Date(`${dateStr}T${clockIn}`);
        const end = new Date(`${dateStr}T${clockOut}`);
        totalSeconds = differenceInSeconds(end, start);
      } catch (e) {
        console.warn("Date calculation error", e);
      }
    } else if (clockIn && isToday) {
      try {
        const start = new Date(`${dateStr}T${clockIn}`);
        totalSeconds = differenceInSeconds(new Date(), start);
      } catch (e) {
        console.warn("Date calculation error", e);
      }
    }

    // Break is either the idle time tracked by the app or the gaps between shifts
    const breakSeconds = idleSeconds > 0 ? idleSeconds : Math.max(0, totalSeconds - activeSeconds);

    let status: AttendanceLog['status'] = 'offline';
    if (isToday) {
      if (isEmployeeOnline(employee)) {
        status = 'online';
      } else if (shifts.some(s => s.status === 'active')) {
        status = 'on-break';
      }
    }

    return {
      userId: String(employee.id || ""),
      userName: String(employee.name || "Unknown"),
      avatar: employee.avatar || employee.photoUrl,
      date: String(dateStr),
      shift: employee.trackingSettings?.shiftDefaults 
        ? `${employee.trackingSettings.shiftDefaults.startTime} - ${employee.trackingSettings.shiftDefaults.endTime}`
        : "Flexible",
      clockIn: clockIn ? String(clockIn) : null,
      clockOut: clockOut ? String(clockOut) : null,
      totalHours: Number((totalSeconds / 3600).toFixed(1)),
      activeTime: Number((activeSeconds / 3600).toFixed(1)),
      breakTime: Number((breakSeconds / 3600).toFixed(1)),
      status
    };
  }, []);

  // --- DUMMY DATA GENERATION ---
  const dummyEmployees = useMemo(() => {
    return [
      { id: "dummy_1", name: "Sarah Connor", photoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah", trackingSettings: { shiftDefaults: { startTime: "09:00", endTime: "17:00" } } },
      { id: "dummy_2", name: "John McClane", photoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=John", trackingSettings: { shiftDefaults: { startTime: "10:00", endTime: "19:00" } } }
    ];
  }, []);

  const generateDummyShiftsForDate = useCallback((dateStr: string, empId: string) => {
    const isToday = isSameDay(parseISO(dateStr), new Date());
    const startHour = empId === "dummy_1" ? 9 : 10;
    
    // Multiple shifts per day
    const morningStart = `${String(startHour).padStart(2, "0")}:00:00`;
    const morningEnd = `${String(startHour + 4).padStart(2, "0")}:00:00`;
    const afternoonStart = `${String(startHour + 4).padStart(2, "0")}:45:00`;
    const afternoonEnd = isToday ? format(new Date(), "HH:mm:ss") : `${String(startHour + 8).padStart(2, "0")}:45:00`;

    return [
      {
        id: `${dateStr}_0`,
        startTime: morningStart,
        endTime: morningEnd,
        liveMetrics: { activeSeconds: 14400, idleSeconds: 300 }
      },
      {
        id: `${dateStr}_1`,
        startTime: afternoonStart,
        endTime: afternoonEnd,
        liveMetrics: { activeSeconds: 12000, idleSeconds: 600 },
        status: isToday ? 'active' : 'completed'
      }
    ];
  }, []);

  /**
   * Get attendance for today (Overview)
   */
  const todayLogs = useMemo(() => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const realLogs = employees.map(emp => processDayLogs(emp, dateStr, emp.workShifts || []));
    
    // Add Dummy Data for Today
    const dummyLogs = dummyEmployees.map(emp => {
       const shifts = generateDummyShiftsForDate(dateStr, emp.id);
       const log = processDayLogs(emp, dateStr, shifts);
       log.status = 'online'; // Force online for dummy
       return log;
    });

    return [...realLogs, ...dummyLogs];
  }, [employees, processDayLogs, dummyEmployees, generateDummyShiftsForDate]);

  /**
   * Fetch attendance for a date range (Ledger)
   */
  const getLogsForRange = useCallback(async (startDate: Date, endDate: Date) => {
    const rangeLogs: AttendanceLog[] = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // 1. Process Real Data
    if (orgId) {
      await Promise.all(employees.map(async (emp) => {
        try {
          const shiftsRef = collection(db, "users", emp.id, "workShifts");
          const q = query(
            shiftsRef,
            orderBy("__name__"),
            startAt(format(startDate, "yyyy-MM-dd")),
            endAt(format(endDate, "yyyy-MM-dd") + "\uf8ff")
          );

          const snap = await getDocs(q);
          const allShifts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          days.forEach(day => {
            const dStr = format(day, "yyyy-MM-dd");
            const dayShifts = allShifts.filter(s => typeof s.id === 'string' && s.id.startsWith(dStr));
            rangeLogs.push(processDayLogs(emp, dStr, dayShifts));
          });
        } catch (err) {
          console.error(`Failed to fetch logs for employee ${emp.id}:`, err);
        }
      }));
    }

    // 2. Inject Dummy Data (30 Days)
    dummyEmployees.forEach(emp => {
      days.forEach(day => {
        const dStr = format(day, "yyyy-MM-dd");
        // Randomly skip some days for realism
        if (faker.number.float() > 0.1) {
          const shifts = generateDummyShiftsForDate(dStr, emp.id);
          rangeLogs.push(processDayLogs(emp, dStr, shifts));
        }
      });
    });

    return rangeLogs.sort((a, b) => b.date.localeCompare(a.date));
  }, [orgId, employees, processDayLogs, dummyEmployees, generateDummyShiftsForDate]);

  return {
    todayLogs,
    getLogsForRange,
    loading: loading || teamLoading,
    orgData,
    attendanceSettings,
    offDays,
    holidays
  };
}
