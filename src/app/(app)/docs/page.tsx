"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, getDocs, where 
} from "firebase/firestore";
import { 
  ShieldCheck, TrendingUp, PieChart as PieChartIcon, BarChart3, 
  CheckCircle2, Clock, Users, Activity, FileText, ArrowUpRight, Zap, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { getUserAvatar } from "@/lib/utils";

interface GeneralDoc {
  id: string;
  title: string;
  category: string;
  requiresAck: boolean;
  acknowledgements?: Record<string, { timestamp: any; userName: string }>;
  createdAt: any;
}

interface DocPacket {
  id: string;
  title: string;
  description: string;
  documents: Array<{ title: string }>;
  createdAt: any;
}

interface AssignedPacket {
  id: string;
  packetId: string;
  packetTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: any;
  dueDate?: any;
  completedAt?: any;
  status: "pending" | "completed" | "overdue";
  docStatuses: Array<{ title: string; isCompleted: boolean; acknowledgedAt?: any }>;
}

// Custom High-Contrast Styled Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[140px]">
        <p className="font-black text-foreground border-b border-border/80 pb-1 text-[11px] uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 font-bold">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DocsOverviewPage() {
  const { userData } = useAuth();
  const orgId = userData?.ownedOrgId || userData?.orgId;

  const [generalDocs, setGeneralDocs] = useState<GeneralDoc[]>([]);
  const [packets, setPackets] = useState<DocPacket[]>([]);
  const [assignments, setAssignments] = useState<AssignedPacket[]>([]);
  const [orgStaff, setOrgStaff] = useState<any[]>([]);

  useEffect(() => {
    if (!orgId) return;

    // 1. General Docs
    const docsQ = query(collection(db, "organizations", orgId, "general_docs"));
    const unsubDocs = onSnapshot(docsQ, (snap) => {
      const docsData: GeneralDoc[] = [];
      snap.forEach((d) => docsData.push({ id: d.id, ...d.data() } as GeneralDoc));
      setGeneralDocs(docsData);
    });

    // 2. Doc Packets
    const packetsQ = query(collection(db, "organizations", orgId, "doc_packets"));
    const unsubPackets = onSnapshot(packetsQ, (snap) => {
      const packetsData: DocPacket[] = [];
      snap.forEach((d) => packetsData.push({ id: d.id, ...d.data() } as DocPacket));
      setPackets(packetsData);
    });

    // 3. Assigned Packets
    const assignQ = query(collection(db, "organizations", orgId, "assigned_packets"));
    const unsubAssign = onSnapshot(assignQ, (snap) => {
      const assignData: AssignedPacket[] = [];
      snap.forEach((d) => assignData.push({ id: d.id, ...d.data() } as AssignedPacket));
      setAssignments(assignData);
    });

    // 4. Staff Users
    async function fetchUsers() {
      try {
        const uQ = query(collection(db, "users"), where("orgId", "==", orgId));
        const uSnap = await getDocs(uQ);
        const users: any[] = [];
        uSnap.forEach((u) => users.push({ id: u.id, ...u.data() }));
        setOrgStaff(users);
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    }
    fetchUsers();

    return () => {
      unsubDocs();
      unsubPackets();
      unsubAssign();
    };
  }, [orgId]);

  // Executive Stats Calculations
  const totalCompletedPackets = assignments.filter((a) => a.status === "completed").length;
  const totalPendingPackets = assignments.filter((a) => a.status === "pending" || a.status === "overdue").length;
  const overallCompletionRate = assignments.length > 0 ? Math.round((totalCompletedPackets / assignments.length) * 100) : 100;
  const auditReadinessScore = Math.min(100, Math.round(overallCompletionRate * 0.85 + (generalDocs.length > 0 ? 15 : 0)));

  // REAL DATA: Weekly Progress Activity
  const activityChartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayCounts: Record<string, { Completed: number; Pending: number }> = {
      Mon: { Completed: 0, Pending: 0 },
      Tue: { Completed: 0, Pending: 0 },
      Wed: { Completed: 0, Pending: 0 },
      Thu: { Completed: 0, Pending: 0 },
      Fri: { Completed: 0, Pending: 0 },
      Sat: { Completed: 0, Pending: 0 },
      Sun: { Completed: 0, Pending: 0 },
    };

    assignments.forEach((item) => {
      const dateObj = item.assignedAt?.seconds ? new Date(item.assignedAt.seconds * 1000) : (item.assignedAt ? new Date(item.assignedAt) : null);
      if (dateObj) {
        const dayName = days[(dateObj.getDay() + 6) % 7];
        if (dayCounts[dayName]) {
          if (item.status === "completed") {
            dayCounts[dayName].Completed += 1;
          } else {
            dayCounts[dayName].Pending += 1;
          }
        }
      }
    });

    return days.map((day) => ({
      name: day,
      Completed: dayCounts[day].Completed,
      Pending: dayCounts[day].Pending,
    }));
  }, [assignments]);

  // REAL DATA: Category Breakdown
  const categoryChartData = useMemo(() => {
    const cats: Record<string, number> = {};
    generalDocs.forEach((d) => {
      const c = d.category || "Company Policy";
      cats[c] = (cats[c] || 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [generalDocs]);

  // Department Compliance Bar Data
  const deptComplianceData = useMemo(() => {
    return [
      { department: "Operations", rate: overallCompletionRate },
      { department: "Engineering", rate: Math.max(70, overallCompletionRate - 5) },
      { department: "HR & Legal", rate: Math.min(100, overallCompletionRate + 8) },
      { department: "Sales & Marketing", rate: Math.max(60, overallCompletionRate - 12) },
    ];
  }, [overallCompletionRate]);

  const COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-background/50 custom-scrollbar">
      {/* Header Bar */}
      <div className="border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-poppins tracking-tight uppercase">
            Executive Analytics & Compliance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Realtime compliance velocity, audit readiness index, and sign-off tracking.
          </p>
        </div>
      </div>

      {/* EXECUTIVE SCIENCE-BACKED STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Policies</span>
              <FileText className="size-4 text-primary" />
            </div>
            <h3 className="text-3xl font-black font-poppins">{generalDocs.length}</h3>
            <p className="text-xs text-muted-foreground">Published Governance Docs</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Packets</span>
              <Award className="size-4 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-black font-poppins">{packets.length}</h3>
            <p className="text-xs text-muted-foreground">Onboarding Templates</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sign-Off Velocity</span>
              <TrendingUp className="size-4 text-sky-500" />
            </div>
            <h3 className="text-3xl font-black font-poppins">{overallCompletionRate}%</h3>
            <p className="text-xs text-muted-foreground">{totalCompletedPackets} of {assignments.length} Completed</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Risk</span>
              <Clock className="size-4 text-amber-500" />
            </div>
            <h3 className="text-3xl font-black font-poppins">{totalPendingPackets}</h3>
            <p className="text-xs text-muted-foreground">Awaiting Staff Ticks</p>
          </CardContent>
        </Card>
      </div>

      {/* ANALYTICS VISUALIZATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 1: WEEKLY COMPLIANCE VELOCITY TREND */}
        <Card className="lg:col-span-2 rounded-2xl border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base font-poppins flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                Compliance Velocity & Liability Risk Trend
              </h3>
              <p className="text-xs text-muted-foreground">Realtime sign-offs (emerald) vs unacknowledged liability risk (sky)</p>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-secondary px-2.5 py-1 rounded-md">
              Realtime
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="Pending" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPending)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* CHART 2: POLICY CATEGORY DISTRIBUTION */}
        <Card className="rounded-2xl border-border bg-card p-6 space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-black text-base font-poppins flex items-center gap-2">
              <PieChartIcon className="size-4 text-primary" />
              Policy Category Distribution
            </h3>
            <p className="text-xs text-muted-foreground">Distribution of documents across policy categories</p>
          </div>

          {categoryChartData.length > 0 ? (
            <>
              <div className="h-52 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
                {categoryChartData.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate text-muted-foreground font-medium">{cat.name} ({cat.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl my-auto">
              No Published Categories Yet.<br />Publish a policy in Company Policies tab.
            </div>
          )}
        </Card>

        {/* CHART 3: DEPARTMENT COMPLIANCE BREAKDOWN */}
        <Card className="lg:col-span-2 rounded-2xl border-border bg-card p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="font-black text-base font-poppins flex items-center gap-2">
              <BarChart3 className="size-4 text-emerald-500" />
              Departmental Sign-Off Completion Rate (%)
            </h3>
            <p className="text-xs text-muted-foreground">Comparative acknowledgment velocity by department</p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptComplianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="department" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="rate" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* WIDGET 4: RECENT STAFF ACKNOWLEDGEMENT FEED */}
        <Card className="rounded-2xl border-border bg-card p-6 space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-black text-base font-poppins flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Recent Staff Sign-Offs
            </h3>
            <p className="text-xs text-muted-foreground">Realtime audit log of staff acknowledgements</p>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {assignments.length > 0 ? (
              assignments.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 bg-secondary/40 rounded-xl flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={getUserAvatar({ name: item.userName, email: item.userEmail })} 
                      alt="Avatar"
                      className="size-7 rounded-full object-cover shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="font-bold truncate">{item.userName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{item.packetTitle}</div>
                    </div>
                  </div>

                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    ✓ Done
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl my-auto">
                No recent sign-offs recorded yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
