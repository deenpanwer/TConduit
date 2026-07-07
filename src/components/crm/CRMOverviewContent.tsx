"use client";

import React, { useState, useMemo } from "react";
import { useCRM } from "@/hooks/use-crm";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  DollarSign, 
  ArrowUpRight, 
  Zap,
  Activity,
  PhoneCall,
  StickyNote,
  Heart,
  Clock,
  Sparkles,
  History,
  Bell,
  Search,
  Plus,
  ArrowRight,
  UserPlus,
  Briefcase,
  Phone,
  MessageSquare,
  Coins,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DealModal } from "@/components/crm/forms/DealModal";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";

const ChartTooltip = ({ active, payload, formatter }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    return (
      <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl text-xs text-white">
        <p className="font-black uppercase tracking-wider mb-1 text-[10px] text-gray-400">{payload[0].name || data.name}</p>
        <p className="font-bold text-sm">
          {formatter ? formatter(value, data) : value}
        </p>
      </div>
    );
  }
  return null;
};

export function CRMOverviewContent() {
  const router = useRouter();
  const { leads, deals, contacts, config, entities, loading, notes, calls, invoices = [] } = useCRM();
  const { user, userData } = useAuth();
  const [isDealModalOpen, setIsDealModalOpen] = React.useState(false);

  const { employees } = useTeam();

  // Tab 1: Leads Pipeline (Ditto Kanban data resolution)
  const leadsConfig = config?.modules?.leads;
  const leadsView = leadsConfig?.views?.find((v: any) => v.type === 'kanban') || leadsConfig?.views?.[0];
  const leadsKanbanField = leadsConfig?.fields?.find((f: any) => f.id === leadsView?.kanbanFieldId) || leadsConfig?.fields?.find((f: any) => f.key === 'status');
  const leadStatuses = leadsKanbanField?.options || [];

  const leadsChartData = useMemo(() => {
    if (!leadsKanbanField) return [];
    return leadStatuses.map((status: any) => {
      const count = leads.filter(l => {
        let stageValue = (l as any).status || l.data?.[leadsKanbanField.key];
        if (!stageValue || (typeof stageValue === 'string' && stageValue.trim() === '')) {
          stageValue = '__blank__';
        }
        return stageValue === status.value;
      }).length;
      return {
        name: status.label,
        count: count,
        color: status.color || "blue"
      };
    });
  }, [leads, leadStatuses, leadsKanbanField]);

  // Dynamic Follow Up Field detection
  const followUpField = config?.modules?.leads?.fields?.find((f: any) => 
    (f.label.toLowerCase().includes("follow") || f.key.toLowerCase().includes("follow")) &&
    f.type === "date"
  );
  const followUpKey = followUpField ? followUpField.key : null;

  // Tab 2: Follow-ups Health
  const followUpData = useMemo(() => {
    if (!followUpKey) {
      return [
        { name: "No Key Configured", value: leads.length, color: "#64748b", key: "none" }
      ];
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let missed = 0;
    let today = 0;
    let upcoming = 0;
    let none = 0;

    leads.forEach(lead => {
      if (lead.isDeleted) return;
      const val = lead.data?.[followUpKey] || (lead as any)[followUpKey];
      if (!val) {
        none++;
        return;
      }

      let dateVal: Date | null = null;
      if (typeof val.toDate === 'function') {
        dateVal = val.toDate();
      } else if (val.seconds !== undefined) {
        dateVal = new Date(val.seconds * 1000);
      } else {
        const clean = typeof val === 'string' ? val.replace(/(\d+)(st|nd|rd|th)/gi, '$1') : val;
        const parsed = new Date(clean);
        if (!isNaN(parsed.getTime())) {
          dateVal = parsed;
        }
      }

      if (!dateVal) {
        none++;
        return;
      }

      if (dateVal < startOfToday) {
        missed++;
      } else if (dateVal >= startOfToday && dateVal <= endOfToday) {
        today++;
      } else {
        upcoming++;
      }
    });

    return [
      { name: "Missed", value: missed, color: "#ef4444", key: "missed" },
      { name: "Today", value: today, color: "#f59e0b", key: "today" },
      { name: "Upcoming", value: upcoming, color: "#10b981", key: "upcoming" },
      { name: "None Scheduled", value: none, color: "#64748b", key: "none" }
    ];
  }, [leads, followUpKey]);

  const totalActionRequired = useMemo(() => {
    return followUpData
      .filter(d => d.key === "missed" || d.key === "today")
      .reduce((acc, curr) => acc + curr.value, 0);
  }, [followUpData]);

  // Extract Top 3 Overdue Follow-ups
  const overdueFollowups = useMemo(() => {
    if (!followUpKey) return [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return leads
      .filter(lead => {
        if (lead.isDeleted) return false;
        
        let stageValue = (lead as any).status || lead.data?.[leadsKanbanField?.key || 'status'];
        if (stageValue === 'won' || stageValue === 'lost') return false;

        const val = lead.data?.[followUpKey] || (lead as any)[followUpKey];
        if (!val) return false;

        let dateVal: Date | null = null;
        if (typeof val.toDate === 'function') {
          dateVal = val.toDate();
        } else if (val.seconds !== undefined) {
          dateVal = new Date(val.seconds * 1000);
        } else {
          const clean = typeof val === 'string' ? val.replace(/(\d+)(st|nd|rd|th)/gi, '$1') : val;
          const parsed = new Date(clean);
          if (!isNaN(parsed.getTime())) {
            dateVal = parsed;
          }
        }
        
        return dateVal ? dateVal < startOfToday : false;
      })
      .map(lead => {
        const val = lead.data?.[followUpKey] || (lead as any)[followUpKey];
        let dateVal: Date | null = null;
        if (typeof val.toDate === 'function') {
          dateVal = val.toDate();
        } else if (val.seconds !== undefined) {
          dateVal = new Date(val.seconds * 1000);
        } else {
          const clean = typeof val === 'string' ? val.replace(/(\d+)(st|nd|rd|th)/gi, '$1') : val;
          const parsed = new Date(clean);
          if (!isNaN(parsed.getTime())) {
            dateVal = parsed;
          }
        }
        return {
          lead,
          date: dateVal
        };
      })
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
      .slice(0, 3);
  }, [leads, followUpKey, leadsKanbanField]);

  // Tab 3: Deals Pipeline Revenue
  const dealsConfig = config?.modules?.deals;
  const dealsView = dealsConfig?.views?.find((v: any) => v.type === 'kanban') || dealsConfig?.views?.[0];
  const dealsKanbanField = dealsConfig?.fields?.find((f: any) => f.id === dealsView?.kanbanFieldId) || dealsConfig?.fields?.find((f: any) => f.key === 'status');
  const dealStages = dealsKanbanField?.options || [];

  const dealsChartData = useMemo(() => {
    if (!dealsKanbanField) return [];
    return dealStages.map((stage: any) => {
      const stageDeals = deals.filter(d => {
        let stageValue = (d as any).status || d.data?.[dealsKanbanField.key];
        if (!stageValue || (typeof stageValue === 'string' && stageValue.trim() === '')) {
          stageValue = '__blank__';
        }
        return stageValue === stage.value;
      });
      const totalVal = stageDeals.reduce((sum, d) => sum + (Number(d.data?.annualRevenue) || 0), 0);
      return {
        name: stage.label,
        value: totalVal,
        count: stageDeals.length,
        color: stage.color || "blue"
      };
    });
  }, [deals, dealStages, dealsKanbanField]);

  // Calculate Invoice Status Chart Data
  const invoicesChartData = useMemo(() => {
    const statuses = [
      { label: 'Draft', value: 'draft', color: '#64748b' },
      { label: 'Sent', value: 'sent', color: '#3b82f6' },
      { label: 'Paid', value: 'paid', color: '#10b981' },
      { label: 'Rejected', value: 'rejected', color: '#ef4444' },
      { label: 'Overdue', value: 'overdue', color: '#f59e0b' }
    ];

    return statuses.map(s => {
      const stageInvoices = (invoices || []).filter(inv => !inv.isDeleted && (inv.data?.status === s.value || (!inv.data?.status && s.value === 'draft')));
      const totalAmount = stageInvoices.reduce((sum, inv) => sum + (Number(inv.data?.amount) || 0), 0);
      return {
        name: s.label,
        value: totalAmount,
        count: stageInvoices.length,
        color: s.color
      };
    }).filter(s => s.count > 0);
  }, [invoices]);

  // Extract Top 3 High-Value Active Deals
  const topActiveDeals = useMemo(() => {
    return deals
      .filter(d => {
        let stageValue = (d as any).status || d.data?.[dealsKanbanField?.key || 'status'];
        return !['won', 'lost'].includes(stageValue || '');
      })
      .sort((a, b) => {
        const revA = Number(a.data?.annualRevenue) || 0;
        const revB = Number(b.data?.annualRevenue) || 0;
        return revB - revA;
      })
      .slice(0, 3);
  }, [deals, dealsKanbanField]);

  // Calculate Employee Workload Lead Assignments
  const employeeLeadsData = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    return employees
      .map(emp => {
        const count = leads.filter(l => {
          const assignedId = l.data?.assignedTo || (l as any).assignedTo;
          return assignedId === emp.id;
        }).length;
        
        return {
          name: emp.name || emp.displayName || "Unknown Employee",
          count: count,
          id: emp.id,
          avatar: emp.avatar || emp.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${emp.name || 'EMP'}`
        };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [leads, employees]);

  const unassignedCount = useMemo(() => {
    return leads.filter(l => {
      const assignedId = l.data?.assignedTo || (l as any).assignedTo;
      return !assignedId;
    }).length;
  }, [leads]);

  const employeeLeadsChartData = useMemo(() => {
    const list = [...employeeLeadsData];
    if (unassignedCount > 0) {
      list.push({
        name: "Unassigned",
        count: unassignedCount,
        id: "unassigned",
        avatar: ""
      });
    }
    return list;
  }, [employeeLeadsData, unassignedCount]);

  const getColorHex = (colorName: string) => {
    const map: Record<string, string> = {
      blue: "#3b82f6",
      green: "#10b981",
      emerald: "#10b981",
      orange: "#f97316",
      purple: "#8b5cf6",
      red: "#ef4444",
      rose: "#f43f5e",
      amber: "#f59e0b",
      yellow: "#eab308",
      pink: "#ec4899",
      slate: "#64748b",
      gray: "#94a3b8"
    };
    return map[colorName.toLowerCase()] || "#3b82f6";
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-secondary/50 rounded-lg animate-pulse" />
            <div className="h-6 w-64 bg-secondary/30 rounded-lg animate-pulse" />
          </div>
          <div className="h-14 w-40 bg-secondary/50 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-secondary/20 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-secondary/20 rounded-3xl animate-pulse" />
          <div className="h-96 bg-secondary/20 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Time-based calculations for trends
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Helper to filter by date
  const filterByDate = (list: any[], start: Date, end: Date = now) => {
    return list.filter(item => {
      const date = new Date(item.createdAt || item.timestamp);
      return date >= start && date <= end;
    });
  };

  // Logic for Trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / previous) * 100;
    return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
  };

  const currentLeads = filterByDate(leads, sevenDaysAgo).length;
  const previousLeads = filterByDate(leads, fourteenDaysAgo, sevenDaysAgo).length;
  const leadsTrend = calculateTrend(currentLeads, previousLeads);

  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.data.status));
  const moneyOnTable = activeDeals.reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  
  const currentDealsVal = filterByDate(activeDeals, sevenDaysAgo).reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  const previousDealsVal = filterByDate(activeDeals, fourteenDaysAgo, sevenDaysAgo).reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  const moneyTrend = calculateTrend(currentDealsVal, previousDealsVal);

  const currentActiveDeals = activeDeals.length;
  const previousActiveDeals = deals.filter(d => {
    const date = new Date(d.createdAt);
    return date <= sevenDaysAgo && !['won', 'lost'].includes(d.data.status);
  }).length;
  const dealsTrend = currentActiveDeals >= previousActiveDeals ? "Growing" : "Steady";

  const allHistory = entities.flatMap(e => e.history.map(h => ({ ...h, entityName: e.name })));

  const currentCalls = filterByDate(calls, sevenDaysAgo).length;
  const previousCalls = filterByDate(calls, fourteenDaysAgo, sevenDaysAgo).length;
  const callsTrend = calculateTrend(currentCalls, previousCalls);

  const currentNotes = filterByDate(notes, sevenDaysAgo).length;
  const previousNotes = filterByDate(notes, fourteenDaysAgo, sevenDaysAgo).length;
  const notesTrend = calculateTrend(currentNotes, previousNotes);

  const stats = [
    {
      title: "Total Leads",
      description: "New potential clients",
      value: leads.length,
      icon: Users,
      trend: leadsTrend,
      trendUp: !leadsTrend.startsWith('-'),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Total Quoted Price",
      description: "Potential pipeline value",
      value: `$${moneyOnTable > 1000000 ? (moneyOnTable / 1000000).toFixed(1) + 'M' : moneyOnTable.toLocaleString()}`,
      icon: DollarSign,
      trend: moneyTrend,
      trendUp: !moneyTrend.startsWith('-'),
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Active Deals",
      description: "Work we are doing now",
      value: activeDeals.length,
      icon: Target,
      trend: dealsTrend,
      trendUp: true,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Calls Logged",
      description: "Total conversations",
      value: calls.length,
      icon: PhoneCall,
      trend: callsTrend,
      trendUp: !callsTrend.startsWith('-'),
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Notes Added",
      description: "Total insights recorded",
      value: notes.length,
      icon: StickyNote,
      trend: notesTrend,
      trendUp: !notesTrend.startsWith('-'),
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    }
  ];

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <div className="p-4 md:p-6 space-y-8 w-full">
      <DealModal 
        isOpen={isDealModalOpen}
        onOpenChange={setIsDealModalOpen}
        mode="create" 
        deal={null}        
      />

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter font-poppins text-foreground leading-[0.9]">
            Hello, <span className="text-blue-500">{userData?.name?.split(' ')[0] || "there"}!</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg italic">
            Here's an overview of your pipeline and business.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsDealModalOpen(true)}
          className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 group"
        >
          <Plus className="mr-2 group-hover:rotate-90 transition-transform" /> 
          New Deal
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm hover:border-blue-500/20 transition-all group relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl", stat.bgColor, stat.color)}>
                    <stat.icon size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter text-foreground">
                    {stat.value}
                  </h3>
                  <p className="text-[10px] font-black text-foreground uppercase tracking-tight mt-1">{stat.title}</p>
                  <p className="text-[10px] text-muted-foreground italic font-medium">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mid Section: Pipeline & Workload & Recent People */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Leads Pipeline Card (1 Column) */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" /> Active Leads
              </CardTitle>
              <Link href="/crm/leads">
                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 hover:bg-blue-500/5 px-2">
                  View <ArrowRight size={10} className="ml-0.5" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-[10px] italic leading-tight mt-1">
              Current status of all leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-6">
            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsChartData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#f8fafc' }} width={60} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltip formatter={(v: any) => `${v} Lead(s)`} />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    {leadsChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal mt-4 border-t border-border/10 pt-3">
              Lead distribution by status.
            </p>
          </CardContent>
        </Card>

        {/* Follow-ups Health Card (2 Columns) */}
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                <Clock size={18} className="text-blue-500" /> Follow-up Health & Delayed Actions
              </CardTitle>
            </div>
            <CardDescription className="text-[10px] italic leading-tight mt-1">
              Workload and task schedule overview with active follow-up alarms.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              {/* Left Side: Pie Chart */}
              <div className="md:col-span-2 h-[180px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={followUpData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={66}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {followUpData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltip formatter={(v: any) => `${v} Lead(s)`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none z-0">
                  <span className="text-2xl font-black tracking-tighter text-foreground leading-none">
                    {totalActionRequired}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground flex flex-col items-center leading-[1]">
                    <span>Alerts</span>
                    <span>Today</span>
                  </span>
                </div>
              </div>

              {/* Right Side: Overdue Followups List */}
              <div className="md:col-span-3 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Top Overdue Follow-ups</h4>
                {overdueFollowups.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center bg-secondary/10 border border-dashed border-border/20 rounded-2xl">
                    <Clock className="text-muted-foreground/30 mb-1" size={20} />
                    <p className="text-[10px] text-muted-foreground font-medium italic">All caught up! No overdue follow-ups.</p>
                  </div>
                ) : (
                  overdueFollowups.map(({ lead, date }) => {
                    const daysOverdue = Math.floor((new Date().getTime() - (date?.getTime() || 0)) / (1000 * 60 * 60 * 24));
                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-all group"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-xs font-bold truncate text-foreground">{lead.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter truncate mt-0.5">
                            {lead.data.company || "Individual"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase">
                            {daysOverdue > 0 ? `${daysOverdue}d overdue` : "Today"}
                          </span>
                          <Link href={`/crm/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm" className="size-8 p-0 rounded-full hover:bg-blue-500/10 hover:text-blue-500">
                              <ArrowUpRight size={14} />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal mt-4 border-t border-border/10 pt-3">
              Missed follow-ups indicate delayed actions. Check notifications drawer to log reasons and reschedule.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Deals Revenue & Newest Friends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deals Pipeline Card (2 Columns) */}
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                <DollarSign size={18} className="text-blue-500" /> Deal Maturity Stage
              </CardTitle>
              <Link href="/crm/deals">
                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 hover:bg-blue-500/5 px-2">
                  View Deals <ArrowRight size={10} className="ml-0.5" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-[10px] italic leading-tight mt-1">
              Deal value organized by current pipeline stage.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              {/* Left Side: Bar Chart */}
              <div className="md:col-span-3 h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealsChartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#f8fafc' }} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                      {dealsChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Right Side: High Value Deals List */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Top Active Deals</h4>
                {topActiveDeals.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center bg-secondary/10 border border-dashed border-border/20 rounded-2xl">
                    <Briefcase className="text-muted-foreground/30 mb-1" size={20} />
                    <p className="text-[10px] text-muted-foreground font-medium italic">No active deals found.</p>
                  </div>
                ) : (
                  topActiveDeals.map((deal) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-all group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-bold truncate text-foreground">{deal.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter truncate mt-0.5">
                          {deal.data.organization || "Individual"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase">
                          ${(Number(deal.data.annualRevenue) || 0).toLocaleString()}
                        </span>
                        <Link href={`/crm/deals/${deal.id}`}>
                          <Button variant="ghost" size="sm" className="size-8 p-0 rounded-full hover:bg-blue-500/10 hover:text-blue-500">
                            <ArrowUpRight size={14} />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal mt-4 border-t border-border/10 pt-3">
              Track the progression of active deals towards successful closure.
            </p>
          </CardContent>
        </Card>

        {/* Newest Friends List Card (1 Column) */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black tracking-tight uppercase">Newest Leads</CardTitle>
            <CardDescription className="text-[10px] italic mt-1">Most recently acquired leads.</CardDescription>
          </CardHeader>
          <CardContent className="px-2 flex-1 flex flex-col justify-between pb-6">
            <div className="space-y-1">
              {recentLeads.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <Users className="text-muted-foreground/30 mb-2" size={32} />
                  <p className="text-xs text-muted-foreground font-medium italic">No leads found.</p>
                </div>
              ) : (
                recentLeads.map((lead, i) => (
                  <motion.div 
                    key={lead.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-secondary/50 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/crm/leads/${lead.id}`)}
                  >
                    <Avatar className="size-8 border border-border group-hover:scale-105 transition-transform">
                      <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${lead.name}`} />
                      <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{lead.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">
                        {lead.data.company || "Individual"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase shrink-0 px-2 py-0.5">
                      {lead.data.status || 'New'}
                    </Badge>
                  </motion.div>
                ))
              )}
            </div>
            {recentLeads.length > 0 && (
              <div className="pt-4 border-t border-border/10">
                <Link href="/crm/leads">
                  <Button variant="outline" className="w-full rounded-xl h-9 text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                    See all leads
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Employee Workload chart & Focus callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Employee Workload Card (2 Columns) */}
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
              <Users size={18} className="text-blue-500" /> Employee Workload
            </CardTitle>
            <CardDescription className="text-[10px] italic leading-tight mt-1">
              Active lead assignment distribution across team members.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              {/* Left Side: Horizontal Bar Chart */}
              <div className="md:col-span-3 h-[180px] w-full relative">
                {employeeLeadsChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <p className="text-xs text-muted-foreground italic">No workload data available.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeLeadsChartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#f8fafc' }} width={80} />
                      <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltip formatter={(v: any) => `${v} Lead(s)`} />} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Right Side: Team Leads Count List */}
              <div className="md:col-span-2 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Active Roster Assignments</h4>
                <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {employeeLeadsChartData.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">No team assignments.</p>
                  ) : (
                    employeeLeadsChartData.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-secondary/15 border border-border/20"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.id !== "unassigned" ? (
                            <Avatar className="size-6 border border-border">
                              <AvatarImage src={item.avatar} />
                              <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="size-6 rounded-full border border-border border-dashed bg-secondary/30 flex items-center justify-center text-[9px] font-bold text-muted-foreground">?</div>
                          )}
                          <span className="text-xs font-semibold truncate text-foreground leading-none">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full shrink-0">
                          {item.count} Lead(s)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Overview Card (1 Column) */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
              <Coins size={18} className="text-green-500" /> Invoices Issued
            </CardTitle>
            <CardDescription className="text-[10px] italic leading-tight mt-1">
              Billed revenue by status.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-6">
            {invoicesChartData.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-secondary/5 border border-dashed border-border/20 rounded-2xl h-full">
                <FileText className="text-muted-foreground/30 mb-2" size={32} />
                <p className="text-xs text-muted-foreground font-medium italic">No invoice data available.</p>
                <Link href="/crm/invoices" className="mt-3">
                  <Button variant="outline" className="rounded-xl h-8 text-[9px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                    Create Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Donut Chart */}
                <div className="h-[120px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoicesChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {invoicesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Billed</span>
                    <span className="text-xs font-black text-foreground">
                      ${invoicesChartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Status Breakdown List */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                  {invoicesChartData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2 rounded-xl bg-secondary/15 border border-border/20 hover:bg-secondary/30 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-bold text-muted-foreground truncate">{item.name} ({item.count})</span>
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0 ml-1">
                        ${item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals Callout Card (1 Column) */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm flex flex-col justify-between h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
              <Briefcase size={18} className="text-blue-500" /> Focus on Deals
            </CardTitle>
            <CardDescription className="text-[10px] italic mt-1">Requires team coordination.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-6">
            <div className="py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                You currently have <span className="text-foreground font-bold">{activeDeals.length} active deals</span> in progress.
              </p>
            </div>
            <div className="pt-4 border-t border-border/10">
              <Link href="/crm/deals">
                <Button variant="outline" className="w-full rounded-xl h-9 text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                  Go to Deals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lower Section: Notes & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Quick Notes */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div>
              <CardTitle className="text-xl font-black tracking-tight uppercase">Recent Notes</CardTitle>
              <CardDescription className="text-xs italic">Important things we wrote down.</CardDescription>
            </div>
            <Link href="/crm/notes">
              <Button variant="ghost" size="sm" className="size-8 p-0 rounded-full">
                <Plus size={18} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentNotes.length === 0 ? (
                <div className="col-span-2 py-12 text-center">
                  <StickyNote className="text-muted-foreground/20 mx-auto mb-2" size={40} />
                  <p className="text-xs text-muted-foreground italic">Write down your first note!</p>
                </div>
              ) : (
                recentNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <StickyNote size={40} />
                    </div>
                    <h5 className="text-sm font-black truncate pr-6">{note.name}</h5>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {note.data.content}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <div className="size-5 rounded-full bg-background border border-border flex items-center justify-center">
                        <ArrowUpRight size={10} className="text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Pile */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tight uppercase">Recent Activity</CardTitle>
            <CardDescription className="text-xs italic">What the team has been up to.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 relative ml-2">
              <div className="absolute left-4 top-1 bottom-1 w-px bg-border/50" />
              {allHistory.length === 0 ? (
                 <div className="py-12 text-center">
                  <Activity className="text-muted-foreground/20 mx-auto mb-2" size={40} />
                  <p className="text-xs text-muted-foreground italic">No activity yet. Let's make some moves!</p>
                </div>
              ) : (
                allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map((activity, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-6 relative z-10"
                  >
                    <div className={cn(
                      "size-8 rounded-xl shrink-0 flex items-center justify-center text-white shadow-lg border-2 border-background",
                      activity.type === 'Call' ? "bg-blue-500" : 
                      activity.type === 'Note' ? "bg-orange-500" :
                      activity.type === 'System' ? "bg-purple-500" : "bg-gray-500"
                    )}>
                      {activity.type === 'Call' ? <Phone size={12} /> : 
                       activity.type === 'Note' ? <StickyNote size={12} /> : 
                       <Zap size={12} />}
                    </div>
                    <div className="flex-1 bg-secondary/20 p-3 rounded-2xl border border-border/30">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black uppercase text-foreground">{activity.userName}</span>
                        <span className="text-[8px] font-bold text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.content} <span className="text-blue-500 font-bold">@{activity.entityName}</span>
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
