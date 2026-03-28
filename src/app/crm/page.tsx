"use client";

import React from "react";
import { useCRM } from "@/hooks/use-crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Activity,
  PhoneCall,
  StickyNote,
  Heart,
  Clock,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DealModal } from "@/components/dashboard/crm/DealModal";

export default function CRMPage() {
  const { leads, deals, contacts, config, entities, loading } = useCRM();
  const [isDealModalOpen, setIsDealModalOpen] = React.useState(false);

  // 10-year-old Logic & Business Calculations
  const activeLeads = leads; // Already filtered by !isDeleted in hook
  const activeDeals = deals; // Already filtered by !isDeleted in hook
  
  // "Money on the Table" - Total value of deals in progress
  const inProgressDeals = activeDeals.filter(d => !['won', 'lost'].includes(d.data.status));
  const moneyOnTable = inProgressDeals.reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  
  // "Our Success" - Deals won
  const wonDeals = activeDeals.filter(d => d.data.status === 'won');
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  
  // "Team Pulse" - Activity count in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentActions = entities.flatMap(e => e.history).filter(h => new Date(h.timestamp) > oneDayAgo);

  const stats = [
    {
      title: "New Friends",
      description: "People interested in us",
      value: activeLeads.length,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Money on the Table",
      description: "Possible deals happening",
      value: `$${moneyOnTable.toLocaleString()}`,
      icon: DollarSign,
      trend: "+8.4%",
      trendUp: true,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Active Deals",
      description: "Work we are doing now",
      value: inProgressDeals.length,
      icon: Target,
      trend: "Steady",
      trendUp: true,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Team Pulse",
      description: "Things we did today",
      value: recentActions.length,
      icon: Activity,
      trend: "Busy",
      trendUp: true,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Deal Modal */}
      <DealModal 
        isOpen={isDealModalOpen} 
        onOpenChange={setIsDealModalOpen}
        mode="create"
      />

      {/* Header Section: Professional but simple */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">
              Live Dashboard
            </span>
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter font-poppins text-foreground">
            How's Business <span className="text-blue-500">Today?</span>
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-base">
            Everything you need to know about your deals and friends in one place.
          </p>
        </div>
        
        <div className="hidden lg:flex items-center gap-6 p-4 rounded-2xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Success Rate</span>
                <span className="text-xl font-black text-foreground">
                    {activeDeals.length > 0 ? ((wonDeals.length / activeDeals.length) * 100).toFixed(0) : 0}%
                </span>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Won</span>
                <span className="text-xl font-black text-green-500">${totalWonValue > 1000000 ? (totalWonValue/1000000).toFixed(1) + 'M' : totalWonValue.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
          >
            <Card className="relative border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 group cursor-default overflow-hidden border-2 hover:border-blue-500/20 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner", stat.bgColor, stat.color)}>
                    <stat.icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                    stat.trendUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter text-foreground group-hover:translate-x-1 transition-transform duration-300">
                    {stat.value}
                  </h3>
                  <div className="mt-1">
                    <p className="text-xs font-black text-foreground uppercase tracking-tight">{stat.title}</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
              {/* Subtle background decoration */}
              <div className={cn("absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12 group-hover:rotate-0", stat.color)}>
                <stat.icon size={100} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Depth Section: Pipelines and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Pipeline Health - Simple wording */}
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Zap size={16} fill="currentColor" />
                </div>
                <div>
                    <CardTitle className="text-lg font-black tracking-tight uppercase">Where everyone is</CardTitle>
                    <CardDescription className="text-[11px] font-medium italic">How many people are in each stage of our journey.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} /> New Leads Progress
                    </h4>
                    <div className="space-y-5">
                        {(config.modules.leads.fields.find(f => f.key === 'status')?.options || []).map((status, i) => {
                            const count = activeLeads.filter(l => l.data.status === status.value).length;
                            const percentage = activeLeads.length > 0 ? (count / activeLeads.length) * 100 : 0;
                            return (
                            <div key={status.value} className="group cursor-help">
                                <div className="flex justify-between items-end mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("size-2 rounded-full", `bg-${status.color || 'blue'}-500`)} />
                                        <span className="text-xs font-black uppercase tracking-tighter">{status.label}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground">{count} {count === 1 ? 'person' : 'people'}</span>
                                </div>
                                <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/20">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                                        className={cn("h-full rounded-full shadow-lg", `bg-${status.color || 'blue'}-500`)}
                                    />
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Target size={14} /> Deal Momentum
                    </h4>
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[200px]">
                        <div className="size-16 rounded-full bg-background border-4 border-blue-500/20 flex items-center justify-center relative">
                            <Sparkles className="text-blue-500 animate-pulse" size={32} />
                            <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin" />
                        </div>
                        <div>
                            <p className="text-sm font-black tracking-tight">Focus on Deals</p>
                            <p className="text-[10px] text-muted-foreground italic max-w-[150px]">You have {inProgressDeals.length} active deals that need your love today.</p>
                        </div>
                        <Link href="/crm/leads">
                          <button className="px-4 py-2 bg-foreground text-background rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                              View Pipeline
                          </button>
                        </Link>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* The Activity Pile - Real time history */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-md flex flex-col">
          <CardHeader className="border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                    <Clock size={16} fill="currentColor" className="opacity-50" />
                </div>
                <div>
                    <CardTitle className="text-lg font-black tracking-tight uppercase">History Log</CardTitle>
                    <CardDescription className="text-[11px] font-medium italic">What the team has been doing lately.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-hidden">
            {entities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="size-16 rounded-3xl bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                  <Activity className="text-muted-foreground/50" size={32} />
                </div>
                <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">The pile is empty</h3>
                    <p className="text-[10px] text-muted-foreground italic mt-1">Add a lead or log a call to see activity here!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 relative h-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
                {entities
                  .flatMap(e => e.history.map(h => ({ ...h, entityName: e.name, entityType: e.type, entityId: e.id })))
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 10)
                  .map((activity, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4 relative z-10"
                    >
                      <div className={cn(
                        "size-8 rounded-xl shrink-0 flex items-center justify-center text-white shadow-lg border-2 border-background",
                        activity.type === 'Call' ? "bg-blue-500" : 
                        activity.type === 'Note' ? "bg-orange-500" :
                        activity.type === 'System' ? "bg-purple-500" : "bg-gray-500"
                      )}>
                        {activity.type === 'Call' ? <PhoneCall size={12} /> : 
                         activity.type === 'Note' ? <StickyNote size={12} /> : 
                         <Zap size={12} />}
                      </div>
                      <div className="flex-1 min-w-0 bg-secondary/20 p-3 rounded-2xl border border-border/30 hover:bg-secondary/40 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-black tracking-tight truncate">
                                {activity.userName || "User"}
                            </p>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase whitespace-nowrap bg-background px-1.5 py-0.5 rounded border border-border/50">
                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-[10px] text-foreground font-medium mt-1 leading-relaxed">
                            {activity.content} <span className="font-bold text-blue-500 cursor-pointer hover:underline">@{activity.entityName}</span>
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Encouragement */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 overflow-hidden relative group">
        <div className="relative z-10">
            <h3 className="text-2xl font-black tracking-tighter font-poppins">Ready to grow?</h3>
            <p className="text-blue-100 font-medium text-sm">Add a new lead and turn them into a success story today.</p>
        </div>
        <button 
          onClick={() => setIsDealModalOpen(true)}
          className="mt-4 md:mt-0 px-8 py-3 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 group-hover:scale-105 transition-all shadow-lg relative z-10"
        >
            + New Opportunity
        </button>
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </div>
    </div>
  );
}
