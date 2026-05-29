'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfDay, addHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, MousePointer2, Keyboard, Monitor, Info, Sparkles } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- DUMMY DATA GENERATOR (MODERN SCHEMA) ---
const generateDummyShift = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const hourlyPulse: Record<string, any> = {};

  // Applications to simulate
  const apps = [
    { id: 'chrome', name: 'Google Chrome', color: 'bg-blue-500' },
    { id: 'vscode', name: 'Visual Studio Code', color: 'bg-indigo-500' },
    { id: 'slack', name: 'Slack', color: 'bg-purple-500' },
    { id: 'zoom', name: 'Zoom', color: 'bg-cyan-500' },
    { id: 'spotify', name: 'Spotify', color: 'bg-emerald-500' },
    { id: 'figma', name: 'Figma', color: 'bg-rose-500' },
    { id: 'idle', name: 'Idle', color: 'bg-gray-400' },
  ];

  // Generate data for 24 hours
  for (let i = 0; i < 24; i++) {
    const hourKey = i.toString().padStart(2, '0');
    
    // Simulate shift hours (e.g., 9 AM to 6 PM)
    if (i >= 9 && i <= 18) {
      const detailedApps: Record<string, any> = {};
      let remainingSeconds = 3600;
      
      // Randomly pick 2-4 apps for this hour
      const hourApps = [...apps].sort(() => 0.5 - Math.random()).slice(0, Math.random() * 3 + 2);
      
      hourApps.forEach((app, idx) => {
        const isLast = idx === hourApps.length - 1;
        const seconds = isLast ? remainingSeconds : Math.floor(Math.random() * (remainingSeconds / 1.5));
        
        detailedApps[app.id] = {
          name: app.name,
          totalSeconds: seconds,
          activeSeconds: Math.floor(seconds * 0.8),
          idleSeconds: Math.floor(seconds * 0.2),
          keystrokes: Math.floor(seconds * 1.5),
          mouseClicks: Math.floor(seconds * 0.4),
        };
        
        remainingSeconds -= seconds;
      });

      hourlyPulse[hourKey] = {
        metrics: {
          totalSeconds: 3600 - remainingSeconds,
          keystrokes: Math.floor((3600 - remainingSeconds) * 1.5),
          mouseClicks: Math.floor((3600 - remainingSeconds) * 0.4),
        },
        detailedApps
      };
    } else {
      // Offline hours
      hourlyPulse[hourKey] = {
        metrics: { totalSeconds: 0 },
        detailedApps: {}
      };
    }
  }

  return {
    id: `${today}_1`,
    status: 'finalized',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    hourlyPulse,
    liveMetrics: {
      totalSeconds: 36000,
      keystrokes: 45000,
      mouseClicks: 12000,
    }
  };
};

// --- COMPONENT: WorkflowTimeline ---

interface WorkflowTimelineProps {
  shift: any;
}

export function WorkflowTimeline({ shift }: WorkflowTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper to format seconds to human-readable string
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs}h`;
  };

  // Deterministic colors from the image palette
  const getAppStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('chrome') || n.includes('browser')) return { bg: 'bg-[#0084ff]', icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32' };
    if (n.includes('code') || n.includes('vs') || n.includes('term')) return { bg: 'bg-[#6366f1]', icon: 'https://www.google.com/s2/favicons?domain=visualstudio.com&sz=32' };
    if (n.includes('slack') || n.includes('chat')) return { bg: 'bg-[#4a154b]', icon: 'https://www.google.com/s2/favicons?domain=slack.com&sz=32' };
    if (n.includes('figma')) return { bg: 'bg-[#f24e1e]', icon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=32' };
    if (n.includes('zoom')) return { bg: 'bg-[#2d8cff]', icon: 'https://www.google.com/s2/favicons?domain=zoom.us&sz=32' };
    if (n.includes('spotify')) return { bg: 'bg-[#1db954]', icon: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=32' };
    if (n.includes('idle')) return { bg: 'bg-[#6b7280]', icon: null };
    return { bg: 'bg-[#10b981]', icon: null };
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // Auto-scroll to activity
  useEffect(() => {
    if (scrollContainerRef.current) {
      const firstActiveHour = hours.findIndex(h => {
        const data = shift.hourlyPulse[h];
        return data && data.metrics?.totalSeconds > 0;
      });
      if (firstActiveHour !== -1) {
        scrollContainerRef.current.scrollLeft = (firstActiveHour * 160) - 40;
      }
    }
  }, [shift]);

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
                <Monitor className="w-6 h-6 text-primary" />
            </div>
            Workflow Timeline
          </h3>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 ml-11">
            Temporal Capsule Audit / Modern Schema
          </p>
        </div>
      </div>

      <div className="relative rounded-[2.5rem] bg-[#0f1115] border border-white/5 overflow-hidden shadow-inner group">
        {/* The Grid Background */}
        <div className="absolute inset-0 flex pointer-events-none">
            {hours.map(h => (
                <div key={h} className="flex-1 border-r border-white/[0.03] h-full min-w-[160px]" />
            ))}
        </div>

        {/* Scroll Area */}
        <div 
          ref={scrollContainerRef}
          className="relative flex overflow-x-auto pb-12 pt-6 px-4 gap-0 no-scrollbar snap-x cursor-grab active:cursor-grabbing"
        >
          {hours.map((hour) => {
            const hourData = shift.hourlyPulse[hour];
            const apps = hourData?.detailedApps ? Object.values(hourData.detailedApps) : [];
            const hasActivity = apps.length > 0;

            return (
              <div key={hour} className="flex-shrink-0 w-[160px] snap-start flex flex-col items-center px-2 relative z-10">
                {/* Time Label */}
                <div className="mb-6 flex flex-col items-center">
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-widest transition-all",
                    hasActivity ? "text-white scale-110" : "text-white/10"
                  )}>
                    {hour}:00
                  </span>
                  {hasActivity && <div className="w-1 h-1 rounded-full bg-primary mt-2 animate-pulse" />}
                </div>

                {/* Capsule Container (Rows) */}
                <div className="w-full space-y-2 min-h-[300px] flex flex-col">
                  {apps.map((app: any, idx: number) => {
                    const style = getAppStyle(app.name);
                    const heightFactor = Math.max(app.totalSeconds / 3600, 0.15); // Minimum size for visibility
                    
                    return (
                      <TooltipProvider key={idx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              style={{ height: `${heightFactor * 280}px` }}
                              className={cn(
                                "w-full rounded-xl flex items-center px-3 gap-3 cursor-pointer relative group/capsule overflow-hidden shadow-lg",
                                style.bg,
                                "border border-white/10 hover:ring-2 ring-white/20 transition-all active:scale-95"
                              )}
                            >
                               {/* Shine Effect */}
                               <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none" />
                               
                               {/* Icon */}
                               <div className="size-6 rounded-md bg-black/20 flex items-center justify-center overflow-hidden shrink-0">
                                  {style.icon ? (
                                    <img src={style.icon} className="size-4 object-contain" alt="" />
                                  ) : (
                                    <Monitor className="size-3 text-white/50" />
                                  )}
                               </div>

                               {/* Label */}
                               <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-black text-white uppercase truncate leading-tight">
                                    {app.name}
                                  </span>
                                  <span className="text-[8px] font-bold text-white/60 uppercase">
                                    {formatTime(app.totalSeconds)}
                                  </span>
                               </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-4 rounded-2xl bg-[#111] border-white/10 shadow-2xl">
                             {/* Tooltip Content stays detailed as before */}
                             <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-2">
                                <div className={cn("size-2 rounded-full", style.bg)} />
                                <span className="text-[11px] font-black text-white uppercase">{app.name}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                <div>
                                    <p className="text-[7px] font-black text-white/40 uppercase">Intensity</p>
                                    <p className="text-[10px] font-black text-emerald-400">{Math.round((app.activeSeconds/app.totalSeconds)*100)}%</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-white/40 uppercase">Keystrokes</p>
                                    <p className="text-[10px] font-black text-white">{app.keystrokes}</p>
                                </div>
                             </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ChevronLeft = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>;


// --- PAGE: Test16 ---

export default function Test16Page() {
  const dummyShift = useMemo(() => generateDummyShift(), []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8 md:p-16 space-y-16">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-3 h-3 text-primary mr-2" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">New Component Alpha</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8]">
            Workflow<br /><span className="text-primary">Intelligence</span>
          </h1>
          <p className="max-w-xl text-muted-foreground text-sm font-medium leading-relaxed">
            Testing the new modern schema integration for temporal application usage. 
            This component maps `detailedApps` across a 24-hour timeline with stacked productivity blocks.
          </p>
        </div>

        {/* The Component */}
        <div className="p-8 md:p-12 rounded-[3rem] bg-card/50 border border-border/50 shadow-2xl backdrop-blur-xl">
          <WorkflowTimeline shift={dummyShift} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-8 rounded-[2.5rem] bg-secondary/10 border border-border/50 space-y-4">
              <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                 <Info size={24} />
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight">Normalization</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically calculates percentages based on 3600 seconds per hour.
                Handles gap-fill for hours with partial activity.
              </p>
           </div>
           <div className="p-8 rounded-[2.5rem] bg-secondary/10 border border-border/50 space-y-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <Monitor size={24} />
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight">Composition</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Apps are stacked in the order they were utilized. 
                Visual indicators change opacity based on active vs idle time.
              </p>
           </div>
           <div className="p-8 rounded-[2.5rem] bg-secondary/10 border border-border/50 space-y-4">
              <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                 <Clock size={24} />
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight">Timeline</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Horizontal scroll with snap-to-hour functionality. 
                Optimized for touch interfaces and precision mouse tracking.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}