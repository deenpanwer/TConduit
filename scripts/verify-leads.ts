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
const TABLE_NAME = process.env.LEADS_TABLE_NAME || 'leads';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5000'); 
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100'); // Now dynamic!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase Credentials");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// --- STATIC LISTS ---
const DISPOSABLE_DOMAINS = new Set(['mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com', 'sharklasers.com']);

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

async function runBatch() {
  const startTime = performance.now();
  console.log(`\n🔥 HIGH-SPEED JUNK SHREDDER (DNS/MX Mode)`);
  console.log(`-------------------------------------------`);
  
  // Efficiently count remaining leads using our partial index
  const { count: totalRemaining, error: countError } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .eq('is_processed', false);

  if (countError) console.error("⚠️ Could not fetch total count:", countError.message);
  
  console.log(`📊 Queue Status: ${totalRemaining?.toLocaleString() || 'Unknown'} leads remaining in total.`);
  console.log(`🚀 Targeting: ${BATCH_SIZE} leads with Concurrency: ${CONCURRENCY}`);

  // Fetch unprocessed leads
  const { data: leads, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('is_processed', false)
    .eq('processing_status', 'PENDING')
    .limit(BATCH_SIZE);

  if (error || !leads || leads.length === 0) {
    console.log("😴 No pending leads found.");
    return;
  }

  console.log(`📦 Loaded ${leads.length} leads.`);

  const results: any[] = [];
  let completed = 0;
  let shredded = 0;
  let totalDnsTime = 0;

  const workers = Array(CONCURRENCY).fill(null).map(async () => {
    while (true) {
      const lead = (leads as any[]).pop();
      if (!lead) break;

      const email = lead.Email || lead.email;
      const leadStart = performance.now();
      
      const { mx_passed, regex_valid, is_disposable } = await checkDns(email);
      
      const leadEnd = performance.now();
      const duration = leadEnd - leadStart;
      totalDnsTime += duration;

      results.push({
        id: lead.id,
        is_processed: true,
        regex_valid: regex_valid,
        mx_check_passed: mx_passed && !is_disposable,
        smtp_status: mx_passed && !is_disposable ? 'MX_VALID' : 'INVALID',
        last_checked_at: new Date().toISOString(),
        processing_status: 'COMPLETED' // Mark as COMPLETED when done
      });

      completed++;
      const isJunk = !mx_passed || !regex_valid || is_disposable;
      if (isJunk) shredded++;

      const icon = isJunk ? '🗑️' : '✅';
      const reason = !regex_valid ? '[Bad Syntax]' : is_disposable ? '[Disposable]' : !mx_passed ? '[No MX]' : '[Valid MX]';
      
      console.log(`[${completed.toString().padStart(leads.length.toString().length, '0')}/${leads.length}] ${email.padEnd(35)} | ${duration.toFixed(0).padStart(4, ' ')}ms | ${reason.padEnd(12)} | ${icon}`);
    }
  });

  await Promise.all(workers);

  const processEnd = performance.now();
  const totalTime = (processEnd - startTime) / 1000;

  console.log(`\n💾 Saving ${results.length} results to Supabase...`);
  const saveStart = performance.now();
  const { error: upsertError } = await supabase.from(TABLE_NAME).upsert(results, { onConflict: 'id' });
  const saveEnd = performance.now();
  
  if (upsertError) {
    console.error("❌ Error saving results:", upsertError.message);
  } else {
    console.log(`✅ Upserted in ${((saveEnd - saveStart) / 1000).toFixed(2)}s.`);
    
    // AUTO-CLEANUP: Only delete rows that were actually processed AND failed
    console.log(`\n🧹 Cleaning up junk leads from database...`);
    const cleanStart = performance.now();
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('is_processed', true)
      .eq('mx_check_passed', false);
    const cleanEnd = performance.now();
    
    if (deleteError) {
      console.error("❌ Error during cleanup:", deleteError.message);
    } else {
      console.log(`✨ Cleanup finished in ${((cleanEnd - cleanStart) / 1000).toFixed(2)}s.`);
    }

    // FINAL SESSION SUMMARY
    const { count: finalRemaining } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('is_processed', false);

    console.log(`\n===========================================`);
    console.log(`📊 FINAL SESSION SUMMARY`);
    console.log(`===========================================`);
    console.log(`⏱️  Total Time Elapsed:   ${totalTime.toFixed(2)}s`);
    console.log(`📧  Leads Processed:      ${completed}`);
    console.log(`🚀  Average Speed:        ${(completed / totalTime).toFixed(2)} leads/sec`);
    console.log(`⚡  Average DNS Time:     ${(totalDnsTime / completed).toFixed(2)}ms`);
    console.log(`📦  Remaining in Queue:   ${finalRemaining?.toLocaleString() || '0'}`);
    console.log(`-------------------------------------------`);
    console.log(`✅  Valid (Saved):        ${completed - shredded}`);
    console.log(`🗑️  Shredded (Deleted):    ${shredded}`);
    console.log(`📉  Junk Percentage:      ${((shredded / completed) * 100).toFixed(2)}%`);
    console.log(`===========================================\n`);
  }
}

runBatch().catch(console.error);
