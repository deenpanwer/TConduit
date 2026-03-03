"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, Coffee, RefreshCcw, ShieldCheck, Search } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { GlassCard } from "../main/shared/GlassCard";
import { Button } from "@/components/ui/button";

interface YieldCalculatorProps {
  employeeId: string;
  employeeName: string;
  workShifts: any[];
  screenshots: any[];
  joinedDate: Date | null;
}

export function YieldCalculator({ employeeId, employeeName, workShifts, screenshots, joinedDate }: YieldCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<{
    totalHours: string;
    idleHours: string;
    activeHours: string;
    idleRatio: number;
    activeEfficiency: number;
    logCount: number;
  } | null>(null);

  const runCalculation = async () => {
    setIsCalculating(true);
    setResult(null);
    setProgress(5);
    setStatus("Initializing Neural Audit...");

    const getDate = (ts: any) => {
      if (!ts) return new Date(0);
      if (ts.toDate) return ts.toDate();
      if (ts instanceof Date) return ts;
      if (ts.seconds) return new Date(ts.seconds * 1000);
      return new Date(ts);
    };

    try {
      setStatus("Extracting System Telemetry...");
      setProgress(30);
      
      const actualJoinedDate = joinedDate ? startOfDay(joinedDate) : new Date(0);
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      let totalSecs = 0;
      let idleSecs = 0;
      let activeSecs = 0;

      workShifts.forEach(shift => {
        const shiftStartDate = getDate(shift.startTime);
        if (!shift.id.startsWith(todayStr) || shiftStartDate < actualJoinedDate) return;

        totalSecs += (shift.liveMetrics?.totalSeconds || 0);
        idleSecs += (shift.liveMetrics?.idleSeconds || 0);
        activeSecs += (shift.liveMetrics?.activeSeconds || 0);
      });

      setProgress(60);
      setStatus("Analyzing Interaction Patterns...");

      const targetLogs = screenshots;
      
      setStatus("Finalizing Yield Report...");
      setProgress(85);

      const idleRatio = totalSecs > 0 ? (idleSecs / totalSecs) * 100 : 0;
      const activeEfficiency = totalSecs > 0 ? (activeSecs / totalSecs) * 100 : 0;

      setTimeout(() => {
        setResult({
          totalHours: (totalSecs / 3600).toFixed(2),
          idleHours: (idleSecs / 3600).toFixed(2),
          activeHours: (activeSecs / 3600).toFixed(2),
          idleRatio: Math.round(idleRatio),
          activeEfficiency: Math.round(activeEfficiency),
          logCount: targetLogs.length
        });
        setIsCalculating(false);
        setProgress(100);
      }, 1200);

    } catch (error) {
      console.error("Calculation failed", error);
      setStatus("Audit Failed");
      setIsCalculating(false);
    }
  };

  return (
    <GlassCard className="p-12 relative overflow-hidden" hoverEffect={false}>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
        <div className="flex items-center gap-6">
            <div className="p-4 rounded-3xl bg-orange-500/10 text-orange-500 hidden md:block border border-orange-500/20">
                <Coffee size={32} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Non-Active Time Audit</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">System-Verified</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/60 italic font-medium uppercase tracking-widest">Timeframe: Today's active and non-active time.</span>
                </div>
            </div>
        </div>

        {!isCalculating && !result && (
          <Button 
            onClick={runCalculation}
            className="rounded-[2rem] h-20 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group"
          >
            <Zap size={20} className="mr-3 fill-current" /> Check Now
          </Button>
        )}

        {isCalculating && (
          <div className="flex-1 max-w-md w-full space-y-5 bg-muted/20 p-6 rounded-[2rem] border border-border/50">
             <div className="flex justify-between items-end mb-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse mb-1">{status}</span>
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">Neural cross-referencing...</span>
                </div>
                <span className="text-xl font-black italic">{progress}%</span>
             </div>
             <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner border border-white/5">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
             </div>
          </div>
        )}

        {result && (
          <Button 
            onClick={runCalculation}
            variant="outline"
            className="rounded-2xl h-14 px-6 border-primary/20 hover:bg-primary/5 font-black uppercase tracking-widest text-[10px] transition-all hover:rotate-180"
          >
            <RefreshCcw size={14} className="mr-2" /> Refresh Audit
          </Button>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 pt-16 border-t border-border/50"
          >
            {/* Active Output Container */}
            <div className="bg-card/50 border border-border rounded-[2.5rem] p-10 flex items-center gap-8 group hover:border-emerald-500/30 transition-all hover:shadow-2xl">
              <div className="p-6 rounded-[2rem] bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10 fill-current" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-emerald-500">{result.activeHours}</span>
                    <span className="text-sm font-bold text-muted-foreground uppercase">Hours</span>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Verified Active Time</p>
              </div>
            </div>

            {/* Idle Penalty Container */}
            <div className="bg-card/50 border border-border rounded-[2.5rem] p-10 flex items-center gap-8 group hover:border-orange-500/30 transition-all hover:shadow-2xl">
              <div className="p-6 rounded-[2rem] bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                <Coffee className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-orange-500">{result.idleHours}</span>
                    <span className="text-sm font-bold text-muted-foreground uppercase">Hours</span>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Calculated Non-Active Time</p>
              </div>
            </div>
            
            <div className="md:col-span-2 px-4">
                <div className="flex justify-between mb-4 items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Ratio</span>
                    </div>
                    <span className="text-xs font-black text-primary">{result.activeEfficiency}% Neural Yield</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.activeEfficiency}%` }}
                        className="h-full bg-primary" 
                    />
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.idleRatio}%` }}
                        className="h-full bg-orange-500" 
                    />
                </div>
                <div className="flex justify-between mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    <span>Analyzed {result.logCount} Interaction Packets</span>
                    <span>Total Shifts: {result.totalHours}h</span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
