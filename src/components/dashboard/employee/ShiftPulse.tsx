'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Play, Clock } from 'lucide-react';
import { useTeam } from '@/hooks/use-team';

interface ShiftPulseProps {
  activeShift: any;
  isOnline: boolean;
}

export function ShiftPulse({ activeShift, isOnline }: ShiftPulseProps) {
  const { selectedDate } = useTeam();
  const isSelectedToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const getDate = (ts: any) => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  // If it's today but they aren't online
  if (isSelectedToday && (!isOnline || !activeShift)) {
    return (
      <div className="flex items-center gap-4 px-2 opacity-50">
        <div className="size-8 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-500 border border-gray-500/10">
          <Clock size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</span>
          <span className="text-xs font-bold uppercase tracking-tight text-foreground">Waiting for shift to start</span>
        </div>
      </div>
    );
  }

  // If no shift for a historical date
  if (!activeShift) {
    return (
      <div className="flex items-center gap-4 px-2 opacity-50">
        <div className="size-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/10">
          <Clock size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">History</span>
          <span className="text-xs font-bold uppercase tracking-tight text-foreground">No shift recorded for this date</span>
        </div>
      </div>
    );
  }

  const startTime = getDate(activeShift.startTime);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-2"
    >
      <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm">
        <Play size={20} className="fill-current ml-0.5" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Started shift at</span>
          <span className="text-2xl font-black tracking-tighter uppercase">
            {format(startTime, 'hh:mm')}
            <span className="text-sm ml-1 opacity-60">{format(startTime, 'aa')}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
