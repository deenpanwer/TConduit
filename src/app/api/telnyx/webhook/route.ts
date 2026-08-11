import { NextRequest, NextResponse } from 'next/server';
import Telnyx from 'telnyx';
import { createClient } from '@supabase/supabase-js';

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
          priority: '1',
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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('telnyx-signature-ed25519');
    const timestamp = req.headers.get('telnyx-timestamp');
    const publicKey = process.env.TELNYX_PUBLIC_KEY;

    if (!signature || !timestamp || !publicKey) {
      return NextResponse.json({ error: 'Missing required headers or public key' }, { status: 400 });
    }

    const t = new Telnyx({ apiKey: process.env.TELNYX_API_KEY! });
    
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    let event: any;
    try {
      event = t.webhooks.unwrap(rawBody, { headers: headersObj, key: publicKey });
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
    }

    if (event.data.event_type === 'message.received') {
      const payload = event.data.payload;
      const fromPhone = payload.from.phone_number;
      const messageText = payload.text || '';
      const telnyxId = payload.id;
      
      console.log('Received inbound message from:', fromPhone);

      // 1. Look up contact in DB
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('phone', fromPhone)
        .single();

      const contactName = contact?.name || fromPhone;

      // 2. Save to sms_messages
      await supabase.from('sms_messages').insert({
        contact_id: contact?.id || null, // Allow null if unknown sender
        direction: 'inbound',
        body: messageText,
        telnyx_id: telnyxId,
      });

      // 3. Compliance Check (Opt-out)
      const stopWords = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];
      const isOptOut = stopWords.includes(messageText.trim().toLowerCase());

      if (isOptOut && contact?.id) {
        await supabase
          .from('contacts')
          .update({ 
            is_opted_out: true, 
            opt_out_timestamp: new Date().toISOString() 
          })
          .eq('id', contact.id);
          
        console.log(`Opted out contact: ${contact.id}`);
      }

      // 4. Send Dual-Pushover Alert
      const alertTitle = isOptOut ? `⚠️ OPT-OUT: ${contactName}` : `💬 SMS from ${contactName}`;
      const alertMessage = `${messageText}\n\nPhone: ${fromPhone}`;
      
      await sendPushoverAlert(alertTitle, alertMessage);
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
