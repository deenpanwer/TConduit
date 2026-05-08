"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, Download, Search, Filter, 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  User, Clock, ArrowUpDown, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useAttendance, AttendanceLog } from "@/hooks/use-attendance";
import { cn } from "@/lib/utils";
import { format, subMonths, startOfMonth, endOfMonth, setDate, addDays, isBefore, parseISO } from "date-fns";
import Papa from "papaparse";
import { toast } from "sonner";

export default function AttendanceLedgerPage() {
  const { getLogsForRange, loading, attendanceSettings } = useAttendance();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Default range: Current Payroll Cycle
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const startDay = parseInt(attendanceSettings?.payrollCycleStart || "1");
    
    let start = setDate(today, startDay);
    if (isBefore(today, start)) {
      start = subMonths(start, 1);
    }
    const end = addDays(start, 30); // Approximate cycle
    return { start, end };
  });

  const fetchLogs = async () => {
    setIsFetching(true);
    try {
      const data = await getLogsForRange(dateRange.start, dateRange.end);
      setLogs(data);
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("Failed to load historical data");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (attendanceSettings) {
      fetchLogs();
    }
  }, [dateRange, attendanceSettings]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredLogs.map(l => ({
      'Employee Name': l.userName,
      'Date': l.date,
      'Shift': l.shift,
      'Clock In': l.clockIn || "--:--",
      'Clock Out': l.clockOut || "--:--",
      'Total Hours': l.totalHours,
      'Active Time': l.activeTime,
      'Break Time': l.breakTime,
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_ledger_${format(dateRange.start, "yyyyMMdd")}_${format(dateRange.end, "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ledger exported successfully");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Attendance Ledger</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-60">
              Historical Compliance Tracking & Audit Logs
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/20 p-1.5 rounded-2xl border border-border/50 shadow-inner">
               <div className="flex items-center gap-2 px-3 border-r border-border/50">
                 <CalendarIcon size={14} className="text-muted-foreground" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cycle</span>
               </div>
               <div className="flex items-center gap-2 px-3">
                 <span className="text-xs font-black italic">{format(dateRange.start, "MMM dd")} - {format(dateRange.end, "MMM dd")}</span>
               </div>
            </div>
            <Button onClick={handleExport} size="lg" className="rounded-2xl font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 h-12 px-6 shadow-xl shadow-emerald-500/20">
              <Download className="mr-2" size={16} />
              Export Records
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Search by name or member ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm font-bold text-sm focus-visible:ring-emerald-500/20" 
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm px-6 font-bold">
              <div className="flex items-center gap-2">
                <Filter size={16} className="opacity-40" />
                <SelectValue placeholder="All Departments" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50">
              <SelectItem value="all" className="rounded-xl font-bold italic">All Departments</SelectItem>
              <SelectItem value="eng" className="rounded-xl font-bold italic">Engineering</SelectItem>
              <SelectItem value="hr" className="rounded-xl font-bold italic">Human Resources</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm px-6 font-bold">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} className="opacity-40" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50">
              <SelectItem value="all" className="rounded-xl font-bold italic">All Status</SelectItem>
              <SelectItem value="verified" className="rounded-xl font-bold italic text-emerald-500">Verified Only</SelectItem>
              <SelectItem value="flagged" className="rounded-xl font-bold italic text-rose-500">Flagged Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* The Master Grid */}
        <Card className="border-border/50 shadow-sm rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm border-l-4 border-l-emerald-500/50">
          <CardContent className="p-0">
            {isFetching || loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4 animate-pulse">
                <div className="size-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Aggregating Cloud Logs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-border/50 bg-secondary/10">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Employee</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shift Plan</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clock In</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clock Out</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Active</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Break</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Total</th>
                      <th className="p-6 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredLogs.map((log, idx) => (
                      <tr key={`${log.userId}-${log.date}`} className="hover:bg-secondary/10 transition-colors group">
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
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">ID: #{log.userId.slice(-4)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-bold uppercase tracking-widest">{format(parseISO(log.date), "MMM dd, yyyy")}</span>
                        </td>
                        <td className="p-6">
                          <Badge variant="outline" className="rounded-lg font-bold text-[9px] uppercase border-border/50 bg-secondary/10 opacity-70">
                            {log.shift}
                          </Badge>
                        </td>
                        <td className="p-6">
                          <span className={cn("text-xs font-black italic", log.clockIn ? "text-emerald-500" : "text-muted-foreground opacity-30")}>
                            {log.clockIn || "--:--"}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className={cn("text-xs font-black italic", log.clockOut ? "text-rose-500" : "text-muted-foreground opacity-30")}>
                            {log.clockOut || "--:--"}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <span className="text-sm font-black text-emerald-600">{log.activeTime}h</span>
                        </td>
                        <td className="p-6 text-center">
                          <span className="text-xs font-bold text-orange-500/70">{log.breakTime}h</span>
                        </td>
                        <td className="p-6 text-center">
                          <span className="text-xs font-black opacity-60">{log.totalHours}h</span>
                        </td>
                        <td className="p-6 text-right">
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all">
                            <MoreHorizontal size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredLogs.length === 0 && !isFetching && !loading && (
              <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-20 rounded-[2rem] bg-secondary/20 flex items-center justify-center text-muted-foreground/30">
                  <FileText size={40} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest">No Records Found</p>
                  <p className="text-xs font-bold text-muted-foreground opacity-60">Try adjusting your search filters or cycle range.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
