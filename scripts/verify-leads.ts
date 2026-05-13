// scripts/verify-leads.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as dns from 'dns';
import * as net from 'net';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const resolveMx = promisify(dns.resolveMx);

// --- CLEAN CONFIGURATION ---
// Directly using the standardized secret names you just set in GitHub
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// These remain as environment variables or fallbacks
const TABLE_NAME = process.env.LEADS_TABLE_NAME || 'leads';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '1000');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10'); 
const MAX_RETRIES = 5;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase Credentials");
  console.log("Check: Is SUPABASE_URL present?", !!SUPABASE_URL);
  console.log("Check: Is SUPABASE_SERVICE_ROLE_KEY present?", !!SUPABASE_KEY);
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// --- TYPES ---
interface LeadUpdate {
  id: number;
  is_processed: boolean;
  regex_valid: boolean;
  mx_check_passed: boolean;
  smtp_status: string;
  last_checked_at: string;
  processing_status: 'COMPLETED' | 'PENDING';
  retry_count?: number;
  next_retry_at?: string | null;
  error_log?: string;
}

// --- VERIFICATION LOGIC ---

// --- CACHE FOR CATCH-ALL DOMAINS ---
const CATCH_ALL_CACHE = new Map<string, boolean>();

async function checkSmtp(email: string, domain: string, skipCatchAll: boolean = false): Promise<{ status: string; log: string }> {
  let log = "";
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords?.length) return { status: 'NO_MX', log: 'DNS: No MX records found.' };
    const bestMx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;
    
    // If we haven't checked this domain for Catch-All yet, do it now
    if (!skipCatchAll && !CATCH_ALL_CACHE.has(domain)) {
      const randomLocal = `verify_test_${Math.random().toString(36).substring(2, 10)}`;
      const catchAllRes = await checkSmtp(`${randomLocal}@${domain}`, domain, true);
      const isCatchAll = catchAllRes.status === 'DELIVERABLE';
      CATCH_ALL_CACHE.set(domain, isCatchAll);
      log += `CATCH-ALL CHECK: ${isCatchAll ? 'DETECTED' : 'None'}\n`;
    }

    // If it's a known Catch-All, and we are not in the middle of a test, return early
    if (!skipCatchAll && CATCH_ALL_CACHE.get(domain)) {
      return { status: 'CATCH_ALL', log: log + 'Domain accepts all emails. Flagged as Risky.\n' };
    }

    log += `MX: Found ${mxRecords.length} records. Best: ${bestMx}\n`;

    return new Promise((resolve) => {
      const socket = net.createConnection(25, bestMx);
      let step = 0;
      let responseReceived = false;

      socket.setTimeout(30000); // 30s for maximum compatibility with slow servers

      socket.on('data', (data) => {
        const resp = data.toString();
        log += `S:${step} R:${resp.trim().substring(0, 100)}\n`;

        if (step === 0 && resp.startsWith('220')) {
          socket.write(`HELO outbound.traconomics.com\r\n`); // Use a subdomain to distance from root
          step++;
        } else if (step === 1 && (resp.startsWith('250') || resp.startsWith('220'))) {
          socket.write(`MAIL FROM:<>\r\n`); // THE STEALTH MOVE: Use Null Sender (DSN standard)
          step++;
        } else if (step === 2 && resp.startsWith('250')) {
          socket.write(`RCPT TO:<${email}>\r\n`);
          step++;
        } else if (step === 3) {
          responseReceived = true;
          let status = 'UNKNOWN';
          const lowerResp = resp.toLowerCase();

          if (resp.startsWith('250')) {
            status = 'DELIVERABLE';
          } else if (resp.startsWith('550') || resp.startsWith('551') || resp.startsWith('554')) {
            // Semantic Mapping for 5xx Errors
            if (lowerResp.includes('xgemail_0011') || lowerResp.includes('sophos')) status = 'REJECTED_SOPHOS';
            else if (lowerResp.includes('spam') || lowerResp.includes('blocked') || lowerResp.includes('policy') || lowerResp.includes('security')) status = 'REJECTED_SPAM_FILTER';
            else if (lowerResp.includes('full') || lowerResp.includes('quota') || lowerResp.includes('over capacity')) status = 'MAILBOX_FULL';
            else if (lowerResp.includes('does not exist') || lowerResp.includes('no such user') || lowerResp.includes('not found') || lowerResp.includes('invalid recipient')) status = 'USER_NOT_FOUND';
            else if (lowerResp.includes('protection.outlook.com')) status = 'REJECTED_OUTLOOK_PROTECTION';
            else status = 'UNDELIVERABLE';
          } else if (resp.startsWith('4')) {
            status = 'GREYLISTED'; 
          } else {
            status = `SMTP_${resp.substring(0, 3)}`;
          }
          socket.write('QUIT\r\n');
          socket.end();
          resolve({ status, log });
        }
      });

      socket.on('timeout', () => { if (!responseReceived) resolve({ status: 'TIMEOUT', log: log + 'ERR: Timeout reached\n' }); socket.destroy(); });
      socket.on('error', (err: any) => { if (!responseReceived) resolve({ status: `ERR_${err.code}`, log: log + `ERR: ${err.message}\n` }); socket.destroy(); });
      socket.on('end', () => { if (!responseReceived) resolve({ status: 'CONN_CLOSED', log: log + 'ERR: Connection closed by peer\n' }); });
    });
  } catch (e: any) { return { status: 'MX_ERR', log: `MX Error: ${e.message}` }; }
}

async function verifyLead(lead: any): Promise<LeadUpdate> {
  const email = lead.Email || lead.email;
  const result: LeadUpdate = {
    id: lead.id,
    is_processed: true,
    regex_valid: false,
    mx_check_passed: false,
    smtp_status: 'UNKNOWN',
    last_checked_at: new Date().toISOString(),
    processing_status: 'COMPLETED',
    error_log: ""
  };

  if (!email || !EMAIL_REGEX.test(email)) {
    result.smtp_status = email ? 'INVALID_REGEX' : 'MISSING_EMAIL';
    return result;
  }

  result.regex_valid = true;
  const domain = email.split('@')[1];

  const smtpResult = await checkSmtp(email, domain);
  result.smtp_status = smtpResult.status;
  result.error_log = smtpResult.log;
  result.mx_check_passed = !smtpResult.status.startsWith('MX');

  // Logic for retries: Greylisted or temporary network blips
  const isTransientError = ['GREYLISTED', 'TIMEOUT', 'ERR_ECONNRESET', 'SMTP_421', 'SMTP_450', 'SMTP_451', 'SMTP_452'].includes(smtpResult.status);
  
  if (isTransientError && (lead.retry_count || 0) < MAX_RETRIES) {
    result.is_processed = false;
    result.processing_status = 'PENDING';
    result.retry_count = (lead.retry_count || 0) + 1;
    // Wait 15 minutes before next attempt
    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + 15);
    result.next_retry_at = nextRetry.toISOString();
  } else {
    result.next_retry_at = null;
  }

  return result;
}

// --- MAIN ENGINE ---

async function runBatch() {
  console.log(`\n🚀 STARTING INDUSTRIAL EMAIL VERIFIER`);
  console.log(`--------------------------------------`);

  // 0. JANITOR: Reset any leads stuck in 'PROCESSING' for too long
  await supabase.rpc('reset_stuck_leads');

  // 1. ATOMIC LOCKING: Claim leads so other workers don't touch them
  // We use a RPC (Stored Procedure) for this to ensure atomicity
  const { data: leads, error: lockError } = await supabase.rpc('claim_leads_for_verification', {
    batch_size: BATCH_SIZE,
    table_name: TABLE_NAME
  });

  if (lockError) {
    console.error(`❌ Locking Error: ${lockError.message}`);
    // Fallback to basic select if RPC doesn't exist yet (not recommended for production)
    console.log("⚠️ Attempting fallback fetch (non-atomic)...");
    const { data: fallbackLeads } = await supabase.from(TABLE_NAME)
      .select('id, Email, retry_count')
      .eq('is_processed', false)
      .limit(BATCH_SIZE);
    
    if (!fallbackLeads || fallbackLeads.length === 0) return;
    // Process leads normally
  }

  if (!leads || leads.length === 0) {
    console.log("😴 No pending leads found. Exiting.");
    return;
  }

  console.log(`📦 Processing ${leads.length} leads with concurrency ${CONCURRENCY}...`);

  const results: LeadUpdate[] = [];
  let completed = 0;

  // 2. WORKER POOL: Continuous processing
  const workers = Array(CONCURRENCY).fill(null).map(async () => {
    while (true) {
      const lead = (leads as any[]).pop();
      if (!lead) break;

      const update = await verifyLead(lead);
      results.push(update);
      completed++;
      
      const statusIcon = update.smtp_status === 'DELIVERABLE' ? '✅' : update.processing_status === 'PENDING' ? '⏳' : '❌';
      console.log(`[${completed}/${leads.length}] ${lead.Email} -> ${update.smtp_status} ${statusIcon}`);
      if (update.smtp_status.startsWith('ERR')) console.log(`   └─ Log: ${update.error_log?.split('\n')[0]}`);

      // "Slow is Smooth" Governor: 5-15 seconds of jitter to mimic human behavior
      await new Promise(r => setTimeout(r, 5000 + Math.random() * 10000));
    }
  });

  await Promise.all(workers);

  // 3. UPDATE COOLDOWNS: Mark these domains as "Just hit"
  const cooldowns = results.map(r => ({
    domain: (leads as any[]).find(l => l.id === r.id)?.Email.split('@')[1],
    last_hit_at: new Date().toISOString()
  })).filter(c => c.domain);

  if (cooldowns.length > 0) {
    await supabase.from('domain_cooldowns').upsert(cooldowns, { onConflict: 'domain' });
  }

  // 4. BULK UPSERT: One big write instead of 2500 small ones
  console.log(`\n💾 Bulk updating ${results.length} results to Supabase...`);
  const { error: upsertError } = await supabase.from(TABLE_NAME).upsert(results, { onConflict: 'id' });

  if (upsertError) {
    console.error(`❌ Bulk Update Failed: ${upsertError.message}`);
  } else {
    const successCount = results.filter(r => r.smtp_status === 'DELIVERABLE').length;
    console.log(`✅ Batch Finished. Deliverable: ${successCount} | Total: ${results.length}`);
  }
}

runBatch().catch(err => {
  console.error("💥 Fatal Crash:", err);
  process.exit(1);
});
