"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Zap, Pause, ShieldCheck, Activity } from "lucide-react";
import { format } from "date-fns";
import { GlassCard } from "../main/shared/GlassCard";
import { useTeam } from "@/hooks/use-team";

interface YieldCalculatorProps {
  employeeId: string;
  employeeName: string;
  workShifts: any[];
  screenshots: any[];
  joinedDate: Date | null;
}

export function YieldCalculator({ employeeId, employeeName, workShifts, screenshots, joinedDate }: YieldCalculatorProps) {
  const { selectedDate } = useTeam();
  const dateStr = useMemo(() => format(selectedDate || new Date(), 'yyyy-MM-dd'), [selectedDate]);

  const stats = useMemo(() => {
    let totalSecs = 0;
    let idleSecs = 0;
    let activeSecs = 0;
    let breakSecs = 0;

    workShifts.forEach(shift => {
      if (!shift.id || !shift.id.startsWith(dateStr)) return;

      const metrics = shift.liveMetrics || shift.metrics || {};
      totalSecs += (metrics.totalSeconds || shift.totalSeconds || 0);
      idleSecs += (metrics.idleSeconds || shift.idleSeconds || 0);
      activeSecs += (metrics.activeSeconds || shift.activeSeconds || 0);
      breakSecs += (metrics.breakSeconds || 0);
    });

    const activeHours = (activeSecs / 3600).toFixed(2);
    const idleHours = (idleSecs / 3600).toFixed(2);
    const breakHours = (breakSecs / 3600).toFixed(2);
    const totalHours = (totalSecs / 3600).toFixed(2);

    const activeEfficiency = totalSecs > 0 ? Math.round((activeSecs / totalSecs) * 100) : 0;
    const idleRatio = totalSecs > 0 ? Math.round((idleSecs / totalSecs) * 100) : 0;
    const breakRatio = totalSecs > 0 ? Math.round((breakSecs / totalSecs) * 100) : 0;

    const dayScreenshots = screenshots.filter(s => {
      if (!s.timestamp) return false;
      let tsDate;
      if (s.timestamp.toDate) tsDate = s.timestamp.toDate();
      else tsDate = new Date(s.timestamp);
      return format(tsDate, 'yyyy-MM-dd') === dateStr;
    });

    return {
      activeHours,
      idleHours,
      breakHours,
      totalHours,
      activeEfficiency,
      idleRatio,
      breakRatio,
      logCount: dayScreenshots.length
    };
  }, [workShifts, dateStr, screenshots]);

  return (
    <GlassCard className="p-12 relative overflow-hidden" hoverEffect={false}>
      <div className="flex flex-col gap-10 relative z-10">
        
        {/* Header Section */}
        <div className="flex items-center justify-between w-full border-b-4 border-black dark:border-white pb-6">
          <div className="flex items-center gap-6">
              <div className="p-4 rounded-3xl bg-orange-500/10 text-orange-500 hidden md:block border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Activity size={28} />
              </div>
              <div className="space-y-1">
                  <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Activity Summary</h3>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Verified</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 italic font-medium uppercase tracking-widest">
                    Summary of activity on {format(selectedDate || new Date(), 'MMMM do, yyyy')}.
                  </p>
              </div>
          </div>
        </div>

        {/* 3-Column Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active Time */}
          <div className="bg-secondary/15 border-4 border-black dark:border-white rounded-3xl p-6 flex items-center gap-5 group hover:bg-emerald-500/5 hover:border-emerald-500 transition-all hover:shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter text-emerald-500">{stats.activeHours}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Hours</span>
              </div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Active Time</p>
            </div>
          </div>

          {/* Card 2: Idle Time */}
          <div className="bg-secondary/15 border-4 border-black dark:border-white rounded-3xl p-6 flex items-center gap-5 group hover:bg-orange-500/5 hover:border-orange-500 transition-all hover:shadow-[4px_4px_0px_0px_rgba(249,115,22,0.2)]">
            <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter text-orange-500">{stats.idleHours}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Hours</span>
              </div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Idle Time</p>
            </div>
          </div>

          {/* Card 3: Break Time */}
          <div className="bg-secondary/15 border-4 border-black dark:border-white rounded-3xl p-6 flex items-center gap-5 group hover:bg-amber-500/5 hover:border-amber-500 transition-all hover:shadow-[4px_4px_0px_0px_rgba(245,158,11,0.2)]">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Pause className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter text-amber-500">{stats.breakHours}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Hours</span>
              </div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Break Time</p>
            </div>
          </div>
        </div>

        {/* Progress Bar / Ratio Container */}
        <div className="px-2 mt-2 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Activity Ratio</span>
                </div>
                <span className="text-xs font-black text-primary">{stats.activeEfficiency}% Active</span>
            </div>
            <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden flex shadow-inner border-2 border-black dark:border-white">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.activeEfficiency}%` }}
                    className="h-full bg-primary" 
                />
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.idleRatio}%` }}
                    className="h-full bg-orange-500" 
                />
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.breakRatio}%` }}
                    className="h-full bg-amber-500" 
                />
            </div>
            <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pt-2 border-t border-border/40">
                <span>{stats.logCount} Screenshots Captured</span>
                <span>Total Tracked Time: {stats.totalHours}h</span>
            </div>
        </div>

      </div>
    </GlassCard>
  );
}
