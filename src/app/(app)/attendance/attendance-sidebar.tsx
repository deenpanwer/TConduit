"use client";

import { cn, getUserAvatar } from "@/lib/utils";
import { 
  LayoutDashboard, ChevronDown, ChevronsRight, ChevronsLeft, Moon, Sun, 
  ShoppingCart, X, CalendarDays, Settings, Sparkles, NotebookPen, 
  Briefcase, UserPlus, ClipboardList, ArrowLeft,
  CreditCard
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { getDocs, collection, query, where, limit, doc, getDoc } from "firebase/firestore";
import { ModuleConfigModal } from "@/components/ModuleConfigModal";
import { MODULE_CONFIG } from "@/lib/modules";
import { ProductSwitcher } from "@/components/ems/shared/ProductSwitcher";

interface AttendanceSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  onInviteClick?: () => void;
}

export function AttendanceSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onInviteClick
}: AttendanceSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [partnerBrand, setPartnerBrand] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const orgId = userData?.ownedOrgId || userData?.orgId;

  useEffect(() => { 
    setMounted(true); 
    async function fetchData() {
      if (userData?.partnerSlug) {
        try {
          const q = query(collection(db, "partners"), where("slug", "==", userData.partnerSlug), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) setPartnerBrand(snap.docs[0].data().brandName);
        } catch (err) { console.error("Error fetching branding:", err); }
      }
      if (orgId) {
        try {
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          if (orgDoc.exists()) setSelectedModules(orgDoc.data()?.selectedModules || []);
        } catch (err) { console.error("Error fetching modules:", err); }
      }
    }
    fetchData();
  }, [userData?.partnerSlug, orgId]);

  if (!mounted) return null;

  // Find current module safely
  const currentModule = MODULE_CONFIG.find(m => m.id === "attendance") || MODULE_CONFIG[0];
  
  // Show other modules if released OR if they are in the selectedModules list
  // Also, always show them if selectedModules is empty (legacy behavior)
  const otherModules = MODULE_CONFIG.filter(m => 
    m.id !== "attendance" && 
    (m.released || selectedModules.includes(m.id)) &&
    (selectedModules.length === 0 || selectedModules.includes(m.id))
  );

  const NavItem = ({ icon: Icon, label, href, active }: any) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            href={href}
            onClick={() => { if (isMobileSidebarOpen) setIsMobileSidebarOpen(false); }}
            className={cn(
              "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group relative",
              active ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
            )}
          >
            <Icon className="size-5 shrink-0" size={20} />
            {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">{label}</span>}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />}
      <div 
        className={cn(
          "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden h-screen sticky top-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          "hidden lg:flex",
          isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex translate-x-0"
        )}
      >
        <div className="p-4 flex flex-col h-full relative">
          
          <div className="mb-8 pt-4 lg:pt-0 shrink-0 min-h-8">
            <ProductSwitcher 
              currentModuleId="attendance"
              isCollapsed={isCollapsed}
              isMobileSidebarOpen={isMobileSidebarOpen}
              selectedModules={selectedModules}
              partnerBrand={partnerBrand}
              onConfigOpen={() => setIsConfigOpen(true)}
            />
          </div>

          {/* Invite Button */}
          <div className="mb-4">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onInviteClick}
                    className={cn(
                      "flex items-center gap-3 w-full p-2 rounded-xl transition-all hover:bg-secondary border border-transparent hover:border-border",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                    )}
                  >
                    <UserPlus className="size-5 shrink-0" />
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">Invite Staff Member</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Invite Staff Member
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-4 mb-6">
            <div className="space-y-1">
              <NavItem icon={LayoutDashboard} label="Overview" href="/attendance" active={pathname === "/attendance"} />
              <NavItem icon={CreditCard} label="Payroll" href="/attendance/payroll" active={pathname?.startsWith("/attendance/payroll")} />
              {/* we may remove this its terrible <NavItem icon={ClipboardList} label="Ledger" href="/attendance/ledger" active={pathname?.startsWith("/attendance/ledger")} /> */}
              <NavItem icon={CalendarDays} label="Holidays" href="/attendance/holidays" active={pathname?.startsWith("/attendance/holidays")} />
              <NavItem icon={Settings} label="Settings" href="/attendance/settings" active={pathname === "/attendance/settings"} />
            </div>

            <div className="pt-4 mt-4 border-t border-border/40">
                {(!isCollapsed || isMobileSidebarOpen) && <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Navigation</p>}
                <div className="space-y-1">
                    <NavItem icon={ArrowLeft} label="Back to EMS" href="/ems" active={false} />
                </div>
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
                            <div className="text-xs font-bold truncate">{userData?.name || "User"}</div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{userData?.role || "Member"}</div>
                        </div>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Account Settings
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
      <ModuleConfigModal isOpen={isConfigOpen} onOpenChange={setIsConfigOpen} selectedModules={selectedModules} />
    </>
  );
}
