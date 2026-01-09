import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: Missing Supabase configuration.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Enrichment Helpers ---

function decodeEmail(text: string): string | null {
  if (!text) return null;
  const obfuscated = text.match(/([a-zA-Z0-9._-]+)\s*[\[\(\{\s]*at[\]\)\}\s]*\s*([a-zA-Z0-9.-]+)\s*[\[\(\{\s]*dot[\]\)\}\s]*\s*([a-zA-Z]{2,})/i);
  if (obfuscated) return `${obfuscated[1]}@${obfuscated[2]}.${obfuscated[3]}`.toLowerCase();
  const standard = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return standard ? standard[0].toLowerCase() : null;
}

function inferOrgRole(bio: string, readme: string): string | null {
  const text = `${bio} ${readme}`.toLowerCase();
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

// --- Main Migration ---

async function migrate() {
  console.log("Starting Final Schema Migration (Incremental + Fault Tolerant)...");

  console.log("Fetching existing profile IDs...");
  const { data: existing, error: existingError } = await supabase
    .from('github_profiles')
    .select('github_id');

  if (existingError) {
    console.error("Error fetching existing IDs:", existingError.message);
    return;
  }

  const existingIds = new Set(existing?.map(e => e.github_id) || []);
  console.log(`Found ${existingIds.size} already migrated profiles. Skipping those.`);

  let offset = 0;
  const BATCH_SIZE = 50; 
  let totalSuccess = 0;
  let totalErrors = 0;

  while (true) {
    const { data: raws, error } = await supabase
      .from('github_raw_profiles')
      .select('*')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error("Fetch Error:", error.message);
      break;
    }

    if (!raws || raws.length === 0) break;

    const missingRaws = raws.filter(r => !existingIds.has(r.github_id));

    if (missingRaws.length > 0) {
      console.log(`Processing ${missingRaws.length} profiles at offset ${offset}...`);
      
      const profilesToUpsert = missingRaws.map((raw) => {
        const data = raw.raw_data;
        const user = data.user || {};
        const repos = data.repos || [];
        const meta = data.meta || {};
        const socials = data.socials || [];
        const readme = data.readme || "";
        const activity = data.activity || [];

        // 1. Core Technical Stats
        let totalStars = 0;
        const topicSet = new Set<string>();
        let latestPushDate: Date | null = null;

        repos.forEach((repo: any) => {
          totalStars += repo.stargazers_count || 0;
          if (repo.topics) repo.topics.forEach((t: string) => topicSet.add(t));
          const pushDate = new Date(repo.pushed_at);
          if (!latestPushDate || pushDate > latestPushDate) latestPushDate = pushDate;
        });

        const lastActiveDays = latestPushDate
          ? Math.floor((new Date().getTime() - (latestPushDate as any).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const langProficiency = calculateLanguageProficiency(repos);
        const topLangs = Object.entries(langProficiency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([lang]) => lang);

        const combinedText = `${user.bio} ${readme}`;

        // 2. Link Extraction Matrix
        let twitter_url = user.twitter_username ? `https://twitter.com/${user.twitter_username}` : null;
        let linkedin_url = null;
        let leetcode_url = null;
        let stackoverflow_url = null;
        let portfolio_url = user.blog || null;

        // A. Extract from official socials array
        socials.forEach((s: any) => {
          const url = s.url;
          if (url.includes('linkedin.com')) linkedin_url = url;
          if (url.includes('twitter.com')) twitter_url = url;
          if (url.includes('leetcode.com')) leetcode_url = url;
          if (url.includes('stackoverflow.com')) stackoverflow_url = url;
        });

        // B. Regex Fallbacks for Bio/Readme
        if (!linkedin_url) linkedin_url = combinedText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)?.[0] || null;
        if (!leetcode_url) leetcode_url = combinedText.match(/https?:\/\/(www\.)?leetcode\.com\/[a-zA-Z0-9_-]+/i)?.[0] || null;
        if (!stackoverflow_url) stackoverflow_url = combinedText.match(/https?:\/\/(www\.)?stackoverflow\.com\/users\/[0-9]+\/[a-zA-Z0-9_-]+/i)?.[0] || null;

        // C. Portfolio Cleanup (Remove social links from blog field)
        if (portfolio_url && (portfolio_url.includes('linkedin.com') || portfolio_url.includes('twitter.com') || portfolio_url.includes('github.com'))) {
          portfolio_url = null;
        }

        return {
          github_id: raw.github_id,
          username: raw.username,
          name: user.name,
          type: user.type,
          organization_role: user.type === 'Organization' ? inferOrgRole(user.bio, readme) : null,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          company: user.company,
          blog: user.blog,
          email: user.email || decodeEmail(combinedText),
          
          twitter_url,
          linkedin_url,
          leetcode_url,
          stackoverflow_url,
          portfolio_url,

          public_repos: user.public_repos || 0,
          public_gists: user.public_gists || 0,
          followers: user.followers || 0,
          following: user.following || 0,
          total_stars: totalStars,
          hireable: user.hireable || false,
          last_active_days: lastActiveDays,
          
          gh_created_at: user.created_at,
          gh_updated_at: user.updated_at,
          
          top_languages: topLangs,
          language_proficiency: langProficiency,
          technical_topics: Array.from(topicSet),
          leetcode_stats: {
            score: combinedText.match(/Leetcode\s*(\d+)/i)?.[1] ? parseInt(combinedText.match(/Leetcode\s*(\d+)/i)![1]) : null,
            top_percent: combinedText.match(/top\s*(\d+)\s*%/i)?.[1] ? parseInt(combinedText.match(/top\s*(\d+)\s*%/i)![1]) : null
          },
          activity_metrics: analyzeActivity(activity),
          
          source_keyword: meta.source_keyword,
          readme_text: readme,
          full_repos: repos,
          full_activity: activity,
          raw_profile_id: raw.id,
          scraped_at: raw.scraped_at,
          updated_at: new Date().toISOString()
        };
      });

      const { error: upsertError } = await supabase
        .from('github_profiles')
        .upsert(profilesToUpsert, { onConflict: 'github_id' });

      if (upsertError) {
        console.warn(`  Batch failed. Retrying individually...`);
        for (const p of profilesToUpsert) {
          const { error: indError } = await supabase.from('github_profiles').upsert(p, { onConflict: 'github_id' });
          if (indError) {
            console.error(`    [FAIL] ${p.username}: ${indError.message}`);
            totalErrors++;
          } else {
            totalSuccess++;
          }
        }
      } else {
        totalSuccess += profilesToUpsert.length;
        console.log(`  [OK] Migrated ${profilesToUpsert.length} profiles.`);
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`
Migration Finished.
- Successfully Migrated: ${totalSuccess}
- Failed: ${totalErrors}
`);
}

migrate().catch(console.error);
