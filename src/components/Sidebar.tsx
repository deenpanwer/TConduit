"use client";

import { cn } from "@/lib/utils";
import { 
  SquarePen, History, ChevronDown, ChevronRight, MoreHorizontal, 
  Edit2, Trash2, Check, X, ChevronsRight, ChevronsLeft, Moon, Sun,
  FileSignature, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useHiredCandidates } from "@/hooks/use-hired-candidates";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  history: any[];
  isHistoryLoading: boolean;
  userEmail: string | null;
  isEmailResolved: boolean;
  onRenameSearch: (id: string, title: string) => void;
  onDeleteSearch: (id: string) => void;
  currentSearchId?: string;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  history,
  isHistoryLoading,
  userEmail,
  isEmailResolved,
  onRenameSearch,
  onDeleteSearch,
  currentSearchId
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isHiredExpanded, setIsHiredExpanded] = useState(true);
  const [editingSearchId, setEditingSearchId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const { hiredCandidates } = useHiredCandidates();

  const isHiredActive = pathname?.startsWith('/hired');
  const isHistoryActive = pathname?.startsWith('/search') && params.id;

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className={cn(
        "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden h-screen sticky top-0",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        "hidden lg:flex",
        isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl flex"
      )}>
        <div className="p-4 flex flex-col h-full relative">
          
          <div className="flex items-center justify-between mb-8 overflow-hidden whitespace-nowrap pt-8 lg:pt-0">
            {(!isCollapsed || isMobileSidebarOpen) && <Link href="/" className="font-bold text-2xl tracking-tighter">Trac AI</Link>}
            <Link href="/">
              <div className="size-8 rounded-lg overflow-hidden shrink-0">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg/250px-J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg" 
                  alt="Logo" 
                  className="size-full object-cover" 
                />
              </div>
            </Link>
          </div>

          <div className="space-y-4 mb-6">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => router.push('/')}
                    className={cn(
                      "flex items-center gap-3 w-full p-2 rounded-xl transition-all hover:bg-secondary",
                      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                    )}
                  >
                    <SquarePen className="size-5 shrink-0" />
                    {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">New Search</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  New Search
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Hired Section (Purple Theme) */}
            {hiredCandidates.length > 0 && (
                <div className="space-y-1">
                    <button
                        onClick={() => setIsHiredExpanded(!isHiredExpanded)}
                        className={cn(
                            "flex items-center gap-3 w-full p-2 rounded-xl transition-all group",
                            isHiredActive ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "text-muted-foreground hover:text-purple-500 hover:bg-purple-500/5",
                            (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                        )}
                    >
                        <span className="size-5 shrink-0 relative flex items-center justify-center">
                            <UserPlus className={cn("absolute transition-all duration-200 group-hover:opacity-0 group-hover:scale-75", isHiredActive ? "opacity-100" : "opacity-100")} size={20} />
                            <ChevronDown className={cn("absolute transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100", isHiredExpanded ? "" : "-rotate-90")} size={20} />
                        </span>
                        {(!isCollapsed || isMobileSidebarOpen) && <span className="text-[10px] font-black uppercase tracking-widest">Hired</span>}
                    </button>

                    {isHiredExpanded && (!isCollapsed || isMobileSidebarOpen) && (
                        <div className="relative pl-6 space-y-1 mt-1 border-l-2 border-purple-500/20 ml-4">
                            {hiredCandidates.map((candidate) => (
                                <button
                                    key={candidate.id}
                                    onClick={() => router.push(`/hired/${candidate.id}`)}
                                    className={cn(
                                        "flex items-center gap-2 w-full p-2 rounded-lg text-xs font-bold transition-all text-left",
                                        params.id === candidate.id 
                                            ? "bg-purple-500/20 text-purple-700 dark:text-purple-300" 
                                            : "text-muted-foreground hover:text-purple-500 hover:bg-purple-500/5"
                                    )}
                                >
                                    <div className={cn("size-1.5 rounded-full shrink-0 transition-all", params.id === candidate.id ? "bg-purple-500 scale-110" : "bg-purple-500/40")} />
                                    <span className="truncate">{candidate.candidateName}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <button
               onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
               className={cn(
                 "flex items-center gap-3 w-full p-2 rounded-xl transition-all group",
                 isHistoryActive ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                 (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
               )}
            >
              <span className="size-5 shrink-0 relative flex items-center justify-center">
                 <History className="absolute transition-all duration-200 group-hover:opacity-0 group-hover:scale-75" size={20} />
                 <ChevronDown className={cn("absolute transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100", isHistoryExpanded ? "" : "-rotate-90")} size={20} />
              </span>
              {(!isCollapsed || isMobileSidebarOpen) && <span className="text-[10px] font-black uppercase tracking-widest">History</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            {(!isCollapsed || isMobileSidebarOpen) && isHistoryExpanded && (
              <div className="relative space-y-1">
                <div className="absolute left-[1.15rem] top-2 bottom-2 w-[2px] bg-border/50" />

                {isHistoryLoading ? (
                  <div className="space-y-2 px-2 pl-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-secondary/50 rounded-lg animate-pulse" />)}
                  </div>
                ) : history.slice(0, 10).map((item) => (
                  <div key={item.id} className="group relative flex items-center pl-6">
                    {editingSearchId === item.id ? (
                      <div className="flex-1 flex items-center gap-1 pr-2">
                        <input
                          autoFocus
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { onRenameSearch(item.id, tempTitle); setEditingSearchId(null); }
                            if (e.key === 'Escape') setEditingSearchId(null);
                          }}
                          className="flex-1 bg-background border border-primary/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button onClick={() => { onRenameSearch(item.id, tempTitle); setEditingSearchId(null); }} className="p-1 hover:text-green-500 transition-colors">
                          <Check className="size-4" />
                        </button>
                        <button onClick={() => setEditingSearchId(null)} className="p-1 hover:text-red-500 transition-colors">
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push(`/search/${item.id}`)}
                          className={cn(
                            "flex-1 text-left p-2.5 rounded-xl transition-all text-sm font-medium pr-10 relative overflow-hidden",
                            params.id === item.id 
                              ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" 
                              : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="block whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,black_60%,transparent)]">
                            {item.custom_title}
                          </span>
                        </button>
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-muted rounded-md"><MoreHorizontal className="size-4 text-muted-foreground" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem 
                                onClick={() => { setEditingSearchId(item.id); setTempTitle(item.custom_title); }}
                                className="gap-2 text-xs font-bold"
                              >
                                <Edit2 className="size-3" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDeleteSearch(item.id)} className="gap-2 text-xs font-bold text-red-500"><Trash2 className="size-3" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4">
            <div className={cn("w-full flex items-center gap-3", (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-2")}>
              <div className="size-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border shrink-0">
                {!isEmailResolved ? (
                  <Skeleton className="w-full h-full rounded-full" />
                ) : (
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg/250px-J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg"
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {(!isCollapsed || isMobileSidebarOpen) && <div className="text-xs font-bold truncate flex-1">{userEmail}</div>}
            </div>
            
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
