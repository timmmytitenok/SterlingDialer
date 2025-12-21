import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { referralId, commission_type } = await req.json();

    if (!referralId || !commission_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('sales_referrals')
      .update({ 
        commission_type,
        updated_at: new Date().toISOString() 
      })
      .eq('id', referralId);

    if (error) {
      console.error('Error updating referral:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating referral:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update referral' },
      { status: 500 }
    );
  }
}

