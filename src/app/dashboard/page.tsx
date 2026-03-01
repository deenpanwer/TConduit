"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, UserPlus, X } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MasterDashboard } from "@/components/dashboard/main/MasterDashboard";
import { useTeam } from "@/hooks/use-team";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer";
import { useRouter } from "next/navigation";
import { PaywallScreen } from "@/components/dashboard/PaywallScreen";
import { InviteModal } from "@/components/dashboard/InviteModal";
import { SubscriptionBadge } from "@/components/dashboard/SubscriptionBadge";

export default function DashboardPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const {
    employees,
    loading: teamLoading,
  } = useTeam();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const { user, userData, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (!userData || !userData.onboardingCompleted) {
        router.push("/dashboard/onboarding");
        return;
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

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true; // Default to true while loading or if not owner to prevent flash

  const copyInviteCode = () => {
    if (orgData?.inviteCode) {
      navigator.clipboard.writeText(orgData.inviteCode);
      setCopied(true);
      toast({ title: "Code Copied!", description: "Invite code ready for the Trac Diary app." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInvite = async () => {
    if (!orgData?.inviteCode) return;
    const shareData = {
      title: 'Join Trac AI',
      text: `Connect to ${userData?.orgName} using code: ${orgData.inviteCode}`,
      url: 'https://traconomics.com/trac-diary'
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else copyInviteCode();
    } catch (err) {}
  };

  if (loading || teamLoading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <div className="w-16 lg:w-64 border-r animate-pulse bg-card" />
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/50 flex items-center px-8 shrink-0">
            <Shimmer className="h-4 w-32 rounded-full" />
          </header>
          <div className="flex-1 p-8 space-y-12 overflow-hidden">
            <Shimmer className="h-96 w-full rounded-[3rem]" />
            <Shimmer className="h-48 w-full rounded-[2.5rem]" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <DashboardSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileOpen}
        setIsMobileSidebarOpen={setIsMobileOpen}
        employees={employees}
        onInviteClick={() => setShowInviteModal(true)}
      />

      <InviteModal 
        isOpen={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

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
            <SubscriptionBadge orgData={orgData} userData={userData} />
            {employees.length > 0 && (
                <Button 
                  onClick={() => setShowInviteModal(true)} 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:flex rounded-none font-black uppercase text-[10px] tracking-widest border-[3px] border-black dark:border-white hover:bg-primary/5 transition-all active:scale-95 h-10 px-6"
                >
                    <UserPlus size={14} className="mr-2" /> Add Staff Member
                </Button>
            )}
            <button 
              onClick={() => router.push("/dashboard/settings")}
              className="size-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-90"
            >
               <img 
                  src={userData?.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'admin'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {!isSubscriptionActive ? (
            <PaywallScreen 
              orgData={orgData}
              userData={userData}
            />
          ) : employees.length === 0 ? (
            <EmptyState 
                orgName={userData?.orgName || "Your Organization"}
                inviteCode={orgData?.inviteCode}
                onCopy={copyInviteCode}
                onShare={shareInvite}
                copied={copied}
            />
          ) : (
            <MasterDashboard 
              orgData={orgData} 
              ownerData={userData} 
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