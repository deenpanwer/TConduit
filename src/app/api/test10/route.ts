import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('API Test10: Checking Env Vars');
    console.log('SUPABASE_URL found:', !!SUPABASE_URL);
    console.log('SUPABASE_KEY found:', !!SUPABASE_KEY);

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Missing Supabase configuration. Check server logs for details.',
        details: {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_KEY
        }
      }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const body = await req.json();
    const { source, limit = 10 } = body;

    if (!['github', 'npm'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source. Must be "github" or "npm".' }, { status: 400 });
    }

    let query;

    console.log(`Querying ${source} with limit ${limit}`);

    if (source === 'github') {
      query = supabase
        .from('github_raw_profiles')
        .select('*')
        .limit(limit);
    } else {
      query = supabase
        .from('npm_profiles')
        .select('*')
        .limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
    }

    return NextResponse.json({ profiles: data });

  } catch (error: any) {
    console.error('API Handler error:', error);
    return NextResponse.json({ error: error.message || 'Unknown server error' }, { status: 500 });
  }
}
