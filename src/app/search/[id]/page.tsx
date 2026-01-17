"use client";

import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FileText, Moon, Sun, ChevronsLeft, ChevronsRight, 
  Star, Clock, Zap, Briefcase, MessageSquare, CheckCircle, 
  Download, Box, Github, Layers, MoreHorizontal, Plus, Trash2, Edit2,
  SquarePen, History, Menu, X, ChevronDown, ChevronRight,
  Check
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { CandidateCard, CandidateStat } from "@/components/ai-elements/CandidateCard";
import { ProfileDrawer } from "@/components/ai-elements/ProfileDrawer";
import ProfileDrawer2 from "@/components/ai-elements/ProfileDrawer2";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { embedText } from "@/app/actions";
import { createClient } from '@supabase/supabase-js';
import { Plan2 } from "@/components/ai-elements/plan2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Types ---
interface UnifiedProfile {
  id: string;
  source_type: 'github'; 
  similarity: number;
  raw_data: any; 
}

const SearchPage = () => {
  const [stage, setStage] = useState("stage1");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const params = useParams(); // Get ID from URL

  // Workspace State
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<{title: string, final_query: string} | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Results State
  const [bestCandidates, setBestCandidates] = useState<UnifiedProfile[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [totalProfilesSearched, setTotalProfilesSearched] = useState<number | null>(null);
  const ballparkCountRef = useRef<number | null>(null);


  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [editingSearchId, setEditingSearchId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");

  const formatK = (num: number) => {
    if (num < 1000) return num.toString();
    return (num / 1000).toFixed(1) + 'k';
  };


  // User Identity
  const [userEmailInitial, setUserEmailInitial] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEmailResolved, setIsEmailResolved] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [pendingInteractions, setPendingInteractions] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Handle URL Change (Navigation & Initial Load)
  useEffect(() => {
    const loadSearchFromURL = async () => {
      if (!params.id || typeof params.id !== 'string') return;
      
      if (currentSearchId === params.id) return;

      setIsLoadingResults(true);
      setCurrentSearchId(params.id);

      try {
        const { data: searchRecord, error: searchError } = await supabase
            .from('user_searches')
            .select('*')
            .eq('id', params.id)
            .maybeSingle(); 

                if (searchRecord) {
                    // FOUND: This is a history item or direct link
                    setStage("stage2");
                    setUserQuery(searchRecord.original_query);
                    setConfirmedPlan({ 
                        title: searchRecord.custom_title || searchRecord.original_query, 
                        final_query: searchRecord.original_query 
                    });
                    
                    // Restore the total profiles searched count from DB
                    if (searchRecord.total_scanned) {
                        setTotalProfilesSearched(searchRecord.total_scanned);
                    } else {
                        setTotalProfilesSearched(null);
                    }
        
                    if (searchRecord.result_ids && searchRecord.result_ids.length > 0) {                 const { data: profiles, error: profilesError } = await supabase
                    .from('github_profiles')
                    .select('*')
                    .in('id', searchRecord.result_ids);

                 if (profilesError) throw profilesError;

                 setBestCandidates((profiles || []).map((p: any) => ({
                    id: p.id,
                    source_type: 'github',
                    similarity: 1.0,
                    raw_data: p
                 })));
            } else {
                setBestCandidates([]);
            }
        } else {
            // NOT FOUND: Check if brand new search
            const storedQuery = sessionStorage.getItem('userQueryForPlan');
            if (storedQuery) {
                setStage("stage1");
                setUserQuery(storedQuery);
            }
        }
      } catch (e) {
        console.error("Error loading search from URL:", e);
      } finally {
        setIsLoadingResults(false);
      }
    };

    loadSearchFromURL();
  }, [params.id]);

  const calculateBallparkCount = () => {
    const generateRandomCount = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    // 2 platforms with 150-600, 3 platforms with 1200-3500
    const lowCount = generateRandomCount(150, 600) + generateRandomCount(150, 600);
    const highCount = generateRandomCount(1200, 3500) + generateRandomCount(1200, 3500) + generateRandomCount(1200, 3500);
    return lowCount + highCount;
  };

  const handlePlanConfirmed = (result: { title: string; final_query: string }) => {
    setConfirmedPlan(result);
    setUserQuery(result.final_query);
    
    const count = calculateBallparkCount();
    // No need to store in ref now if passed directly to logSearch
    setTotalProfilesSearched(count); // Still update state for UI display

    setStage("stage2"); // Go directly to NEW stage2 (results page)
    
    if (params.id && typeof params.id === 'string') {
        logSearch(result.final_query, [], result, params.id, count); // Pass count as a new argument
    }
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserEmail = sessionStorage.getItem('userEmail');

      if (storedUserEmail) {
        setUserEmail(storedUserEmail);
        setUserEmailInitial(storedUserEmail.charAt(0).toUpperCase());
        initUser(storedUserEmail);
        fetchWorkspace(storedUserEmail);
      }
      setIsEmailResolved(true);
    }
  }, []);

  const initUser = async (email: string) => {
    await fetch('/api/search-usage', {
      method: 'POST',
      body: JSON.stringify({ action: 'init_user', email })
    });
  };

  const fetchWorkspace = async (email: string) => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_workspace', email })
      });
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const logSearch = async (query: string, resultIds: string[], planDataOverride?: any, specificSearchId?: string, totalScannedValue?: number) => {
    if (!userEmail) return;
    try {
      const planData = planDataOverride || JSON.parse(sessionStorage.getItem('generatedPlanData') || '{}');
      const res = await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'log_search', 
          email: userEmail, 
          query, 
          resultIds,
          planData: planData,
          newTitle: planData?.title || query, 
          searchId: specificSearchId,
          totalScanned: totalScannedValue // Pass it here
        })
      });
      
      const data = await res.json();
      if (data && data.id) {
        setCurrentSearchId(data.id);
      }

      fetchWorkspace(userEmail);
    } catch (e) {
      console.error("Failed to log search", e);
    }
  };

  const updateSearchResults = async (resultIds?: string[], totalScanned?: number) => {
    if (!userEmail || !currentSearchId) return;
    try {
      await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'update_search', 
          email: userEmail, 
          searchId: currentSearchId,
          resultIds,
          totalScanned
        })
      });
    } catch (e) {
      console.error("Failed to update search results", e);
    }
  };

  const logInteraction = async (type: string, data: any) => {
    console.log(`[logInteraction] Triggered: ${type}`, data); 

    const payload = {
      action: 'log_interaction',
      type,
      data: {
        ...data,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString()
      }
    };

    if (!currentSearchId) {
      setPendingInteractions(prev => [...prev, payload]);
      return;
    }

    try {
      await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          searchId: currentSearchId
        })
      });
    } catch (e) {
      console.error("Failed to log interaction", e);
    }
  };

  // Flush pending interactions when searchId is available
  useEffect(() => {
    const flushQueue = async () => {
      if (currentSearchId && pendingInteractions.length > 0) {
        const queueToProcess = [...pendingInteractions];
        setPendingInteractions([]);

        for (const payload of queueToProcess) {
          try {
            await fetch('/api/search-usage', {
              method: 'POST',
              body: JSON.stringify({
                ...payload,
                searchId: currentSearchId
              })
            });
          } catch (e) {
            console.error("[Flush] Failed to log interaction", e);
          }
        }
      }
    };

    flushQueue();
  }, [currentSearchId, pendingInteractions]);

  const loadHistoryItem = (item: any) => {
    setIsMobileSidebarOpen(false);
    // Push the new URL. The useEffect above will handle data fetching.
    router.push(`/search/${item.id}`); 
  };

  const renameSearch = (searchId: string, currentTitle: string) => {
    setEditingSearchId(searchId);
    setTempTitle(currentTitle);
  };

  const saveRename = async (searchId: string) => {
    if (!tempTitle.trim()) return;
    try {
      await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_search',
          email: userEmail,
          searchId,
          newTitle: tempTitle
        })
      });
      setEditingSearchId(null);
      fetchWorkspace(userEmail!);
    } catch (e) {
      console.error("Failed to rename search", e);
    }
  };

  const deleteSearch = async (searchId: string) => {
    if (!userEmail) return;
    try {
      await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_search', action_type: 'delete', email: userEmail, searchId })
      });
      fetchWorkspace(userEmail);
    } catch (e) { }
  };

  const triggerAlert = (count: number, isRetry: boolean) => {
    // Fire and forget - don't await this
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userQuery,
        email: userEmail,
        searchId: currentSearchId,
        count,
      })
    }).catch(err => console.error("Alert trigger failed", err));
  };

  const performSearch = async (query: string, isRetry = false) => {
    setIsLoadingResults(true);
    try {
      const queryEmbedding = await embedText(query);
      const { data: profiles, error } = await supabase.rpc('search_github_profiles', {
        query_embedding: queryEmbedding || new Array(1536).fill(0),
        query_text: query,
        match_threshold: 0.5,
        match_count: 3,
      });

      if (error) throw error;

      const foundCount = profiles?.length || 0;
      
      // Trigger the standalone alert API
      triggerAlert(foundCount, isRetry);

      if (profiles && profiles.length > 0) {
        const normalizedProfiles = profiles as UnifiedProfile[];
        setBestCandidates(normalizedProfiles);
        // Update the existing history record with the found results
        updateSearchResults(normalizedProfiles.map((p: any) => p.id));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Fetch Results Effect (Only for new searches)
  useEffect(() => {
    if (userQuery && stage === 'stage2') {
      performSearch(userQuery);
    }
  }, [userQuery, stage]);


  const normalizeCandidateForCard = (candidate: UnifiedProfile) => {
    const g = candidate.raw_data;
    return {
      name: g.name || g.username,
      username: g.username,
      avatarUrl: g.avatar_url,
      email: g.email || "", // Pass the email through
      bio: g.bio || "Open Source Contributor",
      skills: g.top_languages || [],
      stats: [
                  { label: 'Followers', value: g.followers, icon: Star },
                  { label: 'Total Stars', value: g.total_stars, icon: Star },
                  { label: 'Projects', value: g.public_repos, icon: Layers },
                  { label: 'Experience', value: `${new Date().getFullYear() - new Date(g.gh_created_at).getFullYear()}y`, icon: Clock },
                  { label: 'Location', value: g.location || 'Remote', icon: Box },
              ]    };
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      
      {/* Mobile Header / Hamburger */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="size-5" />
        </Button>
      </div>

      {/* SIDEBAR: Reverted styling with History features */}
      <div className={cn(
        "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden",
        // Desktop styling
        isCollapsed ? "lg:w-16" : "lg:w-64",
        "hidden lg:flex", // Hide on mobile by default, show flex on desktop
        
        // Mobile styling (Absolute overlay when open)
        isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl flex"
      )}>
        <div className="p-4 flex flex-col h-full relative">
          
          {/* Logo / Header Area */}
          <div className="flex items-center justify-between mb-8 overflow-hidden whitespace-nowrap pt-8 lg:pt-0">
            {mounted && (!isCollapsed || isMobileSidebarOpen) && <Link href="/" className="font-bold text-2xl tracking-tighter">Trac AI</Link>}
            <Link href="/">
              <img src="/logo.svg" alt="Trac Logo" className="w-8 h-8 min-w-8 dark:invert" />
            </Link>
          </div>

          {/* Action Icons (Visible in both states) */}
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
                    {mounted && (!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">New Search</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                  New Search
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <button
               onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
               className={cn(
                 "flex items-center gap-3 w-full p-2 rounded-xl transition-all hover:bg-secondary group text-muted-foreground hover:text-foreground",
                 (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
               )}
            >
              <span className="size-5 shrink-0 relative flex items-center justify-center">
                 <History className="absolute transition-opacity duration-200 group-hover:opacity-0" size={20} />
                 {isHistoryExpanded ? (
                    <ChevronDown className="absolute transition-opacity duration-200 opacity-0 group-hover:opacity-100" size={20} />
                 ) : (
                    <ChevronRight className="absolute transition-opacity duration-200 opacity-0 group-hover:opacity-100" size={20} />
                 )}
              </span>
              {mounted && (!isCollapsed || isMobileSidebarOpen) && <span className="text-[10px] font-black uppercase tracking-widest">History</span>}
            </button>
          </div>

          {/* History List (Expanded only) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            {mounted && (!isCollapsed || isMobileSidebarOpen) && isHistoryExpanded && (
              <div className="relative space-y-1">
                {/* Timeline Line - Now inside the wrapper, so it stops with content */}
                <div className="absolute left-[1.15rem] top-2 bottom-2 w-[2px] bg-border/50" />

                {isHistoryLoading ? (
                  <div className="space-y-2 px-2 pl-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-secondary/50 rounded-lg animate-pulse" />)}
                  </div>
                ) : history.slice(0, 5).map((item) => (
                  <div key={item.id} className="group relative flex items-center pl-6">
                    {editingSearchId === item.id ? (
                      <div className="flex-1 flex items-center gap-1 pr-2">
                        <input
                          autoFocus
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(item.id);
                            if (e.key === 'Escape') setEditingSearchId(null);
                          }}
                          className="flex-1 bg-background border border-primary/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button onClick={() => saveRename(item.id)} className="p-1 hover:text-green-500 transition-colors">
                          <Check className="size-4" />
                        </button>
                        <button onClick={() => setEditingSearchId(null)} className="p-1 hover:text-red-500 transition-colors">
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => loadHistoryItem(item)}
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
                                onClick={() => renameSearch(item.id, item.custom_title)}
                                className="gap-2 text-xs font-bold"
                              >
                                <Edit2 className="size-3" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteSearch(item.id)} className="gap-2 text-xs font-bold text-red-500"><Trash2 className="size-3" /> Delete</DropdownMenuItem>
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

          {/* Bottom Area */}
          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4">
            <div className={cn("w-full flex items-center gap-3", (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-2")}>
              <div className="size-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border shrink-0">
                {!isEmailResolved ? (
                  <Skeleton className="w-full h-full rounded-full" />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${userEmail || 'anonymous'}`}
                    alt="User Avatar"
                    className="w-full h-full"
                  />
                )}
              </div>
              {mounted && (!isCollapsed || isMobileSidebarOpen) && <div className="text-xs font-bold truncate flex-1">{userEmail}</div>}
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
      
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 pt-16 lg:pt-8 flex items-center justify-center overflow-auto relative bg-slate-50/30 dark:bg-transparent">
        <AnimatePresence mode="wait">
          {stage === "stage1" && (
            <motion.div key="stage1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl">
              {userQuery ? <Plan2 
                userQuery={userQuery} 
                onPlanConfirmed={handlePlanConfirmed} 
                onRefinement={(question, answer) => logInteraction('refinement_feedback', { question, answer })}
              /> : <div>Loading...</div>}
            </motion.div>
          )}

          {stage === "stage2" && (
             <motion.div key="stage2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8 flex flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1 md:space-y-2">
                  {isLoadingResults ? (
                    <>
                      <Skeleton className="h-6 md:h-10 w-32 md:w-96 rounded-lg md:rounded-xl" />
                      <Skeleton className="h-5 w-48 md:w-80 rounded-lg hidden md:block" />
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg md:text-4xl font-black tracking-tighter">{confirmedPlan?.title || "Search Results"}</h2>
                      <p className="text-muted-foreground font-medium text-sm md:text-base hidden md:block">Historical data captured from your talent discovery session.</p>
                    </>
                  )}
                </div>
                {isLoadingResults ? (
                  <div className="text-right pb-1">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Skeleton className="h-3 md:h-4 w-3 md:w-4 rounded-full" />
                      <Skeleton className="h-5 md:h-8 w-12 md:w-24 rounded-lg" />
                    </div>
                    <Skeleton className="h-2 md:h-3 w-24 md:w-40 ml-auto rounded-lg" />
                  </div>
                ) : totalProfilesSearched ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-right pb-1"
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                      <Zap className="size-3 md:size-4 text-primary fill-primary" />
                      <span className="text-lg md:text-3xl font-black tracking-tighter">{formatK(totalProfilesSearched)}</span>
                    </div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Profiles Scanned</p>
                  </motion.div>
                ) : null}
              </div>

              {isLoadingResults ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-4">
                     <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                     <p className="font-bold uppercase tracking-widest text-xs">Retrieving Artifacts...</p>
                  </div>
                </div>
              ) : bestCandidates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
                  {bestCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      {...normalizeCandidateForCard(candidate)}
                      onHire={() => logInteraction('hire', { candidateId: candidate.id, candidateName: normalizeCandidateForCard(candidate).name })}
                      onViewProfile={() => {
                        logInteraction('view_profile', { candidateId: candidate.id, candidateName: normalizeCandidateForCard(candidate).name });
                        setSelectedProfile(candidate.raw_data);
                        setDrawerOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[3rem] border-muted gap-6">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground font-medium text-lg">No candidates found yet.</p>
                    <p className="text-muted-foreground/60 text-sm">You can try again or refine your search.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => performSearch(userQuery!)}
                    disabled={isLoadingResults}
                    className="rounded-full px-8 py-6 font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all gap-2"
                  >
                    {isLoadingResults ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                        <Zap className="size-4 fill-current" />
                    )}
                    {isLoadingResults ? "Searching..." : "Retry Search"}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ProfileDrawer2
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={selectedProfile}
      />
    </div>
  );
};

export default SearchPage;