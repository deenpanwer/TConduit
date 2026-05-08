"use client";

import { cn, getUserAvatar } from "@/lib/utils";
import { 
  LayoutDashboard, ChevronDown, ChevronsRight, ChevronsLeft, Moon, Sun, 
  ShoppingCart, X, CalendarDays, Settings, Sparkles, NotebookPen, 
  Briefcase, FileText, ClipboardList, UserPlus, ArrowLeft
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
          
          {/* Invite Button */}
          <div className="mb-8">
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

          <div className="mb-8 pt-4 lg:pt-0 shrink-0 min-h-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("flex items-center justify-between w-full p-2 rounded-xl hover:bg-secondary transition-all group", isCollapsed && !isMobileSidebarOpen ? "justify-center" : "px-3")}>
                  <div className="flex items-center gap-3">
                    <CalendarDays className={cn("size-6 shrink-0 transition-transform group-hover:scale-105", currentModule.color)} />
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <div className="flex flex-col items-start min-w-0 text-left">
                        <span className="font-poppins font-black text-lg tracking-tighter uppercase leading-none">{currentModule.shortTitle}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Compliance</span>
                      </div>
                    )}
                  </div>
                  {(!isCollapsed || isMobileSidebarOpen) && <ChevronDown size={14} className="text-muted-foreground ml-2" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl">
                <div className="px-2 py-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Switch Product</span>
                </div>

                <DropdownMenuItem disabled className="opacity-50 bg-secondary/50 cursor-default p-3 rounded-xl mb-1">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center", currentModule.bg)}>
                    <currentModule.icon className={cn("size-5", currentModule.color)} />
                  </div>
                  <div className="flex flex-col text-left ml-4">
                    <span className="font-bold text-sm">{currentModule.shortTitle}</span>
                    <span className="text-[10px] text-muted-foreground">Current Product</span>
                  </div>
                </DropdownMenuItem>
                {otherModules.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => router.push(m.href)} className="p-3 rounded-xl mb-1 cursor-pointer hover:bg-secondary transition-all">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center", m.bg)}>
                      <m.icon className={cn("size-5", m.color)} />
                    </div>
                    <div className="flex flex-col text-left ml-4">
                      <span className="font-bold text-sm">{m.shortTitle}</span>
                      <span className="text-[10px] text-muted-foreground">{m.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))}

                <div className="border-t border-border mt-2 pt-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-4 p-3 rounded-xl hover:bg-primary/5 hover:text-primary group"
                    onClick={() => setIsConfigOpen(true)}
                  >
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="size-5 text-primary" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm">Add more apps</span>
                      <span className="text-[10px] text-muted-foreground">Customize workspace</span>
                    </div>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 -mx-2 px-2 scrollbar-none">
            <NavItem icon={LayoutDashboard} label="Overview" href="/attendance" active={pathname === "/attendance"} />
            <NavItem icon={ClipboardList} label="Ledger" href="/attendance/ledger" active={pathname?.startsWith("/attendance/ledger")} />
            <NavItem icon={CalendarDays} label="Holidays" href="/attendance/holidays" active={pathname?.startsWith("/attendance/holidays")} />
            <NavItem icon={Settings} label="Settings" href="/attendance/settings" active={pathname === "/attendance/settings"} />
          </div>

          <div className="pt-4 border-t border-border flex flex-col space-y-4 shrink-0">
            
            <div className="px-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Navigation</span>
            </div>
            
            <Link href="/ems" className={cn("flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-secondary", (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3")}>
               <ArrowLeft size={16} />
               {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">Back to EMS</span>}
            </Link>

            <button onClick={() => router.push("/ems/settings")} className="w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary group">
              <div className="size-10 rounded-full bg-secondary overflow-hidden border border-border shrink-0">
                 <img src={getUserAvatar(userData)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              {(!isCollapsed || isMobileSidebarOpen) && (
                <div className="flex flex-1 items-center justify-between text-left">
                  <div className="flex flex-col min-w-0">
                    <div className="text-xs font-bold truncate">{userData?.name || "User"}</div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{userData?.role || "Member"}</div>
                  </div>
                  <Settings size={14} className="text-muted-foreground" />
                </div>
              )}
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}><ChevronsLeft className="size-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Moon className="size-5" /></Button>
            </div>
          </div>
        </div>
      </div>
      <ModuleConfigModal isOpen={isConfigOpen} onOpenChange={setIsConfigOpen} selectedModules={selectedModules} />
    </>
  );
}
