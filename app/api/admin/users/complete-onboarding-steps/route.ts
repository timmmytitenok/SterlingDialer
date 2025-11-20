import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();

    // Check admin access
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, step, completeAll } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    if (completeAll) {
      // Mark ALL steps complete
      console.log('🎯 Admin marking ALL onboarding steps complete for user:', userId);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_step_1_form: true,
          onboarding_step_2_balance: true,
          onboarding_step_3_sheet: true,
          onboarding_step_4_schedule: true,
          onboarding_all_complete: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating onboarding steps:', updateError);
        throw updateError;
      }

      console.log('✅ All onboarding steps marked complete by admin!');

      return NextResponse.json({ 
        success: true, 
        message: 'All onboarding steps completed' 
      });
    }

    // Mark individual step complete
    if (!step || step < 1 || step > 4) {
      return NextResponse.json({ error: 'Invalid step number' }, { status: 400 });
    }

    console.log(`🎯 Admin marking onboarding step ${step} complete for user:`, userId);

    const stepColumnMap: Record<number, string> = {
      1: 'onboarding_step_1_form',
      2: 'onboarding_step_2_balance',
      3: 'onboarding_step_3_sheet',
      4: 'onboarding_step_4_schedule',
    };

    const columnToUpdate = stepColumnMap[step];

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [columnToUpdate]: true })
      .eq('user_id', userId);

    if (updateError) {
      console.error(`❌ Error updating step ${step}:`, updateError);
      throw updateError;
    }

    console.log(`✅ Step ${step} marked complete by admin!`);

    // Check if all steps are now complete
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_step_1_form, onboarding_step_2_balance, onboarding_step_3_sheet, onboarding_step_4_schedule')
      .eq('user_id', userId)
      .single();

    const allComplete = profile?.onboarding_step_1_form &&
                        profile?.onboarding_step_2_balance &&
                        profile?.onboarding_step_3_sheet &&
                        profile?.onboarding_step_4_schedule;

    if (allComplete) {
      console.log('🎉 All onboarding steps now complete! Marking onboarding as done.');
      
      const { error: completeError } = await supabase
        .from('profiles')
        .update({
          onboarding_all_complete: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (completeError) {
        console.error('❌ Error marking all complete:', completeError);
        throw completeError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Step ${step} completed`,
      allComplete 
    });

  } catch (error: any) {
    console.error('❌ Error completing onboarding steps:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

