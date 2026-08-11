import { NextRequest, NextResponse } from 'next/server';
import Telnyx from 'telnyx';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { to, text, contactId } = await req.json();

    if (!to || !text) {
      return NextResponse.json({ error: 'Missing "to" or "text"' }, { status: 400 });
    }

    const telnyxApiKey = process.env.TELNYX_API_KEY;
    const fromNumber = process.env.TELNYX_PHONE_NUMBER;

    if (!telnyxApiKey || !fromNumber) {
      return NextResponse.json({ error: 'Telnyx credentials not configured' }, { status: 500 });
    }

    const telnyx = new Telnyx({ apiKey: telnyxApiKey });

    // Clean phone number to strict E.164 format (remove spaces, dashes, parentheses)
    const cleanTo = to.replace(/[^\d+]/g, '');

    // Send SMS
    const response = await telnyx.messages.send({
      from: fromNumber,
      to: cleanTo,
      text,
    });

    // Save to sms_messages table
    await supabase.from('sms_messages').insert({
      contact_id: contactId || null,
      direction: 'outbound',
      body: text,
      telnyx_id: response.data?.id || null,
    });

    return NextResponse.json({ success: true, id: response.data?.id });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
  }
}
