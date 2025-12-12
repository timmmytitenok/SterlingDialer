import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// GET - Fetch app settings
export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('*');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert to key-value object for easy access
    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ 
      settings: settingsMap,
      raw: settings 
    });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get AI cost per minute (for use in other APIs)
export async function getAICostPerMinute(): Promise<number> {
  try {
    const supabase = createServiceRoleClient();
    
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'ai_cost_per_minute')
      .single();

    return data ? parseFloat(data.value) : 0.15; // Default to $0.15 if not found
  } catch (error) {
    console.error('Error fetching AI cost per minute:', error);
    return 0.15; // Default fallback
  }
}

// Helper function to calculate actual AI expense for a refill
export async function calculateAIExpense(refillAmount: number, userRatePerMinute: number = 0.30): Promise<number> {
  const aiCostPerMinute = await getAICostPerMinute();
  const minutesPurchased = refillAmount / userRatePerMinute;
  const actualExpense = minutesPurchased * aiCostPerMinute;
  
  console.log('📊 AI Expense Calculation:', {
    refillAmount,
    userRatePerMinute,
    aiCostPerMinute,
    minutesPurchased: minutesPurchased.toFixed(2),
    actualExpense: actualExpense.toFixed(2),
    profit: (refillAmount - actualExpense).toFixed(2),
    profitMargin: ((1 - aiCostPerMinute / userRatePerMinute) * 100).toFixed(1) + '%'
  });
  
  return Math.round(actualExpense * 100) / 100; // Round to 2 decimal places
}
