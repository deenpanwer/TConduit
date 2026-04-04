"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, limit, onSnapshot, getDocs 
} from "firebase/firestore";
import { format, isToday as isDateToday } from "date-fns";
import { useTeam } from "./use-team";
import { useAuth } from "./use-auth";

/**
 * useSupervise: Tracks the latest screenshots for all relevant personnel.
 * ----------------------------------------------------------------------
 * Automatically identifies who should be monitored (employees + self if using the app).
 * Syncs the most recent 4 screenshots from Firestore for each person to provide AI context.
 */

export function useSupervise(selectedDate: Date = new Date()) {
  const { employees, owner, loading: teamLoading } = useTeam();
  const { user } = useAuth();
  const [latestScreenshots, setLatestScreenshots] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // 1. Identify everyone who should be supervised
  const monitoredPersonnel = useMemo(() => {
    let list = [...employees];
    const isCurrentUserTracking = owner?.id === user?.uid && (owner?.hasOwnProperty('lastLoginAppVersion') || owner?.lastLoginAppVersion);
    const isAlreadyInList = list.some(p => p.id === user?.uid);

    if (isCurrentUserTracking && !isAlreadyInList && owner) {
      list.push(owner);
    }
    
    return list;
  }, [employees, owner, user?.uid]);

  // 2. Setup real-time listeners for the latest 4 screenshots
  useEffect(() => {
    if (teamLoading) return;
    
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const unsubscribers: (() => void)[] = [];

    monitoredPersonnel.forEach((emp) => {
      setLatestScreenshots((prev) => ({ ...prev, [emp.id]: [] }));

      // --- DEMO EMPLOYEE HANDLER ---
      if (emp.id.startsWith('demo_')) {
        const screenshotsForDay = (emp.screenshots || {})[dateStr] || [];
        if (screenshotsForDay.length > 0) {
          const sorted = [...screenshotsForDay].sort((a, b) => {
              const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
              const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
              return tB - tA;
          }).slice(0, 4).map(s => ({ ...s, employeeName: emp.name, isFallback: false }));
          
          setLatestScreenshots((prev) => ({ ...prev, [emp.id]: sorted }));
        } else if (isDateToday(selectedDate)) {
            const allDates = Object.keys(emp.screenshots || {}).sort().reverse();
            if (allDates.length > 0) {
                const latestDate = allDates[0];
                const fallbackScreenshots = emp.screenshots[latestDate] || [];
                if (fallbackScreenshots.length > 0) {
                    const sorted = [...fallbackScreenshots].sort((a, b) => {
                        const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
                        const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
                        return tB - tA;
                    }).slice(0, 4).map(s => ({ ...s, employeeName: emp.name, isFallback: true }));
                    
                    setLatestScreenshots((prev) => ({ ...prev, [emp.id]: sorted }));
                }
            }
        }
        return;
      }

      // --- REAL EMPLOYEE HANDLER (FIRESTORE) ---
      const screenshotRef = collection(db, "users", emp.id, "screenshots", dateStr, "images");
      const screenQuery = query(screenshotRef, orderBy("timestamp", "desc"), limit(4));

      const unsub = onSnapshot(screenQuery, (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.id,
            employeeName: emp.name, 
            isFallback: false 
          }));
          setLatestScreenshots((prev) => ({ ...prev, [emp.id]: data }));
        } else if (isDateToday(selectedDate)) {
          const datesRef = collection(db, "users", emp.id, "screenshots");
          
          getDocs(datesRef).then(dateSnap => {
              if (!dateSnap.empty) {
                  // Sort dates in-memory to find the latest one without an index
                  const allDates = dateSnap.docs.map(d => d.id).sort((a, b) => b.localeCompare(a));
                  const latestDateId = allDates[0];

                  if (latestDateId !== dateStr) {
                      const fallbackRef = collection(db, "users", emp.id, "screenshots", latestDateId, "images");
                      const fallbackQuery = query(fallbackRef, orderBy("timestamp", "desc"), limit(4));
                      
                      getDocs(fallbackQuery).then(imgSnap => {
                          if (!imgSnap.empty) {
                              const imgData = imgSnap.docs.map(doc => ({ 
                                ...doc.data(), 
                                id: doc.id,
                                employeeName: emp.name, 
                                isFallback: true 
                              }));
                              setLatestScreenshots((prev) => {
                                  if (prev[emp.id] && prev[emp.id].length > 0 && !prev[emp.id][0].isFallback) return prev;
                                  return { ...prev, [emp.id]: imgData };
                              });
                          }
                      });
                  }
              }
          });
        } else {
          setLatestScreenshots((prev) => ({ ...prev, [emp.id]: [] }));
        }
      }, (error) => {
        console.warn(`Supervise Listener Error for ${emp.id}:`, error.message);
      });
      
      unsubscribers.push(unsub);
    });

    setLoading(false);
    return () => unsubscribers.forEach((u) => u());
  }, [monitoredPersonnel, teamLoading, selectedDate]);

  return {
    monitoredPersonnel,
    latestScreenshots,
    loading: loading || teamLoading,
  };
}
