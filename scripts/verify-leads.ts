// scripts/verify-leads.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as dns from 'dns';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const resolveMx = promisify(dns.resolveMx);

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5000');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase Credentials");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// --- STATIC LISTS ---
const DISPOSABLE_DOMAINS = new Set(['mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com', 'sharklasers.com']);

// --- ACTIVE MULTI-EMAIL TABLES ---
const ACTIVE_TABLES = [
  'Marketing Agency',
  'Digital Marketing',
  'Medical Staffing',
  'Nurse Staffing Agency',
  'ceo_marketing_11_50',
  'employment_agencies',
  'marketing_owner',
  'recruiting_agency_harry',
  'recruitment_agency',
  'recruitment_agency_josh',
  'recruitment_owner',
  'recruitment_owner_ny',
  'recruitment_services',
  'staffing_agency',
  'staffing_and_recruiting_california',
  'staffing_and_recruiting_new_york',
  'staffing_canada',
  'staffing_fl',
  'staffing_owner_2023',
  'staffing_recruiting_fl',
  'staffing_recruiting_tx',
  'staffing_tx'
];

async function checkDns(email: string): Promise<{ mx_passed: boolean; regex_valid: boolean; is_disposable: boolean }> {
  const isSyntaxValid = EMAIL_REGEX.test(email);
  if (!isSyntaxValid) {
    return { mx_passed: false, regex_valid: false, is_disposable: false };
  }

  const domain = email.split('@')[1];
  const isDisposable = DISPOSABLE_DOMAINS.has(domain.toLowerCase());

  try {
    const mxRecords = await resolveMx(domain);
    return {
      mx_passed: mxRecords && mxRecords.length > 0,
      regex_valid: true,
      is_disposable: isDisposable
    };
  } catch (e) {
    return { mx_passed: false, regex_valid: true, is_disposable: isDisposable };
  }
}

async function processTable(tableName: string) {
  const startTime = performance.now();
  console.log(`\n===========================================================================`);
  console.log(`🚀 STARTING VERIFICATION FOR TABLE: "${tableName}"`);
  console.log(`===========================================================================`);

  // Efficiently count remaining leads using partial index
  const { count: totalRemaining, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('is_processed', false);

  if (countError) {
    console.warn(`⚠️ Could not fetch total count for "${tableName}":`, countError.message);
  } else {
    console.log(`📊 Queue Status: ${totalRemaining?.toLocaleString() || '0'} pending rows remaining.`);
  }

  if (totalRemaining === 0) {
    console.log(`😴 No pending rows found for "${tableName}". Skipping.`);
    return;
  }

  console.log(`⚙️ Running Batch Size: ${BATCH_SIZE} | Dynamic Concurrency: ${CONCURRENCY}`);

  // Fetch unprocessed leads in loops of 1000 to bypass API limits
  const fetchStart = performance.now();
  const leads: any[] = [];
  let remainingToFetch = BATCH_SIZE;

  while (remainingToFetch > 0) {
    const currentBatchSize = Math.min(remainingToFetch, 1000);
    const { data: batch, error } = await supabase.rpc('claim_leads_for_verification', {
      batch_size: currentBatchSize,
      table_name: tableName
    });

    if (error) {
      console.error(`❌ RPC Claim Error on "${tableName}":`, error.message);
      break;
    }

    if (!batch || batch.length === 0) break;

    leads.push(...batch);
    remainingToFetch -= batch.length;
    if (batch.length < currentBatchSize) break; // No more leads available
  }
  const fetchEnd = performance.now();

  if (leads.length === 0) {
    console.log(`😴 No claimable pending leads found in "${tableName}".`);
    return;
  }

  console.log(`📦 Loaded ${leads.length} rows in ${((fetchEnd - fetchStart) / 1000).toFixed(2)}s.`);

  const results: any[] = [];
  let completed = 0;
  let shredded = 0;
  let totalDnsTime = 0;

  const workers = Array(CONCURRENCY).fill(null).map(async () => {
    while (true) {
      const lead = (leads as any[]).pop();
      if (!lead) break;

      const rowData = lead.lead_data || lead;

      // Smart Deep-Extraction: Extract all valid email substrings from any email columns.
      // Automatically splits comma-separated emails and strips out tags like "(Accept_all)" or "(OK)".
      const activeEmails: { field: string; value: string }[] = [];

      Object.entries(rowData).forEach(([key, val]) => {
        if (typeof val !== 'string') return;
        const kLower = key.toLowerCase();
        if (kLower.endsWith('status')) return;
        if (!kLower.includes('email')) return;

        // Scan for standard email structures globally in the field
        const extracted = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (extracted) {
          extracted.forEach(email => {
            activeEmails.push({ field: key, value: email.trim().toLowerCase() });
          });
        }
      });

      const leadStart = performance.now();

      const updatePayload: any = {
        id: lead.id,
        is_processed: true,
        last_checked_at: new Date().toISOString(),
        processing_status: 'COMPLETED'
      };

      let anyRegexValid = false;
      let anyMxPassed = false;
      const emailDetailLogs: string[] = [];

      if (activeEmails.length === 0) {
        updatePayload.regex_valid = false;
        updatePayload.mx_check_passed = false;
        updatePayload.smtp_status = 'NO_EMAIL';
        emailDetailLogs.push(`   ⚠️ NO EMAIL FIELDS FOUND ON THIS ROW`);
      } else {
        const checkPromises = activeEmails.map(async ({ field, value }) => {
          const { mx_passed, regex_valid, is_disposable } = await checkDns(value);

          let status = 'INVALID';
          if (!regex_valid) status = 'INVALID_REGEX';
          else if (is_disposable) status = 'DISPOSABLE';
          else if (!mx_passed) status = 'INVALID_MX';
          else {
            status = 'MX_VALID';
            anyMxPassed = true;
          }

          if (regex_valid) anyRegexValid = true;

          // Save individual email status column if not standard 'Email' / 'email'
          if (field !== 'Email' && field !== 'email') {
            updatePayload[`${field} Status`] = status;
          }

          const statusIcon = status === 'MX_VALID' ? '✅' : '❌';
          emailDetailLogs.push(`   📧 [${field}] ${value} -> ${statusIcon} ${status}`);
        });

        await Promise.all(checkPromises);

        updatePayload.regex_valid = anyRegexValid;
        updatePayload.mx_check_passed = anyMxPassed;
        updatePayload.smtp_status = anyMxPassed ? 'MX_VALID' : 'INVALID';
      }

      const leadEnd = performance.now();
      const duration = leadEnd - leadStart;
      totalDnsTime += duration;

      results.push(updatePayload);

      completed++;
      const isJunk = !anyMxPassed;
      if (isJunk) shredded++;

      // Log row level header and sub-details beautifully for GitHub Actions
      const outcomeIcon = isJunk ? '🗑️ [DELETE]' : '✅ [KEEP]';
      console.log(`[${tableName}] Row #${completed.toString().padStart(leads.length.toString().length, '0')}/${leads.length} | ID: ${lead.id} | ⏱️ ${duration.toFixed(0)}ms | ${outcomeIcon}`);
      emailDetailLogs.forEach(log => console.log(log));
    }
  });

  await Promise.all(workers);

  const processEnd = performance.now();
  const totalTime = (processEnd - startTime) / 1000;

  console.log(`\n💾 Saving ${results.length} results to "${tableName}" in Supabase...`);
  const saveStart = performance.now();
  const { error: upsertError } = await supabase.from(tableName).upsert(results, { onConflict: 'id' });
  const saveEnd = performance.now();

  if (upsertError) {
    console.error(`❌ Error saving results for "${tableName}":`, upsertError.message);
  } else {
    console.log(`✅ Upserted successfully in ${((saveEnd - saveStart) / 1000).toFixed(2)}s.`);

    // AUTO-CLEANUP: Delete rows that have been processed and failed all email checks
    console.log(`🧹 Running lead shredder (pruning invalid rows) from "${tableName}"...`);
    const cleanStart = performance.now();
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('is_processed', true)
      .eq('mx_check_passed', false);
    const cleanEnd = performance.now();

    if (deleteError) {
      console.error(`❌ Error during cleanup of "${tableName}":`, deleteError.message);
    } else {
      console.log(`✨ Cleanup finished in ${((cleanEnd - cleanStart) / 1000).toFixed(2)}s.`);
    }

    // SESSION SUMMARY
    const { count: finalRemaining } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('is_processed', false);

    console.log(`\n===========================================================================`);
    console.log(`📊 BATCH SUMMARY FOR TABLE: "${tableName}"`);
    console.log(`===========================================================================`);
    console.log(`⏱️  Total Time Elapsed:   ${totalTime.toFixed(2)}s`);
    console.log(`📧  Leads Processed:      ${completed}`);
    console.log(`🚀  Average Speed:        ${(completed / totalTime).toFixed(2)} leads/sec`);
    console.log(`⚡  Average DNS Check:    ${(totalDnsTime / (completed || 1)).toFixed(2)}ms`);
    console.log(`✅  Valid (Saved/Kept):   ${completed - shredded}`);
    console.log(`🗑️  Shredded (Deleted):    ${shredded}`);
    console.log(`📉  Junk Percentage:      ${((shredded / (completed || 1)) * 100).toFixed(2)}%`);
    console.log(`📦  Remaining in Queue:   ${finalRemaining?.toLocaleString() || '0'}`);
    console.log(`===========================================================================\n`);
  }
}

async function runBatch() {
  const envTable = process.env.LEADS_TABLE_NAME;

  // Skip loop if a specific, non-leads table is passed via environment
  const tablesToProcess = (envTable && envTable !== 'leads') ? [envTable] : ACTIVE_TABLES;

  console.log(`🔥 HIGH-SPEED MULTI-EMAIL VERIFICATION ENGINE`);
  console.log(`===========================================================================`);
  console.log(`📋 Active Queue Tables to Process: ${tablesToProcess.length}`);
  console.log(`===========================================================================`);

  for (const table of tablesToProcess) {
    try {
      await processTable(table);
    } catch (e: any) {
      console.error(`❌ Unexpected error processing table "${table}":`, e.message);
    }
  }

  console.log(`===========================================================================`);
  console.log(`🎉 ALL TABLES PROCESSED SUCCESSFULY`);
  console.log(`===========================================================================`);
}

runBatch().catch(console.error);
