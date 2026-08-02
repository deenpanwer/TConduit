import { NextRequest, NextResponse } from 'next/server';
import Telnyx from 'telnyx';
import { saveTelnyxMessage } from '@/lib/telnyx-store';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('telnyx-signature-ed25519');
    const timestamp = req.headers.get('telnyx-timestamp');
    const publicKey = process.env.TELNYX_PUBLIC_KEY;

    if (!signature || !timestamp || !publicKey) {
      return NextResponse.json({ error: 'Missing required headers or public key' }, { status: 400 });
    }

    // Since we're just testing, we could instantiate the Telnyx client here
    // We only need it for the webhook verification utility
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
      
      await saveTelnyxMessage({
        id: payload.id || uuidv4(),
        type: 'inbound',
        from: payload.from.phone_number,
        to: payload.to[0]?.phone_number || '',
        text: payload.text,
        timestamp: new Date().toISOString()
      });
      
      console.log('Successfully saved inbound message from:', payload.from.phone_number);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
