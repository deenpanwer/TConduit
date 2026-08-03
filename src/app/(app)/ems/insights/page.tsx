"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAnomalies } from "@/hooks/use-anomalies";
import { format, subDays, addDays } from "date-fns";
import { 
  ShieldCheck, AlertTriangle, Activity, LayoutGrid, Image as ImageIcon, 
  ChevronLeft, ChevronRight, Menu, Lock, Sparkles, Globe, Monitor,
  ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { HourlyScreenshotTagging } from "@/components/ems/insights/HourlyScreenshotTagging";
import { EmployeeAnomalyModal } from "@/components/ems/insights/EmployeeAnomalyModal";
import { EmployeeAnomalyReport } from "@/hooks/use-anomalies";
import { cn, getUserAvatar } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function InsightsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, loading: teamLoading, selectedDate, setSelectedDate } = useTeam();
  const { setIsMobileOpen } = useSidebar();

  // Active view tab: 'anomalies' | 'screenshots' | 'apps'
  const [activeTab, setActiveTab] = useState<'anomalies' | 'screenshots' | 'apps'>('anomalies');
  
  // Active employee selection for dropdown
  const [selectedEmpId, setSelectedEmpId] = useState<string>("all");

  // Selected anomaly report for deep-dive modal
  const [selectedAnomalyReport, setSelectedAnomalyReport] = useState<EmployeeAnomalyReport | null>(null);
  const [empAudits, setEmpAudits] = useState<Record<string, any>>({});
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});

  const toggleAppExpand = (appId: string) => {
    setExpandedApps(prev => ({ ...prev, [appId]: !prev[appId] }));
  };

  const isClientUser = userData?.role === "client" || userData?.isClient === true;
  const userRole = (userData?.role || '').toLowerCase();
  const isManagementRole = !isClientUser && (
    ['founder', 'owner', 'manager', 'admin', 'hr', 'ops'].includes(userRole) || 
    !!userData?.ownedOrgId
  );

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const orgId = userData?.orgId || userData?.ownedOrgId;
  const [orgOffDays, setOrgOffDays] = useState<any[]>([]);
  const [orgWorkDays, setOrgWorkDays] = useState<any[]>([]);

  // Subscribe to organization settings for offDays
  useEffect(() => {
    if (!orgId) return;
    const orgRef = doc(db, "organizations", orgId);
    const unsub = onSnapshot(orgRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setOrgOffDays(data.offDays || data.offdays || []);
        setOrgWorkDays(data.workDays || data.workdays || []);
      }
    });
    return () => unsub();
  }, [orgId]);

  // Determine if selectedDate is an Organization Off-Day
  const isOffDay = useMemo(() => {
    const dayName = format(selectedDate, "EEEE").toLowerCase();
    const dayShort = format(selectedDate, "EEE").toLowerCase();
    const dayNum = selectedDate.getDay();

    if (orgOffDays && Array.isArray(orgOffDays) && orgOffDays.length > 0) {
      return orgOffDays.some((d: any) => {
        if (d === null || d === undefined) return false;
        if (typeof d === "number") return d === dayNum;
        const str = typeof d === "object" ? String(d.id || d.label || d.name || "") : String(d);
        const lower = str.toLowerCase();
        return lower === dayName || lower === dayShort || lower === String(dayNum);
      });
    }

    if (orgWorkDays && Array.isArray(orgWorkDays) && orgWorkDays.length > 0) {
      const isWorkday = orgWorkDays.some((d: any) => {
        if (d === null || d === undefined) return false;
        if (typeof d === "number") return d === dayNum;
        const str = typeof d === "object" ? String(d.id || d.label || d.name || "") : String(d);
        const lower = str.toLowerCase();
        return lower === dayName || lower === dayShort || lower === String(dayNum);
      });
      return !isWorkday;
    }

    return dayNum === 0 || dayNum === 6;
  }, [selectedDate, orgOffDays, orgWorkDays]);

  // Subscribe to real workAudit for each employee for dateStr
  useEffect(() => {
    if (!employees || employees.length === 0) return;

    let isMounted = true;
    const unsubs: (() => void)[] = [];

    employees.forEach(emp => {
      if (!emp.id) return;
      const auditRef = doc(db, "users", emp.id, "workAudit", dateStr);
      const unsub = onSnapshot(auditRef, (snap) => {
        if (!isMounted) return;
        if (snap.exists()) {
          setEmpAudits(prev => ({ ...prev, [emp.id]: snap.data() }));
        } else {
          setEmpAudits(prev => {
            const next = { ...prev };
            delete next[emp.id];
            return next;
          });
        }
      });
      unsubs.push(unsub);
    });

    return () => {
      isMounted = false;
      unsubs.forEach(u => u());
    };
  }, [employees, dateStr]);

  // Filter employees for Insights: exclude owners/founders unless they have the trac-diary desktop app version in user doc or active work telemetry
  const displayEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];

    return employees.filter(emp => {
      const role = (emp.role || '').toLowerCase();
      const isOwnerOrFounder = role === 'owner' || role === 'founder';

      if (!isOwnerOrFounder) return true; // Always include non-owner/founder members (employees, managers, etc.)

      const audit = empAudits[emp.id];

      // Check if owner/founder has trac-diary version in user doc or active work telemetry
      const hasTracDiaryVersion = !!(
        emp.tracDiaryVersion ||
        emp.tracVersion ||
        emp.appVersion ||
        emp.version ||
        emp.hasTracDiary ||
        emp.tracInstalled ||
        emp.desktopVersion ||
        emp.installedAppVersion ||
        emp.tracAppVersion
      );

      const hasWorkTelemetry = !!(
        (audit?.metrics?.totalSeconds && audit.metrics.totalSeconds > 0) ||
        (emp.workShifts && emp.workShifts.length > 0) ||
        (emp.totalSeconds && emp.totalSeconds > 0)
      );

      return hasTracDiaryVersion || hasWorkTelemetry;
    });
  }, [employees, empAudits]);

  // Determine target employees list based on dropdown selection
  const targetEmployees = useMemo(() => {
    if (selectedEmpId === "all") {
      return displayEmployees;
    }
    const found = displayEmployees.find(e => e.id === selectedEmpId);
    return found ? [found] : displayEmployees;
  }, [selectedEmpId, displayEmployees]);

  // Top-level Collapsed state for employees across Tabs 2 and 3
  const [collapsedEmps, setCollapsedEmps] = useState<Record<string, boolean>>({});

  const toggleEmpCollapse = (empId: string) => {
    setCollapsedEmps(prev => ({ ...prev, [empId]: !prev[empId] }));
  };

  const areAllEmpsCollapsed = useMemo(() => {
    if (targetEmployees.length === 0) return false;
    return targetEmployees.every(emp => !!collapsedEmps[emp.id]);
  }, [targetEmployees, collapsedEmps]);

  const toggleAllEmpsCollapse = () => {
    const nextState = !areAllEmpsCollapsed;
    const nextMap: Record<string, boolean> = {};
    targetEmployees.forEach(emp => {
      nextMap[emp.id] = nextState;
    });
    setCollapsedEmps(nextMap);
  };

  // Dedicated Empirical Anomaly Engine Hook
  const { 
    flaggedEmployees: allFlaggedEmployees, 
    totalSuspiciousInstances, 
    totalFlaggedMinutes, 
    cleanWorkforceCount,
    orgRiskScore,
    orgHealthStatus
  } = useAnomalies(displayEmployees, empAudits, dateStr);

  // Filter flagged employees based on selected employee dropdown
  const flaggedEmployees = useMemo(() => {
    if (selectedEmpId === "all") return allFlaggedEmployees;
    return allFlaggedEmployees.filter(emp => (emp.employeeId || emp.id) === selectedEmpId);
  }, [allFlaggedEmployees, selectedEmpId]);

  const parseShiftDateStr = (ts: any): string => {
    if (!ts) return "";
    let d: Date | null = null;
    if (ts?.toDate && typeof ts.toDate === "function") d = ts.toDate();
    else if (ts?.seconds) d = new Date(ts.seconds * 1000);
    else if (ts instanceof Date) d = ts;
    else if (typeof ts === "number") d = new Date(ts);
    else if (typeof ts === "string") {
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
    return d ? format(d, "yyyy-MM-dd") : "";
  };

  // Helper to derive app breakdown for any single employee
  const getEmployeeAppBreakdown = useCallback((emp: any, empAudit: any) => {
    if (!emp) return [];

    // Check audit metrics first
    const auditBreakdown = empAudit?.metrics?.appBreakdown;
    if (auditBreakdown && Array.isArray(auditBreakdown) && auditBreakdown.length > 0) {
      return auditBreakdown.map((item: any) => ({
        id: String(item.id || item.name || item.appName || "App"),
        name: String(item.name || item.appName || "App"),
        duration: item.duration || (item.seconds ? `${Math.floor(item.seconds / 3600)}h ${Math.floor((item.seconds % 3600) / 60)}m` : "0m"),
        seconds: item.seconds || 0,
        details: Array.isArray(item.details) ? item.details.map((d: any) => ({
          title: String(typeof d === 'string' ? d : (d?.title || d?.activeWindow || d?.name || "Window")),
          duration: String(d?.duration || "0m")
        })) : []
      }));
    }

    // Parse liveBreakdown from emp.workShifts FOR dateStr ONLY
    const appMap: Record<string, { totalSeconds: number; details: Record<string, number> }> = {};

    emp.workShifts?.forEach((s: any) => {
      const sDate = s.dateStr || s.workDate || parseShiftDateStr(s.startTime) || parseShiftDateStr(s.clockIn) || (s.id?.includes('_') ? s.id.split('_')[0] : "");
      if (sDate !== dateStr) return;

      if (s.liveBreakdown) {
        Object.entries(s.liveBreakdown).forEach(([appName, data]) => {
          const isLegacy = typeof data === 'number';
          const secs = isLegacy ? data : (data as any)?.totalSeconds || 0;
          const details = isLegacy ? {} : (data as any)?.details || {};

          if (secs > 0) {
            if (!appMap[appName]) appMap[appName] = { totalSeconds: 0, details: {} };
            appMap[appName].totalSeconds += secs;

            Object.entries(details).forEach(([title, time]) => {
              const safeKey = typeof title === 'string' ? title : "Window";
              appMap[appName].details[safeKey] = (appMap[appName].details[safeKey] || 0) + (time as number);
            });
          }
        });
      }
    });

    return Object.entries(appMap)
      .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
      .map(([appName, data]) => {
        const secs = data.totalSeconds;
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
        const formattedName = appName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        const detailsArray = Object.entries(data.details)
          .sort((a, b) => b[1] - a[1])
          .map(([title, time]) => {
            const th = Math.floor(time / 3600);
            const tm = Math.floor((time % 3600) / 60);
            const ts = time % 60;
            const tStr = th > 0 ? `${th}h ${tm}m` : tm > 0 ? `${tm}m` : `${ts}s`;
            return { title: String(title), duration: tStr, seconds: time };
          });

        return {
          id: String(appName),
          name: String(formattedName),
          duration: String(durationStr),
          seconds: secs,
          details: detailsArray
        };
      });
  }, [dateStr]);

  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground font-semibold text-sm">
          <Activity className="size-5 animate-spin text-primary" />
          Loading Insights...
        </div>
      </div>
    );
  }

  // Access Denial for non-management users
  if (!isManagementRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center space-y-4">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <Lock className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Insights, Anomaly Detection, and Manager Screenshot Tagging are restricted to Founders, Owners, and Managers.
        </p>
        <Button onClick={() => window.location.href = "/ems"} className="rounded-xl font-bold text-xs">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background text-foreground font-sans">
      
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 size-8 sm:size-9"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="size-4 sm:size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground truncate">
              <ShieldCheck className="size-4 sm:size-5 text-primary shrink-0" />
              <span>Insights</span>
              {isOffDay && (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0">
                  OFF DAY
                </Badge>
              )}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate hidden sm:block">Team productivity, suspicious app flags & screenshot tagging</p>
          </div>
        </div>

        {/* Top Controls: Date & Employee Filter */}
        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto shrink-0">
          <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
            <SelectTrigger className="w-32 sm:w-44 h-8 sm:h-9 text-[11px] sm:text-xs font-semibold bg-background border-border rounded-xl">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs font-semibold">All Employees</SelectItem>
              {displayEmployees.map(emp => (
                <SelectItem key={emp.id} value={emp.id} className="text-xs font-semibold">
                  {emp.name || emp.displayName || "Employee"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center bg-secondary rounded-xl p-0.5 sm:p-1 border border-border shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-6 sm:size-7 hover:bg-background rounded-lg"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="size-3.5 sm:size-4" />
            </Button>
            <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-3 font-mono">
              <span className="hidden sm:inline">{format(selectedDate, "EEE, MMM dd, yyyy")}</span>
              <span className="sm:hidden">{format(selectedDate, "EEE, MMM dd")}</span>
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-6 sm:size-7 hover:bg-background rounded-lg"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="size-3.5 sm:size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-border bg-card px-2 sm:px-6 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('anomalies')}
          className={cn(
            "flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 sm:shrink flex-1 text-center",
            activeTab === 'anomalies' 
              ? "bg-primary text-primary-foreground shadow-xs" 
              : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <AlertTriangle className="size-3.5 sm:size-4 shrink-0" />
          <span>1. Unusual Activity</span>
        </button>

        <button
          onClick={() => setActiveTab('screenshots')}
          className={cn(
            "flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 sm:shrink flex-1 text-center",
            activeTab === 'screenshots' 
              ? "bg-primary text-primary-foreground shadow-xs" 
              : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <ImageIcon className="size-3.5 sm:size-4 shrink-0" />
          <span>2. Screenshots & Tagging</span>
        </button>

        <button
          onClick={() => setActiveTab('apps')}
          className={cn(
            "flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 sm:shrink flex-1 text-center",
            activeTab === 'apps' 
              ? "bg-primary text-primary-foreground shadow-xs" 
              : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <LayoutGrid className="size-3.5 sm:size-4 shrink-0" />
          <span>3. Apps & Websites</span>
        </button>
      </div>

      {/* Tab Contents */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background">
        
        {/* Organization Off-Day Notification Banner */}
        {isOffDay && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-between shadow-xs mb-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-red-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                <AlertTriangle className="size-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-bold leading-none">
                  {format(selectedDate, "EEEE, MMMM dd")} is designated as an Organization Off-Day.
                </p>
                <p className="text-[11px] opacity-80 mt-1">
                  Team member telemetry captured on this date is logged as Off-Day Overtime/Shifts.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-[9px] font-black uppercase tracking-widest hidden sm:inline-flex">
              OFF DAY SCHEDULE
            </Badge>
          </div>
        )}
        
        {/* TAB 1: UNUSUAL ACTIVITY RADAR */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            {/* Metric Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Flagged Members</span>
                <p className="text-3xl font-black text-foreground">{flaggedEmployees.length}</p>
              </div>

              <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suspicious Instances</span>
                <p className="text-3xl font-black text-amber-500">
                  {flaggedEmployees.reduce((acc, e) => acc + (e.flags?.length || 0), 0)}
                </p>
              </div>

              <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Flagged Time</span>
                <p className="text-3xl font-black text-foreground font-mono">
                  {(() => {
                    let totalMins = 0;
                    flaggedEmployees.forEach(e => {
                      e.flags?.forEach((f: any) => {
                        if (f.id === 'idle_spike' || f.id === 'lateness') {
                          const m = parseInt(f.metric) || 0;
                          totalMins += m;
                        }
                      });
                    });
                    return totalMins > 0 ? `${totalMins}m` : "0m";
                  })()}
                </p>
              </div>

              <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Clean Workforce</span>
                <p className="text-3xl font-black text-emerald-500 font-mono">
                  {Math.max(0, targetEmployees.length - flaggedEmployees.length)} / {targetEmployees.length}
                </p>
              </div>
            </div>

            {/* Flagged Members Detail Cards */}
            <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden space-y-0">
              <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Members with Unusual Activity Flags ({flaggedEmployees.length})
                </h3>
              </div>

              <div className="divide-y divide-border">
                {flaggedEmployees.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground font-semibold text-xs space-y-2">
                    <ShieldCheck className="size-10 text-emerald-500 mx-auto opacity-80" />
                    <p className="text-sm font-bold text-foreground">Zero Behavioral Anomalies Detected</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      All connected team members operate within healthy workforce parameters for {dateStr}. No idle spikes, synthetic motion, or schedule variances were recorded.
                    </p>
                  </div>
                ) : (
                  flaggedEmployees.map(emp => (
                    <div 
                      key={emp.employeeId || emp.id} 
                      onClick={() => setSelectedAnomalyReport(emp)}
                      className="p-5 space-y-3 hover:bg-secondary/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-full bg-secondary overflow-hidden border border-border shrink-0 group-hover:scale-105 transition-transform">
                            <img src={getUserAvatar(emp.rawEmp || emp)} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                              {emp.employeeName || emp.name || emp.displayName || "Employee"}
                              <span className="text-[10px] font-semibold text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-full border border-border">
                                {emp.role || "Member"} {emp.department ? `• ${emp.department}` : ''}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{emp.employeeEmail || emp.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={cn("text-xs font-bold px-3 py-1 rounded-full", 
                            emp.highestSeverity === "High Flag" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            emp.highestSeverity === "Medium Flag" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                            {emp.highestSeverity} ({emp.flags?.length || 1} {(emp.flags?.length || 1) === 1 ? 'anomaly' : 'anomalies'})
                          </Badge>
                        </div>
                      </div>

                      {/* Vector Flags List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {(emp.flags || [emp.flag]).map((f: any) => (
                          <div key={f.id} className="p-3 rounded-xl border border-border bg-secondary/30 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                                {f.type}
                              </span>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-background border border-border text-foreground">
                                {f.metric}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{f.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOURLY SCREENSHOTS & TAGGING */}
        {activeTab === 'screenshots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="size-4 text-primary" />
                  Hourly Screenshots & Tagging ({targetEmployees.length} {targetEmployees.length === 1 ? 'employee' : 'employees'})
                </h3>
                <p className="text-xs text-muted-foreground">Captured 10-minute desktop screen segments for {dateStr}</p>
              </div>

              {targetEmployees.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllEmpsCollapse}
                  className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border hover:bg-secondary"
                >
                  {areAllEmpsCollapsed ? (
                    <>
                      <ChevronDown className="size-3.5 text-primary" /> Expand All Employees ({targetEmployees.length})
                    </>
                  ) : (
                    <>
                      <ChevronUp className="size-3.5 text-primary" /> Collapse All Employees ({targetEmployees.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {targetEmployees.map(emp => {
                const isCollapsed = !!collapsedEmps[emp.id];
                const empName = emp.name || emp.displayName || "Employee";

                return (
                  <div key={emp.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                    {/* Employee Header Bar */}
                    <div 
                      onClick={() => toggleEmpCollapse(emp.id)}
                      className="p-4 bg-secondary/30 border-b border-border flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-secondary overflow-hidden border border-border shrink-0">
                          <img src={getUserAvatar(emp)} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{empName}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground font-mono bg-background px-2 py-0.5 rounded-full border border-border">
                              {emp.role || "Member"} {emp.department ? `• ${emp.department}` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{emp.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-bold gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
                        >
                          {isCollapsed ? (
                            <>
                              <ChevronDown className="size-4" /> Expand Screenshots
                            </>
                          ) : (
                            <>
                              <ChevronUp className="size-4" /> Collapse
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Employee Screenshots Content */}
                    {!isCollapsed && (
                      <div className="p-6">
                        <HourlyScreenshotTagging 
                          selectedEmployee={emp}
                          selectedDate={selectedDate}
                          hideBannerHeader={true}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: APPS & WEBSITE BREAKDOWN */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <LayoutGrid className="size-4 text-primary" />
                  App & URL Breakdown ({targetEmployees.length} {targetEmployees.length === 1 ? 'employee' : 'employees'})
                </h3>
                <p className="text-xs text-muted-foreground">Categorized computer usage telemetry for {dateStr}</p>
              </div>

              {targetEmployees.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllEmpsCollapse}
                  className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border hover:bg-secondary"
                >
                  {areAllEmpsCollapsed ? (
                    <>
                      <ChevronDown className="size-3.5 text-primary" /> Expand All Employees ({targetEmployees.length})
                    </>
                  ) : (
                    <>
                      <ChevronUp className="size-3.5 text-primary" /> Collapse All Employees ({targetEmployees.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {targetEmployees.map(emp => {
                const isCollapsed = !!collapsedEmps[emp.id];
                const empName = emp.name || emp.displayName || "Employee";
                const appBreakdown = getEmployeeAppBreakdown(emp, empAudits[emp.id]);
                const totalSecs = appBreakdown.reduce((acc: number, item: any) => acc + (item.seconds || 0), 0);
                const totalH = Math.floor(totalSecs / 3600);
                const totalM = Math.floor((totalSecs % 3600) / 60);
                const totalTimeStr = totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`;

                return (
                  <div key={emp.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-0">
                    {/* Employee Header Card */}
                    <div 
                      onClick={() => toggleEmpCollapse(emp.id)}
                      className="p-4 bg-secondary/30 border-b border-border flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-secondary overflow-hidden border border-border shrink-0">
                          <img src={getUserAvatar(emp)} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{empName}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground font-mono bg-background px-2 py-0.5 rounded-full border border-border">
                              {emp.role || "Member"} {emp.department ? `• ${emp.department}` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{emp.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {appBreakdown.length > 0 && (
                          <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {totalTimeStr} tracked ({appBreakdown.length} apps)
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-bold gap-1 rounded-xl text-muted-foreground hover:text-foreground"
                        >
                          {isCollapsed ? (
                            <>
                              <ChevronDown className="size-4" /> Expand Apps & URLs
                            </>
                          ) : (
                            <>
                              <ChevronUp className="size-4" /> Collapse
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Employee Apps Content */}
                    {!isCollapsed && (
                      <div className="p-6">
                        {appBreakdown.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground font-semibold text-xs">
                            No application usage telemetry recorded for {empName} on {dateStr}.
                          </div>
                        ) : (
                          <div className="space-y-3 text-xs">
                            {appBreakdown.map((item: any, idx: number) => {
                              const appKey = `${emp.id}_${item.id}`;
                              const isAppExpanded = !!expandedApps[appKey];
                              const hasDetails = item.details && item.details.length > 0;

                              return (
                                <div key={idx} className="bg-secondary/30 rounded-xl border border-border overflow-hidden transition-all">
                                  <div 
                                    onClick={() => hasDetails && toggleAppExpand(appKey)}
                                    className={cn(
                                      "flex items-center justify-between p-3.5 select-none",
                                      hasDetails ? "cursor-pointer hover:bg-secondary/50" : ""
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      {item.name.toLowerCase().includes("chrome") || item.name.toLowerCase().includes("browser") ? (
                                        <Globe className="size-4 text-blue-500 shrink-0" />
                                      ) : (
                                        <Monitor className="size-4 text-primary shrink-0" />
                                      )}
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-bold text-foreground text-xs sm:text-sm">{item.name}</span>
                                          {hasDetails && (
                                            <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full border border-border font-mono whitespace-nowrap shrink-0">
                                              {item.details.length} {item.details.length === 1 ? 'URL/title' : 'URLs/titles'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="font-bold font-mono text-foreground text-xs">{item.duration}</span>
                                      {hasDetails && (
                                        <button className="text-muted-foreground hover:text-foreground p-1">
                                          {isAppExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Collapsible Details List */}
                                  {hasDetails && isAppExpanded && (
                                    <div className="border-t border-border bg-background/50 p-3 space-y-2 divide-y divide-border/40">
                                      {item.details.map((det: any, dIdx: number) => (
                                        <div key={dIdx} className="pt-2 first:pt-0 flex items-start justify-between gap-4 text-xs">
                                          <div className="flex items-start gap-2 min-w-0 flex-1">
                                            <Globe className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                            <span className="text-foreground font-mono text-[11px] select-all break-words whitespace-normal leading-relaxed">
                                              {det.title}
                                            </span>
                                          </div>
                                          <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0 bg-secondary px-2 py-0.5 rounded-md border border-border">
                                            {det.duration}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* Interactive Employee Anomaly Deep-Dive Modal */}
      <EmployeeAnomalyModal 
        report={selectedAnomalyReport}
        targetDateStr={dateStr}
        onClose={() => setSelectedAnomalyReport(null)}
        onNavigateToScreenshots={(empId) => {
          setSelectedEmpId(empId);
          setActiveTab('screenshots');
          setSelectedAnomalyReport(null);
        }}
      />
    </div>
  );
}
