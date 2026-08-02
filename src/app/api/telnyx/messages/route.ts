import { NextResponse } from 'next/server';
import { getTelnyxMessages } from '@/lib/telnyx-store';

export async function GET() {
  try {
    const messages = await getTelnyxMessages();
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
