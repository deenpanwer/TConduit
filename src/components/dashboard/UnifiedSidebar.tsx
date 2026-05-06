"use client";

import { cn } from "@/lib/utils";
import { 
  ChevronsRight, ChevronsLeft, Moon, Sun,
  LayoutDashboard, ExternalLink, X, Settings, Sparkles, CheckCircle2,
  ChevronRight, SquarePen, History as HistoryIcon, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

interface UnifiedSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
}

export function UnifiedSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}: UnifiedSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { userData } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  // Fetch History
  useEffect(() => {
    const userId = userData?.uid;
    if (userId) {
        const chatsRef = collection(db, 'users', userId, 'chats');
        const q = query(chatsRef, orderBy('updatedAt', 'desc'), limit(20));
        
        const unsub = onSnapshot(q, (snap) => {
            setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }
  }, [userData?.uid]);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

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
          <div className="mb-6 pt-8 lg:pt-0 shrink-0 flex items-center gap-3 px-2">
            <img src="/logo.svg" alt="Trac Logo" className="w-10 h-10 min-w-10 dark:invert shrink-0" />
            {(!isCollapsed || isMobileSidebarOpen) && (
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-poppins font-black text-2xl tracking-tighter uppercase leading-none">TRAC AI</span>
              </div>
            )}
          </div>

          {/* Core Actions */}
          <div className="space-y-2 mb-6 px-1">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => {
                      router.push('/dashboard');
                      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full p-4 rounded-3xl transition-all border",
                      !params.id 
                        ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" 
                        : "border-transparent hover:border-border hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center p-3" : "px-4"
                    )}
                  >
                    <SquarePen className="size-5 shrink-0" />
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">New Chat</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  New Chat
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => window.location.href = '/ems'}
                    className={cn(
                      "flex items-center gap-3 w-full p-4 rounded-3xl transition-all border border-transparent hover:border-border hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center p-3" : "px-4"
                    )}
                  >
                    <LayoutDashboard className="size-5 shrink-0" />
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">EMS</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  Go to EMS
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Navigation / History */}
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-3">
            <div className="px-3 flex items-center justify-between group cursor-pointer" onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}>
               {(!isCollapsed || isMobileSidebarOpen) && (
                 <>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Recent History</span>
                   <ChevronRight className={cn("size-3 text-muted-foreground/30 transition-transform", isHistoryExpanded && "rotate-90")} />
                 </>
               )}
            </div>
            
            {isHistoryExpanded && (
              <div className="space-y-1">
                {history.length > 0 ? (
                  history.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        router.push(`/dashboard/c/${chat.id}`);
                        if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-2xl transition-all text-left group overflow-hidden",
                        params.id === chat.id 
                            ? "bg-secondary text-foreground border border-border/50" 
                            : "text-muted-foreground hover:bg-secondary/30"
                      )}
                    >
                      <MessageSquare className={cn("size-4 shrink-0 transition-colors", params.id === chat.id ? "text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground")} />
                      {(!isCollapsed || isMobileSidebarOpen) && (
                        <span className="text-xs font-medium truncate whitespace-nowrap overflow-hidden">
                          {chat.title || 'Untitled Chat'}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  (!isCollapsed || isMobileSidebarOpen) ? (
                    <div className="px-3 py-8 text-center border-2 border-dashed border-border/20 rounded-3xl">
                      <HistoryIcon className="size-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">No Recent Chats</p>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <HistoryIcon className="size-5 text-muted-foreground/20" />
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex flex-col items-center space-y-3 shrink-0">
            
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
