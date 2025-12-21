import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function GET() {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    const { data: salesTeam, error } = await supabase
      .from('sales_team')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales team:', error);
      throw error;
    }

    return NextResponse.json({ salesTeam: salesTeam || [] });
  } catch (error: any) {
    console.error('Error in sales team API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales team' },
      { status: 500 }
    );
  }
}

