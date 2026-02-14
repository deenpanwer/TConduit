"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore";
import { useTeam } from "./use-team";
import { startOfDay, startOfMonth, subDays, format } from "date-fns";

export function useDashboardStats() {
  const { employees, loading: teamLoading } = useTeam();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamLoading) return;
    
    if (employees.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const today = startOfDay(new Date());
      const todayStr = format(today, "yyyy-MM-dd");

      let totalOrgHoursToday = 0;
      const orgAppMap: Record<string, number> = {};
      let activeEmployeeCount = 0;

      const getDate = (ts: any) => {
        if (!ts) return new Date(0);
        if (ts.toDate) return ts.toDate();
        if (ts instanceof Date) return ts;
        if (ts.seconds) return new Date(ts.seconds * 1000);
        return new Date(ts);
      };

      employees.forEach(emp => {
        const shifts = emp.workShifts || [];
        shifts.forEach((shift: any) => {
          const shiftStart = getDate(shift.startTime);
          if (format(shiftStart, "yyyy-MM-dd") === todayStr) {
            totalOrgHoursToday += (shift.liveMetrics?.totalSeconds || 0);
            
            if (shift.liveBreakdown) {
              Object.entries(shift.liveBreakdown).forEach(([app, secs]) => {
                orgAppMap[app] = (orgAppMap[app] || 0) + (secs as number);
              });
            }
          }
        });

        if (emp.heartbeat?.isCurrentlyRunning) {
            activeEmployeeCount++;
        }
      });

      const allApps = Object.entries(orgAppMap)
          .sort((a, b) => b[1] - a[1])
          .map(([name, seconds]) => ({ 
              name, 
              hours: (seconds / 3600).toFixed(1), 
              percentage: Math.round((seconds / (totalOrgHoursToday || 1)) * 100) 
          }));

      setStats({
        totalHoursToday: (totalOrgHoursToday / 3600).toFixed(1),
        velocity: 114, 
        topApps: allApps,
        activeEmployees: activeEmployeeCount,
        totalStaff: employees.length,
        locationsCount: new Set(employees.map(e => e.lastLoginLocation?.country)).size,
      });

    } catch (error) {
      console.error("Error aggregating dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, [employees, teamLoading]);

  return { stats, loading: loading || teamLoading, employees };
}