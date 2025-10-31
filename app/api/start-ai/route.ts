import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from request body
    const { userId } = await request.json();

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Forward request to N8N webhook
    const webhookUrl = process.env.N8N_WEBHOOK_START_DIAL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      );
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!webhookResponse.ok) {
      throw new Error('Webhook request failed');
    }

    const webhookData = await webhookResponse.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: 'AI started successfully',
      data: webhookData,
    });
  } catch (error: any) {
    console.error('Error starting AI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start AI' },
      { status: 500 }
    );
  }
}

