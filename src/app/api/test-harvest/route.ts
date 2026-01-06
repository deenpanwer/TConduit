import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GH_PAT;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

export const maxDuration = 60; 

async function callGeminiWithFallback(prompt: string, aiLogs: string[]): Promise<string> {
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
      aiLogs.push(`⚠️ ${model} failed: ${e.message}`);
    }
  }

  throw new Error(`All models failed. ${lastError?.message}`);
}

export async function POST(req: Request) {
  const aiLogs: string[] = [];
  const githubLogs: string[] = [];
  const savedProfiles: any[] = []; 

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

    logAI(`Starting Harvest with goal: ${count} niches, ${profileCount} profiles each.`);

    // 1. Check Env Vars
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    if (!GITHUB_TOKEN) logGH("Warning: No GITHUB_ACCESS_TOKEN found. Rate limits will be very low.");

    // 2. Fetch Search History
    const { data: history } = await supabase.from('ai_search_history').select('keyword');
    const pastKeywords = history?.map(h => h.keyword) || [];
    logAI(`Past keywords: ${pastKeywords.join(', ') || 'None'}`);

    // 3. Brainstorm with Gemini Fallback
    const prompt = `
      You are a Technical Recruiter AI. 
      We are building a database of developers from GitHub. 
      We have ALREADY searched for these topics: [${pastKeywords.join(', ')}].
      
      Give me a JSON array of ${count} NEW technical niches/keywords to search for.
      
      CRITICAL INSTRUCTION: Mix your strategy.
      - 50% High Demand/High Volume (e.g., "Full Stack", "Backend").
      - 50% Hyper-Specific (e.g., "LangChain", "Rust WASM").
      
      Return ONLY the JSON array of strings.
    `;

    const text = await callGeminiWithFallback(prompt, aiLogs);
    const newKeywords = JSON.parse(text);
    logAI(`AI suggested: ${newKeywords.join(', ')}`);

    // 4. Harvest Loop
    let totalProfilesSaved = 0;

    for (const keyword of newKeywords) {
      logGH(`--- Searching for: ${keyword} ---`);
      
      let users: any[] = [];
      let page = 1;

      while (users.length < profileCount) {
        const remaining = profileCount - users.length;
        try {
            const searchRes = await octokit.search.users({
                q: `${keyword} sort:followers`,
                per_page: Math.min(remaining, 100), 
                page: page
            });
    
            const newUsers = searchRes.data.items;
            if (!newUsers || newUsers.length === 0) break;

            users = users.concat(newUsers);
            page++;
            await new Promise(r => setTimeout(r, 500));
        } catch (e: any) {
            logGH(`Search failed on page ${page}: ${e.message}`);
            break;
        }
      }

      logGH(`Found ${users.length} initial matches for "${keyword}".`);

      let savedForThisKeyword = 0;

      for (const userStub of users) {
        try {
          const { data: userProfile } = await octokit.users.getByUsername({
            username: userStub.login,
          });

          const isHighQuality = (userProfile.followers > 5 || userProfile.public_repos > 5);
          let enrichedData: any = { user: userProfile };

          if (isHighQuality) {
            logGH(`> Deep fetching ${userStub.login}...`);
            
            // 1. Repos
            const { data: repos } = await octokit.repos.listForUser({
              username: userStub.login,
              sort: 'pushed',
              per_page: 10
            });

            // 2. Socials
            let socials: any[] = [];
            try {
               const socialRes = await octokit.users.listSocialAccountsForUser({ username: userStub.login });
               socials = socialRes.data;
            } catch (e) { }

            // 3. Readme
            let readme = null;
            try {
               const readmeRes = await octokit.repos.getReadme({ 
                 owner: userStub.login, 
                 repo: userStub.login,
                 mediaType: { format: "raw" } 
               });
               readme = String(readmeRes.data); 
            } catch (e) { }

            // 4. Activity
            let recentActivity: any[] = [];
            try {
                const eventsRes = await octokit.activity.listPublicEventsForUser({ 
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
                meta: { fetched_deep: true }
            };

          } else {
            enrichedData = {
                user: userProfile,
                meta: { fetched_deep: false, skip_reason: "Low Signal" }
            };
          }

          // Upsert to Supabase
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
            logGH(`Error saving ${userProfile.login}: ${error.message}`);
          } else {
            savedForThisKeyword++;
            savedProfiles.push(enrichedData);
          }
        } catch (err: any) {
            logGH(`Failed user ${userStub.login}: ${err.message}`);
        }
      }

      // Record History
      await supabase.from('ai_search_history').upsert({
        keyword: keyword,
        profiles_found: savedForThisKeyword,
        used_at: new Date().toISOString()
      });

      totalProfilesSaved += savedForThisKeyword;
      logGH(`Saved ${savedForThisKeyword} profiles for "${keyword}".`);
      await new Promise(r => setTimeout(r, 1000));
    }

    return NextResponse.json({ success: true, aiLogs, githubLogs, savedProfiles, totalSaved: totalProfilesSaved });

  } catch (error: any) {
    return NextResponse.json({ success: false, aiLogs, githubLogs, error: error.message }, { status: 500 });
  }
}
