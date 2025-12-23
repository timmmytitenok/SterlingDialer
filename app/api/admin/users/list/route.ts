import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

// Force dynamic - never cache this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/users/list
 * Comprehensive user list with all important metrics
 */
export async function GET() {
  try {
    // Check admin access
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    // Fetch all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      throw authError;
    }

    // Fetch all related data
    const [profiles, subscriptions, callBalances, retellConfigs] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('call_balance').select('*'),
      supabase.from('user_retell_config').select('user_id, retell_agent_id, phone_number, is_active')
    ]);
    
    console.log(`📊 Admin users list: Found ${retellConfigs.data?.length || 0} retell configs`);

    // Combine all data
    const users = await Promise.all((authData.users || []).map(async (authUser: any) => {
      const profile = profiles.data?.find((p: any) => p.user_id === authUser.id);
      const subscription = subscriptions.data?.find((s: any) => s.user_id === authUser.id);
      const balance = callBalances.data?.find((b: any) => b.user_id === authUser.id);
      const retellConfig = retellConfigs.data?.find((r: any) => r.user_id === authUser.id);

      // Determine setup status - Check if AI is actually configured
      // Step 1 = Form completion (onboarding_step_1_form)
      // Needs Onboarding = Step 1 NOT complete
      // Needs AI Setup = Step 1 complete BUT AI not configured
      let setupStatus = 'account_created';
      const hasAIConfigured = retellConfig && retellConfig.retell_agent_id && retellConfig.phone_number;
      const hasCompletedStep1 = profile?.onboarding_step_1_form === true;
      
      if (hasAIConfigured) {
        setupStatus = 'active';
      } else if (hasCompletedStep1) {
        setupStatus = 'onboarding_complete';
      }

      // Determine account type
      let accountType = 'Free Trial';
      let daysLeft = 0;
      let nextBillingDate = null;

      // Check VIP status first (from profile table)
      const isVIP = profile?.is_vip === true || subscription?.subscription_tier === 'vip';

      if (isVIP) {
        // VIP users always show as VIP regardless of subscription status
        accountType = 'VIP ACCESS';
      } else if (subscription) {
        if (subscription.status === 'trialing') {
          accountType = 'Free Trial';
          if (subscription.trial_end) {
            const trialEnd = new Date(subscription.trial_end);
            const now = new Date();
            daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          }
        } else if (subscription.status === 'active') {
          accountType = 'Pro Access';
          nextBillingDate = subscription.current_period_end;
        }
      }

      return {
        id: authUser.id,
        full_name: profile?.full_name || 'Unnamed User',
        email: authUser.email || 'No email',
        phone: profile?.phone_number || null,
        setup_status: setupStatus,
        last_sign_in_at: authUser.last_sign_in_at,
        account_type: accountType,
        days_left: daysLeft,
        next_billing_date: nextBillingDate,
        created_at: authUser.created_at,
        is_active: retellConfig?.is_active || false,
        has_ai_config: retellConfig ? true : false,
        call_balance: balance?.balance || 0,
        is_vip: isVIP, // Add VIP flag for filtering
      };
    }));

    // Sort by created_at descending (newest first)
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const response = NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    
    return response;

  } catch (error: any) {
    console.error('❌ Fatal error in /api/admin/users/list:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

