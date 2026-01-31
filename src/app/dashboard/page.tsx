"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, UserPlus, X } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/hooks/use-auth";
import { OnboardingModal } from "@/components/dashboard/onboarding/OnboardingModal";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MasterDashboard } from "@/components/dashboard/main/MasterDashboard";
import { useTeam } from "@/hooks/use-team";
import { DUMMY_ORG, DUMMY_EMPLOYEES } from "@/lib/dashboard-demo-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Ticket, Copy, Check } from "lucide-react";

export default function DashboardPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { employees, loading: teamLoading } = useTeam();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { user, userData, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user && userData) {
      if (!userData.onboardingCompleted) {
        setShowOnboarding(true);
        collectMetadata();
      }
      fetchOrgDetails();
    }
  }, [user, userData, loading]);

  const fetchOrgDetails = async () => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (targetOrgId) {
      const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
      if (orgDoc.exists()) setOrgData(orgDoc.data());
    }
  };

  const collectMetadata = async () => {
    try {
        const res = await fetch('/api/user/metadata');
        const data = await res.json();
        if (data.error) return;
        await updateDoc(doc(db, "users", user!.uid), {
            name: user?.displayName || userData?.orgName || "Owner",
            photoUrl: user?.photoURL || null,
            lastLoginOs: navigator.platform,
            lastLoginAppVersion: "1.0.0-web",
            lastLoginIpAddress: data.ip,
            lastLoginLocation: {
                city: data.city,
                region: data.region,
                country: data.country_name,
                latitude: data.latitude,
                longitude: data.longitude
            },
            updatedAt: serverTimestamp()
        });
    } catch (e) {}
  };

  const copyInviteCode = () => {
    if (orgData?.inviteCode) {
      navigator.clipboard.writeText(orgData.inviteCode);
      setCopied(true);
      toast({ title: "Code Copied!", description: "Invite code ready for the Electron app." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInvite = async () => {
    if (!orgData?.inviteCode) return;
    const shareData = {
      title: 'Join Trac AI',
      text: `Connect to ${userData?.orgName} using code: ${orgData.inviteCode}`,
      url: 'https://traconomics.com/trac-dairy'
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else copyInviteCode();
    } catch (err) {}
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <DashboardSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileOpen}
        setIsMobileSidebarOpen={setIsMobileOpen}
        employees={employees}
      />

      {showOnboarding && user && userData && (
        <OnboardingModal 
            userId={user.uid}
            orgId={userData.ownedOrgId || userData.orgId || ""}
            initialOrgName={userData.orgName}
            onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* Persistent Invite Modal (Access via Add More) */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-border bg-card shadow-2xl p-8">
          <DialogHeader className="items-center text-center">
            <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Ticket size={32} className="text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Invite Node</DialogTitle>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu />
            </Button>
            <h2 className="font-black uppercase tracking-widest text-sm">Dashboard</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {employees.length === 0 && !teamLoading && (
              <Button 
                onClick={() => setIsDemoMode(!isDemoMode)} 
                variant={isDemoMode ? "default" : "outline"} 
                size="sm" 
                className="rounded-xl font-black uppercase text-[10px] tracking-widest border-primary/20 hover:bg-primary/5 shadow-sm"
              >
                {isDemoMode ? "Exit Preview" : "Demo Preview"}
              </Button>
            )}
            {employees.length > 0 && (
                <Button onClick={() => setShowInviteModal(true)} variant="outline" size="sm" className="hidden md:flex rounded-xl font-black uppercase text-[10px] tracking-widest border-primary/20 hover:bg-primary/5">
                    <UserPlus size={14} className="mr-2" /> Invite Node
                </Button>
            )}
            <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
               {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-[10px] font-black">AD</span>}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {employees.length === 0 && !isDemoMode ? (
            <EmptyState 
                orgName={userData?.orgName || "Your Organization"}
                inviteCode={orgData?.inviteCode}
                onCopy={copyInviteCode}
                onShare={shareInvite}
                copied={copied}
            />
          ) : (
            <MasterDashboard 
              orgData={isDemoMode ? DUMMY_ORG : orgData} 
              ownerData={userData} 
              isDemo={isDemoMode}
            />
          )}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}>
          <div className="absolute right-4 top-4"><Button variant="ghost" size="icon" className="text-white"><X /></Button></div>
        </div>
      )}
    </div>
  );
}