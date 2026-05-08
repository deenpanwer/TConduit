"use client";

import React from "react";
import { 
  Users, Clock, CalendarDays, Activity, 
  ChevronRight, Search, Filter, ArrowUpRight,
  UserCheck, Timer, Coffee, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAttendance } from "@/hooks/use-attendance";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AttendanceOverviewPage() {
  const { todayLogs, loading, holidays } = useAttendance();

  // Calculate Aggregates
  const totalStaff = todayLogs.length;
  const activeNow = todayLogs.filter(l => l.status === 'online').length;
  const attendanceRate = totalStaff > 0 ? Math.round((activeNow / totalStaff) * 100) : 0;
  
  const totalManHours = todayLogs.reduce((acc, curr) => acc + curr.totalHours, 0).toFixed(1);
  const totalActiveTime = todayLogs.reduce((acc, curr) => acc + curr.activeTime, 0).toFixed(1);
  
  const onLeaveCount = holidays.filter((h: any) => {
    try {
      const today = new Date();
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      return today >= start && today <= end;
    } catch (e) {
      return false;
    }
  }).length;

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-[2.5rem] bg-secondary/50" />
          ))}
        </div>
        <div className="h-[500px] rounded-[2.5rem] bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-10">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Command Center</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-60">
              Live Workforce Intelligence • {format(new Date(), "EEEE, MMMM do")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Live System Sync</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Attendance" 
            value={`${attendanceRate}%`} 
            subtitle={`${activeNow} of ${totalStaff} Present`}
            icon={Users}
            color="emerald"
          />
          <KPICard 
            title="Active Time" 
            value={`${totalActiveTime}h`} 
            subtitle="Combined Net Hours"
            icon={Timer}
            color="blue"
          />
          <KPICard 
            title="Break Total" 
            value={`${(Number(totalManHours) - Number(totalActiveTime)).toFixed(1)}h`} 
            subtitle="Idle/Break Overhead"
            icon={Coffee}
            color="orange"
          />
          <KPICard 
            title="On Leave" 
            value={String(onLeaveCount || 0)} 
            subtitle="Approved Absences"
            icon={CalendarDays}
            color="rose"
          />
        </div>

        {/* Live Ledger Grid */}
        <Card className="border-border/50 shadow-sm rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm border-t-4 border-t-emerald-500/50">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Today's Presence</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Real-time status of all organizational members</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                <Input placeholder="Search member..." className="pl-10 h-11 w-64 rounded-xl border-border/50 bg-secondary/20 font-bold focus-visible:ring-emerald-500/20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y border-border/50 bg-secondary/10">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scheduled Shift</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clock In</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clock Out</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Break</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Active</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Total</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {todayLogs.map((log) => (
                    <tr key={log.userId} className="hover:bg-secondary/10 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-secondary/50 overflow-hidden border border-border/50 shrink-0">
                            {log.avatar ? (
                              <img src={log.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-black text-xs uppercase text-muted-foreground">
                                {log.userName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight">{log.userName}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Member ID: #{log.userId.slice(-4)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge variant="outline" className="rounded-lg font-bold text-[10px] uppercase border-border/50 bg-secondary/20">
                          {log.shift}
                        </Badge>
                      </td>
                      <td className="p-6">
                        <span className={cn("text-xs font-black italic", log.clockIn ? "text-emerald-500" : "text-muted-foreground opacity-40")}>
                          {log.clockIn || "--:--"}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={cn("text-xs font-black italic", log.clockOut ? "text-rose-500" : "text-muted-foreground opacity-40")}>
                          {log.clockOut || "--:--"}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span className="text-xs font-bold text-orange-500/80">{log.breakTime}h</span>
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-black text-emerald-600">{log.activeTime}h</span>
                          <div className="w-12 h-1 rounded-full bg-emerald-500/10 mt-1 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (log.activeTime / 8) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="text-xs font-black opacity-60">{log.totalHours}h</span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-widest",
                             log.status === 'online' ? "text-emerald-500" : "text-muted-foreground opacity-60"
                           )}>
                             {log.status}
                           </span>
                           <div className={cn(
                             "size-2 rounded-full",
                             log.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-muted-foreground/30"
                           )} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorMap: any = {
    emerald: "border-l-emerald-500 text-emerald-600 bg-emerald-500/5",
    blue: "border-l-blue-500 text-blue-600 bg-blue-500/5",
    orange: "border-l-orange-500 text-orange-600 bg-orange-500/5",
    rose: "border-l-rose-500 text-rose-600 bg-rose-500/5"
  };

  return (
    <Card className={cn("border-border/50 shadow-sm rounded-[2rem] overflow-hidden border-l-4", colorMap[color])}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{title}</p>
          <p className="text-3xl font-black tracking-tighter">{value}</p>
          <p className="text-[10px] font-bold opacity-60">{subtitle}</p>
        </div>
        <div className="size-12 rounded-2xl bg-background/50 flex items-center justify-center shadow-inner">
          <Icon className="size-6 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
}
