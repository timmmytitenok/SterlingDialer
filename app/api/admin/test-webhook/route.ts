import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { webhookUrl } = await request.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Missing webhookUrl' }, { status: 400 });
    }

    // Validate URL format
    try {
      const url = new URL(webhookUrl);
      if (!url.protocol.startsWith('http')) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log('🧪 Testing webhook:', webhookUrl);

    // Send test payload to N8N
    const testPayload = {
      test: true,
      message: 'Test ping from Sterling AI',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    console.log('📡 Webhook response status:', response.status);

    if (response.ok) {
      const responseText = await response.text();
      console.log('✅ Webhook test successful:', responseText);
      
      // Update last_tested_at timestamp in database
      // Note: We don't have userId in test endpoint, so we can't update the timestamp
      // This is just a ping test to verify the webhook URL is reachable
      
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook is reachable and responding',
        status: response.status,
        response: responseText
      });
    } else {
      console.error('❌ Webhook test failed with status:', response.status);
      return NextResponse.json({ 
        error: `Webhook returned status ${response.status}`,
        status: response.status
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Webhook test error:', error);
    
    if (error.message.includes('fetch')) {
      return NextResponse.json({ 
        error: 'Could not reach webhook. Check the URL and ensure N8N workflow is active.'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

