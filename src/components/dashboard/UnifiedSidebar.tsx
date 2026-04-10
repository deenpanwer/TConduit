"use client";

import { cn } from "@/lib/utils";
import { 
  ChevronsRight, ChevronsLeft, Moon, Sun,
  LayoutDashboard, Briefcase, ShoppingCart, ListTodo,
  ExternalLink, X, Settings2, Settings, Sparkles, CheckCircle2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

interface UnifiedSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  selectedModules: string[];
  activeModule: string;
  setActiveModule: (id: string) => void;
}

const MODULE_CONFIG = [
  {
    id: "ems",
    title: "Employee Monitoring",
    shortTitle: "EMS",
    icon: LayoutDashboard,
    href: "/ems",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    id: "crm",
    title: "Customer Relations",
    shortTitle: "CRM",
    icon: Briefcase,
    href: "/crm",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: "pos",
    title: "Point of Sale System",
    shortTitle: "POS",
    icon: ShoppingCart,
    href: "/pos/dashboard",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    id: "tasks",
    title: "Operations & Tasks",
    shortTitle: "Tasks",
    icon: ListTodo,
    href: "/tasks",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }
];

export function UnifiedSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  selectedModules,
  activeModule,
  setActiveModule
}: UnifiedSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { userData } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedModules);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setTempSelected(selectedModules); }, [selectedModules]);

  if (!mounted) return null;

  const modulesToShow = MODULE_CONFIG.filter(m => selectedModules.includes(m.id));

  const handleSaveConfig = async () => {
    if (tempSelected.length === 0) {
      toast.error("Select at least one module");
      return;
    }
    setIsSaving(true);
    try {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (orgId) {
        await updateDoc(doc(db, "organizations", orgId), {
          selectedModules: tempSelected
        });
        toast.success("Workspace updated");
        setIsConfigOpen(false);
        // Page will re-render due to parent listener or reload if needed
        window.location.reload(); 
      }
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Config Modal */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl bg-card border-border rounded-[2rem] overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Settings2 className="text-primary" /> Configure Workspace
            </DialogTitle>
            <DialogDescription className="text-sm font-medium italic">
              Select which modules appear in your unified dashboard hub.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 pt-0">
            {MODULE_CONFIG.map((module) => {
              const isSelected = tempSelected.includes(module.id);
              const Icon = module.icon;
              return (
                <div 
                  key={module.id}
                  onClick={() => {
                    setTempSelected(prev => 
                      prev.includes(module.id) ? prev.filter(id => id !== module.id) : [...prev, module.id]
                    );
                  }}
                  className={cn(
                    "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50 bg-secondary/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center", module.bg, module.color)}>
                      <Icon size={20} />
                    </div>
                    {isSelected && <CheckCircle2 className="text-primary size-5" />}
                  </div>
                  <h4 className="font-black uppercase tracking-tight">{module.shortTitle}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                    {module.title}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-8 bg-secondary/30 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
            <Button onClick={handleSaveConfig} disabled={isSaving} className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8">
              {isSaving ? "Saving..." : "Apply Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn(
        "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden h-screen sticky top-0",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        "hidden lg:flex",
        isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex translate-x-0"
      )}>
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

          {/* Logo Section */}
          <div className="mb-10 pt-8 lg:pt-0 shrink-0 flex items-center gap-3 px-2">
            <img src="/logo.svg" alt="Trac Logo" className="w-10 h-10 min-w-10 dark:invert shrink-0" />
            {(!isCollapsed || isMobileSidebarOpen) && (
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-poppins font-black text-xl tracking-tighter uppercase leading-none">TRAC AI</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">HUB</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-3">
            <div className="px-3 mb-2">
               {(!isCollapsed || isMobileSidebarOpen) && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Dashboards</span>}
            </div>
            {modulesToShow.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              
              return (
                <div key={module.id} className="group relative flex items-center px-1">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <button
                          onClick={() => {
                            setActiveModule(module.id);
                            if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-4 w-full p-4 rounded-3xl transition-all relative border",
                            isActive
                              ? "border-border bg-secondary/60 text-foreground shadow-inner-lg"
                              : "border-transparent text-muted-foreground hover:bg-secondary/30 hover:border-border/20",
                            (isCollapsed && !isMobileSidebarOpen) ? "justify-center p-3" : "px-4"
                          )}
                        >
                          <div className={cn(
                            "size-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                            isActive ? "bg-background/70" : "bg-secondary/50 group-hover:bg-secondary/80"
                          )}>
                            <Icon className={cn("size-5", isActive ? module.color : 'text-muted-foreground group-hover:text-foreground')} />
                          </div>
                          {(!isCollapsed || isMobileSidebarOpen) && (
                            <div className="flex flex-col items-start overflow-hidden text-left">
                              <span className="font-bold w-full text-sm whitespace-normal">{module.title}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{module.shortTitle}</span>
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                        {module.title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* External Link Icon */}
                  {(!isCollapsed || isMobileSidebarOpen) && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(module.href, '_blank');
                            }}
                            className="absolute right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary hover:bg-primary/10 rounded-xl bg-card shadow-sm border"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Full Module</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex flex-col items-center space-y-3 shrink-0">
            
            {/* Configure Button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setIsConfigOpen(true)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-primary/5 hover:text-primary group border border-transparent hover:border-primary/20",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-4"
                    )}
                  >
                    <Settings2 className="size-5 shrink-0 transition-transform group-hover:rotate-90" />
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <span className="text-[10px] font-black uppercase tracking-widest">Workspace Config</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Manage Modules
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Profile (Now also the Settings link) */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => window.open("/ems/settings", "_blank")}
                    className={cn(
                      "w-full flex items-center gap-3 bg-secondary/30 p-3 rounded-2xl hover:bg-secondary/50 transition-all group border-2 border-transparent hover:border-border active:scale-95",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                    )}
                  >
                    <div className="size-10 rounded-full bg-background overflow-hidden flex items-center justify-center border-2 border-border shrink-0 transition-transform group-hover:scale-105 group-hover:border-primary/50">
                      <img 
                        src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${userData?.email || 'admin'}`} 
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {(!isCollapsed || isMobileSidebarOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <div className="flex flex-col min-w-0 text-left">
                          <div className="text-xs font-black leading-tight whitespace-normal">{userData?.name || "User"}</div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1 whitespace-normal">Owner Account</div>
                        </div>
                        <Settings size={14} className="text-muted-foreground group-hover:text-primary group-hover:rotate-45 transition-all" />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Account & System Settings
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className={cn("flex w-full gap-2 pt-2", (isCollapsed && !isMobileSidebarOpen) ? "flex-col items-center" : "justify-between px-2")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-9 w-9 hover:bg-secondary hidden lg:flex rounded-xl"
              >
                {isCollapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 hover:bg-secondary rounded-xl"
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
