"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, limit, updateDoc, getDoc } from "firebase/firestore";
import { format, addDays, startOfDay, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, MoreHorizontal, ShieldCheck, Menu } from "lucide-react";
import { EmployeeHeader } from "@/components/dashboard/employee/EmployeeHeader";
import { ShiftPulse } from "@/components/dashboard/employee/ShiftPulse";
import { RecentEvidence } from "@/components/dashboard/employee/RecentEvidence";
import { ActivityMatrix } from "@/components/dashboard/employee/ActivityMatrix";
import { WorkHistory } from "@/components/dashboard/employee/WorkHistory";
import { AttendanceLedger } from "@/components/dashboard/employee/AttendanceLedger";
import { CognitiveHub } from "@/components/dashboard/employee/CognitiveHub";
import { YieldCalculator } from "@/components/dashboard/employee/YieldCalculator";
import { WorkflowTimeline } from "@/components/dashboard/employee/WorkflowTimeline";
import { motion } from "framer-motion";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Ticket, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/hooks/use-team";
import { PaywallScreen } from "@/components/dashboard/PaywallScreen";
import { InviteModal } from "@/components/dashboard/InviteModal";
import { SubscriptionBadge } from "@/components/dashboard/SubscriptionBadge";
import { IntelligenceModal } from "@/components/dashboard/IntelligenceModal";
import { cn } from "@/lib/utils";
import { GlobalDateSelector } from "@/components/dashboard/shared/GlobalDateSelector";
import { AIPersonnelPulse } from "@/components/dashboard/employee/AIPersonnelPulse";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

/**
 * EmployeeDetailPage: Deep-Dive Data Orchestration
 * -----------------------------------------------
 * This page manages temporary listeners for historical and deep-dive data.
 *
 * COST OPTIMIZATION (Surgical Reads):
 * 1. Shifts: Limited to last 30 at base (Bills only for existing docs).
 * 2. Time Entries: Limited to 5 at base.
 * 3. Screenshots: 1 listener for SELECTED_DATE only at base.
 *
 * NOTE ON NEW USERS: If a user joined today, a "limit(30)" query only bills for
 * the 1 or 2 shifts they actually have. Firestore does not bill for the "empty" limit.
 */
export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, owner, loading: teamLoading, selectedDate, setSelectedDate } = useTeam();
  const { setIsMobileOpen } = useSidebar();
  
  const [employeeDoc, setEmployeeDoc] = useState<any>(null);
  const [workShifts, setWorkShifts] = useState<any[]>([]);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]); 
  
  // --- PAGINATION STATES ---
  const [historyLimit, setHistoryLimit] = useState(5);
  const [shiftsLimit, setShiftsLimit] = useState(30); // Decreased from 100
  // const [screenshotDays, setScreenshotDays] = useState(1); // Today only at base - now dynamic based on selectedDate

  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const { toast } = useToast();

  // Modals for employee actions
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showDeactivateEmployeeModal, setShowDeactivateEmployeeModal] = useState(false);
  const [showMemberAccessModal, setShowMemberAccessModal] = useState(false);
  const [selectedModalRole, setSelectedModalRole] = useState("");

  // Helper to extract JS Date safely
  const getDate = (ts: any) => {
    if (!ts) return undefined;
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const liveEmployee = useMemo(() => {
    if (owner?.id === id) return owner;
    return employees.find(e => e.id === id);
  }, [employees, owner, id]);

  // Consolidate employee data source
  const employee = useMemo(() => {
    if (!employeeDoc && !liveEmployee) return null;
    return { ...employeeDoc, ...liveEmployee };
  }, [employeeDoc, liveEmployee]);

  useEffect(() => {
    if (employee?.role) {
      setSelectedModalRole(employee.role.toLowerCase());
    }
  }, [showMemberAccessModal, employee]);

  useEffect(() => {
    if (!id) return;
    // Full loading only on employee change
    setLoading(true);
    
    // 1. Profile Document
    const unsubProfile = onSnapshot(doc(db, "users", id as string), (snapshot) => {
      if (snapshot.exists()) {
        setEmployeeDoc(snapshot.data());
        // We set loading false here because profile is the core identity
        setLoading(false); 
      } else {
        setLoading(false); 
      }
    }, () => setLoading(false));

    return () => unsubProfile();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // We do NOT call setLoading(true) here for date/limit changes
    // This allows the UI to stay interactive while the new snapshot arrives.

    // 2. Shift History (Limited for Ledger preview)
    const shiftsRef = collection(db, "users", id as string, "workShifts");
    const shiftsQuery = query(shiftsRef, orderBy("startTime", "desc"), limit(shiftsLimit));
    const unsubShifts = onSnapshot(shiftsQuery, (snapshot) => {
      setWorkShifts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Time Entries (Paginated Engagement Log)
    const timeRef = collection(db, "users", id as string, "timeEntries");
    const timeQuery = query(timeRef, orderBy("startTime", "desc"), limit(historyLimit));
    const unsubTime = onSnapshot(timeQuery, (snapshot) => {
      setTimeEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Visual Evidence (Snapshot per day)
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    const screenshotRef = collection(db, "users", id as string, "screenshots", dateStr, "images");
    const screenQuery = query(screenshotRef, orderBy("timestamp", "desc"), limit(60));
    
    const unsubScreenshots = onSnapshot(screenQuery, (snapshot) => {
        setScreenshots(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }); 

    return () => {
      unsubShifts();
      unsubTime();
      unsubScreenshots();
    };
  }, [id, historyLimit, shiftsLimit, selectedDate]);

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true;

  const minEmployeeDate = useMemo(() => {
    return employee?.attachedAt?.toDate ? employee.attachedAt.toDate() : (employee?.createdAt?.toDate ? employee.createdAt.toDate() : undefined);
  }, [employee]);

  const handleLoadMore = () => {
    setHistoryLimit(prev => prev + 5);
    // Progressively load more shifts when digging into history
    if (historyLimit >= shiftsLimit - 5) setShiftsLimit(prev => prev + 30);
  };

  const { currentShiftHours, todayTotalHours, topApp } = useMemo(() => {
    const officialStart = employee?.attachedAt?.toDate ? employee.attachedAt.toDate() : (employee?.createdAt?.toDate ? employee.createdAt.toDate() : new Date(0));
    const shiftsToProcess = (liveEmployee?.workShifts?.length > 0) ? liveEmployee.workShifts : workShifts;
    
    if (shiftsToProcess.length === 0) {
      return { currentShiftHours: "0.0", todayTotalHours: "0.0", topApp: "---" };
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let activeShiftSeconds = 0;
    let todayTotalSeconds = 0;
    const todayAppBreakdown: Record<string, number> = {};

    shiftsToProcess.forEach((shift: any) => {
      const shiftStartTime = shift.startTime?.toDate ? shift.startTime.toDate() : new Date(shift.startTime);
      if (shiftStartTime < officialStart && !shift.id.startsWith(dateStr)) return; 

      if (shift.id.startsWith(dateStr)) {
        const shiftDuration = shift.liveMetrics?.totalSeconds || 0;
        todayTotalSeconds += shiftDuration;
        if (shift.status === 'active') activeShiftSeconds = shiftDuration;
        
        if (shift.liveBreakdown) {
          for (const appName in shift.liveBreakdown) {
            const data = shift.liveBreakdown[appName];
            const secs = typeof data === 'number' ? data : (data as any)?.totalSeconds || 0;
            todayAppBreakdown[appName] = (todayAppBreakdown[appName] || 0) + secs;
          }
        }
      }
    });

    const top = Object.entries(todayAppBreakdown)
      .sort(([, secondsA], [, secondsB]) => secondsB - secondsA)
      .find(([appName]) => appName !== "Idle")?.[0] || "---"; 

    return {
      currentShiftHours: (activeShiftSeconds / 3600).toFixed(1),
      todayTotalHours: (todayTotalSeconds / 3600).toFixed(1),
      topApp: top.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };
  }, [employee, liveEmployee, workShifts]);  

  const joinedDate = useMemo(() => {
    return employee?.attachedAt?.toDate ? employee.attachedAt.toDate() : (employee?.createdAt?.toDate ? employee.createdAt.toDate() : new Date(0));
  }, [employee]);

  const activeShift = useMemo(() => {
    return workShifts.find((s: any) => s.status === 'active' || (s.id.startsWith(format(new Date(), "yyyy-MM-dd")) && !s.endTime));
  }, [workShifts]);

  const { intensity, aiBrief } = useMemo(() => {
    const shiftsForIntensity = (liveEmployee?.workShifts?.length > 0) ? liveEmployee.workShifts : workShifts;
    if (shiftsForIntensity.length === 0) return { intensity: 0, aiBrief: null };

    const relevantShifts = shiftsForIntensity
      .filter((s: any) => 
        s.cognitiveReport?.velocity !== undefined && s.cognitiveReport.velocity !== null &&
        (s.status === 'active' || (s.liveMetrics?.totalSeconds > 0 && s.endTime))
      )
      .sort((a: any, b: any) => {
        const dateA = a.startTime?.toDate ? a.startTime.toDate().getTime() : new Date(a.startTime).getTime();
        const dateB = b.startTime?.toDate ? b.startTime.toDate().getTime() : new Date(b.startTime).getTime();
        return dateB - dateA;
      });
      
    const mostRecentShift = relevantShifts[0]; 
    if (!mostRecentShift) return { intensity: employee?.heartbeat?.isCurrentlyRunning ? 0.1 : 0, aiBrief: null };

    // Root-level fallback for New Schema
    const focus = mostRecentShift.focusScore ?? mostRecentShift.cognitiveReport?.focusScore ?? 0;
    const productivity = mostRecentShift.productivityScore ?? mostRecentShift.cognitiveReport?.productivityScore ?? 0;
    const velocity = mostRecentShift.velocity ?? mostRecentShift.cognitiveReport?.velocity ?? 0;
    const brief = mostRecentShift.aiBrief ?? mostRecentShift.cognitiveReport?.aiBrief;

    const compositeScore = (focus + productivity + velocity) / 3;
    let normalizedIntensity = Math.min(Math.max(compositeScore / 70, 0), 1.5);
    if (employee?.heartbeat?.isCurrentlyRunning && normalizedIntensity < 0.1) normalizedIntensity = 0.1; 

    return { intensity: normalizedIntensity, aiBrief: brief };
  }, [employee, liveEmployee, workShifts]);

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !employee) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;

    try {
      await updateDoc(doc(db, "users", id as string), {
        name: name,
        role: role,
        updatedAt: new Date(),
      });
      toast({ title: "Employee Updated", description: `${name}'s profile has been updated.` });
      setShowEditEmployeeModal(false);
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateEmployee = async () => {
    if (!id || !employee) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", id as string), {
        active: false,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      });
      toast({ title: "Employee Deactivated", description: `${employee.name} has been deactivated.` });
      setShowDeactivateEmployeeModal(false);
      router.push("/dashboard"); // Redirect to dashboard after deactivating
    } catch (error: any) {
      toast({ title: "Deactivation Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeMemberAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !employee) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const role = formData.get("memberRole") as string;

    try {
      await updateDoc(doc(db, "users", id as string), {
        role: role,
        updatedAt: new Date(),
      });
      toast({ title: "Member Role Updated", description: `${employee.name}'s role has been changed to ${role}.` });
      setShowMemberAccessModal(false);
    } catch (error: any) {
      toast({ title: "Role Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading || teamLoading) {
    return (
      <main className="flex-1 p-8 space-y-12 overflow-hidden">
        <Shimmer className="h-16 w-full rounded-2xl" />
        <Shimmer className="h-96 w-full rounded-[3rem]" />
        <Shimmer className="h-48 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Shimmer className="h-[400px] rounded-[2.5rem]" />
          <Shimmer className="h-[400px] rounded-[2.5rem]" />
        </div>
      </main>
    );
  }

  return (
    <>
      <IntelligenceModal 
        isOpen={showIntelligenceModal}
        onOpenChange={setShowIntelligenceModal}
        userId={id as string}
        userName={employee?.name || "Member"}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <GlobalDateSelector 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
              minDate={minEmployeeDate} 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <SubscriptionBadge orgData={orgData} userData={userData} />
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowIntelligenceModal(true)} 
                className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-orange-500/20 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30"
            >
                <ShieldCheck size={14} className="mr-2" /> Define Prime Apps for {employee?.name?.split(' ')[0] || "Member"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMemberAccessModal(true)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-primary/20">
                <Settings size={14} className="mr-2" /> Member Access
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl border h-10 w-10">
                    <MoreHorizontal size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Employee Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEditEmployeeModal(true)}>Edit Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeactivateEmployeeModal(true)} className="text-destructive focus:text-destructive">Deactivate Employee</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-12 pb-32">
          {!isSubscriptionActive ? (
            <PaywallScreen orgData={orgData} userData={userData} />
          ) : (
            <>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <EmployeeHeader 
                    employee={employee} 
                    totalHours={todayTotalHours}
                    hoursToday={currentShiftHours}
                    topApp={topApp}
                    joinedDate={joinedDate}
                />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <AIPersonnelPulse 
                  employee={employee} 
                  workShifts={liveEmployee?.workShifts || workShifts} 
                  screenshots={screenshots} 
                />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <ShiftPulse activeShift={activeShift} isOnline={employee?.heartbeat?.isCurrentlyRunning} />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <RecentEvidence screenshots={screenshots} />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <AttendanceLedger employee={employee} workShifts={workShifts} joinedDate={joinedDate} />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <WorkflowTimeline workShifts={workShifts} />
              </motion.div>

              {/* <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <CognitiveHub employee={employee} intensity={intensity} aiBrief={aiBrief} />
              </motion.div> */}

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="space-y-6">
                <ActivityMatrix workShifts={workShifts} screenshots={screenshots} />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <YieldCalculator 
                    employeeId={id as string} 
                    employeeName={employee?.name || "Member"} 
                    workShifts={workShifts} 
                    screenshots={screenshots}
                    joinedDate={joinedDate}
                />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <WorkHistory 
                  timeEntries={timeEntries} 
                  screenshots={screenshots} 
                  onLoadMore={handleLoadMore}
                />
              </motion.div>
            </>
          )}
        </div>
      </main>

      {/* Edit Employee Modal */}
      <Dialog open={showEditEmployeeModal} onOpenChange={setShowEditEmployeeModal}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-border bg-card shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle>Edit Employee Profile</DialogTitle>
            <DialogDescription>
              Make changes to {employee?.name}'s profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployee} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                defaultValue={employee?.name}
                className="col-span-3"
                name="name"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                defaultValue={employee?.role}
                className="col-span-3"
                name="role"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Employee AlertDialog */}
      <AlertDialog open={showDeactivateEmployeeModal} onOpenChange={setShowDeactivateEmployeeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will deactivate {employee?.name}'s account. They will no longer be able to log in or track time within your organization. Their past data will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateEmployee}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Member Access Modal */}
      <Dialog open={showMemberAccessModal} onOpenChange={setShowMemberAccessModal}>
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="p-8 pb-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-widest">Manage Access & Authority</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground/60 pt-1">
                Changing {employee?.name}'s tier will impact their reach across the organization.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleChangeMemberAccess}>
            <div className="px-8 py-2 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {["Employee", "Manager", "Founder"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedModalRole(r.toLowerCase())}
                    className={cn(
                      "px-4 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                      selectedModalRole === r.toLowerCase()
                        ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10"
                        : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <input type="hidden" name="memberRole" value={selectedModalRole} />

              <div className="bg-secondary/30 rounded-3xl p-6 border border-border/50">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Authority Preview</h4>
                
                <div className="space-y-5">
                  {selectedModalRole === "employee" ? (
                    <>
                      <div className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">Self-Monitoring Only</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">Can only view their own screenshots and productivity pulse.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">Task Execution</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">Can update status and subtasks for items explicitly assigned to them.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 opacity-40">
                        <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">Restricted Architecture</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">Cannot create organization tasks or edit high-level metadata.</p>
                        </div>
                      </div>
                    </>
                  ) : selectedModalRole === "manager" ? (
                    <>
                      <div className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">Full Team Visibility</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Can audit screenshots and pulses for ALL organization members.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">Task Architecture</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Full permission to create, delete, and architect the organization's task list.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">No Org Control</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">Cannot modify billing, invite other managers, or delete the organization.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">Full Organizational Reach</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Unrestricted access to all data, settings, and team monitoring.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">Founder Privileges</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Can manage subscription, billing, and the organization's existence.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowMemberAccessModal(false)}
                className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-border/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={selectedModalRole === (employee?.role?.toLowerCase() || "")}
                className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
              >
                Confirm {selectedModalRole} Access
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}