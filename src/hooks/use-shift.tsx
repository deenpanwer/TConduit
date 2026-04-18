'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '@/lib/storage';
import { format, startOfWeek, addDays, isAfter, isSameDay, startOfDay, parseISO } from 'date-fns';
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
  isVirtual?: boolean; // If it's a recurring default
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
  updatedAt?: any;
}
export interface ShiftClaim {
  id: string;
  shiftId: string;
  userId: string;
  userName: string;
  orgId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewedByName?: string;
}
export interface HistoryLog {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
}

export function useShift(selectedDate: Date, orgId: string | undefined, user: any, employees: any[] = [], weekStartsOn: 0 | 1 = 0) {
  const [remoteShifts, setRemoteShifts] = useState<ScheduledShift[]>([]);
  const [localShifts, setLocalShifts] = useState<ScheduledShift[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [allPendingLeaves, setAllPendingLeaves] = useState<LeaveRequest[]>([]);
  const [allPendingClaims, setAllPendingClaims] = useState<ShiftClaim[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn }), [selectedDate, weekStartsOn]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');
  
  // MERGE LOGIC: Real Shifts + Recurring Virtual Shifts
  const mergedShifts = useMemo(() => {
    const combined = [...localShifts];
    
    // For each employee, if they have shiftDefaults, fill in the blanks for the current week
    employees.forEach(emp => {
      const defaults = emp.trackingSettings?.shiftDefaults;
      if (!defaults?.startTime || !defaults?.endTime) return;
      
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        
        // Only add virtual if no manual shift exists for this user on this day
        const hasManual = combined.some(s => s.userId === (emp.id || emp.uid) && s.date === dayStr);
        if (!hasManual) {
          combined.push({
            id: `virtual_${emp.id || emp.uid}_${dayStr}`,
            date: dayStr,
            startTime: defaults.startTime,
            endTime: defaults.endTime,
            userId: emp.id || emp.uid,
            userName: emp.name || 'Unknown',
            status: 'published',
            orgId: orgId!,
            lastModifiedBy: 'system',
            lastModifiedRole: 'system',
            isVirtual: true,
            note: 'Recurring Shift'
          });
        }
      }
    });

    return combined;
  }, [localShifts, employees, weekStart, orgId]);
  
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

    const unsubShifts = storage.onSnapshot<ScheduledShift>('scheduled_shifts', (allShifts) => {
      const orgShifts = allShifts.filter(s => 
        s.orgId === orgId && 
        s.date >= startDateStr && 
        s.date <= endDateStr
      );
      setRemoteShifts(orgShifts);
      setLocalShifts((prev) => {
        const hasUnsavedLocalChanges = prev.some((s) => s.id.startsWith('local_'));
        if (!hasUnsavedLocalChanges) return orgShifts;
        // Merge manual edits that aren't in remote yet
        const drafts = prev.filter(s => s.id.startsWith('local_'));
        const nonDrafts = orgShifts.filter(os => !drafts.some(d => d.date === os.date && d.userId === os.userId));
        return [...drafts, ...nonDrafts];
      });
      setLoading(false);
    });

    const unsubLeaves = storage.onSnapshot<LeaveRequest>('leave_requests', (all) => {
      const orgLeaves = all.filter(l => l.orgId === orgId);
      setAllLeaves(orgLeaves);
      setAllPendingLeaves(orgLeaves.filter(l => l.status === 'pending'));
      
      const relevantLeaves = orgLeaves.filter(
        (l) => l.status === 'approved' && l.endDate >= startDateStr && l.startDate <= endDateStr
      );
      setLeaveRequests(relevantLeaves);
    });

    const unsubClaims = storage.onSnapshot<ShiftClaim>('shift_claims', (all) => {
      const orgClaims = all.filter(c => c.orgId === orgId);
      setAllPendingClaims(orgClaims.filter(c => c.status === 'pending'));
    });

    return () => {
      unsubShifts();
      unsubLeaves();
      unsubClaims();
    };
  }, [orgId, startDateStr, endDateStr, user?.role, user?.uid]);
  
  const addShift = useCallback(
    (shift: Omit<ScheduledShift, 'id' | 'orgId' | 'lastModifiedBy' | 'lastModifiedRole'>) => {
      const id = `local_${Math.random().toString(36).substr(2, 9)}`;
      const newShift: ScheduledShift = {
        ...shift,
        id,
        orgId: orgId!,
        lastModifiedBy: user?.uid || user?.id,
        lastModifiedRole: user?.role || 'manager',
        status: 'draft',
        provenance: [
          {
            by: user?.name || user?.displayName || 'Manager',
            at: new Date().toISOString(),
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
      // If updating a virtual shift, it becomes a local draft
      if (id.startsWith('virtual_')) {
        const { isVirtual, id: oldId, ...actualUpdates } = updates;
        const newShift: ScheduledShift = {
          ...actualUpdates as ScheduledShift,
          id: `local_${Math.random().toString(36).substr(2, 9)}`,
          status: 'draft',
          orgId: orgId!,
          lastModifiedBy: user?.uid,
          lastModifiedRole: user?.role || 'manager',
          provenance: [
            {
              by: user?.name || user?.displayName || 'Manager',
              at: new Date().toISOString(),
              action: 'Overrode Recurring Shift',
            },
          ],
        };
        setLocalShifts(prev => [...prev, newShift]);
        return;
      }

      setLocalShifts((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const newProvenance = {
              by: user?.name || user?.displayName || 'Manager',
              at: new Date().toISOString(),
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
    [addHistory, user, orgId]
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
      const allShifts = storage.getCollection<ScheduledShift>('scheduled_shifts');
      
      // 1. Remove remote shifts that are no longer in localShifts
      const localIds = localShifts.map((s) => s.id);
      let updatedAllShifts = allShifts.filter(rs => {
        if (rs.orgId !== orgId) return true;
        if (rs.date < startDateStr || rs.date > endDateStr) return true;
        return localIds.includes(rs.id);
      });

      // 2. Add/Update shifts from localShifts
      localShifts.forEach((ls) => {
        const isNew = ls.id.startsWith('local_');
        const finalId = isNew ? Math.random().toString(36).substring(7) : ls.id;
        
        const data: ScheduledShift = {
          ...ls,
          id: finalId,
          status: 'published',
          lastModifiedBy: user.uid || user.id,
          lastModifiedByName: user.name || user.displayName,
          updatedAt: new Date().toISOString(),
          createdAt: isNew ? new Date().toISOString() : ls.createdAt || new Date().toISOString(),
          provenance: (ls.provenance || []).map((p) => ({
            ...p,
            at: typeof p.at === 'string' ? p.at : new Date().toISOString()
          })),
        };

        const existingIdx = updatedAllShifts.findIndex(s => s.id === finalId);
        if (existingIdx !== -1) {
          updatedAllShifts[existingIdx] = data;
        } else {
          updatedAllShifts.push(data);
        }
      });

      storage.saveCollection('scheduled_shifts', updatedAllShifts);
      
      setRemoteShifts(updatedAllShifts.filter(s => s.orgId === orgId && s.date >= startDateStr && s.date <= endDateStr));
      setLocalShifts([]);
      setHistory([]);

      toast.success('Schedule shared with your team!');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to share schedule. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  }, [orgId, user, localShifts, startDateStr, endDateStr]);
  
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
          const emp = employees.find((e) => e.id === uid || e.uid === uid);
          const hasShift = newShifts.some((s) => s.userId === uid && s.date === dayStr);
          const hasDefault = !!emp?.trackingSettings?.shiftDefaults?.startTime;
          const isOnLeave = leaveRequests.some(
            (l) =>
              l.userId === uid &&
              l.status === 'approved' &&
              l.startDate <= dayStr &&
              l.endDate >= dayStr
          );

          if (!hasShift && !hasDefault && !isOnLeave) {
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
        const newLeaveRequest: LeaveRequest = {
            ...leaveRequestData,
            id: Math.random().toString(36).substring(7),
            orgId: orgId,
            userId: user.uid || user.id,
            userName: user.name || user.displayName || 'Unknown User',
            status: 'pending',
            createdAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            reviewedByName: null,
        };

        storage.saveItem('leave_requests', newLeaveRequest);
        toast.success("Leave request submitted successfully.");
    
      } catch (error) {
        console.error("Error submitting leave request:", error);
        toast.error("Failed to submit leave request.");
    }
  }, [orgId, user]);

  const updateEmployeeDefaults = useCallback(async (userId: string, startTime: string | null, endTime: string | null) => {
    try {
      const allUsers = storage.getCollection<any>('users');
      const userIdx = allUsers.findIndex(u => u.id === userId || u.uid === userId);
      
      if (userIdx !== -1) {
        const updatedUser = { ...allUsers[userIdx] };
        if (!updatedUser.trackingSettings) updatedUser.trackingSettings = {};
        
        if (startTime && endTime) {
          updatedUser.trackingSettings.shiftDefaults = { startTime, endTime };
        } else {
          delete updatedUser.trackingSettings.shiftDefaults;
        }
        
        allUsers[userIdx] = updatedUser;
        storage.saveCollection('users', allUsers);
        toast.success(startTime ? "Default shift updated." : "Recurring shift removed.");
      } else {
        toast.error("User not found.");
      }
    } catch (e) {
      console.error("Error updating defaults:", e);
      toast.error("Failed to update regular hours.");
    }
  }, []);

  const approveClaim = useCallback(async (claim: ShiftClaim) => {
    if (!orgId || !user) return;
    try {
      // 1. Update the Shift
      const allShifts = storage.getCollection<ScheduledShift>('scheduled_shifts');
      const shiftIdx = allShifts.findIndex(s => s.id === claim.shiftId);
      if (shiftIdx !== -1) {
        allShifts[shiftIdx] = {
          ...allShifts[shiftIdx],
          userId: claim.userId,
          userName: claim.userName,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: user.uid || user.id,
          lastModifiedRole: user.role || 'manager'
        };
        storage.saveCollection('scheduled_shifts', allShifts);
      }

      // 2. Update the Claims
      const allClaims = storage.getCollection<ShiftClaim>('shift_claims');
      allClaims.forEach(c => {
        if (c.id === claim.id) {
          c.status = 'approved';
          c.reviewedBy = user.uid || user.id;
          c.reviewedByName = user.name || user.displayName || 'Manager';
          c.reviewedAt = new Date().toISOString();
        } else if (c.shiftId === claim.shiftId && c.status === 'pending') {
          c.status = 'denied';
          c.reviewedBy = user.uid || user.id;
          c.reviewedByName = user.name || user.displayName || 'Manager';
          c.reviewedAt = new Date().toISOString();
          (c as any).denialReason = 'Shift assigned to another employee';
        }
      });
      storage.saveCollection('shift_claims', allClaims);

      toast.success(`Shift claim for ${claim.userName} approved.`);
    } catch (error) {
      console.error("Error approving claim:", error);
      toast.error("Failed to approve shift claim.");
    }
  }, [orgId, user]);

  const denyClaim = useCallback(async (claim: ShiftClaim, reason?: string) => {
    if (!orgId || !user) return;
    try {
      const allClaims = storage.getCollection<ShiftClaim>('shift_claims');
      const idx = allClaims.findIndex(c => c.id === claim.id);
      if (idx !== -1) {
        allClaims[idx] = {
          ...allClaims[idx],
          status: 'denied',
          reviewedBy: user.uid || user.id,
          reviewedByName: user.name || user.displayName || 'Manager',
          reviewedAt: new Date().toISOString(),
          denialReason: reason || 'Declined by manager'
        } as any;
        storage.saveCollection('shift_claims', allClaims);
      }
      toast.success(`Shift claim for ${claim.userName} denied.`);
    } catch (error) {
      console.error("Error denying claim:", error);
      toast.error("Failed to deny shift claim.");
    }
  }, [orgId, user]);

  const approveLeave = useCallback(async (req: LeaveRequest) => {
    if (!orgId || !user) return;
    try {
      const all = storage.getCollection<LeaveRequest>('leave_requests');
      const idx = all.findIndex(l => l.id === req.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          status: 'approved',
          reviewedBy: user.uid || user.id,
          reviewedByName: user.name || user.displayName || 'Manager',
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        storage.saveCollection('leave_requests', all);
      }
      toast.success(`Leave request for ${req.userName} approved.`);
    } catch (e) {
      console.error("Leave approval error:", e);
      toast.error("Failed to approve leave.");
    }
  }, [orgId, user]);

  const denyLeave = useCallback(async (req: LeaveRequest, denialReason: string) => {
    if (!orgId || !user) return;
    try {
      const all = storage.getCollection<LeaveRequest>('leave_requests');
      const idx = all.findIndex(l => l.id === req.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          status: 'denied',
          denialReason: denialReason || 'Declined by manager',
          reviewedBy: user.uid || user.id,
          reviewedByName: user.name || user.displayName || 'Manager',
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any;
        storage.saveCollection('leave_requests', all);
      }
      toast.success(`Leave request for ${req.userName} denied.`);
    } catch (e) {
      console.error("Leave denial error:", e);
      toast.error("Failed to deny leave.");
    }
  }, [orgId, user]);

  return {
    shifts: mergedShifts,
    leaveRequests,
    allLeaves,
    allPendingLeaves,
    allPendingClaims,
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
    submitLeaveRequest,
    updateEmployeeDefaults,
    approveClaim,
    denyClaim,
    approveLeave,
    denyLeave
  };
}