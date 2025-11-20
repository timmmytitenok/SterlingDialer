import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { month } = await req.json();

    if (!month) {
      return NextResponse.json({ error: 'Month required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Call the SQL function to generate commissions
    const { data, error } = await supabase.rpc('generate_monthly_commissions', {
      target_month: month
    });

    if (error) throw error;

    // Update all affiliate stats
    const { data: affiliates } = await supabase
      .from('referrals')
      .select('referrer_id');

    if (affiliates) {
      const uniqueReferrers = [...new Set(affiliates.map((a: any) => a.referrer_id))];
      
      for (const referrerId of uniqueReferrers) {
        await supabase.rpc('update_affiliate_stats', { p_referrer_id: referrerId });
      }
    }

    return NextResponse.json({ 
      success: true,
      commissionsCreated: data?.length || 0,
    });

  } catch (error: any) {
    console.error('Error generating commissions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

