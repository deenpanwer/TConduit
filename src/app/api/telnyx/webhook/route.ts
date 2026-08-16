import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nacl from 'tweetnacl';

// Initialize Supabase (requires service role to bypass RLS for incoming webhooks if needed)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const PUSHOVER_USERS = [
  'up7a9283nbp36s1y58no8qrsmbxsbk', // Key 1
  'usb39vmu32jukckmqt2bt1xeszag19', // Key 2
];
const PUSHOVER_TOKEN = 'a6maptij9j7xkv2yrqbc6r98t69c3k'; // Using the chat/cron token

async function sendPushoverAlert(title: string, message: string) {
  for (const user of PUSHOVER_USERS) {
    try {
      const res = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: PUSHOVER_TOKEN,
          user: user,
          title: title,
          message: message,
          priority: '2',
          retry: '60', // Retry every 60 seconds until acknowledged
          expire: '3600', // Expire after 1 hour
          sound: 'pushover',
        }),
      });
      if (!res.ok) {
        console.error(`Pushover failed for user ${user}:`, await res.text());
      }
    } catch (err) {
      console.error(`Error sending Pushover to ${user}:`, err);
    }
  }
}

function verifyTelnyxWebhook(rawBody: string, signatureB64: string, timestamp: string, publicKeyB64: string): boolean {
  try {
    const message = `${timestamp}|${rawBody}`;
    const signature = Buffer.from(signatureB64, 'base64');
    const publicKey = Buffer.from(publicKeyB64, 'base64');

    return nacl.sign.detached.verify(
      Buffer.from(message, 'utf8'),
      signature,
      publicKey
    );
  } catch (err) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('telnyx-signature-ed25519');
    const timestamp = req.headers.get('telnyx-timestamp');
    const publicKey = process.env.TELNYX_PUBLIC_KEY;

    if (!signature || !timestamp || !publicKey) {
      return NextResponse.json({ error: 'Missing required headers or public key' }, { status: 400 });
    }

    // Verify signature manually because standard webhooks wrapper isn't fully compatible
    const isValid = verifyTelnyxWebhook(rawBody, signature, timestamp, publicKey);
    if (!isValid) {
      console.error('Webhook signature verification failed. No matching signature found');
      return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (event.data.event_type === 'message.received') {
      const payload = event.data.payload;
      const fromPhone = payload.from.phone_number;
      const messageText = payload.text || '';
      const telnyxId = payload.id;
      
      console.log('Received inbound message from:', fromPhone);

      // 1. Look up contact in DB (Safe lookup)
      let contactName = fromPhone;
      let contactId = null;
      try {
        const { data: contact } = await supabase
          .from('contacts')
          .select('id, name')
          .eq('phone', fromPhone)
          .single();
        if (contact) {
          contactName = contact.name || fromPhone;
          contactId = contact.id;
        }
      } catch (err) {
        console.error('Failed to lookup contact, proceeding with phone number:', err);
      }

      // 2. Compliance Check (Opt-out string detection)
      const stopWords = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];
      const isOptOut = stopWords.includes(messageText.trim().toLowerCase());

      // 3. IMMEDIATE PUSHOVER ALERT (Highest Priority)
      // We send this immediately so that if the DB goes down, you still get the text notification.
      try {
        const alertTitle = isOptOut ? `⚠️ OPT-OUT: ${contactName}` : `💬 SMS from ${contactName}`;
        const alertMessage = `${messageText}\n\nPhone: ${fromPhone}`;
        await sendPushoverAlert(alertTitle, alertMessage);
      } catch (err) {
        console.error('Failed to send Pushover alert:', err);
      }

      // 4. Save to sms_messages
      try {
        await supabase.from('sms_messages').insert({
          contact_id: contactId, // Allow null if unknown sender
          direction: 'inbound',
          body: messageText,
          telnyx_id: telnyxId,
        });
      } catch (err) {
        console.error('Failed to insert into sms_messages:', err);
      }

      // 5. Update Opt-Out Status in DB if necessary
      if (isOptOut && contactId) {
        try {
          await supabase
            .from('contacts')
            .update({ 
              is_opted_out: true, 
              opt_out_timestamp: new Date().toISOString() 
            })
            .eq('id', contactId);
          console.log(`Opted out contact: ${contactId}`);
        } catch (err) {
          console.error('Failed to update opt-out status:', err);
        }
      }
    } else if (event.data.event_type === 'message.finalized') {
      const payload = event.data.payload;
      const telnyxId = payload.id;
      // Extract status from the 'to' array (e.g., 'delivered', 'failed', 'delivery_unconfirmed')
      const deliveryStatus = payload.to?.[0]?.status || 'delivered';
      
      console.log(`Message ${telnyxId} status updated to: ${deliveryStatus}`);
      
      if (telnyxId) {
        await supabase
          .from('sms_messages')
          .update({ delivery_status: deliveryStatus })
          .eq('telnyx_id', telnyxId);
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
