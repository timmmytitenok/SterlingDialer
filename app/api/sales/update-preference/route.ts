import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { salesId, dashboard_stat } = await request.json();

    if (!salesId || !dashboard_stat) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the preference in the database
    const { error } = await supabase
      .from('sales_team')
      .update({ dashboard_stat })
      .eq('id', salesId);

    if (error) {
      console.error('Error updating preference:', error);
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update-preference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

