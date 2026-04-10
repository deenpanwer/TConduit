"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn, getUserAvatar } from '@/lib/utils';
import { 
  LayoutDashboard, ShoppingCart, ChevronsLeft, ChevronsRight, 
  Keyboard, Archive, Users, BarChart, Settings, History,
  Moon, Sun, Briefcase, ChevronDown, X,
  ListTodo
} from 'lucide-react';
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
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { getDocs, collection, query, where, limit, doc, getDoc } from "firebase/firestore";

interface PosSidebarProps {
  isCollapsed: boolean; 
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
}

const MODULE_CONFIG = [
  {
    id: "ems",
    title: "EMS",
    description: "Enterprise Management",
    icon: LayoutDashboard,
    href: "/ems",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    id: "crm",
    title: "CRM",
    description: "Customer Relations",
    icon: Briefcase,
    href: "/crm",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Productivity & Ops",
    icon: ListTodo,
    href: "/tasks",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    id: "pos",
    title: "POS System",
    description: "Retail & Transactions",
    icon: ShoppingCart,
    href: "/pos/checkout",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  }
];

export function PosSidebar({ 
  isCollapsed, 
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen 
}: PosSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, userData } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [partnerBrand, setPartnerBrand] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Swipe logic refs
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
          console.error("Error fetching POS sidebar branding:", err);
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

  const currentModule = MODULE_CONFIG.find(m => m.id === "pos")!;
  const otherModules = MODULE_CONFIG.filter(m => 
    m.id !== "pos" && (selectedModules.length === 0 || selectedModules.includes(m.id))
  );
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
            <Icon className={cn("size-5 shrink-0")} size={20} />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center justify-between w-full p-2 rounded-xl hover:bg-secondary transition-all group",
                  isCollapsed && !isMobileSidebarOpen ? "justify-center" : "px-3"
                )}>
                  <div className="flex items-center gap-3">
                    <img src="/logo.svg" alt="POS Logo" className="w-8 h-8 min-w-8 dark:invert shrink-0 transition-transform group-hover:scale-105" />
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <div className="flex flex-col items-start min-w-0 text-left">
                        <span className="font-poppins font-black text-lg tracking-tighter uppercase leading-none">POS SYSTEM</span>
                        {partnerBrand && (
                          <span className="font-poppins font-black text-[10px] tracking-tighter uppercase leading-none mt-1">
                            Subsidiary of {partnerBrand}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Retail</span>
                      </div>
                    )}
                  </div>
                  {(!isCollapsed || isMobileSidebarOpen) && <ChevronDown size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl">
                <div className="px-2 py-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Switch Product</span>
                </div>
                <DropdownMenuItem 
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-4 p-3 rounded-xl mb-1 cursor-pointer hover:bg-secondary transition-all"
                >
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <LayoutDashboard className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">Dashboard</span>
                    <span className="text-[10px] text-muted-foreground">Admin & Staff</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push('/tasks')}
                  className="flex items-center gap-4 p-3 rounded-xl mb-1 cursor-pointer hover:bg-secondary transition-all"
                >
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ListTodo className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">Tasks</span>
                    <span className="text-[10px] text-muted-foreground">Productivity</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled
                  className="flex items-center gap-4 p-3 rounded-xl mb-1 opacity-50 bg-secondary/50 cursor-default"
                >
                  <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ShoppingCart className="size-5 text-orange-500" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">POS System</span>
                    <span className="text-[10px] text-muted-foreground">Current Product</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push('/crm')}
                  className="flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-secondary transition-all"
                >
                  <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Briefcase className="size-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">CRM Dashboard</span>
                    <span className="text-[10px] text-muted-foreground">Customer Relations</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-4 mb-6">
            <div className="space-y-1">
              <NavItem icon={ShoppingCart} label="Checkout" href="/pos/checkout" active={pathname === "/pos/checkout"} />
              <NavItem icon={LayoutDashboard} label="Dashboard" href="/pos/dashboard" active={pathname === "/pos/dashboard"} />
              <NavItem icon={Archive} label="Stock/Inventory" href="/pos/inventory" active={pathname === "/pos/inventory"} />
              <NavItem icon={Users} label="Customers" href="/pos/customers" active={pathname === "/pos/customers"} />
              <NavItem icon={History} label="History" href="/pos/history" active={pathname === "/pos/history"} />
              <NavItem icon={BarChart} label="Reports" href="/pos/reports" active={pathname === "/pos/reports"} />
              <NavItem icon={Settings} label="Settings" href="/pos/settings" active={pathname === "/pos/settings"} />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4 shrink-0">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => {
                      router.push("/pos/settings");
                      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary group",
                      pathname === "/pos/settings" ? "bg-secondary ring-1 ring-border" : "",
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
                <TooltipContent side="right" className={cn((isCollapsed && !isMobileSidebarOpen) && "hidden")}>
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
    </>
  );
}
