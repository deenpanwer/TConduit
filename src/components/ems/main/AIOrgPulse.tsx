"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Zap, RefreshCcw } from "lucide-react";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface AIOrgPulseProps {
  employees: any[];
  selectedDate: Date;
  orgName: string;
}

export function AIOrgPulse({ employees, selectedDate, orgName }: AIOrgPulseProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  
  // Calculate a "fingerprint" of the data to know when to trigger re-analysis
  const dataFingerprint = useMemo(() => {
    const totalSeconds = employees.reduce((acc: number, emp) => {
      const dayShifts = (emp.workShifts || []).filter((s: any) => s.id.startsWith(dateStr));
      return acc + dayShifts.reduce((sAcc: number, s: any) => sAcc + (s.liveMetrics?.totalSeconds || 0), 0);
    }, 0);
    return `${dateStr}-${employees.length}-${totalSeconds}`;
  }, [employees, dateStr]);

  const fetchOrgAnalysis = async () => {
    if (!employees || employees.length === 0) return;
    
    // Prepare data: all shifts for all employees for the selected day
    const allShiftsData = employees.map(emp => {
      const dayShifts = (emp.workShifts || []).filter((s: any) => s.id.startsWith(dateStr));
      return {
        name: emp.name,
        shifts: dayShifts.map((s: any) => ({
          id: s.id,
          status: s.status,
          startTime: s.startTime,
          endTime: s.endTime,
          startTimeLocal: s.startTimeLocal,
          endTimeLocal: s.updatedAtLocal || new Date(s.endTime).toLocaleString(),
          timezone: s.timezone,
          liveMetrics: s.liveMetrics,
          liveBreakdown: s.liveBreakdown,
          hourlyPulse: s.hourlyPulse,
          // Removed cognitiveReport, velocity, productivityScore, and focusScore
        }))
      };
    }).filter(emp => emp.shifts.length > 0);

    if (allShiftsData.length === 0) return;

    setLoading(true);
    setAnalysis(null);

    // LOGGING TO CONSOLE AS REQUESTED
    console.log(`AI ORG PULSE - PAYLOAD FOR ${orgName} SENT TO AI [DATE: ${dateStr}]:`, allShiftsData);

    try {
      const res = await fetch("/api/org/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          orgName: orgName,
          orgData: allShiftsData,
        }),
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
      console.error("Failed to fetch AI Org analysis", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgAnalysis();
  }, [dataFingerprint]);

  if (!analysis) {
    if (loading) return (
      <div className="w-full bg-card/30 border border-primary/10 rounded-[2.5rem] p-8 space-y-4 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-primary animate-pulse" size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Architecting Organizational Report...</h3>
        </div>
        <Shimmer className="h-4 w-3/4 rounded-full" />
        <Shimmer className="h-4 w-1/2 rounded-full" />
      </div>
    );

    const hasAnyShifts = employees.some(emp => (emp.workShifts || []).some((s: any) => s.id.startsWith(dateStr)));

    if (!hasAnyShifts) {
      return (
        <div className="w-full bg-card/20 border border-dashed border-border/50 rounded-[3rem] p-10 mb-12 flex flex-col items-center justify-center text-center space-y-4">
           <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground/30">
              <Zap size={32} />
           </div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Standby Mode</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">No personnel activity recorded for {format(selectedDate, 'MMMM dd')}</p>
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
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Organization Audit Ready</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">Collected output from {employees.filter(e => (e.workShifts || []).some((s:any) => s.id.startsWith(dateStr))).length} active members</p>
            </div>
            <Button 
              onClick={fetchOrgAnalysis} 
              variant="outline" 
              size="sm" 
              className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            >
              Run Collective Audit
            </Button>
         </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
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
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Collective {orgName} Report</h3>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-lg font-medium leading-relaxed tracking-tight text-foreground/90">
        <ReactMarkdown>{analysis}</ReactMarkdown>
      </div>
    </motion.div>
  );
}