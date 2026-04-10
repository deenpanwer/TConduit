'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { format, parse, isValid } from 'date-fns';
import { Play, Clock, AlertTriangle } from 'lucide-react';
import { useTeam } from '@/hooks/use-team';

interface ShiftPulseProps {
  activeShift: any;
  employee: any;
}

export function ShiftPulse({ activeShift, employee }: ShiftPulseProps) {
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

  const getShiftStatus = () => {
    const now = new Date();
    const scheduledStartTimeStr = employee?.trackingSettings?.shiftDefaults?.startTime;
    const scheduledEndTimeStr = employee?.trackingSettings?.shiftDefaults?.endTime;
    // Use selectedDate for historical accuracy, but fall back to now for today.
    const dateForShift = selectedDate || now;
    const shiftDateStr = format(dateForShift, 'yyyy-MM-dd');

    const formatDuration = (ms: number) => {
        if (ms < 0) ms = 0;
        const totalMinutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${minutes}m`;
        }
    }

    if (!activeShift) {
      return { 
          status: 'Offline', 
          details: `No shift recorded for ${format(dateForShift, 'MMM do')}`,
          color: 'gray'
      };
    }

    const actualStartTime = parseShiftDate(activeShift.startTime);

    if (!actualStartTime) {
        return { status: 'Error', details: 'Invalid start time for shift.', color: 'red' };
    }

    const hasSchedule = scheduledStartTimeStr && scheduledEndTimeStr;

    // --- SHIFT IS ACTIVE (or was active on the selected date) ---
    if (activeShift.status === 'active' || !activeShift.endTime) {
        if (!hasSchedule) {
            return {
                status: 'Active',
                details: `Clocked in at ${format(actualStartTime, 'hh:mm a')}`,
                color: 'green'
            };
        }

        const scheduledStartTime = parse(`${shiftDateStr} ${scheduledStartTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
        const scheduledEndTime = parse(`${shiftDateStr} ${scheduledEndTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());

        if (isValid(scheduledEndTime) && now > scheduledEndTime && format(now, 'yyyy-MM-dd') === shiftDateStr) {
            const overtimeMs = now.getTime() - scheduledEndTime.getTime();
            const overtimeStr = formatDuration(overtimeMs);
            return { 
                status: 'Overtime', 
                details: `Overtime: ${overtimeStr}`,
                color: 'orange'
            };
        }

        if (isValid(scheduledStartTime)) {
            if (actualStartTime > scheduledStartTime) {
                const latenessMs = actualStartTime.getTime() - scheduledStartTime.getTime();
                const latenessStr = formatDuration(latenessMs);
                return {
                    status: 'Late',
                    details: `Started ${latenessStr} late`,
                    color: 'yellow'
                };
            } else if (actualStartTime.getTime() < scheduledStartTime.getTime() - 60000) {
                const earlyMs = scheduledStartTime.getTime() - actualStartTime.getTime();
                const earlyStr = formatDuration(earlyMs);
                return {
                    status: 'Early',
                    details: `Started ${earlyStr} early`,
                    color: 'blue'
                };
            }
        }
        return {
            status: 'On Time',
            details: 'Not a single minute late',
            color: 'green'
        };

    } 
    // --- SHIFT IS COMPLETED ---
    else {
        const actualEndTime = parseShiftDate(activeShift.endTime);
        if (!actualEndTime) {
            return { status: 'Completed', details: 'Shift finished, invalid end time.', color: 'gray' };
        }

        if (!hasSchedule) {
            return { 
                status: 'Completed', 
                details: `Shift ended at ${format(actualEndTime, 'hh:mm a')}`,
                color: 'gray'
            };
        }

        const scheduledEndTime = parse(`${shiftDateStr} ${scheduledEndTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
        if (isValid(scheduledEndTime) && actualEndTime > scheduledEndTime) {
            const overtimeMs = actualEndTime.getTime() - scheduledEndTime.getTime();
            const overtimeStr = formatDuration(overtimeMs);
            return { 
                status: 'Completed (OT)', 
                details: `Worked ${overtimeStr} of overtime.`,
                color: 'orange'
            };
        }
        
        return { 
            status: 'Completed', 
            details: `Shift ended at ${format(actualEndTime, 'hh:mm a')}`,
            color: 'gray'
        };
    }
  };

  const shiftStatus = getShiftStatus();
  const startTime = activeShift ? parseShiftDate(activeShift.startTime) : null;

  const colorMap = {
      gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-500' },
      green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
      yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-500' },
      orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-500' },
      red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500' }
  };
  const colors = colorMap[shiftStatus.color as keyof typeof colorMap] || colorMap.gray;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-2"
    >
      <div className={`size-12 rounded-2xl flex items-center justify-center border shadow-sm ${colors.bg} ${colors.border} ${colors.text}`}>
        {shiftStatus.color === 'red' ? <AlertTriangle size={20} /> : (shiftStatus.status === 'Offline' || shiftStatus.status.startsWith('Completed') ? <Clock size={20} /> : <Play size={20} className="fill-current ml-0.5" />)}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
           <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{shiftStatus.status}</span>
            {startTime && isValid(startTime) && shiftStatus.status !== 'On Time' && (

             <span className="text-2xl font-black tracking-tighter uppercase">
                {format(startTime, 'hh:mm')}
                <span className="text-sm ml-1 opacity-60">{format(startTime, 'aa')}</span>
            </span>
           )}
        </div>
        <p className={`text-xs mt-1 ${shiftStatus.color === 'yellow' || shiftStatus.color === 'orange' ? 'font-bold text-gray-500' : 'text-gray-400'}`}>{shiftStatus.details}</p>
      </div>
    </motion.div>
  );
}
