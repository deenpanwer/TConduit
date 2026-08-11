import { createClient } from '@supabase/supabase-js';
import Telnyx from 'telnyx';

// Initialize Clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("[FATAL ERROR] Missing Supabase credentials in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const telnyxApiKey = process.env.TELNYX_API_KEY;
const fromNumber = process.env.TELNYX_PHONE_NUMBER;

if (!telnyxApiKey || !fromNumber) {
  throw new Error("[FATAL ERROR] Missing Telnyx credentials in environment variables.");
}

const telnyx = new Telnyx({ apiKey: telnyxApiKey });

// Helpers
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`);
const logError = (msg: string, err?: any) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, err || '');

const MESSAGE_TEMPLATE = `Get custom-made software for your travel agency.

Click here: https://www.heytracai.com

Reply STOP to opt out.`;

async function main() {
  log('=====================================================');
  log('Starting SMS Dispatch Engine...');
  log(`Using From Number: ${fromNumber}`);
  log('=====================================================');
  
  // 1. Claim 10 contacts from the queue
  log('Executing RPC claim_contacts_for_dispatch with batch_size: 10');
  const { data: contacts, error: claimError } = await supabase.rpc('claim_contacts_for_dispatch', {
    batch_size: 10
  });

  if (claimError) {
    logError('Supabase RPC claim_contacts_for_dispatch failed:', claimError);
    process.exit(1);
  }

  if (!contacts || contacts.length === 0) {
    log('No pending contacts found in the queue. Exiting successfully.');
    process.exit(0);
  }

  log(`Successfully claimed and locked ${contacts.length} contacts for dispatch.`);

  // 2. Loop through each contact and send SMS
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    log(`-----------------------------------------------------`);
    log(`[${i + 1}/${contacts.length}] Processing Contact ID: ${contact.id}`);
    log(`[${i + 1}/${contacts.length}] Name: ${contact.name || 'Unknown'} | Phone: ${contact.phone}`);

    try {
      // Clean phone number to strict E.164 format (remove spaces, dashes, parentheses)
      const cleanPhone = contact.phone.replace(/[^\d+]/g, '');

      // Send via Telnyx
      log(`[${contact.id}] Dispatching Telnyx API request to ${cleanPhone}...`);
      const response = await telnyx.messages.send({
        from: fromNumber,
        to: cleanPhone,
        text: MESSAGE_TEMPLATE,
      });

      const telnyxId = response.data?.id;
      log(`[${contact.id}] Telnyx Success. Message ID: ${telnyxId}`);

      // Log into sms_messages table
      log(`[${contact.id}] Inserting record into sms_messages table...`);
      const { error: insertError } = await supabase.from('sms_messages').insert({
        contact_id: contact.id,
        direction: 'outbound',
        body: MESSAGE_TEMPLATE,
        telnyx_id: telnyxId || null,
      });

      if (insertError) {
        logError(`[${contact.id}] Failed to insert into sms_messages table:`, insertError);
      } else {
        log(`[${contact.id}] Inserted into sms_messages successfully.`);
      }

      // Mark as sent in contacts table
      log(`[${contact.id}] Updating contact dispatch_status to 'sent'...`);
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          dispatch_status: 'sent',
          processed_at: new Date().toISOString(),
        })
        .eq('id', contact.id);

      if (updateError) {
        logError(`[${contact.id}] Failed to update contact dispatch_status:`, updateError);
      } else {
        log(`[${contact.id}] Contact status updated successfully.`);
      }

    } catch (err: any) {
      logError(`[${contact.id}] Telnyx Dispatch Failed:`, err.message);
      
      // Mark as failed and increment retry
      log(`[${contact.id}] Updating contact dispatch_status to 'failed' and incrementing retry count...`);
      const { error: failUpdateError } = await supabase
        .from('contacts')
        .update({
          dispatch_status: 'failed',
          last_error: err.message || 'Unknown error',
          retry_count: (contact.retry_count || 0) + 1,
          processed_at: new Date().toISOString(),
        })
        .eq('id', contact.id);
        
      if (failUpdateError) {
        logError(`[${contact.id}] Failed to update contact after error:`, failUpdateError);
      }
    }

    // Delay
    if (i < contacts.length - 1) {
      log(`[${contact.id}] Sleeping for 6 minutes before next message to maintain deliverability...`);
      await sleep(6 * 60 * 1000);
    }
  }

  log('=====================================================');
  log('Dispatch Engine execution completed successfully.');
  log('=====================================================');
}

// Execute
main().catch((err) => {
  logError('Fatal unhandled error in dispatch engine:', err);
  process.exit(1);
});
