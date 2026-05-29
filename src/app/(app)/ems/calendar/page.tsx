"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  TrendingUp,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { useCalendar, useDailyBreakdown } from "@/hooks/use-calendar"; // Import the new hook
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

const ShimmerSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn("relative overflow-hidden bg-muted/50 rounded-md", className)}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      animate={{ x: ["-100%", "100%"] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
    />
  </div>
);

interface AnalyzedApp {
  name: string;
  url: string;
  category: string;
  totalSeconds: number;
  details: { title: string; seconds: number; url?: string }[];
}

export default function CalendarPage() {
  const { user } = useAuth();
  const {
    employees,
    owner,
    loading: teamLoading,
    selectedDate,
    setSelectedDate: _setSelectedDate,
  } = useTeam();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Wrap setSelectedDate to handle sheet opening on mobile
  const setSelectedDate = (date: Date) => {
    _setSelectedDate(date);
    setIsSheetOpen(true);
  };

  // 1. Mobile Onboarding Tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenCalendarMobileTour");
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (!hasSeenTour && isMobile && !teamLoading) {
      const driverObj = driver({
        showProgress: true,
        steps: [
          { 
            element: ".calendar-grid-container", 
            popover: { 
              title: "Interactive Strategy", 
              description: "Tap any day with activity to slide up a deep-dive AI analysis of your team's output.",
              side: "bottom",
              align: "start"
            } 
          },
        ]
      });

      driverObj.drive();
      localStorage.setItem("hasSeenCalendarMobileTour", "true");
    }
  }, [teamLoading]);

  // Use the dedicated hook for monthly heatmap data
  const { monthlyMetrics, loadingMonth } = useCalendar(currentMonth);

  const [analyzedData, setAnalyzedData] = useState<AnalyzedApp[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Calendar Intervals
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 2. Prepare user list for breakdown (Entire Org: Employees + Owner)
  const allUsers = useMemo(() => {
    const list = [...employees];
    // Add owner if not already in list (deduplicate by ID if needed, though useTeam logic separates them)
    if (owner && !list.find(p => p.id === owner.id)) {
      list.push(owner);
    }
    return list;
  }, [employees, owner]);

  // 3. Use the new hook for daily breakdown
  const dayBreakdown = useDailyBreakdown(allUsers, selectedDate);

  // 4. Trigger AI Analysis when date changes
  useEffect(() => {
    const analyze = async () => {
      // Don't re-analyze if we already have data for this exact breakdown (optimization optional)
      // or if no activity
      if (!dayBreakdown.totalSeconds) {
        setAnalyzedData(null);
        return;
      }

      setAnalyzing(true);
      try {
        const res = await fetch("/api/calendar/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ liveBreakdown: dayBreakdown.rawBreakdown }),
        });
        const data = await res.json();
        if (data.apps) {
          setAnalyzedData(data.apps);
        }
      } catch (e) {
        console.error("Analysis failed", e);
      } finally {
        setAnalyzing(false);
      }
    };

    analyze();
  }, [dayBreakdown.totalSeconds, dayBreakdown.rawBreakdown]); // Depend on primitives/stable ref

  const getIntensityClass = (seconds: number) => {
    if (seconds === 0)
      return "bg-slate-100 dark:bg-slate-800 opacity-20";
    // Normalized for a TEAM day (e.g. 5 people * 8 hours = 40 hours max)
    if (seconds < 14400) return "bg-indigo-300"; // < 4hrs: Visible Light Indigo
    if (seconds < 36000) return "bg-indigo-400"; // < 10hrs: Medium Indigo
    if (seconds < 72000) return "bg-indigo-500"; // < 20hrs: Dark Indigo
    return "bg-indigo-600"; // 20hrs+: Solid Indigo
  };

  const formatHoursShort = (seconds: number) => {
    if (seconds === 0) return "";
    const h = seconds / 3600;
    return h < 0.1 ? "<0.1h" : `${h.toFixed(1)}h`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 relative">
        {/* Left: Monthly Strategic Grid */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 p-4 md:p-8 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="space-y-1">
              <h1 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {format(currentMonth, "MMMM yyyy")}
              </h1>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Strategic Capacity View
              </p>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 md:h-8 font-bold text-[10px] md:text-xs px-2 md:px-3"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col h-full calendar-grid-container">
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span
                  key={day}
                  className="text-center text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest"
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              {loadingMonth
                ? Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3">
                      <ShimmerSkeleton className="h-full w-full" />
                    </div>
                  ))
                : days.map((day, i) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const metrics = monthlyMetrics[dateKey];
                    const seconds = metrics?.totalSeconds || 0;
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                      <Tooltip key={i} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "relative group cursor-pointer p-1.5 md:p-3 transition-all h-full min-h-[60px] md:min-h-[100px] flex flex-col active:scale-[0.97] md:active:scale-100",
                              isCurrentMonth
                                ? "bg-white dark:bg-slate-900"
                                : "bg-slate-50 dark:bg-slate-950 opacity-40 text-slate-300",
                              isSelected &&
                                "ring-2 ring-inset ring-indigo-500 z-10 shadow-lg",
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <span
                                className={cn(
                                  "text-[10px] md:text-xs font-bold transition-colors",
                                  isSelected
                                    ? "text-indigo-600"
                                    : "text-slate-400",
                                  isToday(day) &&
                                    "text-indigo-600 font-black underline decoration-2 underline-offset-4",
                                )}
                              >
                                {format(day, "d")}
                              </span>
                            </div>

                            {/* Hours Label (Mobile Only) */}
                            {seconds > 0 && isCurrentMonth && (
                              <div className="flex-1 flex items-center justify-center lg:hidden">
                                <span className="text-[9px] font-black text-indigo-600/80">
                                  {formatHoursShort(seconds)}
                                </span>
                              </div>
                            )}

                            {seconds > 0 && isCurrentMonth && (
                              <div className="mt-auto flex flex-col gap-1 pb-1">
                                <div
                                  className={cn(
                                    "h-1 rounded-full transition-all duration-500",
                                    getIntensityClass(seconds),
                                  )}
                                  style={{
                                    width: `${Math.min(100, (seconds / 72000) * 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="text-xs font-bold hidden md:block"
                        >
                          {format(day, "MMM d")}: {formatDuration(seconds)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
            </div>
          </div>
        </motion.div>

        {/* Desktop Sidebar (Hidden on Mobile) */}
        <div className="hidden lg:flex w-[420px] border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-col overflow-hidden">
           <AnalysisContent 
             selectedDate={selectedDate} 
             teamLoading={teamLoading} 
             dayBreakdown={dayBreakdown} 
             analyzing={analyzing} 
             analyzedData={analyzedData}
             formatDuration={formatDuration}
           />
        </div>

        {/* Mobile Bottom Sheet (Visible on Mobile) */}
        <AnimatePresence>
          {isSheetOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800 rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] max-h-[70vh] flex flex-col"
            >
              {/* Handle */}
              <div 
                className="w-full flex justify-center py-4 shrink-0 cursor-pointer"
                onClick={() => setIsSheetOpen(false)}
              >
                <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              
              <div className="flex-1 overflow-y-auto pb-10">
                <AnalysisContent 
                  selectedDate={selectedDate} 
                  teamLoading={teamLoading} 
                  dayBreakdown={dayBreakdown} 
                  analyzing={analyzing} 
                  analyzedData={analyzedData}
                  formatDuration={formatDuration}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

/**
 * Extracted Daily Analysis Content to avoid duplication
 */
function AnalysisContent({ 
  selectedDate, 
  teamLoading, 
  dayBreakdown, 
  analyzing, 
  analyzedData,
  formatDuration
}: any) {
  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 overflow-y-auto custom-scrollbar">
      <div className="space-y-1">
        <h2 className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
          Daily Analysis
        </h2>
        <p className="text-lg md:text-xl font-bold text-indigo-600">
          {format(selectedDate, "EEEE, MMM do")}
        </p>
      </div>

      {teamLoading ? (
         <div className="space-y-8">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
             <div className="flex items-center justify-between">
               <ShimmerSkeleton className="h-5 w-5 rounded-full" />
               <ShimmerSkeleton className="h-3 w-24" />
             </div>
             <ShimmerSkeleton className="h-10 w-32" />
           </div>
           <div className="space-y-4">
              <ShimmerSkeleton className="h-4 w-32" />
              <ShimmerSkeleton className="h-12 w-full rounded-xl" />
              <ShimmerSkeleton className="h-12 w-full rounded-xl" />
              <ShimmerSkeleton className="h-12 w-full rounded-xl" />
           </div>
         </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Output
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatDuration(dayBreakdown.totalSeconds)}
            </div>
          </div>

          <Separator />

          {/* Top Employees Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" /> Top Contributors
            </h3>
            {dayBreakdown.employeesWorking.length > 0 ? (
              <div className="space-y-3">
                {dayBreakdown.employeesWorking.slice(0, 3).map((emp: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-200 overflow-hidden text-[10px] flex items-center justify-center font-bold text-slate-400">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-full h-full object-cover"
                          />
                        ) : emp.name[0]}
                      </div>
                      <span className="text-xs font-bold">{emp.name}</span>
                    </div>
                    <span className="text-xs font-mono font-black text-slate-500">
                      {formatDuration(emp.seconds)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No activity recorded for this day.
              </p>
            )}
          </div>

          <Separator />

          {/* AI Breakdown Section */}
          <div className="space-y-6 pb-12">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Activity
              Breakdown
            </h3>

            {analyzing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <ShimmerSkeleton className="size-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <ShimmerSkeleton className="h-4 w-3/4" />
                    <ShimmerSkeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ShimmerSkeleton className="size-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <ShimmerSkeleton className="h-4 w-3/4" />
                    <ShimmerSkeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ShimmerSkeleton className="size-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <ShimmerSkeleton className="h-4 w-3/4" />
                    <ShimmerSkeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ) : analyzedData ? (
              <div className="space-y-6">
                {analyzedData.map((app: any, i: number) => (
                  <div key={i} className="group">
                    <div className="flex items-start gap-4 mb-2">
                      <div className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 shadow-sm flex items-center justify-center shrink-0">
                        <img
                          src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${app.url}&size=128`}
                          alt={app.name}
                          className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/logo.svg"; // Fallback
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                            {app.name}
                          </h4>
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                            {formatDuration(app.totalSeconds)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(100, (app.totalSeconds / (dayBreakdown.totalSeconds || 1)) * 100)}%`,
                            }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="bg-indigo-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-details (Top 3) */}
                    <div className="pl-14 space-y-2 mt-2">
                      {app.details.slice(0, 3).map((d: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[10px] text-slate-500 group/item"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {d.url ? (
                              <img
                                src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${d.url}&size=64`}
                                alt="icon"
                                className="size-3.5 object-contain opacity-70 group-hover/item:opacity-100 transition-opacity"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="size-1 rounded-full bg-slate-300 shrink-0" />
                            )}
                            <span className="truncate max-w-[180px] group-hover/item:text-slate-700 dark:group-hover/item:text-slate-300 transition-colors">
                              {d.title}
                            </span>
                          </div>
                          <span className="font-mono opacity-50 shrink-0 ml-2">
                            {formatDuration(d.seconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 opacity-50">
                <Layers className="size-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-bold text-slate-400">
                  Select a day with activity to analyze
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
