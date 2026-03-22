"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Users, Building2, Clock, Calendar, ShieldCheck, 
  ArrowLeft, Search, Filter, Loader2, Zap, AlertCircle,
  ExternalLink, Mail, Activity, Timer, Ban, CheckCircle2,
  TrendingUp, ChevronRight, Globe, Fingerprint, RefreshCcw,
  CreditCard, UserPlus, Info, PlusCircle, ShieldAlert,
  Download, Monitor, MapPin, Shield, Cpu, Laptop,
  Smartphone, Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, differenceInDays, isAfter, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  ownedOrgId?: string;
  orgName?: string;
  totalVisits?: number;
  visits?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  orgData?: any;
  lastActivity?: string | null;
}

interface OrgDetails {
  org: any;
  staff: StaffMember[];
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  totalVisits: number;
  visits: Record<string, any>;
  lastLoginLocation?: {
    city: string;
    country: string;
    region: string;
  };
  lastLoginAppVersion?: string;
  lastLoginOs?: string;
  lastLoginIpAddress?: string;
  currentVersion?: string;
  isPWA?: boolean;
  notificationsEnabled?: boolean;
  whatsAppNumber?: string;
  accessLocked?: boolean;
  active?: boolean;
  screenshotInterval?: number;
  shiftSyncInterval?: number;
  blurScreenshots?: boolean;
  onboardingProfile?: any;
  heartbeat?: {
    isCurrentlyRunning: boolean;
    lastActive: string;
  };
  createdAt?: string;
  updatedAt?: string;
  lastActivity?: string | null;
}

interface DownloadEvent {
  id: string;
  timestamp: string;
  version?: string;
  platform: string;
  ip: string;
  geo: {
    city: string;
    country: string;
    region: string;
    latitude: string;
    longitude: string;
  };
  userAgent: string;
  screenResolution?: string;
  viewportSize?: string;
  devicePixelRatio?: number;
  timeZone?: string;
  language?: string;
  vendor?: string;
  isPWA?: boolean;
}

export default function InternalDashboard() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("activity");
  const [refreshing, setRefreshing] = useState(false);
  
  // Security State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  
  // SHA-256 Hash of your 8-word password
  // To generate a new one, run this in your browser console:
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('word1 word2 ... word8')).then(b => console.log(Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')))
  const AUTH_HASH = "a42f3ed947bf56fd88344ff797856507cebd631d73496c16a8be54c6036165b6"; 

  const checkPassword = async () => {
    setIsChecking(true);
    try {
      const msgUint8 = new TextEncoder().encode(passInput.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (hashHex === AUTH_HASH) {
        setIsAuthorized(true);
        toast.success("Access Granted. Welcome back.");
      } else {
        toast.error("Invalid Security Key");
        setPassInput("");
      }
    } catch (err) {
      toast.error("Security Engine Error");
    } finally {
      setIsChecking(false);
    }
  };

  // Downloads State
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [downloadCount, setDownloadCount] = useState(0);
  const [showDownloadDetails, setShowDownloadDetails] = useState(false);
  
  // PWA State
  const [pwaInstalls, setPwaInstalls] = useState<DownloadEvent[]>([]);
  const [pwaCount, setPwaCount] = useState(0);
  const [showPwaDetails, setShowPwaDetails] = useState(false);

  // Details Modal State
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgDetails, setOrgDetails] = useState<OrgDetails | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [extendingTrial, setExtendingTrial] = useState(false);
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const router = useRouter();

  const handleUpdateStaff = async (staffId: string, updates: Partial<StaffMember>) => {
    const fieldKey = Object.keys(updates)[0];
    setUpdatingField(`${staffId}-${fieldKey}`);
    try {
      const res = await fetch("/api/internal/update-user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: staffId, updates })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      
      toast.success(`${fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated`);
      
      // Update local state
      if (orgDetails) {
        setOrgDetails({
          ...orgDetails,
          staff: orgDetails.staff.map(s => s.id === staffId ? { ...s, ...updates } : s)
        });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setUpdatingField(null);
    }
  };


  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [dashRes, dlRes] = await Promise.all([
        fetch("/api/internal/dashboard"),
        fetch("/api/internal/download-stats")
      ]);
      
      const dashData = await dashRes.json();
      const dlData = await dlRes.json();
      
      if (!dashRes.ok) throw new Error(dashData.error || "Failed to fetch dashboard data");
      
      setUsers(dashData.users || []);
      setDownloads(dlData.downloads || []);
      setDownloadCount(dlData.count || 0);
      setPwaInstalls(dlData.pwaInstalls || []);
      setPwaCount(dlData.pwaCount || 0);
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

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.orgName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case "expiry": {
          const aExpiry = a.orgData?.subscriptionExpiry;
          const bExpiry = b.orgData?.subscriptionExpiry;
          if (!aExpiry && !bExpiry) return 0;
          if (!aExpiry) return 1;
          if (!bExpiry) return -1;
          return new Date(aExpiry).getTime() - new Date(bExpiry).getTime();
        }
        case "activity": {
          const aActivity = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const bActivity = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return bActivity - aActivity;
        }
        case "newest": {
          const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bCreated - aCreated;
        }
        case "visits": {
          return (b.totalVisits || 0) - (a.totalVisits || 0);
        }
        case "name": {
          return a.name.localeCompare(b.name);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [users, searchQuery, sortBy]);

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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Entering Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 pb-20">
      <Toaster position="top-center" richColors theme="dark" />
      
      {!isAuthorized ? (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="size-20 rounded-[2rem] bg-white/10 border-2 border-white/20 flex items-center justify-center mx-auto mb-8 group hover:border-emerald-500/50 transition-all duration-700">
                 <ShieldAlert className="size-10 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Security Protocol</h1>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.4em]">Level 4 Internal Clearance Required</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="relative group">
                <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-emerald-500 transition-colors" size={24} />
                <Input 
                  type="password"
                  placeholder="INPUT 8-WORD SECURITY PHRASE..." 
                  autoFocus
                  className="h-20 pl-16 rounded-[2.5rem] border-4 border-white/30 bg-white/10 text-emerald-500 placeholder:text-white/60 focus-visible:ring-0 focus-visible:border-emerald-500 focus-visible:bg-emerald-500/10 transition-all font-black text-xl tracking-[0.2em] uppercase shadow-2xl"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkPassword()}
                />
              </div>
              
              <Button 
                onClick={checkPassword}
                disabled={isChecking || passInput.length < 5}
                className="w-full h-20 rounded-[2.5rem] bg-white text-black hover:bg-emerald-500 hover:text-white transition-all font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {isChecking ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={20} />
                    Authenticate Access
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 pt-8">
                 <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Encrypted Session Active</p>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <>
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
                <h1 className="text-2xl font-black uppercase tracking-tighter font-poppins leading-none">Internal Dashboard</h1>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time Activity Monitor
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPwaDetails(true)}
                className="hidden md:flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 px-6 h-12 rounded-2xl border-2 border-emerald-500/20 text-emerald-600 transition-all active:scale-95"
              >
                <Smartphone size={18} />
                <span className="text-sm font-black uppercase tracking-widest">{pwaCount} App Installs</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDownloadDetails(true)}
                className="hidden md:flex items-center gap-3 bg-primary/10 hover:bg-primary/20 px-6 h-12 rounded-2xl border-2 border-primary/20 text-primary transition-all active:scale-95"
              >
                <Download size={18} />
                <span className="text-sm font-black uppercase tracking-widest">{downloadCount} Downloads</span>
              </Button>
              <div className="hidden lg:flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-2xl border border-border h-12">
                <Users size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">{users.length} Total Accounts</span>
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
                 { label: "Active Access", value: stats.activeTrial, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                 { label: "Access Expired", value: stats.expired, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
                 { label: "New Accounts", value: stats.missingExpiry, icon: Timer, color: "text-amber-500", bg: "bg-amber-500/10" },
                 { label: "Total Accounts", value: stats.total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
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
          <div className="w-full md:w-64">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-16 rounded-[2rem] border-4 border-black dark:border-white bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] focus:ring-0 font-black uppercase tracking-widest text-xs px-8">
                <div className="flex items-center gap-2">
                  <Filter size={16} />
                  <SelectValue placeholder="Sort By" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 border-black dark:border-white font-bold">
                <SelectItem value="activity" className="focus:bg-primary focus:text-white rounded-xl">Recent Activity</SelectItem>
                <SelectItem value="expiry" className="focus:bg-primary focus:text-white rounded-xl">Expiring Soon</SelectItem>
                <SelectItem value="newest" className="focus:bg-primary focus:text-white rounded-xl">Newest Accounts</SelectItem>
                <SelectItem value="visits" className="focus:bg-primary focus:text-white rounded-xl">Most Active</SelectItem>
                <SelectItem value="name" className="focus:bg-primary focus:text-white rounded-xl">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Data Table / Cards */}
        <section className="space-y-4">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            <div className="col-span-4">Owner & Organization</div>
            <div className="col-span-3">Access Status</div>
            <div className="col-span-3">Recent Activity</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedUsers.map((user, idx) => {
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
                              {user.orgName || "No Organization"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 bg-secondary px-3 py-1 rounded-full w-fit">
                            <Activity size={10} className="text-muted-foreground" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                              {user.totalVisits || 0} Total Visits
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
                                {isExpired ? "Access Expired" : "Active Access"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <Timer size={14} className="text-muted-foreground" />
                              <span className={cn(
                                isExpired ? "text-destructive" : daysRemaining !== null && daysRemaining < 3 ? "text-amber-500" : "text-foreground"
                              )}>
                                {daysRemaining === 0 ? "Expires Today" : daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining || 0)} days past due`}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                              Ends {format(new Date(expiry), 'MMMM dd, yyyy')}
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20 w-fit">
                             <AlertCircle size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">No Access Settings</span>
                          </div>
                        )}
                      </div>

                      {/* Activity Column */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center gap-3 mb-2">
                          <Activity size={16} className="text-primary" />
                          <span className="text-xs font-black uppercase tracking-widest text-foreground">Recent Activity</span>
                          {user.lastActivity && differenceInDays(new Date(), new Date(user.lastActivity)) < 1 && (
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Active today" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            {user.lastActivity ? (
                              <>
                                <Clock size={12} />
                                {formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })}
                              </>
                            ) : (
                              "No activity yet"
                            )}
                          </p>
                          {user.lastActivity && (
                            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase">
                               Last seen: {format(new Date(user.lastActivity), 'MMM dd, yyyy @ hh:mm a')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Column */}
                      <div className="lg:col-span-2 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-12 rounded-2xl border-2 hover:bg-secondary transition-all"
                          title="Open Website"
                          onClick={() => {
                             if (user.ownedOrgId) {
                               toast.info(`Organization ID: ${user.ownedOrgId}`);
                             }
                          }}
                        >
                          <Globe size={18} />
                        </Button>
                        <Button 
                          onClick={() => user.ownedOrgId && handleViewDetails(user.ownedOrgId)}
                          className="h-12 px-6 rounded-2xl border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all font-black uppercase tracking-widest text-[10px]"
                        >
                          View Details <ChevronRight size={14} className="ml-2" />
                        </Button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredAndSortedUsers.length === 0 && !loading && (
              <div className="py-32 bg-secondary/20 border-4 border-dashed border-border rounded-[4rem] text-center">
                 <Users className="size-16 mx-auto mb-6 text-muted-foreground/20" />
                 <p className="text-lg font-black uppercase tracking-[0.3em] text-muted-foreground">No accounts found</p>
                 <Button variant="link" onClick={() => setSearchQuery("")} className="mt-4 font-bold uppercase text-xs tracking-widest">Clear Search</Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Slide-over User Details Modal */}
      <Sheet open={!!selectedOrgId} onOpenChange={(open) => !open && setSelectedOrgId(null)}>
        <SheetContent className="w-full sm:max-w-xl border-l-4 border-black dark:border-white p-0 overflow-hidden flex flex-col font-sans">
          <SheetHeader className="p-8 border-b-2 bg-secondary/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-3xl font-black uppercase tracking-tighter leading-none">User Overview</SheetTitle>
                <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Organization Activity and Settings
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
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading organization data...</p>
              </div>
            ) : orgDetails ? (
              <>
                {/* 1. Organization Information */}
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
                        Unique ID: {orgDetails.org.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Account Created</p>
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

                {/* 2. Access Settings */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Access Settings</h4>
                  </div>
                  
                  <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2rem] space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Status</p>
                        <Badge className={cn(
                          "uppercase text-[10px] font-black px-3 py-1 rounded-lg",
                          isAfter(new Date(orgDetails.org.subscriptionExpiry), new Date()) ? "bg-emerald-500" : "bg-destructive"
                        )}>
                          {isAfter(new Date(orgDetails.org.subscriptionExpiry), new Date()) ? "Active Access" : "Access Expired"}
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

                {/* 3. Team Information */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-primary" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Team Members</h4>
                    </div>
                    <Badge variant="secondary" className="font-black text-[10px] rounded-full">
                      {orgDetails.staff.length} People
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {orgDetails.staff.map((member) => {
                      const isOwner = member.role?.toLowerCase() === "owner" || member.role?.toLowerCase() === "founder";
                      
                      return (
                        <div key={member.id} className="bg-secondary/30 rounded-[2rem] border border-border overflow-hidden">
                          <div className="p-6 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <Avatar className="size-14 border-2 border-border group-hover:scale-105 transition-transform">
                                <AvatarImage src={member.photoUrl} />
                                <AvatarFallback className="bg-secondary font-bold text-xs">
                                  {member.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-base font-black tracking-tight leading-none mb-1.5 truncate max-w-[150px]">
                                  {member.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className="text-[8px] font-black py-0 px-2 uppercase rounded-md">
                                    {member.role || 'Staff'}
                                  </Badge>
                                  {member.heartbeat?.isCurrentlyRunning && (
                                    <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase">
                                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Last Seen</p>
                              <p className="text-xs font-bold leading-none mb-1">
                                {member.heartbeat?.lastActive ? formatDistanceToNow(new Date(member.heartbeat.lastActive), { addSuffix: true }) : (member.lastActivity ? formatDistanceToNow(new Date(member.lastActivity), { addSuffix: true }) : 'Never')}
                              </p>
                              <p className="text-[9px] text-muted-foreground font-medium uppercase">
                                {member.heartbeat?.lastActive ? format(new Date(member.heartbeat.lastActive), 'MMM dd, yyyy') : (member.lastActivity ? format(new Date(member.lastActivity), 'MMM dd, yyyy') : 'No Date')}
                              </p>
                            </div>
                          </div>

                          <div className="px-6 pb-6 pt-0 border-t border-border/50 grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Member Since</p>
                                <p className="text-[10px] font-bold">
                                  {member.createdAt ? `${format(new Date(member.createdAt), 'MMM dd, yyyy')}` : 'N/A'}
                                </p>
                                <p className="text-[8px] text-muted-foreground font-medium uppercase">
                                  {member.createdAt ? formatDistanceToNow(new Date(member.createdAt), { addSuffix: true }) : ''}
                                </p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Usage Summary</p>
                                <p className="text-[10px] font-bold">
                                  {member.totalVisits || 0} Total Visits
                                </p>
                                <p className="text-[8px] text-muted-foreground font-medium uppercase">
                                  Last updated {member.updatedAt ? formatDistanceToNow(new Date(member.updatedAt), { addSuffix: true }) : 'N/A'}
                                </p>
                            </div>
                          </div>

                          {/* Management Center - ONLY for Employees, NOT for Founders/Owners */}
                          {!isOwner && (
                            <div className="bg-secondary/20 p-6 border-t border-border/50 space-y-6">
                              <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Management Center</h5>
                                  {updatingField?.startsWith(member.id) && <Loader2 className="size-3 animate-spin text-primary" />}
                              </div>

                              {/* Direct Contact */}
                              <div className="space-y-2">
                                  <a 
                                    href={`mailto:${member.email}`}
                                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-secondary/50 transition-all group"
                                  >
                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                      <Mail size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[8px] font-black text-muted-foreground uppercase">Email Address</p>
                                      <p className="text-[10px] font-bold truncate">{member.email}</p>
                                    </div>
                                  </a>
                                  
                                  {member.whatsAppNumber && (
                                    <a 
                                      href={`https://wa.me/${member.whatsAppNumber.replace(/\+/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-secondary/50 transition-all group"
                                    >
                                      <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                        <Globe size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase">WhatsApp Number</p>
                                        <p className="text-[10px] font-bold truncate">{member.whatsAppNumber}</p>
                                      </div>
                                    </a>
                                  )}
                              </div>

                              {/* Remote Controls */}
                              <div className="space-y-4 pt-2">
                                  <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                                      <div className="space-y-0.5">
                                          <Label className="text-[10px] font-black uppercase tracking-wider">Block Trac Diary</Label>
                                          <p className="text-[8px] text-muted-foreground font-medium uppercase">Prevent user from accessing the desktop app</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {updatingField === `${member.id}-accessLocked` && <Loader2 className="size-3 animate-spin text-primary" />}
                                        <Switch 
                                            disabled={updatingField === `${member.id}-accessLocked`}
                                            checked={member.accessLocked} 
                                            onCheckedChange={(checked) => handleUpdateStaff(member.id, { accessLocked: checked })}
                                        />
                                      </div>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                                      <div className="space-y-0.5">
                                          <Label className="text-[10px] font-black uppercase tracking-wider">Blur Screenshots</Label>
                                          <p className="text-[8px] text-muted-foreground font-medium uppercase">Enable privacy filter for work photos</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {updatingField === `${member.id}-blurScreenshots` && <Loader2 className="size-3 animate-spin text-primary" />}
                                        <Switch 
                                            disabled={updatingField === `${member.id}-blurScreenshots`}
                                            checked={member.blurScreenshots} 
                                            onCheckedChange={(checked) => handleUpdateStaff(member.id, { blurScreenshots: checked })}
                                        />
                                      </div>
                                  </div>

                                  {/* Preset Buttons for Screenshot Interval */}
                                  <div className="space-y-3 p-3 bg-card border border-border rounded-xl">
                                      <div className="flex justify-between items-center">
                                          <div className="space-y-0.5">
                                              <Label className="text-[10px] font-black uppercase tracking-wider">Screenshot Frequency</Label>
                                              <p className="text-[8px] text-muted-foreground font-medium uppercase">Minutes between automated photos</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {updatingField === `${member.id}-screenshotInterval` && <Loader2 className="size-3 animate-spin text-primary" />}
                                            <Badge variant="secondary" className="text-[10px] font-black">{member.screenshotInterval}m</Badge>
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-5 gap-1.5">
                                        {[1, 5, 10, 15, 30].map((val) => (
                                          <Button
                                            key={val}
                                            variant={member.screenshotInterval === val ? "default" : "outline"}
                                            size="sm"
                                            disabled={updatingField === `${member.id}-screenshotInterval`}
                                            onClick={() => handleUpdateStaff(member.id, { screenshotInterval: val })}
                                            className="h-8 text-[10px] font-bold rounded-lg border-2"
                                          >
                                            {val}m
                                          </Button>
                                        ))}
                                      </div>
                                  </div>

                                  {/* Preset Buttons for Shift Sync Interval */}
                                  <div className="space-y-3 p-3 bg-card border border-border rounded-xl">
                                      <div className="flex justify-between items-center">
                                          <div className="space-y-0.5">
                                              <Label className="text-[10px] font-black uppercase tracking-wider">Shift Interval</Label>
                                              <p className="text-[8px] text-muted-foreground font-medium uppercase">Minutes between data updates</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {updatingField === `${member.id}-shiftSyncInterval` && <Loader2 className="size-3 animate-spin text-primary" />}
                                            <Badge variant="secondary" className="text-[10px] font-black">{member.shiftSyncInterval}m</Badge>
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {[10, 30, 60, 120].map((val) => (
                                          <Button
                                            key={val}
                                            variant={member.shiftSyncInterval === val ? "default" : "outline"}
                                            size="sm"
                                            disabled={updatingField === `${member.id}-shiftSyncInterval`}
                                            onClick={() => handleUpdateStaff(member.id, { shiftSyncInterval: val })}
                                            className="h-8 text-[10px] font-bold rounded-lg border-2"
                                          >
                                            {val}m
                                          </Button>
                                        ))}
                                      </div>
                                  </div>
                              </div>
                            </div>
                          )}

                          {/* Diagnostics - Support information - ONLY for Employees */}
                          {!isOwner && (
                            <div className="p-6 border-t border-border/50 bg-primary/5">
                                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-4">Diagnostics & Location</p>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div>
                                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">City / Region</p>
                                      <p className="text-[10px] font-bold truncate">
                                        {member.lastLoginLocation?.city || 'Unknown City'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">App Version</p>
                                      <p className="text-[10px] font-bold">
                                        {member.currentVersion || member.lastLoginAppVersion || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">System Type</p>
                                      <p className="text-[10px] font-bold truncate">
                                        {member.lastLoginOs || 'Unknown'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Network IP</p>
                                      <p className="text-[10px] font-bold font-mono">
                                        {member.lastLoginIpAddress || 'Hidden'}
                                      </p>
                                    </div>
                                </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 4. Activity History */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={18} className="text-primary" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Recent Visits</h4>
                    </div>
                    <Badge variant="outline" className="font-black text-[10px] rounded-full">
                      Activity Logs
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
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">No visit data recorded yet</p>
                          </div>
                        );
                      }

                      return sessionIds.map(id => {
                        const v = visits[id];
                        const duration = v.durationSeconds || 0;
                        const mins = Math.floor(duration / 60);
                        const secs = duration % 60;
                        const visitDate = v.startTime ? new Date(v.startTime) : new Date(Number(id));
                        const loadTimeSeconds = (v.initialLoadTimeMs || 0) / 1000;
                        
                        const pageViews = Object.entries(v.pageViews || {}).sort((a: [string, any], b: [string, any]) => b[1] - a[1]);
                        const totalViews = pageViews.reduce((sum, [, count]) => sum + (count as number), 0);

                        return (
                          <div key={id} className="bg-card border-2 border-border p-6 rounded-2xl space-y-5 transition-all hover:border-primary/20 hover:shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
                                  <Clock size={16} className="text-primary" />
                                </div>
                                <p className="text-xs font-black uppercase leading-none">
                                  {visitDate && !isNaN(visitDate.getTime()) ? format(visitDate, 'MMM dd, yyyy @ hh:mm a') : `Visit ID: ${id}`}
                                </p>
                              </div>
                              <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Duration</p>
                                    <p className="text-lg font-black tracking-tighter">{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}</p>
                                </div>
                                <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Page Load</p>
                                    <p className={cn("text-lg font-black tracking-tighter", loadTimeSeconds > 3 ? "text-amber-500" : "text-emerald-600")}>
                                      {loadTimeSeconds.toFixed(2)}s
                                    </p>
                                </div>
                                <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Pages Viewed</p>
                                    <p className="text-lg font-black tracking-tighter">{totalViews}</p>
                                </div>
                            </div>

                            {pageViews.length > 0 && (
                              <div className="pt-4 border-t border-border">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase mb-3">Activity Breakdown</p>
                                <div className="space-y-4">
                                  {pageViews.map(([path, count]) => (
                                    <div key={path}>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground truncate max-w-[200px]">
                                          {path.replace(/_/g, '/').replace(/^root$/, '/')}
                                        </span>
                                        <span className="text-[9px] font-black text-foreground">
                                          {count as number} {count === 1 ? 'view' : 'views'}
                                        </span>
                                      </div>
                                      <div className="w-full bg-secondary rounded-full h-2 border border-border">
                                        <div 
                                          className="bg-primary h-full rounded-full" 
                                          style={{ width: `${((count as number) / totalViews) * 100}%` }}
                                        />
                                      </div>
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

                {/* 5. Payments (Placeholder) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Payment History</h4>
                  </div>
                  
                  <div className="py-12 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center px-8">
                    <div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <Info size={20} className="text-muted-foreground/40" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                      No payment records found. Account is currently on a trial.
                    </p>
                  </div>
                </section>
              </>
            ) : null}
          </div>

          <div className="p-8 bg-black text-white dark:bg-white dark:text-black shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert size={16} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Professional Oversight</span>
            </div>
            <p className="text-[9px] font-black opacity-40">System Version 2.4.0</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* PWA Detail Slide-over */}
      <Sheet open={showPwaDetails} onOpenChange={setShowPwaDetails}>
        <SheetContent className="w-full sm:max-w-2xl border-l-4 border-black dark:border-white p-0 overflow-hidden flex flex-col font-sans">
          <SheetHeader className="p-8 border-b-2 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-3xl font-black uppercase tracking-tighter leading-none text-emerald-600">App Activity</SheetTitle>
                <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Mobile & Desktop App Installations
                </SheetDescription>
              </div>
              <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border-2 border-emerald-500/20">
                <Smartphone size={24} />
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-6">
              {pwaInstalls.length === 0 ? (
                <div className="py-20 border-4 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center px-10">
                  <Layout className="size-16 text-muted-foreground/20 mb-6" />
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">No app installs recorded yet</p>
                </div>
              ) : (
                pwaInstalls.map((dl, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={dl.id} 
                    className="bg-card border-2 border-border p-6 rounded-[2rem] space-y-4 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-secondary flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                          {dl.platform === "Mobile PWA" ? <Smartphone size={20} className="text-emerald-500" /> : <Monitor size={20} className="text-emerald-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">{dl.platform}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Application Access</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Installed</p>
                        <p className="text-xs font-bold">
                          {formatDistanceToNow(new Date(dl.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <Globe size={12} className="text-emerald-500" /> Location
                        </div>
                        <p className="text-xs font-bold truncate">
                          {dl.geo.city}, {dl.geo.country}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                           {dl.geo.region}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <Shield size={12} className="text-emerald-500" /> IP Address
                        </div>
                        <p className="text-xs font-mono font-bold">{dl.ip}</p>
                      </div>
                    </div>

                    <div className="bg-secondary/30 p-4 rounded-2xl border border-border space-y-3">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                          <Cpu size={12} /> Device Information
                       </div>
                       <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Resolution</p>
                            <p className="text-[10px] font-bold">{dl.screenResolution || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Timezone</p>
                            <p className="text-[10px] font-bold truncate">{dl.timeZone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Language</p>
                            <p className="text-[10px] font-bold">{dl.language || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Method</p>
                            <Badge variant="outline" className="text-[8px] font-black py-0 px-2 rounded-md uppercase border-emerald-500/30 text-emerald-600">
                               APP INSTALL
                            </Badge>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-black text-white dark:bg-white dark:text-black shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={16} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">App Install Logs</span>
            </div>
            <p className="text-[9px] font-black opacity-40">TOTAL: {pwaCount}</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Downloads Detail Slide-over */}
      <Sheet open={showDownloadDetails} onOpenChange={setShowDownloadDetails}>
        <SheetContent className="w-full sm:max-w-2xl border-l-4 border-black dark:border-white p-0 overflow-hidden flex flex-col font-sans">
          <SheetHeader className="p-8 border-b-2 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-3xl font-black uppercase tracking-tighter leading-none">Download Activity</SheetTitle>
                <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Global Distribution & Device Activity
                </SheetDescription>
              </div>
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                <Download size={24} />
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-6">
              {downloads.length === 0 ? (
                <div className="py-20 border-4 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center px-10">
                  <Download className="size-16 text-muted-foreground/20 mb-6" />
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">No downloads recorded yet</p>
                </div>
              ) : (
                downloads.map((dl, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={dl.id} 
                    className="bg-card border-2 border-border p-6 rounded-[2rem] space-y-4 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-secondary flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                          <Laptop size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">{dl.platform}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Version {dl.version}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time</p>
                        <p className="text-xs font-bold">
                          {formatDistanceToNow(new Date(dl.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <Globe size={12} className="text-primary" /> Location
                        </div>
                        <p className="text-xs font-bold truncate">
                          {dl.geo.city}, {dl.geo.country}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <Shield size={12} className="text-primary" /> IP Address
                        </div>
                        <p className="text-xs font-mono font-bold">{dl.ip}</p>
                      </div>
                    </div>

                    <div className="bg-secondary/30 p-4 rounded-2xl border border-border space-y-3">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                          <Cpu size={12} /> Device Information
                       </div>
                       <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Resolution</p>
                            <p className="text-[10px] font-bold">{dl.screenResolution || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Timezone</p>
                            <p className="text-[10px] font-bold truncate">{dl.timeZone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Language</p>
                            <p className="text-[10px] font-bold">{dl.language || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Type</p>
                            <Badge variant="outline" className="text-[8px] font-black py-0 px-2 rounded-md uppercase">
                               {dl.isPWA ? 'App Installed' : 'Browser Access'}
                            </Badge>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-black text-white dark:bg-white dark:text-black shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download size={16} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">Download Activity Logs</span>
            </div>
            <p className="text-[9px] font-black opacity-40">TOTAL: {downloadCount}</p>
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
        </>
      )}
    </div>
  );
}