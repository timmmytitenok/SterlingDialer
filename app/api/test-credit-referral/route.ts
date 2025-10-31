import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { refereeUserId } = await req.json();
    
    if (!refereeUserId) {
      return NextResponse.json({ error: 'Missing refereeUserId' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    console.log('🧪 TEST: Crediting referral for referee:', refereeUserId);

    // Find the referee's referral
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', refereeUserId)
      .single();

    console.log('🧪 Referral found:', referral);
    console.log('🧪 Error:', refError);

    if (refError || !referral) {
      return NextResponse.json({ 
        error: 'No referral found',
        details: refError?.message 
      }, { status: 404 });
    }

    // Call the credit API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const creditResponse = await fetch(`${baseUrl}/api/referral/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refereeId: refereeUserId })
    });

    const creditResult = await creditResponse.json();

    console.log('🧪 Credit result:', creditResult);

    return NextResponse.json({
      success: true,
      referral,
      creditResult
    });

  } catch (error: any) {
    console.error('🧪 TEST ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

