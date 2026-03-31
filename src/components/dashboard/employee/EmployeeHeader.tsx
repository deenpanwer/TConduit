'use client';

import { ShieldCheck, Mail, Calendar, Clock, Zap, Target, Activity } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn, getUserAvatar } from "@/lib/utils";
import { HoverShimmer } from "../main/shared/Shimmer";

interface EmployeeHeaderProps {
  employee: any;
  totalHours?: string;
  topApp?: string;
  joinedDate?: Date | null;
}

const MetricBox = ({ icon: Icon, label, value }: any) => (
  <div className="flex flex-col p-6 rounded-[2rem] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
    <HoverShimmer />
    <div className="flex items-center space-x-3 mb-4 relative z-10">
      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400">{label}</span>
    </div>
    <div className="flex items-baseline relative z-10">
      <span className="text-3xl font-black font-poppins text-gray-900 dark:text-white leading-none tracking-tighter-custom truncate w-full">{value}</span>
    </div>
  </div>
);

export function EmployeeHeader({ employee, totalHours = "0.0", topApp = "---", joinedDate }: EmployeeHeaderProps) {
  const parseShiftDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    if (ts instanceof Date) return ts;
    if (typeof ts === 'string') {
        const parsed = new Date(ts);
        return isValid(parsed) ? parsed : null;
    }
    return null;
  };

  const isOnline = !!employee?.heartbeat?.isCurrentlyRunning;

  const officialJoinedDate = joinedDate || parseShiftDate(employee?.createdAt) || new Date(0);

  if (!employee) {
    return (
      <div className="bg-card border border-border rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl animate-pulse">
        <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-start lg:items-center">
          <div className="size-32 md:size-44 rounded-[3.5rem] bg-muted shrink-0" />
          <div className="flex-1 w-full space-y-8">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted rounded-full" />
              <div className="h-16 w-3/4 bg-muted rounded-2xl" />
              <div className="h-4 w-1/2 bg-muted rounded-full" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-[2rem]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 size-[500px] bg-primary/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-start lg:items-center">
        <div className="relative group shrink-0">
            <div className={cn(
              "absolute -inset-4 rounded-[4rem] blur-2xl opacity-20 transition-all duration-700",
              isOnline ? "bg-emerald-500 group-hover:opacity-40" : "bg-gray-500"
            )} />
            <div className="size-32 md:size-44 rounded-[3.5rem] bg-secondary border-2 border-primary/20 overflow-hidden shadow-2xl relative z-10 transition-transform group-hover:scale-105 duration-700">
                <img 
                    src={getUserAvatar(employee)} 
                    alt={employee?.name} 
                    className="w-full h-full object-cover"
                />
            </div>
            <div className={cn(
              "absolute -bottom-2 -right-2 size-10 rounded-2xl border-4 border-card flex items-center justify-center z-20 shadow-xl transition-all duration-500",
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
            )}>
                <Zap size={16} className="text-white fill-current" />
            </div>
        </div>

        <div className="flex-1 w-full space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <div className={cn("w-1.5 h-1.5 rounded-full mr-2", isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
                        <span className="text-[10px] font-black font-poppins text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            {isOnline ? "Currently Working" : "Offline"}
                        </span>
                    </div>
                    
                    <div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">{employee?.name || "Anonymous Member"}</h1>
                        <div className="flex flex-wrap gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2"><Activity size={14} className="text-primary" /> {employee?.role || "Team Member"}</span>
                            <span className="flex items-center gap-2"><Mail size={14} className="text-primary" /> {employee?.email}</span>
                            <span className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> Joined {officialJoinedDate.getTime() > 0 ? format(officialJoinedDate, 'dd MMMM yyyy') : '01 January 2026'}</span>
                            <span className="flex items-center gap-2 text-emerald-500/80"><ShieldCheck size={14} /> Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <MetricBox icon={Clock} label="Total Hours" value={`${totalHours}h`} />
                <MetricBox icon={Target} label="Top Application" value={topApp} />
            </div>
        </div>
      </div>
    </div>
  );
}
