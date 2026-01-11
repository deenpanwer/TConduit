// harvest.ts

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

// --- Helpers for Data Synthesis ---

function decodeEmail(text: string): string | null {
  if (!text) return null;
  const obfuscated = text.match(/([a-zA-Z0-9._-]+)\s*[\[\(\{\s]*at[\]\)\}\s]*\s*([a-zA-Z0-9.-]+)\s*[\[\(\{\s]*dot[\]\)\}\s]*\s*([a-zA-Z]{2,})/i);
  if (obfuscated) return `${obfuscated[1]}@${obfuscated[2]}.${obfuscated[3]}`.toLowerCase();
  const standard = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return standard ? standard[0].toLowerCase() : null;
}

function inferOrgRole(bio: string, readme: string): string | null {
  const text = `${bio || ''} ${readme || ''}`.toLowerCase();
  if (text.includes('framework') || text.includes('library') || text.includes('tool')) return 'Tool';
  if (text.includes('agency') || text.includes('solutions') || text.includes('company')) return 'Company';
  if (text.includes('community') || text.includes('group') || text.includes('non-profit')) return 'Community';
  if (text.includes('service') || text.includes('platform')) return 'Service';
  return null;
}

function calculateLanguageProficiency(repos: any[]) {
  const proficiency: Record<string, number> = {};
  let totalWeight = 0;
  repos.forEach(repo => {
    if (repo.language && repo.size) {
      proficiency[repo.language] = (proficiency[repo.language] || 0) + repo.size;
      totalWeight += repo.size;
    }
  });
  if (totalWeight === 0) return {};
  Object.keys(proficiency).forEach(lang => {
    proficiency[lang] = parseFloat((proficiency[lang] / totalWeight).toFixed(2));
  });
  return proficiency;
}

function analyzeActivity(activity: any[]) {
  if (!activity) return {};
  const prs = activity.filter(a => a.type === 'PullRequestEvent').length;
  const issues = activity.filter(a => a.type === 'IssuesEvent').length;
  const commits = activity.filter(a => a.type === 'PushEvent').length;
  return {
    pr_count: prs,
    issue_count: issues,
    commit_count: commits,
    is_contributor: prs > 0 || issues > 2,
    velocity_score: (prs * 3) + (issues * 1) + (commits * 0.5)
  };
}

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

async function brainstormKeywords(history: any[], count: number): Promise<string[]> {
  // Format history for the prompt
  const historyText = history.map(h => 
    `- "${h.keyword}": Found ${h.profiles_found} profiles (Last run: ${h.used_at})`
  ).join('\n');

  const prompt = `
    You are a Technical Recruiter AI optimized for High-Volume Talent Sourcing.
    
    ### Mission
    Select exactly ${count} SEARCH KEYWORD(s) to find developers on GitHub.
    
    ### Past Search History
    ${historyText}

    ### Strategy
    1. **Analyze Past Success:** Look at the 'Found' counts in the history.
       - If a keyword returned MANY profiles (e.g., > 100), it implies High Volume/High Availability. You SHOULD consider searching it again or a close variation if it's a broad, "evergreen" role (e.g., "Frontend Developer").
       - If a keyword returned FEW profiles, it might be too niche.
    
    2. **Hiring Intent vs. Volume:**
       - We want to maximize the number of valid developer profiles we gather.
       - Prefer broad, high-volume terms (like "React", "Python", "Full Stack") over hyper-niche ones unless the niche is trending heavily.
    
    3. **Output:**
       - Return a JSON array of strings.
       - Example: ["Senior React Developer"] or ["Python Backend"]
       - DO NOT return markdown. Just the raw JSON array.
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
  console.log("Starting Autonomous Harvest (Deep Search Mode)...");
  
  await checkRateLimit();

  // 1. Fetch Search History
  const { data: history } = await supabase.from('ai_search_history').select('*');
  const pastHistory = history || [];
  console.log(`[AI] Analyzed ${pastHistory.length} past search runs.`);

  // 2. Brainstorm with Gemini (1 Deep Target)
  const NICHE_COUNT = 1;
  let newKeywords: string[] = [];
  try {
    newKeywords = await brainstormKeywords(pastHistory, NICHE_COUNT);
    console.log(`[AI] Selected Target: ${newKeywords.join(', ')}`);
  } catch (e) {
    console.error("AI Error. Aborting.");
    return;
  }

  if (newKeywords.length === 0) {
    console.error("No keywords generated. Exiting.");
    return;
  }

  let totalProfilesSaved = 0;
  // Deep Search: Increase limit significantly to capture depth
  const PROFILES_PER_NICHE = 1000; 

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
        const searchRes = await octokit.search.users({
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

    let engineersSavedInNiche = 0; // Renamed from savedForThisKeyword to match user's new code

    for (const userStub of users) {
      try {
        // B. Get Full Details (Base Profile)
        const profileRes = await octokit.users.getByUsername({
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
        
        // Skip low quality profiles entirely to save DB space and API calls if strictly needed,
        // OR just save the base profile. The prompt implies "capture relevant things".
        // Let's stick to the existing logic of deep fetching High Quality ones.
        
        let repos: any[] = [];
        let socials: any[] = [];
        let readme = "";
        let recentActivity: any[] = [];

        if (isHighQuality) {
          console.log(`> Deep fetching for ${userStub.login}...`);
          
          try {
            const reposRes = await octokit.repos.listForUser({
              username: userStub.login,
              sort: 'pushed',
              per_page: 100
            });
            repos = reposRes.data;
          } catch (e) { console.warn(`  Failed to fetch repos for ${userStub.login}`); }

          try {
             const socialRes = await octokit.users.listSocialAccountsForUser({ username: userStub.login });
             socials = socialRes.data;
          } catch (e) { console.warn(`  Failed to fetch socials for ${userStub.login}`); }

          try {
             const readmeRes = await octokit.repos.getReadme({
               owner: userStub.login, 
               repo: userStub.login,
               mediaType: { format: "raw" }
             });
             readme = String(readmeRes.data); 
          } catch (e) { /* No readme is fine */ }

          try {
              const eventsRes = await octokit.activity.listPublicEventsForUser({
                  username: userStub.login, 
                  per_page: 100 
              });
              recentActivity = eventsRes.data;
          } catch (e) { /* No activity is fine */ }
        } else {
            console.log(`> Skipping deep fetch for ${userStub.login} (Low Signal)`);
        }

        // C. Synthesize Data
        let totalStars = 0;
        const topicSet = new Set<string>();
        let latestPushDate: Date | null = null;
        let allRepoDescriptions = "";

        repos.forEach((repo: any) => {
          totalStars += repo.stargazers_count || 0;
          if (repo.topics) repo.topics.forEach((t: string) => topicSet.add(t));
          if (repo.description) allRepoDescriptions += " " + repo.description;
          if (repo.pushed_at) {
            const pushDate = new Date(repo.pushed_at);
            if (!latestPushDate || pushDate > latestPushDate) latestPushDate = pushDate;
          }
        });

        const lastActiveDays = latestPushDate
          ? Math.floor((new Date().getTime() - (latestPushDate as any).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const langProficiency = calculateLanguageProficiency(repos);
        const topLangs = Object.entries(langProficiency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([lang]) => lang);

        // EXPANDED SEARCH AREA: Bio + Readme + Company + Location + All Repo Descriptions
        const combinedText = `${userProfile.bio || ''} ${userProfile.company || ''} ${userProfile.location || ''} ${userProfile.blog || ''} ${readme} ${allRepoDescriptions}`;

        // Link Extraction
        let twitter_url = userProfile.twitter_username ? `https://twitter.com/${userProfile.twitter_username}` : null;
        let linkedin_url = null;
        let leetcode_url = null;
        let stackoverflow_url = null;
        let portfolio_url = userProfile.blog || null;

        // A. Extract from official socials array
        socials.forEach((s: any) => {
          const url = s.url;
          if (url.includes('linkedin.com')) linkedin_url = url;
          if (url.includes('twitter.com')) twitter_url = url;
          if (url.includes('leetcode.com')) leetcode_url = url;
          if (url.includes('stackoverflow.com')) stackoverflow_url = url;
        });

        // B. Regex Fallbacks for Expanded Text
        if (!linkedin_url) linkedin_url = combinedText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)?.[0] || null;
        if (!leetcode_url) leetcode_url = combinedText.match(/https?:\/\/(www\.)?leetcode\.com\/u\/[a-zA-Z0-9_-]+/i)?.[0] || combinedText.match(/https?:\/\/(www\.)?leetcode\.com\/[a-zA-Z0-9_-]+/i)?.[0] || null;
        if (!stackoverflow_url) stackoverflow_url = combinedText.match(/https?:\/\/(www\.)?stackoverflow\.com\/users\/[0-9]+\/[a-zA-Z0-9_-]+/i)?.[0] || null;

        // C. Portfolio Cleanup
        if (portfolio_url && (portfolio_url.includes('linkedin.com') || portfolio_url.includes('twitter.com') || portfolio_url.includes('github.com'))) {
          portfolio_url = null;
        }

        // Email - Extra aggressive search
        const email = userProfile.email || decodeEmail(combinedText);

        // Leetcode stats parsing (from bio/readme text like "Leetcode 1608+")
        const scoreMatch = combinedText.match(/Leetcode\s*(\d+)/i);
        const topMatch = combinedText.match(/top\s*(\d+)\s*%/i);
        
        const leetcodeScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
        const leetcodeTopPercent = topMatch ? parseInt(topMatch[1]) : null;

        const synthesizedProfile = {
          github_id: userProfile.id,
          username: userProfile.login,
          name: userProfile.name,
          type: userProfile.type,
          organization_role: userProfile.type === 'Organization' ? inferOrgRole(userProfile.bio || '', readme) : null,
          avatar_url: userProfile.avatar_url,
          bio: userProfile.bio,
          location: userProfile.location,
          company: userProfile.company,
          blog: userProfile.blog,
          email: email,
          
          twitter_url,
          linkedin_url,
          leetcode_url,
          stackoverflow_url,
          portfolio_url,

          public_repos: userProfile.public_repos || 0,
          public_gists: userProfile.public_gists || 0,
          followers: userProfile.followers || 0,
          following: userProfile.following || 0,
          total_stars: totalStars,
          hireable: userProfile.hireable || false,
          last_active_days: lastActiveDays,
          
          gh_created_at: userProfile.created_at,
          gh_updated_at: userProfile.updated_at,
          
          top_languages: topLangs,
          language_proficiency: langProficiency,
          technical_topics: Array.from(topicSet),
          leetcode_stats: {
            score: leetcodeScore,
            top_percent: leetcodeTopPercent
          },
          activity_metrics: analyzeActivity(recentActivity),
          
          source_keyword: keyword,
          readme_text: readme,
          full_repos: repos,
          full_activity: recentActivity,
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // D. Upsert to Supabase (github_profiles)
        const { error } = await supabase
          .from('github_profiles')
          .upsert(synthesizedProfile, { onConflict: 'github_id' });

        if (error) {
          console.error(`  [DB Error] Saving ${userProfile.login}: ${error.message}`);
          console.error(`  Payload that failed:`, JSON.stringify(synthesizedProfile, null, 2));
        } else {
          engineersSavedInNiche++; // Increment the new counter
          console.log(`  [Success] Saved ${userProfile.login} (Stars: ${totalStars}, Langs: ${topLangs.length})`);
        }

      } catch (err: any) {
          console.error(`  [Error] Failed to process user ${userStub.login}: ${err.message}`);
      }
      
      await new Promise(r => setTimeout(r, 200)); 
    }

    // D. Record History for the current 'keyword'
    // Ensure 'keyword' and 'engineersSavedInNiche' are defined in the scope where this code runs.
    try {
        // 1. Fetch the existing record to get the current total_runs
        //    'maybeSingle()' is used because the entry might not exist yet (for a new keyword).
        const { data: existingEntry, error: fetchError } = await supabase
            .from('ai_search_history') // <<<<<< IMPORTANT: Ensure this is your actual table name 'ai_search_history'
            .select('total_runs')
            .eq('keyword', keyword)
            .maybeSingle(); 

        // Handle potential errors during fetch, ignoring 'PGRST116' (No rows found)
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is the PostgREST code for "No rows found"
            console.error("Error fetching existing search history for keyword:", keyword, fetchError);
            // Log the error but continue, defaulting total_runs to 0 if an actual error occurs
        }

        const currentTotalRuns = existingEntry?.total_runs || 0; // Default to 0 if no entry or total_runs is null
        const newTotalRuns = currentTotalRuns + 1; // Increment for the current run

        // 2. Perform the upsert operation to update/insert the history record
        const { error: upsertError } = await supabase.from('ai_search_history').upsert(
            {
                keyword: keyword,
                profiles_found: engineersSavedInNiche, // This should be the number of new profiles found for this keyword in this run
                used_at: new Date().toISOString(),    // Update timestamp to now
                total_runs: newTotalRuns,             // Set the newly calculated total_runs
            },
            { onConflict: 'keyword' } // Specify 'keyword' as the unique column for conflict resolution
        );

        if (upsertError) {
            console.error("Error upserting search history for keyword:", keyword, upsertError);
            // Handle upsert error, e.g., retry or log more details
        } else {
            // Log success and the new total runs
            // If you have a 'totalSaved' variable that tracks overall profiles ingested in a single harvest script run,
            // make sure to increment it here if needed.
            // totalSaved += engineersSavedInNiche; // Example if you have this variable
            console.log(`✅ Niche Complete. Profiled ${engineersSavedInNiche} leads for "${keyword}". Total runs for "${keyword}": ${newTotalRuns}.`);
        }

    } catch (e) {
        console.error("Unexpected error during history recording for keyword:", keyword, e);
    }
    
    totalProfilesSaved += engineersSavedInNiche; // Use the new counter
    console.log(`[Summary] Saved ${engineersSavedInNiche} profiles for "${keyword}".`); // Use the new counter
    
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`
Harvest Complete. Total profiles saved: ${totalProfilesSaved}`);
}

runHarvest().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
