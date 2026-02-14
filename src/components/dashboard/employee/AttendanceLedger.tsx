"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isAfter, 
  isBefore, 
  addMonths, 
  subMonths,
  startOfDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import { GlassCard } from '../main/shared/GlassCard';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AttendanceLedgerProps {
  employee: any;
  workShifts: any[];
  joinedDate: Date | null;
}

export function AttendanceLedger({ employee, workShifts, joinedDate }: AttendanceLedgerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper to extract JS Date safely
  const getDate = (ts: any) => {
    if (!ts) return new Date(0);
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const attendanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!workShifts) return map;

    const actualJoinedDate = joinedDate || new Date(0); // Use a very old date if joinedDate is null

    workShifts.forEach(shift => {
      const shiftStartDate = getDate(shift.startTime);
      // Apply the joinedDate cutoff here
      if (shiftStartDate < actualJoinedDate) {
        return; // Skip shifts before the employee joined
      }

      if (shiftStartDate.getTime() > 0) {
        const dateKey = format(shiftStartDate, 'yyyy-MM-dd');
        map[dateKey] = (map[dateKey] || 0) + (shift.liveMetrics?.totalSeconds || 0);
      }
    });
    return map;
  }, [workShifts, joinedDate]);

  if (!employee) {
    return (
      <GlassCard className="p-10 animate-pulse" hoverEffect={false}>
        <div className="h-8 w-64 bg-muted rounded-xl mb-12" />
        <div className="flex gap-2 justify-between">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="flex-1 h-16 bg-muted rounded-full" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const safeJoinedDate = joinedDate || new Date(0); // Ensure joinedDate is always a Date object for comparisons

  return (
    <GlassCard className="p-10 relative overflow-hidden" hoverEffect={false}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            Attendance Ledger
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daily Activity Log</p>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl p-1 border border-gray-200 dark:border-white/10 shadow-inner">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-gray-500 hover:text-blue-500"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-6 text-xs font-black uppercase tracking-[0.2em] min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-gray-500 hover:text-blue-500"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <TooltipProvider delayDuration={0}>
        <div className="flex flex-wrap items-end gap-1.5 md:gap-2 justify-between">
          {days.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const duration = attendanceMap[dateKey] || 0;
            const hours = (duration / 3600).toFixed(1);
            const isToday = isSameDay(day, new Date());
            const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
            const isBeforeJoining = isBefore(startOfDay(day), startOfDay(safeJoinedDate));
            const isPresent = duration > 0;
            const isAbsent = !isPresent && !isFuture && !isBeforeJoining && !isToday;

            let statusColor = "bg-gray-100 dark:bg-white/5";
            let statusLabel = "No Activity";

            if (isBeforeJoining) {
              statusColor = "bg-gray-200/50 dark:bg-white/5 opacity-30";
              statusLabel = "Not joined yet";
            } else if (isFuture) {
              statusColor = "bg-gray-100 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10";
              statusLabel = "Future Date";
            } else if (isPresent) {
              statusColor = "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
              statusLabel = `${hours}h Produced`;
            } else if (isAbsent) {
              statusColor = "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
              statusLabel = "Absent / No Pulse";
            } else if (isToday && !isPresent) {
              statusColor = "bg-blue-500/20 border-2 border-blue-500 animate-pulse";
              statusLabel = "Awaiting Yield";
            }

            return (
              <Tooltip key={dateKey}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className={cn(
                      "flex-1 min-w-[8px] md:min-w-[12px] h-12 md:h-16 rounded-full cursor-pointer transition-colors",
                      statusColor
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="p-4 rounded-2xl bg-[#111113] border-white/10 shadow-2xl">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{format(day, 'EEEE, MMM do')}</p>
                    <div className="flex items-center gap-2">
                      {isPresent ? <CheckCircle2 size={14} className="text-emerald-500" /> : isAbsent ? <XCircle size={14} className="text-rose-500" /> : <Clock size={14} className="text-gray-500" />}
                      <span className="text-sm font-black text-white uppercase tracking-tight">{statusLabel}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-8 justify-center md:justify-start">
        <LegendItem color="bg-emerald-500" label="Present" />
        <LegendItem color="bg-rose-500" label="Absent" />
        <LegendItem color="bg-gray-200 dark:bg-white/10" label="Not Joined" />
        <LegendItem color="bg-gray-100 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10" label="Future" />
      </div>
    </GlassCard>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("size-3 rounded-full", color)} />
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
}
