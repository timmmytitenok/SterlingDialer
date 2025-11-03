import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      onboardingCompleted: profile?.onboarding_completed || false
    });
  } catch (error: any) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

