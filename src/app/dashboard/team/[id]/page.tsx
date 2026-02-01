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
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
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
                return tA - tB;
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
  const { totalHours, hoursToday, topApp, joinedDate } = useMemo(() => {
    if (!timeEntries.length) return { totalHours: "0.0", hoursToday: "0.0", topApp: "---", joinedDate: null };
    
    // Determine the official start date for this org
    const officialStart = employee?.attachedAt?.toDate ? employee.attachedAt.toDate() : (employee?.createdAt?.toDate ? employee.createdAt.toDate() : new Date(0));
    
    const today = format(new Date(), "yyyy-MM-dd");
    let totalSec = 0;
    let todaySec = 0;
    const appCounts: Record<string, number> = {};

    timeEntries.forEach(entry => {
      // STRICT FILTER: Skip entries before they joined
      const entryTime = entry.startTime?.toDate ? entry.startTime.toDate() : new Date(0);
      if (entryTime < officialStart) return;

      totalSec += entry.duration || 0;
      const entryDate = format(entryTime, "yyyy-MM-dd");
      
      if (entryDate === today) {
        todaySec += entry.duration || 0;
      }
      const app = entry.projectName || "Unknown";
      appCounts[app] = (appCounts[app] || 0) + (entry.duration || 0);
    });

    const top = Object.entries(appCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";

    return {
      totalHours: (totalSec / 3600).toFixed(1),
      hoursToday: (todaySec / 3600).toFixed(1),
      topApp: top,
      joinedDate: officialStart
    };
  }, [timeEntries, employee]);

  // 5. Calculate Live Intensity (Real-time Tension)
  const intensity = useMemo(() => {
    if (!screenshots.length) return 0;

    // Get the most recent logs (last 20 entries)
    const sorted = [...screenshots].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    const recent = sorted.slice(0, 20);
    
    if (!recent.length) return 0;

    // Check if the latest log is actually "live" (within last 10 mins OR in the future)
    const lastLogTime = (recent[0].timestamp?.seconds || 0) * 1000;
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    
    // Allow future timestamps (timezone diffs) or recent past
    if (lastLogTime < tenMinutesAgo) return 0; 

    // Calculate Average Activity (Keystrokes + Clicks + Mouse Distance)
    const avgActivity = recent.reduce((acc, curr) => {
      // Weighting: 
      // Keystrokes = 1
      // Clicks = 2
      // Mouse Distance = 1/100 (e.g. 870 dist -> 8.7 points)
      const score = (curr.keystrokes || 0) + ((curr.mouseClicks || 0) * 2) + ((curr.mouseDistance || 0) / 100);
      return acc + score;
    }, 0) / recent.length;

    // Normalize: 150 actions/min = 1.0 intensity (Standard Flow)
    // Cap at 2.0 (Hyper Intensity)
    return Math.min(avgActivity / 150, 2.0);
  }, [screenshots]);

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
            <AttendanceLedger employee={employee} timeEntries={timeEntries} />
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
                timeEntries={timeEntries}
                screenshots={screenshots}
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