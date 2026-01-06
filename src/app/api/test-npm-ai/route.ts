import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const maxDuration = 60; 

// Throttling Constants
const SEARCH_DEPTH = 100;
const SEARCH_PAGE_SIZE = 50;
const SEARCH_DELAY_MS = 500; // Lower for API response time
const METRIC_DELAY_MS = 200;

async function fetchWithRetry(url: string, options: any = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      const wait = Math.pow(2, i) * 1000 + (Math.random() * 500);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries.`);
}

async function callGeminiWithFallback(prompt: string, aiLogs: string[]): Promise<string> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

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
    // Overriding depth to 100 as requested for baseline
    const packageLimit = 100;

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
        
        Example format: ["webrtc", "solidity"]
      `;

      const text = await callGeminiWithFallback(prompt, aiLogs);
      
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayKey) parsed = parsed[arrayKey];
      }
      
      newKeywords = (Array.isArray(parsed) ? parsed : [])
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
      
      const allObjects: any[] = [];
      for (let from = 0; from < packageLimit; from += SEARCH_PAGE_SIZE) {
        logReg(`Scanning chunk at from=${from}...`);
        const searchRes = await fetchWithRetry(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(keyword)}&size=${SEARCH_PAGE_SIZE}&from=${from}`);
        if (!searchRes.ok) break;
        const searchData = await searchRes.json();
        const objects = searchData.objects || [];
        allObjects.push(...objects);
        if (objects.length < SEARCH_PAGE_SIZE) break;
        await new Promise(r => setTimeout(r, SEARCH_DELAY_MS));
      }

      logReg(`Identified ${allObjects.length} package clusters for "${keyword}".`);

      const maintainerFreq: Record<string, { count: number, samplePkgs: any[] }> = {};
      
      for (const obj of allObjects) {
        const p = obj.package;
        p.maintainers?.forEach((m: any) => {
          if (!m.username) return;
          if (!maintainerFreq[m.username]) maintainerFreq[m.username] = { count: 0, samplePkgs: [] };
          maintainerFreq[m.username].count++;
          maintainerFreq[m.username].samplePkgs.push({
            name: p.name,
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
        .slice(0, 30); 

      logReg(`Ranked ${sortedUsernames.length} high-signal leads.`);

      for (let i = 0; i < sortedUsernames.length; i++) {
        const [username, stats] = sortedUsernames[i];
        try {
          if (engineerMap[username]) continue;

          const res = await fetchWithRetry(`https://registry.npmjs.org/-/v1/search?text=maintainer:${username}&size=100`);
          const data = await res.json();
          const allPkgs = data.objects?.map((obj: any) => ({
            name: obj.package.name,
            version: obj.package.version,
            date: obj.package.date,
            description: obj.package.description,
            npm_url: `https://www.npmjs.com/package/${obj.package.name}`
          })) || [];

          const mInfo = allObjects.find(obj => obj.package.maintainers?.some((m: any) => m.username === username))?.package.maintainers?.find((m: any) => m.username === username);
          const email = mInfo?.email || null;
          const avatar_url = email ? `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email.toLowerCase()).digest('hex')}?s=200&d=retro` : null;

          // Bulk Metric Calculation
          let totalDownloads = 0;
          const topProjects = stats.samplePkgs.slice(0, 10);
          if (topProjects.length > 0) {
            const pNames = topProjects.map(p => p.name).join(',');
            const dlRes = await fetchWithRetry(`https://api.npmjs.org/downloads/point/last-week/${pNames}`).catch(() => null);
            if (dlRes?.ok) {
              const dlData = await dlRes.json();
              topProjects.forEach(p => {
                const d = dlData[p.name] || dlData;
                p.downloads = d?.downloads || 0;
                totalDownloads += p.downloads;
              });
            }
          }

          const profile = {
            username,
            name: mInfo?.name || username,
            email,
            avatar_url,
            total_packages: data.total || allPkgs.length,
            total_downloads_weekly: totalDownloads,
            matchedProjects: topProjects,
            allProjects: allPkgs,
            last_scanned_at: new Date().toISOString()
          };

          engineerMap[username] = profile;

          await supabase.from('npm_profiles').upsert({
              username: profile.username,
              name: profile.name,
              email: profile.email,
              avatar_url: profile.avatar_url,
              total_packages: profile.total_packages,
              total_downloads_weekly: profile.total_downloads_weekly,
              portfolio: profile.allProjects,
              last_scanned_at: profile.last_scanned_at
          }, { onConflict: 'username' });

        } catch (err: any) {
          console.error(`[PROFILING ERROR] ${username}:`, err.message);
        }
      }

      await supabase.from('npm_search_history').upsert({
        keyword,
        engineers_found: sortedUsernames.length,
        packages_scanned: allObjects.length,
        used_at: new Date().toISOString()
      });
    }

    const finalResult = Object.values(engineerMap).sort((a, b) => b.total_downloads_weekly - a.total_downloads_weekly);
    logAI(`Synthesis complete. Compiled ${finalResult.length} impact profiles.`);

    return NextResponse.json({ success: true, aiLogs, registryLogs, engineers: finalResult });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, aiLogs, registryLogs }, { status: 500 });
  }
}
