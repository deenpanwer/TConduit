
"use client";

import { useState, useEffect, useMemo } from "react";
import { storage } from "@/lib/storage";
import { format, isToday as isDateToday } from "date-fns";
import { useTeam } from "./use-team";
import { useAuth } from "./use-auth";

export function useSupervise(selectedDate: Date = new Date()) {
  const { employees, owner, loading: teamLoading } = useTeam();
  const { user } = useAuth();
  const [latestScreenshots, setLatestScreenshots] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const monitoredPersonnel = useMemo(() => {
    let list = [...employees];
    const isCurrentUserTracking = owner?.id === user?.uid && (owner?.hasOwnProperty('lastLoginAppVersion') || owner?.lastLoginAppVersion);
    const isAlreadyInList = list.some(p => p.id === user?.uid);

    if (isCurrentUserTracking && !isAlreadyInList && owner) {
      list.push(owner);
    }
    
    return list;
  }, [employees, owner, user?.uid]);

  useEffect(() => {
    if (teamLoading) return;
    
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const unsubscribe = storage.onSnapshot<any>("screenshots", (allScreenshots) => {
      const newScreenshots: Record<string, any[]> = {};

      monitoredPersonnel.forEach((emp) => {
        const empScreenshots = allScreenshots.filter(s => s.userId === emp.id);
        
        // Filter by date
        let filtered = empScreenshots.filter(s => s.timestamp.startsWith(dateStr));

        // If today and no screenshots, try to find latest
        let isFallback = false;
        if (filtered.length === 0 && isDateToday(selectedDate)) {
            filtered = [...empScreenshots].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 4);
            isFallback = filtered.length > 0;
        }

        newScreenshots[emp.id] = filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 4).map(s => ({
            ...s,
            employeeName: emp.name,
            isFallback
        }));
      });

      setLatestScreenshots(newScreenshots);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [monitoredPersonnel, teamLoading, selectedDate]);

  return {
    monitoredPersonnel,
    latestScreenshots,
    loading: loading || teamLoading,
  };
}
