import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/retell/check-availability
 * 
 * Custom webhook for Retell to check calendar availability using the USER's Cal.ai API key
 * Returns available time slots for booking
 * 
 * Retell sends:
 * - userId: The user whose calendar to check
 * - date: The date to check (e.g., "2024-01-15" or "tomorrow")
 * - timezone: Customer's timezone (optional, defaults to America/New_York)
 */
export async function POST(request: Request) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📅 CHECK AVAILABILITY WEBHOOK');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const body = await request.json();
    console.log('📥 Received:', JSON.stringify(body, null, 2));

    // Handle different formats Retell might send
    // Sometimes it's {userId, date} and sometimes it's {args: {userId, date}}
    const args = body.args || body;
    
    const {
      userId,
      date,
      timezone = 'America/New_York',
    } = args;
    
    console.log('📦 Parsed args:', { userId, date, timezone });

    // DEBUG: Return what we received for troubleshooting
    if (!userId) {
      console.error('❌ Missing userId');
      console.error('📦 Full request body:', JSON.stringify(body, null, 2));
      return NextResponse.json({ 
        success: false, 
        error: `userId is required. Received: ${JSON.stringify(body)}`,
        available_slots: [],
        SlotA: 'Error: Missing userId',
        SlotB: '',
        SlotC: '',
        debug_received: body,
      }, { status: 200 }); // Return 200 so Retell shows the error
    }
    
    if (!date) {
      console.error('❌ Missing date');
      return NextResponse.json({ 
        success: false, 
        error: `date is required. Received userId: ${userId}`,
        available_slots: [],
        SlotA: 'Error: Missing date',
        SlotB: '',
        SlotC: '',
        debug_received: body,
      }, { status: 200 });
    }

    const supabase = createServiceRoleClient();

    // Get user's Cal.ai configuration including timezone
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('cal_ai_api_key, cal_event_id, agent_name, timezone')
      .eq('user_id', userId)
      .single();

    if (configError || !retellConfig) {
      console.error('❌ Failed to fetch user config:', configError);
      return NextResponse.json({ 
        success: false, 
        error: 'User configuration not found',
        available_slots: [],
      }, { status: 404 });
    }

    if (!retellConfig.cal_ai_api_key) {
      console.error('❌ User has no Cal.ai API key configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Cal.ai API key not configured',
        available_slots: [],
      }, { status: 400 });
    }

    if (!retellConfig.cal_event_id) {
      console.error('❌ User has no Cal.ai Event ID configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Cal.ai Event ID not configured',
        available_slots: [],
      }, { status: 400 });
    }

    // Agent's timezone (for Cal.com availability query)
    const agentTimezone = retellConfig.timezone || 'America/New_York';
    // Lead's timezone (for displaying times to the lead) - passed from Retell or default to EST
    const leadTimezone = timezone || 'America/New_York';
    
    console.log('✅ User config found');
    console.log(`   Cal.ai Event ID: ${retellConfig.cal_event_id}`);
    console.log(`   Agent Timezone: ${agentTimezone}`);
    console.log(`   Lead Timezone: ${leadTimezone}`);

    // First, get the Cal.com user info from the API key to get their username
    console.log('📤 Fetching Cal.com user info...');
    const meResponse = await fetch(`https://api.cal.com/v1/me?apiKey=${retellConfig.cal_ai_api_key}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const meResult = await meResponse.json();
    console.log('📥 Cal.com /me response:', JSON.stringify(meResult, null, 2));
    
    if (!meResponse.ok || !meResult.user?.username) {
      console.error('❌ Failed to get Cal.com user info');
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify Cal.com account. Check API key.',
        available_slots: [],
        SlotA: 'Calendar error',
        SlotB: '',
        SlotC: '',
      }, { status: 200 });
    }
    
    const calUsername = meResult.user.username;
    console.log(`✅ Cal.com username: ${calUsername}`);

    // Parse the date - handle "tomorrow", "next monday", etc.
    let targetDate = new Date();
    
    if (date) {
      const dateLower = date.toLowerCase();
      
      if (dateLower === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (dateLower === 'today') {
        // Keep as today
      } else if (dateLower.includes('next')) {
        // Handle "next monday", "next week", etc.
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayMatch = daysOfWeek.find(day => dateLower.includes(day));
        
        if (dayMatch) {
          const targetDayIndex = daysOfWeek.indexOf(dayMatch);
          const currentDayIndex = targetDate.getDay();
          let daysToAdd = targetDayIndex - currentDayIndex;
          if (daysToAdd <= 0) daysToAdd += 7; // Next week
          targetDate.setDate(targetDate.getDate() + daysToAdd);
        } else if (dateLower.includes('week')) {
          targetDate.setDate(targetDate.getDate() + 7);
        }
      } else {
        // Try to parse as a date string
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      }
    }

    // Format dates for Cal.com API
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // Cal.com slots API - include username for proper authentication
    // Use AGENT's timezone to get correct availability
    const calApiUrl = `https://api.cal.com/v1/slots`;
    const params = new URLSearchParams({
      apiKey: retellConfig.cal_ai_api_key,
      eventTypeId: retellConfig.cal_event_id,
      username: calUsername,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      timeZone: agentTimezone, // Use agent's timezone for availability
    });

    console.log('📤 Calling Cal.com Slots API...');
    console.log(`   URL: ${calApiUrl}?eventTypeId=${retellConfig.cal_event_id}&username=${calUsername}&startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`);

    const calResponse = await fetch(`${calApiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const calResult = await calResponse.json();
    console.log('📥 Cal.com response:', JSON.stringify(calResult, null, 2));

    if (!calResponse.ok) {
      console.error('❌ Cal.com API error:', calResult);
      return NextResponse.json({ 
        success: false, 
        error: calResult.message || 'Failed to check availability',
        available_slots: [],
      }, { status: 200 }); // Return 200 so Retell doesn't retry
    }

    // Parse available slots from Cal.com response
    // Cal.com /v1/slots returns: { slots: { "2024-01-15": [{time: "2024-01-15T09:00:00"}] } }
    const slots = calResult.slots || {};
    const availableSlots: string[] = [];
    const availableSlotsISO: string[] = []; // For booking
    
    // Format slots for the AI to read
    for (const [dateKey, times] of Object.entries(slots)) {
      if (Array.isArray(times)) {
        for (const slot of times) {
          const time = slot.time || slot;
          if (typeof time === 'string') {
            // Store ISO format for booking
            availableSlotsISO.push(time);
            
            // Convert to readable format using LEAD's timezone
            // The ISO time stays the same, so when booked it converts correctly
            const slotDate = new Date(time);
            const formattedTime = slotDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: leadTimezone, // Show to lead in THEIR timezone
            });
            const formattedDate = slotDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              timeZone: leadTimezone, // Show to lead in THEIR timezone
            });
            availableSlots.push(`${formattedDate} at ${formattedTime}`);
          }
        }
      }
    }

    // If no slots found, provide a helpful message
    if (availableSlots.length === 0) {
      const dateString = targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      
      return NextResponse.json({
        success: true,
        message: `No available slots found for ${dateString}. Would you like to check a different day?`,
        available_slots: [],
        available_slots_iso: [],
        SlotA: 'No slots available',
        SlotB: 'No alternate slot',
        SlotC: '',
        SlotA_iso: '',
        SlotB_iso: '',
        SlotC_iso: '',
        date_checked: dateString,
        suggestion: 'Try checking a different day',
      });
    }

    // Limit to first 5 slots to keep response manageable for AI
    const limitedSlots = availableSlots.slice(0, 5);
    const limitedSlotsISO = availableSlotsISO.slice(0, 5);

    console.log(`✅ Found ${availableSlots.length} available slots, returning ${limitedSlots.length}`);

    // Create a nice summary for the AI to read
    const summary = limitedSlots.length === 1 
      ? `I have one available slot: ${limitedSlots[0]}`
      : `I have ${limitedSlots.length} available slots: ${limitedSlots.join(', ')}`;

    return NextResponse.json({
      success: true,
      message: summary,
      available_slots: limitedSlots,
      available_slots_iso: limitedSlotsISO, // For booking function to use
      // Individual slots for easy AI reference
      SlotA: limitedSlots[0] || 'No slots available',
      SlotB: limitedSlots[1] || 'No alternate slot',
      SlotC: limitedSlots[2] || '',
      SlotA_iso: limitedSlotsISO[0] || '',
      SlotB_iso: limitedSlotsISO[1] || '',
      SlotC_iso: limitedSlotsISO[2] || '',
      total_slots_available: availableSlots.length,
      date_checked: targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    });

  } catch (error: any) {
    console.error('❌ Fatal error in check-availability webhook:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        available_slots: [],
      },
      { status: 500 }
    );
  }
}

