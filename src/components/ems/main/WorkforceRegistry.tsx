'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserAvatar, isEmployeeOnline } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";

export const WorkforceRegistry = ({
  employees = [],
}: {
  employees?: any[];
}) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const items = employees.slice(0, visibleCount);
  const hasMore = visibleCount < employees.length;

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5);
      setLoading(false);
    }, 800);
  };

  const parseShiftDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    if (ts instanceof Date) return ts;
    if (typeof ts === "string") {
      const parsed = new Date(ts);
      return isValid(parsed) ? parsed : null;
    }
    return null;
  };

  const getShiftStatus = (employee: any) => {
    const now = new Date();
    // Use the first shift of the day from dailyShifts if available (provided by useTeam)
    const actualShift = employee.dailyShifts?.[0] || employee.workShifts?.[0];
    const isOnline = isEmployeeOnline(employee);

    const scheduledStartTimeStr = employee.trackingSettings?.shiftDefaults?.startTime;
    const scheduledEndTimeStr = employee.trackingSettings?.shiftDefaults?.endTime;
    const hasSchedule = scheduledStartTimeStr && scheduledEndTimeStr;

    const actualStartTime = actualShift ? parseShiftDate(actualShift.startTime) : null;
    const actualEndTime = actualShift ? parseShiftDate(actualShift.endTime) : null;

    const todayStr = actualShift ? format(actualStartTime!, "yyyy-MM-dd") : format(now, "yyyy-MM-dd");

    const scheduledStartTime = hasSchedule ? parse(`${todayStr} ${scheduledStartTimeStr}`, "yyyy-MM-dd HH:mm", new Date()) : null;
    const scheduledEndTime = hasSchedule ? parse(`${todayStr} ${scheduledEndTimeStr}`, "yyyy-MM-dd HH:mm", new Date()) : null;

    const formatDuration = (ms: number) => {
      if (ms < 0) ms = 0;
      const totalMinutes = Math.floor(ms / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h`;
      return `${minutes}m`;
    };
    
    // This part of the function determines the textual status for display,
    // while the `isOnline` boolean (the source of truth) controls the green/grey dot.

    if (isOnline) {
      if (!actualStartTime) {
        return { details: "Awaiting first data...", actualStartTime: null, isOnline };
      }
      if (scheduledEndTime && isValid(scheduledEndTime) && now > scheduledEndTime) {
        const overtimeMs = now.getTime() - scheduledEndTime.getTime();
        return { details: `Overtime: ${formatDuration(overtimeMs)}`, actualStartTime, isOnline };
      }
      if (scheduledStartTime && isValid(scheduledStartTime)) {
        if (actualStartTime > scheduledStartTime) {
          const latenessMs = actualStartTime.getTime() - scheduledStartTime.getTime();
          return { details: `Started ${formatDuration(latenessMs)} late`, actualStartTime, isOnline };
        } else if (actualStartTime.getTime() < scheduledStartTime.getTime() - 60000) { // More than 1 minute early
          const earlyMs = scheduledStartTime.getTime() - actualStartTime.getTime();
          return { details: `Started ${formatDuration(earlyMs)} early`, actualStartTime, isOnline };
        }
      }
      return { details: "Not a single minute late", actualStartTime, isOnline };
    }

    // Fallback for an offline status based on our authoritative `isOnline` check
    if (actualEndTime) {
      if (scheduledEndTime && isValid(scheduledEndTime) && actualEndTime > scheduledEndTime) {
        const overtimeMs = actualEndTime.getTime() - scheduledEndTime.getTime();
        return { details: `Worked ${formatDuration(overtimeMs)} of overtime.`, actualStartTime, isOnline };
      }
      return { details: `Shift ended at ${format(actualEndTime, 'hh:mm a')}`, actualStartTime, isOnline };
    }

    if (actualStartTime) {
      return { details: "Session ended", actualStartTime, isOnline };
    }
    
    return {
      details: hasSchedule ? `Scheduled: ${scheduledStartTimeStr}-${scheduledEndTimeStr}` : "No active shift.",
      actualStartTime: null,
      isOnline
    };
  };

  const formatTimeToAmPm = (timeString: string) => {
    if (!timeString) return "";
    try {
      const date = parse(timeString, 'HH:mm', new Date());
      return isValid(date) ? format(date, 'hh:mm a') : timeString;
    } catch (error) {
      return timeString;
    }
  };

  const SkeletonRow = () => (
    <div className="w-full h-24 bg-card/50 border border-border rounded-[2rem] animate-pulse mb-4" />
  );

  return (
    <div className="mt-24 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter uppercase leading-none">
            Team Directory
          </h2>
          <p className="text-gray-400 mt-2 text-[10px] font-black font-poppins uppercase tracking-[0.25em] italic">
            Personnel registry and real-time status audit
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center px-4 py-2 rounded-2xl bg-secondary/50 border border-border">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">
              Active Members:
            </span>
            <span className="text-sm font-black text-primary">
              {employees.length}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {employees.length === 0
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          : items.map((emp, i) => {
              const { isOnline, ...shiftStatus } = getShiftStatus(emp);
              const hasShiftDefaults = emp.trackingSettings?.shiftDefaults?.startTime;

              return (
                <motion.div
                  key={`${emp.id}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 5) * 0.05 }}
                  onClick={() => router.push(`/ems/team/${emp.id}`)}
                  className="group relative bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/5 rounded-[2rem] p-4 md:p-6 cursor-pointer shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-500 overflow-hidden"
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    {/* Identity Cluster */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="size-12 md:size-14 rounded-2xl overflow-hidden relative z-10 border-2 border-background shadow-lg transition-transform duration-700 group-hover:scale-110 bg-muted/20">
                          <img
                            src={getUserAvatar(emp)}
                            className="w-full h-full object-cover"
                            alt={emp.name}
                          />
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card z-20 ${isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-400"}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-lg tracking-tighter uppercase leading-none mb-1.5 group-hover:text-primary transition-colors whitespace-nowrap">
                          {emp.name}
                        </h4>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest whitespace-nowrap">
                            {emp.role || "Staff Member"}
                          </span>
                          <span className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Timings Cluster */}
                    <div className="flex flex-1 items-center gap-8 px-2 md:px-0">
                        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                <Clock size={10} />
                                <span>Today's Status</span>
                            </div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-none truncate group-hover:translate-x-1 transition-transform">
                                {shiftStatus.details}
                            </p>
                        </div>

                        <div className="hidden lg:flex flex-col items-end gap-1.5 w-48">
                           {hasShiftDefaults ? (
                             <>
                              <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest justify-end">
                                <Clock size={10} />
                                <span>Shift Timings</span>
                              </div>
                              <div className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 tracking-tighter text-right">
                                <p>Scheduled: {formatTimeToAmPm(emp.trackingSettings.shiftDefaults.startTime)} - {formatTimeToAmPm(emp.trackingSettings.shiftDefaults.endTime)}</p>
                                {shiftStatus.actualStartTime ? (
                                  <p className='text-emerald-500'>Started: {format(shiftStatus.actualStartTime, 'hh:mm a')}</p>
                                ) : <p className='opacity-50'>Started: (Pending)</p>}
                              </div>
                             </>
                           ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push('/ems/shifts');
                                }}
                                className="px-4 py-3 rounded-xl bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase hover:bg-blue-500/20 transition-all active:scale-95"
                            >
                                Set Default Shift
                            </button>
                           )}
                        </div>
                    </div>

                    {/* Action Cluster */}
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-border/50">
                      <div className="flex items-center">
                        <div className="flex space-x-0.5 items-end h-4 mr-3">
                          {[0.4, 0.7, 0.3, 0.9, 0.5].map((h, j) => (
                            <motion.div
                              key={j}
                              animate={
                                isOnline
                                  ? {
                                      height: [
                                        `${h * 100}%`,
                                        `${(1 - h) * 100}%`,
                                        `${h * 100}%`,
                                      ],
                                    }
                                  : { height: "20%" }
                              }
                              transition={{
                                repeat: Infinity,
                                duration: 1 + h,
                                ease: "easeInOut",
                              }}
                              className={`w-0.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"}`}
                            />
                          ))}
                        </div>
                        <p
                          className={`text-[10px] font-black uppercase tracking-[0.2em] ${isOnline ? "text-emerald-500" : "text-gray-400"}`}
                        >
                          {isOnline ? "Online" : "Offline"}
                        </p>
                      </div>

                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <ChevronRight
                          size={20}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12 pb-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadMore();
            }}
            disabled={loading}
            className="px-12 py-4 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-xl text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-500 hover:border-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Syncing Directory..." : "Load Additional Personnel"}
          </button>
        </div>
      )}
    </div>
  );
};