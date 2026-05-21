'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTeam } from '@/hooks/use-team';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  where,
  DocumentData,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { isEmployeeOnline } from '@/lib/utils';

export interface AttendanceLog {
  userId: string;
  userName: string;
  avatar?: string;
  date: string;
  shift: string;
  clockIn: string | null;
  clockOut: string | null;
  late: string;
  extraWorked: string;
  idleTime: number;
  totalHours: number;
  activeTime: number;
  breakTime: number;
  assignedTasksCount: number;
  keystrokes: number;
  mouseClicks: number;
  status: 'online' | 'offline' | 'on-break' | 'away';
  isVerified?: boolean;
  isFlagged?: boolean;
}

export function useAttendance() {
  const { employees: teamEmployees, loading: teamLoading, selectedDate } =
    useTeam();
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [tasksLoading, setTasksLoading] = useState(false);
  const { userData } = useAuth();
  const [orgData, setOrgData] = useState<DocumentData | null>(null);
  const [attendanceSettings, setAttendanceSettings] = useState<any>({});
  const [offDays, setOffDays] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  const orgId = userData?.ownedOrgId || userData?.orgId;
  const dateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [
    selectedDate,
  ]);

  useEffect(() => {
    if (!orgId) return;

    const fetchOrgData = async () => {
      const orgRef = collection(db, 'organizations');
      const q = query(orgRef, where('__name__', '==', orgId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const orgDocData = querySnapshot.docs[0].data();
        setOrgData(orgDocData);
        setAttendanceSettings(orgDocData.attendanceSettings || {});
        setOffDays(orgDocData.settings?.offDays || []);
      }
    };

    const fetchHolidays = async () => {
      const holidaysRef = collection(db, 'organizations', orgId, 'holidays');
      const holidaysSnap = await getDocs(holidaysRef);
      setHolidays(holidaysSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchOrgData();
    fetchHolidays();
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;

    async function fetchTasks() {
      setTasksLoading(true);
      try {
        const tasksRef = collection(db, 'organizations', orgId, 'tasks');
        const q = query(tasksRef, where('status', '!=', 'done'));
        const snap = await getDocs(q);

        const counts: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          const assignees = data.assignees || [];
          assignees.forEach((uid: string) => {
            counts[uid] = (counts[uid] || 0) + 1;
          });
        });
        setTaskCounts(counts);
      } catch (err) {
        console.error('Failed to fetch task counts:', err);
      } finally {
        setTasksLoading(false);
      }
    }

    fetchTasks();
  }, [orgId, dateStr]);

  const logs = useMemo(() => {
    return teamEmployees.map(emp => {
      const shifts = emp.workShifts || [];

      let clockIn = null;
      let clockOut = null;

      if (shifts.length > 0) {
        const sortedShifts = [...shifts].sort((a: any, b: any) =>
          a.id.localeCompare(b.id)
        );
        const firstShift = sortedShifts[0];
        const lastShift = sortedShifts[sortedShifts.length - 1];

        clockIn = firstShift.startTime || firstShift.createdAt;
        if (lastShift.status === 'completed' || lastShift.endTime) {
          clockOut = lastShift.endTime || lastShift.updatedAt;
        }
      }

      let totalSeconds = 0;
      let activeSeconds = 0;
      let breakSeconds = 0;
      let idleSeconds = 0;
      let keystrokes = 0;
      let mouseClicks = 0;

      shifts.forEach((s: any) => {
        const metrics = s.liveMetrics || s.metrics || {};
        activeSeconds += metrics.activeSeconds || 0;
        totalSeconds += metrics.totalSeconds || s.totalSeconds || 0;
        breakSeconds += metrics.breakSeconds || 0;
        idleSeconds += metrics.idleSeconds || 0;
        keystrokes += metrics.keystrokes || s.keystrokes || 0;
        mouseClicks += metrics.mouseClicks || s.mouseClicks || 0;
      });

      let status: any = 'offline';
      if (isEmployeeOnline(emp)) {
        status = 'online';
        if (shifts.some((s: any) => s.status === 'on-break'))
          status = 'on-break';
      }

      let late = '0m';
      let extraWorked = '0m';

      const shiftDefaults = emp.trackingSettings?.shiftDefaults;
      if (shiftDefaults && clockIn) {
        try {
          const [sHour, sMin] = shiftDefaults.startTime.split(':').map(Number);
          const shiftStart = new Date(selectedDate);
          shiftStart.setHours(sHour, sMin, 0, 0);

          const actualIn = new Date(clockIn);
          if (actualIn > shiftStart) {
            const diffMins = Math.floor(
              (actualIn.getTime() - shiftStart.getTime()) / 60000
            );
            if (diffMins > 5) {
              const h = Math.floor(diffMins / 60);
              const m = diffMins % 60;
              late = h > 0 ? `${h}h ${m}m` : `${m}m`;
            }
          }
        } catch (e) {}
      }

      if (shiftDefaults && clockOut) {
        try {
          const [eHour, eMin] = shiftDefaults.endTime.split(':').map(Number);
          const shiftEnd = new Date(selectedDate);
          shiftEnd.setHours(eHour, eMin, 0, 0);

          const actualOut = new Date(clockOut);
          if (actualOut > shiftEnd) {
            const diffMins = Math.floor(
              (actualOut.getTime() - shiftEnd.getTime()) / 60000
            );
            if (diffMins > 0) {
              const h = Math.floor(diffMins / 60);
              const m = diffMins % 60;
              extraWorked = h > 0 ? `${h}h ${m}m` : `${m}m`;
            }
          }
        } catch (e) {}
      }

      return {
        userId: emp.id,
        userName: emp.name || emp.displayName || 'Unknown',
        avatar: emp.photoUrl || emp.photoURL || null,
        date: dateStr,
        shift:
          emp.trackingSettings?.shiftDefaults
            ? `${emp.trackingSettings.shiftDefaults.startTime} - ${emp.trackingSettings.shiftDefaults.endTime}`
            : 'Flexible',
        clockIn: clockIn || null,
        clockOut: clockOut || null,
        late,
        extraWorked,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        activeTime: Number((activeSeconds / 3600).toFixed(2)),
        breakTime: Number((breakSeconds / 3600).toFixed(2)),
        idleTime: Number((idleSeconds / 3600).toFixed(2)),
        assignedTasksCount: taskCounts[emp.id] || 0,
        keystrokes,
        mouseClicks,
        status,
      } as AttendanceLog;
    });
  }, [teamEmployees, taskCounts, selectedDate, dateStr]);

  return {
    todayLogs: logs,
    fetchForDate: (date: string) => {},
    getLogsForRange: async (start: Date, end: Date) => [],
    loading: teamLoading,
    orgData: orgData,
    attendanceSettings: attendanceSettings,
    offDays: offDays,
    holidays: holidays,
  };
}
