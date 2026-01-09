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
  SquarePen, History
} from "lucide-react";
import { useEffect, useState } from "react";
import SocialScan2 from "@/components/ai-elements/SocialScan2";
import { useTheme } from "next-themes";
import { CandidateCard, CandidateStat } from "@/components/ai-elements/CandidateCard";
import { ProfileDrawer } from "@/components/ai-elements/ProfileDrawer";
import ProfileDrawer2 from "@/components/ai-elements/ProfileDrawer2";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Workspace State
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<{title: string, final_query: string} | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Results State
  const [bestCandidates, setBestCandidates] = useState<UnifiedProfile[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // User Identity
  const [userEmailInitial, setUserEmailInitial] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [pendingInteractions, setPendingInteractions] = useState<any[]>([]);

  const handlePlanConfirmed = (result: { title: string; final_query: string }) => {
    setConfirmedPlan(result);
    setUserQuery(result.final_query);
    setStage("stage2");
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserQuery = sessionStorage.getItem('userQueryForPlan');
      const storedUserEmail = sessionStorage.getItem('userEmail');

      if (storedUserEmail) {
        setUserEmail(storedUserEmail);
        setUserEmailInitial(storedUserEmail.charAt(0).toUpperCase());
        initUser(storedUserEmail);
        fetchWorkspace(storedUserEmail);
      }
      if (storedUserQuery) {
        setUserQuery(storedUserQuery);
      }
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

  const logSearch = async (query: string, resultIds: string[]) => {
    if (!userEmail) return;
    try {
      const res = await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'log_search', 
          email: userEmail, 
          query, 
          resultIds,
          planData: JSON.parse(sessionStorage.getItem('generatedPlanData') || '{}')
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

  const logInteraction = async (type: string, data: any) => {
    console.log(`[logInteraction] Triggered: ${type}`, data); // Debug Log

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
      console.warn("[logInteraction] No currentSearchId, queuing interaction."); // Debug Log
      setPendingInteractions(prev => [...prev, payload]);
      return;
    }

    try {
      console.log(`[logInteraction] Sending to API for Search ID: ${currentSearchId}`); // Debug Log
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
        console.log(`[Flush] Processing ${pendingInteractions.length} queued interactions for Search ID: ${currentSearchId}`);
        
        // Create a copy to process
        const queueToProcess = [...pendingInteractions];
        // Clear queue immediately to prevent double-processing
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
            console.log(`[Flush] Successfully logged queued interaction: ${payload.type}`);
          } catch (e) {
            console.error("[Flush] Failed to log interaction", e);
          }
        }
      }
    };

    flushQueue();
  }, [currentSearchId, pendingInteractions]);

  const loadHistoryItem = async (item: any) => {
    setStage("stage3");
    setIsLoadingResults(true);
    setUserQuery(item.original_query);
    setConfirmedPlan({ title: item.custom_title, final_query: item.original_query });
    setCurrentSearchId(item.id); // Set the current search ID to the history item ID
    
    try {
      const { data: profiles, error } = await supabase
        .from('github_profiles')
        .select('*')
        .in('id', item.result_ids || []);

      if (error) throw error;
      
      const normalizedProfiles: UnifiedProfile[] = (profiles || []).map((p: any) => ({
        id: p.id,
        source_type: 'github',
        similarity: 1.0,
        raw_data: p
      }));
      
      setBestCandidates(normalizedProfiles);
    } catch (e) {
      console.error("Error loading historical profiles", e);
    } finally {
      setIsLoadingResults(false);
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

  // Fetch Results Effect (Only for new searches)
  useEffect(() => {
    const fetchNewResults = async () => {
      if (!userQuery || stage !== 'stage2') return;
      
      setIsLoadingResults(true);
      try {
        const queryEmbedding = await embedText(userQuery);
        const { data: profiles, error } = await supabase.rpc('search_github_profiles', {
          query_embedding: queryEmbedding || new Array(1536).fill(0),
          query_text: userQuery,
          match_threshold: 0.5,
          match_count: 3,
        });

        if (error) throw error;

        if (profiles && profiles.length > 0) {
          setBestCandidates(profiles as UnifiedProfile[]);
          logSearch(userQuery, profiles.map((p: any) => p.id));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoadingResults(false);
      }
    };

    fetchNewResults();
  }, [userQuery, stage]);

  // Auto-advance Stage 2 -> 3
  useEffect(() => {
    if (stage === "stage2") {
      const timer = setTimeout(() => setStage("stage3"), 14000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

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
        { label: 'Repos', value: g.public_repos, icon: Layers },
        { label: 'Experience', value: `${new Date().getFullYear() - new Date(g.gh_created_at).getFullYear()}y`, icon: Clock },
        { label: 'Location', value: g.location || 'Remote', icon: Box },
        { label: 'Type', value: 'GitHub', icon: Github },
      ]
    };
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* SIDEBAR: Reverted styling with History features */}
      <div className={`bg-card border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"} flex flex-col shrink-0 overflow-hidden`}>
        <div className="p-4 flex flex-col h-full">
          {/* Logo / Header Area */}
          <div className="flex items-center justify-between mb-8 overflow-hidden whitespace-nowrap">
            {!isCollapsed && <Link href="/" className="font-bold text-2xl tracking-tighter">Trac AI</Link>}
            <Link href="/">
              <img src="/1.png" alt="Trac Logo" className="w-8 h-8 min-w-8" />
            </Link>
          </div>

          {/* Action Icons (Visible in both states) */}
          <div className="space-y-4 mb-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => router.push('/')}
                    className={cn(
                      "flex items-center gap-3 w-full p-2 rounded-xl transition-all hover:bg-secondary",
                      isCollapsed ? "justify-center" : "px-3"
                    )}
                  >
                    <SquarePen className="size-5 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-bold truncate">New Search</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">New Search</TooltipContent>}
              </Tooltip>
            </TooltipProvider>

            <div className={cn(
              "flex items-center gap-3 w-full p-2 transition-all text-muted-foreground",
              isCollapsed ? "justify-center" : "px-3"
            )}>
              <History className="size-5 shrink-0" />
              {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">History</span>}
            </div>
          </div>

          {/* History List (Expanded only) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-1">
            {!isCollapsed && (
              <>
                {isHistoryLoading ? (
                  <div className="space-y-2 px-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-secondary/50 rounded-lg animate-pulse" />)}
                  </div>
                ) : history.map((item) => (
                  <div key={item.id} className="group relative flex items-center">
                    <button
                      onClick={() => loadHistoryItem(item)}
                      className="flex-1 text-left p-2.5 rounded-xl hover:bg-secondary transition-colors text-sm truncate font-medium pr-10"
                    >
                      {item.custom_title}
                    </button>
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded-md"><MoreHorizontal className="size-4 text-muted-foreground" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem className="gap-2 text-xs font-bold"><Edit2 className="size-3" /> Rename</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteSearch(item.id)} className="gap-2 text-xs font-bold text-red-500"><Trash2 className="size-3" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Bottom Area */}
          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4">
            <div className={cn("w-full flex items-center gap-3", isCollapsed ? "justify-center" : "px-2")}>
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-black border border-primary/20 shrink-0">
                {userEmailInitial || "U"}
              </div>
              {!isCollapsed && <div className="text-xs font-bold truncate flex-1">{userEmail}</div>}
            </div>
            
            <div className={cn("flex w-full gap-2", isCollapsed ? "flex-col items-center" : "justify-center")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hover:bg-secondary"
              >
                {isCollapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 flex items-center justify-center overflow-auto relative bg-slate-50/30 dark:bg-transparent">
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
            <motion.div key="stage2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl">
              <Task className="w-full">
                <TaskTrigger title={confirmedPlan ? `Documenting: ${confirmedPlan.title}` : "Creating Experience Log"} />
                <TaskContent><SocialScan2 /></TaskContent>
              </Task>
            </motion.div>
          )}

          {stage === "stage3" && (
             <motion.div key="stage3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col max-w-7xl mx-auto">
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter">{confirmedPlan?.title || "Search Results"}</h2>
                  <p className="text-muted-foreground font-medium">Historical data captured from your talent discovery session.</p>
                </div>
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
                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-[3rem] border-muted">
                  <p className="text-muted-foreground font-medium">No candidates were captured for this query.</p>
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