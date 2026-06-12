"use client";

import { cn, getUserAvatar } from "@/lib/utils";
import { 
  SquarePen, ChevronDown, ChevronsRight, ChevronsLeft, Moon, Sun,
  UserPlus, LayoutDashboard, Activity, Zap, ShieldCheck, Settings, Users,
  Plus, ListTodo, MessageSquare, CalendarRange, CalendarDays, Database,
  ShoppingCart, Briefcase, X,
  Bell, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useShift } from "@/hooks/use-shift";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { toast } from "sonner";
import { ModuleConfigModal } from "@/components/ModuleConfigModal";
import { ProductSwitcher } from "./shared/ProductSwitcher";

import { db } from "@/lib/firebase";
import { getDocs, collection, query, where, limit, doc, getDoc } from "firebase/firestore";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  employees: any[];
  onInviteClick?: () => void;
}

export function DashboardSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  employees,
  onInviteClick
}: DashboardSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { user, userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isTeamExpanded, setIsTeamExpanded] = useState(true);
  const [partnerBrand, setPartnerBrand] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const shiftUser = useMemo(() => {
    if (!userData && !user) return null;
    return {
      ...userData,
      uid: user?.uid || userData?.id
    };
  }, [userData, user]);

  const orgId = userData?.ownedOrgId || userData?.orgId;
  const { allPendingLeaves, allPendingClaims } = useShift(new Date(), orgId, shiftUser, employees);
  const pendingCount = allPendingLeaves.length + allPendingClaims.length;

  // Swipe logic refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => { 
    setMounted(true); 
    
    async function fetchData() {
      if (userData?.partnerSlug) {
        try {
          const q = query(collection(db, "partners"), where("slug", "==", userData.partnerSlug), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setPartnerBrand(snap.docs[0].data().brandName);
          }
        } catch (err) {
          console.error("Error fetching sidebar branding:", err);
        }
      }

      if (orgId) {
        try {
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          if (orgDoc.exists()) {
            setSelectedModules(orgDoc.data()?.selectedModules || []);
          }
        } catch (err) {
          console.error("Error fetching org modules:", err);
        }
      }
    }
    fetchData();
  }, [userData?.partnerSlug, orgId]);

  if (!mounted) return null;

  // --- SWIPE HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50; // Threshold to trigger close

    if (isLeftSwipe && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const userEmail = user?.email;

  const NavItem = ({ icon: Icon, label, href, active, count, onClick }: any) => {
    const content = (
      <>
        <Icon className={cn("size-5 shrink-0", active && "text-primary")} size={20} />
        {(!isCollapsed || isMobileSidebarOpen) && (
          <div className="flex flex-1 items-center justify-between overflow-hidden">
            <span className="text-sm font-bold truncate">{label}</span>
            {count !== undefined && count > 0 && (
               <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">
                 {count}
               </span>
            )}
          </div>
        )}
        {isCollapsed && !isMobileSidebarOpen && count !== undefined && count > 0 && (
          <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full border-2 border-card" />
        )}
      </>
    );

    const className = cn(
      "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group relative",
      active ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
    );

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {href ? (
              <Link 
                href={href}
                onClick={() => {
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                }}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <button 
                onClick={() => {
                  if (onClick) onClick();
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                }}
                className={className}
              >
                {content}
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
            {label} {count !== undefined && count > 0 && `(${count})`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      {/* Click outside overlay (Mobile Only) */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden h-screen sticky top-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          "hidden lg:flex",
          isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex translate-x-0"
        )}
      >
        <div className="p-4 flex flex-col h-full relative">
          
          {/* Mobile Close Button */}
          {isMobileSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X size={18} />
            </Button>
          )}

          {/* Product Switcher */}
          <div className="mb-8 pt-8 lg:pt-0 shrink-0 min-h-8">
            <ProductSwitcher 
              currentModuleId="ems"
              isCollapsed={isCollapsed}
              isMobileSidebarOpen={isMobileSidebarOpen}
              selectedModules={selectedModules}
              partnerBrand={partnerBrand}
              onConfigOpen={() => setIsConfigOpen(true)}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-4 mb-6">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onInviteClick?.()}
                    className={cn(
                      "flex items-center gap-3 w-full p-2 rounded-xl transition-all hover:bg-secondary border border-transparent hover:border-border",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                    )}
                  >
                    <Plus className="size-5 shrink-0" />
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">Invite Staff Member</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Invite Staff Member
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="space-y-1">
                <NavItem icon={LayoutDashboard} label="Overview" href="/ems" active={pathname === "/ems"} />
                <NavItem icon={Zap} label="Supervise" href="/ems/supervise" active={pathname === "/ems/supervise"} />
                <NavItem icon={Bell} label="Notifications" onClick={() => setIsNotificationsOpen(true)} active={isNotificationsOpen} count={pendingCount} />
                <NavItem icon={CalendarRange} label="Shifts" href="/ems/shifts" active={pathname === "/ems/shifts"} />
                <NavItem icon={CalendarDays} label="Calendar" href="/ems/calendar" active={pathname === "/ems/calendar"} />
                <NavItem icon={MessageSquare} label="Chat" href="/ems/chat" active={pathname === "/ems/chat"} />
            </div>

            <div className="space-y-1">
                <button
                    onClick={() => setIsTeamExpanded(!isTeamExpanded)}
                    className={cn(
                        "flex items-center gap-3 w-full p-2 rounded-xl transition-all group",
                        "text-muted-foreground hover:text-foreground hover:bg-secondary",
                        (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                    )}
                >
                    <span className="size-5 shrink-0 relative flex items-center justify-center">
                        <Users className="absolute transition-all duration-200 group-hover:opacity-0 group-hover:scale-75" size={20} />
                        <ChevronDown className={cn("absolute transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100", isTeamExpanded ? "" : "-rotate-90")} size={20} />
                    </span>
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-[10px] font-black uppercase tracking-widest">Staff Member</span>}
                </button>

                {isTeamExpanded && (!isCollapsed || isMobileSidebarOpen) && (
                    <div className="relative pl-6 space-y-1 mt-1 border-l-2 border-purple-500/20 ml-4">
                        {employees.length === 0 ? (
                            <div className="px-2 py-3">
                               <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight">No active staff</p>
                            </div>
                        ) : (
                            employees.map((emp) => (
                                <Link
                                    key={emp.id}
                                    href={`/ems/team/${emp.id}`}
                                    onClick={() => {
                                      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 w-full p-2 rounded-lg text-xs font-bold transition-all text-left",
                                        params.id === emp.id 
                                            ? "bg-purple-500/20 text-purple-700 dark:text-purple-300" 
                                            : "text-muted-foreground hover:text-purple-500 hover:bg-purple-500/5"
                                    )}
                                >
                                    <div className={cn("size-1.5 rounded-full shrink-0 transition-all", params.id === emp.id ? "bg-purple-500 scale-110" : "bg-purple-500/40")} />
                                    <span className="truncate">{emp.name}</span>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4 shrink-0">
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => {
                      router.push("/ems/settings");
                      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary group",
                      pathname === "/ems/settings" ? "bg-secondary ring-1 ring-border" : "",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-2"
                    )}
                  >
                    <div className="size-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border shrink-0 transition-transform group-hover:scale-105">
                       <img 
                          src={getUserAvatar(userData)}
                          alt="User Avatar"
                          className="w-full h-full object-cover"
                        />
                    </div>
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <div className="flex flex-col min-w-0 text-left">
                            <div className="text-xs font-bold truncate">{userData?.name || user?.displayName || userEmail || "Admin"}</div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{userData?.role || "Owner"}</div>
                        </div>
                        <Settings size={14} className="text-muted-foreground ml-2 shrink-0 group-hover:text-primary transition-colors" />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Account Settings
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className={cn("flex w-full gap-2", (isCollapsed && !isMobileSidebarOpen) ? "flex-col items-center" : "flex-row justify-center")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isMobileSidebarOpen) {
                    setIsMobileSidebarOpen(false);
                  } else {
                    setIsCollapsed(!isCollapsed);
                  }
                }}
                className="hover:bg-secondary"
              >
                {(isCollapsed && !isMobileSidebarOpen) ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-secondary"
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <NotificationsDrawer 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <ModuleConfigModal 
        isOpen={isConfigOpen} 
        onOpenChange={setIsConfigOpen} 
        selectedModules={selectedModules} 
      />
    </>
  );
}
