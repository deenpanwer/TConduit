
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
  Download, Box, Github, Layers 
} from "lucide-react";
import { useEffect, useState } from "react";
import SocialScan2 from "@/components/ai-elements/SocialScan2";
import { useTheme } from "next-themes";
import { CandidateCard, CandidateStat } from "@/components/ai-elements/CandidateCard";
import { ProfileDrawer } from "@/components/ai-elements/ProfileDrawer";
import ProfileDrawer2 from "@/components/ai-elements/ProfileDrawer2";
import Link from "next/link";
import { embedText } from "@/app/actions";
import { createClient } from '@supabase/supabase-js';
import { Plan2 } from "@/components/ai-elements/plan2";

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Types ---
interface UnifiedProfile {
  id: string;
  source_type: 'freelancer' | 'github' | 'npm';
  similarity: number;
  raw_data: any; // The JSON blob
}

const SearchPage = () => {
  const [stage, setStage] = useState("stage1");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { theme, setTheme } = useTheme();

  // Data from Genkit via sessionStorage
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<{title: string, final_query: string} | null>(null);

  // States for fetched profiles
  const [bestCandidates, setBestCandidates] = useState<UnifiedProfile[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UnifiedProfile | null>(null);

  // User email initial for profile icon
  const [userEmailInitial, setUserEmailInitial] = useState<string | null>(null);

  const handlePlanConfirmed = (result: { title: string; final_query: string }) => {
    setConfirmedPlan(result);
    setUserQuery(result.final_query);
    setStage("stage2");
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // The user query is now the defining piece of state, let's get it from the session.
      const storedUserQuery = sessionStorage.getItem('userQueryForPlan');
      const storedUserEmail = sessionStorage.getItem('userEmail');

      if (storedUserQuery) {
        console.log("Retrieved query from session storage:", storedUserQuery);
        setUserQuery(storedUserQuery);
      }
      if (storedUserEmail) {
        setUserEmailInitial(storedUserEmail.charAt(0).toUpperCase());
      }
    }
  }, []);

  // Effect to fetch unified profiles
  useEffect(() => {
    const fetchUnifiedProfiles = async () => {
      if (!userQuery) {
        setIsLoadingProfile(false);
        return;
      }
      
      setIsLoadingProfile(true);
      console.log(`Starting unified hybrid search with query: "${userQuery}"`);

      try {
        // Step 1: Generate Embedding for Freelancer semantic search
        const queryEmbedding = await embedText(userQuery);
        if (!queryEmbedding) throw new Error('Failed to generate embedding.');

        // Step 2: Call the Unified Hybrid RPC
        const { data: profiles, error } = await supabase.rpc('match_unified_profiles_hybrid', {
          query_embedding: queryEmbedding,
          query_text: userQuery, // Pass text for keyword search
          match_threshold: 0.5,
          match_count: 3,
        });

        if (error) throw error;

        if (profiles && profiles.length > 0) {
          console.log(`Fetched ${profiles.length} unified profiles.`);
          setBestCandidates(profiles as UnifiedProfile[]);
        } else {
          console.log("No unified profiles found.");
          setBestCandidates([]);
        }

      } catch (error) {
        console.error('Search error:', error);
        setBestCandidates([]);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if(stage === 'stage2' || stage === 'stage3') {
        fetchUnifiedProfiles();
    }
  }, [userQuery, stage]);


  // Auto-advance
  useEffect(() => {
    if (stage === "stage2") {
      const timer = setTimeout(() => {
        setStage("stage3");
      }, 14000);
      return () => clearTimeout(timer);
    }
  }, [stage]);
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // --- Normalization Logic for Card Display ---
  const normalizeCandidateForCard = (candidate: UnifiedProfile) => {
    const raw = candidate.raw_data;
    const type = candidate.source_type;

    let props = {
      name: "Unknown",
      username: "user",
      avatarUrl: "",
      bio: "",
      skills: [] as string[],
      stats: [] as CandidateStat[],
    };

    if (type === 'freelancer') {
      props = {
        name: raw.name,
        username: raw.username,
        avatarUrl: raw.profile_image_url,
        bio: raw.headline, // Use headline as bio for list view
        skills: raw.skills || [],
        stats: [
          { label: 'Rating', value: raw.rating, icon: Star },
          { label: 'Reviews', value: raw.num_reviews, icon: MessageSquare },
          { label: 'Competence', value: `${raw.competence_score || 0}%`, icon: Zap },
          { label: 'Agency', value: `${raw.agency_score || 0}%`, icon: CheckCircle },
          { label: 'Response', value: raw.average_response_time?.replace('Average response time: ', '') || 'N/A', icon: Clock },
          { label: 'Projects', value: raw.num_projects || 0, icon: Briefcase },
        ]
      };
        } else if (type === 'github') {
          const g = raw; // github_profiles row
          props = {
            name: g.name || g.username,
            username: g.username,
            avatarUrl: g.avatar_url,
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
        }
     else if (type === 'npm') {
      props = {
        name: raw.name || raw.username,
        username: raw.username,
        avatarUrl: raw.avatar_url,
        bio: `NPM Maintainer with ${raw.total_packages} published packages.`,
        skills: ["Node.js", "JavaScript", "Package Mgmt", "Backend"],
        stats: [
          { label: 'Weekly DLs', value: raw.total_downloads_weekly?.toLocaleString() || 0, icon: Download },
          { label: 'Packages', value: raw.total_packages, icon: Box },
          { label: 'Avg Impact', value: ~~((raw.total_downloads_weekly || 0) / (raw.total_packages || 1)), icon: Zap },
          { label: 'Maintainer', value: 'Active', icon: CheckCircle },
          { label: 'Type', value: 'NPM', icon: Box },
        ]
      };
    }

    return props;
  };

  const handleOpenDrawer = (profile: UnifiedProfile) => {
    setSelectedProfile(profile);
    setDrawerOpen(true);
  };
  
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Side Strip */}
      <div
        className={`bg-card border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"} shrink-0`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between">
            {!isCollapsed && <Link href="/" className="font-bold text-2xl">Trac</Link>}
            <Link href="/" className="font-bold text-2xl">
            <img
              src="/1.png"
              alt="Trac Logo"
              className="w-8 h-8"
            />
            </Link>
          </div>

          <div className="flex-grow"></div>
          <div className="flex flex-col items-center space-y-4">
            <div className="mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold border border-primary/20">
                {userEmailInitial || "U"}
              </div>
            </div>
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
              onClick={toggleTheme}
              className="hover:bg-secondary"
            >
              {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 flex items-center justify-center overflow-auto relative">
        <AnimatePresence mode="wait">
          {stage === "stage1" && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl"
            >
              {userQuery ? (
                  <Plan2 userQuery={userQuery} onPlanConfirmed={handlePlanConfirmed} />
              ) : (
                  <div>Loading...</div>
              )}
            </motion.div>
          )}

          {stage === "stage2" && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <Task className="w-full">
                <TaskTrigger title={confirmedPlan ? `Finding: ${confirmedPlan.title}` : "Finding Candidates"} />
                <TaskContent>
                  <SocialScan2 />
                </TaskContent>
              </Task>
            </motion.div>
          )}

          {stage === "stage3" && (
             <motion.div
              key="stage3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col max-w-7xl mx-auto"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Top Candidates</h2>
                <p className="text-muted-foreground">Based on your specific requirements across Freelancer, GitHub, and NPM networks.</p>
              </div>

              {isLoadingProfile ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                     <p>Searching unified networks...</p>
                  </div>
                </div>
              ) : bestCandidates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
                  {bestCandidates.map((candidate, index) => {
                    const props = normalizeCandidateForCard(candidate);
                    return (
                      <CandidateCard
                        key={candidate.id}
                        {...props}
                        onHire={() => console.log("Hire clicked for", props.name)}
                        onViewProfile={() => handleOpenDrawer(candidate)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">No suitable profiles found in any network.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Profile Detail Drawer */}
      {selectedProfile?.source_type === 'github' ? (
        <ProfileDrawer2
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          profile={selectedProfile?.raw_data}
        />
      ) : (
        <ProfileDrawer 
          isOpen={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          profile={selectedProfile?.raw_data}
          sourceType={selectedProfile?.source_type || null}
        />
      )}
    </div>
  );
};

export default SearchPage;
