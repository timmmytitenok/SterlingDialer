import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

/**
 * POST /api/admin/users/update-retell
 * Update a user's Retell configuration and cost per minute
 */
export async function POST(request: Request) {
  try {
    // Check if in admin mode
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Use service role client to bypass RLS when in admin mode
    const supabase = createServiceRoleClient();

    // Parse request body
    const body = await request.json();
    const { userId, agentId, phoneNumber, phoneNumberFE, phoneNumberMP, agentName, agentPronoun, calApiKey, calAiApiKey, calEventId, costPerMinute, timezone, confirmationEmail } = body;
    // Support both old and new field names
    const calAiKey = calAiApiKey || calApiKey;
    // Support both legacy single phone and new dual phone numbers
    const phoneFE = phoneNumberFE || phoneNumber; // Fallback to legacy single number for FE
    const phoneMP = phoneNumberMP;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log(`🔧 Updating Retell config for user ${userId}:`, {
      agentId: agentId || 'not set (using global agents)',
      phoneNumberFE: phoneFE || 'not set',
      phoneNumberMP: phoneMP || 'not set',
      agentName: agentName || 'not set',
      agentPronoun: agentPronoun || 'she/her',
      calAiApiKey: calAiKey ? '***SET***' : 'not set',
      calEventId: calEventId || 'not set',
      timezone: timezone || 'America/New_York',
      confirmationEmail: confirmationEmail || 'not set',
      costPerMinute: costPerMinute !== undefined ? `$${costPerMinute}` : 'not set',
    });

    // Check if config exists
    const { data: existing } = await supabase
      .from('user_retell_config')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    // Build update object - only include fields that were provided
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (agentId !== undefined) updateFields.retell_agent_id = agentId || null;
    // Store phone numbers - FE goes to legacy phone_number field for backwards compatibility
    if (phoneFE !== undefined) updateFields.phone_number = phoneFE || null;
    if (phoneFE !== undefined) updateFields.phone_number_fe = phoneFE || null;
    if (phoneMP !== undefined) updateFields.phone_number_mp = phoneMP || null;
    if (agentName !== undefined) updateFields.agent_name = agentName || null;
    if (agentPronoun !== undefined) updateFields.agent_pronoun = agentPronoun || 'she/her';
    if (calAiKey !== undefined) updateFields.cal_ai_api_key = calAiKey || null;
    if (calEventId !== undefined) updateFields.cal_event_id = calEventId || null;
    if (timezone !== undefined) updateFields.timezone = timezone || 'America/New_York';
    if (confirmationEmail !== undefined) updateFields.confirmation_email = confirmationEmail || null;

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('user_retell_config')
        .update(updateFields)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Updated existing config');
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('user_retell_config')
        .insert({
          user_id: userId,
          retell_agent_id: agentId || null,
          phone_number: phoneFE || null, // Legacy field for backwards compatibility
          phone_number_fe: phoneFE || null,
          phone_number_mp: phoneMP || null,
          agent_name: agentName || null,
          agent_pronoun: agentPronoun || 'she/her',
          cal_ai_api_key: calAiKey || null,
          cal_event_id: calEventId || null,
          timezone: timezone || 'America/New_York',
          confirmation_email: confirmationEmail || null,
          retell_api_key: 'SET_BY_ADMIN',
          is_active: true,
        });

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Created new config');
    }

    // Update cost_per_minute in profiles table if provided
    if (costPerMinute !== undefined) {
      const costValue = parseFloat(costPerMinute);
      if (!isNaN(costValue) && costValue > 0) {
        console.log(`💰 Updating cost_per_minute to $${costValue} for user ${userId}`);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            cost_per_minute: costValue,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (profileError) {
          console.error('⚠️ Error updating cost_per_minute in profiles:', profileError);
          // Don't fail the whole request, just log the error
        } else {
          console.log(`✅ Cost per minute updated to $${costValue}`);
        }

        // Also update in subscriptions table if exists
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ 
            cost_per_minute: costValue,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (subError) {
          console.log('ℹ️ No subscription to update (may not exist yet)');
        } else {
          console.log(`✅ Subscription cost_per_minute also updated`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
    });

  } catch (error: any) {
    console.error('❌ Fatal error updating config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
