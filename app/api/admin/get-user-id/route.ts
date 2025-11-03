import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ 
        success: false,
        error: 'Email is required' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Search for user by email in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_id, email, subscription_tier')
      .eq('email', email)
      .single();

    if (error || !profile) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found with that email' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId: profile.user_id,
      email: profile.email,
      subscriptionTier: profile.subscription_tier
    });
  } catch (error: any) {
    console.error('Error fetching user ID:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

