import { NextResponse } from 'next/server';

/**
 * OLD Retell Webhook Endpoint
 * This redirects to the NEW handler at /api/retell/call-result
 * 
 * Retell is calling THIS endpoint, so we forward it to the new one
 * that has all the enhanced tracking logic.
 */
export async function POST(request: Request) {
  try {
    console.log('');
    console.log('🚨🚨🚨 OLD WEBHOOK ENDPOINT CALLED 🚨🚨🚨');
    console.log('📍 Endpoint: /api/retell/webhook');
    console.log('⚠️  Redirecting to new handler...');
    console.log('');
    
    const body = await request.json();
    console.log('📦 Webhook event:', body.event);
    console.log('📞 Call ID:', body.call?.call_id || body.call_id);

    // Forward to the NEW webhook handler
    console.log('🔄 Forwarding to /api/retell/call-result...');
    
    const newHandlerUrl = new URL('/api/retell/call-result', request.url);
    const forwardResponse = await fetch(newHandlerUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      });

    const result = await forwardResponse.json();
    console.log('✅ Forwarded successfully, status:', forwardResponse.status);
    console.log('');

    return NextResponse.json(result, { status: forwardResponse.status });

  } catch (error: any) {
    console.error('❌ Error forwarding webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
