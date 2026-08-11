import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Server misconfiguration: Missing Supabase backend credentials.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (contactId) {
      // Fetch messages for a specific contact
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return NextResponse.json({ data });
    } else {
      // Fetch all messages to build the conversation list
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*, contacts(id, name, phone, is_opted_out)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return NextResponse.json({ data });
    }
  } catch (error: any) {
    console.error('API Error in /api/telnyx/conversations:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
