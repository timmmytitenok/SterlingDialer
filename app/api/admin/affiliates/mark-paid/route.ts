import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { referrerId, paymentMethod, reference } = await req.json();

    if (!referrerId) {
      return NextResponse.json({ error: 'Referrer ID required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Mark ALL pending payouts for this affiliate as paid (not just one month)
    const { error } = await supabase
      .from('commission_payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_via: paymentMethod || 'manual',
        payment_reference: reference || null,
        updated_at: new Date().toISOString(),
      })
      .eq('referrer_id', referrerId)
      .eq('status', 'pending'); // Mark ALL pending, regardless of month

    if (error) throw error;

    // Update affiliate stats
    await supabase.rpc('update_affiliate_stats', { p_referrer_id: referrerId });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error marking as paid:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

