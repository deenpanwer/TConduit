'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Monitor, Keyboard, MousePointer2 } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeam } from '@/hooks/use-team';
import { getAppMeta } from '@/lib/branding';

interface WorkflowTimelineProps {
  workShifts: any[];
}

export function WorkflowTimeline({ workShifts }: WorkflowTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { selectedDate } = useTeam();
  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  // --- DRAG-TO-SCROLL ENGINE ---
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    scrollContainerRef.current.classList.add('cursor-grabbing');
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    scrollContainerRef.current?.classList.remove('cursor-grabbing');
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    scrollContainerRef.current?.classList.remove('cursor-grabbing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // Filter shifts for selected day and normalize hourly data
  const normalizedData = useMemo(() => {
    const buckets: Record<string, any[]> = {};
    hours.forEach(h => buckets[h] = []);

    workShifts.forEach(shift => {
      if (!shift.id.startsWith(dateStr)) return;
      if (!shift.hourlyPulse) return;

      Object.entries(shift.hourlyPulse).forEach(([hour, data]: [string, any]) => {
        if (!buckets[hour]) return;
        
        const apps: any[] = [];
        
        if (data?.detailedApps) {
            Object.entries(data.detailedApps).forEach(([appName, appData]: [string, any]) => {
                apps.push({
                    ...appData,
                    name: appName // Capture the key as the name
                });
            });
        }

        // Support Legacy: if detailedApps is missing but hour has seconds, create a generic block
        if (apps.length === 0 && (data?.seconds || data?.metrics?.seconds)) {
            apps.push({
                name: 'General Activity',
                totalSeconds: data?.metrics?.seconds || data?.seconds || 0,
                activeSeconds: data?.metrics?.activeSeconds || data?.activeSeconds || 0,
                keystrokes: data?.metrics?.keystrokes || data?.keystrokes || 0,
                mouseClicks: data?.metrics?.mouseClicks || data?.mouseClicks || 0,
            });
        }
        buckets[hour].push(...apps);
      });
    });
    return buckets;
  }, [workShifts, dateStr]);

  // Auto-scroll to first activity on date change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const firstActiveHour = hours.findIndex(h => {
        const hourData = normalizedData[h];
        return hourData && hourData.length > 0;
      });
      
      if (firstActiveHour !== -1) {
        scrollContainerRef.current.scrollLeft = (firstActiveHour * 160) - 40;
      } else {
        scrollContainerRef.current.scrollLeft = 0;
      }
    }
  }, [dateStr, normalizedData]);

  return (
    <TooltipProvider delayDuration={0}>
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
              Temporal Activity Map / {format(selectedDate, 'PPP')}
            </p>
          </div>
        </div>

        <div className="relative rounded-[2.5rem] bg-card border border-border overflow-hidden shadow-2xl group">
          {/* The Grid Background */}
          <div className="absolute inset-0 flex pointer-events-none">
              {hours.map(h => (
                  <div key={h} className="flex-1 border-r border-border/20 h-full min-w-[160px]" />
              ))}
          </div>

          {/* Scroll Area */}
          <div 
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="relative flex overflow-x-auto pb-12 pt-6 px-4 gap-0 no-scrollbar snap-x cursor-grab active:cursor-grabbing custom-scrollbar select-none"
          >
            {hours.map((hour) => {
              const apps = normalizedData[hour] || [];
              const hasActivity = apps.length > 0;

              return (
                <div key={hour} className="flex-shrink-0 w-[160px] snap-start flex flex-col items-center px-2 relative z-10">
                  {/* Time Label */}
                  <div className="mb-6 flex flex-col items-center">
                    <span className={cn(
                      "text-[11px] font-black uppercase tracking-widest transition-all",
                      hasActivity ? "text-foreground scale-110" : "text-muted-foreground/30"
                    )}>
                      {hour}:00
                    </span>
                    {hasActivity && <div className="w-1 h-1 rounded-full bg-primary mt-2 animate-pulse" />}
                  </div>

                  {/* Capsule Container (Rows) */}
                  <div className="w-full space-y-2 min-h-[300px] flex flex-col justify-start">
                    {apps.map((app: any, idx: number) => {
                      const appName = app.name || 'Unknown';
                      const meta = getAppMeta(appName);
                      const heightFactor = Math.max(app.totalSeconds / 3600, 0.15); // Minimum size for visibility
                      
                      return (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              style={{ height: `${heightFactor * 280}px` }}
                              className={cn(
                                "w-full rounded-xl flex items-center px-3 gap-3 cursor-pointer relative group/capsule overflow-hidden shadow-lg border border-white/10 transition-all active:scale-95",
                                meta.bg
                              )}
                            >
                               <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none" />
                               
                               <div className="size-6 rounded-md bg-black/20 flex items-center justify-center overflow-hidden shrink-0">
                                  {meta.icon ? (
                                    <img src={meta.icon} className="size-4 object-contain" alt="" />
                                  ) : (
                                    <Monitor className="size-3 text-white/50" />
                                  )}
                               </div>

                               <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-black text-white uppercase truncate leading-tight">
                                    {meta.cleanName}
                                  </span>
                                  <span className="text-[8px] font-bold text-white/60 uppercase">
                                    {formatTime(app.totalSeconds)}
                                  </span>
                               </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-4 rounded-2xl bg-black border-white/10 shadow-2xl space-y-3 min-w-[180px] z-[100]">
                             <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                <div className={cn("size-3 rounded-full", meta.bg)} />
                                <span className="text-[11px] font-black text-white uppercase tracking-tight">{meta.cleanName}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[7px] font-black text-white/40 uppercase">Duration</p>
                                    <p className="text-[10px] font-black text-white">{formatTime(app.totalSeconds)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[7px] font-black text-white/40 uppercase">Activity</p>
                                    <p className="text-[10px] font-black text-emerald-400">
                                        {app.totalSeconds > 0 ? Math.round((app.activeSeconds/app.totalSeconds)*100) : 0}%
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[7px] font-black text-white/40 uppercase">Keys</p>
                                    <p className="text-[10px] font-black text-white flex items-center gap-1">
                                        <Keyboard size={10} /> {app.keystrokes || 0}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[7px] font-black text-white/40 uppercase">Clicks</p>
                                    <p className="text-[10px] font-black text-white flex items-center gap-1">
                                        <MousePointer2 size={10} /> {app.mouseClicks || 0}
                                    </p>
                                </div>
                             </div>

                             {/* Detailed Window Titles (Wonderfully Placed) */}
                             {app.details && Object.keys(app.details).length > 0 && (
                                <div className="pt-2 border-t border-white/10 space-y-2">
                                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Focused Windows</p>
                                    <div className="space-y-1.5">
                                        {Object.entries(app.details)
                                            .sort(([, a], [, b]) => (b as number) - (a as number))
                                            .slice(0, 5)
                                            .map(([title, seconds]) => (
                                                <div key={title} className="flex items-start justify-between gap-3 min-w-0">
                                                    <span className="text-[9px] font-bold text-white/70 truncate uppercase tracking-tighter leading-tight flex-1">
                                                        {title}
                                                    </span>
                                                    <span className="text-[8px] font-black text-primary shrink-0 pt-0.5">
                                                        {Math.round((seconds as number) / 60)}m
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                             )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
