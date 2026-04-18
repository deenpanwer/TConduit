'use client';

import React, { useMemo } from 'react';
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

  // Recalculate activeShift based on the selectedDate
  const shiftForDate = useMemo(() => {
    if (!employee || !employee.workShifts) return activeShift;
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    return employee.workShifts.find((s: any) => {
        const sStart = parseShiftDate(s.startTime);
        return sStart && format(sStart, 'yyyy-MM-dd') === dateStr;
    }) || null;
  }, [employee, selectedDate, activeShift]);

  const getShiftStatus = () => {
    const refDate = selectedDate || new Date();
    const shiftDateStr = format(refDate, 'yyyy-MM-dd');
    const scheduledStartTimeStr = employee?.trackingSettings?.shiftDefaults?.startTime;
    const scheduledEndTimeStr = employee?.trackingSettings?.shiftDefaults?.endTime;
    const formatDuration = (ms: number) => {
        if (ms < 0) ms = 0;
        const totalMinutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h`;
        return `${minutes}m`;
    }

    if (!shiftForDate) {
      return { 
          status: 'Offline', 
          details: `No shift recorded for ${format(refDate, 'MMM do')}`,
          color: 'gray'
      };
    }

    const actualStartTime = parseShiftDate(shiftForDate.startTime);
    const actualEndTime = parseShiftDate(shiftForDate.endTime);

    if (!actualStartTime) {
        return { status: 'Error', details: 'Invalid start time for shift.', color: 'red' };
    }

    const hasSchedule = scheduledStartTimeStr && scheduledEndTimeStr;

    // --- SHIFT STATUS LOGIC ---
    if (shiftForDate.status === 'active' || !shiftForDate.endTime) {
        if (!hasSchedule) {
            return {
                status: 'Active',
                details: `Clocked in at ${format(actualStartTime, 'hh:mm a')}`,
                color: 'green'
            };
        }

        const scheduledEndTime = parse(`${shiftDateStr} ${scheduledEndTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());

        const now = new Date();
        if (isValid(scheduledEndTime) && now > scheduledEndTime && format(now, "yyyy-MM-dd") === shiftDateStr) {
            const overtimeMs = now.getTime() - scheduledEndTime.getTime();
            return { 
                status: 'Overtime', 
                details: `Overtime: ${formatDuration(overtimeMs)}`,
                color: 'orange'
            };
        }
        
        return {
            status: 'Active',
            details: `Started at ${format(actualStartTime, 'hh:mm a')}`,
            color: 'green'
        };
    }

    // Shift completed
    if (actualEndTime && isValid(actualEndTime)) {
        const scheduledEndTime = parse(`${shiftDateStr} ${scheduledEndTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
        if (isValid(scheduledEndTime) && actualEndTime.getTime() > scheduledEndTime.getTime()) {
             const overtimeMs = actualEndTime.getTime() - scheduledEndTime.getTime();
             if (overtimeMs > 60000) {
                 return { 
                    status: 'Overtime', 
                    details: `Overtime: ${formatDuration(overtimeMs)}`, 
                    color: 'orange' 
                };
             }
        }
        return { 
            status: 'Completed', 
            details: `Shift ended at ${format(actualEndTime, 'hh:mm a')}`, 
            color: 'blue' 
        };
    }

    return { 
        status: 'Completed', 
        details: `Ended at ${format(actualStartTime, 'hh:mm a')}`, 
        color: 'gray' 
    };
  };

  const { status, details, color } = getShiftStatus();

  return (
    <div className="w-full bg-card/30 border border-border/50 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`size-14 rounded-2xl flex items-center justify-center border-2 shadow-sm ${
            color === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
            color === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
            color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
            'bg-slate-500/10 border-slate-500/20 text-slate-500'
          }`}>
            {status === 'Active' || status === 'Overtime' ? (
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Play className="fill-current" size={24} />
                </motion.div>
            ) : <Clock size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{status}</h3>
              {(status === 'Overtime' || status === 'Late') && <AlertTriangle size={14} className="text-orange-500" />}
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{details}</p>
          </div>
        </div>

        {shiftForDate && (
          <div className="flex flex-wrap gap-3">
             <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border/50">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Focus</p>
                <p className="text-sm font-black text-primary">{(shiftForDate.cognitiveReport?.focusScore || shiftForDate.focusScore || 0)}%</p>
             </div>
             <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border/50">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Yield</p>
                <p className="text-sm font-black text-primary">{(shiftForDate.cognitiveReport?.productivityScore || shiftForDate.productivityScore || 0)}%</p>
             </div>
             <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border/50">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Velocity</p>
                <p className="text-sm font-black text-primary">{(shiftForDate.cognitiveReport?.velocity || shiftForDate.velocity || 0)}%</p>
             </div>
          </div>
        )}
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Clock size={120} />
      </div>
    </div>
  );
}
