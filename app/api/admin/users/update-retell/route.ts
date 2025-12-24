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
    const { 
      userId, agentId, phoneNumber, phoneNumberFE, phoneNumberMP, 
      agentName, agentPronoun, calApiKey, calAiApiKey, calEventId, 
      costPerMinute, timezone, confirmationEmail,
      // New per-user Retell agent fields
      retellAgent1Id, retellAgent1Phone, retellAgent1Name, retellAgent1Type,
      retellAgent2Id, retellAgent2Phone, retellAgent2Name, retellAgent2Type
    } = body;
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

    // Check if config exists and get current values
    const { data: existing } = await supabase
      .from('user_retell_config')
      .select('id, phone_number_fe, phone_number_mp, cal_ai_api_key, cal_event_id, agent_name')
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
    if (agentPronoun !== undefined) updateFields.agent_pronoun = agentPronoun || 'She';
    if (calAiKey !== undefined) updateFields.cal_ai_api_key = calAiKey || null;
    if (calEventId !== undefined) updateFields.cal_event_id = calEventId || null;
    if (timezone !== undefined) updateFields.timezone = timezone || 'America/New_York';
    if (confirmationEmail !== undefined) updateFields.confirmation_email = confirmationEmail || null;
    
    // Per-user Retell AI Agent fields
    if (retellAgent1Id !== undefined) updateFields.retell_agent_1_id = retellAgent1Id || null;
    if (retellAgent1Phone !== undefined) updateFields.retell_agent_1_phone = retellAgent1Phone || null;
    if (retellAgent1Name !== undefined) updateFields.retell_agent_1_name = retellAgent1Name || null;
    if (retellAgent1Type !== undefined) updateFields.retell_agent_1_type = retellAgent1Type || 'final_expense';
    if (retellAgent2Id !== undefined) updateFields.retell_agent_2_id = retellAgent2Id || null;
    if (retellAgent2Phone !== undefined) updateFields.retell_agent_2_phone = retellAgent2Phone || null;
    if (retellAgent2Name !== undefined) updateFields.retell_agent_2_name = retellAgent2Name || null;
    if (retellAgent2Type !== undefined) updateFields.retell_agent_2_type = retellAgent2Type || 'final_expense';

    // Check if AI is fully configured - set is_active to true
    // Required: at least one phone number, cal api key, cal event id, agent name
    // Merge existing values with new values to determine full config status
    const finalPhoneFE = phoneFE !== undefined ? phoneFE : existing?.phone_number_fe;
    const finalPhoneMP = phoneMP !== undefined ? phoneMP : existing?.phone_number_mp;
    const finalCalKey = calAiKey !== undefined ? calAiKey : existing?.cal_ai_api_key;
    const finalCalEventId = calEventId !== undefined ? calEventId : existing?.cal_event_id;
    const finalAgentName = agentName !== undefined ? agentName : existing?.agent_name;
    
    const hasPhone = !!(finalPhoneFE || finalPhoneMP);
    const hasCalKey = !!finalCalKey;
    const hasCalEventId = !!finalCalEventId;
    const hasAgentName = !!finalAgentName;
    
    console.log('🔍 Checking config completeness:', { hasPhone, hasCalKey, hasCalEventId, hasAgentName });
    
    const isFullyConfigured = hasPhone && hasCalKey && hasCalEventId && hasAgentName;
    
    if (isFullyConfigured) {
      updateFields.is_active = true;
      console.log('✅ AI fully configured - setting is_active = true');
    } else {
      console.log('⚠️ AI not fully configured yet - missing:', {
        phone: !hasPhone,
        calKey: !hasCalKey,
        calEventId: !hasCalEventId,
        agentName: !hasAgentName
      });
    }

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
          agent_pronoun: agentPronoun || 'She',
          cal_ai_api_key: calAiKey || null,
          cal_event_id: calEventId || null,
          timezone: timezone || 'America/New_York',
          confirmation_email: confirmationEmail || null,
          retell_api_key: 'SET_BY_ADMIN',
          is_active: true,
          // Per-user Retell agents
          retell_agent_1_id: retellAgent1Id || null,
          retell_agent_1_phone: retellAgent1Phone || null,
          retell_agent_1_name: retellAgent1Name || null,
          retell_agent_1_type: retellAgent1Type || 'final_expense',
          retell_agent_2_id: retellAgent2Id || null,
          retell_agent_2_phone: retellAgent2Phone || null,
          retell_agent_2_name: retellAgent2Name || null,
          retell_agent_2_type: retellAgent2Type || 'final_expense',
        });

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Created new config');
    }

    // If AI is fully configured, update profile setup_status to 'active'
    if (isFullyConfigured) {
      console.log('🎯 Updating profile setup_status to active...');
      const { error: statusError } = await supabase
        .from('profiles')
        .update({ 
          setup_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (statusError) {
        console.error('⚠️ Error updating setup_status:', statusError);
      } else {
        console.log('✅ Profile setup_status set to ACTIVE');
      }
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
