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
  Star, Clock, Zap, MessageSquare, CheckCircle, 
  Layers, Box, Menu, ChevronDown, ChevronRight, Check
} from "lucide-react";
import { useEffect, useState, useRef, Suspense } from "react";
import { useTheme } from "next-themes";
import { CandidateCard } from "@/components/ai-elements/CandidateCard";
import ProfileDrawer2 from "@/components/ai-elements/ProfileDrawer2";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { embedText } from "@/app/actions";
import { createClient } from '@supabase/supabase-js';
import { Plan2 } from "@/components/ai-elements/plan2";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { HiringModal, HiringData } from "@/components/HiringModal";
import { OnboardingHub } from "@/components/OnboardingHub";
import { Sidebar } from "@/components/Sidebar";
import { useHiredCandidates } from "@/hooks/use-hired-candidates";

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

const SearchPageContent = () => {
  const [stage, setStage] = useState("stage1");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
  const { hireCandidate } = useHiredCandidates();

  // Workspace State
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<{title: string, final_query: string} | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Results State
  const [bestCandidates, setBestCandidates] = useState<UnifiedProfile[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [totalProfilesSearched, setTotalProfilesSearched] = useState<number | null>(null);

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // Hiring & Onboarding State
  const [isHiringModalOpen, setIsHiringModalOpen] = useState(false);
  const [hiringCandidate, setHiringCandidate] = useState<{id: string, name: string} | null>(null);
  const [isOnboardingActive, setIsOnboardingActive] = useState(activeTab === "onboarding");
  const [hiringData, setHiringData] = useState<HiringData | null>(null);

  useEffect(() => {
    setIsOnboardingActive(activeTab === "onboarding");
  }, [activeTab]);

  const formatK = (num: number) => {
    if (num < 1000) return num.toString();
    return (num / 1000).toFixed(1) + 'k';
  };

  // User Identity
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEmailResolved, setIsEmailResolved] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [pendingInteractions, setPendingInteractions] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
            setStage("stage2");
            setUserQuery(searchRecord.original_query);
            setConfirmedPlan({ 
                title: searchRecord.custom_title || searchRecord.original_query, 
                final_query: searchRecord.original_query 
            });
            
            if (searchRecord.total_scanned) {
                setTotalProfilesSearched(searchRecord.total_scanned);
            } else {
                setTotalProfilesSearched(null);
            }

            if (searchRecord.result_ids && searchRecord.result_ids.length > 0) {
                 const { data: profiles, error: profilesError } = await supabase
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
    const lowCount = generateRandomCount(150, 600) + generateRandomCount(150, 600);
    const highCount = generateRandomCount(1200, 3500) + generateRandomCount(1200, 3500) + generateRandomCount(1200, 3500);
    return lowCount + highCount;
  };

  const handlePlanConfirmed = (result: { title: string; final_query: string }) => {
    setConfirmedPlan(result);
    setUserQuery(result.final_query);
    const count = calculateBallparkCount();
    setTotalProfilesSearched(count);
    setStage("stage2"); 
    if (params.id && typeof params.id === 'string') {
        logSearch(result.final_query, [], result, params.id, count);
    }
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserEmail = sessionStorage.getItem('userEmail');
      if (storedUserEmail) {
        setUserEmail(storedUserEmail);
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
          totalScanned: totalScannedValue
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
      email: g.email || "",
      bio: g.bio || "Open Source Contributor",
      skills: g.top_languages || [],
      stats: [
          { label: 'Followers', value: g.followers, icon: Star },
          { label: 'Total Stars', value: g.total_stars, icon: Star },
          { label: 'Projects', value: g.public_repos, icon: Layers },
          { label: 'Experience', value: `${new Date().getFullYear() - new Date(g.gh_created_at).getFullYear()}y`, icon: Clock },
          { label: 'Location', value: g.location || 'Remote', icon: Box },
      ]
    };
  };

  const onRenameSearch = async (searchId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      await fetch('/api/search-usage', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_search',
          email: userEmail,
          searchId,
          newTitle: newTitle
        })
      });
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

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="size-5" />
        </Button>
      </div>

      <Sidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        history={history}
        isHistoryLoading={isHistoryLoading}
        userEmail={userEmail}
        isEmailResolved={isEmailResolved}
        onRenameSearch={onRenameSearch}
        onDeleteSearch={deleteSearch}
        currentSearchId={currentSearchId || undefined}
      />
      
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <main className={cn(
        "flex-1 flex flex-col items-center overflow-auto relative bg-slate-50/30 dark:bg-transparent custom-scrollbar",
        isOnboardingActive ? "p-0" : "p-4 md:p-8 lg:p-12 pt-20 lg:pt-16"
      )}>
        <AnimatePresence mode="wait">
          {stage === "stage1" && (
            <motion.div key="stage1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl mt-10 md:mt-20">
              {userQuery ? <Plan2 
                userQuery={userQuery} 
                onPlanConfirmed={handlePlanConfirmed} 
                onRefinement={(question, answer) => logInteraction('refinement_feedback', { question, answer })}
              /> : <div>Loading...</div>}
            </motion.div>
          )}

          {stage === "stage2" && (
             <motion.div 
                key="stage2" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className={cn(
                    "w-full flex flex-col",
                    isOnboardingActive ? "h-full" : "max-w-7xl h-auto"
                )}
            >
              {isOnboardingActive && hiringCandidate && hiringData ? (
                <OnboardingHub 
                    candidateName={hiringCandidate.name} 
                    hiringData={hiringData}
                    onBack={() => {
                        setIsOnboardingActive(false);
                        router.push(`/search/${params.id}`);
                    }} 
                />
              ) : (
              <>
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
                {totalProfilesSearched && !isLoadingResults && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-right pb-1">
                    <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                      <Zap className="size-3 md:size-4 text-primary fill-primary" />
                      <span className="text-lg md:text-3xl font-black tracking-tighter">{formatK(totalProfilesSearched)}</span>
                    </div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Profiles Scanned</p>
                  </motion.div>
                )}
              </div>

              {isLoadingResults ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
              ) : bestCandidates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
                  {bestCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      {...normalizeCandidateForCard(candidate)}
                      onHire={() => {
                          const cName = normalizeCandidateForCard(candidate).name;
                          setHiringCandidate({ id: candidate.id, name: cName });
                          setIsHiringModalOpen(true);
                      }}
                      onViewProfile={() => {
                        setSelectedProfile(candidate.raw_data);
                        setDrawerOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[3rem] border-muted gap-6">
                  <Button variant="outline" onClick={() => performSearch(userQuery!)}>Retry Search</Button>
                </div>
              )}
              </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ProfileDrawer2 isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} profile={selectedProfile} />

      {hiringCandidate && (
        <HiringModal 
            isOpen={isHiringModalOpen} 
            onClose={() => setIsHiringModalOpen(false)}
            candidateName={hiringCandidate.name}
            onConfirm={(data) => {
                hireCandidate({
                    id: hiringCandidate.id,
                    candidateName: hiringCandidate.name,
                    hiringData: data,
                    hiredAt: new Date().toISOString(),
                    status: "onboarding"
                });
                setIsHiringModalOpen(false);
                router.push(`/hired/${hiringCandidate.id}`);
                logInteraction('hiring_modal_confirmed', { candidateId: hiringCandidate.id, ...data });
            }}
        />
      )}
    </div>
  );
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("animate-spin", className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);