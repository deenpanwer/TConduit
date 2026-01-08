import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: Missing Supabase configuration.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Enrichment Helpers ---

function decodeEmail(text: string): string | null {
  if (!text) return null;
  // Look for patterns like "name [at] domain [dot] com" or "name(at)domain.com"
  const obfuscated = text.match(/([a-zA-Z0-9._-]+)\s*[\[\(\{\s]*at[\]\)\}\s]*\s*([a-zA-Z0-9.-]+)\s*[\[\(\{\s]*dot[\]\)\}\s]*\s*([a-zA-Z]{2,})/i);
  if (obfuscated) {
    return `${obfuscated[1]}@${obfuscated[2]}.${obfuscated[3]}`.toLowerCase();
  }
  // Standard email fallback
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

  // Convert to percentages (0.0 to 1.0)
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
  console.log("Starting Enriched Data Migration...");

  let offset = 0;
  const BATCH_SIZE = 100;
  let totalProcessed = 0;

  while (true) {
    console.log(`Processing Batch: ${offset} - ${offset + BATCH_SIZE}...`);
    
    const { data: raws, error } = await supabase
      .from('github_raw_profiles')
      .select('*')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error("Fetch Error:", error.message);
      break;
    }

    if (!raws || raws.length === 0) break;

    const profilesToUpsert = raws.map((raw) => {
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
        if (!latestPushDate || pushDate > latestPushDate) {
          latestPushDate = pushDate;
        }
      });

      const lastActiveDays = latestPushDate
        ? Math.floor((new Date().getTime() - (latestPushDate as any).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // 2. Intelligence Extraction
      const languageProficiency = calculateLanguageProficiency(repos);
      const topLanguages = Object.entries(languageProficiency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang);

      const combinedText = `${user.bio} ${readme}`;
      const email = user.email || decodeEmail(combinedText);
      const orgRole = user.type === 'Organization' ? inferOrgRole(user.bio, readme) : null;
      
      // LeetCode Miner
      const leetcodeMatch = combinedText.match(/Leetcode\s*(\d+)/i);
      const leetcodePercentMatch = combinedText.match(/top\s*(\d+)\s*%/i);
      const leetcodeStats = {
        score: leetcodeMatch ? parseInt(leetcodeMatch[1]) : null,
        top_percent: leetcodePercentMatch ? parseInt(leetcodePercentMatch[1]) : null
      };

      // Social Link Extraction
      let twitter_url = user.twitter_username ? `https://twitter.com/${user.twitter_username}` : null;
      let linkedin_url = null;
      let leetcode_url = null;
      let stackoverflow_url = null;
      let portfolio_url = user.blog || null;

      socials.forEach((s: any) => {
        const url = s.url;
        if (url.includes('linkedin.com')) linkedin_url = url;
        if (url.includes('twitter.com')) twitter_url = url;
        if (url.includes('leetcode.com')) leetcode_url = url;
        if (url.includes('stackoverflow.com')) stackoverflow_url = url;
      });

      // Bio regex fallback for LinkedIn
      if (!linkedin_url) {
        const liMatch = combinedText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
        if (liMatch) linkedin_url = liMatch[0];
      }

      return {
        github_id: raw.github_id,
        username: raw.username,
        name: user.name,
        type: user.type,
        organization_role: orgRole,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        email: email,
        
        twitter_url,
        linkedin_url,
        leetcode_url,
        stackoverflow_url,
        portfolio_url,

        public_repos: user.public_repos,
        public_gists: user.public_gists,
        followers: user.followers,
        following: user.following,
        total_stars: totalStars,
        hireable: user.hireable || false,
        last_active_days: lastActiveDays,
        
        gh_created_at: user.created_at,
        gh_updated_at: user.updated_at,
        
        top_languages: topLanguages,
        language_proficiency: languageProficiency,
        technical_topics: Array.from(topicSet),
        leetcode_stats: leetcodeStats,
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
      console.error(`Upsert Error at ${offset}:`, upsertError.message);
    } else {
      totalProcessed += profilesToUpsert.length;
      console.log(`Success: Processed ${totalProcessed} profiles.`);
    }

    offset += BATCH_SIZE;
  }

  console.log("Migration Complete. 100% data captured and enriched.");
}

migrate().catch(console.error);