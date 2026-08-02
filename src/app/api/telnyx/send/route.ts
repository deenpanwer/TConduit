import { NextRequest, NextResponse } from 'next/server';
import Telnyx from 'telnyx';
import { saveTelnyxMessage } from '@/lib/telnyx-store';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { to, text } = await req.json();

    if (!to || !text) {
      return NextResponse.json({ error: 'Missing to or text' }, { status: 400 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    const fromNumber = process.env.TELNYX_PHONE_NUMBER;
    const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID;

    if (!apiKey || (!fromNumber && !messagingProfileId)) {
      return NextResponse.json({ error: 'Missing Telnyx credentials in env' }, { status: 500 });
    }

    const t = new Telnyx({ apiKey });
    
    // Format to E.164 (strip everything except digits and '+')
    const formattedTo = to.replace(/[^\d+]/g, '');

    const messageParams: any = {
      to: formattedTo,
      text,
    };

    if (messagingProfileId) {
      messageParams.messaging_profile_id = messagingProfileId;
      messageParams.from = fromNumber; // Sometimes from number is also needed along with profile id
    } else {
      messageParams.from = fromNumber;
    }

    const response = await t.messages.send(messageParams);

    const messageRecord = {
      id: response.data?.id || uuidv4(),
      type: 'outbound' as const,
      from: fromNumber || 'Unknown',
      to: formattedTo,
      text: text,
      timestamp: new Date().toISOString()
    };

    await saveTelnyxMessage(messageRecord);

    return NextResponse.json({ success: true, message: messageRecord }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
