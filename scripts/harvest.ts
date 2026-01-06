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
  if (!GITHUB_TOKEN) return; 
  
  try {
    const { data } = await octokit.rateLimit.get();
    const remaining = data.rate.remaining;
    console.log(`[Rate Limit] Remaining: ${remaining}`);
    
    if (remaining < MIN_RATE_LIMIT_REMAINING) {
      console.error(`[CRITICAL] Rate limit low (${remaining} < ${MIN_RATE_LIMIT_REMAINING}). Aborting to save quota.`);
      process.exit(0); 
    }
  } catch (error) {
    console.warn("Failed to check rate limit:", error);
  }
}

// --- Intelligence Helpers ---

async function callGeminiWithFallback(prompt: string): Promise<string> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response");
      
      return text;
    } catch (e: any) {
      lastError = e;
      console.warn(`[AI] ${model} failed: ${e.message}. Trying next...`);
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

async function brainstormKeywords(pastKeywords: string[], count: number): Promise<string[]> {
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
  `;

  try {
    const text = await callGeminiWithFallback(prompt);
    return JSON.parse(text || "[]");
  } catch (e) {
    console.error("[AI] Keyword generation failed:", e);
    throw e;
  }
}

async function runHarvest() {
  console.log("Starting Autonomous Harvest...");
  
  await checkRateLimit();

  // 1. Fetch Search History
  const { data: history } = await supabase.from('ai_search_history').select('keyword');
  const pastKeywords = history?.map(h => h.keyword) || [];
  console.log(`[AI] Past keywords count: ${pastKeywords.length}`);

  // 2. Brainstorm with Gemini (3 niches)
  const NICHE_COUNT = 3;
  let newKeywords: string[] = [];
  try {
    newKeywords = await brainstormKeywords(pastKeywords, NICHE_COUNT);
    console.log(`[AI] Suggested niches: ${newKeywords.join(', ')}`);
  } catch (e) {
    console.error("AI Error. Aborting.");
    return;
  }

  if (newKeywords.length === 0) {
    console.error("No keywords generated. Exiting.");
    return;
  }

  let totalProfilesSaved = 0;
  const PROFILES_PER_NICHE = 200;

  // 3. Harvest Loop
  for (const keyword of newKeywords) {
    console.log(`
--- Searching for: ${keyword} ---`);
    await checkRateLimit(); 

    // A. Search GitHub (with Pagination)
    let users: any[] = [];
    let page = 1;

    while (users.length < PROFILES_PER_NICHE) {
      const remaining = PROFILES_PER_NICHE - users.length;
      const perPage = Math.min(remaining, 100); 

      console.log(`[GH] Fetching page ${page} for "${keyword}" (Target: ${perPage})...
`);

      try {
        const searchRes = await octokit.search.users ({
          q: `${keyword} sort:followers`,
          per_page: perPage,
          page: page
        });

        const newUsers = searchRes.data.items;
        if (newUsers.length === 0) break; 

        users = users.concat(newUsers);
        page++;

        await new Promise(r => setTimeout(r, 1000));

      } catch (e: any) {
        console.error(`[GH] Search failed on page ${page}: ${e.message}`);
        break;
      }
    }

    console.log(`[GH] Found total ${users.length} matches for "${keyword}".`);

    let savedForThisKeyword = 0;

    for (const userStub of users) {
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

        const isHighQuality = (userProfile.followers > 1 || userProfile.public_repos > 2);
        
        let enrichedData: any = { user: userProfile };

        if (isHighQuality) {
          console.log(`> Deep fetching for ${userStub.login}...
`);
          
          const reposRes = await octokit.repos.listForUser ({
            username: userStub.login,
            sort: 'pushed',
            per_page: 20
          });
          const repos = reposRes.data;

          let socials: any[] = [];
          try {
             const socialRes = await octokit.users.listSocialAccountsForUser ({ username: userStub.login });
             socials = socialRes.data;
          } catch (e) { }

          let readme = null;
          try {
             const readmeRes = await octokit.repos.getReadme ({
               owner: userStub.login, 
               repo: userStub.login,
               mediaType: { format: "raw" }
             });
             readme = String(readmeRes.data); 
          } catch (e) { }

          let recentActivity: any[] = [];
          try {
              const eventsRes = await octokit.activity.listPublicEventsForUser ({
                  username: userStub.login, 
                  per_page: 100 
              });
              recentActivity = eventsRes.data;
          } catch (e) { }

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
          console.log(`> Skipping deep fetch for ${userStub.login} (Low Signal)
`);
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
    
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`
Harvest Complete. Total profiles saved: ${totalProfilesSaved}`);
}

runHarvest().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});