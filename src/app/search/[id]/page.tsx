
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
