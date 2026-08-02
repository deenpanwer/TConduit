"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  ArrowLeft, Loader2, RefreshCcw, Smartphone, Download, Users, ShieldCheck, Zap
} from "lucide-react";
import { isAfter } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";

import { InternalUser, OrgDetails, StaffMember, DownloadEvent } from "./types";
import { AuthGuard } from "./components/AuthGuard";
import { StatCards } from "./components/StatCards";
import { SignupList } from "./components/SignupList";
import { UserTable } from "./components/UserTable";
import { OrgDetailsSheet } from "./components/OrgDetailsSheet";
import { EventDetailsSheet } from "./components/EventDetailsSheet";

export default function InternalDashboard() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
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

  useEffect(() => {
    const handleOpenDetails = (e: any) => {
      if (e.detail) handleViewDetails(e.detail);
    };
    window.addEventListener('open-org-details', handleOpenDetails);
    return () => window.removeEventListener('open-org-details', handleOpenDetails);
  }, []);

  const handleToggleTalked = async (userId: string, currentStatus: boolean) => {
    setUpdatingField(`${userId}-talked`);
    try {
      const res = await fetch("/api/internal/update-user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates: { talked: !currentStatus } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update talked status");
      
      toast.success(`Interaction status updated`);
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, talked: !currentStatus } : u));
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
        fetch("/api/internal/dashboard", { signal: AbortSignal.timeout(10000) }),
        fetch("/api/internal/download-stats", { signal: AbortSignal.timeout(10000) })
      ]);
      
      let dashData: any = {};
      let dlData: any = {};

      const dashContentType = dashRes.headers.get("content-type") || "";
      if (dashRes.ok && dashContentType.includes("application/json")) {
        dashData = await dashRes.json();
      } else {
        const errText = await dashRes.text();
        console.error("Dashboard API Error:", dashRes.status, errText);
      }

      const dlContentType = dlRes.headers.get("content-type") || "";
      if (dlRes.ok && dlContentType.includes("application/json")) {
        dlData = await dlRes.json();
      } else {
        const errText = await dlRes.text();
        console.error("Download Stats API Error:", dlRes.status, errText);
      }
      
      setUsers(dashData.users || []);
      setDownloads(dlData.downloads || []);
      setDownloadCount(dlData.count || 0);
      setPwaInstalls(dlData.pwaInstalls || []);
      setPwaCount(dlData.pwaCount || 0);
    } catch (error: any) {
      if (error.name !== "AbortError" && error.name !== "TimeoutError") {
        console.error("Error fetching dashboard data:", error);
      }
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
      
      if (orgDetails) {
        setOrgDetails({
          ...orgDetails,
          org: { ...orgDetails.org, subscriptionExpiry: data.newExpiry, subscriptionStatus: "trialing" }
        });
      }
      
      fetchDashboardData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setExtendingTrial(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you absolutely sure you want to PERMANENTLY delete user "${userName}"? This cannot be undone.`)) return;
    
    const secondCheck = prompt("Type 'DELETE' in all caps to confirm permanent removal:");
    if (secondCheck !== "DELETE") {
      toast.error("Deletion aborted. Confirmation failed.");
      return;
    }

    setUpdatingField(`${userId}-delete`);
    try {
      const res = await fetch("/api/internal/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      
      toast.success(`${userName} has been removed from the system.`);
      
      if (orgDetails) {
        setOrgDetails({
          ...orgDetails,
          staff: orgDetails.staff.filter(s => s.id !== userId)
        });
      }
      
      fetchDashboardData();
    } catch (error: any) {
      toast.error(`Deletion Error: ${error.message}`);
    } finally {
      setUpdatingField(null);
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`CRITICAL WARNING: You are about to delete the entire organization "${orgName}". This will ALSO delete EVERY user associated with it from Firebase Auth and Firestore. Continue?`)) return;
    
    const confirmationText = `DELETE ${orgName.toUpperCase()}`;
    const check = prompt(`To proceed, type "${confirmationText}" exactly:`);
    if (check !== confirmationText) {
      toast.error("Mass deletion aborted. Text mismatch.");
      return;
    }

    setFetchingDetails(true);
    try {
      const res = await fetch("/api/internal/delete-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete organization");
      
      toast.success("Organization and all linked users have been purged.");
      setSelectedOrgId(null);
      setOrgDetails(null);
      
      fetchDashboardData();
    } catch (error: any) {
      toast.error(`Fatal Purge Error: ${error.message}`);
      setFetchingDetails(false);
    }
  };

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
      
      <AuthGuard isAuthorized={isAuthorized} onAuthenticated={() => setIsAuthorized(true)}>
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

        <main className="max-w-[1400px] mx-auto p-8 space-y-16">
          <StatCards stats={stats} />
          {/* Commented out because it generates a dynamic list of cards for every owner and gets too long:
          <SignupList 
            owners={users} 
            onToggleTalked={handleToggleTalked} 
            updatingField={updatingField} 
          />
          */}
          <UserTable users={users} onViewDetails={handleViewDetails} loading={loading} />
        </main>

        <OrgDetailsSheet 
          selectedOrgId={selectedOrgId}
          onClose={() => setSelectedOrgId(null)}
          orgDetails={orgDetails}
          fetchingDetails={fetchingDetails}
          extendingTrial={extendingTrial}
          onExtendTrial={handleExtendTrial}
          updatingField={updatingField}
          onUpdateStaff={handleUpdateStaff}
          onDeleteUser={handleDeleteUser}
          onDeleteOrg={handleDeleteOrg}
        />

        <EventDetailsSheet 
          open={showPwaDetails}
          onOpenChange={setShowPwaDetails}
          title="App Activity"
          description="Mobile & Desktop App Installations"
          events={pwaInstalls}
          count={pwaCount}
          icon={Smartphone}
          variant="emerald"
        />

        <EventDetailsSheet 
          open={showDownloadDetails}
          onOpenChange={setShowDownloadDetails}
          title="Download Activity"
          description="Global Distribution & Device Activity"
          events={downloads}
          count={downloadCount}
          icon={Download}
          variant="primary"
        />

        <footer className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md border-2 border-border px-8 py-4 rounded-full flex items-center gap-4 opacity-60 shadow-2xl">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Admin Access Only</span>
            <div className="h-4 w-px bg-border" />
            <span className="text-[10px] font-black tracking-tighter uppercase opacity-40">Trac AI Internal v2.4.0</span>
          </div>
        </footer>
      </AuthGuard>
    </div>
  );
}
