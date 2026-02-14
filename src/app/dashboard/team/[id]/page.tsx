"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw, Settings, MoreHorizontal } from "lucide-react";
import { EmployeeHeader } from "@/components/dashboard/employee/EmployeeHeader";
import { ActivityMatrix } from "@/components/dashboard/employee/ActivityMatrix";
import { WorkHistory } from "@/components/dashboard/employee/WorkHistory";
import { AttendanceLedger } from "@/components/dashboard/employee/AttendanceLedger";
import { CognitiveHub } from "@/components/dashboard/employee/CognitiveHub";
import { YieldCalculator } from "@/components/dashboard/employee/YieldCalculator";
import { motion } from "framer-motion";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Ticket, Copy, Check } from "lucide-react";
import { getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

import { useTeam } from "@/hooks/use-team";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { employees } = useTeam();
  
  const [employee, setEmployee] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]); // Keep this state for other components for now
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const isDemoId = typeof id === 'string' && id.startsWith('demo_');

  useEffect(() => {
    fetchOrgDetails();
  }, [userData]);

  const fetchOrgDetails = async () => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (targetOrgId) {
      const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
      if (orgDoc.exists()) setOrgData(orgDoc.data());
    }
  };

  const copyInviteCode = () => {
    if (orgData?.inviteCode) {
      navigator.clipboard.writeText(orgData.inviteCode);
      setCopied(true);
      toast({ title: "Code Copied!", description: "Invite code ready for the Electron app." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!id) return;

    if (isDemoId) {
        setLoading(true);
        import("@/lib/dashboard-demo-data").then(m => {
            const demoUser = m.getDemoUserById(id as string); 
            setEmployee({ ...demoUser, id });
            setScreenshots(demoUser.screenshots || []);
            setTimeEntries(demoUser.timeEntries || []);
            setLoading(false);
        }).catch(() => setLoading(false));
        return;
    }

    setLoading(true);
    const unsubProfile = onSnapshot(doc(db, "users", id as string), (snapshot) => {
      if (snapshot.exists()) setEmployee(snapshot.data());
      else setLoading(false); // ID not found
    });

    const timeRef = collection(db, "users", id as string, "timeEntries");
    const timeQuery = query(timeRef, orderBy("startTime", "desc"), limit(50));
    const unsubTime = onSnapshot(timeQuery, (snapshot) => {
      setTimeEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const today = new Date();
    const dates = [
      format(addDays(today, -1), "yyyy-MM-dd"),
      format(today, "yyyy-MM-dd"),
      format(addDays(today, 1), "yyyy-MM-dd")
    ];

    const twoHoursAgo = new Date(Date.now() - (120 * 60 * 1000));
    const unsubscribers: (() => void)[] = [];
    const allScreenshots: Record<string, any[]> = {};

    dates.forEach(dateStr => {
        const screenshotRef = collection(db, "users", id as string, "screenshots", dateStr, "images");
        const screenQuery = query(
            screenshotRef, 
            where("timestamp", ">=", twoHoursAgo),
            orderBy("timestamp", "desc"), 
            limit(120)
        );
        
        const unsub = onSnapshot(screenQuery, (snapshot) => {
            allScreenshots[dateStr] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const merged = Object.values(allScreenshots).flat().sort((a, b) => {
                const tA = a.timestamp?.seconds || 0;
                const tB = b.timestamp?.seconds || 0;
                return tB - tA;
            });
            setScreenshots(merged);
            setLoading(false);
        }, () => setLoading(false)); // Error fallback
        unsubscribers.push(unsub);
    });

    return () => {
      unsubProfile();
      unsubTime();
      unsubscribers.forEach(u => u());
    };
  }, [id, isDemoId]);

  /* 
     CRITICAL DATA FILTERING RULE:
     We must ONLY show data (Time Entries, Screenshots, Metrics) that occurred AFTER 
     the employee joined the organization (`attachedAt` or fallback to `createdAt`).
     
     If `attachedAt` exists, filter `entry.startTime >= attachedAt`.
     This prevents showing "Ghost Data" from previous organizations or personal usage 
     before they were officially onboarded to this specific workspace.
  */

  // 4. Calculations for Header
  const { totalHours, hoursToday, topApp } = useMemo(() => {
    // Determine the official start date for this org for filtering shifts
    const officialStart = employee?.attachedAt?.toDate ? employee.attachedAt.toDate() : (employee?.createdAt?.toDate ? employee.createdAt.toDate() : new Date(0));
    
    if (!employee || !employee.workShifts || employee.workShifts.length === 0) {
      return { totalHours: "0.0", hoursToday: "0.0", topApp: "---" };
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    let overallTotalSeconds = 0;
    let todayTotalSeconds = 0;
    const todayAppBreakdown: Record<string, number> = {};

    employee.workShifts.forEach((shift: any) => {
      // Ensure shift has liveMetrics and check if its within official start date
      const shiftStartTime = new Date(shift.startTime);
      if (shiftStartTime < officialStart) return; // Filter out shifts before employee joined

      overallTotalSeconds += shift.liveMetrics?.totalSeconds || 0;

      // Check if the shift is for today
      if (shift.id.startsWith(todayStr)) {
        todayTotalSeconds += shift.liveMetrics?.totalSeconds || 0;

        // Aggregate liveBreakdown for today's top app
        if (shift.liveBreakdown) {
          for (const appName in shift.liveBreakdown) {
            todayAppBreakdown[appName] = (todayAppBreakdown[appName] || 0) + (shift.liveBreakdown[appName] || 0);
          }
        }
      }
    });

    // Calculate today's top app
    const top = Object.entries(todayAppBreakdown)
      .sort(([, secondsA], [, secondsB]) => secondsB - secondsA)
      .find(([appName]) => appName !== "Idle")?.[0] || "---"; // Exclude "Idle" if it appears in liveBreakdown

    return {
      totalHours: (overallTotalSeconds / 3600).toFixed(1),
      hoursToday: (todayTotalSeconds / 3600).toFixed(1),
      topApp: top,
    };
  }, [employee]); // Dependency on employee object

  // Calculate joinedDate separately as it's independent of timeEntries/workShifts aggregation
  const joinedDate = useMemo(() => {
    return employee?.attachedAt?.toDate ? employee.attachedAt.toDate() : (employee?.createdAt?.toDate ? employee.createdAt.toDate() : new Date(0));
  }, [employee]);

  // 5. Calculate Live Intensity (Real-time Tension)
  const intensity = useMemo(() => {
    if (!employee || !employee.workShifts || employee.workShifts.length === 0) return 0;

    // Filter for shifts that have cognitiveReport.velocity and are either active or completed with time
    const relevantShifts = employee.workShifts
      .filter((s: any) => 
        s.cognitiveReport?.velocity !== undefined && s.cognitiveReport.velocity !== null &&
        (s.status === 'active' || (s.liveMetrics?.totalSeconds > 0 && s.endTime))
      )
      .sort((a: any, b: any) => {
        // Sort by start time, most recent first
        const dateA = new Date(a.startTime).getTime();
        const dateB = new Date(b.startTime).getTime();
        return dateB - dateA;
      });
      
    const mostRecentShiftWithVelocity = relevantShifts[0]; // Get the most recent relevant shift

    if (!mostRecentShiftWithVelocity) {
      // If no relevant shift is found, provide a default non-zero intensity if employee is online.
      return employee?.heartbeat?.isCurrentlyRunning ? 0.1 : 0;
    }

    const rawVelocity = mostRecentShiftWithVelocity.cognitiveReport.velocity;
    const minVelocity = 10;
    const maxVelocity = 70;
    
    // Scale velocity from its range to 0-1. Clamp to ensure it's within 0-1.
    let normalizedIntensity = Math.min(Math.max((rawVelocity - minVelocity) / (maxVelocity - minVelocity), 0), 1.0);

    // If employee is currently running, ensure a minimum visible intensity
    if (employee?.heartbeat?.isCurrentlyRunning && normalizedIntensity < 0.1) {
        normalizedIntensity = 0.1; 
    }

    return normalizedIntensity;
  }, [employee]);

  if (loading || authLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-16 lg:w-64 border-r animate-pulse bg-card" />
        <main className="flex-1 p-8 space-y-12 overflow-hidden">
          <Shimmer className="h-16 w-full rounded-2xl" />
          <Shimmer className="h-96 w-full rounded-[3rem]" />
          <Shimmer className="h-48 w-full rounded-[2.5rem]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Shimmer className="h-[400px] rounded-[2.5rem]" />
            <Shimmer className="h-[400px] rounded-[2.5rem]" />
          </div>
        </main>
      </div>
    );
  }

  /*
    Component Data & Calculation Documentation
    ------------------------------------------
    This parent page is responsible for fetching all necessary data and performing
    primary calculations. Child components receive this data as props.

    1. EmployeeHeader:
       - Data Requirements:
         - user doc: 1
         - timeEntries: 0
         - projects: 0
         - screenshots: 0
       - Calculations (Performed HERE in `useMemo`):
         - `totalHours`: Sum of all `duration` from `timeEntries`.
         - `hoursToday`: Sum of `duration` from `timeEntries` for the current day.
         - `topApp`: Most frequent `projectName` from `timeEntries`.
         - `joinedDate`: The `attachedAt` or `createdAt` timestamp from the user doc.
       - Child Component Role: Primarily for VISUALIZATION of these props.

    2. AttendanceLedger:
       - Data Requirements:
         - user doc: 1
         - timeEntries: 50
         - projects: 0
         - screenshots: 0
       - Calculations (Performed in the CHILD component):
         - The child component creates an `attendanceMap` by summing `duration` per day from the `timeEntries` prop.
         - It is responsible for its own internal state management for calendar display (e.g., current month).
       - Child Component Role: Calculates and VISUALIZES the daily attendance calendar.

    3. CognitiveHub:
       - Data Requirements:
         - user doc: 1
         - timeEntries: 0
         - projects: 0
         - screenshots: 0
       - Calculations (Performed HERE in `useMemo`):
         - `intensity`: Calculated from the `keystrokes`, `mouseClicks`, and `mouseDistance` of the last 20 `screenshots`.
       - Child Component Role:
         - Receives calculated `intensity` as a prop.
         - Performs minor visual calculations (e.g., `focusStatus`, `rhythmStatus`).
         - VISUALIZES the AI summary and the live intensity SVG.
    
    4. ActivityMatrix:
       - Data Requirements:
         - user doc: 0
         - timeEntries: 0
         - projects: 0
         - screenshots: All
       - Calculations (Performed in the CHILD component):
         - Filters screenshots to include only those from the last hour (or the last 60 available if none in the last hour).
         - Processes this filtered data to create `chartData` (for keystrokes, clicks, and scaled mouse distance over time).
         - Calculates `totals` for `keystrokes`, `clicks`, and `mouseDistance` for the displayed period.
       - Child Component Role: Calculates, processes, and VISUALIZES real-time activity metrics using charts and summary cards.

    5. YieldCalculator:
       - Data Requirements:
         - user doc: 0
         - timeEntries: All
         - projects: 0
         - screenshots: All
       - Calculations (Performed in the CHILD component, on demand):
         - `totalSeconds`: Sum of `duration` from all `timeEntries`.
         - `idleLogs`: Filters `screenshots` where `keystrokes`, `mouseClicks`, and `mouseDistance` are all zero.
         - `idleRatio`: Proportion of `idleLogs` to total `screenshots`.
         - `idleSeconds`: `totalSeconds` multiplied by `idleRatio`.
         - `activeSeconds`: `totalSeconds` minus `idleSeconds`.
         - These are then converted to `totalHours`, `idleHours`, `activeHours`, and `idleRatio` (percentage) for display.
       - Child Component Role: Performs a calculation-intensive "idle audit" on demand, and then VISUALIZES the results.

    6. WorkHistory:
       - Data Requirements:
         - user doc: 0
         - timeEntries: All
         - projects: 0
         - screenshots: All
       - Calculations (Performed in the CHILD component):
         - `clusters`: Groups `timeEntries` with their corresponding `screenshots`. It sorts `timeEntries` by `startTime` (descending) and filters `screenshots` that fall within each `timeEntry`'s `startTime` and `endTime`. Each cluster contains up to 20 related screenshots.
         - `visibleClusters`: Controls pagination by slicing the `clusters` array based on `pageSize`.
       - Child Component Role: Calculates and VISUALIZES a chronological log of work activity, grouped by time entry and showing associated screenshots.
  */

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <DashboardSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={false}
        setIsMobileSidebarOpen={() => {}}
        employees={employees} 
        onInviteClick={() => setShowInviteModal(true)}
      />

      {/* Persistent Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-border bg-card shadow-2xl p-8">
          <DialogHeader className="items-center text-center">
            <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Ticket size={32} className="text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Invite Staff Member</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
              Direct your team to enter this code in the Trac EMS Profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 pt-4">
            <div className="w-full p-8 bg-secondary/50 rounded-3xl border-2 border-dashed border-border flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Organization Code</p>
                <h3 className="text-5xl font-black tracking-[0.3em] text-foreground mb-6 pl-4 tabular-nums">{orgData?.inviteCode || "------"}</h3>
                <Button onClick={copyInviteCode} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-lg shadow-primary/20">
                    {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                    {copied ? "Copied" : "Copy Code"}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <h2 className="font-black uppercase tracking-widest text-xs">Personnel Intel / {employee?.name || 'Detail'}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-primary/20">
                <Settings size={14} className="mr-2" /> Member Access
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl border h-10 w-10">
                <MoreHorizontal size={20} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-12 pb-32">
          {/* Section 1: Hero Identity */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
            <EmployeeHeader 
                employee={employee} 
                totalHours={totalHours}
                hoursToday={hoursToday}
                topApp={topApp}
                joinedDate={joinedDate}
            />
          </motion.div>

          {/* Section 2: Attendance Ledger */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
            <AttendanceLedger employee={employee} workShifts={employee?.workShifts || []} joinedDate={joinedDate} />
          </motion.div>

          {/* Section 3: Cognitive Hub (AI + Live Intensity) */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
            <CognitiveHub employee={employee} intensity={intensity} />
          </motion.div>

          {/* Section 4: Real-time Interaction Matrix */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="space-y-6">
            <ActivityMatrix screenshots={screenshots} />
          </motion.div>

          {/* Section 4.5: Shift Idle Audit */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
            <YieldCalculator 
                employeeId={id as string} 
                employeeName={employee?.name || "Member"} 
                workShifts={employee?.workShifts || []} 
                screenshots={screenshots}
                joinedDate={joinedDate}
            />
          </motion.div>

          {/* Section 5: Transactional Activity Log */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
            <WorkHistory timeEntries={timeEntries} screenshots={screenshots} />
          </motion.div>
        </div>
      </main>
    </div>
  );
}