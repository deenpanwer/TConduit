'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parse, isValid } from 'date-fns';
import { 
  Play, Clock, AlertTriangle, CalendarDays, 
  PlayCircle, StopCircle, Ban 
} from 'lucide-react';
import { useTeam } from '@/hooks/use-team';
import { cn } from '@/lib/utils';

interface ShiftPulseProps {
  workShifts: any[];
  firstTimeEntry?: any;
  employee: any;
}

export function ShiftPulse({ workShifts, firstTimeEntry, employee }: ShiftPulseProps) {
  const { selectedDate } = useTeam();

  const parseShiftDate = (ts: any): Date | null => {
    if (!ts) return null;
    let date;
    if (ts.seconds) {
      date = new Date(ts.seconds * 1000);
    } else if (typeof ts === 'string') {
      date = new Date(ts);
    } else if (ts instanceof Date) {
      date = ts;
    } else if (ts.toDate) {
      date = ts.toDate();
    } else {
      return null;
    }
    return isValid(date) ? date : null;
  };

  // Filter shifts specific to the selected date
  const shiftsForDate = useMemo(() => {
    if (!workShifts || !Array.isArray(workShifts)) return [];
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    return workShifts.filter((s: any) => s.id && s.id.startsWith(dateStr));
  }, [workShifts, selectedDate]);

  // Earliest shift of the day (first clock-in)
  const firstShift = useMemo(() => {
    if (shiftsForDate.length === 0) return null;
    return [...shiftsForDate].sort((a, b) => {
      const timeA = parseShiftDate(a.startTime)?.getTime() || 0;
      const timeB = parseShiftDate(b.startTime)?.getTime() || 0;
      return timeA - timeB;
    })[0];
  }, [shiftsForDate]);

  // Latest shift of the day (last clock-out/ongoing)
  const lastShift = useMemo(() => {
    if (shiftsForDate.length === 0) return null;
    return [...shiftsForDate].sort((a, b) => {
      const timeA = parseShiftDate(a.startTime)?.getTime() || 0;
      const timeB = parseShiftDate(b.startTime)?.getTime() || 0;
      return timeA - timeB;
    })[shiftsForDate.length - 1];
  }, [shiftsForDate]);

  const scheduledStartTimeStr = employee?.trackingSettings?.shiftDefaults?.startTime || '09:00';
  const scheduledEndTimeStr = employee?.trackingSettings?.shiftDefaults?.endTime || '17:00';

  const metrics = useMemo(() => {
    const now = new Date();
    const dateForShift = selectedDate || now;
    const shiftDateStr = format(dateForShift, 'yyyy-MM-dd');

    const formatMins = (mins: number) => {
      const absMins = Math.abs(mins);
      if (absMins >= 60) {
        const hrs = Math.floor(absMins / 60);
        const rem = absMins % 60;
        return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
      }
      return `${absMins} mins`;
    };

    let startTimeStr = 'N/A';
    let endTimeStr = 'N/A';
    let latenessMinutes = 0;
    let status = 'Offline';
    let details = 'No shift recorded';
    let color: 'gray' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' = 'gray';

    const allottedStartTimeFormatted = scheduledStartTimeStr 
      ? format(parse(`${shiftDateStr} ${scheduledStartTimeStr}`, 'yyyy-MM-dd HH:mm', new Date()), 'hh:mm a')
      : '09:00 AM';

    const allottedEndTimeFormatted = scheduledEndTimeStr 
      ? format(parse(`${shiftDateStr} ${scheduledEndTimeStr}`, 'yyyy-MM-dd HH:mm', new Date()), 'hh:mm a')
      : '05:00 PM';

    // 1. Absent Check (Never Clocked In / No time entries recorded for selected date)
    if (!firstTimeEntry) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isPastDay = shiftDateStr < todayStr;
      const scheduledEndTime = parse(`${shiftDateStr} ${scheduledEndTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
      const isPastShiftEnd = isValid(scheduledEndTime) && new Date() > scheduledEndTime;

      if (isPastDay || isPastShiftEnd) {
        status = 'Absent';
        details = 'No clock-in recorded';
        color = 'red'; // Strict Red strictly reserved for Absent
      } else {
        status = 'Scheduled';
        details = 'Clock-in pending';
        color = 'gray';
      }

      return {
        startTime: 'Not Clocked In',
        endTime: 'N/A',
        allotted: `${allottedStartTimeFormatted} - ${allottedEndTimeFormatted}`,
        latenessMinutes: 0,
        status,
        details,
        color
      };
    }

    // 2. Extract boundaries dynamically strictly using first time entry of the day
    const actualStartTime = parseShiftDate(firstTimeEntry.startTime);
    const actualEndTime = lastShift ? parseShiftDate(lastShift.endTime) : null;

    if (actualStartTime) {
      startTimeStr = format(actualStartTime, 'hh:mm a');
    }
    
    if (actualEndTime) {
      endTimeStr = format(actualEndTime, 'hh:mm a');
    } else if (lastShift) {
      if (lastShift.status === 'active' || !lastShift.endTime) {
        endTimeStr = 'Ongoing...';
      }
    }

    // 3. Punctuality Lateness analysis from first clock-in
    if (actualStartTime) {
      const scheduledStartTime = parse(`${shiftDateStr} ${scheduledStartTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
      if (isValid(scheduledStartTime)) {
        const diffMs = actualStartTime.getTime() - scheduledStartTime.getTime();
        latenessMinutes = Math.floor(diffMs / (60 * 1000));

        if (latenessMinutes > 240) {
          status = 'Off Schedule';
          details = 'MISSED SHIFT (LATE)';
          color = 'orange'; // Strictly orange for severe lateness/off schedule
        } else if (latenessMinutes > 0) {
          status = 'Late';
          details = `${formatMins(latenessMinutes)} Late Arrival`;
          color = 'yellow'; // Strictly yellow for late arrival (no red!)
        } else if (latenessMinutes < -120) {
          status = 'Off Schedule';
          details = 'Unscheduled Early Start';
          color = 'orange'; // Orange for early start mismatch
        } else if (latenessMinutes < 0) {
          status = 'Early';
          details = `${formatMins(latenessMinutes)} Early Arrival`;
          color = 'blue';
        } else {
          status = 'On Time';
          details = 'Perfect punctuality';
          color = 'green';
        }
      }
    }

    // 4. Overtime checks based on last shift
    const scheduledEndTime = parse(`${shiftDateStr} ${scheduledEndTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
    if (isValid(scheduledEndTime)) {
      const compareTime = actualEndTime || now;
      if (compareTime > scheduledEndTime) {
        const otMs = compareTime.getTime() - scheduledEndTime.getTime();
        const otMins = Math.floor(otMs / (60 * 1000));
        
        // Only override if not already locked in Off Schedule or Late
        if (status === 'On Time' || status === 'Early' || status === 'Offline') {
          status = (lastShift && lastShift.endTime) ? 'Completed (OT)' : 'Overtime';
          details = `Working ${formatMins(otMins)} of Overtime`;
          color = 'orange';
        }
      } else if (lastShift && lastShift.endTime && (status === 'On Time' || status === 'Early' || status === 'Offline')) {
        status = 'Completed';
        details = 'Shift completed successfully';
        color = 'green';
      }
    }

    return {
      startTime: startTimeStr,
      endTime: endTimeStr,
      allotted: `${allottedStartTimeFormatted} - ${allottedEndTimeFormatted}`,
      latenessMinutes,
      status,
      details,
      color
    };
  }, [shiftsForDate, firstShift, lastShift, selectedDate, scheduledStartTimeStr, scheduledEndTimeStr, firstTimeEntry]);

  const colorMap = {
    gray: { 
      bg: 'bg-secondary/40', 
      border: 'border-black dark:border-white', 
      text: 'text-muted-foreground',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]'
    },
    green: { 
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
      border: 'border-emerald-500 dark:border-emerald-400', 
      text: 'text-emerald-600 dark:text-emerald-400',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(16,185,129,0.3)]'
    },
    yellow: { 
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', 
      border: 'border-yellow-500 dark:border-yellow-400', 
      text: 'text-yellow-600 dark:text-yellow-400',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(234,179,8,0.3)]'
    },
    orange: { 
      bg: 'bg-orange-500/10 dark:bg-orange-500/20', 
      border: 'border-orange-500 dark:border-orange-400', 
      text: 'text-orange-600 dark:text-orange-400',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(249,115,22,0.3)]'
    },
    red: { 
      bg: 'bg-rose-500/10 dark:bg-rose-500/20', 
      border: 'border-rose-500 dark:border-rose-400', 
      text: 'text-rose-600 dark:text-rose-400',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(244,63,94,0.3)]'
    },
    blue: { 
      bg: 'bg-sky-500/10 dark:bg-sky-500/20', 
      border: 'border-sky-500 dark:border-sky-400', 
      text: 'text-sky-600 dark:text-sky-400',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(14,165,233,0.3)]'
    }
  };

  const colors = colorMap[metrics.color as keyof typeof colorMap] || colorMap.gray;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between ml-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Shift Pulse & Attendance Check
        </h3>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2",
          metrics.color === 'green' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]",
          metrics.color === 'red' && "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[inset_0_0_8px_rgba(244,63,94,0.15)]", // Removed animate-pulse!
          metrics.color === 'orange' && "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[inset_0_0_8px_rgba(249,115,22,0.15)]",
          metrics.color === 'yellow' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[inset_0_0_8px_rgba(234,179,8,0.15)]",
          metrics.color === 'blue' && "bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-[inset_0_0_8px_rgba(14,165,233,0.15)]",
          metrics.color === 'gray' && "bg-secondary text-muted-foreground border-border"
        )}>
          {metrics.status}
        </span>
      </div>

      <div className="bg-card border-4 border-black dark:border-white p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Allotted Shift */}
          <div className="bg-secondary/20 p-5 rounded-2xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <span className="text-[10px] font-black text-muted-foreground/75 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="size-4 text-primary" /> Allotted Shift
            </span>
            <span className="text-lg font-black tracking-tight mt-3 font-mono">
              {metrics.allotted}
            </span>
          </div>

          {/* Card 2: Work Started At */}
          <div className="bg-secondary/20 p-5 rounded-2xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <span className="text-[10px] font-black text-muted-foreground/75 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="size-4 text-primary fill-current" /> Work Started At
            </span>
            <span className={cn(
              "text-lg font-black tracking-tight mt-3 font-mono",
              metrics.startTime === 'Not Clocked In' && "text-muted-foreground/45"
            )}>
              {metrics.startTime}
            </span>
          </div>

          {/* Card 3: Attendance Status / Lateness */}
          <div className={cn(
            "p-5 rounded-2xl border-2 border-black dark:border-white flex flex-col justify-between transition-all",
            colors.bg,
            colors.shadow
          )}>
            <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80">
              <AlertTriangle className="size-4 shrink-0" /> Lateness Check
            </span>
            <div className="mt-3 flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase leading-none break-words">
                {metrics.status === 'Scheduled' ? 'Pending' : (metrics.status === 'Absent' ? 'Absent' : metrics.status)}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-80 mt-1">
                {metrics.details}
              </span>
            </div>
          </div>

          {/* Card 4: Work Ended At */}
          <div className="bg-secondary/20 p-5 rounded-2xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <span className="text-[10px] font-black text-muted-foreground/75 uppercase tracking-wider flex items-center gap-1.5">
              <StopCircle className="size-4 text-primary" /> Work Ended At
            </span>
            <span className={cn(
              "text-lg font-black tracking-tight mt-3 font-mono",
              metrics.endTime === 'Ongoing...' && "text-emerald-500 font-bold"
            )}>
              {metrics.endTime}
            </span>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
