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

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

  // 2. Setup real-time listeners for the latest 4 screenshots
  useEffect(() => {
    if (teamLoading) return;
    
    setLoading(true);
    const dateStr = selectedDateKey;
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
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = format(prevDate, "yyyy-MM-dd");

      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = format(nextDate, "yyyy-MM-dd");

      const getScrWorkDate = (scr: any): string => {
        if (scr.workDate) return scr.workDate;
        if (scr.createdAtLocal) {
          const match = scr.createdAtLocal.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            const m = match[1].padStart(2, '0');
            const d = match[2].padStart(2, '0');
            const y = match[3];
            return `${y}-${m}-${d}`;
          }
          if (scr.createdAtLocal.includes('T')) return scr.createdAtLocal.split('T')[0];
        }
        let d: Date | null = null;
        if (scr.timestamp?.toDate) d = scr.timestamp.toDate();
        else if (scr.timestamp?.seconds) d = new Date(scr.timestamp.seconds * 1000);
        else if (typeof scr.timestamp === 'number') d = new Date(scr.timestamp);
        else if (typeof scr.timestamp === 'string') d = new Date(scr.timestamp);
        else if (scr.createdAt) d = new Date(scr.createdAt);
        if (d && !isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return "";
      };

      const curDocs = new Map<string, any>();
      const prevDocs = new Map<string, any>();
      const nextDocs = new Map<string, any>();

      const updateCombined = () => {
        const combinedMap = new Map<string, any>();
        curDocs.forEach((val, key) => combinedMap.set(key, val));
        prevDocs.forEach((val, key) => combinedMap.set(key, val));
        nextDocs.forEach((val, key) => combinedMap.set(key, val));

        const allDocs = Array.from(combinedMap.values());
        const filtered = allDocs.filter(scr => getScrWorkDate(scr) === dateStr);
        filtered.sort((a: any, b: any) => {
          const tA = a.timestampEpoch || (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.createdAt || 0).getTime()));
          const tB = b.timestampEpoch || (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.createdAt || 0).getTime()));
          return tB - tA;
        });

        if (filtered.length > 0) {
          setLatestScreenshots((prev) => ({ ...prev, [emp.id]: filtered.slice(0, 4) }));
        } else if (isDateToday(selectedDate)) {
          const datesRef = collection(db, "users", emp.id, "screenshots");
          getDocs(datesRef).then(dateSnap => {
            if (!dateSnap.empty) {
              const allDates = dateSnap.docs.map(d => d.id).sort((a, b) => b.localeCompare(a));
              const latestDateId = allDates[0];
              if (latestDateId !== dateStr) {
                const fallbackRef = collection(db, "users", emp.id, "screenshots", latestDateId, "images");
                getDocs(query(fallbackRef, orderBy("timestamp", "desc"), limit(4))).then(imgSnap => {
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
      };

      const refCur = collection(db, "users", emp.id, "screenshots", dateStr, "images");
      const refPrev = collection(db, "users", emp.id, "screenshots", prevDateStr, "images");
      const refNext = collection(db, "users", emp.id, "screenshots", nextDateStr, "images");

      const qCur = query(refCur, orderBy("timestamp", "desc"), limit(50));
      const qPrev = query(refPrev, orderBy("timestamp", "desc"), limit(50));
      const qNext = query(refNext, orderBy("timestamp", "desc"), limit(50));

      const unsubCur = onSnapshot(qCur, (snap) => {
        curDocs.clear();
        if (!snap.empty) snap.docs.forEach(doc => curDocs.set(doc.id, { ...doc.data(), id: doc.id, employeeName: emp.name, isFallback: false }));
        updateCombined();
      }, (err) => {
        // Fallback without orderBy if index is missing
        onSnapshot(query(refCur, limit(50)), (snap) => {
          curDocs.clear();
          if (!snap.empty) snap.docs.forEach(doc => curDocs.set(doc.id, { ...doc.data(), id: doc.id, employeeName: emp.name, isFallback: false }));
          updateCombined();
        });
      });

      const unsubPrev = onSnapshot(qPrev, (snap) => {
        prevDocs.clear();
        if (!snap.empty) snap.docs.forEach(doc => prevDocs.set(doc.id, { ...doc.data(), id: doc.id, employeeName: emp.name, isFallback: false }));
        updateCombined();
      }, (err) => {
        onSnapshot(query(refPrev, limit(50)), (snap) => {
          prevDocs.clear();
          if (!snap.empty) snap.docs.forEach(doc => prevDocs.set(doc.id, { ...doc.data(), id: doc.id, employeeName: emp.name, isFallback: false }));
          updateCombined();
        });
      });

      const unsubNext = onSnapshot(qNext, (snap) => {
        nextDocs.clear();
        if (!snap.empty) snap.docs.forEach(doc => nextDocs.set(doc.id, { ...doc.data(), id: doc.id, employeeName: emp.name, isFallback: false }));
        updateCombined();
      }, (err) => {
        onSnapshot(query(refNext, limit(50)), (snap) => {
          nextDocs.clear();
          if (!snap.empty) snap.docs.forEach(doc => nextDocs.set(doc.id, { ...doc.data(), id: doc.id, employeeName: emp.name, isFallback: false }));
          updateCombined();
        });
      });

      unsubscribers.push(unsubCur, unsubPrev, unsubNext);
    });

    setLoading(false);
    return () => unsubscribers.forEach((u) => u());
  }, [monitoredPersonnel, teamLoading, selectedDateKey]);

  return {
    monitoredPersonnel,
    latestScreenshots,
    loading: loading || teamLoading,
  };
}
