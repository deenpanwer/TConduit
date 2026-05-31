"use client";

import { cn, getUserAvatar } from "@/lib/utils";
import { 
  LayoutDashboard, Search, ChevronDown, 
  ChevronsRight, ChevronsLeft, Moon, Sun, 
  X, Settings, Sparkles, Building2, ListTodo, ArrowLeft, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { getDocs, collection, query, where, limit, doc, getDoc } from "firebase/firestore";
import { ModuleConfigModal } from "@/components/ModuleConfigModal";
import { ProductSwitcher } from "@/components/ems/shared/ProductSwitcher";

interface LeadFinderSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  onInviteClick?: () => void;
}

export function LeadFinderSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onInviteClick
}: LeadFinderSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [partnerBrand, setPartnerBrand] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const orgId = userData?.ownedOrgId || userData?.orgId;

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
          console.error("Error fetching Lead Finder branding:", err);
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

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    if (touchStartX.current - touchEndX.current > 50 && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    touchStartX.current = null; touchEndX.current = null;
  };

  const NavItem = ({ icon: Icon, label, href, active }: any) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            href={href}
            onClick={() => {
              if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group relative",
              active ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
            )}
          >
            <Icon className="size-5 shrink-0 text-indigo-500" size={20} />
            {(!isCollapsed || isMobileSidebarOpen) && (
              <span className="text-sm font-bold truncate">{label}</span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div 
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        className={cn(
          "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden h-screen sticky top-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          "hidden lg:flex",
          isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex translate-x-0"
        )}
      >
        <div className="p-4 flex flex-col h-full relative">
          {isMobileSidebarOpen && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
              <X size={18} />
            </Button>
          )}

          {/* Product Switcher Header */}
          <div className="mb-8 pt-8 lg:pt-0 shrink-0 min-h-8">
            <ProductSwitcher 
              currentModuleId="lead-finder"
              isCollapsed={isCollapsed}
              isMobileSidebarOpen={isMobileSidebarOpen}
              selectedModules={selectedModules}
              partnerBrand={partnerBrand}
              onConfigOpen={() => setIsConfigOpen(true)}
            />
          </div>

          {/* Invite Button */}
          <div className="mb-6 -mx-2 px-2 shrink-0">
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
                    <Plus className="size-5 shrink-0 text-indigo-500" />
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">Invite Staff Member</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Invite Staff Member
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto space-y-1 -mx-2 px-2 scrollbar-none">
            <NavItem icon={Search} label="Lead Prospector" href="/lead-finder" active={pathname === "/lead-finder"} />
            <div className="py-2">
              <div className="h-px bg-border/40 mx-2 my-1" />
            </div>
            <NavItem icon={ArrowLeft} label="Back to EMS" href="/ems" />
            <NavItem icon={ListTodo} label="Back to Tasks" href="/tasks" />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4 shrink-0">
            <button 
              onClick={() => {
                router.push("/ems/settings");
                if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
              }} 
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary group", 
                pathname === "/ems/settings" && "bg-secondary ring-1 ring-border", 
                (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-2"
              )}
            >
              <div className="size-10 rounded-full bg-secondary overflow-hidden border border-border shrink-0 transition-transform group-hover:scale-105">
                 <img src={getUserAvatar(userData)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              {(!isCollapsed || isMobileSidebarOpen) && (
                <div className="flex flex-1 items-center justify-between min-w-0 text-left">
                  <div className="flex flex-col min-w-0">
                      <div className="text-xs font-bold truncate">{userData?.name || "Admin"}</div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Settings</div>
                  </div>
                  <Settings size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )}
            </button>
            
            <div className={cn("flex w-full gap-2", (isCollapsed && !isMobileSidebarOpen) ? "flex-col items-center" : "justify-center")}>
              <Button variant="ghost" size="icon" onClick={() => isMobileSidebarOpen ? setIsMobileSidebarOpen(false) : setIsCollapsed(!isCollapsed)} className="hover:bg-secondary">
                {(isCollapsed && !isMobileSidebarOpen) ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hover:bg-secondary">
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
