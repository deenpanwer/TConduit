
"use client";

import {
  Plan,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
  PlanAction,
} from "@/components/ai-elements/plan";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Moon, Sun, ChevronsLeft, ChevronsRight } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import SocialScan2 from "@/components/ai-elements/SocialScan2";
import { useTheme } from "next-themes";
import ProfileCard from "@/components/ProfileCard";
import Link from "next/link";
import PlanSkeleton from "@/components/ai-elements/PlanSkeleton";
import Meters from "@/components/Meters";
import { embedText } from "@/app/actions"; // Correctly import embedText
import { createClient } from '@supabase/supabase-js'; // Import Supabase client

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Type definition for ProfileData, consistent with Supabase table
interface ProfileData {
  page_url: string | null;
  profile_image_url: string | null;
  name: string | null;
  username: string | null;
  rating: number | null;
  num_reviews: number | null;
  headline: string | null;
  country: string | null;
  languages: string[] | null;
  about_me: string | null;
  skills: string[] | null;
  seller_level: string | null;
  average_response_time: string | null;
  review_breakdown: { [key: string]: number } | null;
  num_projects: number | null;
  phone_number: string | null;
  email: string | null;
  competence_score: number | null;
  agency_score: number | null;
  embedding: number[] | string | null; // Allow for string initially
}

// --- Vector Similarity Function ---
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}


const Test2Page = () => {
  const [stage, setStage] = useState("stage1");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [competencyScore, setCompetencyScore] = useState(0); // Initial score
  const [agencyScore, setAgencyScore] = useState(0); // Initial score

  const { theme, setTheme } = useTheme();

  // Data from Genkit via sessionStorage
  const [planData, setPlanData] = useState<any | null>(null);
  const [userQuery, setUserQuery] = useState<string | null>(null);

  // States for fetched profile and loading
  const [bestProfile, setBestProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);


  // Streaming states for Reasoning component
  const [content, setContent] = useState("");
  const [isStreamingReasoning, setIsStreamingReasoning] = useState(false);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);

  // User email initial for profile icon
  const [userEmailInitial, setUserEmailInitial] = useState<string | null>(null);

  // Function to chunk text into fake tokens
  const chunkIntoTokens = useCallback((text: string): string[] => {
    const tokens: string[] = [];
    let i = 0;
    while (i < text.length) {
      const chunkSize = Math.floor(Math.random() * 2) + 3;
      tokens.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return tokens;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPlanData = sessionStorage.getItem('generatedPlanData');
      const storedUserQuery = sessionStorage.getItem('userQueryForPlan');
      const storedUserEmail = sessionStorage.getItem('userEmail');

      if (storedPlanData) {
        const parsedPlanData = JSON.parse(storedPlanData);
        setPlanData(parsedPlanData);
        if (parsedPlanData.competence_score !== undefined) {
          setCompetencyScore(parsedPlanData.competence_score);
        }
        if (parsedPlanData.agency_score !== undefined) {
          setAgencyScore(parsedPlanData.agency_score);
        }
      }
      if (storedUserQuery) {
        console.log("Retrieved query from session storage:", storedUserQuery);
        setUserQuery(storedUserQuery);
      }
      if (storedUserEmail) {
        setUserEmailInitial(storedUserEmail.charAt(0).toUpperCase());
      }
    }
  }, []);

  // Effect to fetch the best profile based on userQuery
  useEffect(() => {
    const findAndSetBestProfile = async () => {
      if (!userQuery) {
        console.log("No user query found, skipping profile search.");
        setIsLoadingProfile(false);
        return;
      }
      
      setIsLoadingProfile(true);
      console.log(`Starting client-side semantic search with query: "${userQuery}"`);

      try {
        // Step 1: Generate an embedding for the user's query
        const queryEmbedding = await embedText(userQuery);
        if (!queryEmbedding) {
          throw new Error('Failed to generate embedding for the query.');
        }
        console.log("Successfully generated query embedding.");

        // Step 2: Fetch all profiles from the database
        console.log("Fetching all profiles from 'fiverr_profiles' table...");
        const { data: profiles, error } = await supabase
          .from('fiverr_profiles')
          .select('*');

        if (error) {
          console.error("Supabase fetch error:", error);
          throw new Error(`Failed to fetch profiles: ${error.message}`);
        }

        if (!profiles || profiles.length === 0) {
          console.log("No profiles found in the database table.");
          setBestProfile(null);
          setIsLoadingProfile(false);
          return;
        }
        console.log(`Fetched ${profiles.length} profiles to search through.`);

        // Step 3: Find the best profile using client-side similarity search
        let bestProfile: ProfileData | null = null;
        let highestSimilarity = -1;

        for (const profile of profiles) {
          // Supabase returns embedding as a string like '[0.1, 0.2, ...]'. We need to parse it.
          let profileEmbedding: number[] | null = null;
          if (typeof profile.embedding === 'string') {
            try {
              profileEmbedding = JSON.parse(profile.embedding);
            } catch (e) {
              console.error(`Could not parse embedding for profile ${profile.username}`, e);
              continue; // Skip this profile if embedding is invalid
            }
          } else if (Array.isArray(profile.embedding)) {
            profileEmbedding = profile.embedding;
          }

          if (profileEmbedding) {
            const similarity = cosineSimilarity(queryEmbedding, profileEmbedding);
            if (similarity > highestSimilarity) {
              highestSimilarity = similarity;
              bestProfile = profile;
            }
          }
        }

        if (bestProfile) {
            console.log(`Best profile found via client-side search: ${bestProfile.name} with similarity ${highestSimilarity}`);
            setBestProfile(bestProfile);
            setCompetencyScore(bestProfile.competence_score ?? 0);
            setAgencyScore(bestProfile.agency_score ?? 0);
        } else {
            console.log("Could not determine a best profile from the returned set.");
            setBestProfile(null);
        }

      } catch (error) {
        console.error('An error occurred during the client-side profile search process:', error);
        setBestProfile(null);
      } finally {
        setIsLoadingProfile(false);
        console.log("Client-side profile search process finished.");
      }
    };

    findAndSetBestProfile();
  }, [userQuery]); // This effect runs when userQuery is set

  // Initialize reasoning streaming
  useEffect(() => {
    if (planData && planData.rawReasoning) {
      const tokenizedSteps = chunkIntoTokens(planData.rawReasoning);
      setTokens(tokenizedSteps);
      setContent("");
      setCurrentTokenIndex(0);
      setIsStreamingReasoning(true);
    }
  }, [planData, chunkIntoTokens]);


  // Stream content token by token
  useEffect(() => {
    if (!isStreamingReasoning || currentTokenIndex >= tokens.length) {
      if (isStreamingReasoning) {
        setIsStreamingReasoning(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setContent((prev) => prev + tokens[currentTokenIndex]);
      setCurrentTokenIndex((prev) => prev + 1);
    }, 25); 

    return () => clearTimeout(timer);
  }, [isStreamingReasoning, currentTokenIndex, tokens]);

  // Auto-advance from Stage 2 to Stage 3
  useEffect(() => {
    if (stage === "stage2") {
      const timer = setTimeout(() => {
        setStage("stage3");
      }, 14000); // This delay simulates the "Finding Candidates" task
      return () => clearTimeout(timer);
    }
  }, [stage]);
  
    const toggleTheme = () => {
      setTheme(theme === "light" ? "dark" : "light");
    };
  
    return (
      <div className="flex h-screen bg-background text-foreground">
        {/* Side Strip */}
        <div
          className={`bg-card border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
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
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-semibold">
                  {userEmailInitial}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
              </Button>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === "light" ? <Moon /> : <Sun />}
                </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {stage === "stage1" && (
              <motion.div
                key="stage1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl"
              >
                {planData ? (
                  <>
                    <Reasoning
                      className="w-full"
                      isStreaming={isStreamingReasoning}
                    >
                      <ReasoningTrigger />
                      <ReasoningContent>{content}</ReasoningContent>
                    </Reasoning>

                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {isStreamingReasoning ? (
                          <PlanSkeleton />
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                          >
                            <Plan className="mt-4" defaultOpen={true}>
                            <PlanHeader>
                              <div>
                                <div className="mb-4 flex items-center gap-2">
                                  <FileText className="size-4" />
                                  <PlanTitle>{planData.title}</PlanTitle>
                                </div>
                                <PlanDescription>{planData.description}</PlanDescription>
                              </div>
                              <PlanTrigger />
                            </PlanHeader>
                            <PlanContent>
                              <div className="space-y-4 text-sm">
                                <div>
                                  <h3 className="mb-2 font-semibold">Key Steps</h3>
                                  <ul className="list-inside list-disc space-y-1">
                                    {planData.keySteps.map((step: string, index: number) => (
                                      <li key={index}>{step}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </PlanContent>
                            <PlanFooter className="justify-end">
                              <PlanAction>
                                <Button
                                  size="sm"
                                  onClick={() => setStage("stage2")}
                                >
                                  Start Hiring <kbd className="font-mono">⌘↩</kbd>
                                </Button>
                              </PlanAction>
                            </PlanFooter>
                                                      </Plan>
                                                    </motion.div>                        )}
                      </motion.div>
                    </AnimatePresence>
                  </>
                ) : (
                  <PlanSkeleton /> 
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
                  <TaskTrigger title="Finding Candidates" />
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
                className="w-full flex flex-row items-start justify-center max-w-5xl gap-8"
              >
                <div className="flex flex-col items-start space-y-6 p-4 rounded-lg bg-gray-800 text-white shadow-lg">
                  <h3 className="text-xl font-bold mb-2">Performance Barometers</h3>
                  <Meters
                    competencyScore={competencyScore}
                    agencyScore={agencyScore}
                  />
                </div>

                {isLoadingProfile ? null : bestProfile ? (
                  <ProfileCard
                    name={bestProfile.name}
                    title={bestProfile.headline}
                    description={bestProfile.about_me}
                    imageUrl={bestProfile.profile_image_url}
                    skills={bestProfile.skills}
                    rating={bestProfile.rating}
                    numReviews={bestProfile.num_reviews}
                    sellerLevel={bestProfile.seller_level}
                    averageResponseTime={bestProfile.average_response_time}
                    email={bestProfile.email}
                    phone={bestProfile.phone_number}
                  />
                ) : (
                  <p className="text-white">No suitable profile found.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
  );
};

export default Test2Page;

