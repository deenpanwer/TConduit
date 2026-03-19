"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Users, Building2, Clock, Calendar, ShieldCheck, 
  ArrowLeft, Search, Filter, Loader2, Zap, AlertCircle,
  ExternalLink, Mail, Activity, Timer, Ban, CheckCircle2,
  TrendingUp, ChevronRight, Globe, Fingerprint, RefreshCcw,
  CreditCard, UserPlus, Info, PlusCircle, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, differenceInDays, isAfter, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  ownedOrgId?: string;
  orgName?: string;
  totalVisits?: number;
  visits?: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
  orgData?: any;
  lastActivity?: string | null;
}

interface OrgDetails {
  org: any;
  staff: any[];
}

export default function InternalDashboard() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // Details Modal State
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgDetails, setOrgDetails] = useState<OrgDetails | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [extendingTrial, setExtendingTrial] = useState(false);

  const router = useRouter();

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/internal/dashboard");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch dashboard data");
      
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(`Permissions/API Error: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewDetails = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setFetchingDetails(true);
    setOrgDetails(null);
    try {
      const res = await fetch(`/api/internal/org-details?orgId=${orgId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch details");
      setOrgDetails(data);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setSelectedOrgId(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleExtendTrial = async (days: number) => {
    if (!selectedOrgId) return;
    setExtendingTrial(true);
    try {
      const res = await fetch("/api/internal/extend-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: selectedOrgId, days })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extend trial");
      
      toast.success(`Trial extended by ${days} days!`);
      
      // Update local state for the modal
      if (orgDetails) {
        setOrgDetails({
          ...orgDetails,
          org: { ...orgDetails.org, subscriptionExpiry: data.newExpiry, subscriptionStatus: "trialing" }
        });
      }
      
      // Refresh main dashboard data to sync expiry dates
      fetchDashboardData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setExtendingTrial(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.orgName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const stats = useMemo(() => {
    const total = users.length;
    const activeTrial = users.filter(u => {
      const expiry = u.orgData?.subscriptionExpiry;
      return expiry && isAfter(new Date(expiry), new Date());
    }).length;
    const expired = users.filter(u => {
      const expiry = u.orgData?.subscriptionExpiry;
      return expiry && !isAfter(new Date(expiry), new Date());
    }).length;
    const missingExpiry = users.filter(u => !u.orgData?.subscriptionExpiry).length;

    return { total, activeTrial, expired, missingExpiry };
  }, [users]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 pb-20">
      {/* Navbar */}
      <nav className="h-20 border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50 flex items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-2xl border-2 h-12 w-12 transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter font-poppins leading-none">Internal Node</h1>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Growth Monitor
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-2xl border border-border">
            <Users size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">{users.length} Total Owners</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchDashboardData} 
            disabled={refreshing}
            className="rounded-2xl border-2 h-12 w-12 transition-all"
          >
            <RefreshCcw size={20} className={cn(refreshing && "animate-spin")} />
          </Button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-8 space-y-10">
        
        {/* Statistics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: "Active Nodes", value: stats.activeTrial, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
             { label: "Critical / Expired", value: stats.expired, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
             { label: "Pending Setup", value: stats.missingExpiry, icon: Timer, color: "text-amber-500", bg: "bg-amber-500/10" },
             { label: "Total Reach", value: stats.total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
           ].map((stat, i) => (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               key={i} 
               className="bg-card border-2 border-border p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all"
             >
               <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon size={24} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
               <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
               <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <stat.icon size={80} />
               </div>
             </motion.div>
           ))}
        </section>

        {/* Search & Filter Bar */}
        <section className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Search by name, email, or organization..." 
              className="h-16 pl-16 rounded-[2rem] border-4 border-black dark:border-white bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] focus-visible:ring-0 focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] focus-visible:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:focus-visible:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] transition-all font-bold text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Data Table / Cards */}
        <section className="space-y-4">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            <div className="col-span-4">Owner & Organization</div>
            <div className="col-span-3">Trial Status</div>
            <div className="col-span-3">Recent Activity</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user, idx) => {
                const expiry = user.orgData?.subscriptionExpiry;
                const daysRemaining = expiry ? differenceInDays(new Date(expiry), new Date()) : null;
                const isExpired = daysRemaining !== null && daysRemaining < 0;
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={user.id}
                    className="bg-card border-2 border-border p-6 md:p-8 rounded-[2.5rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all group"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      
                      {/* Identity Column */}
                      <div className="lg:col-span-4 flex items-center gap-6">
                        <div className="size-16 rounded-2xl bg-secondary border-2 border-border overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                          <img 
                            src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.email}`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-1.5 truncate">
                            {user.name}
                          </h4>
                          <p className="text-xs font-bold text-muted-foreground truncate flex items-center gap-2">
                            <Mail size={12} /> {user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-3 bg-primary/5 border border-primary/10 px-3 py-1 rounded-full w-fit">
                            <Building2 size={12} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary truncate max-w-[150px]">
                              {user.orgName || "No Org Name"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 bg-secondary px-3 py-1 rounded-full w-fit">
                            <Activity size={10} className="text-muted-foreground" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                              {user.totalVisits || 0} Total Sessions
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trial Status Column */}
                      <div className="lg:col-span-3 space-y-2">
                        {expiry ? (
                          <>
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit",
                              isExpired ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            )}>
                              {isExpired ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {isExpired ? "Expired Access" : "Active Trial"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <Timer size={14} className="text-muted-foreground" />
                              <span className={cn(
                                isExpired ? "text-destructive" : daysRemaining !== null && daysRemaining < 3 ? "text-amber-500" : "text-foreground"
                              )}>
                                {daysRemaining === 0 ? "Expires Today" : daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} days remaining` : `${Math.abs(daysRemaining || 0)} days past due`}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                              Ends {format(new Date(expiry), 'MMM dd, yyyy')}
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20 w-fit">
                             <AlertCircle size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">No Trial Configured</span>
                          </div>
                        )}
                      </div>

                      {/* Activity Column */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center gap-3 mb-2">
                          <Activity size={16} className="text-primary" />
                          <span className="text-xs font-black uppercase tracking-widest text-foreground">Usage Pulse</span>
                          {user.lastActivity && differenceInDays(new Date(), new Date(user.lastActivity)) < 1 && (
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Active in last 24h" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                          {user.lastActivity ? (
                            <>
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })}
                            </>
                          ) : (
                            "No activity recorded"
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                          <Fingerprint size={12} />
                          ID: {user.ownedOrgId?.slice(0, 12)}...
                        </div>
                      </div>

                      {/* Action Column */}
                      <div className="lg:col-span-2 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-12 rounded-2xl border-2 hover:bg-secondary transition-all"
                          title="View Org"
                          onClick={() => {
                             if (user.ownedOrgId) {
                               toast.info(`Org ID: ${user.ownedOrgId}`);
                             }
                          }}
                        >
                          <Globe size={18} />
                        </Button>
                        <Button 
                          onClick={() => user.ownedOrgId && handleViewDetails(user.ownedOrgId)}
                          className="h-12 px-6 rounded-2xl border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all font-black uppercase tracking-widest text-[10px]"
                        >
                          Details <ChevronRight size={14} className="ml-2" />
                        </Button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredUsers.length === 0 && !loading && (
              <div className="py-32 bg-secondary/20 border-4 border-dashed border-border rounded-[4rem] text-center">
                 <Users className="size-16 mx-auto mb-6 text-muted-foreground/20" />
                 <p className="text-lg font-black uppercase tracking-[0.3em] text-muted-foreground">No matching nodes found</p>
                 <Button variant="link" onClick={() => setSearchQuery("")} className="mt-4 font-bold uppercase text-xs tracking-widest">Clear Search</Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Slide-over Admin Modal */}
      <Sheet open={!!selectedOrgId} onOpenChange={(open) => !open && setSelectedOrgId(null)}>
        <SheetContent className="w-full sm:max-w-xl border-l-4 border-black dark:border-white p-0 overflow-hidden flex flex-col font-sans">
          <SheetHeader className="p-8 border-b-2 bg-secondary/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-3xl font-black uppercase tracking-tighter leading-none">Node Intel</SheetTitle>
                <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Deep Audit & Control Terminal
                </SheetDescription>
              </div>
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                <ShieldCheck size={24} />
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
            {fetchingDetails ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Decrypting organization data...</p>
              </div>
            ) : orgDetails ? (
              <>
                {/* 1. Organization Identity Card */}
                <section className="bg-card border-2 border-border p-6 rounded-[2rem] space-y-6 relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-secondary flex items-center justify-center border-2 border-border shadow-inner">
                      <Building2 size={28} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1">
                        {orgDetails.org.name}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        ID: {orgDetails.org.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Created At</p>
                      <p className="text-xs font-bold truncate">
                        {orgDetails.org.createdAt ? format(new Date(orgDetails.org.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Invite Code</p>
                      <p className="text-xs font-mono font-black tracking-widest">
                        {orgDetails.org.inviteCode || '------'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2. Trial Control Center */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Access Control</h4>
                  </div>
                  
                  <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2rem] space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Status</p>
                        <Badge className={cn(
                          "uppercase text-[10px] font-black px-3 py-1 rounded-lg",
                          isAfter(new Date(orgDetails.org.subscriptionExpiry), new Date()) ? "bg-emerald-500" : "bg-destructive"
                        )}>
                          {isAfter(new Date(orgDetails.org.subscriptionExpiry), new Date()) ? "Active Trial" : "Access Expired"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valid Until</p>
                        <p className="text-sm font-black truncate">
                          {orgDetails.org.subscriptionExpiry ? format(new Date(orgDetails.org.subscriptionExpiry), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        disabled={extendingTrial}
                        onClick={() => handleExtendTrial(7)}
                        variant="outline" 
                        className="h-12 rounded-xl border-2 border-black dark:border-white font-black uppercase text-[9px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px]"
                      >
                        {extendingTrial ? <Loader2 className="animate-spin size-3 mr-2" /> : <PlusCircle size={14} className="mr-2" />}
                        Add +7 Days
                      </Button>
                      <Button 
                        disabled={extendingTrial}
                        onClick={() => handleExtendTrial(30)}
                        className="h-12 rounded-xl border-4 border-black dark:border-white font-black uppercase text-[9px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px]"
                      >
                        {extendingTrial ? <Loader2 className="animate-spin size-3 mr-2" /> : <Zap size={14} className="mr-2" />}
                        Unlock +30 Days
                      </Button>
                    </div>
                  </div>
                </section>

                {/* 3. Staff Registry */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-primary" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Team Registry</h4>
                    </div>
                    <Badge variant="secondary" className="font-black text-[10px] rounded-full">
                      {orgDetails.staff.length} Members
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {orgDetails.staff.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-10 border-2 border-border group-hover:scale-105 transition-transform">
                            <AvatarImage src={member.photoUrl} />
                            <AvatarFallback className="bg-secondary font-bold text-[10px]">
                              {member.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-black tracking-tight leading-none mb-1 truncate max-w-[120px]">
                              {member.name}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase truncate">
                              {member.role || 'Staff'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Pulse</p>
                          <p className="text-[10px] font-bold">
                            {member.lastActivity ? formatDistanceToNow(new Date(member.lastActivity), { addSuffix: true }) : 'Never'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. Engagement History */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={18} className="text-primary" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Engagement History</h4>
                    </div>
                    <Badge variant="outline" className="font-black text-[10px] rounded-full">
                      Recent Sessions
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      // Get owner data from staff list
                      const owner = orgDetails.staff.find(s => s.role?.toLowerCase() === "owner" || s.role?.toLowerCase() === "founder") || orgDetails.staff[0];
                      const visits = owner?.visits || {};
                      const sessionIds = Object.keys(visits).sort((a, b) => Number(b) - Number(a)).slice(0, 5);

                      if (sessionIds.length === 0) {
                        return (
                          <div className="py-8 bg-secondary/20 border-2 border-dashed border-border rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">No session data recorded yet</p>
                          </div>
                        );
                      }

                      return sessionIds.map(id => {
                        const v = visits[id];
                        const duration = v.durationSeconds || 0;
                        const mins = Math.floor(duration / 60);
                        const secs = duration % 60;
                        const visitDate = v.startTime ? new Date(v.startTime) : new Date(Number(id));

                        return (
                          <div key={id} className="bg-card border-2 border-border p-5 rounded-2xl space-y-4 transition-all hover:border-primary/20 hover:shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
                                  <Clock size={16} className="text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-black uppercase leading-none">
                                    {visitDate && !isNaN(visitDate.getTime()) ? format(visitDate, 'MMM dd, yyyy @ hh:mm a') : `Session ID: ${id}`}
                                  </p>
                                </div>
                              </div>
                              <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">DURATION</p>
                                    <p className="text-xl font-black tracking-tighter">{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">PAGE LOAD</p>
                                    <p className="text-xl font-black tracking-tighter">{v.initialLoadTimeMs || 0}ms</p>
                                </div>
                            </div>

                            {v.pageViews && Object.keys(v.pageViews).length > 0 && (
                              <div className="pt-4 border-t border-border">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">PAGES VIEWED</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(v.pageViews).map(([path, count]: [string, any]) => (
                                    <div key={path} className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-lg border border-border">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                        {path.replace(/_/g, '/').replace(/^root$/, '/')}
                                      </span>
                                      <Badge variant="secondary" className="font-black text-xs">{count}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </section>

                {/* 5. Billing Analytics (Placeholder) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Billing History</h4>
                  </div>
                  
                  <div className="py-12 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center px-8">
                    <div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <Info size={20} className="text-muted-foreground/40" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                      No transaction records found. System is currently running on trialing logic.
                    </p>
                  </div>
                </section>
              </>
            ) : null}
          </div>

          <div className="p-8 bg-black text-white dark:bg-white dark:text-black shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert size={16} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Admin Oversight Active</span>
            </div>
            <p className="text-[9px] font-black opacity-40">NODE_VER: 2.4.0_STABLE</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Footer Branding */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md border-2 border-border px-8 py-4 rounded-full flex items-center gap-4 opacity-60 shadow-2xl">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Admin Access Only</span>
            <div className="h-4 w-px bg-border" />
            <span className="text-[10px] font-black tracking-tighter uppercase opacity-40">Trac AI Internal v2.4.0</span>
          </div>
      </footer>
    </div>
  );
}
