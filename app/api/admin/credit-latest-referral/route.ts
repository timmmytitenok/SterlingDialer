import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createServiceRoleClient();

    console.log('🔍 Finding latest user with referral...');

    // Get the most recent user
    const { data: latestUser } = await supabase.auth.admin.listUsers();
    const sortedUsers = latestUser?.users.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    if (!sortedUsers || sortedUsers.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    console.log('📋 Latest 5 users:');
    for (let i = 0; i < Math.min(5, sortedUsers.length); i++) {
      const u = sortedUsers[i];
      const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by, full_name')
        .eq('user_id', u.id)
        .single();
      
      console.log(`  ${i+1}. ${u.email} - referred_by: ${profile?.referred_by || 'null'}`);
    }

    // Find the latest user WITH a referral code
    let targetUser = null;
    let targetProfile = null;

    for (const user of sortedUsers) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('user_id', user.id)
        .single();

      if (profile?.referred_by) {
        targetUser = user;
        targetProfile = profile;
        break;
      }
    }

    if (!targetUser || !targetProfile) {
      return NextResponse.json({ 
        error: 'No user with referral code found',
        latestUsers: sortedUsers.slice(0, 5).map((u: any) => ({
          email: u.email,
          id: u.id,
          created_at: u.created_at
        }))
      }, { status: 404 });
    }

    console.log('✅ Found user with referral:', targetUser.email);
    console.log('   Referral code:', targetProfile.referred_by);
    console.log('   User ID:', targetUser.id);

    // Check if they have a subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', targetUser.id)
      .single();

    console.log('   Has subscription?', !!subscription);

    if (!subscription) {
      return NextResponse.json({
        message: 'User has referral code but no subscription yet',
        user: {
          email: targetUser.email,
          referred_by: targetProfile.referred_by
        }
      });
    }

    // Check referral record
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', targetUser.id)
      .single();

    console.log('   Referral record:', referral);

    if (!referral) {
      return NextResponse.json({
        error: 'No referral record found',
        user: {
          email: targetUser.email,
          referred_by: targetProfile.referred_by
        }
      }, { status: 404 });
    }

    // Now credit it!
    console.log('💰 Crediting referral...');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const creditResponse = await fetch(`${baseUrl}/api/referral/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refereeId: targetUser.id })
    });

    const creditResult = await creditResponse.json();

    console.log('💰 Credit result:', creditResult);

    return NextResponse.json({
      success: true,
      user: {
        email: targetUser.email,
        id: targetUser.id,
        referred_by: targetProfile.referred_by
      },
      referral,
      creditResult
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

