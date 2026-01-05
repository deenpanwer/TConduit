
"use client";

import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Moon, Sun, ChevronsLeft, ChevronsRight, Pencil } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import SocialScan2 from "@/components/ai-elements/SocialScan2";
import { useTheme } from "next-themes";
import ProfileCard from "@/components/ProfileCard";
import Link from "next/link";
import { embedText } from "@/app/actions"; // Correctly import embedText
import { createClient } from '@supabase/supabase-js'; // Import Supabase client
import { Plan2 } from "@/components/ai-elements/plan2";

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
  similarity: number;
}




const SearchPage = () => {
  const [stage, setStage] = useState("stage1");
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const { theme, setTheme } = useTheme();

  // Data from Genkit via sessionStorage
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<{title: string, final_query: string} | null>(null);


  // States for fetched profile and loading
  const [bestProfile, setBestProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // User email initial for profile icon
  const [userEmailInitial, setUserEmailInitial] = useState<string | null>(null);

  const handlePlanConfirmed = (result: { title: string; final_query: string }) => {
    setConfirmedPlan(result);
    setUserQuery(result.final_query); // Set the user query to the confirmed final_query
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

        // Step 2: Call the Supabase RPC to find the best profiles
        console.log("Calling Supabase RPC 'match_profiles'...");
        const { data: profiles, error } = await supabase.rpc('match_profiles', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5, // Adjust this threshold as needed (0.0 to 1.0)
          match_count: 3,      // Retrieve the top 3 profiles as requested
        });

        if (error) {
          console.error("Supabase RPC error:", error);
          throw new Error(`Failed to fetch profiles via RPC: ${error.message}`);
        }

        if (!profiles || profiles.length === 0) {
          console.log("No profiles found via RPC for the given query and threshold.");
          setBestProfile(null);
          setIsLoadingProfile(false);
          return;
        }
        console.log(`Fetched ${profiles.length} profiles via RPC.`);

        // The RPC returns profiles already ordered by similarity, so the first one is the best.
        // If your UI can display multiple profiles, you would use the 'profiles' array directly.
        // For now, we'll set the bestProfile to the first one as your current UI seems to display a single card.
        const bestRpcProfile = profiles[0] as ProfileData; // Cast to ProfileData with similarity
        if (bestRpcProfile) {
            console.log(`Best profile found via RPC: ${bestRpcProfile.name} with similarity ${bestRpcProfile.similarity}`);
            setBestProfile(bestRpcProfile);
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

    // Only run the search if we are in the later stages.
    if(stage === 'stage2' || stage === 'stage3') {
        findAndSetBestProfile();
    }
  }, [userQuery, stage]); // This effect runs when userQuery or stage changes


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
                className="w-full flex items-start justify-center max-w-5xl"
              >
                {isLoadingProfile ? (
                  <p>Searching for the best candidate...</p>
                ) : bestProfile ? (
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
                    competencyScore={bestProfile.competence_score ?? 0}
                    agencyScore={bestProfile.agency_score ?? 0}
                  />
                ) : (
                  <p className="text-muted-foreground">No suitable profile found.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
  );
};

export default SearchPage;
