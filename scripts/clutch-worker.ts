// scripts/clutch-worker.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import * as dns from 'dns';
import * as net from 'net';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const resolveMx = promisify(dns.resolveMx);

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.LEADS_SUPABASE_URL;
const SUPABASE_KEY = process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY;
// Oxylabs hardcoded
const OXYLABS_USER = 'deenpanwer_GF6ee';
const OXYLABS_PASS = 'm_1Qmme_hFHz__3';

// Generic providers to ignore
const GENERIC_PROVIDERS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing LEADS_SUPABASE environment variables in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- TYPES ---

export type EmailStatus = 'SAFE' | 'RISKY' | 'DEAD' | 'UNKNOWN';

export interface VerifiedEmail {
  email: string;
  status: EmailStatus;
  sourceUrl: string;
  reason?: string;
}

export interface LeadPhone {
  number: string;
  sourceUrl: string;
}

export interface ClutchReview {
  title: string;
  author: string;
  date: string;
  rating: number;
  body: string;
}

export interface ClutchService {
  name: string;
  price?: string;
  description?: string;
}

export interface ServiceLine {
  name: string;
  percentage: string;
}

export interface ClutchProfile {
  name: string;
  logo: string;
  website: string;
  clutchUrl: string;
  description: string;
  reviewsCount: number;
  rating: number;
  phone: string;
  minProjectSize: string;
  hourlyRate: string;
  employees: string;
  location: {
    city?: string;
    country?: string;
    region?: string;
    street?: string;
    postalCode?: string;
  };
  founded?: string;
  services: string[];
  serviceLines: ServiceLine[];
  packages: ClutchService[];
  recentReviews: ClutchReview[];
  socialLinks: string[];
}

export interface LeadReport {
  profile: ClutchProfile;
  discovery: {
    emails: VerifiedEmail[];
    phones: LeadPhone[];
    socialLinks: string[];
    crawledUrls: string[];
  };
}

// --- LOGGING HELPER ---

function logStep(step: string, icon: string = '🔹', duration?: number) {
  const timeStr = typeof duration === 'number' ? ` (${(duration / 1000).toFixed(2)}s)` : '';
  console.log(`   ${icon} ${step}${timeStr}`);
}

// --- UTILS ---

/**
 * Enhanced Fetch with Proxy and High-Stealth Fallback.
 */
async function fetchWithFallback(url: string, render: boolean = false): Promise<string | null> {
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
        render: render ? 'html' : 'plain_http',
        user_agent_type: 'desktop_chrome'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.results?.[0]?.content || null;
    }
  } catch (error) {}

  // Attempt 2: Stealth Fallback
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
    if (response.ok) return await response.text();
  } catch (error) {}

  return null;
}

function resolveClutchRedirect(url: string): string {
  if (!url) return 'N/A';
  try {
    if (url.includes('clutch.co/profile/') || url.includes('clutch.co/redirect')) {
      const parsed = new URL(url, 'https://clutch.co');
      const u = parsed.searchParams.get('u') || parsed.searchParams.get('url');
      if (u) {
        const decoded = decodeURIComponent(u);
        if (decoded.includes('clutch.co/profile')) return 'N/A';
        return decoded.startsWith('http') ? decoded : `https://${decoded}`;
      }
    }
  } catch (e) {}
  if (url.includes('clutch.co/profile')) return 'N/A';
  return url;
}

function extractSchemaData(html: string): Partial<ClutchProfile> {
  const $ = cheerio.load(html);
  const profile: Partial<ClutchProfile> = {
    services: [], serviceLines: [], packages: [], recentReviews: [], socialLinks: []
  };

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      const items = Array.isArray(json) ? json : [json];

      items.forEach(item => {
        if (item['@type'] === 'LocalBusiness' || item['@type'] === 'Organization') {
          profile.name = item.name || profile.name;
          profile.logo = item.image || profile.logo;
          const potentialWebsite = resolveClutchRedirect(item.sameAs || item.url || '');
          if (potentialWebsite !== 'N/A' && (!profile.website || profile.website === 'N/A')) {
            profile.website = potentialWebsite;
          }
          profile.description = item.description || profile.description;
          profile.phone = item.telephone || profile.phone;
          profile.founded = item.foundingDate?.toString() || profile.founded;

          if (item.address) {
            profile.location = {
              city: item.address.addressLocality,
              country: item.address.addressCountry,
              region: item.address.addressRegion,
              street: item.address.streetAddress,
              postalCode: item.address.postalCode
            };
          }
          if (item.aggregateRating) {
            profile.rating = parseFloat(item.aggregateRating.ratingValue);
            profile.reviewsCount = parseInt(item.aggregateRating.reviewCount);
          }
          if (item.sameAs) {
            const sameAsArr = (Array.isArray(item.sameAs) ? item.sameAs : [item.sameAs])
              .filter((link: any) => typeof link === 'string' && !link.includes('clutch.co'));
            profile.socialLinks = Array.from(new Set([...(profile.socialLinks || []), ...sameAsArr]));
          }
          if (Array.isArray(item.review)) {
            profile.recentReviews = item.review.map((r: any) => ({
              title: r.name, author: r.author?.name || 'Anonymous',
              date: r.datePublished, rating: parseFloat(r.reviewRating?.ratingValue || '0'),
              body: r.reviewBody
            }));
          }
        }
        if (item.products || item['@type'] === 'Product') {
          const products = item.products || [item];
          products.forEach((p: any) => {
            const pkg: ClutchService = { name: p.name, description: p.description };
            if (p.offers?.lowPrice) pkg.price = `${p.offers.lowPrice} - ${p.offers.highPrice} ${p.offers.priceCurrency}`;
            else if (p.offers?.price) pkg.price = p.offers.price;
            profile.packages?.push(pkg);
          });
        }
      });
    } catch (e) {}
  });

  if (!profile.logo) profile.logo = $('meta[property="og:image"]').attr('content') || '';
  if (!profile.description) profile.description = $('meta[name="description"]').attr('content') || '';

  return profile;
}

function extractSocialLinks(html: string): string[] {
  const socialPatterns = [
    /linkedin\.com\/(in|company)\/[a-z0-9_-]+/gi,
    /twitter\.com\/[a-z0-9_-]+/gi,
    /x\.com\/[a-z0-9_-]+/gi,
    /facebook\.com\/[a-z0-9._-]+/gi,
    /instagram\.com\/[a-z0-9._-]+/gi
  ];
  const PLATFORM_HANDLES = ['clutch-co', 'clutch.co', 'clutch_co', 'clutchco'];
  const links = new Set<string>();
  socialPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach(m => {
        const fullLink = m.startsWith('http') ? m : `https://${m}`;
        if (!PLATFORM_HANDLES.some(handle => fullLink.toLowerCase().includes(handle))) links.add(fullLink);
      });
    }
  });
  return Array.from(links);
}

function extractTextFallbacks(html: string, profile: Partial<ClutchProfile>) {
  const $ = cheerio.load(html);
  const text = $('body').text();
  const empMatch = text.match(/(\d+\s*-\s*\d+)\s*Employees/i);
  if (empMatch) profile.employees = empMatch[1];
  const hrMatch = text.match(/(\$\d+\s*-\s*\$\d+\s*\/s*hr)/i);
  if (hrMatch) profile.hourlyRate = hrMatch[1];
  const mpMatch = text.match(/Min\.\s*project\s*size\s*(\$[0-9,]+)/i);
  if (mpMatch) profile.minProjectSize = mpMatch[1];

  $('.chart-label').each((i, el) => {
    const name = $(el).text().trim();
    const percentage = $(el).next('.chart-value').text().trim();
    if (name && percentage) profile.serviceLines?.push({ name, percentage });
  });

  const htmlSocials = extractSocialLinks(html);
  profile.socialLinks = Array.from(new Set([...(profile.socialLinks || []), ...htmlSocials]));
}

function extractEmails(html: string): string[] {
  const $ = cheerio.load(html);
  const emails = new Set<string>();
  $('a[href^="mailto:"]').each((_, el) => {
    const email = $(el).attr('href')?.replace('mailto:', '').split('?')[0].trim().toLowerCase();
    if (email && email.includes('@')) emails.add(email);
  });
  const text = $('body').text();
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (matches) matches.forEach(m => emails.add(m.toLowerCase()));
  return Array.from(emails);
}

function extractPhones(html: string): string[] {
  const $ = cheerio.load(html);
  const phones = new Set<string>();
  $('a[href^="tel:"]').each((_, el) => {
    const num = $(el).attr('href')?.replace('tel:', '').split('?')[0].trim();
    if (num) phones.add(num);
  });
  const text = $('body').text();
  const matches = text.match(/(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,6}/g);
  if (matches) {
    matches.forEach(m => {
      const clean = m.trim();
      const digitCount = clean.replace(/\D/g, '').length;
      if (digitCount >= 7 && digitCount <= 15 && !clean.includes('..')) {
        if (clean.includes('.')) {
          const parts = clean.split('.');
          if (parts.some(p => p.length > 4)) return;
        }
        phones.add(clean);
      }
    });
  }
  return Array.from(phones);
}

// --- VERIFICATION ---

async function verifyEmail(email: string, domain: string, isCatchAll: boolean = false): Promise<VerifiedEmail> {
  const result: VerifiedEmail = { email, status: 'UNKNOWN', sourceUrl: '' };
  const parts = email.split('@');
  if (parts.length < 2) return { ...result, status: 'DEAD', reason: 'Invalid format' };
  
  const emailDomain = parts[1].toLowerCase();
  const isGeneric = GENERIC_PROVIDERS.includes(emailDomain);
  const isTargetDomain = emailDomain === domain.toLowerCase();

  if (isGeneric && !isTargetDomain) return { ...result, status: 'DEAD', reason: 'Discarded: Generic Provider' };
  if (!isTargetDomain) return { ...result, status: 'RISKY', reason: 'Domain Mismatch' };
  if (isCatchAll) return { ...result, status: 'RISKY', reason: 'Catch-all domain' };

  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords?.length) return { ...result, status: 'DEAD', reason: 'No MX records' };
    const bestMx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;

    return new Promise((resolve) => {
      const socket = net.createConnection(25, bestMx);
      let step = 0;
      socket.setTimeout(10000);
      socket.on('data', (data) => {
        const resp = data.toString();
        if (step === 0 && resp.startsWith('220')) { socket.write(`HELO smtp.google.com\r\n`); step++; }
        else if (step === 1 && resp.startsWith('250')) { socket.write(`MAIL FROM:<verifier-service@gmail.com>\r\n`); step++; }
        else if (step === 2 && resp.startsWith('250')) { socket.write(`RCPT TO:<${email}>\r\n`); step++; }
        else if (step === 3) {
          if (resp.startsWith('250')) result.status = 'SAFE';
          else if (resp.startsWith('550')) {
            const isBlocked = /anti-spoofing|denied|spam|protection|security|policy/i.test(resp);
            result.status = isBlocked ? 'RISKY' : 'DEAD';
            result.reason = isBlocked ? 'Shielded' : 'Not found';
          } else { result.status = 'RISKY'; result.reason = `SMTP ${resp.substring(0,3)}`; }
          socket.write('QUIT\r\n'); socket.end();
        }
      });
      socket.on('timeout', () => { result.status = 'RISKY'; socket.destroy(); resolve(result); });
      socket.on('error', () => { result.status = 'RISKY'; resolve(result); });
      socket.on('end', () => resolve(result));
    });
  } catch (e: any) { return { ...result, status: 'RISKY', reason: e.message }; }
}

async function checkIsCatchAll(domain: string): Promise<boolean> {
  const randomStr = Math.random().toString(36).substring(2, 12);
  const res = await verifyEmail(`${randomStr}@${domain}`, domain, false);
  return res.status === 'SAFE';
}

// --- ENGINE ---

async function runScraperCore(clutchUrl: string): Promise<LeadReport | null> {
  try {
    const startClutch: number = Date.now();
    const clutchHtml = await fetchWithFallback(clutchUrl, true);
    if (!clutchHtml) return null;

    const profileData = extractSchemaData(clutchHtml);
    extractTextFallbacks(clutchHtml, profileData);
    const profile = { ...profileData, clutchUrl } as ClutchProfile;
    logStep(`Clutch Profile Scraped: ${profile.name}`, '💎', Date.now() - startClutch);

    const discovery: LeadReport['discovery'] = { emails: [], phones: [], socialLinks: [], crawledUrls: [] };

    if (profile.website && profile.website !== 'N/A') {
      let domain = '';
      try { domain = new URL(profile.website.startsWith('http') ? profile.website : `https://${profile.website}`).hostname.replace('www.', ''); } catch (e) {}

      if (domain) {
        const startCrawl: number = Date.now();
        const targetPaths = ['', '/contact', '/contact-us', '/about', '/team'];
        const emailMap = new Map<string, string>();
        const phoneMap = new Map<string, string>();
        const socialSet = new Set<string>();

        for (const path of targetPaths) {
          const url = profile.website.replace(/\/$/, '') + path;
          const html = await fetchWithFallback(url);
          if (!html) continue;

          discovery.crawledUrls.push(url);
          const pEmails = extractEmails(html);
          const pPhones = extractPhones(html);
          pEmails.forEach(e => { if (!emailMap.has(e)) emailMap.set(e, url); });
          pPhones.forEach(p => { if (!phoneMap.has(p)) phoneMap.set(p, url); });
          extractSocialLinks(html).forEach(s => socialSet.add(s));
          logStep(`Crawled ${path || '/'} (Emails: ${pEmails.length}, Phones: ${pPhones.length})`, '🕸️');
        }
        logStep(`Website Crawl Complete`, '🌐', Date.now() - startCrawl);

        discovery.socialLinks = Array.from(socialSet);
        
        logStep(`Testing Catch-All behavior...`, '🕵️');
        const isCatchAll = await checkIsCatchAll(domain);

        const startVerif: number = Date.now();
        for (const [email, sourceUrl] of emailMap.entries()) {
          const verified = await verifyEmail(email, domain, isCatchAll);
          if (verified.status !== 'DEAD' || (verified.reason && !verified.reason.includes('Discarded'))) {
            discovery.emails.push({ ...verified, sourceUrl });
            const icon = verified.status === 'SAFE' ? '✅' : verified.status === 'DEAD' ? '🚫' : '⚠️';
            logStep(`${verified.status}: ${email}`, icon);
          }
        }
        phoneMap.forEach((url, num) => discovery.phones.push({ number: num, sourceUrl: url }));
        logStep(`Email Verification Complete`, '📧', Date.now() - startVerif);
      }
    }
    return { profile, discovery };
  } catch (error) { return null; }
}

// --- WORKER ---

async function runWorker() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 CLUTCH LEAD WORKER: DEPLOYED");
  console.log("=".repeat(60));

  const { data: pendingLeads, error: fetchError } = await supabase.from('discovery_profiles').select('id, clutch_url').eq('status', 'PENDING').limit(5);

  if (fetchError || !pendingLeads?.length) {
    console.log("😴 Queue empty. Standby mode.");
    return;
  }

  console.log(`📦 BATCH: Processing ${pendingLeads.length} leads from queue.\n`);

  for (const lead of pendingLeads) {
    const leadStart: number = Date.now();
    console.log(`🔎 TARGET: ${lead.clutch_url}`);
    await supabase.from('discovery_profiles').update({ status: 'PROCESSING' }).eq('id', lead.id);

    try {
      const report = await runScraperCore(lead.clutch_url);
      if (report) {
        const { data: leadData, error: dataError } = await supabase.from('leads_data').upsert({
          clutch_url: lead.clutch_url, company_name: report.profile.name, website: report.profile.website,
          logo_url: report.profile.logo, location: report.profile.location, employees: report.profile.employees,
          hourly_rate: report.profile.hourlyRate, min_project: report.profile.minProjectSize,
          service_breakdown: report.profile.serviceLines, social_links: report.profile.socialLinks,
          full_profile_data: report.profile
        }, { onConflict: 'clutch_url' }).select('id').single();

        if (dataError) throw dataError;

        const contactEntries = [
          ...report.discovery.emails.map(e => ({ lead_id: leadData.id, type: 'EMAIL', value: e.email, status: e.status, source_url: e.sourceUrl, verified_at: new Date().toISOString() })),
          ...report.discovery.phones.map(p => ({ lead_id: leadData.id, type: 'PHONE', value: p.number, source_url: p.sourceUrl }))
        ];

        if (contactEntries.length > 0) await supabase.from('leads_contacts').insert(contactEntries);
        await supabase.from('discovery_profiles').update({ status: 'SCRAPED' }).eq('id', lead.id);
        
        const validCount = report.discovery.emails.filter(e => e.status === 'SAFE').length + report.discovery.phones.length;
        console.log(`✨ SUCCESS: ${report.profile.name} Burst. (${validCount} Leads found)`);
      } else {
        await supabase.from('discovery_profiles').update({ status: 'FAILED', error_log: 'Empty report' }).eq('id', lead.id);
      }
    } catch (err: any) {
      console.error(`❌ FAILED: ${err.message}`);
      await supabase.from('discovery_profiles').update({ status: 'FAILED', error_log: err.message }).eq('id', lead.id);
    }
    const duration: number = Date.now() - leadStart;
    console.log(`⏱️  Lead Total Time: ${(duration/1000).toFixed(2)}s\n` + "-".repeat(40));
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log("🏁 BATCH COMPLETE. EXITED.");
}

runWorker().catch(err => console.error("💥 Fatal Crash:", err));
