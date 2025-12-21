import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { referralCode, userId, userEmail, userName } = await req.json();

    if (!referralCode || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Find the sales person by referral code
    const { data: salesPerson, error: salesError } = await supabase
      .from('sales_team')
      .select('id, full_name, commission_type')
      .eq('referral_code', referralCode.toUpperCase())
      .eq('status', 'active')
      .single();

    if (salesError || !salesPerson) {
      console.error('Sales person not found for code:', referralCode);
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    console.log('📊 Creating sales referral for:', salesPerson.full_name);

    // Check if referral already exists
    const { data: existing } = await supabase
      .from('sales_referrals')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      console.log('⚠️ User already has a referral');
      return NextResponse.json({ message: 'User already referred' });
    }

    // Create the sales referral
    const { data: referral, error: refError } = await supabase
      .from('sales_referrals')
      .insert({
        sales_person_id: salesPerson.id,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        referral_code: referralCode.toUpperCase(),
        lead_source: 'self', // Default to self-sourced lead (recurring commission)
        status: 'trial',
      })
      .select()
      .single();

    if (refError) {
      console.error('Error creating referral:', refError);
      throw refError;
    }

    // Update user's profile with sales referral info
    await supabase
      .from('profiles')
      .update({
        referred_by_sales: referralCode.toUpperCase(),
        sales_referral_id: referral.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Update sales person stats
    await supabase
      .from('sales_team')
      .update({
        total_users_referred: salesPerson.id ? 
          (await supabase.from('sales_referrals').select('id', { count: 'exact' }).eq('sales_person_id', salesPerson.id)).count || 0
          : 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salesPerson.id);

    console.log('✅ Sales referral created successfully!');

    return NextResponse.json({ 
      success: true, 
      referralId: referral.id,
      salesPerson: salesPerson.full_name,
    });
  } catch (error: any) {
    console.error('Error in sales referral API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create referral' },
      { status: 500 }
    );
  }
}

