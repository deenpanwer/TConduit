"use client";

import { cn, getUserAvatar } from "@/lib/utils";
import { 
  LayoutDashboard, Users, Briefcase, Building, ChevronDown, 
  ChevronsRight, ChevronsLeft, Moon, Sun, ShoppingCart, 
  X, NotebookPen, PhoneIncoming, Settings, Sparkles
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
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { getDocs, collection, query, where, limit } from "firebase/firestore";

interface CRMSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
}

export function CRMSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen
}: CRMSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [partnerBrand, setPartnerBrand] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => { 
    setMounted(true); 
    async function fetchPartnerBranding() {
      if (userData?.partnerSlug) {
        try {
          const q = query(collection(db, "partners"), where("slug", "==", userData.partnerSlug), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setPartnerBrand(snap.docs[0].data().brandName);
          }
        } catch (err) {
          console.error("Error fetching CRM branding:", err);
        }
      }
    }
    fetchPartnerBranding();
  }, [userData?.partnerSlug]);

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
          <button 
            onClick={() => {
              router.push(href);
              if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group relative",
              active ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
            )}
          >
            <Icon className="size-5 shrink-0" size={20} />
            {(!isCollapsed || isMobileSidebarOpen) && (
              <span className="text-sm font-bold truncate">{label}</span>
            )}
          </button>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center justify-between w-full p-2 rounded-xl hover:bg-secondary transition-all group",
                  isCollapsed && !isMobileSidebarOpen ? "justify-center" : "px-3"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Sparkles className="size-6 shrink-0 text-foreground dark:text-white" />
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <div className="flex flex-col items-start min-w-0 text-left">
                        <span className="font-poppins font-black text-xl tracking-tighter uppercase leading-none text-[#0f172a] dark:text-white">
                          CRM
                        </span>
                        <span className="font-poppins font-black text-[10px] tracking-tighter uppercase leading-none mt-1 text-[#0f172a]/80 dark:text-white/80">
                          SUBSIDIARY OF {partnerBrand || 'DEEN'}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                          RELATIONS
                        </span>
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
                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="flex items-center gap-4 p-3 rounded-xl mb-1 cursor-pointer">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><LayoutDashboard className="size-5 text-primary" /></div>
                  <div className="flex flex-col text-left"><span className="font-bold text-sm">Dashboard</span><span className="text-[10px] text-muted-foreground">Admin & Staff</span></div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/pos/checkout')} className="flex items-center gap-4 p-3 rounded-xl mb-1 cursor-pointer">
                  <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><ShoppingCart className="size-5 text-orange-500" /></div>
                  <div className="flex flex-col text-left"><span className="font-bold text-sm">POS System</span><span className="text-[10px] text-muted-foreground">Retail</span></div>
                </DropdownMenuItem>
                
                {/* RE-ADDED CURRENT PRODUCT ITEM */}
                <DropdownMenuItem 
                  disabled
                  className="flex items-center gap-4 p-3 rounded-xl mb-1 opacity-50 bg-secondary/50 cursor-default"
                >
                  <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Briefcase className="size-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">CRM Dashboard</span>
                    <span className="text-[10px] text-muted-foreground">Current Product</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto space-y-1 -mx-2 px-2 scrollbar-none">
            <NavItem icon={LayoutDashboard} label="Overview" href="/crm" active={pathname === "/crm"} />
            <NavItem icon={Users} label="Leads" href="/crm/leads" active={pathname === "/crm/leads"} />
            <NavItem icon={Briefcase} label="Deals" href="/crm/deals" active={pathname === "/crm/deals"} />
            <NavItem icon={Building} label="Organizations" href="/crm/organizations" active={pathname === "/crm/organizations"} />
            <NavItem icon={Users} label="Contacts" href="/crm/contacts" active={pathname?.startsWith("/crm/contacts")} />
            <NavItem icon={NotebookPen} label="Notes" href="/crm/notes" active={pathname === "/crm/notes"} />
            <NavItem icon={PhoneIncoming} label="Call Logs" href="/crm/call-logs" active={pathname === "/crm/call-logs"} />
            <NavItem icon={Settings} label="Config" href="/crm/config" active={pathname === "/crm/config"} />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4 shrink-0">
            <button 
              onClick={() => {
                router.push("/dashboard/settings");
                if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
              }} 
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary group", 
                pathname === "/dashboard/settings" && "bg-secondary ring-1 ring-border", 
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
    </>
  );
}