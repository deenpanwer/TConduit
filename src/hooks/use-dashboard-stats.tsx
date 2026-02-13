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
    if (teamLoading || employees.length === 0) {
      if (!teamLoading) setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const today = startOfDay(new Date());
        const todayStr = format(today, "yyyy-MM-dd");

        let totalOrgHoursToday = 0;
        const orgAppMap: Record<string, number> = {};
        let activeEmployeeCount = 0;

        employees.forEach(emp => {
          const todayShift = emp.workShifts?.find((s: any) => s.id.startsWith(todayStr));
          if (todayShift?.liveMetrics) {
            totalOrgHoursToday += (todayShift.liveMetrics.totalSeconds || 0);
          }
          if (todayShift?.liveBreakdown) {
              Object.entries(todayShift.liveBreakdown).forEach(([app, secs]) => {
                  orgAppMap[app] = (orgAppMap[app] || 0) + (secs as number);
              });
          }
          if (emp.heartbeat?.isCurrentlyRunning) {
              activeEmployeeCount++;
          }
        });

        const topApps = Object.entries(orgAppMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, seconds]) => ({ 
                name, 
                hours: (seconds / 3600).toFixed(1), 
                percentage: Math.round((seconds / (totalOrgHoursToday || 1)) * 100) 
            }));

        setStats({
          totalHoursToday: (totalOrgHoursToday / 3600).toFixed(1),
          velocity: 114, // Placeholder, will be calculated in MasterDashboard for demo
          topApps,
          activeEmployees: activeEmployeeCount,
          totalStaff: employees.length,
          locationsCount: new Set(employees.map(e => e.lastLoginLocation?.country)).size,
        });

      } catch (error) {
        console.error("Error aggregating dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [employees, teamLoading]);

  return { stats, loading: loading || teamLoading, employees };
}