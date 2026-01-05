
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GH_PAT;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Rate Limit Safety Threshold
const MIN_RATE_LIMIT_REMAINING = 50;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: Missing Supabase configuration (URL or Key).");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("Error: Missing GEMINI_API_KEY.");
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.warn("Warning: No GITHUB_ACCESS_TOKEN found. Rate limits will be very low (60/hr).");
}

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function checkRateLimit() {
  if (!GITHUB_TOKEN) return; // Anonymous requests have low limits anyway, but we can't check easily without auth sometimes
  
  try {
    const { data } = await octokit.rateLimit.get();
    const remaining = data.rate.remaining;
    console.log(`[Rate Limit] Remaining: ${remaining}`);
    
    if (remaining < MIN_RATE_LIMIT_REMAINING) {
      console.error(`[CRITICAL] Rate limit low (${remaining} < ${MIN_RATE_LIMIT_REMAINING}). Aborting to save quota.`);
      process.exit(0); // Exit cleanly
    }
  } catch (error) {
    console.warn("Failed to check rate limit:", error);
  }
}

// --- Helper: Gemini Brainstorming ---
async function brainstormKeywords(pastKeywords: string[], count: number): Promise<string[]> {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
    You are a Technical Recruiter AI. 
    We are building a database of developers from GitHub. 
    We have ALREADY searched for these topics: [${pastKeywords.join(', ')}].
    
    Give me a JSON array of ${count} NEW technical niches/keywords to search for.
    
    CRITICAL INSTRUCTION: Mix your strategy.
    - 50% should be "High Demand/High Volume" (e.g., "Full Stack Developer", "Python Backend", "React Frontend").
    - 50% should be "Hyper-Specific/Emerging" (e.g., "LangChain Agent", "Solidity Smart Contracts", "Rust Embedded").
    
    Use terms that developers actually put in their GitHub bios or "about" sections.
    
    Return ONLY the JSON array of strings. No markdown formatting.
    Example: ["Full Stack React", "Three.js WebGL"]
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to generate keywords with Gemini:", e);
    return [];
  }
}

async function runHarvest() {
  console.log("Starting Autonomous Harvest...");
  
  // 0. Initial Rate Limit Check
  await checkRateLimit();

  // 1. Fetch Search History
  const { data: history } = await supabase.from('ai_search_history').select('keyword');
  const pastKeywords = history?.map(h => h.keyword) || [];
  console.log(`[AI] Past keywords count: ${pastKeywords.length}`);

  // 2. Brainstorm with Gemini (3 niches)
  const NICHE_COUNT = 3;
  const newKeywords = await brainstormKeywords(pastKeywords, NICHE_COUNT);
  console.log(`[AI] Suggested niches: ${newKeywords.join(', ')}`);

  if (newKeywords.length === 0) {
    console.error("No keywords generated. Exiting.");
    return;
  }

  let totalProfilesSaved = 0;
  const PROFILES_PER_NICHE = 200;

  // 3. Harvest Loop
  for (const keyword of newKeywords) {
    console.log(`\n--- Searching for: ${keyword} ---`);
    await checkRateLimit(); // Check before each keyword

        try {

          // A. Search GitHub (with Pagination)

          let users: any[] = [];

          let page = 1;

          

          while (users.length < PROFILES_PER_NICHE) {

            const remaining = PROFILES_PER_NICHE - users.length;

            const perPage = Math.min(remaining, 100); // GitHub max is 100

            

            console.log(`[GH] Fetching page ${page} for "${keyword}" (Target: ${perPage})...`);

            

            try {

              const searchRes = await octokit.search.users({

                q: `${keyword} sort:followers`,

                per_page: perPage,

                page: page

              });

              

              const newUsers = searchRes.data.items;

              if (newUsers.length === 0) break; // No more results

              

              users = users.concat(newUsers);

              page++;

              

              // Brief pause between search pages

              await new Promise(r => setTimeout(r, 1000));

              

            } catch (e: any) {

              console.error(`[GH] Search failed on page ${page}: ${e.message}`);

              break;

            }

          }

    

          console.log(`[GH] Found total ${users.length} matches for "${keyword}".`);

    

          let savedForThisKeyword = 0;

      for (const userStub of users) {
        // Check rate limit periodically (e.g., every user or just rely on the keyword check? Let's check every 5 users or so to be safe, or just relying on header inspection if we implemented middleware, but here explicit check is safer)
        // To be safe and simple, we check if we are getting close to the edge inside the loop if we do many calls.
        // For now, the implementation plan says "actively check x-ratelimit-remaining headers". 
        // Since Octokit doesn't expose headers easily in the simple method return types without accessing `response` object explicitly, 
        // we might stick to explicit checks or try to access `headers` if possible. 
        // But `await octokit.users.getByUsername` returns `{ data, headers, ... }`.
        
        try {
          // B. Get Full Details (Base Profile)
          const profileRes = await octokit.users.getByUsername ({
            username: userStub.login,
          });
          
          const userProfile = profileRes.data;
          
          // Check Rate Limit from headers
          const remaining = profileRes.headers['x-ratelimit-remaining'];
          if (remaining && parseInt(String(remaining)) < MIN_RATE_LIMIT_REMAINING) {
             console.error(`[CRITICAL] Rate limit low (${remaining}). Aborting.`);
             process.exit(0);
          }

          // Quality Check: Lowered Threshold
          // > 1 Follower OR > 2 Public Repos
          const isHighQuality = (userProfile.followers > 1 || userProfile.public_repos > 2);
          
          let enrichedData: any = { user: userProfile };

          if (isHighQuality) {
            console.log(`> Deep fetching for ${userStub.login}...`);
            
            // 1. Fetch Top 20 Repos (sorted by pushed)
            const reposRes = await octokit.repos.listForUser ({
              username: userStub.login,
              sort: 'pushed',
              per_page: 20
            });
            const repos = reposRes.data;

            // 2. Fetch Social Accounts
            let socials: any[] = [];
            try {
               const socialRes = await octokit.users.listSocialAccountsForUser ({ username: userStub.login });
               socials = socialRes.data;
            } catch (e) { /* social endpoint might 404 */ }

            // 3. Fetch Profile Readme
            let readme = null;
            try {
               const readmeRes = await octokit.repos.getReadme ({
                 owner: userStub.login, 
                 repo: userStub.login,
                 mediaType: { format: "raw" }
               });
               readme = String(readmeRes.data); 
            } catch (e) { /* 404 is common */ }

            // 4. Fetch Recent Activity (Max 100 Events)
            let recentActivity: any[] = [];
            try {
                const eventsRes = await octokit.activity.listPublicEventsForUser ({
                    username: userStub.login, 
                    per_page: 100 
                });
                recentActivity = eventsRes.data;
            } catch (e) { /* ignore */ }

            enrichedData = {
                user: userProfile,
                repos: repos,
                socials: socials,
                readme: readme,
                activity: recentActivity,
                meta: { 
                  fetched_deep: true,
                  crawled_at: new Date().toISOString(),
                  source_keyword: keyword
                }
            };

          } else {
            console.log(`> Skipping deep fetch for ${userStub.login} (Low Signal)`);
            enrichedData = {
                user: userProfile,
                meta: { 
                  fetched_deep: false, 
                  skip_reason: `Low signal: ${userProfile.followers} followers, ${userProfile.public_repos} repos`,
                  crawled_at: new Date().toISOString(),
                  source_keyword: keyword
                }
            };
          }

          // C. Upsert to Supabase
          const { error } = await supabase
            .from('github_raw_profiles')
            .upsert({
                github_id: userProfile.id,
                username: userProfile.login,
                raw_data: enrichedData,
                fetched_deep: isHighQuality,
                scraped_at: new Date().toISOString()
            }, { onConflict: 'github_id' });

          if (error) {
            console.error(`Error saving ${userProfile.login}: ${error.message}`);
          } else {
            savedForThisKeyword++;
          }
        } catch (err: any) {
            console.error(`Failed to fetch/save user ${userStub.login}: ${err.message}`);
        }
        
        // Respect API politeness
        await new Promise(r => setTimeout(r, 200)); 
      }

      // D. Record History
      await supabase.from('ai_search_history').upsert({
        keyword: keyword,
        profiles_found: savedForThisKeyword,
        used_at: new Date().toISOString()
      }, { onConflict: 'keyword' });

      totalProfilesSaved += savedForThisKeyword;
      console.log(`[Summary] Saved ${savedForThisKeyword} profiles for "${keyword}".`);
      
      // Pause between niches
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\nHarvest Complete. Total profiles saved: ${totalProfilesSaved}`);
}

runHarvest().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
