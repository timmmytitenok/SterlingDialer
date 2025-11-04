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

    // Get the target user's N8N webhook configuration
    const { data: webhookConfig } = await supabase
      .from('user_n8n_webhooks')
      .select('ai_agent_webhook_url')
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json({
      webhookUrl: webhookConfig?.ai_agent_webhook_url || null,
    });

  } catch (error: any) {
    console.error('❌ Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

