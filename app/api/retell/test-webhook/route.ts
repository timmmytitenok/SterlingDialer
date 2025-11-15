import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify Retell can reach your server
 * Set this as your webhook URL temporarily to test connectivity
 */
export async function POST(request: Request) {
  console.log('');
  console.log('🎉 ========== TEST WEBHOOK RECEIVED! ==========');
  console.log('⏰ Time:', new Date().toISOString());
  console.log('🌐 URL:', request.url);
  
  try {
    const body = await request.json();
    console.log('📦 Webhook Body:', JSON.stringify(body, null, 2));
    console.log('🎉 ========================================');
  } catch (e) {
    console.log('⚠️ Could not parse body as JSON');
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Test webhook received successfully!',
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint is active',
    instructions: 'Configure this URL in Retell dashboard temporarily to test connectivity'
  });
}

