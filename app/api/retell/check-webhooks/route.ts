import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Check if any webhooks have been received from Retell
 */
export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    
    // Check if webhook_logs table exists and has data
    const { data: webhooks, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'webhook_logs table may not exist',
        error: error.message,
        solution: 'Run CREATE_WEBHOOK_LOGS_TABLE.sql in Supabase'
      });
    }
    
    return NextResponse.json({
      status: 'success',
      totalWebhooks: webhooks?.length || 0,
      recentWebhooks: webhooks?.map((w: any) => ({
        id: w.id,
        type: w.webhook_type,
        call_id: w.call_id,
        created_at: w.created_at,
        status: w.status
      })),
      message: webhooks?.length 
        ? `✅ ${webhooks.length} webhooks received` 
        : '❌ No webhooks received yet - Retell may not be configured'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}

