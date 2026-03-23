'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { format, startOfWeek, addDays, isAfter, isSameDay, parseISO, startOfDay } from 'date-fns';
import { toast } from 'sonner';

export interface ScheduledShift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  note?: string; // Work focus or objective
  userId: string | null; // Assigned employee or null for open
  userName: string | null;
  status: 'published' | 'draft' | 'canceled';
  orgId: string;
  lastModifiedBy: string;
  lastModifiedRole: string;
  lastModifiedByName?: string;
  provenance?: { by: string; at: any; action: string }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  orgId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'full_day' | 'morning_half' | 'afternoon_half' | 'partial';
  reasonType: string;
  description: string;
  status: 'pending' | 'approved' | 'denied';
  handoverNote?: string;
  emergencyPhone?: string;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: any;
  createdAt?: any;
}

export interface HistoryLog {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
}

export function useShift(selectedDate: Date, orgId: string | undefined, user: any) {
  const [remoteShifts, setRemoteShifts] = useState<ScheduledShift[]>([]);
  const [localShifts, setLocalShifts] = useState<ScheduledShift[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');

  const addHistory = useCallback((action: string, details: string) => {
    setHistory((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        action,
        details,
        timestamp: new Date(),
      },
      ...prev,
    ].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!orgId || !user || !user.role) {
      if (!orgId) setLoading(false);
      return;
    }

    setLocalShifts([]);
    setLoading(true);

    const shiftsRef = collection(db, 'organizations', orgId, 'scheduled_shifts');
    const leavesRef = collection(db, 'organizations', orgId, 'leave_requests');

    const qShifts = query(
      shiftsRef,
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr)
    );

    const qLeaves = query(leavesRef);

    const unsubShifts = onSnapshot(
      qShifts,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ScheduledShift[];
        setRemoteShifts(data);
        setLocalShifts((prev) => {
          const hasUnsavedLocalChanges = prev.some((s) => s.id.startsWith('local_'));
          if (!hasUnsavedLocalChanges || prev.length === 0) return data;
          return prev;
        });
        setLoading(false);
      },
      (error) => {
        console.warn('Shifts Sync Error:', error.message);
        setLoading(false);
      }
    );

    const unsubLeaves = onSnapshot(
      qLeaves,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as LeaveRequest[];
        const relevantLeaves = data.filter(
          (l) => l.endDate >= startDateStr && l.startDate <= endDateStr
        );
        setLeaveRequests(relevantLeaves);
      },
      (error) => {
        console.warn('Leaves Sync Error:', error.message);
      }
    );

    return () => {
      unsubShifts();
      unsubLeaves();
    };
  }, [orgId, startDateStr, endDateStr, user?.role, user?.uid]);

  const addShift = useCallback(
    (shift: Omit<ScheduledShift, 'id' | 'orgId' | 'lastModifiedBy' | 'lastModifiedRole'>) => {
      const id = `local_${Math.random().toString(36).substr(2, 9)}`;
      const newShift: ScheduledShift = {
        ...shift,
        id,
        orgId: orgId!,
        lastModifiedBy: user?.uid,
        lastModifiedRole: user?.role || 'manager',
        status: 'draft',
        provenance: [
          {
            by: user?.name || user?.displayName || 'Manager',
            at: new Date(),
            action: 'Drafted Shift',
          },
        ],
      };
      setLocalShifts((prev) => [...prev, newShift]);
      addHistory('Created Shift', `Assigned ${shift.userName || 'Open Slot'} for ${shift.date}`);
    },
    [orgId, user, addHistory]
  );

  const updateShift = useCallback(
    (id: string, updates: Partial<ScheduledShift>) => {
      setLocalShifts((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const newProvenance = {
              by: user?.name || user?.displayName || 'Manager',
              at: new Date(),
              action: `Updated: ${Object.keys(updates).join(', ')}`,
            };
            return {
              ...s,
              ...updates,
              status: 'draft',
              provenance: [...(s.provenance || []), newProvenance],
            };
          }
          return s;
        })
      );
      addHistory(
        'Updated Shift',
        `Modified timing or notes for a shift on ${updates.date || 'the schedule'}`
      );
    },
    [addHistory, user]
  );

  const deleteShift = useCallback(
    (id: string) => {
      const shift = localShifts.find((s) => s.id === id);
      setLocalShifts((prev) => prev.filter((s) => s.id !== id));
      if (shift) addHistory('Removed Shift', `Deleted shift for ${shift.userName} on ${shift.date}`);
    },
    [localShifts, addHistory]
  );

  const publishChanges = useCallback(async () => {
    if (!orgId || !user) return;
    setIsPublishing(true);

    try {
      const batch = writeBatch(db);
      const shiftsRef = collection(db, 'organizations', orgId, 'scheduled_shifts');

      const localIds = localShifts.map((s) => s.id);
      const toDelete = remoteShifts.filter((rs) => !localIds.includes(rs.id));
      toDelete.forEach((rs) => {
        batch.delete(doc(shiftsRef, rs.id));
      });

      localShifts.forEach((ls) => {
        const isNew = ls.id.startsWith('local_');
        const finalId = isNew ? doc(shiftsRef).id : ls.id;
        const shiftDoc = doc(shiftsRef, finalId);

        const data = {
          ...ls,
          id: finalId,
          status: 'published',
          lastModifiedBy: user.uid,
          lastModifiedByName: user.name || user.displayName,
          updatedAt: serverTimestamp(),
          createdAt: isNew ? serverTimestamp() : ls.createdAt || serverTimestamp(),
          provenance: (ls.provenance || []).map((p) => ({ ...p, at: serverTimestamp() })),
        };
        batch.set(shiftDoc, data, { merge: true });
      });

      await batch.commit();

      setLocalShifts([]);
      setHistory([]);

      toast.success('Schedule shared with your team!');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to share schedule. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  }, [orgId, user, localShifts, remoteShifts]);

  const discardChanges = useCallback(() => {
    setLocalShifts(remoteShifts);
    setHistory([]);
    toast.info('All unsaved changes have been discarded.');
  }, [remoteShifts]);

  const smartFill = useCallback(
    (
      employeeIds: string[],
      employees: any[],
      settings?: { offDays: string[]; defaultShiftSeconds: number }
    ) => {
      const today = startOfDay(new Date());
      const newShifts: ScheduledShift[] = [...localShifts];
      let addedCount = 0;

      const offDays = settings?.offDays || [];
      const shiftSeconds = settings?.defaultShiftSeconds || 32400;

      const startTime = '09:00';
      const startHour = 9;
      const durationHours = shiftSeconds / 3600;
      const endHour = (startHour + durationHours) % 24;
      const endTime = `${String(Math.floor(endHour)).padStart(2, '0')}:00`;

      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayName = format(day, 'EEE');

        if (isAfter(today, day) && !isSameDay(today, day)) continue;
        if (offDays.includes(dayName)) continue;

        employeeIds.forEach((uid) => {
          const hasShift = newShifts.some((s) => s.userId === uid && s.date === dayStr);
          const isOnLeave = leaveRequests.some(
            (l) =>
              l.userId === uid &&
              l.status === 'approved' &&
              l.startDate <= dayStr &&
              l.endDate >= dayStr
          );

          if (!hasShift && !isOnLeave) {
            const emp = employees.find((e) => e.id === uid || e.uid === uid);
            newShifts.push({
              id: `local_${Math.random().toString(36).substr(2, 9)}`,
              date: dayStr,
              startTime,
              endTime,
              userId: uid,
              userName: emp?.name || 'Unknown',
              status: 'draft',
              orgId: orgId!,
              lastModifiedBy: user?.uid,
              lastModifiedRole: user?.role || 'manager',
            });
            addedCount++;
          }
        });
      }

      if (addedCount > 0) {
        setLocalShifts(newShifts);
        addHistory('Smart Fill', `Automatically drafted ${addedCount} shifts for the week.`);
        toast.success(`Drafted ${addedCount} shifts!`);
      } else {
        toast.info('The schedule is already full or everyone is busy.');
      }
    },
    [weekStart, localShifts, leaveRequests, orgId, user, addHistory]
  );
  
  const submitLeaveRequest = useCallback(async (leaveRequestData: Omit<LeaveRequest, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'status' | 'reviewedAt' | 'reviewedBy' | 'reviewedByName'>) => {
    if (!orgId || !user) {
        toast.error("Authentication details are missing.");
        return;
    }

    try {
        const leaveCollectionRef = collection(db, 'organizations', orgId, 'leave_requests');
        
        const newLeaveRequest: any = {
            ...leaveRequestData,
            orgId: orgId,
            userId: user.uid,
            userName: user.name || user.displayName || 'Unknown User',
            status: 'pending',
            createdAt: serverTimestamp(),
            reviewedAt: null,
            reviewedBy: null,
            reviewedByName: null,
        };

        await addDoc(leaveCollectionRef, newLeaveRequest);

        toast.success("Leave request submitted successfully.");

    } catch (error) {
        console.error("Error submitting leave request:", error);
        toast.error("Failed to submit leave request.");
    }
  }, [orgId, user]);


  return {
    shifts: localShifts,
    leaveRequests,
    history,
    loading,
    isPublishing,
    hasChanges: JSON.stringify(localShifts) !== JSON.stringify(remoteShifts),
    addShift,
    updateShift,
    deleteShift,
    publishChanges,
    discardChanges,
    smartFill,
    submitLeaveRequest
  };
}
