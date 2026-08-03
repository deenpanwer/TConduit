"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useSidebar } from "@/hooks/use-sidebar";
import { format, subDays, addDays, parseISO, parse } from "date-fns";
import { 
  CheckSquare, Clock, Activity, ChevronLeft, ChevronRight, 
  Menu, Lock, Search, Check, ShieldCheck, CalendarOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShiftReviewModal } from "@/components/ems/shifts/ShiftReviewModal";
import { cn, getUserAvatar, isEmployeeOnline } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where } from "firebase/firestore";
import { toast } from "sonner";

export default function ShiftReviewsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, loading: teamLoading, selectedDate, setSelectedDate } = useTeam();
  const { setIsMobileOpen } = useSidebar();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending");

  // Real-time workAudit map keyed by employee ID
  const [empAudits, setEmpAudits] = useState<Record<string, any>>({});

  // Org off-days & work-days configuration
  const [orgOffDays, setOrgOffDays] = useState<string[]>([]);
  const [orgWorkDays, setOrgWorkDays] = useState<string[]>([]);

  // Selected shift for modal review
  const [selectedReviewEmployee, setSelectedReviewEmployee] = useState<any>(null);
  const [selectedShiftData, setSelectedShiftData] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Local approval tracking state
  const [approvedShifts, setApprovedShifts] = useState<Record<string, boolean>>({});

  const isClientUser = userData?.role === "client" || userData?.isClient === true;
  const userRole = (userData?.role || '').toLowerCase();
  const isManagementRole = !isClientUser && (
    ['founder', 'owner', 'manager', 'admin', 'hr', 'ops'].includes(userRole) || 
    !!userData?.ownedOrgId
  );

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isFutureDay = dateStr > todayStr;
  const isToday = dateStr === todayStr;
  const isPastDay = dateStr < todayStr;

  const orgId = userData?.orgId || userData?.ownedOrgId;

  // Real-time Firestore listener for organization settings (workDays & offDays)
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

  // Determine if the selected date is an Organization Off-Day
  const isOffDay = useMemo(() => {
    const dayName = format(selectedDate, "EEEE").toLowerCase(); // "saturday"
    const dayShort = format(selectedDate, "EEE").toLowerCase();  // "sat"
    const dayNum = selectedDate.getDay(); // 0 = Sun, 6 = Sat

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

    // Default weekend check if no org setting specified
    return dayName === "saturday" || dayName === "sunday";
  }, [selectedDate, orgOffDays, orgWorkDays]);

  // Real-time Firestore listener for workAudit per employee for dateStr
  useEffect(() => {
    if (!employees || employees.length === 0) return;

    // Reset audits and approved shifts maps for new date selection
    setEmpAudits({});
    setApprovedShifts({});

    let isMounted = true;
    const unsubs: (() => void)[] = [];

    employees.forEach(emp => {
      if (!emp.id) return;
      const auditRef = doc(db, "users", emp.id, "workAudit", dateStr);
      const unsub = onSnapshot(auditRef, (snap) => {
        if (!isMounted) return;
        if (snap.exists()) {
          const auditData = snap.data();
          setEmpAudits(prev => ({ ...prev, [emp.id]: auditData }));
          if (auditData.approvalStatus === "approved" || auditData.approved) {
            setApprovedShifts(prev => ({ ...prev, [emp.id]: true }));
          } else {
            setApprovedShifts(prev => {
              const next = { ...prev };
              delete next[emp.id];
              return next;
            });
          }
        } else {
          setEmpAudits(prev => {
            const next = { ...prev };
            delete next[emp.id];
            return next;
          });
          setApprovedShifts(prev => {
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

  // Real-time listener for scheduled_shifts for dateStr to resolve date overrides
  const [scheduledShiftsMap, setScheduledShiftsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!orgId) return;
    const q = query(
      collection(db, "organizations", orgId, "scheduled_shifts"),
      where("date", "==", dateStr)
    );
    const unsub = onSnapshot(q, (snap: any) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d: any) => {
        const data = d.data();
        if (data.userId) map[data.userId] = data;
      });
      setScheduledShiftsMap(map);
    });
    return () => unsub();
  }, [orgId, dateStr]);

  const isOwnerOrFounder = ['owner', 'founder', 'hr', 'ops', 'admin'].includes(userRole) || !!userData?.ownedOrgId;
  const isManagerRole = userRole === 'manager';
  const userDept = userData?.department;

  // Use real employees from useTeam context with strict Role, Department, and Owner/Founder desktop app filtering
  const displayEmployees = useMemo(() => {
    if (!employees) return [];

    return employees.filter(emp => {
      // Exclude self from review list ONLY if there are other staff members
      if (emp.id === user?.uid && employees.length > 1 && !isOwnerOrFounder) return false;

      const empRole = (emp.role || 'employee').toLowerCase();

      // Exclude owners/founders unless they have desktop trac-diary version in user doc or active work telemetry
      if (empRole === 'owner' || empRole === 'founder') {
        const audit = empAudits[emp.id || emp.uid];
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
        if (!hasTracDiaryVersion && !hasWorkTelemetry) return false;
      }

      // Managers can ONLY review employee/member level roles
      if (isManagerRole && !isOwnerOrFounder) {
        const isTargetEmployee = ['employee', 'member', 'user', 'staff'].includes(empRole) || !emp.role;
        if (!isTargetEmployee) return false;

        // Department scope: if manager has a department set, show ONLY employees in that department
        if (userDept && userDept.trim() !== '') {
          return emp.department === userDept;
        }
      }

      return true;
    });
  }, [employees, empAudits, user?.uid, userRole, isManagerRole, isOwnerOrFounder, userDept]);

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

  // Helper to resolve tracked shift for target date (finds earliest start time for multi-shift days)
  const getEmpShiftForDate = (emp: any) => {
    if (!emp.workShifts || !Array.isArray(emp.workShifts)) return {};

    // 1. Find ALL shifts belonging to target dateStr
    const matchingShifts = emp.workShifts.filter((s: any) => {
      if (!s) return false;
      const sDate = s.dateStr || s.workDate || parseShiftDateStr(s.startTime) || parseShiftDateStr(s.clockIn) || s.id?.split('_')[0];
      return sDate === dateStr;
    });

    if (matchingShifts.length === 0) return {};

    // 2. Sort matching shifts chronologically (earliest startTime first)
    const sortedShifts = [...matchingShifts].sort((a: any, b: any) => {
      const getMs = (s: any) => {
        const val = s.startTime || s.clockIn || s.createdAt;
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      return getMs(a) - getMs(b);
    });

    const earliestShift = sortedShifts[0];
    const latestShift = sortedShifts[sortedShifts.length - 1];

    // Aggregate total metrics across all daily shifts
    const totalSecs = matchingShifts.reduce((acc: number, s: any) => {
      const secs = s.liveMetrics?.totalSeconds || s.metrics?.totalSeconds || s.totalSeconds || s.durationSeconds || s.secondsWorked || 0;
      return acc + secs;
    }, 0);

    const firstStartTime = earliestShift.startTime || earliestShift.clockIn;
    const lastEndTime = latestShift.endTime || latestShift.clockOut;

    return {
      ...earliestShift,
      startTime: firstStartTime, // GUARANTEES VERY FIRST SHIFT START TIME OF THE DAY!
      endTime: lastEndTime,       // LAST SHIFT END TIME OF THE DAY!
      liveMetrics: {
        ...(earliestShift.liveMetrics || earliestShift.metrics || {}),
        totalSeconds: totalSecs,
      },
      metrics: {
        ...(earliestShift.metrics || earliestShift.liveMetrics || {}),
        totalSeconds: totalSecs,
      },
      matchingShiftsCount: matchingShifts.length
    };
  };

  // Punctuality & Scheduled Shift Resolution Engine
  const getEmpPunctualityInfo = useCallback((emp: any) => {
    const audit = empAudits[emp.id || emp.uid];
    const shiftTelemetry = getEmpShiftForDate(emp);
    const scheduledShift = scheduledShiftsMap[emp.id || emp.uid];
    const empDefaults = emp.trackingSettings?.shiftDefaults;

    // Resolve Expected Start Time
    let expectedStartStr: string | null = null;
    let isScheduled = false;

    if (scheduledShift?.startTime) {
      expectedStartStr = scheduledShift.startTime;
      isScheduled = true;
    } else if (audit?.metrics?.shiftStartTime || audit?.metrics?.scheduledStart) {
      expectedStartStr = audit.metrics.shiftStartTime || audit.metrics.scheduledStart;
      isScheduled = true;
    } else if (empDefaults?.startTime) {
      expectedStartStr = empDefaults.startTime;
      isScheduled = true;
    }

    if (isOffDay && !scheduledShift?.startTime) {
      isScheduled = false;
    }

    if (!isScheduled || !expectedStartStr) {
      return { status: "Unscheduled Shift", latenessMinutes: 0, isScheduled: false, expectedStart: null, actualStart: null };
    }

    // Resolve Actual Start Time
    let actualStartStr: string | null = null;
    if (audit?.metrics?.startTime) {
      actualStartStr = audit.metrics.startTime;
    } else if (shiftTelemetry?.startTime) {
      try {
        const d = typeof shiftTelemetry.startTime === 'number' ? new Date(shiftTelemetry.startTime) : parseISO(shiftTelemetry.startTime);
        actualStartStr = format(d, "HH:mm");
      } catch {
        actualStartStr = String(shiftTelemetry.startTime);
      }
    } else if (shiftTelemetry?.clockIn) {
      try {
        const d = typeof shiftTelemetry.clockIn === 'number' ? new Date(shiftTelemetry.clockIn) : parseISO(shiftTelemetry.clockIn);
        actualStartStr = format(d, "HH:mm");
      } catch {
        actualStartStr = String(shiftTelemetry.clockIn);
      }
    }

    if (!actualStartStr) {
      return { status: "No Shift Logged", latenessMinutes: 0, isScheduled: true, expectedStart: expectedStartStr, actualStart: null };
    }

    const parseMins = (str: string) => {
      try {
        if (str.includes("AM") || str.includes("PM")) {
          const p = parse(str, "hh:mm a", new Date());
          return p.getHours() * 60 + p.getMinutes();
        }
        const [h, m] = str.split(":").map(Number);
        return h * 60 + m;
      } catch {
        return 0;
      }
    };

    const expMins = parseMins(expectedStartStr);
    const actMins = parseMins(actualStartStr);
    const diff = actMins - expMins;

    if (diff <= 0) {
      return { status: "On Time", latenessMinutes: 0, isScheduled: true, expectedStart: expectedStartStr, actualStart: actualStartStr };
    } else {
      return { status: `Late ${diff}m`, latenessMinutes: diff, isScheduled: true, expectedStart: expectedStartStr, actualStart: actualStartStr };
    }
  }, [empAudits, scheduledShiftsMap, isOffDay, dateStr]);

  // Helper to extract total tracked seconds for dateStr
  const getEmpTotalSecsForDate = (emp: any) => {
    const audit = empAudits[emp.id];
    const shift = getEmpShiftForDate(emp);

    if (audit?.metrics?.totalSeconds) return audit.metrics.totalSeconds;
    if (shift.liveMetrics?.totalSeconds) return shift.liveMetrics.totalSeconds;
    if (shift.metrics?.totalSeconds) return shift.metrics.totalSeconds;
    if (shift.totalSeconds && shift.totalSeconds > 0) return shift.totalSeconds;
    if (shift.durationSeconds && shift.durationSeconds > 0) return shift.durationSeconds;
    if (shift.secondsWorked && shift.secondsWorked > 0) return shift.secondsWorked;
    
    // Check if emp.totalSeconds applies to today
    if (isToday && emp.totalSeconds) return emp.totalSeconds;
    return 0;
  };

  // Dynamic KPI derivations
  const totalWorkedFormatted = useMemo(() => {
    if (!displayEmployees || displayEmployees.length === 0 || isFutureDay) return "0h 0m";
    const totalSecs = displayEmployees.reduce((acc, emp) => {
      return acc + getEmpTotalSecsForDate(emp);
    }, 0);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    return `${h}h ${m}m`;
  }, [displayEmployees, empAudits, dateStr, isFutureDay, isToday]);

  const waitingForApprovalCount = useMemo(() => {
    if (isFutureDay) return 0;
    return displayEmployees.filter(emp => {
      const audit = empAudits[emp.id];
      const isApproved = approvedShifts[emp.id] || audit?.approvalStatus === "approved" || audit?.approved === true;
      const totalSecs = getEmpTotalSecsForDate(emp);
      if (isApproved) return false;
      // Only count as waiting for approval if work was actually logged or formal workAudit exists for that date
      return totalSecs > 0 || (!!audit && (audit.approvalStatus || audit.approved || audit.metrics?.totalSeconds));
    }).length;
  }, [displayEmployees, empAudits, approvedShifts, isFutureDay, dateStr]);

  const onTimePercentage = useMemo(() => {
    if (!displayEmployees || displayEmployees.length === 0 || isFutureDay) return "N/A";
    
    const evaluated = displayEmployees.map(emp => getEmpPunctualityInfo(emp)).filter(p => p.isScheduled && p.actualStart);

    if (evaluated.length === 0) return "N/A";

    const onTimeCount = evaluated.filter(p => p.status === "On Time").length;
    return `${Math.round((onTimeCount / evaluated.length) * 100)}% On Time`;
  }, [displayEmployees, getEmpPunctualityInfo, isFutureDay]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return displayEmployees.filter(emp => {
      const nameMatch = (emp.name || emp.displayName || emp.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const audit = empAudits[emp.id];
      const isApproved = approvedShifts[emp.id] || audit?.approvalStatus === "approved" || audit?.approved === true;

      if (statusFilter === "pending") return nameMatch && !isApproved;
      if (statusFilter === "approved") return nameMatch && isApproved;
      return nameMatch;
    });
  }, [displayEmployees, searchTerm, statusFilter, approvedShifts, empAudits]);

  const handleQuickApprove = async (emp: any) => {
    setApprovedShifts(prev => ({ ...prev, [emp.id]: true }));
    try {
      const auditRef = doc(db, "users", emp.id, "workAudit", dateStr);
      await updateDoc(auditRef, {
        approvalStatus: "approved",
        approved: true,
        approvedAt: serverTimestamp()
      });
    } catch (e) {
      // Ignore if doc doesn't exist yet
    }
    toast.success(`Shift approved for ${emp.name || 'Employee'}`);
  };

  // Safe time formatting to 12-hour AM/PM
  const formatTimeStr = (timeVal: any, fallback: string) => {
    if (!timeVal) return fallback;
    if (typeof timeVal === "string") {
      if (timeVal === "Shift Active" || timeVal === "--") return timeVal;
      const d = new Date(timeVal);
      if (!isNaN(d.getTime())) return format(d, "hh:mm a");
      return timeVal;
    }
    if (timeVal instanceof Date) return format(timeVal, "hh:mm a");
    if (timeVal?.toDate && typeof timeVal.toDate === "function") return format(timeVal.toDate(), "hh:mm a");
    return fallback;
  };

  const formatDurationSecs = (secs: number) => {
    if (!secs || secs <= 0) return "0h 0m";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleOpenReview = (emp: any) => {
    const audit = empAudits[emp.id];
    if (!audit) return; // STRICT REQUIREMENT: Manager MUST wait for real workAudit document to exist!

    const shift = getEmpShiftForDate(emp);
    const totalSecs = getEmpTotalSecsForDate(emp);
    const liveMetrics = audit?.metrics || shift.liveMetrics || shift.metrics || {};
    const startTimeVal = formatTimeStr(audit?.metrics?.startTime || shift.startTime || emp.clockIn, "--");
    const endTimeVal = formatTimeStr(audit?.metrics?.endTime || shift.endTime, "--");

    setSelectedReviewEmployee(emp);
    setSelectedShiftData({
      id: dateStr,
      startTime: startTimeVal,
      endTime: endTimeVal,
      totalSeconds: totalSecs,
      activeSeconds: liveMetrics.activeSeconds || totalSecs,
      idleSeconds: liveMetrics.idleSeconds || 0,
      breakSeconds: liveMetrics.breakSeconds || 0,
      keystrokes: liveMetrics.keystrokes || 0,
      mouseClicks: liveMetrics.mouseClicks || 0,
      scrolls: liveMetrics.mouseScrolls || 0,
      mouseMovement: liveMetrics.mouseDistance || 0,
      lateness: audit?.metrics?.latenessMinutes > 0 ? `Late ${audit.metrics.latenessMinutes}m` : "On Time",
      allottedShift: audit?.metrics?.shiftStartTime || "Designated Shift",
      approvalStatus: (approvedShifts[emp.id] || audit?.approvalStatus === "approved") ? "approved" : "needs_review",
      employeeRemark: audit?.remarks || "No employee notes submitted."
    });
    setIsReviewModalOpen(true);
  };

  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground font-semibold text-sm">
          <Activity className="size-5 animate-spin text-primary" />
          Loading Shift Reviews...
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
          Shift Reviews and Payroll Approvals are restricted to Founders, Owners, and Managers.
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
      <header className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-border flex items-center justify-between shrink-0 bg-card gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 size-8 sm:size-9"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="size-4 sm:size-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 truncate">
              <span>Shift Reviews</span>
              {isOffDay && (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0">
                  <CalendarOff className="size-3 mr-1 inline" /> Off Day
                </Badge>
              )}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate hidden sm:block">Review clocked hours, computer activity & approve payroll shifts</p>
          </div>
        </div>

        {/* Historical Backdate Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-secondary rounded-xl p-0.5 sm:p-1 border border-border">
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-3 sm:p-6 space-y-3 sm:space-y-6 overflow-hidden min-h-0 bg-background">
        
        {/* Off Day Hint Alert if applicable */}
        {isOffDay && (
          <div className="p-3 sm:p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <CalendarOff className="size-4 shrink-0 text-red-500" />
              <span>
                <strong>{format(selectedDate, "EEEE, MMMM dd")}</strong> is designated as an Organization Off-Day. Staff members working on this date will logged as Off-Day Overtime/Shifts.
              </span>
            </div>
            <Badge variant="outline" className="border-red-500/30 bg-red-500/20 text-red-600 font-mono text-[9px] sm:text-[10px] hidden sm:inline-flex">
              OFF DAY SCHEDULE
            </Badge>
          </div>
        )}

        {/* Compact Summary Cards (2-column grid on mobile to save vertical space) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 shrink-0">
          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-border shadow-2xs space-y-0.5">
            <div className="flex justify-between items-center text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="truncate">Waiting</span>
              <Clock className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-black text-foreground">
              {waitingForApprovalCount} <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Emps</span>
            </p>
          </div>

          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-border shadow-2xs space-y-0.5">
            <div className="flex justify-between items-center text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="truncate">Approved</span>
              <Check className="size-3.5 sm:size-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-black text-foreground">
              {Object.keys(approvedShifts).length} <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Emps</span>
            </p>
          </div>

          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-border shadow-2xs space-y-0.5">
            <div className="flex justify-between items-center text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="truncate">Total Time</span>
              <Activity className="size-3.5 sm:size-4 text-blue-500 shrink-0" />
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-black text-foreground font-mono truncate">{totalWorkedFormatted}</p>
          </div>

          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-border shadow-2xs space-y-0.5">
            <div className="flex justify-between items-center text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="truncate">On-Time</span>
              <ShieldCheck className="size-3.5 sm:size-4 text-purple-500 shrink-0" />
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-black text-foreground truncate">{onTimePercentage}</p>
          </div>
        </div>

        {/* Status Tabs & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                statusFilter === "pending" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              Needs Review ({waitingForApprovalCount})
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                statusFilter === "approved" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              Approved ({Object.keys(approvedShifts).length})
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                statusFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              All Shifts ({displayEmployees.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter employee..."
              className="pl-9 h-9 text-xs font-semibold bg-card border-border rounded-xl"
            />
          </div>
        </div>

        {/* Shift Approvals Table */}
        <div className="flex-1 border border-border rounded-2xl shadow-xs overflow-y-auto min-h-0 bg-card relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-card shadow-xs">
                <tr className="border-b border-border bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 pl-6 w-12 text-center">#</th>
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Start Time</th>
                  <th className="p-4">End Time</th>
                  <th className="p-4">Active Work</th>
                  <th className="p-4">Punctuality</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground font-semibold">
                      No connected staff members found for this date.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, index) => {
                    const audit = empAudits[emp.id];
                    const shift = getEmpShiftForDate(emp);
                    const totalSecs = getEmpTotalSecsForDate(emp);
                    const hasAudit = !!audit && (audit.approvalStatus || audit.approved || audit.metrics?.totalSeconds);
                    const hasWorkLogged = totalSecs > 0;
                    const isApproved = approvedShifts[emp.id] || audit?.approvalStatus === "approved" || audit?.approved === true;

                    // Comprehensive Date & Audit State Categorization
                    let startTimeDisplay = "--";
                    let endTimeDisplay = "--";
                    let punctualityBadge = null;
                    let statusBadge = null;
                    let canReview = false;
                    let canApprove = false;
                    let approveBtnLabel = "Approve";

                    const pInfo = getEmpPunctualityInfo(emp);

                    if (isFutureDay) {
                      startTimeDisplay = "--";
                      endTimeDisplay = "--";
                      punctualityBadge = (
                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground bg-secondary border-border">
                          Upcoming
                        </Badge>
                      );
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                          Upcoming Date
                        </span>
                      );
                      canReview = false;
                      canApprove = false;
                      approveBtnLabel = "Upcoming Date";
                    } else if (!hasAudit) {
                      // NO FORMAL WORK AUDIT DOCUMENT EXISTS IN FIRESTORE YET!
                      if (hasWorkLogged) {
                        const startVal = shift.startTime || shift.clockIn;
                        const endVal = shift.endTime || shift.clockOut;
                        const isSameTime = startVal && endVal && String(startVal) === String(endVal);
                        const isOnlineNow = isToday && isEmployeeOnline(emp);

                        startTimeDisplay = formatTimeStr(startVal, "Shift Active");
                        endTimeDisplay = isOnlineNow 
                          ? "Shift Active" 
                          : ((endVal && !isSameTime) ? formatTimeStr(endVal, "--") : (isToday ? "Shift Active" : "--"));

                        punctualityBadge = pInfo.status === "On Time" ? (
                          <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                            On Time
                          </Badge>
                        ) : pInfo.status.startsWith("Late") ? (
                          <Badge variant="outline" className="text-[10px] font-bold text-red-500 bg-red-500/10 border-red-500/20">
                            {pInfo.status}
                          </Badge>
                        ) : pInfo.status === "Off-Day Shift" ? (
                          <Badge variant="outline" className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border-rose-500/20">
                            Off-Day Shift
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-slate-500/10 border-slate-500/20">
                            {pInfo.status}
                          </Badge>
                        );
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                            <Clock className="size-3.5" /> Pending Shift End Review
                          </span>
                        );
                        canReview = false; // Manager MUST wait for formal workAudit document to be submitted!
                        canApprove = false;
                        approveBtnLabel = "Awaiting Shift End";
                      } else {
                        // Zero work logged on a past day
                        startTimeDisplay = "--";
                        endTimeDisplay = "--";
                        punctualityBadge = isOffDay ? (
                          <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-slate-500/10 border-slate-500/20">
                            Off Day
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold text-red-500 bg-red-500/10 border-red-500/20">
                            No Shift Logged
                          </Badge>
                        );
                        statusBadge = isOffDay ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">
                            Off Day Schedule
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            <Clock className="size-3.5" /> No Shift Audit
                          </span>
                        );
                        canReview = false;
                        canApprove = false;
                        approveBtnLabel = "No Shift Audit";
                      }
                    } else {
                      // REAL WORK AUDIT DOCUMENT EXISTS IN FIRESTORE!
                      const startVal = shift.startTime || shift.clockIn || audit?.metrics?.startTime;
                      const endVal = shift.endTime || shift.clockOut || audit?.metrics?.endTime;
                      const isSameTime = startVal && endVal && String(startVal) === String(endVal);
                      const isOnlineNow = isToday && isEmployeeOnline(emp);

                      startTimeDisplay = formatTimeStr(startVal, "--");
                      endTimeDisplay = isOnlineNow 
                        ? "Shift Active" 
                        : ((endVal && !isSameTime) ? formatTimeStr(endVal, "--") : "--");

                      punctualityBadge = pInfo.status === "On Time" ? (
                        <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                          On Time
                        </Badge>
                      ) : pInfo.status.startsWith("Late") ? (
                        <Badge variant="outline" className="text-[10px] font-bold text-red-500 bg-red-500/10 border-red-500/20">
                          {pInfo.status}
                        </Badge>
                      ) : pInfo.status === "Off-Day Shift" ? (
                        <Badge variant="outline" className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border-rose-500/20">
                          Off-Day Shift
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-slate-500/10 border-slate-500/20">
                          {pInfo.status}
                        </Badge>
                      );

                      if (isApproved) {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <Check className="size-3.5" /> Approved
                          </span>
                        );
                        canReview = true;
                        canApprove = false;
                        approveBtnLabel = "Approved";
                      } else {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <Clock className="size-3.5" /> Needs Review
                          </span>
                        );
                        canReview = true;
                        canApprove = true;
                        approveBtnLabel = "Approve";
                      }
                    }

                    return (
                      <tr key={emp.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-4 pl-6 text-center font-mono font-bold text-muted-foreground text-xs">{index + 1}</td>
                        <td className="p-4 flex items-center gap-3">
                          <div className="size-9 rounded-full bg-secondary overflow-hidden border border-border shrink-0">
                            <img src={getUserAvatar(emp)} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{emp.name || emp.displayName || emp.email || "Employee"}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">{emp.role || "Member"}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-medium text-foreground">{startTimeDisplay}</td>
                        <td className="p-4 font-mono font-medium text-foreground">{endTimeDisplay}</td>
                        <td className="p-4 font-mono font-bold text-foreground">{formatDurationSecs(totalSecs)}</td>
                        <td className="p-4">{punctualityBadge}</td>
                        <td className="p-4">{statusBadge}</td>
                        <td className="p-4 pr-6 text-right space-x-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            disabled={!canReview}
                            onClick={() => handleOpenReview(emp)}
                            className={cn(
                              "h-8 text-xs font-bold rounded-xl border-border",
                              !canReview && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            Review Details
                          </Button>
                          <Button 
                            size="sm"
                            disabled={!canApprove}
                            onClick={() => handleQuickApprove(emp)}
                            className={cn(
                              "h-8 text-xs font-bold rounded-xl px-4 transition-colors",
                              !canApprove
                                ? "bg-secondary text-muted-foreground border border-border opacity-60 cursor-not-allowed"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                            )}
                          >
                            {approveBtnLabel}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 12-Metric Deep Shift Review Modal */}
      {selectedReviewEmployee && (
        <ShiftReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedReviewEmployee(null);
          }}
          employee={selectedReviewEmployee}
          selectedDate={selectedDate}
          shiftData={selectedShiftData}
          onApproveSuccess={() => {
            if (selectedReviewEmployee) {
              setApprovedShifts(prev => ({ ...prev, [selectedReviewEmployee.id]: true }));
            }
          }}
        />
      )}
    </div>
  );
}
