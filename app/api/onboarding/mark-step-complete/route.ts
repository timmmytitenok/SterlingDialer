import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step } = await req.json();

    if (!step || step < 1 || step > 4) {
      return NextResponse.json({ error: 'Invalid step number' }, { status: 400 });
    }

    console.log(`✅ Marking step ${step} complete for user:`, user.id);

    // Update the specific step
    const columnName = `onboarding_step_${step}_${
      step === 1 ? 'form' : step === 2 ? 'balance' : step === 3 ? 'sheet' : 'schedule'
    }`;

    await supabase
      .from('profiles')
      .update({ [columnName]: true })
      .eq('user_id', user.id);

    // Check if all steps are now complete
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_step_1_form, onboarding_step_2_balance, onboarding_step_3_sheet, onboarding_step_4_schedule')
      .eq('user_id', user.id)
      .single();

    const allComplete = profile?.onboarding_step_1_form &&
                        profile?.onboarding_step_2_balance &&
                        profile?.onboarding_step_3_sheet &&
                        profile?.onboarding_step_4_schedule;

    if (allComplete) {
      console.log('🎉 All onboarding steps complete!');
      
      await supabase
        .from('profiles')
        .update({
          onboarding_all_complete: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true, allComplete });

  } catch (error: any) {
    console.error('Error marking step complete:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

