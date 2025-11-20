import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Update user's profile to remove affiliate status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_affiliate_partner: false,
        affiliate_code: null,
        referral_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Also remove from referral_codes table
    const { error: deleteCodeError } = await supabase
      .from('referral_codes')
      .delete()
      .eq('user_id', userId);

    if (deleteCodeError) {
      console.error('Error deleting referral code:', deleteCodeError);
      // Continue anyway - the profile is already updated
    }

    return NextResponse.json({ 
      success: true,
      message: 'Affiliate partner removed successfully',
    });

  } catch (error: any) {
    console.error('Error deleting affiliate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

