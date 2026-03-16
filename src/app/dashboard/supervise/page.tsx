"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { getDoc, doc } from "firebase/firestore";
import { format, isToday } from "date-fns";
import { useTeam } from "@/hooks/use-team";
import { useSupervise } from "@/hooks/use-supervise";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Menu, UserPlus, X, Maximize2, Monitor, User, Calendar as CalendarIcon, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn, getUserAvatar } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { InviteModal } from "@/components/dashboard/InviteModal";
import { PaywallScreen } from "@/components/dashboard/PaywallScreen";
import { SubscriptionBadge } from "@/components/dashboard/SubscriptionBadge";



import { useSidebar } from "@/hooks/use-sidebar";

export default function SupervisePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { employees, loading: teamLoading } = useTeam();
  const { user, userData, loading: authLoading } = useAuth();
  const { monitoredPersonnel, latestScreenshots, loading: superviseLoading } = useSupervise(selectedDate);
  
  const [selectedScreenshot, setSelectedScreenshot] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const { setIsMobileOpen } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dashboard/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userData) {
      fetchOrgDetails();
    }
  }, [userData]);

  const fetchOrgDetails = async () => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (targetOrgId) {
      const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
      if (orgDoc.exists()) setOrgData(orgDoc.data());
    }
  };

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true;

  if (authLoading || teamLoading) {
    return (
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/50 flex items-center px-8 shrink-0">
            <Shimmer className="h-4 w-32 rounded-full" />
          </header>
          <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Shimmer key={i} className="aspect-video w-full rounded-2xl" />
            ))}
          </div>
        </main>
    );
  }

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu />
            </Button>
            <h2 className="font-black uppercase tracking-widest text-sm">Supervise Personnel</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <SubscriptionBadge orgData={orgData} userData={userData} />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-4 border-2">
                  <CalendarIcon size={14} className="mr-2" />
                  {isToday(selectedDate) ? "Today (Live)" : format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none bg-card" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <button 
              onClick={() => router.push("/dashboard/settings")}
              className="size-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-90 ml-2"
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
          {monitoredPersonnel.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="size-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <User size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">No personnel found</h3>
              <p className="text-muted-foreground max-w-xs">Personnel using the Trac app or invited staff will appear here.</p>
              <Button onClick={() => setShowInviteModal(true)} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8">
                <UserPlus size={16} className="mr-2" /> Add Staff Member
              </Button>
            </div>
          ) : superviseLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {monitoredPersonnel.map((p) => <Shimmer key={p.id} className="aspect-video w-full rounded-3xl" />)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {monitoredPersonnel.map((emp) => {
                const screenshot = latestScreenshots[emp.id];
                const isOnline = isToday(selectedDate) && emp.heartbeat?.isCurrentlyRunning;
                const isHistoricalFallback = screenshot?.isFallback;

                return (
                  <div 
                    key={emp.id} 
                    className="group relative bg-card border-2 border-border rounded-[2rem] overflow-hidden isolate transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
                    style={{ transform: "translateZ(0)" }}
                  >
                    <div className="aspect-video w-full bg-secondary relative overflow-hidden">
                      {screenshot ? (
                        <img 
                          src={screenshot.url || screenshot.imageUrl || screenshot.activity?.cloudinaryUrl} 
                          alt={`Screenshot for ${emp.name}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                          onClick={() => setSelectedScreenshot({ ...screenshot, employeeName: emp.name })}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                          <Monitor size={32} className="opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                            No Activity on {format(selectedDate, "MMM d")}
                          </span>
                        </div>
                      )}
                      
                      {/* Badge Overlays */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        {isToday(selectedDate) && !isHistoricalFallback && (
                            <div className={`size-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                        )}
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1",
                            isHistoricalFallback ? "bg-orange-500/80" : "bg-black/50"
                        )}>
                          {isHistoricalFallback && <History size={10} />}
                          {isHistoricalFallback ? "Last Active" : (isToday(selectedDate) ? (isOnline ? 'Live' : 'Offline') : format(selectedDate, "MMM d"))}
                        </span>
                      </div>

                      {screenshot && (
                        <button 
                          onClick={() => setSelectedScreenshot({ ...screenshot, employeeName: emp.name })}
                          className="absolute bottom-4 right-4 size-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-secondary border border-border overflow-hidden">
                          <img 
                            src={emp.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${emp.id}`} 
                            alt={emp.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black tracking-tight truncate">{emp.name}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            {screenshot ? format(screenshot.timestamp?.toDate ? screenshot.timestamp.toDate() : new Date(), "hh:mm:ss a") : "---"}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-primary/5 shrink-0"
                        onClick={() => router.push(`/dashboard/team/${emp.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Full Screen Screenshot Dialog */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-[95vw] w-full p-0 border-none bg-black/95 overflow-hidden rounded-[2.5rem] shadow-2xl [&>button]:hidden">
          <div className="absolute top-0 left-0 right-0 p-8 z-50 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    <Monitor size={24} />
                </div>
                <div>
                    <h3 className="text-white text-xl font-black uppercase tracking-tighter leading-none mb-1">
                        {selectedScreenshot?.employeeName}
                    </h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                        {selectedScreenshot?.isFallback ? "Last Active" : (isToday(selectedDate) ? "Live Feed" : `History: ${format(selectedDate, "MMM d, yyyy")}`)} • {selectedScreenshot && format(selectedScreenshot.timestamp?.toDate ? selectedScreenshot.timestamp.toDate() : new Date(), "hh:mm:ss a")}
                    </p>
                </div>
            </div>
            
            <button 
              onClick={() => setSelectedScreenshot(null)}
              className="pointer-events-auto size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <div className="w-full h-full min-h-[80vh] flex items-center justify-center p-4">
            {selectedScreenshot && (
              <img 
                src={selectedScreenshot.url || selectedScreenshot.imageUrl || selectedScreenshot.activity?.cloudinaryUrl} 
                alt="Enlarged screenshot" 
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/5"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InviteModal 
        isOpen={showInviteModal}
        onOpenChange={setShowInviteModal}
      />
    </>
  );
}