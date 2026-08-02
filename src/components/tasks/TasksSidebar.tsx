"use client";
import { cn, getUserAvatar } from "@/lib/utils";
import { 
  SquarePen, ChevronDown, ChevronsRight, ChevronsLeft, Moon, Sun,
  UserPlus, LayoutDashboard, Activity, Zap, ShieldCheck, Settings, Users,
  Plus, ListTodo, MessageSquare, CalendarRange, CalendarDays, Database,
  ShoppingCart, Briefcase, X, List, LayoutGrid, Calendar, LogOut,
  Bell,
  Search,
  History,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useShift } from "@/hooks/use-shift";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { getDocs, collection, query, where, limit, doc, getDoc } from "firebase/firestore";
import { ModuleConfigModal } from "@/components/ModuleConfigModal";
import { ProductSwitcher } from "@/components/ems/shared/ProductSwitcher";
import { toast } from "sonner";

interface TasksSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  employees: any[];
  onInviteClick?: () => void;
}

export function TasksSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  employees,
  onInviteClick,
}: TasksSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { user, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [partnerBrand, setPartnerBrand] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const orgId = userData?.ownedOrgId || userData?.orgId;
  const { allPendingLeaves, allPendingClaims } = useShift(new Date(), orgId, (userData && user) ? { ...userData, uid: user.uid } : null, employees);
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
          console.error("Error fetching tasks sidebar branding:", err);
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
    const isLeftSwipe = distance > 50; 

    if (isLeftSwipe && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const userEmail = user?.email;
  const view = searchParams.get('view');

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
              currentModuleId="tasks"
              isCollapsed={isCollapsed}
              isMobileSidebarOpen={isMobileSidebarOpen}
              selectedModules={selectedModules}
              partnerBrand={partnerBrand}
              onConfigOpen={() => setIsConfigOpen(true)}
              isClient={userData?.role === "client" || userData?.isClient === true}
              allowedScopes={userData?.allowedScopes || []}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-4 mb-6">
            {userData?.role !== "client" && !userData?.isClient && (
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
                      {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">Invite Employees</span>}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                    Invite Employees
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="space-y-1">
                <NavItem icon={LayoutDashboard} label="Overview" href="/tasks?view=dashboard" active={pathname === "/tasks" && (view === "dashboard" || !view)} />
                <NavItem icon={List} label="List View" href="/tasks?view=list" active={pathname === "/tasks" && view === "list"} />
                <NavItem icon={LayoutGrid} label="Board View" href="/tasks?view=board" active={pathname === "/tasks" && view === "board"} />
                <NavItem icon={Calendar} label="Timeline View" href="/tasks?view=timeline" active={pathname === "/tasks" && view === "timeline"} />
            </div>

            <div className="pt-4 mt-4 border-t border-border/40">
                {(!isCollapsed || isMobileSidebarOpen) && <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Back to EMS</p>}
                <div className="space-y-1">
                    <NavItem icon={LayoutDashboard} label="Overview" href="/ems" active={false} />
                    <NavItem icon={MessageSquare} label="Chat" href="/ems/chat" active={false} />
                </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4 shrink-0">
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={async () => {
                      if (userData?.role === "client" || userData?.isClient === true) {
                        if (typeof window !== "undefined") {
                          sessionStorage.removeItem("client_portal_session");
                          localStorage.removeItem("client_portal_session");
                        }
                        const shareId = userData?.shareId;
                        const orgId = userData?.orgId;
                        await signOut(auth);
                        toast("Logged Out", { description: "You have safely exited the client portal." });
                        if (orgId && shareId) {
                          router.push(`/share/${orgId}/${shareId}`);
                        } else {
                          router.push("/");
                        }
                        return;
                      }
                      router.push("/ems/settings");
                      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                    }}
                    className={cn(
                      "flex items-center transition-all group border border-transparent",
                      (isCollapsed && !isMobileSidebarOpen) 
                        ? "w-12 h-12 justify-center rounded-full mx-auto" 
                        : "w-full gap-3 p-2 px-3 rounded-xl",
                      (userData?.role === "client" || userData?.isClient === true)
                        ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/20"
                        : "hover:bg-secondary"
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
                      <div className="flex flex-1 items-center justify-between min-w-0 text-left">
                        <div className={cn("flex flex-col min-w-0", (userData?.role === "client" || userData?.isClient === true) ? "text-destructive" : "")}>
                            <div className="text-xs font-bold truncate">{userData?.name || user?.displayName || userEmail || "Client Portal"}</div>
                            <div className={cn("text-[10px] font-black uppercase tracking-widest", (userData?.role === "client" || userData?.isClient === true) ? "text-destructive/80" : "text-muted-foreground")}>
                              {(userData?.role === "client" || userData?.isClient === true) ? "Client Access" : (userData?.role || "Owner")}
                            </div>
                        </div>
                        {(userData?.role === "client" || userData?.isClient === true) ? (
                          <LogOut size={16} className="text-destructive ml-2 shrink-0 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Settings size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  {(userData?.role === "client" || userData?.isClient === true) ? "Sign Out of Client Portal" : "Account Settings"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className={cn("flex w-full gap-2", (isCollapsed && !isMobileSidebarOpen) ? "flex-col items-center" : "justify-center")}>
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

      <ModuleConfigModal 
        isOpen={isConfigOpen} 
        onOpenChange={setIsConfigOpen} 
        selectedModules={selectedModules} 
      />
    </>
  );
}
