// scripts/build-lead-context.ts
// ==============================================================================
// SELF-CONTAINED CONTEXT GENERATION ENGINE (NO AI - PURE RESEARCH & HARVESTING)
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config();

// --- HARDCODED DEFAULT CONFIGURATION ---
const CONFIG = {
  // Apify Credentials
  APIFY_API_TOKEN: process.env.APIFY_API_TOKEN || '',
  
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.LEADS_SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Target Table & Batching Defaults
  TABLE_NAME: process.env.TABLE_NAME || 'leads',
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '10', 10),
  CONCURRENCY: parseInt(process.env.CONCURRENCY || '3', 10),
  
  // Scraping Controls
  MAX_SUBPAGES_TO_SCRAPE: 3,
  REQUEST_TIMEOUT_MS: 9000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Parse command-line args (e.g., --table=leads --batch=5 --test-domain=bonanzacasino.com)
const args = process.argv.slice(2);
const cliArgs: Record<string, string> = {};
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.slice(2).split('=');
    cliArgs[k] = v || 'true';
  }
});

const TARGET_TABLE = cliArgs['table'] || CONFIG.TABLE_NAME;
const BATCH_SIZE = parseInt(cliArgs['batch'] || String(CONFIG.BATCH_SIZE), 10);
const TEST_DOMAIN = cliArgs['test-domain'];
const SPECIFIC_LEAD_ID = cliArgs['lead-id'];

// --- LOGGING HELPERS ---
const log = (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`);
const logSuccess = (msg: string) => console.log(`[${new Date().toISOString()}] [SUCCESS] ✅ ${msg}`);
const logWarn = (msg: string) => console.warn(`[${new Date().toISOString()}] [WARN] ⚠️ ${msg}`);
const logError = (msg: string, err?: any) => console.error(`[${new Date().toISOString()}] [ERROR] ❌ ${msg}`, err || '');

// --- 1. RDAP DOMAIN AGE EXTRACTOR (ZERO COST / FREE) ---
export interface DomainIntel {
  domain: string;
  registrationDate: string | null;
  expirationDate: string | null;
  domainAgeYears: number | null;
  registrar: string | null;
  longevitySummary: string;
  isRegistered: boolean;
}

export function cleanDomainString(inputUrlOrDomain: string): string {
  if (!inputUrlOrDomain) return '';
  let cleaned = inputUrlOrDomain.trim().toLowerCase();
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split(':')[0];
  return cleaned;
}

export async function fetchDomainAge(domainInput: string): Promise<DomainIntel> {
  const domain = cleanDomainString(domainInput);
  if (!domain) {
    return {
      domain: '',
      registrationDate: null,
      expirationDate: null,
      domainAgeYears: null,
      registrar: null,
      longevitySummary: 'No valid domain provided',
      isRegistered: false,
    };
  }

  try {
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

    const response = await fetch(rdapUrl, {
      headers: {
        'Accept': 'application/rdap+json, application/json',
        'User-Agent': CONFIG.USER_AGENT,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        domain,
        registrationDate: null,
        expirationDate: null,
        domainAgeYears: null,
        registrar: null,
        longevitySummary: `RDAP query returned status ${response.status}`,
        isRegistered: false,
      };
    }

    const data: any = await response.json();
    const events: Array<{ eventAction: string; eventDate: string }> = data.events || [];

    const regEvent = events.find(e => e.eventAction === 'registration');
    const expEvent = events.find(e => e.eventAction === 'expiration');

    const registrationDate = regEvent ? regEvent.eventDate : null;
    const expirationDate = expEvent ? expEvent.eventDate : null;

    let domainAgeYears: number | null = null;
    let longevitySummary = 'Domain registration date not found in RDAP';

    if (registrationDate) {
      const regTime = new Date(registrationDate).getTime();
      const now = Date.now();
      const ageInMs = now - regTime;
      const years = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
      domainAgeYears = Math.round(years * 10) / 10;

      const regYear = new Date(registrationDate).getFullYear();
      if (domainAgeYears >= 15) {
        longevitySummary = `Veteran business operating for over ${domainAgeYears} years (Registered in ${regYear})`;
      } else if (domainAgeYears >= 8) {
        longevitySummary = `Established business with ${domainAgeYears} years of continuous operation (Registered in ${regYear})`;
      } else if (domainAgeYears >= 3) {
        longevitySummary = `Growth-stage business active for ${domainAgeYears} years (Registered in ${regYear})`;
      } else {
        longevitySummary = `Emerging brand active for ~${domainAgeYears} years (Registered in ${regYear})`;
      }
    }

    // Extract registrar entity name if available
    let registrar: string | null = null;
    if (data.entities && Array.isArray(data.entities)) {
      const registrarEntity = data.entities.find((e: any) => e.roles && e.roles.includes('registrar'));
      if (registrarEntity && registrarEntity.vcardArray) {
        const fnEntry = registrarEntity.vcardArray[1]?.find((item: any) => item[0] === 'fn');
        registrar = fnEntry ? fnEntry[3] : null;
      }
    }

    return {
      domain,
      registrationDate,
      expirationDate,
      domainAgeYears,
      registrar,
      longevitySummary,
      isRegistered: true,
    };
  } catch (err: any) {
    return {
      domain,
      registrationDate: null,
      expirationDate: null,
      domainAgeYears: null,
      registrar: null,
      longevitySummary: `RDAP lookup failed: ${err.message || 'Network error'}`,
      isRegistered: false,
    };
  }
}

// --- 2. MULTI-PAGE WEBSITE SCRAPER & MARKDOWN PARSER (NO SCHEMA NEEDED) ---
export interface ScrapedPageIntel {
  url: string;
  pageType: 'home' | 'about' | 'services' | 'contact' | 'other';
  title: string;
  headings: string[];
  markdownContent: string;
}

export interface WebsiteIntel {
  baseUrl: string;
  metaTitle: string;
  metaDescription: string;
  footerCopyrightYear: string | null;
  inferredFoundingYear: number | null;
  scrapedPages: ScrapedPageIntel[];
  detectedServices: string[];
}

function cleanHtmlToMarkdown($: cheerio.CheerioAPI, rootElement: cheerio.Cheerio<any>): string {
  const cloned = rootElement.clone();

  // 1. Only remove strictly invisible code & scripts
  cloned.find('script, style, noscript, svg, canvas, iframe, form, button, input, select, textarea').remove();
  cloned.find('[class*="cookie-banner"], [id*="cookie-banner"], [class*="modal-backdrop"]').remove();

  // 2. Format tables cleanly into Markdown
  cloned.find('table').each((_, table) => {
    const rows: string[] = [];
    $(table).find('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('th, td').each((_, cell) => {
        cells.push($(cell).text().replace(/\s+/g, ' ').trim());
      });
      if (cells.length > 0) {
        rows.push(`| ${cells.join(' | ')} |`);
      }
    });
    if (rows.length > 0) {
      $(table).replaceWith(`\n\n${rows.join('\n')}\n\n`);
    }
  });

  // 3. Format headings with clear Markdown semantics
  cloned.find('h1').each((_, el) => { $(el).replaceWith(`\n\n# ${$(el).text().replace(/\s+/g, ' ').trim()}\n\n`); });
  cloned.find('h2').each((_, el) => { $(el).replaceWith(`\n\n## ${$(el).text().replace(/\s+/g, ' ').trim()}\n\n`); });
  cloned.find('h3').each((_, el) => { $(el).replaceWith(`\n\n### ${$(el).text().replace(/\s+/g, ' ').trim()}\n\n`); });
  cloned.find('h4').each((_, el) => { $(el).replaceWith(`\n\n#### ${$(el).text().replace(/\s+/g, ' ').trim()}\n\n`); });
  cloned.find('h5, h6').each((_, el) => { $(el).replaceWith(`\n\n##### ${$(el).text().replace(/\s+/g, ' ').trim()}\n\n`); });

  // 4. Format lists and quotes
  cloned.find('li').each((_, el) => { $(el).replaceWith(`\n- ${$(el).text().replace(/\s+/g, ' ').trim()}`); });
  cloned.find('blockquote').each((_, el) => { $(el).replaceWith(`\n> ${$(el).text().replace(/\s+/g, ' ').trim()}\n`); });
  cloned.find('p').each((_, el) => { $(el).replaceWith(`\n\n${$(el).text().replace(/\s+/g, ' ').trim()}\n\n`); });
  cloned.find('br').replaceWith('\n');

  // 5. Extract 100% of all remaining text (capturing all divs, spans, sections, articles, descriptions)
  const fullText = cloned.text();

  // Normalize lines while preserving full content
  const rawLines = fullText.split('\n');
  const cleanLines: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 0) {
      cleanLines.push(trimmed);
    }
  }

  // Deduplicate only consecutive identical lines (e.g. repeated mobile menu duplicates)
  const finalLines: string[] = [];
  for (let i = 0; i < cleanLines.length; i++) {
    if (i === 0 || cleanLines[i] !== cleanLines[i - 1]) {
      finalLines.push(cleanLines[i]);
    }
  }

  return finalLines.join('\n\n');
}

function extractCopyrightYear(text: string): { copyrightYear: string | null; foundingYear: number | null } {
  if (!text) return { copyrightYear: null, foundingYear: null };
  
  // Match patterns like "© 1973 - 2026", "Copyright 2014", "© 2015-2024"
  const matchRange = text.match(/(?:©|copyright)\s*(?:19|20)(\d{2})\s*[-–—]\s*(?:19|20)(\d{2})/i);
  if (matchRange) {
    const startYear = parseInt(matchRange[0].match(/(?:19|20)\d{2}/)?.[0] || '', 10);
    return { copyrightYear: matchRange[0], foundingYear: isNaN(startYear) ? null : startYear };
  }

  const matchSingle = text.match(/(?:©|copyright)\s*((?:19|20)\d{2})/i);
  if (matchSingle) {
    const year = parseInt(matchSingle[1], 10);
    return { copyrightYear: matchSingle[0], foundingYear: isNaN(year) ? null : year };
  }

  return { copyrightYear: null, foundingYear: null };
}

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function scrapeWebsiteIntel(rawUrl: string): Promise<WebsiteIntel> {
  let normalizedUrl = rawUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const intel: WebsiteIntel = {
    baseUrl: normalizedUrl,
    metaTitle: '',
    metaDescription: '',
    footerCopyrightYear: null,
    inferredFoundingYear: null,
    scrapedPages: [],
    detectedServices: [],
  };

  let homeHtml = await fetchPageHtml(normalizedUrl);
  
  // Smart fallback if https://domain fails -> try https://www.domain
  if (!homeHtml && !normalizedUrl.includes('www.')) {
    try {
      const u = new URL(normalizedUrl);
      const wwwUrl = `${u.protocol}//www.${u.host}${u.pathname}`;
      homeHtml = await fetchPageHtml(wwwUrl);
      if (homeHtml) {
        normalizedUrl = wwwUrl;
        intel.baseUrl = wwwUrl;
      }
    } catch {}
  }

  // Fallback to http:// if https fails
  if (!homeHtml && normalizedUrl.startsWith('https://')) {
    const httpUrl = normalizedUrl.replace(/^https:\/\//, 'http://');
    homeHtml = await fetchPageHtml(httpUrl);
    if (homeHtml) {
      normalizedUrl = httpUrl;
      intel.baseUrl = httpUrl;
    }
  }

  if (!homeHtml) return intel;

  const $home = cheerio.load(homeHtml);

  // 1. Extract Meta Information
  intel.metaTitle = $home('title').text().trim() || $home('meta[property="og:title"]').attr('content')?.trim() || '';
  intel.metaDescription = $home('meta[name="description"]').attr('content')?.trim() || $home('meta[property="og:description"]').attr('content')?.trim() || '';

  // 2. Extract Copyright / Founding Year from Full Page text
  const fullText = $home('body').text();
  const { copyrightYear, foundingYear } = extractCopyrightYear(fullText);
  intel.footerCopyrightYear = copyrightYear;
  intel.inferredFoundingYear = foundingYear;

  // 3. DISCOVER INTERNAL SUBPAGES (Focused on top 4-5 core pages)
  const discoveredSubpages: Array<{ url: string; type: 'about' | 'services' | 'contact' | 'blog' | 'other'; priority: number }> = [];
  let baseHostname = '';
  try {
    baseHostname = new URL(normalizedUrl).hostname.replace(/^www\./, '');
  } catch {
    return intel;
  }

  $home('a[href]').each((_, el) => {
    const href = $home(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

    try {
      const resolved = new URL(href, normalizedUrl);
      const linkHost = resolved.hostname.replace(/^www\./, '');
      if (linkHost !== baseHostname) return; // Keep strictly on same domain

      // Avoid static asset extensions
      if (/\.(jpg|jpeg|png|gif|svg|pdf|css|js|zip|xml|json|ico|woff|woff2|ttf|eot)$/i.test(resolved.pathname)) return;

      const path = resolved.pathname.toLowerCase();
      if (path === '/' || path === '') return; // Skip root homepage duplicate

      let type: 'about' | 'services' | 'contact' | 'blog' | 'other' = 'other';
      let priority = 10;

      if (path.includes('about') || path.includes('story') || path.includes('history') || path.includes('who-we-are') || path.includes('team') || path.includes('leadership')) {
        type = 'about';
        priority = 1;
      } else if (path.includes('service') || path.includes('solution') || path.includes('amenit') || path.includes('offer') || path.includes('what-we-do') || path.includes('product') || path.includes('gaming') || path.includes('dining') || path.includes('restaurant') || path.includes('promot') || path.includes('reward') || path.includes('menu')) {
        type = 'services';
        priority = 2;
      } else if (path.includes('contact') || path.includes('location') || path.includes('direction') || path.includes('hours') || path.includes('faq')) {
        type = 'contact';
        priority = 3;
      } else {
        priority = 4;
      }

      const cleanResolvedUrl = resolved.origin + resolved.pathname;
      if (!discoveredSubpages.some(p => p.url === cleanResolvedUrl)) {
        discoveredSubpages.push({ url: cleanResolvedUrl, type, priority });
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  // Sort discovered subpages by priority
  discoveredSubpages.sort((a, b) => a.priority - b.priority);

  // 4. Extract Homepage Clean Markdown (100% of text)
  const homeMarkdown = cleanHtmlToMarkdown($home, $home('body'));
  const homeHeadings: string[] = [];
  $home('h1, h2, h3, h4').each((_, el) => {
    const hText = $home(el).text().trim();
    if (hText && hText.length > 3 && hText.length < 120) homeHeadings.push(hText);
  });

  intel.scrapedPages.push({
    url: normalizedUrl,
    pageType: 'home',
    title: intel.metaTitle,
    headings: homeHeadings.slice(0, 25),
    markdownContent: homeMarkdown,
  });

  // 5. Scrape Core 4-5 High-Value Subpages in 100% Completeness
  const maxSubpages = 4; // Homepage + 4 subpages = 5 total core pages
  const targetSubpages = discoveredSubpages.slice(0, maxSubpages);

  await Promise.all(
    targetSubpages.map(async sub => {
      const html = await fetchPageHtml(sub.url);
      if (!html) return;
      const $sub = cheerio.load(html);
      const subTitle = $sub('title').text().trim() || $sub('h1').first().text().trim() || sub.url;
      const subMarkdown = cleanHtmlToMarkdown($sub, $sub('body'));
      const subHeadings: string[] = [];
      $sub('h1, h2, h3, h4').each((_, el) => {
        const text = $sub(el).text().trim();
        if (text && text.length > 3 && text.length < 120) subHeadings.push(text);
      });

      if (sub.type === 'services' || sub.type === 'other') {
        intel.detectedServices.push(...subHeadings);
      }

      intel.scrapedPages.push({
        url: sub.url,
        pageType: sub.type,
        title: subTitle,
        headings: subHeadings.slice(0, 25),
        markdownContent: subMarkdown,
      });
    })
  );

  return intel;
}

// --- 3. APIFY LINKEDIN SCRAPER (COMPANIES & FOUNDERS) ---
export interface LinkedInIntel {
  companyName: string | null;
  tagline: string | null;
  employeeCount: string | null;
  industry: string | null;
  specialties: string[];
  headquarters: string | null;
  description: string | null;
  founderOrExecutive: {
    name: string | null;
    title: string | null;
    tenure: string | null;
    recentPostSnippet: string | null;
  } | null;
  source: string;
}

export async function fetchApifyLinkedInIntel(companyNameOrUrl: string, founderName?: string): Promise<LinkedInIntel | null> {
  if (!CONFIG.APIFY_API_TOKEN) {
    return null;
  }

  try {
    // We call the Apify run sync endpoint for LinkedIn Company or Profile Scraper
    // Actor: dev_fusion/linkedin-company-scraper or curious_coder/linkedin-post-search-scraper
    const actorId = 'dev_fusion~linkedin-company-scraper';
    const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${CONFIG.APIFY_API_TOKEN}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueries: [companyNameOrUrl],
        maxResults: 1,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const items: any[] = await res.json();
    if (!items || items.length === 0) return null;

    const first = items[0];
    return {
      companyName: first.name || first.companyName || companyNameOrUrl,
      tagline: first.tagline || first.slogan || null,
      employeeCount: first.employeeCount || first.staffCount || null,
      industry: first.industry || null,
      specialties: Array.isArray(first.specialties) ? first.specialties : [],
      headquarters: first.headquarters || first.location || null,
      description: (first.description || first.about || '').slice(0, 1000),
      founderOrExecutive: founderName ? {
        name: founderName,
        title: null,
        tenure: null,
        recentPostSnippet: null,
      } : null,
      source: 'Apify LinkedIn Actor',
    };
  } catch (err: any) {
    logWarn(`Apify LinkedIn lookup skipped/failed: ${err.message}`);
    return null;
  }
}

// --- 4. CONTEXT COMPILER (100% DETERMINISTIC - 0 AI) ---
export function compileLeadContext(
  lead: Record<string, any>,
  domainIntel: DomainIntel,
  websiteIntel: WebsiteIntel,
  linkedInIntel: LinkedInIntel | null
) {
  const firstName = lead['First Name'] || lead.first_name || '';
  const lastName = lead['Last Name'] || lead.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || lead.name || 'Unknown Contact';
  const title = lead['Title'] || lead.title || '';
  const company = lead['Company Name'] || lead.company || lead.company_name || domainIntel.domain || 'Target Business';
  const phone = lead['Phone'] || lead.phone || '';
  const email = lead['Email'] || lead.email || '';
  const city = lead['Primary City'] || lead.city || '';
  const state = lead['Primary State'] || lead.state || '';
  const industry = lead['Industry'] || lead.industry || '';
  const subIndustry = lead['Sub Industry'] || lead.sub_industry || '';
  const employee = lead['Employee'] || lead.employee || '';
  const revenue = lead['Revenue'] || lead.revenue || '';

  // Assemble human-readable Markdown Dossier
  let markdown = `# Business Dossier: ${company}\n\n`;
  markdown += `### 👤 Key Contact & Executive Profile\n`;
  markdown += `- **Name**: ${fullName}\n`;
  if (title) markdown += `- **Title**: ${title}\n`;
  if (phone) markdown += `- **Direct Phone**: ${phone}\n`;
  if (email) markdown += `- **Email**: ${email}\n`;
  if (city || state) markdown += `- **Headquarters / Location**: ${[city, state].filter(Boolean).join(', ')}\n`;
  if (industry) markdown += `- **Industry**: ${industry} ${subIndustry ? `(${subIndustry})` : ''}\n`;
  if (employee) markdown += `- **Staff Size**: ${employee} employees\n`;
  if (revenue) markdown += `- **Estimated Revenue**: ${revenue}\n\n`;

  markdown += `### 🌐 Domain Age & Longevity Intel\n`;
  markdown += `- **Domain**: ${domainIntel.domain || 'N/A'}\n`;
  markdown += `- **Registration Date**: ${domainIntel.registrationDate ? domainIntel.registrationDate.split('T')[0] : 'Unknown'}\n`;
  markdown += `- **Domain Age**: ${domainIntel.domainAgeYears ? `${domainIntel.domainAgeYears} years` : 'N/A'}\n`;
  markdown += `- **Longevity Inferred**: ${domainIntel.longevitySummary}\n\n`;

  markdown += `### 🏢 Website & Value Proposition\n`;
  if (websiteIntel.metaTitle) markdown += `- **Site Title**: ${websiteIntel.metaTitle}\n`;
  if (websiteIntel.metaDescription) markdown += `- **Summary**: ${websiteIntel.metaDescription}\n`;
  if (websiteIntel.footerCopyrightYear) markdown += `- **Footer Copyright Reference**: ${websiteIntel.footerCopyrightYear}\n`;
  if (websiteIntel.inferredFoundingYear) markdown += `- **Inferred Founding Year**: ~${websiteIntel.inferredFoundingYear}\n\n`;

  if (websiteIntel.scrapedPages.length > 0) {
    markdown += `### 📄 Scraped Pages & Full Content Markdown\n`;
    websiteIntel.scrapedPages.forEach(p => {
      markdown += `\n#### Page [${p.pageType.toUpperCase()}]: ${p.title} (${p.url})\n`;
      if (p.headings.length > 0) {
        markdown += `**Key Sections / Headings**: ${p.headings.join(' | ')}\n\n`;
      }
      markdown += `${p.markdownContent}\n\n`;
    });
  }

  if (linkedInIntel) {
    markdown += `\n### 🔗 LinkedIn Organization Data\n`;
    if (linkedInIntel.employeeCount) markdown += `- **LinkedIn Company Size**: ${linkedInIntel.employeeCount}\n`;
    if (linkedInIntel.specialties.length > 0) markdown += `- **Specialties**: ${linkedInIntel.specialties.join(', ')}\n`;
    if (linkedInIntel.description) markdown += `- **Company Bio**: ${linkedInIntel.description}\n`;
  }

  return {
    raw_lead: {
      id: lead.id || lead.idx,
      name: fullName,
      title,
      company,
      phone,
      email,
      location: [city, state].filter(Boolean).join(', '),
      industry,
      employee_count: employee,
      revenue,
    },
    domain_intel: domainIntel,
    website_intel: {
      base_url: websiteIntel.baseUrl,
      meta_title: websiteIntel.metaTitle,
      meta_description: websiteIntel.metaDescription,
      footer_copyright: websiteIntel.footerCopyrightYear,
      inferred_founding_year: websiteIntel.inferredFoundingYear,
      scraped_page_count: websiteIntel.scrapedPages.length,
      scraped_pages: websiteIntel.scrapedPages,
    },
    linkedin_intel: linkedInIntel,
    compiled_markdown: markdown,
  };
}

function printDetailedLeadSummary(
  leadId: any,
  company: string,
  lead: Record<string, any>,
  domainIntel: DomainIntel,
  websiteIntel: WebsiteIntel,
  linkedInIntel: LinkedInIntel | null,
  updatePayload: Record<string, any>
) {
  const line = '═'.repeat(68);
  const subline = '─'.repeat(68);

  console.log(`\n${line}`);
  console.log(`📌 LEAD CONTEXT REPORT | ID: ${leadId} | ${company.toUpperCase()}`);
  console.log(line);

  // 1. Contact & Business Info
  const fullName = `${lead['First Name'] || ''} ${lead['Last Name'] || ''}`.trim() || lead.name || 'N/A';
  console.log(`\n👤 [CONTACT & COMPANY PROFILE]`);
  console.log(`  • Contact Name : ${fullName} (${lead['Title'] || 'Executive'})`);
  console.log(`  • Direct Phone : ${lead['Phone'] || 'N/A'}`);
  console.log(`  • Email        : ${lead['Email'] || 'N/A'}`);
  console.log(`  • Location     : ${[lead['Primary City'], lead['Primary State'], lead['Country']].filter(Boolean).join(', ') || 'N/A'}`);
  console.log(`  • Industry     : ${lead['Industry'] || 'N/A'} ${lead['Sub Industry'] ? `(${lead['Sub Industry']})` : ''}`);
  console.log(`  • Employees    : ${lead['Employee'] || 'N/A'} | Revenue: ${lead['Revenue'] || 'N/A'}`);

  // 2. Domain & RDAP Intel
  console.log(`\n🌐 [DOMAIN AGE & LONGEVITY INTEL]`);
  console.log(`  • Target Domain: ${domainIntel.domain || 'N/A'}`);
  console.log(`  • Registered On: ${domainIntel.registrationDate ? domainIntel.registrationDate.split('T')[0] : 'Not Found'}`);
  console.log(`  • Domain Age   : ${domainIntel.domainAgeYears !== null ? `${domainIntel.domainAgeYears} YEARS ACTIVE` : 'N/A'}`);
  console.log(`  • Registrar    : ${domainIntel.registrar || 'N/A'}`);
  console.log(`  • Assessment   : ${domainIntel.longevitySummary}`);

  // 3. Website Markdown Intel
  const totalChars = websiteIntel.scrapedPages.reduce((acc, p) => acc + p.markdownContent.length, 0);
  const totalWords = websiteIntel.scrapedPages.reduce((acc, p) => acc + (p.markdownContent.match(/\b\w+\b/g)?.length || 0), 0);

  console.log(`\n🏢 [WEBSITE & SCRAPED CONTENT]`);
  console.log(`  • Base URL     : ${websiteIntel.baseUrl || 'N/A'}`);
  console.log(`  • Meta Title   : ${websiteIntel.metaTitle || 'N/A'}`);
  console.log(`  • Total Volume : ${totalChars.toLocaleString()} characters (${totalWords.toLocaleString()} words) across ${websiteIntel.scrapedPages.length} pages`);
  console.log(`  • Copyright    : ${websiteIntel.footerCopyrightYear || 'N/A'} (Inferred Founded: ~${websiteIntel.inferredFoundingYear || 'N/A'})`);
  console.log(`  • Pages Scraped Breakdown:`);
  websiteIntel.scrapedPages.forEach((p, idx) => {
    const pageWords = p.markdownContent.match(/\b\w+\b/g)?.length || 0;
    const snippet = p.markdownContent.replace(/^[#\s\-*]+/gm, '').replace(/\n+/g, ' ').slice(0, 160);
    console.log(`    [${idx + 1}] (${p.pageType.toUpperCase()}) ${p.url}`);
    console.log(`        Size: ${p.markdownContent.length.toLocaleString()} chars | ${pageWords} words | Title: "${p.title.slice(0, 60)}"`);
    console.log(`        Snippet: "${snippet}..."`);
  });

  // 4. LinkedIn Intel
  console.log(`\n🔗 [LINKEDIN RESEARCH INTEL]`);
  if (linkedInIntel) {
    console.log(`  • Company Name : ${linkedInIntel.companyName || 'N/A'}`);
    console.log(`  • Staff Range  : ${linkedInIntel.employeeCount || 'N/A'}`);
    console.log(`  • Specialties  : ${linkedInIntel.specialties.join(', ') || 'N/A'}`);
    console.log(`  • Overview     : ${linkedInIntel.description ? linkedInIntel.description.slice(0, 200) + '...' : 'N/A'}`);
  } else {
    console.log(`  • Status       : Skipped / No public LinkedIn actor match (proceeded with Domain + Web)`);
  }

  // 5. Database Commit Confirmation
  console.log(`\n💾 [SUPABASE DATABASE COMMIT]`);
  console.log(`  • Table Updated: "${TARGET_TABLE}" WHERE id = ${leadId}`);
  console.log(`  • Status Set   : "${updatePayload.context_status}"`);
  console.log(`  • Timestamp    : ${updatePayload.context_generated_at}`);
  console.log(`  • Columns Saved: context (JSONB), domain_data, website_data, linkedin_data, domain_age_years (${domainIntel.domainAgeYears})`);
  console.log(`\n${subline}`);
  console.log(`📝 [COMPILED CONTEXT PREVIEW - FIRST 500 CHARS]`);
  console.log(updatePayload.context.compiled_markdown.slice(0, 500) + '...\n');
  console.log(`${line}\n`);
}

// --- 5. MAIN BATCH WORKER EXECUTION ---
async function main() {
  log('=====================================================');
  log('Starting Self-Contained Context Generation Engine...');
  log(`Target Table: ${TARGET_TABLE} | Batch Size: ${BATCH_SIZE}`);
  log('=====================================================');

  // Test single domain mode
  if (TEST_DOMAIN) {
    log(`[TEST MODE] Running standalone research on domain: ${TEST_DOMAIN}`);
    const domainIntel = await fetchDomainAge(TEST_DOMAIN);
    logSuccess(`Domain Age: ${domainIntel.domainAgeYears} years (${domainIntel.longevitySummary})`);
    
    log(`Scraping website: https://${cleanDomainString(TEST_DOMAIN)}`);
    const websiteIntel = await scrapeWebsiteIntel(TEST_DOMAIN);
    logSuccess(`Scraped ${websiteIntel.scrapedPages.length} pages. Meta: ${websiteIntel.metaTitle}`);
    
    const sampleLead = {
      'First Name': 'Frank',
      'Last Name': 'Manzo',
      'Title': 'CEO',
      'Company Name': 'Bonanza Casino',
      'Phone': '775-323-2724',
      'Web Address': TEST_DOMAIN,
    };

    const compiled = compileLeadContext(sampleLead, domainIntel, websiteIntel, null);
    console.log('\n--- COMPILED CONTEXT PREVIEW ---');
    console.log(compiled.compiled_markdown);
    console.log('--------------------------------\n');
    process.exit(0);
  }

  // Initialize Supabase Client
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
    logError('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cannot connect to database.');
    process.exit(1);
  }

  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

  // Fetch leads (either specific ID or batch of pending)
  let leads: any[] | null = null;
  let fetchError: any = null;

  if (SPECIFIC_LEAD_ID) {
    log(`[TARGET MODE] Fetching specific lead ID: ${SPECIFIC_LEAD_ID} from table "${TARGET_TABLE}"...`);
    const res = await supabase
      .from(TARGET_TABLE)
      .select('*')
      .eq('id', SPECIFIC_LEAD_ID)
      .limit(1);
    leads = res.data;
    fetchError = res.error;
  } else {
    log(`Fetching up to ${BATCH_SIZE} pending leads from table "${TARGET_TABLE}"...`);
    const res = await supabase
      .from(TARGET_TABLE)
      .select('*')
      .or('context_status.is.null,context_status.eq.pending,context_status.eq.failed')
      .limit(BATCH_SIZE);
    leads = res.data;
    fetchError = res.error;
  }

  if (fetchError) {
    logError(`Failed to fetch leads from table "${TARGET_TABLE}":`, fetchError.message);
    process.exit(1);
  }

  if (!leads || leads.length === 0) {
    logSuccess(`No matching leads found in "${TARGET_TABLE}". Context engine complete.`);
    process.exit(0);
  }

  log(`Found ${leads.length} lead(s) ready for context harvesting.`);

  // Helper to process a single lead
  async function processLead(lead: any, index: number, total: number) {
    const leadId = lead.id || lead.idx;
    const company = lead['Company Name'] || lead.company || lead.company_name || 'Unknown Company';
    const webAddress = lead['Web Address'] || lead.domain || lead.website || lead.website_url || '';
    const contactName = `${lead['First Name'] || ''} ${lead['Last Name'] || ''}`.trim();

    log(`[${index + 1}/${total}] Processing Lead ID: ${leadId} (${company})`);

    try {
      // 1. RDAP Domain Age Lookup
      const domainIntel = await fetchDomainAge(webAddress || company);

      // 2. Multi-Page Website Scraping (Top 5 pages)
      const websiteIntel = webAddress ? await scrapeWebsiteIntel(webAddress) : {
        baseUrl: '',
        metaTitle: '',
        metaDescription: '',
        footerCopyrightYear: null,
        inferredFoundingYear: null,
        scrapedPages: [],
        detectedServices: [],
      };

      // 3. Apify LinkedIn Scraping (Optional/Fallback)
      const linkedInIntel = await fetchApifyLinkedInIntel(company, contactName);

      // 4. Compile Deterministic Context Object
      const fullContext = compileLeadContext(lead, domainIntel, websiteIntel, linkedInIntel);

      const updatePayload = {
        context: fullContext,
        domain_data: domainIntel,
        website_data: websiteIntel,
        linkedin_data: linkedInIntel || {},
        domain_age_years: domainIntel.domainAgeYears,
        domain_registered_at: domainIntel.registrationDate,
        context_status: 'COMPLETED',
        context_error: null,
        context_generated_at: new Date().toISOString(),
      };

      // 5. Update Record in Supabase
      const { error: updateError } = await supabase
        .from(TARGET_TABLE)
        .update(updatePayload)
        .eq('id', leadId);

      if (updateError) {
        logError(`Failed to update lead ${leadId}:`, updateError.message);
      } else {
        logSuccess(`Lead ${leadId} (${company}) enriched successfully!`);
        printDetailedLeadSummary(leadId, company, lead, domainIntel, websiteIntel, linkedInIntel, updatePayload);
      }
    } catch (err: any) {
      logError(`Error processing lead ${leadId}:`, err.message);
      await supabase
        .from(TARGET_TABLE)
        .update({
          context_status: 'failed',
          context_error: err.message || 'Unknown processing error',
        })
        .eq('id', leadId);
    }
  }

  // Process leads with concurrency pooling
  const concurrency = SPECIFIC_LEAD_ID ? 1 : CONFIG.CONCURRENCY;
  log(`Executing batch with concurrency: ${concurrency} parallel workers...`);

  for (let i = 0; i < leads.length; i += concurrency) {
    const chunk = leads.slice(i, i + concurrency);
    await Promise.all(
      chunk.map((lead, offset) => processLead(lead, i + offset, leads.length))
    );
  }

  log('=====================================================');
  logSuccess('Context Generation Engine run finished successfully.');
  log('=====================================================');
}

main().catch(err => {
  logError('Fatal unhandled error:', err);
  process.exit(1);
});
