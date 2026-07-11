'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  Clock,
  Activity,
  Search,
  Filter,
  Timer,
  Coffee,
  Zap,
  MoreHorizontal,
  Download,
  FileText,
  Calendar as CalendarIcon,
  ArrowUpDown,
  ImageIcon,
  MousePointer2,
  Move,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAttendance, AttendanceLog } from '@/hooks/use-attendance';
import { useTeam } from '@/hooks/use-team';
import { cn, getUserAvatar } from '@/lib/utils';
import { format, parseISO, parse } from 'date-fns';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { WorkAuditor } from '@/components/attendance/WorkAuditor';
import { AttendanceExportModal } from '@/components/attendance/AttendanceExportModal';

export default function AttendanceOverviewPage() {
  const { todayLogs, loading, holidays, fetchForDate, offDays } = useAttendance();
  const { selectedDate, setSelectedDate } = useTeam();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<{
    employees?: string[];
    format?: 'csv' | 'xlsx';
  } | null>(null);

  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Auditor Modal State
  const [auditorUser, setAuditorUser] = useState<{
    id: string;
    name: string;
    date: string;
    tab?: 'entries' | 'screenshots';
  } | null>(null);

  // Sync date changes to hook
  React.useEffect(() => {
    fetchForDate(format(selectedDate, 'yyyy-MM-dd'));
  }, [selectedDate, fetchForDate]);

  // Helper to format 24h shift to AM/PM
  const formatShiftTime = (shiftStr: string) => {
    if (!shiftStr || shiftStr === 'Flexible' || shiftStr === 'Not Set')
      return shiftStr;
    try {
      const parts = shiftStr.split(' - ');
      if (parts.length !== 2) return shiftStr;

      const formatTime = (t: string) => {
        const timeToParse = t.trim().substring(0, 5);
        const parsed = parse(timeToParse, 'HH:mm', new Date());
        return format(parsed, 'hh:mm a');
      };

      return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
    } catch (e) {
      return shiftStr;
    }
  };

  // Helper for single row export
  const exportRow = (log: AttendanceLog, formatType: 'csv') => {
    const exportData = [
      {
        Member: log.userName,
        Date: log.date,
        Shift: log.shift,
        'Clock In': log.clockIn
          ? format(parseISO(log.clockIn), 'hh:mm:ss a')
          : '--:--',
        'Clock Out': log.clockOut
          ? format(parseISO(log.clockOut), 'hh:mm:ss a')
          : '--:--',
        Late: log.late,
        'Extra Worked': log.extraWorked,
        'Break Time (h)': log.breakTime,
        'Active Time (h)': log.activeTime,
        'Idle Time (h)': log.idleTime,
        Keystrokes: log.keystrokes,
        'Mouse Clicks': log.mouseClicks,
        'Assigned Tasks': log.assignedTasksCount,
        'Total Hours (h)': log.totalHours,
      },
    ];

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${log.userName.replace(
      /\s+/g,
      '_'
    )}_${log.date}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${formatType.toUpperCase()} for ${log.userName}`);
  };

  // Process Logs (Filter & Sort)
  const processedLogs = useMemo(() => {
    let result = [...todayLogs];

    // Search
    if (searchTerm) {
      result = result.filter(l =>
        l.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.userName.localeCompare(b.userName);
      if (sortBy === 'active') return b.activeTime - a.activeTime;
      if (sortBy === 'idle') return b.breakTime - a.breakTime;
      if (sortBy === 'effort')
        return b.keystrokes + b.mouseClicks - (a.keystrokes + a.mouseClicks);
      return 0;
    });

    return result;
  }, [todayLogs, searchTerm, sortBy]);

  // Aggregates based on processed logs
  const totalStaff = processedLogs.length;
  // Count as present if they are online OR if they have recorded active time today
  const activeNow = processedLogs.filter(
    l => l.status === 'online' || l.activeTime > 0
  ).length;
  const attendanceRate =
    totalStaff > 0 ? Math.round((activeNow / totalStaff) * 100) : 0;
  const totalActiveTime = processedLogs
    .reduce((acc, curr) => acc + curr.activeTime, 0)
    .toFixed(2);

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

  // Helper to get fallback times from shift string
  const getShiftFallback = (shiftStr: string, type: 'start' | 'end') => {
    if (!shiftStr || shiftStr === 'Flexible' || shiftStr === 'Not Set')
      return null;
    const parts = shiftStr.split(' - ');
    if (parts.length !== 2) return null;
    return type === 'start' ? parts[0] : parts[1];
  };

  if (loading) {
    return (
      <div className="p-4 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-[2rem] bg-secondary/50" />
          ))}
        </div>
        <div className="h-[500px] rounded-[2.5rem] bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-auto md:h-full bg-background md:overflow-hidden overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                Attendance Overview
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-60">
                Workforce activity for{' '}
                {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
          </div>

          {/* Search and Controls Bar - Sticky horizontally */}
          <div className="sticky left-0 flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            <div className="relative group w-full sm:max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
              <Input
                placeholder="Search employee name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-border/50 bg-card/50 font-bold focus-visible:ring-emerald-500/20 w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-border/50 bg-card font-black uppercase tracking-widest text-[10px] gap-2 px-6 w-full sm:w-auto justify-center"
                  >
                    <CalendarIcon size={14} className="text-emerald-500 shrink-0" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-[2rem] overflow-hidden border-border/50 shadow-2xl"
                  align="end"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={date => date && setSelectedDate(date)}
                    initialFocus
                    modifiers={{
                      offDay: (date: Date) =>
                        (offDays as string[]).includes(format(date, 'EEEE')),
                    }}
                    modifiersClassNames={{
                      offDay: 'text-rose-500 font-black',
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 w-full sm:w-44 rounded-2xl border-border/50 bg-card font-black uppercase tracking-widest text-[10px] px-6 justify-center">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown size={14} className="text-emerald-500 shrink-0" />
                    <SelectValue placeholder="Sort By" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50">
                  <SelectItem
                    value="name"
                    className="font-bold text-[10px] uppercase"
                  >
                    Alpha (Name)
                  </SelectItem>
                  <SelectItem
                    value="active"
                    className="font-bold text-[10px] uppercase"
                  >
                    Most Active
                  </SelectItem>
                  <SelectItem
                    value="idle"
                    className="font-bold text-[10px] uppercase"
                  >
                    Most Idle
                  </SelectItem>
                  <SelectItem
                    value="effort"
                    className="font-bold text-[10px] uppercase"
                  >
                    High Effort
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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
              subtitle="Filtered Net Hours"
              icon={Timer}
              color="blue"
            />
            <KPICard
              title="Break Time"
              value={`${processedLogs
                .reduce((acc, curr) => acc + curr.breakTime, 0)
                .toFixed(2)}h`}
              subtitle="Recorded Breaks"
              icon={Coffee}
              color="orange"
            />
            <KPICard
              title="Idle Time"
              value={`${processedLogs
                .reduce((acc, curr) => acc + (curr.idleTime || 0), 0)
                .toFixed(2)}h`}
              subtitle="Recorded Inactivity"
              icon={Clock}
              color="rose"
            />
          </div>

          {/* Table Container */}
          <Card className="border-border/50 shadow-sm rounded-[2.5rem] bg-card/80 border-t-4 border-t-emerald-500/50 md:flex-1 flex flex-col min-h-[300px] md:min-h-0 md:overflow-hidden overflow-visible shrink-0 md:shrink">
            <div className="p-6 flex flex-row items-center justify-between border-b border-border/50 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Attendance Logs
              </h3>
              <Button
                onClick={() => {
                  setExportTarget({
                    employees: processedLogs.map(p => p.userId),
                    format: 'xlsx',
                  });
                  setIsExportModalOpen(true);
                }}
                variant="outline"
                className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 gap-2 px-6 border-border/50"
              >
                <Download size={14} />
                Export Today
              </Button>
            </div>
            <CardContent className="p-0 md:flex-1 md:overflow-auto overflow-x-auto overflow-y-visible custom-scrollbar min-h-0 relative">
              <div className="overflow-visible">
                <table className="w-full text-left border-collapse min-w-[1600px]">
                  <thead>
                    <tr className="border-y border-border/50 bg-secondary/5">
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">
                        Member
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">
                        Scheduled Shift
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">
                        Clock In
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">
                        Clock Out
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Late
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Extra Worked
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Break
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Active
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Idle Time
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Activity
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Screenshots
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Assigned Tasks
                      </th>
                      <th className="sticky top-0 z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">
                        Total
                      </th>
                      <th className="sticky top-0 z-20 p-6 bg-background/95 backdrop-blur-md shadow-sm"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {processedLogs.map(log => {
                      const shiftStart = getShiftFallback(log.shift, 'start');
                      const shiftEnd = getShiftFallback(log.shift, 'end');

                      return (
                        <tr
                          key={log.userId}
                          className="hover:bg-secondary/10 transition-colors group"
                        >
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-2xl bg-secondary/50 overflow-hidden border border-border/50 shrink-0 shadow-sm">
                                <img
                                  src={getUserAvatar({
                                    id: log.userId,
                                    photoUrl: log.avatar,
                                    email: log.userName,
                                  })}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tight">
                                  {log.userName}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <Badge
                              variant="outline"
                              className="rounded-lg font-bold text-[10px] uppercase border-border/50 bg-secondary/20"
                            >
                              {formatShiftTime(log.shift)}
                            </Badge>
                          </td>
                          <td className="p-6">
                            <span
                              className={cn(
                                'text-xs font-black italic',
                                log.clockIn || (log.activeTime > 0 && shiftStart)
                                  ? 'text-foreground'
                                  : 'text-muted-foreground opacity-40'
                              )}
                            >
                              {log.clockIn
                                ? format(parseISO(log.clockIn), 'hh:mm:ss a')
                                : log.activeTime > 0 && shiftStart
                                ? shiftStart
                                : '--:--'}
                            </span>
                          </td>
                          <td className="p-6">
                            {log.status === 'online' ? (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse font-black text-[9px] uppercase tracking-tighter"
                              >
                                Still Working
                              </Badge>
                            ) : log.status === 'on-break' ? (
                              <Badge
                                variant="secondary"
                                className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black text-[9px] uppercase tracking-tighter"
                              >
                                On Break
                              </Badge>
                            ) : (
                              <span
                                className={cn(
                                  'text-xs font-black italic',
                                  log.clockOut ||
                                    (log.activeTime > 0 && shiftEnd)
                                    ? 'text-rose-500'
                                    : 'text-muted-foreground opacity-40'
                                )}
                              >
                                {log.clockOut
                                  ? format(parseISO(log.clockOut), 'hh:mm:ss a')
                                  : log.activeTime > 0 && shiftEnd
                                  ? shiftEnd
                                  : '--:--'}
                              </span>
                            )}
                          </td>
                          <td className="p-6 text-center">
                            <span
                              className={cn(
                                'text-xs font-bold',
                                log.late !== '0m'
                                  ? 'text-rose-500'
                                  : 'text-muted-foreground opacity-40'
                              )}
                            >
                              {log.late}
                            </span>
                          </td>
                          <td className="p-6 text-center">
                            <span
                              className={cn(
                                'text-xs font-bold',
                                log.extraWorked !== '0m'
                                  ? 'text-emerald-500'
                                  : 'text-muted-foreground opacity-40'
                              )}
                            >
                              {log.extraWorked}
                            </span>
                          </td>
                          <td className="p-6 text-center">
                            <span className="text-xs font-bold text-orange-500/80">
                              {log.breakTime}h
                            </span>
                          </td>
                          <td className="p-6 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-sm font-black text-emerald-600">
                                {log.activeTime}h
                              </span>
                              <div className="w-12 h-1 rounded-full bg-emerald-500/10 mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (log.activeTime / 8) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <span className="text-xs font-bold text-rose-500/80">
                              {log.idleTime}h
                            </span>
                          </td>
                          <td className="p-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Zap className="size-3 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                  Keystrokes:{' '}
                                  <span className="text-foreground">
                                    {log.keystrokes.toLocaleString()}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="size-3 text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                  Clicks:{' '}
                                  <span className="text-foreground">
                                    {log.mouseClicks.toLocaleString()}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Move className="size-3 text-purple-500" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                  Distance:{' '}
                                  <span className="text-foreground">
                                    {log.mouseDistance.toLocaleString()}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MousePointer2 className="size-3 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                  Scrolls:{' '}
                                  <span className="text-foreground">
                                    {log.mouseScrolls.toLocaleString()}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setAuditorUser({
                                  id: log.userId,
                                  name: log.userName,
                                  date: log.date,
                                  tab: 'screenshots',
                                })
                              }
                              className="rounded-xl font-black uppercase tracking-widest text-[8px] h-8 gap-2 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                            >
                              <ImageIcon size={10} />
                              View Visuals
                            </Button>
                          </td>
                          <td className="p-6 text-center">
                            <Badge
                              variant="outline"
                              className="rounded-lg font-bold text-[10px] border-border/50"
                            >
                              {log.assignedTasksCount}
                            </Badge>
                          </td>
                          <td className="p-6 text-center">
                            <span className="text-xs font-black opacity-60">
                              {log.totalHours}h
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                                  >
                                    <MoreHorizontal size={18} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-2xl border-border/50 shadow-2xl p-2 min-w-[200px]"
                                >
                                  <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-50 px-3 py-2">
                                    Export Data
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setExportTarget({
                                        employees: [log.userId],
                                        format: 'csv',
                                      });
                                      setIsExportModalOpen(true);
                                    }}
                                    className="rounded-xl font-bold gap-2 p-3 cursor-pointer"
                                  >
                                    <FileText
                                      size={14}
                                      className="text-blue-500"
                                    />
                                    <span>Export as CSV</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setExportTarget({
                                        employees: [log.userId],
                                        format: 'xlsx',
                                      });
                                      setIsExportModalOpen(true);
                                    }}
                                    className="rounded-xl font-bold gap-2 p-3 cursor-pointer"
                                  >
                                    <Download
                                      size={14}
                                      className="text-emerald-500"
                                    />
                                    <span>Export as Excel</span>
                                  </DropdownMenuItem>
                                  <div className="h-px bg-border/50 my-1" />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setAuditorUser({
                                        id: log.userId,
                                        name: log.userName,
                                        date: log.date,
                                        tab: 'entries',
                                      })
                                    }
                                    className="rounded-xl font-bold gap-2 p-3 cursor-pointer"
                                  >
                                    <Search
                                      size={14}
                                      className="text-orange-500"
                                    />
                                    <span>Audit his work</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <div
                                className={cn(
                                  'size-2 rounded-full',
                                  log.status === 'online'
                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse'
                                    : log.status === 'on-break'
                                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                    : 'bg-muted-foreground/30'
                                )}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

      {/* Export Modal */}
      <AttendanceExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialSelectedEmployees={exportTarget?.employees}
        initialFormat={exportTarget?.format}
        allEmployees={processedLogs.map(p => ({ id: p.userId, name: p.userName }))}
      />

      {auditorUser && (
        <WorkAuditor
          isOpen={!!auditorUser}
          userId={auditorUser.id}
          userName={auditorUser.name}
          date={auditorUser.date}
          initialTab={auditorUser.tab}
          onClose={() => setAuditorUser(null)}
        />
      )}
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorMap: any = {
    emerald: 'border-l-emerald-500 text-emerald-600 bg-emerald-500/5',
    blue: 'border-l-blue-500 text-blue-600 bg-blue-500/5',
    orange: 'border-l-orange-500 text-orange-600 bg-orange-500/5',
    rose: 'border-l-rose-500 text-rose-600 bg-rose-500/5',
  };

  return (
    <Card
      className={cn(
        'border-border/50 shadow-sm rounded-[2rem] overflow-hidden border-l-4',
        colorMap[color]
      )}
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
            {title}
          </p>
          <p className="text-2xl font-black tracking-tighter">{value}</p>
          <p className="text-[9px] font-bold opacity-60">{subtitle}</p>
        </div>
        <div className="size-10 rounded-2xl bg-background/50 flex items-center justify-center shadow-inner">
          <Icon className="size-5 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
}
