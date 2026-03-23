"use client";

import { useState, useEffect, useMemo } from "react";
import { useTeam } from "./use-team";
import { format } from "date-fns";
import { useAuth } from "./use-auth";

export interface DayMetric {
  date: string;
  totalSeconds: number;
  activeEmployees: number;
}

export function useCalendar(currentMonth: Date) {
  const { userData } = useAuth();
  const { fetchMonthMetrics } = useTeam();
  const [monthlyMetrics, setMonthlyMetrics] = useState<Record<string, DayMetric>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  // 1. Fetch Month-Wide Heatmap Data
  useEffect(() => {
    const fetchMonthData = async () => {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (!orgId) return;

      setLoadingMonth(true);
      try {
        const metrics = await fetchMonthMetrics(currentMonth);
        setMonthlyMetrics(metrics);
      } catch (error) {
        console.error("Error fetching calendar heatmap:", error);
      } finally {
        setLoadingMonth(false);
      }
    };

    fetchMonthData();
  }, [currentMonth, userData?.orgId, userData?.ownedOrgId, fetchMonthMetrics]);

  return {
    monthlyMetrics,
    loadingMonth
  };
}

/**
 * Aggregates daily stats from the provided user list (from useTeam).
 * Calculates Total Output, Top 3 Contributors, and Raw App Breakdown for AI.
 */
export function useDailyBreakdown(users: any[], selectedDate: Date) {
  return useMemo(() => {
    const dayStr = format(selectedDate, "yyyy-MM-dd");
    let totalSeconds = 0;
    const rawBreakdown: any = {};
    const employeesWorking: {
      name: string;
      seconds: number;
      avatar?: string;
    }[] = [];

    users.forEach((person) => {
      if (!person) return;
      
      const shifts = person.workShifts || [];
      let personSeconds = 0;

      shifts.forEach((shift: any) => {
        // Match by ID prefix (YYYY-MM-DD...) for robustness
        if (shift.id && shift.id.startsWith(dayStr)) {
          // Normalize seconds (handle legacy/modern structures if needed)
          const seconds = shift.liveMetrics?.totalSeconds || shift.totalSeconds || 0;
          personSeconds += seconds;
          totalSeconds += seconds;

          // Aggregate raw breakdown for AI analysis
          if (shift.liveBreakdown) {
            Object.entries(shift.liveBreakdown).forEach(
              ([app, details]: [string, any]) => {
                if (!rawBreakdown[app])
                  rawBreakdown[app] = { activeSeconds: 0, details: {} };
                
                // Handle legacy (number) vs modern (object) breakdown
                const appSeconds = typeof details === 'number' ? details : (details.activeSeconds || details.totalSeconds || 0);
                rawBreakdown[app].activeSeconds += appSeconds;
                
                // Merge details (simplified)
                if (typeof details !== 'number' && details.details) {
                  Object.assign(rawBreakdown[app].details, details.details);
                }
              },
            );
          }
        }
      });

      if (personSeconds > 0) {
        employeesWorking.push({
          name: person.name || person.displayName || "Unknown",
          seconds: personSeconds,
          avatar: person.photoURL || person.imageUrl,
        });
      }
    });

    return {
      totalSeconds,
      rawBreakdown,
      employeesWorking: employeesWorking.sort((a, b) => b.seconds - a.seconds),
    };
  }, [users, selectedDate]);
}
