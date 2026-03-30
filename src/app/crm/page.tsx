"use client";

import React, { useState } from "react";
import { useCRM } from "@/hooks/use-crm";
import { useAuth } from "@/hooks/use-auth";
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
  Sparkles,
  History,
  Bell,
  Search,
  Plus,
  ArrowRight,
  UserPlus,
  Briefcase,
  Phone,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
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

export default function CRMPage() {
  const { leads, deals, contacts, config, entities, loading, notes, calls } = useCRM();
  const { user, userData } = useAuth();
  const [isDealModalOpen, setIsDealModalOpen] = React.useState(false);

  // Time-based calculations for trends
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

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

  // 1. New Friends (Leads)
  const currentLeads = filterByDate(leads, sevenDaysAgo).length;
  const previousLeads = filterByDate(leads, fourteenDaysAgo, sevenDaysAgo).length;
  const leadsTrend = calculateTrend(currentLeads, previousLeads);

  // 2. Money on the Table (Revenue)
  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.data.status));
  const moneyOnTable = activeDeals.reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  
  const currentDealsVal = filterByDate(activeDeals, sevenDaysAgo).reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  const previousDealsVal = filterByDate(activeDeals, fourteenDaysAgo, sevenDaysAgo).reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
  const moneyTrend = calculateTrend(currentDealsVal, previousDealsVal);

  // 3. Active Deals Count
  const currentActiveDeals = activeDeals.length;
  const previousActiveDeals = deals.filter(d => {
    const date = new Date(d.createdAt);
    return date <= sevenDaysAgo && !['won', 'lost'].includes(d.data.status); // This is an approximation
  }).length;
  const dealsTrend = currentActiveDeals >= previousActiveDeals ? "Growing" : "Steady";

  // 4. Team Pulse (Activity)
  const allHistory = entities.flatMap(e => e.history.map(h => ({ ...h, entityName: e.name })));
  const currentActions = filterByDate(allHistory, oneDayAgo).length;
  const previousActions = filterByDate(allHistory, twoDaysAgo, oneDayAgo).length;
  const pulseTrend = currentActions >= previousActions ? "Busy" : "Quiet";

  const stats = [
    {
      title: "New Friends",
      description: "People interested in us",
      value: leads.length,
      icon: Users,
      trend: leadsTrend,
      trendUp: !leadsTrend.startsWith('-'),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Money on the Table",
      description: "Possible deals happening",
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
      title: "Team Pulse",
      description: "Things we did today",
      value: currentActions,
      icon: Activity,
      trend: pulseTrend,
      trendUp: true,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <div className="min-h-screen bg-background/50">
      {/* Header with Drawers and Profile */}
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black tracking-tighter uppercase font-poppins text-foreground">
              Business <span className="text-blue-500">Dashboard</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* History Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                  <History size={20} className="text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black tracking-tighter">Timeline</SheetTitle>
                  <SheetDescription>Everything that happened recently.</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-6 pr-4">
                  <div className="space-y-6">
                    {allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20).map((item, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== 19 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-border/50" />}
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 z-10 border border-border">
                          {item.type === 'Call' ? <Phone size={12} /> : item.type === 'Note' ? <StickyNote size={12} /> : <Zap size={12} />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-foreground">{item.userName}</p>
                            <span className="text-[10px] text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.content}</p>
                          {item.entityName && <Badge variant="secondary" className="mt-2 text-[10px] uppercase font-black tracking-widest">{item.entityName}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Notifications Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary relative">
                  <Bell size={20} className="text-muted-foreground" />
                  {currentLeads > 0 && <span className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full border-2 border-background" />}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black tracking-tighter text-blue-500">Updates</SheetTitle>
                  <SheetDescription>What's new while you were away.</SheetDescription>
                </SheetHeader>
                <div className="mt-8 flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="size-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="text-blue-500" size={40} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">You're all caught up!</h3>
                    <p className="text-xs text-muted-foreground mt-1 italic">We'll let you know when something important happens.</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="h-6 w-px bg-border/50 mx-2" />

            <Avatar className="size-9 border-2 border-border/50 ring-2 ring-background transition-all hover:scale-110 cursor-pointer">
              <AvatarImage src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'trac'}`} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        <DealModal 
          isOpen={isDealModalOpen} 
          onOpenChange={setIsDealModalOpen}
          mode="create"
        />

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter font-poppins text-foreground leading-[0.9]">
              Hello, <span className="text-blue-500">{userData?.name?.split(' ')[0] || "there"}!</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg italic">
              Here's how we're doing with our friends and business.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <Badge variant={stat.trendUp ? "default" : "destructive"} className={cn(
                      "text-[10px] font-black uppercase tracking-widest bg-opacity-10",
                      stat.trendUp ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                    )}>
                      {stat.trend}
                    </Badge>
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

        {/* Mid Section: Pipeline & Recent People */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Progress Tracker */}
          <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div>
                <CardTitle className="text-xl font-black tracking-tight uppercase">Current Progress</CardTitle>
                <CardDescription className="text-xs italic">Where everyone is in our journey.</CardDescription>
              </div>
              <Link href="/crm/leads">
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 hover:bg-blue-500/5">
                  View All <ArrowRight className="ml-1" size={12} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <UserPlus size={14} /> New Friends Progress
                  </p>
                  <div className="space-y-5">
                    {(config.modules.leads.fields.find(f => f.key === 'status')?.options || []).map((status) => {
                      const count = leads.filter(l => l.data.status === status.value).length;
                      const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                      return (
                        <div key={status.value} className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold uppercase">{status.label}</span>
                            <span className="text-[10px] font-medium text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={cn("h-full rounded-full", `bg-${status.color || 'blue'}-500`)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center text-center p-8 rounded-3xl bg-blue-500/5 border border-dashed border-blue-500/20">
                  <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Briefcase className="text-blue-500" size={32} />
                  </div>
                  <h4 className="font-black text-lg tracking-tight">Focus on Deals</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-[200px]">
                    You have <span className="text-foreground font-bold">{activeDeals.length} deals</span> that need your attention.
                  </p>
                  <Link href="/crm/deals">
                    <Button className="rounded-full px-6 font-black uppercase tracking-widest text-[10px] h-9">
                      Go to Deals
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Newest Friends List */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tight uppercase">Newest Friends</CardTitle>
              <CardDescription className="text-xs italic">People who just joined us.</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-1">
                {recentLeads.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <Users className="text-muted-foreground/30 mb-2" size={32} />
                    <p className="text-xs text-muted-foreground font-medium italic">No friends here yet. Let's find some!</p>
                  </div>
                ) : (
                  recentLeads.map((lead, i) => (
                    <motion.div 
                      key={lead.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 transition-colors group cursor-pointer"
                    >
                      <Avatar className="size-10 border border-border group-hover:scale-105 transition-transform">
                        <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${lead.name}`} />
                        <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                          {lead.data.company || "Individual"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase">
                        {lead.data.status || 'New'}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
              {recentLeads.length > 0 && (
                <div className="p-4 pt-2">
                  <Link href="/crm/leads">
                    <Button variant="outline" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                      See all friends
                    </Button>
                  </Link>
                </div>
              )}
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

          {/* Activity Pile - Re-styled for simplicity */}
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

        {/* Action Banner */}
        <div className="p-8 rounded-[2.5rem] bg-foreground text-background shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black tracking-tighter">Ready to win?</h3>
              <p className="text-muted-foreground font-medium italic mt-1">Add a new deal and watch your business grow.</p>
            </div>
            <Button 
              onClick={() => setIsDealModalOpen(true)}
              className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest bg-background text-foreground hover:bg-secondary transition-all shadow-xl"
            >
              + Start Now
            </Button>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors" />
        </div>
      </div>
    </div>
  );
}

