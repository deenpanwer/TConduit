import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      if (!text) throw new Error("Empty response from model");
      
      return text;
    } catch (e: any) {
      lastError = e;
      aiLogs.push(`⚠️ ${model} failed: ${e.message}`);
      console.warn(`Fallback: ${model} failed, trying next...`);
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

export async function POST(req: Request) {
  const aiLogs: string[] = [];
  const registryLogs: string[] = [];
  const engineerMap: Record<string, any> = {};

  function logAI(msg: string) {
    console.log(`[AI] ${msg}`);
    aiLogs.push(msg);
  }
  function logReg(msg: string) {
    console.log(`[REG] ${msg}`);
    registryLogs.push(msg);
  }

  try {
    const body = await req.json();
    const nicheCount = body.nicheCount || 2;
    const packageLimit = body.packageLimit || 100;

    logAI(`Starting Harvest with goal: ${nicheCount} niches, depth ${packageLimit}.`);

    // 1. Fetch Search History
    const { data: history } = await supabase.from('npm_search_history').select('keyword');
    const pastKeywords = history?.map(h => h.keyword) || [];
    logAI(`Registry Context: ${pastKeywords.length} previous niches explored.`);

    // 2. Brainstorm with Fallback
    let newKeywords: string[] = [];
    try {
      const prompt = `
        You are a Technical Headhunter. We are building a database of top NPM maintainers.
        We have already searched: [${pastKeywords.join(', ')}].
        
        Give me a JSON array of EXACTLY ${nicheCount} NEW technical niches. 
        DO NOT return more than ${nicheCount} items.
        
        CRITICAL: 
        1. Use ONLY short, concise technical keywords (e.g. "webrtc", "wasm", "orm").
        2. Return ONLY a plain JSON array of strings. 
        3. Do NOT return an array of objects.
        4. Do NOT use markdown code blocks.
        
        Example format for 2 niches: ["webrtc", "solidity"]
      `;

      const text = await callGeminiWithFallback(prompt, aiLogs);
      
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      // If it wrapped it in an object like { "niches": [...] }
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayKey) parsed = parsed[arrayKey];
      }
      
      let rawKeywords = Array.isArray(parsed) ? parsed : [];
      
      // DEFENSIVE: Ensure they are strings, not objects, and SLICE to requested count
      newKeywords = rawKeywords
        .map(k => typeof k === 'object' ? (Object.values(k)[0] as string) : String(k))
        .slice(0, nicheCount);
      
      if (!newKeywords || newKeywords.length === 0) {
        throw new Error("AI returned zero target niches.");
      }
      
      logAI(`AI targets locked: [${newKeywords.join(', ')}]`);
    } catch (e: any) {
      logAI(`❌ AI Error: ${e.message}`);
      return NextResponse.json({ success: false, error: e.message, aiLogs, registryLogs }, { status: 500 });
    }

    // 3. Main Harvesting Loop
    for (const keyword of newKeywords) {
      logReg(`--- SWEEPING NICHE: ${keyword} ---`);
      
      const searchUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(keyword)}&size=${packageLimit}`;
      const searchRes = await fetch(searchUrl);
      
      if (!searchRes.ok) {
        logReg(`❌ Registry Error: HTTP ${searchRes.status} on search. Skipping niche.`);
        continue;
      }

      const searchData = await searchRes.json();
      const objects = searchData.objects || [];

      logReg(`Identified ${objects.length} package clusters for "${keyword}".`);

      const maintainerFreq: Record<string, { count: number, samplePkgs: any[] }> = {};
      
      for (const obj of objects) {
        const p = obj.package;
        const maintainers = p.maintainers || [];
        
        maintainers.forEach((m: any) => {
          if (!m.username) return;
          if (!maintainerFreq[m.username]) {
            maintainerFreq[m.username] = { count: 0, samplePkgs: [] };
          }
          maintainerFreq[m.username].count++;
          maintainerFreq[m.username].samplePkgs.push({
            package_name: p.name,
            version: p.version,
            description: p.description,
            date: p.date,
            npm_url: p.links?.npm,
            github_url: p.links?.repository
          });
        });
      }

      const sortedUsernames = Object.entries(maintainerFreq)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 40); 

      logReg(`Ranked ${sortedUsernames.length} high-signal leads.`);

      const batchSize = 10;
      for (let i = 0; i < sortedUsernames.length; i += batchSize) {
        const batch = sortedUsernames.slice(i, i + batchSize);
        logReg(`Intelligence Batch ${Math.floor(i/batchSize) + 1}...`);

        await Promise.all(batch.map(async ([username, stats]) => {
          try {
            if (engineerMap[username]) return;

            const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=maintainer:${username}&size=100`);
            if (!res.ok) return; 

            const data = await res.json();
            const allPkgs = data.objects?.map((obj: any) => ({
              package_name: obj.package.name,
              version: obj.package.version,
              date: obj.package.date,
              description: obj.package.description,
              npm_url: `https://www.npmjs.com/package/${obj.package.name}`
            })) || [];

            const samplePkg = stats.samplePkgs[0];
            const match = objects.find((obj: any) => obj.package.name === samplePkg.package_name);
            const mInfo = match?.package.maintainers?.find((m: any) => m.username === username);
            
            const email = mInfo?.email || null;
            const avatar_url = email ? `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email.toLowerCase()).digest('hex')}?s=200&d=retro` : null;

            let totalDownloads = 0;
            const enrichedMatched = await Promise.all(stats.samplePkgs.map(async (p) => {
               try {
                 const dlRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${p.package_name}`).catch(() => null);
                 if (!dlRes || !dlRes.ok) return { ...p, downloads: 0 };
                 const dlData = await dlRes.json();
                 totalDownloads += (dlData.downloads || 0);
                 return { ...p, downloads: dlData.downloads || 0 };
               } catch {
                 return { ...p, downloads: 0 };
               }
            }));

            const profile = {
              username,
              name: mInfo?.name || username,
              email,
              avatar_url,
              total_packages: data.total || allPkgs.length,
              total_downloads_weekly: totalDownloads,
              matchedProjects: enrichedMatched,
              allProjects: allPkgs,
              portfolio: allPkgs,
              last_scanned_at: new Date().toISOString()
            };

            engineerMap[username] = profile;

            // D. Supabase Persistence (Mapping to exact schema columns)
            const { error: dbError } = await supabase.from('npm_profiles').upsert({
                username: profile.username,
                name: profile.name,
                email: profile.email,
                avatar_url: profile.avatar_url,
                total_packages: profile.total_packages,
                total_downloads_weekly: profile.total_downloads_weekly,
                portfolio: profile.allProjects, // Store all projects in portfolio column
                last_scanned_at: profile.last_scanned_at
            }, { onConflict: 'username' });

            if (dbError) {
              console.error(`[DB ERROR] Failed to save ${username}:`, dbError.message);
            }

          } catch (err: any) {
            console.error(`[PROFILING ERROR] ${username}:`, err.message);
          }
        }));
        
        await new Promise(r => setTimeout(r, 200));
      }

      await supabase.from('npm_search_history').upsert({
        keyword,
        engineers_found: sortedUsernames.length,
        packages_scanned: objects.length,
        used_at: new Date().toISOString()
      });
    }

    const finalResult = Object.values(engineerMap).sort((a, b) => b.total_downloads_weekly - a.total_downloads_weekly);
    logAI(`Synthesis complete. Compiled ${finalResult.length} impact profiles.`);

    return NextResponse.json({ 
      success: true, 
      aiLogs, 
      registryLogs, 
      engineers: finalResult 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message, aiLogs, registryLogs }, { status: 500 });
  }
}
