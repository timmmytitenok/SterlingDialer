import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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

    // Get the target user's N8N webhook configuration
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('user_n8n_webhooks')
      .select('ai_agent_webhook_url, ai_agent_webhook_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (webhookError) {
      console.error('❌ Error fetching webhook config:', webhookError);
      return NextResponse.json(
        { error: 'Failed to load webhook configuration' },
        { status: 500 }
      );
    }

    if (!webhookConfig || !webhookConfig.ai_agent_webhook_url) {
      console.error('❌ No webhook configured for user:', userId);
      return NextResponse.json(
        { error: 'No N8N webhook configured for this user. Please set up their webhook URL in the database first.' },
        { status: 400 }
      );
    }

    // Skip webhook enabled check for admin testing
    // Admin can test even if webhook is "disabled" for production use

    // Get admin test phone number from environment
    const adminTestPhone = process.env.ADMIN_TEST_PHONE_NUMBER;
    
    if (!adminTestPhone) {
      console.error('❌ ADMIN_TEST_PHONE_NUMBER not configured');
      return NextResponse.json(
        { error: 'Admin test phone number not configured in environment variables. Please add ADMIN_TEST_PHONE_NUMBER to .env.local' },
        { status: 500 }
      );
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', userId)
      .single();

    console.log('📞 Triggering test call to admin phone:', adminTestPhone);
    console.log('🔗 Using webhook:', webhookConfig.ai_agent_webhook_url);

    // Prepare webhook payload for test call
    const webhookPayload = {
      userId: userId,
      userEmail: profile?.email || 'test@example.com',
      userName: profile?.full_name || 'Test User',
      testMode: true,
      testPhoneNumber: adminTestPhone,
      dailyCallLimit: 1, // Only one test call
      callsMadeToday: 0,
      sessionStatus: 'active',
      timestamp: new Date().toISOString(),
      adminTest: true,
      message: 'Admin test call - verifying AI setup'
    };

    console.log('📤 Sending test payload to N8N:', webhookPayload);

    // Call the user's N8N webhook
    const webhookResponse = await fetch(webhookConfig.ai_agent_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    console.log('📡 N8N Response Status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('❌ N8N webhook error:', errorText);
      return NextResponse.json(
        { 
          error: 'N8N webhook call failed',
          details: errorText,
          status: webhookResponse.status 
        },
        { status: 500 }
      );
    }

    const responseData = await webhookResponse.text();
    console.log('✅ N8N webhook response:', responseData);

    // Log the test call in the calls table
    await supabase.from('calls').insert({
      user_id: userId,
      phone_number: adminTestPhone,
      status: 'test',
      disposition: 'admin_test',
      connected: false,
      outcome: null,
      notes: `Admin test call by ${requestingUser.email}`,
    });

    return NextResponse.json({
      success: true,
      message: `Test call initiated! Your phone (${adminTestPhone}) should ring shortly using ${profile?.full_name}'s AI configuration.`,
      webhook: webhookConfig.ai_agent_webhook_url,
      testPhone: adminTestPhone,
      responseFromN8N: responseData,
    });

  } catch (error: any) {
    console.error('❌ Admin test call error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during test call' },
      { status: 500 }
    );
  }
}

