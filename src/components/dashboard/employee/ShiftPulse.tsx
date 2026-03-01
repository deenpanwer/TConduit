'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { Play, Clock, Zap } from 'lucide-react';

interface ShiftPulseProps {
  activeShift: any;
  isOnline: boolean;
}

export function ShiftPulse({ activeShift, isOnline }: ShiftPulseProps) {
  const getDate = (ts: any) => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  if (!isOnline || !activeShift) {
    return (
      <div className="flex items-center gap-4 px-2 opacity-50">
        <div className="size-8 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-500 border border-gray-500/10">
          <Clock size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">System Status</span>
          <span className="text-xs font-bold uppercase tracking-tight text-foreground">Personnel Standby</span>
        </div>
      </div>
    );
  }

  const startTime = getDate(activeShift.startTime);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 px-2"
    >
      {/* Start Timestamp */}
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm">
          <Play size={16} className="fill-current ml-0.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-0.5">Shift Commenced</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black tracking-tighter uppercase">{format(startTime, 'HH:mm:ss')}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{format(startTime, 'aa')}</span>
          </div>
        </div>
      </div>

      {/* Duration Pulse */}
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-sm relative overflow-hidden">
          <Clock size={16} />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute inset-0 border-2 border-transparent border-t-blue-500/30 rounded-full"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 mb-0.5">Session Duration</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter uppercase">
               {formatDistanceToNow(startTime, { addSuffix: false }).replace('about ', '')}
            </span>
            <div className="flex space-x-0.5 items-end h-3">
                {[0.4, 0.7, 0.3].map((h, i) => (
                    <motion.div 
                        key={i}
                        animate={{ height: ["20%", "100%", "20%"] }}
                        transition={{ repeat: Infinity, duration: 1 + i*0.2, ease: "easeInOut" }}
                        className="w-0.5 bg-blue-500 rounded-full"
                    />
                ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
