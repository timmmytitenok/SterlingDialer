import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

/**
 * GET /api/admin/recent-calls
 * Get recent calls for webhook monitoring
 */
export async function GET() {
  try {
    // Check if in admin mode
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    // Fetch last 10 calls
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      calls: calls || [],
    });
  } catch (error: any) {
    console.error('❌ Error fetching recent calls:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}

