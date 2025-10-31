import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    // Validation: Must be exactly 8 characters, alphanumeric only
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length !== 8) {
      return NextResponse.json({ error: 'Code must be exactly 8 characters' }, { status: 400 });
    }

    if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      return NextResponse.json({ error: 'Code can only contain letters and numbers' }, { status: 400 });
    }

    // Check if user already has a referral code
    const { data: existingCode } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .single();

    if (existingCode) {
      return NextResponse.json({ 
        error: 'You already have a referral code',
        code: existingCode.code 
      }, { status: 400 });
    }

    // Check if code is already taken
    const { data: takenCode } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('code', trimmedCode)
      .single();

    if (takenCode) {
      return NextResponse.json({ 
        error: 'This code is already taken. Please choose another one.' 
      }, { status: 409 });
    }

    // Create the referral code
    const { data: newCode, error: insertError } = await supabase
      .from('referral_codes')
      .insert({
        user_id: user.id,
        code: trimmedCode
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating referral code:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create referral code. Please try again.' 
      }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/signup?ref=${trimmedCode}`;

    return NextResponse.json({ 
      success: true,
      code: newCode.code,
      link: referralLink
    });
  } catch (error: any) {
    console.error('Create referral code error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

