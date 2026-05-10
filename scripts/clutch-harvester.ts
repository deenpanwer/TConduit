// scripts/clutch-harvester.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.LEADS_SUPABASE_URL;
const SUPABASE_KEY = process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing LEADS_SUPABASE environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIGURATION ---
const MAIN_SITEMAP = 'https://clutch.co/sitemap.xml';
const OXYLABS_USER = 'deenpanwer_GF6ee';
const OXYLABS_PASS = 'm_1Qmme_hFHz__3';

/**
 * Robust Fetch with Proxy and Stealth Fallback.
 * Addresses the 400 errors by adding a direct stealth fallback.
 */
async function fetchWithFallback(url: string): Promise<string | null> {
  // Attempt 1: Oxylabs
  try {
    const auth = Buffer.from(`${OXYLABS_USER}:${OXYLABS_PASS}`).toString('base64');
    const response = await fetch('https://realtime.oxylabs.io/v1/queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        source: 'universal',
        url: url,
        render: 'plain_http',
        user_agent_type: 'desktop_chrome'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.results?.[0]?.content || null;
    }
    const errorBody = await response.text();
    console.warn(`   ⚠️ Proxy rejected ${url} (Status: ${response.status}). Switching to Stealth Fallback...`);
    // Log the error body briefly for debugging
    if (errorBody.includes('message')) console.warn(`   Reason: ${errorBody.substring(0, 100)}`);
  } catch (error) {
    console.error(`   ❌ Proxy exception, falling back...`);
  }

  // Attempt 2: Stealth Fetch Fallback
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (response.ok) {
      return await response.text();
    }
    console.error(`   ❌ Fallback failed (Status: ${response.status})`);
  } catch (error: any) {
    console.error(`   ❌ Fallback error: ${error.message}`);
  }

  return null;
}

/**
 * Extracts all <loc> tags from an XML string.
 */
function extractLocs(xml: string): string[] {
  const locRegex = /<loc>(.*?)<\/loc>/g;
  const matches = xml.matchAll(locRegex);
  const urls: string[] = [];
  for (const match of matches) {
    urls.push(match[1]);
  }
  return urls;
}

/**
 * The Master Harvester Execution.
 */
async function runHarvester() {
  console.log("🚀 CLUTCH SITEMAP HARVESTER: Initializing...");

  console.log(`🔍 Fetching sitemap index: ${MAIN_SITEMAP}`);
  const mainXml = await fetchWithFallback(MAIN_SITEMAP);
  if (!mainXml) {
    console.error("❌ Fatal: Could not reach Clutch sitemap index.");
    return;
  }

  const allSubSitemaps = extractLocs(mainXml);
  // We only want profile sitemaps
  const profileSitemaps = allSubSitemaps.filter(url => url.includes('sitemap-profile-'));

  console.log(`💎 Found ${profileSitemaps.length} profile sitemaps to process.`);

  for (const sitemapUrl of profileSitemaps) {
    console.log(`\n📂 Sitemap: ${sitemapUrl}`);
    
    // Check Status
    const { data: existingSitemap } = await supabase
      .from('discovery_sitemaps')
      .select('status')
      .eq('sitemap_url', sitemapUrl)
      .single();

    if (existingSitemap?.status === 'COMPLETED') {
      console.log(`   ⏩ Already processed. Skipping.`);
      continue;
    }

    await supabase.from('discovery_sitemaps').upsert({
      sitemap_url: sitemapUrl,
      status: 'PROCESSING',
      last_scraped_at: new Date().toISOString()
    }, { onConflict: 'sitemap_url' });

    const subXml = await fetchWithFallback(sitemapUrl);
    if (!subXml) {
      console.error(`   ⚠️ Failed to download: ${sitemapUrl}`);
      continue;
    }

    const profileUrls = extractLocs(subXml).filter(url => url.includes('/profile/'));
    console.log(`   🔗 Extracted ${profileUrls.length} profile URLs.`);

    const BATCH_SIZE = 1000;
    let savedCount = 0;

    for (let i = 0; i < profileUrls.length; i += BATCH_SIZE) {
      const batch = profileUrls.slice(i, i + BATCH_SIZE).map(url => ({
        clutch_url: url,
        status: 'PENDING'
      }));

      const { error } = await supabase
        .from('discovery_profiles')
        .upsert(batch, { onConflict: 'clutch_url', ignoreDuplicates: true });

      if (error) {
        console.error(`   ❌ DB Batch error:`, error.message);
      } else {
        savedCount += batch.length;
        process.stdout.write(`   💾 Progress: ${savedCount}/${profileUrls.length}...\r`);
      }
    }

    await supabase.from('discovery_sitemaps').update({ status: 'COMPLETED' })
      .eq('sitemap_url', sitemapUrl);

    console.log(`\n✅ Completed.`);
  }

  console.log("\n🏁 HARVEST COMPLETE.");
}

runHarvester().catch(err => console.error("💥 Crash:", err));
