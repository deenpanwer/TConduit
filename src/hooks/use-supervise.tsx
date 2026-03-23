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
 * Syncs the most recent screenshot from Firestore for each person.
 */

export function useSupervise(selectedDate: Date = new Date()) {
  const { employees, owner, loading: teamLoading } = useTeam();
  const { user } = useAuth();
  const [latestScreenshots, setLatestScreenshots] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // 1. Identify everyone who should be supervised (Employees + Current User if tracking)
  const monitoredPersonnel = useMemo(() => {
    let list = [...employees];
    
    // Find the current user's data from the full personnel record in useTeam (passed via owner or employees)
    // Actually, we can check the 'owner' which usually represents the current user in useTeam
    const isCurrentUserTracking = owner?.id === user?.uid && (owner?.hasOwnProperty('lastLoginAppVersion') || owner?.lastLoginAppVersion);
    const isAlreadyInList = list.some(p => p.id === user?.uid);

    if (isCurrentUserTracking && !isAlreadyInList && owner) {
      list.push(owner);
    }
    
    return list;
  }, [employees, owner, user?.uid]);

  // 2. Setup real-time listeners for the latest screenshots
  useEffect(() => {
    if (teamLoading) return;
    
    // Instead of clearing all, we only clear those that don't have a fallback or are switching dates
    setLoading(true);
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const unsubscribers: (() => void)[] = [];

    monitoredPersonnel.forEach((emp) => {
      // Clear specific employee state before starting new listener to avoid ghosting
      setLatestScreenshots((prev) => ({ ...prev, [emp.id]: undefined }));

      // --- DEMO EMPLOYEE HANDLER ---
      if (emp.id.startsWith('demo_')) {
        const screenshotsForDay = (emp.screenshots || {})[dateStr] || [];
        if (screenshotsForDay.length > 0) {
          // Sort by timestamp desc and take the first one
          const latest = [...screenshotsForDay].sort((a, b) => {
              const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
              const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
              return tB - tA;
          })[0];
          
          setLatestScreenshots((prev) => ({
            ...prev,
            [emp.id]: { ...latest, employeeName: emp.name, isFallback: false },
          }));
        } else {
            // Check for fallback if it's today
            if (isDateToday(selectedDate)) {
                // Find latest available day with screenshots
                const allDates = Object.keys(emp.screenshots || {}).sort().reverse();
                if (allDates.length > 0) {
                    const latestDate = allDates[0];
                    const fallbackScreenshots = emp.screenshots[latestDate] || [];
                    if (fallbackScreenshots.length > 0) {
                        const latest = [...fallbackScreenshots].sort((a, b) => {
                            const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
                            const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
                            return tB - tA;
                        })[0];
                        
                        setLatestScreenshots((prev) => ({
                            ...prev,
                            [emp.id]: { ...latest, employeeName: emp.name, isFallback: true },
                        }));
                    }
                }
            }
        }
        return; // Skip firestore listener for demo employees
      }

      // --- REAL EMPLOYEE HANDLER (FIRESTORE) ---
      // Step A: Primary listener for the selected date's collection
      const screenshotRef = collection(db, "users", emp.id, "screenshots", dateStr, "images");
      const screenQuery = query(screenshotRef, orderBy("timestamp", "desc"), limit(1));

      const unsub = onSnapshot(screenQuery, (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setLatestScreenshots((prev) => ({
            ...prev,
            [emp.id]: { ...data, employeeName: emp.name, isFallback: false },
          }));
        } else if (isDateToday(selectedDate)) {
          // Step B: If 'Today' is empty, find the ABSOLUTE latest activity efficiently
          // Order by __name__ (date ID) descending to find the most recent day folder
          const datesRef = collection(db, "users", emp.id, "screenshots");
          const datesQuery = query(datesRef, orderBy("__name__", "desc"), limit(1));
          
          getDocs(datesQuery).then(dateSnap => {
              if (!dateSnap.empty) {
                  const latestDateId = dateSnap.docs[0].id;
                  
                  // Only fetch from fallback if it's not the already empty 'today'
                  if (latestDateId !== dateStr) {
                      const fallbackRef = collection(db, "users", emp.id, "screenshots", latestDateId, "images");
                      const fallbackQuery = query(fallbackRef, orderBy("timestamp", "desc"), limit(1));
                      
                      getDocs(fallbackQuery).then(imgSnap => {
                          if (!imgSnap.empty) {
                              const imgData = imgSnap.docs[0].data();
                              setLatestScreenshots((prev) => {
                                  // Don't overwrite if a live update actually just came in
                                  if (prev[emp.id] && !prev[emp.id].isFallback) return prev;
                                  return { 
                                      ...prev, 
                                      [emp.id]: { ...imgData, employeeName: emp.name, isFallback: true } 
                                  };
                              });
                          }
                      });
                  }
              }
          });
        } else {
          // If we're looking at a specific past date and it's empty, show nothing
          setLatestScreenshots((prev) => ({
            ...prev,
            [emp.id]: null,
          }));
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
