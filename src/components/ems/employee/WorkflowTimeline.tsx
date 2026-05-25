'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Monitor, Keyboard, MousePointer2, Coffee } from 'lucide-react';
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
    if (isDragging.current) {
      isDragging.current = false;
      scrollContainerRef.current?.classList.remove('cursor-grabbing');
    }
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

        const breakSeconds = data?.metrics?.breakSeconds || data?.breakSeconds || 0;
        if (breakSeconds > 0) {
            apps.push({
                name: 'Break',
                totalSeconds: breakSeconds,
                activeSeconds: 0,
                idleSeconds: breakSeconds,
                keystrokes: 0,
                mouseClicks: 0,
                isBreak: true
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
        // Scroll to the first active hour, with a small offset to center it
        scrollContainerRef.current.scrollLeft = (firstActiveHour * 140) - 40; 
      } else {
        scrollContainerRef.current.scrollLeft = 0; // Reset to start if no activity
      }
    }
  }, [dateStr, normalizedData]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full space-y-5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                  <Monitor className="w-4 h-4 text-slate-600" />
              </div>
              Daily Activity Timeline
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-9">
              Your activity on {format(selectedDate, 'MMMM do, yyyy')}
            </p>
          </div>
        </div>

        <div className="relative rounded-2xl bg-card border border-border/80 overflow-hidden shadow-sm group">
          {/* The Grid Background */}
          <div className="absolute inset-0 flex pointer-events-none">
              {hours.map(h => (
                  <div key={h} className="flex-1 border-r border-border/20 h-full min-w-[140px]" />
              ))}
          </div>

          {/* Scroll Area */}
          <div 
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="relative flex overflow-x-auto pb-8 pt-5 px-2 gap-0 no-scrollbar snap-x cursor-grab active:cursor-grabbing select-none"
          >
            {hours.map((hour) => {
              const apps = normalizedData[hour] || [];
              const hasActivity = apps.length > 0;

              return (
                <div key={hour} className="flex-shrink-0 w-[140px] snap-start flex flex-col items-center px-1.5 relative z-10">
                  {/* Time Label */}
                  <div className="mb-4 flex flex-col items-center">
                    <span className={cn(
                      "text-xs font-semibold tracking-wide transition-all",
                      hasActivity ? "text-foreground" : "text-muted-foreground/60"
                    )}>
                      {hour}:00
                    </span>
                    {hasActivity && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />}
                  </div>

                  {/* Capsule Container */}
                  <div className="w-full space-y-1.5 min-h-[280px] flex flex-col justify-start">
                    {apps.map((app: any, idx: number) => {
                      const appName = app.name || 'Unknown';
                      let meta = getAppMeta(appName);
                      if (app.isBreak) {
                        meta = {
                          bg: 'bg-amber-500 dark:bg-amber-600',
                          domain: '',
                          cleanName: 'Break',
                          icon: null
                        };
                      }
                      const heightFactor = Math.max(app.totalSeconds / 3600, 0.18); // Minimum size for visibility
                      
                      return (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ delay: idx * 0.07, type: 'spring', stiffness: 400, damping: 15 }}
                              style={{ height: `${heightFactor * 250}px` }}
                              className={cn(
                                "w-full rounded-lg flex items-center px-2.5 gap-2.5 cursor-pointer relative group/capsule overflow-hidden shadow-sm border transition-all active:scale-95",
                                meta.bg, // App-specific color
                                "border-white/20"
                              )}
                            >
                               <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10 pointer-events-none" />
                               
                               <div className="size-5 rounded-md bg-black/20 flex items-center justify-center overflow-hidden shrink-0">
                                  {app.isBreak ? (
                                    <Coffee className="size-3.5 text-white/90" />
                                  ) : meta.icon ? (
                                    <img src={meta.icon} className="size-3.5 object-contain" alt={`${meta.cleanName} icon`} />
                                  ) : (
                                    <Monitor className="size-3 text-white/60" />
                                  )}
                               </div>
 
                               <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-bold text-white truncate leading-tight">
                                    {meta.cleanName}
                                  </span>
                                  <span className="text-[8px] font-medium text-white/80">
                                    {formatTime(app.totalSeconds)}
                                  </span>
                               </div>
                            </motion.div>
                          </TooltipTrigger>
                           <TooltipContent 
                             side="top" 
                             collisionPadding={10}
                             className="p-3 rounded-xl shadow-xl space-y-2.5 min-w-[170px] z-[100] border bg-popover text-popover-foreground"
                           >
                              <div className="flex items-center gap-2.5 border-b border-border pb-2">
                                 <div className={cn("size-2.5 rounded-full border", meta.bg)} />
                                 <span className="text-xs font-bold">{meta.cleanName}</span>
                              </div>
                              {app.isBreak ? (
                                <div className="space-y-1">
                                  <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                                  <p className="text-xs font-black text-amber-500 uppercase">On Rest Break</p>
                                  <div className="pt-2 border-t border-border mt-2">
                                    <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Duration</p>
                                    <p className="text-sm font-black">{formatTime(app.totalSeconds)}</p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                     <div className="space-y-0.5">
                                         <p className="text-[8px] font-semibold text-muted-foreground">Time Spent</p>
                                         <p className="text-sm font-bold">{formatTime(app.totalSeconds)}</p>
                                     </div>
                                     <div className="space-y-0.5">
                                         <p className="text-[8px] font-semibold text-muted-foreground">Productivity</p>
                                         <p className={cn("text-sm font-bold", app.totalSeconds > 0 && (app.activeSeconds/app.totalSeconds) > 0.7 ? 'text-emerald-500' : 'text-popover-foreground')}>
                                             {app.totalSeconds > 0 ? Math.round((app.activeSeconds/app.totalSeconds)*100) : 0}%
                                         </p>
                                     </div>
                                     <div className="space-y-0.5">
                                         <p className="text-[8px] font-semibold text-muted-foreground">Keys</p>
                                         <p className="text-sm font-bold flex items-center gap-1.5">
                                             <Keyboard size={11} /> {app.keystrokes || 0}
                                         </p>
                                     </div>
                                     <div className="space-y-0.5">
                                         <p className="text-[8px] font-semibold text-muted-foreground">Clicks</p>
                                         <p className="text-sm font-bold flex items-center gap-1.5">
                                             <MousePointer2 size={11} /> {app.mouseClicks || 0}
                                         </p>
                                     </div>
                                  </div>

                                  {/* Detailed Window Titles */}
                                  {app.details && Object.keys(app.details).length > 0 && (
                                     <div className="pt-2.5 border-t border-border space-y-1.5">
                                         <p className="text-[8px] font-semibold text-muted-foreground">Focused On</p>
                                         <div className="space-y-1.5">
                                             {Object.entries(app.details)
                                                 .sort(([, a], [, b]) => (b as number) - (a as number))
                                                 .slice(0, 4)
                                                 .map(([title, seconds]) => (
                                                     <div key={title} className="flex items-center justify-between gap-3 min-w-0">
                                                         <span className="text-[10px] font-medium text-foreground/80 truncate flex-1 leading-tight">
                                                             {title}
                                                         </span>
                                                         <span className="text-[9px] font-bold text-primary shrink-0">
                                                             {Math.round((seconds as number) / 60)}m
                                                         </span>
                                                     </div>
                                                 ))}
                                         </div>
                                     </div>
                                  )}
                                </>
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
