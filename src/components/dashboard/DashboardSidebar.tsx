"use client";

import { cn } from "@/lib/utils";
import { 
  SquarePen, ChevronDown, ChevronsRight, ChevronsLeft, Moon, Sun,
  UserPlus, LayoutDashboard, Activity, Zap, ShieldCheck, Settings, Users,
  Plus
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
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  employees: any[];
}

export function DashboardSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  employees
}: DashboardSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { user, userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isTeamExpanded, setIsTeamExpanded] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const userEmail = user?.email;
  const orgName = userData?.orgName;

  const NavItem = ({ icon: Icon, label, href, active, count }: any) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => router.push(href)}
            className={cn(
              "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group relative",
              active ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
            )}
          >
            <Icon className={cn("size-5 shrink-0")} size={20} />
            {(!isCollapsed || isMobileSidebarOpen) && (
              <div className="flex flex-1 items-center justify-between overflow-hidden">
                <span className="text-sm font-bold truncate">{label}</span>
                {count !== undefined && count > 0 && (
                   <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-black">
                     {count}
                   </span>
                )}
              </div>
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
    <div className={cn(
        "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden h-screen sticky top-0",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        "hidden lg:flex",
        isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl flex"
      )}>
        <div className="p-4 flex flex-col h-full relative">
          
          <div className="flex items-center justify-between mb-8 overflow-hidden whitespace-nowrap pt-8 lg:pt-0">
            {(!isCollapsed || isMobileSidebarOpen) && <Link href="/dashboard" className="font-bold text-2xl tracking-tighter">{orgName || "Trac Admin"}</Link>}
            <Link href="/dashboard">
              <img src="/logo.svg" alt="Trac Logo" className="w-8 h-8 min-w-8 dark:invert" />
            </Link>
          </div>

          <div className="space-y-4 mb-6">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => {}}
                    className={cn(
                      "flex items-center gap-3 w-full p-2 rounded-xl transition-all hover:bg-secondary border border-transparent hover:border-border",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                    )}
                  >
                    <Plus className="size-5 shrink-0" />
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">Invite Member</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Invite Member
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="space-y-1">
                <NavItem icon={LayoutDashboard} label="Overview" href="/dashboard" active={pathname === "/dashboard"} />
                <NavItem icon={Zap} label="Live Feed" href="#" count={0} />
                <NavItem icon={Activity} label="Performance" href="#" />
                <NavItem icon={ShieldCheck} label="Compliance" href="#" />
            </div>

            {/* Team Section (Purple Theme) */}
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
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-[10px] font-black uppercase tracking-widest">Team Members</span>}
                </button>

                {isTeamExpanded && (!isCollapsed || isMobileSidebarOpen) && (
                    <div className="relative pl-6 space-y-1 mt-1 border-l-2 border-purple-500/20 ml-4">
                        {employees.length === 0 ? (
                            <div className="px-2 py-3">
                               <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight">No active staff</p>
                            </div>
                        ) : (
                            employees.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => router.push(`/dashboard/team/${emp.id}`)}
                                    className={cn(
                                        "flex items-center gap-2 w-full p-2 rounded-lg text-xs font-bold transition-all text-left",
                                        params.id === emp.id 
                                            ? "bg-purple-500/20 text-purple-700 dark:text-purple-300" 
                                            : "text-muted-foreground hover:text-purple-500 hover:bg-purple-500/5"
                                    )}
                                >
                                    <div className={cn("size-1.5 rounded-full shrink-0 transition-all", params.id === emp.id ? "bg-purple-500 scale-110" : "bg-purple-500/40")} />
                                    <span className="truncate">{emp.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2" />

          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4">
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => router.push("/dashboard/settings")}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary group",
                      pathname === "/dashboard/settings" ? "bg-secondary ring-1 ring-border" : "",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-2"
                    )}
                  >
                    <div className="size-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border shrink-0 transition-transform group-hover:scale-105">
                       <img 
                          src={userData?.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${userEmail || 'admin'}`}
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
  );
}