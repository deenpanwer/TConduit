import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action, 
      email, 
      query, 
      planData, 
      resultIds, 
      searchId, 
      newTitle, 
      type, 
      data: interactionData 
    } = body;

    if (!email && action !== 'log_interaction') return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // 1. Initialize or Update User Profile
    if (action === 'init_user') {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ email, last_active_at: new Date().toISOString() })
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json(data);
    }

    // 2. Log New Search
    if (action === 'log_search') {
      // Ensure user exists before logging search to prevent FK violation
      const { error: userError } = await supabase
        .from('user_profiles')
        .upsert({ email, last_active_at: new Date().toISOString() });
      
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('user_searches')
        .insert({
          user_email: email,
          original_query: query,
          custom_title: query, // Defaults to query
          ai_plan: planData,
          result_ids: resultIds || []
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // 3. Get User Workspace (History)
    if (action === 'get_workspace') {
      const { data, error } = await supabase
        .from('user_searches')
        .select('*')
        .eq('user_email', email)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ history: data });
    }

    // 4. Update Result (Rename, Soft Delete, or Log Interaction)
    if (action === 'update_search') {
      const { action_type } = body;
      const updateData: any = {};
      if (newTitle !== undefined) updateData.custom_title = newTitle;
      if (action_type === 'delete') updateData.is_hidden = true;

      const { error } = await supabase
        .from('user_searches')
        .update(updateData)
        .eq('id', searchId)
        .eq('user_email', email);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // 5. Log User Interaction (View Profile, Hire, Refinement, etc.)
    if (action === 'log_interaction') {
      if (!searchId) return NextResponse.json({ error: 'searchId required' }, { status: 400 });
      
      // Fetch current interactions
      const { data: currentData, error: fetchError } = await supabase
        .from('user_searches')
        .select('interactions')
        .eq('id', searchId)
        .single();
        
      if (fetchError) {
          console.error("Error fetching interactions:", fetchError);
          throw fetchError; 
      }

      let currentInteractions = currentData?.interactions;

      // DEFENSIVE CODING: Ensure currentInteractions is an array
      if (typeof currentInteractions === 'string') {
        try {
            currentInteractions = JSON.parse(currentInteractions);
        } catch (e) {
            currentInteractions = [];
        }
      } else if (!Array.isArray(currentInteractions)) {
          currentInteractions = [];
      }

      const newInteraction = {
        type,
        timestamp: new Date().toISOString(),
        ...interactionData
      };

      const updatedInteractions = [...currentInteractions, newInteraction];

      const { error } = await supabase
        .from('user_searches')
        .update({ interactions: updatedInteractions })
        .eq('id', searchId);

      if (error) {
          console.error("Error updating interactions:", error);
          throw error;
      }
      
      return NextResponse.json({ success: true, count: updatedInteractions.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Workspace API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}