import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, testPhoneNumber } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Use provided test phone or default to admin number
    const adminTestPhone = testPhoneNumber || process.env.ADMIN_TEST_PHONE_NUMBER || '+16149403824';

    const supabase = await createClient();

    // Verify the requesting user is logged in
    const {
      data: { user: requestingUser },
    } = await supabase.auth.getUser();

    if (!requestingUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧪 Admin Test Call Request');
    console.log('   Requested by:', requestingUser.email);
    console.log('   Target user ID:', userId);

    // Get the target user's Retell AI configuration (NEW LOGIC)
    const { data: retellConfig, error: retellError } = await supabase
      .from('user_retell_config')
      .select('retell_agent_id, phone_number')
      .eq('user_id', userId)
      .maybeSingle();

    if (retellError) {
      console.error('❌ Error fetching Retell config:', retellError);
      return NextResponse.json(
        { error: 'Failed to load AI configuration' },
        { status: 500 }
      );
    }

    if (!retellConfig || !retellConfig.retell_agent_id || !retellConfig.phone_number) {
      console.error('❌ No Retell AI configured for user:', userId);
      return NextResponse.json(
        { error: 'No AI Agent configured for this user. Please set up their Retell Agent ID and Phone Number first.' },
        { status: 400 }
      );
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', userId)
      .single();

    console.log('📞 Triggering test call to admin phone:', adminTestPhone);
    console.log('🤖 Using Retell Agent ID:', retellConfig.retell_agent_id);
    console.log('📱 From phone number:', retellConfig.phone_number);

    // Call Retell API to create a phone call
    const retellApiKey = process.env.RETELL_API_KEY;
    if (!retellApiKey) {
      return NextResponse.json(
        { error: 'Retell API key not configured' },
        { status: 500 }
      );
    }

    const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: retellConfig.retell_agent_id,
        from_number: retellConfig.phone_number,
        to_number: adminTestPhone,
        metadata: {
          user_id: userId,
          admin_test: true,
          test_by: requestingUser.email,
        },
      }),
    });

    console.log('📡 Retell Response Status:', retellResponse.status);

    if (!retellResponse.ok) {
      const errorText = await retellResponse.text();
      console.error('❌ Retell API error:', errorText);
      return NextResponse.json(
        { 
          error: 'Retell API call failed',
          details: errorText,
          status: retellResponse.status 
        },
        { status: 500 }
      );
    }

    const retellData = await retellResponse.json();
    console.log('✅ Retell API response:', retellData);

    // Log the test call in the calls table
    await supabase.from('calls').insert({
      user_id: userId,
      phone_number: adminTestPhone,
      retell_call_id: retellData.call_id,
      status: 'initiated',
      disposition: 'admin_test',
      connected: false,
      outcome: null,
      notes: `Admin test call by ${requestingUser.email}`,
    });

    return NextResponse.json({
      success: true,
      message: `Test call initiated! Your phone (${adminTestPhone}) should ring shortly using ${profile?.full_name}'s AI Agent.`,
      agentId: retellConfig.retell_agent_id,
      fromNumber: retellConfig.phone_number,
      testPhone: adminTestPhone,
      callId: retellData.call_id,
      retellResponse: retellData,
    });

  } catch (error: any) {
    console.error('❌ Admin test call error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during test call' },
      { status: 500 }
    );
  }
}

