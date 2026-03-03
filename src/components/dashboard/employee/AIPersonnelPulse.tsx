"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCcw } from "lucide-react";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer";
import { format } from "date-fns";
import { useTeam } from "@/hooks/use-team";

interface AIPersonnelPulseProps {
  employee: any;
  workShifts: any[];
  screenshots: any[];
}

export function AIPersonnelPulse({ employee, workShifts, screenshots }: AIPersonnelPulseProps) {
  const { selectedDate } = useTeam();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  
  const relevantShifts = useMemo(() => {
    if (!workShifts) return [];
    return workShifts.filter(s => s.id.startsWith(dateStr));
  }, [workShifts, dateStr]);

  const fetchAnalysis = async () => {
    if (!employee || relevantShifts.length === 0) return;
    
    setLoading(true);
    setAnalysis(null);

    const payload = {
      employeeName: employee?.name || "Member",
      date: dateStr,
      shifts: relevantShifts.map(s => ({
        id: s.id,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        liveMetrics: s.liveMetrics,
        liveBreakdown: s.liveBreakdown,
        cognitiveReport: s.cognitiveReport,
        velocity: s.velocity,
        productivityScore: s.productivityScore,
        focusScore: s.focusScore,
      })),
      screenshots: screenshots.slice(0, 15).map(s => ({
        timestamp: s.timestamp?.toDate ? s.timestamp.toDate().toISOString() : (s.timestamp?.seconds ? new Date(s.timestamp.seconds * 1000).toISOString() : s.timestamp),
        activeWindow: (typeof s.activeWindow === 'object' ? s.activeWindow?.title : s.activeWindow) || s.activity?.windowTitle || s.activity?.activeWindow || "Unknown Window",
        appName: (typeof s.activeWindow === 'object' ? s.activeWindow?.owner : s.appName) || s.activity?.appName || s.activity?.processName || "Unknown App",
        url: s.url || s.activity?.cloudinaryUrl || ""
      })),
    };

    // LOGGING TO CONSOLE AS REQUESTED
    console.log(`AI INDIVIDUAL PULSE - PAYLOAD FOR ${employee.name} SENT TO AI [DATE: ${dateStr}]:`, payload);

    try {
      const res = await fetch("/api/employee/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.text) {
        setAnalysis(data.text);
      }
    } catch (error) {
      console.error("Failed to fetch AI analysis", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee && relevantShifts.length > 0) {
      fetchAnalysis();
    }
  }, [employee?.id, relevantShifts.length, dateStr]);

  if (loading) {
    return (
      <div className="w-full bg-card/30 border border-primary/10 rounded-[2.5rem] p-8 space-y-4 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-primary animate-pulse" size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest opacity-60">What {employee?.name || 'Member'} Did Report / Analyzing Workflow...</h3>
        </div>
        <Shimmer className="h-4 w-3/4 rounded-full" />
        <Shimmer className="h-4 w-1/2 rounded-full" />
      </div>
    );
  }

  if (!analysis) {
    if (relevantShifts.length === 0) {
      return (
        <div className="w-full bg-card/20 border border-dashed border-border/50 rounded-[3rem] p-10 mb-12 flex flex-col items-center justify-center text-center space-y-4">
           <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground/30">
              <Zap size={32} />
           </div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Session Logs</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">{employee?.name} has no recorded output for {format(selectedDate, 'MMMM dd')}</p>
           </div>
        </div>
      );
    }
    
    return (
      <div className="w-full bg-card/20 border border-primary/10 rounded-[3rem] p-10 mb-12 flex flex-col items-center justify-center text-center space-y-4">
         <div className="p-4 rounded-2xl bg-primary/5 text-primary/40">
            <RefreshCcw size={32} />
         </div>
         <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Analysis Standby</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">Ready to audit {employee?.name}'s {relevantShifts.length} shifts for {format(selectedDate, 'MMMM dd')}</p>
            </div>
            <Button 
              onClick={fetchAnalysis} 
              variant="outline" 
              size="sm" 
              className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            >
              Run AI Audit Now
            </Button>
         </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-card/40 border border-primary/20 rounded-[3rem] p-10 mb-12 shadow-2xl backdrop-blur-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Zap size={64} className="text-primary" />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="text-primary" size={16} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">What {employee?.name || 'Member'} Did Report</h3>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-lg font-medium leading-relaxed tracking-tight text-foreground/90">
        <ReactMarkdown>{analysis}</ReactMarkdown>
      </div>
    </motion.div>
  );
}