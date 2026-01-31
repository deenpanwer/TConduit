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
        
        // Return minimal stats, deep fetching will be done in components
        setStats({
          totalHoursToday: "0.0", // Components will calculate their own
          velocity: 114, 
          topApps: [],
          activeEmployees: employees.filter(e => e.heartbeat?.isCurrentlyRunning).length,
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