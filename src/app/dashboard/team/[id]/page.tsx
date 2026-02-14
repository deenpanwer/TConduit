"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, limit, updateDoc, getDoc } from "firebase/firestore";
import { format, addDays, startOfDay, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, MoreHorizontal } from "lucide-react";
import { EmployeeHeader } from "@/components/dashboard/employee/EmployeeHeader";
import { ActivityMatrix } from "@/components/dashboard/employee/ActivityMatrix";
import { WorkHistory } from "@/components/dashboard/employee/WorkHistory";
import { AttendanceLedger } from "@/components/dashboard/employee/AttendanceLedger";
import { CognitiveHub } from "@/components/dashboard/employee/CognitiveHub";
import { YieldCalculator } from "@/components/dashboard/employee/YieldCalculator";
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
 * 3. Screenshots: 1 listener for TODAY only at base.
 * 
 * NOTE ON NEW USERS: If a user joined today, a "limit(30)" query only bills for 
 * the 1 or 2 shifts they actually have. Firestore does not bill for the "empty" limit.
 */
export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, owner, loading: teamLoading } = useTeam();
  
  const [employeeDoc, setEmployeeDoc] = useState<any>(null);
  const [workShifts, setWorkShifts] = useState<any[]>([]);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]); 
  
  // --- PAGINATION STATES ---
  const [historyLimit, setHistoryLimit] = useState(5);
  const [shiftsLimit, setShiftsLimit] = useState(30); // Decreased from 100
  const [screenshotDays, setScreenshotDays] = useState(1); // Today only at base

  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Modals for employee actions
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showDeactivateEmployeeModal, setShowDeactivateEmployeeModal] = useState(false);
  const [showMemberAccessModal, setShowMemberAccessModal] = useState(false);

  const liveEmployee = useMemo(() => {
    if (owner?.id === id) return owner;
    return employees.find(e => e.id === id);
  }, [employees, owner, id]);

  const employee = useMemo(() => {
    if (!employeeDoc && !liveEmployee) return null;
    return { ...employeeDoc, ...liveEmployee };
  }, [employeeDoc, liveEmployee]);

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true;

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
      toast({ title: "Code Copied!", description: "Invite code ready for the Trac Diary app." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    // 1. Profile Document
    const unsubProfile = onSnapshot(doc(db, "users", id as string), (snapshot) => {
      if (snapshot.exists()) setEmployeeDoc(snapshot.data());
      else setLoading(false); 
    });

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
    const today = new Date();
    const dates = Array.from({ length: screenshotDays }, (_, i) => 
        format(subDays(today, i), "yyyy-MM-dd")
    );

    const unsubscribers: (() => void)[] = [];
    const allScreenshots: Record<string, any[]> = {};

    dates.forEach(dateStr => {
        const screenshotRef = collection(db, "users", id as string, "screenshots", dateStr, "images");
        const screenQuery = query(screenshotRef, orderBy("timestamp", "desc"), limit(60));
        
        const unsub = onSnapshot(screenQuery, (snapshot) => {
            allScreenshots[dateStr] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const merged = Object.values(allScreenshots).flat().sort((a, b) => {
                const tA = a.timestamp?.seconds || 0;
                const tB = b.timestamp?.seconds || 0;
                return tB - tA;
            });
            setScreenshots(merged);
            setLoading(false);
        }, () => setLoading(false)); 
        unsubscribers.push(unsub);
    });

    return () => {
      unsubProfile();
      unsubShifts();
      unsubTime();
      unsubscribers.forEach(u => u());
    };
  }, [id, historyLimit, shiftsLimit, screenshotDays]);

  const handleLoadMore = () => {
    setHistoryLimit(prev => prev + 5);
    // Progressively load more shifts and visual evidence when digging into history
    if (historyLimit >= shiftsLimit - 5) setShiftsLimit(prev => prev + 30);
    if (screenshotDays < 3) setScreenshotDays(prev => prev + 1);
  };

  const { currentShiftHours, todayTotalHours, topApp } = useMemo(() => {
    const officialStart = employee?.attachedAt?.toDate ? employee.attachedAt.toDate() : (employee?.createdAt?.toDate ? employee.createdAt.toDate() : new Date(0));
    const shiftsToProcess = (liveEmployee?.workShifts?.length > 0) ? liveEmployee.workShifts : workShifts;
    
    if (shiftsToProcess.length === 0) {
      return { currentShiftHours: "0.0", todayTotalHours: "0.0", topApp: "---" };
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    let activeShiftSeconds = 0;
    let todayTotalSeconds = 0;
    const todayAppBreakdown: Record<string, number> = {};

    shiftsToProcess.forEach((shift: any) => {
      const shiftStartTime = shift.startTime?.toDate ? shift.startTime.toDate() : new Date(shift.startTime);
      if (shiftStartTime < officialStart && !shift.id.startsWith(todayStr)) return; 

      if (shift.id.startsWith(todayStr)) {
        const shiftDuration = shift.liveMetrics?.totalSeconds || 0;
        todayTotalSeconds += shiftDuration;
        if (shift.status === 'active') activeShiftSeconds = shiftDuration;
        if (shift.liveBreakdown) {
          for (const appName in shift.liveBreakdown) {
            todayAppBreakdown[appName] = (todayAppBreakdown[appName] || 0) + (shift.liveBreakdown[appName] || 0);
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

    const focus = mostRecentShift.cognitiveReport.focusScore || 0;
    const productivity = mostRecentShift.cognitiveReport.productivityScore || 0;
    const velocity = mostRecentShift.cognitiveReport.velocity || 0;
    const compositeScore = (focus + productivity + velocity) / 3;
    const brief = mostRecentShift.cognitiveReport.aiBrief;
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
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <h2 className="font-black uppercase tracking-widest text-xs">Personnel Intel / {employee?.name || 'Detail'}</h2>
          </div>
          
          <div className="flex items-center gap-2">
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
                <AttendanceLedger employee={employee} workShifts={workShifts} joinedDate={joinedDate} />
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <CognitiveHub employee={employee} intensity={intensity} aiBrief={aiBrief} />
              </motion.div>

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
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-border bg-card shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle>Member Access for {employee?.name}</DialogTitle>
            <DialogDescription>
              Manage {employee?.name}'s role within the organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeMemberAccess} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memberRole" className="text-right">
                Role
              </Label>
              <Select defaultValue={employee?.role} name="memberRole">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}