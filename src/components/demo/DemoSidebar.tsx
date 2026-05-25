"use client";

import { cn } from "@/lib/utils";
import { 
  ChevronDown, ChevronsRight, ChevronsLeft, Moon, Sun,
  LayoutDashboard, Zap, Settings, Users,
  Plus, MessageSquare, CalendarRange, CalendarDays, X,
  Bell, Sparkles
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
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { demoOwnerData } from "@/lib/demo-data";
import { toast } from "sonner";
import { MODULE_CONFIG } from "@/lib/modules";

interface DemoSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  employees: any[];
}

export function DemoSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  employees,
}: DemoSidebarProps) {
  const { theme, setTheme } = useTheme();
  const params = useParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isTeamExpanded, setIsTeamExpanded] = useState(true);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  if (!mounted) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50 && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const showDemoToast = () => {
    toast.info("This is a demo environment. Try opening a Staff Member's profile below!", {
        position: "top-center"
    });
  };

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
                  else showDemoToast();
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

  const currentModule = MODULE_CONFIG[0];
  const otherModules = MODULE_CONFIG.slice(1);

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

          {/* Demo Product Switcher */}
          <div className="mb-8 pt-8 lg:pt-0 shrink-0 min-h-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center justify-between w-full p-2 rounded-xl hover:bg-secondary transition-all group",
                  isCollapsed && !isMobileSidebarOpen ? "justify-center" : "px-3"
                )}>
                  <div className="flex items-center gap-3">
                    <img src="/logo.svg" alt="Logo" className="w-8 h-8 min-w-8 dark:invert shrink-0 transition-transform group-hover:scale-105" />
                    
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <div className="flex flex-col items-start min-w-0 text-left">
                        <span className="font-poppins font-black text-lg tracking-tighter uppercase leading-none">
                          TRAC AI DEMO
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                          EMS
                        </span>
                      </div>
                    )}
                  </div>
                  {(!isCollapsed || isMobileSidebarOpen) && <ChevronDown size={14} className="text-muted-foreground ml-2" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] sm:w-[340px] md:w-[400px] p-3 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl max-h-[60vh] md:max-h-none overflow-y-auto custom-scrollbar">
                <div className="px-3 py-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Switch Product</span>
                </div>
                
                <DropdownMenuItem 
                  disabled
                  className="flex items-center gap-4 p-4 rounded-2xl mb-3 opacity-50 bg-secondary/50 cursor-default mx-1"
                >
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", currentModule.bg)}>
                    <currentModule.icon className={cn("size-6", currentModule.color)} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-[13px]">TRAC AI DEMO</span>
                    <span className="text-[10px] text-muted-foreground">Current Product</span>
                  </div>
                </DropdownMenuItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 px-1">
                {otherModules.map((module) => (
                  <DropdownMenuItem 
                    key={module.id}
                    onClick={(e) => { e.preventDefault(); showDemoToast(); }}
                    className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-secondary transition-all"
                  >
                    <div className={cn("size-11 rounded-2xl flex items-center justify-center shrink-0", module.bg)}>
                      <module.icon className={cn("size-5", module.color)} />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-bold text-[13px] truncate">{module.shortTitle}</span>
                      <span className="text-[10px] text-muted-foreground">{module.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                </div>

                <div className="border-t border-border mt-3 pt-3 px-1 pb-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-4 p-4 h-auto rounded-2xl hover:bg-primary/5 hover:text-primary group"
                    onClick={(e) => { e.preventDefault(); showDemoToast(); }}
                  >
                    <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <Sparkles className="size-5 text-primary" />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-bold text-[13px] truncate">Add more apps</span>
                      <span className="text-[10px] text-muted-foreground truncate">Customize workspace</span>
                    </div>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-4 mb-6">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={showDemoToast}
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
                <NavItem icon={LayoutDashboard} label="Overview" href="/demo" active={pathname === "/demo"} />
                <NavItem icon={Zap} label="Supervise" onClick={showDemoToast} />
                <NavItem icon={Bell} label="Notifications" onClick={showDemoToast} count={2} />
                <NavItem icon={CalendarRange} label="Shifts" onClick={showDemoToast} />
                <NavItem icon={CalendarDays} label="Calendar" onClick={showDemoToast} />
                <NavItem icon={MessageSquare} label="Messages" onClick={showDemoToast} />
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
                        {employees.map((emp) => (
                            <Link
                                key={emp.id}
                                href={`/demo/${emp.id}`}
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
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4 shrink-0">
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={showDemoToast}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary group",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-2"
                    )}
                  >
                    <div className="size-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border shrink-0 transition-transform group-hover:scale-105">
                       <img 
                          src={demoOwnerData.photoUrl}
                          alt="User Avatar"
                          className="w-full h-full object-cover"
                        />
                    </div>
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <div className="flex flex-col min-w-0 text-left">
                            <div className="text-xs font-bold truncate">{demoOwnerData.name}</div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{demoOwnerData.role}</div>
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
    </>
  );
}