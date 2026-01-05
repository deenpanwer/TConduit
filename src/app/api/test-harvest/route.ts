import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GH_PAT; // Support both names
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

export const maxDuration = 60; // Allow 60 seconds for this function (Vercel Hobby limit is usually 10s-60s)

export async function POST(req: Request) {
  const aiLogs: string[] = [];
  const githubLogs: string[] = [];
  const savedProfiles: any[] = []; // Collect all profiles for the UI session

  function logAI(msg: string) {
    console.log(`[AI] ${msg}`);
    aiLogs.push(msg);
  }
  function logGH(msg: string) {
    console.log(`[GH] ${msg}`);
    githubLogs.push(msg);
  }

  try {
    const body = await req.json();
    const count = body.count || 2; 
    const profileCount = body.profileCount || 5;

    logAI(`Starting Harvest with goal: ${count} new niches, ${profileCount} profiles each.`);

    // 1. Check Env Vars
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    if (!GITHUB_TOKEN) logGH("Warning: No GITHUB_ACCESS_TOKEN found. Rate limits will be very low (60/hr).");

    // 2. Fetch Search History
    const { data: history } = await supabase.from('ai_search_history').select('keyword');
    const pastKeywords = history?.map(h => h.keyword) || [];
    logAI(`Past keywords: ${pastKeywords.join(', ') || 'None'}`);

    // 3. Brainstorm with Gemini
    const newKeywords = await brainstormKeywords(pastKeywords, count);
    logAI(`AI suggested: ${newKeywords.join(', ')}`);

    // 4. Harvest Loop
    let totalProfilesSaved = 0;

    for (const keyword of newKeywords) {
      logGH(`--- Searching for: ${keyword} ---`);
      
      // A. Search GitHub (Paginated)
      let users: any[] = [];
      let page = 1;

      while (users.length < profileCount) {
        const remaining = profileCount - users.length;
        const perPage = Math.min(remaining, 100);

        try {
            const searchRes = await octokit.search.users({
                q: `${keyword} sort:followers`,
                per_page: perPage, 
                page: page
            });
    
            const newUsers = searchRes.data.items;
            if (!newUsers || newUsers.length === 0) break;

            users = users.concat(newUsers);
            page++;
            await new Promise(r => setTimeout(r, 500)); // Brief pause
        } catch (e: any) {
            logGH(`Search failed on page ${page}: ${e.message}`);
            break;
        }
      }

      logGH(`Found ${users.length} initial matches for "${keyword}".`);

      let savedForThisKeyword = 0;

      for (const userStub of users) {
        try {
          // B. Get Full Details (Base Profile)
          const { data: userProfile } = await octokit.users.getByUsername({
            username: userStub.login,
          });

          // Quality Check: Do we invest API calls in this user?
          // Threshold: > 5 followers OR > 5 public repos
          const isHighQuality = (userProfile.followers > 5 || userProfile.public_repos > 5);
          let enrichedData: any = { user: userProfile };

          if (isHighQuality) {
            logGH(`> Deep fetching for ${userStub.login}...`);
            
            // 1. Fetch Repos (Top 10, sorted by recently pushed)
            const { data: repos } = await octokit.repos.listForUser({
              username: userStub.login,
              sort: 'pushed',
              per_page: 10
            });

            // 2. Fetch Social Accounts
            let socials: any[] = [];
            try {
               const socialRes = await octokit.users.listSocialAccountsForUser({ username: userStub.login });
               socials = socialRes.data;
            } catch (e) { /* social endpoint might 404 or be restricted */ }

            // 3. Fetch Profile Readme (special repo <username>/<username>)
            let readme = null;
            try {
               const readmeRes = await octokit.repos.getReadme({ 
                 owner: userStub.login, 
                 repo: userStub.login,
                 mediaType: { format: "raw" } 
               });
               readme = String(readmeRes.data); 
            } catch (e) { /* 404 is common */ }

            // 4. Fetch Recent Activity (Pulse Check)
            let recentActivity: any[] = [];
            try {
                const eventsRes = await octokit.activity.listPublicEventsForUser({ 
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
                meta: { fetched_deep: true }
            };

          } else {
            enrichedData = {
                user: userProfile,
                meta: { 
                  fetched_deep: false, 
                  skip_reason: `Low signal: ${userProfile.followers} followers, ${userProfile.public_repos} repos` 
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
                fetched_deep: isHighQuality, // Set the helper column
                scraped_at: new Date().toISOString()
            }, { onConflict: 'github_id' });

          if (error) {
            logGH(`Error saving ${userProfile.login}: ${error.message}`);
          } else {
            savedForThisKeyword++;
            savedProfiles.push(enrichedData); // Add to return list
          }
        } catch (err: any) {
            logGH(`Failed to fetch/save user ${userStub.login}: ${err.message}`);
        }
      }

      // D. Record History
      await supabase.from('ai_search_history').upsert({
        keyword: keyword,
        profiles_found: savedForThisKeyword,
        used_at: new Date().toISOString()
      });

      totalProfilesSaved += savedForThisKeyword;
      logGH(`Saved ${savedForThisKeyword} profiles for "${keyword}".`);
      
      await new Promise(r => setTimeout(r, 1000));
    }

    logGH(`Harvest Complete. Total profiles saved: ${totalProfilesSaved}`);
    return NextResponse.json({ success: true, aiLogs, githubLogs, savedProfiles, totalSaved: totalProfilesSaved });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, aiLogs, githubLogs, error: error.message }, { status: 500 });
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

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text);
    // Fallback: simple split if JSON fails, or return empty
    return [];
  }
}
