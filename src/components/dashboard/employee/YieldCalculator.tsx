"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, Coffee, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { GlassCard } from "../main/shared/GlassCard";
import { Button } from "@/components/ui/button";

interface YieldCalculatorProps {
  employeeId: string;
  employeeName: string;
  timeEntries: any[];
  screenshots: any[];
}

export function YieldCalculator({ employeeId, employeeName, timeEntries, screenshots }: YieldCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<{
    totalHours: string;
    idleHours: string;
    activeHours: string;
    idleRatio: number;
  } | null>(null);

  const runCalculation = async () => {
    setIsCalculating(true);
    setResult(null);
    setProgress(5);
    setStatus("Initializing Neural Audit...");

    // Helper to extract JS Date safely
    const getDate = (ts: any) => {
      if (!ts) return new Date(0);
      if (ts.toDate) return ts.toDate();
      if (ts instanceof Date) return ts;
      if (ts.seconds) return new Date(ts.seconds * 1000);
      return new Date(ts);
    };

    try {
      // 1. Process Time Entries for Total Clocked Time
      setStatus("Extracting Time Ledger...");
      setProgress(30);
      
      // Calculate total seconds from all provided entries
      const totalSeconds = timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);

      setProgress(60);
      setStatus("Analyzing Telemetry Packets...");

      // 2. Process all provided logs
      const targetLogs = screenshots;

      setStatus("Calculating Cognitive Yield...");
      setProgress(80);

      // 3. Logic: A log is idle if Keystrokes, Clicks, and Distance are all 0
      const idleLogs = targetLogs.filter(l => {
        const activity = l.activity || l; 
        return (activity.keystrokes || 0) === 0 && 
               (activity.mouseClicks || 0) === 0 && 
               (activity.mouseDistance || 0) === 0;
      });

      const idleRatio = targetLogs.length > 0 ? idleLogs.length / targetLogs.length : 0;
      const idleSeconds = totalSeconds * idleRatio;
      const activeSeconds = totalSeconds - idleSeconds;

      setProgress(95);
      setStatus("Finalizing Audit...");
      
      setTimeout(() => {
        setResult({
          totalHours: (totalSeconds / 3600).toFixed(2),
          idleHours: (idleSeconds / 3600).toFixed(2),
          activeHours: (activeSeconds / 3600).toFixed(2),
          idleRatio: Math.round(idleRatio * 100)
        });
        setIsCalculating(false);
        setProgress(100);
      }, 800);

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
            <div className="p-4 rounded-3xl bg-orange-500/10 text-orange-500 hidden md:block">
                <Coffee size={32} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Shift Idle Audit</h3>
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">Experimental</span>
                </div>
                <p className="text-xs font-bold text-muted-foreground max-w-md leading-relaxed">
                    Automatically scans today's activity logs to calculate exact downtime. 
                    <span className="block mt-1 text-[10px] text-muted-foreground/60 italic font-medium">Timeframe: From first login today until now.</span>
                </p>
            </div>
        </div>

        {!isCalculating && !result && (
          <Button 
            onClick={runCalculation}
            className="rounded-[2rem] h-20 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group"
          >
            <Zap size={20} className="mr-3 fill-current" /> Scan For Idle Time
          </Button>
        )}

        {isCalculating && (
          <div className="flex-1 max-w-md w-full space-y-5 bg-muted/20 p-6 rounded-[2rem] border border-border/50">
             <div className="flex justify-between items-end mb-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse mb-1">{status}</span>
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">Neural cross-referencing in progress...</span>
                </div>
                <span className="text-xl font-black italic">{progress}%</span>
             </div>
             <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
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
            {/* Total Hours Container */}
            <div className="bg-card/50 border border-border rounded-[2.5rem] p-10 flex items-center gap-8 group hover:border-primary/30 transition-all hover:shadow-2xl">
              <div className="p-6 rounded-[2rem] bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Clock className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter">{result.totalHours}</span>
                    <span className="text-sm font-bold text-muted-foreground uppercase">Hours</span>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Total Logged Shift</p>
              </div>
            </div>

            {/* Idle Hours Container */}
            <div className="bg-card/50 border border-border rounded-[2.5rem] p-10 flex items-center gap-8 group hover:border-orange-500/30 transition-all hover:shadow-2xl">
              <div className="p-6 rounded-[2rem] bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                <Coffee className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-orange-500">{result.idleHours}</span>
                    <span className="text-sm font-bold text-muted-foreground uppercase">Hours</span>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Calculated Idle Time</p>
              </div>
            </div>
            
            <div className="md:col-span-2 px-4">
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${100 - result.idleRatio}%` }} />
                    <div className="h-full bg-orange-500" style={{ width: `${result.idleRatio}%` }} />
                </div>
                <div className="flex justify-between mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Active Efficiency: {100 - result.idleRatio}%</span>
                    <span>Idle Penalty: {result.idleRatio}%</span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
