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
import { InviteModal } from "@/components/dashboard/InviteModal";
import { PaywallScreen } from "@/components/dashboard/PaywallScreen";
import { SubscriptionBadge } from "@/components/dashboard/SubscriptionBadge";
import { IntelligenceModal } from "@/components/dashboard/IntelligenceModal";
import { BrainCircuit, Sparkles, ArrowRight, ShieldAlert, Plus as PlusIcon, Minus, Loader2, Trash2 } from "lucide-react";
import { GlobalDateSelector } from "@/components/dashboard/shared/GlobalDateSelector";
import { addDays } from "date-fns"; // For minDate adjustment
import { toast } from "sonner"; // For toasts

import { useSidebar } from "@/hooks/use-sidebar";



export default function DashboardPage() {

  const {

    employees,

    loading: teamLoading,

    selectedDate,

    setSelectedDate,

    addDemoEmployees,

    clearAllDemoEmployees, // New: from useTeam context

  } = useTeam();

  const [showInviteModal, setShowInviteModal] = useState(false);

  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);

  const [orgData, setOrgData] = useState<any>(null);

  const [copied, setCopied] = useState(false);

  const [demoCount, setDemoCount] = useState(1); // New: for demo staff counter

  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false); // New: for demo staff loading state

  const { setIsMobileOpen } = useSidebar();

  

  const { user, userData, loading } = useAuth();

  const router = useRouter();





  // Helper to extract JS Date safely

  const getDate = (ts: any) => {

    if (!ts) return undefined;

    if (ts.toDate) return ts.toDate();

    if (ts instanceof Date) return ts;

    if (ts.seconds) return new Date(ts.seconds * 1000);

    return new Date(ts);

  };



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



  const minOrgDate = getDate(orgData?.createdAt);



  const isSubscriptionActive = orgData?.subscriptionExpiry 

    ? orgData.subscriptionExpiry.toDate() > new Date() 

    : true; // Default to true while loading or if not owner to prevent flash



  const copyInviteCode = () => {

    if (orgData?.inviteCode) {

      navigator.clipboard.writeText(orgData.inviteCode);

      setCopied(true);

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



  // --- Demo Employee Logic ---

  const handleAddDemoEmployees = async () => {

    setIsGeneratingDemo(true);

    try {

        await addDemoEmployees(demoCount);

        toast.success(`Successfully added ${demoCount} demo staff members`);

    } catch (err: any) {

        toast.error(`Failed to generate demo data: ${err.message}`);

    } finally {

        setIsGeneratingDemo(false);

    }

  };



  const handleClearDemo = () => {

    if (confirm("Clear all locally saved demo employees? This will reload the page for a clean state.")) {

        clearAllDemoEmployees();

    }

  };

  // --- End Demo Employee Logic ---





  if (loading || teamLoading) {

    return (

      <div className="flex-1 flex flex-col">

          <header className="h-16 border-b bg-card/50 flex items-center px-8 shrink-0">

            <Shimmer className="h-4 w-32 rounded-full" />

          </header>

          <div className="flex-1 p-8 space-y-12 overflow-hidden">

            <Shimmer className="h-96 w-full rounded-[3rem]" />

            <Shimmer className="h-48 w-full rounded-[2.5rem]" />

          </div>

      </div>

    );

  }



  if (!user) return null;



  return (

    <>

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



                  <GlobalDateSelector 



                    selectedDate={selectedDate} 



                    setSelectedDate={setSelectedDate} 



                    minDate={minOrgDate} 



                  />



                </div>



      

          

          <div className="flex items-center gap-4">

            <SubscriptionBadge orgData={orgData} userData={userData} />

            {/* Conditional rendering for the demo generator */}

            <div className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border">

              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Demo</span>

              <button 

                disabled={demoCount <= 1 || isGeneratingDemo}

                onClick={() => setDemoCount(prev => prev - 1)}

                className="p-1 hover:bg-secondary rounded text-foreground disabled:opacity-30"

              >

                <Minus size={12} />

              </button>

              <span className="text-xs font-black text-foreground min-w-[1ch] text-center">{demoCount}</span>

              <button 

                disabled={demoCount >= 10 || isGeneratingDemo}

                onClick={() => setDemoCount(prev => prev + 1)}

                className="p-1 hover:bg-secondary rounded text-foreground disabled:opacity-30"

              >

                <PlusIcon size={12} />

              </button>

              <Button

                size="sm"

                onClick={handleAddDemoEmployees}

                disabled={isGeneratingDemo}

                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 h-8 bg-primary/10 text-primary hover:bg-primary/20"

              >

                {isGeneratingDemo ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}

                Add

              </Button>

                                 <Button

                                   variant="ghost"

                                   size="icon"

                                   onClick={handleClearDemo}

                                   className="hover:bg-destructive/10 text-destructive"

                                   title="Clear All Demo Employees"

                                 >

                                   <Trash2 size={16} />

                                 </Button>

                               </div>

                              {employees.length > 0 && (                <Button 

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

          ) : (

            <div className="space-y-8">

              {employees.length === 0 ? (

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

          )}

        </div>

      </main>

    </>

  );

}
