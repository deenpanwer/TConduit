import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error("Error: Missing required environment variables (Supabase or Gemini).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    You are a Technical Headhunter sourcing top OSS maintainers on NPM.
    We have already searched these niches: [${pastKeywords.join(', ')}].
    
    Give me a JSON array of ${count} NEW technical niches.
    - 50% High Volume (e.g., "fast-api", "validation", "websocket").
    - 50% Specialized (e.g., "zero-knowledge", "ffmpeg-wasm", "crdt").
    
    CRITICAL: Return ONLY a plain JSON array of strings. No markdown.
  `;

  try {
    const text = await callGeminiWithFallback(prompt);
    return JSON.parse(text || "[]");
  } catch (e) {
    console.error("[AI] Keyword generation failed:", e);
    throw e; // No fallback words as requested
  }
}

async function getMaintainerPortfolio(username: string) {
  try {
    const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=maintainer:${username}&size=100`);
    const data = await res.json();
    const pkgs = data.objects?.map((obj: any) => ({
      name: obj.package.name,
      version: obj.package.version,
      date: obj.package.date,
      description: obj.package.description,
      npm_url: `https://www.npmjs.com/package/${obj.package.name}`
    })) || [];
    return { packages: pkgs, total: data.total || pkgs.length };
  } catch {
    return { packages: [], total: 0 };
  }
}

// --- Main Harvest Logic ---

async function runHarvest() {
  console.log("🚀 Starting Autonomous NPM Talent Sweep...");

  // 1. Fetch Search History
  const { data: history } = await supabase.from('npm_search_history').select('keyword');
  const pastKeywords = history?.map(h => h.keyword) || [];
  console.log(`[Context] ${pastKeywords.length} previous niches identified.`);

  // 2. AI Keyword Generation
  const NICHE_COUNT = 3;
  let newKeywords: string[] = [];
  try {
    newKeywords = await brainstormKeywords(pastKeywords, NICHE_COUNT);
    console.log(`📡 Sourcing targets: ${newKeywords.join(', ')}`);
  } catch (e) {
    console.error("Critical AI Error. Sweep aborted.");
    return;
  }

  let totalSaved = 0;

  for (const keyword of newKeywords) {
    console.log(`
--- Processing Niche: ${keyword} ---`);
    
    // A. Scan Registry for Top 250 Packages (Max allowed by NPM)
    const searchRes = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(keyword)}&size=250`);
    if (!searchRes.ok) {
        console.error(`[NPM] Search failed for ${keyword}: ${searchRes.status}`);
        continue;
    }
    const searchData = await searchRes.json();
    const objects = searchData.objects || [];
    
    // Collector Pattern: Group by Maintainer
    const maintainerFreq: Record<string, { count: number, samplePkgs: any[] }> = {};
    objects.forEach((obj: any) => {
      const p = obj.package;
      p.maintainers?.forEach((m: any) => {
        if (!m.username) return;
        if (!maintainerFreq[m.username]) maintainerFreq[m.username] = { count: 0, samplePkgs: [] };
        maintainerFreq[m.username].count++;
        maintainerFreq[m.username].samplePkgs.push(p);
      });
    });

    // Rank by impact in this niche (Ecosystem Authority)
    const sortedLeads = Object.entries(maintainerFreq)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 100); // Process top 100 per niche

    console.log(`🔍 Found ${objects.length} packages. Identified ${sortedLeads.length} prioritized leads.`);

    let engineersSavedInNiche = 0;

    for (let i = 0; i < sortedLeads.length; i++) {
      const [username, stats] = sortedLeads[i];
      
      try {
        // 1. Intelligence Sweep (Full Portfolio)
        const portfolioData = await getMaintainerPortfolio(username);
        
        // 2. Identity Resolution
        const mInfo = stats.samplePkgs[0].maintainers.find((m: any) => m.username === username);
        const email = mInfo?.email || null;
        const avatarUrl = email ? `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email.toLowerCase()).digest('hex')}?s=200&d=retro` : null;

        // 3. Quality Filter (Mirroring harvest.ts pattern)
        const isHighQuality = (portfolioData.total > 2 || email !== null);

        if (isHighQuality) {
            // 4. Detailed Impact Calculation (Top 10 packages)
            let totalImpact = 0;
            const topProjects = portfolioData.packages.slice(0, 10);
            
            await Promise.all(topProjects.map(async (p: any) => {
              try {
                const dlRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${p.name}`);
                const dlData = await dlRes.json();
                p.downloads = dlData.downloads || 0;
                totalImpact += p.downloads;
              } catch {}
            }));

            // 5. Upsert to Supabase
            const { error } = await supabase.from('npm_profiles').upsert({
              username,
              name: mInfo?.name || username,
              email,
              avatar_url: avatarUrl,
              total_packages: portfolioData.total,
              total_downloads_weekly: totalImpact,
              portfolio: portfolioData.packages,
              last_scanned_at: new Date().toISOString()
            }, { onConflict: 'username' });

            if (!error) engineersSavedInNiche++;
        }

        // 6. Respectful Throttling
        if (i % 5 === 0) process.stdout.write(`.`);
        await new Promise(r => setTimeout(r, 150)); 

      } catch (e) {
        console.error(`
[Error] Skipping ${username}:`, e);
      }
    }

    // D. Record History
    await supabase.from('npm_search_history').upsert({
      keyword,
      engineers_found: engineersSavedInNiche,
      packages_scanned: objects.length,
      used_at: new Date().toISOString()
    });

    totalSaved += engineersSavedInNiche;
    console.log(`
✅ Niche Complete. Profiled ${engineersSavedInNiche} high-impact leads.`);
  }

  console.log(`
🏁 Sweep Finished. Total leads ingested: ${totalSaved}`);
}

runHarvest().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
