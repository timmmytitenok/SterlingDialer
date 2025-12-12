import { createServiceRoleClient } from '@/lib/supabase/server';

// Get AI cost per minute from app_settings
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

// Get user rate per minute from app_settings
export async function getUserRatePerMinute(): Promise<number> {
  try {
    const supabase = createServiceRoleClient();
    
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'user_rate_per_minute')
      .single();

    return data ? parseFloat(data.value) : 0.30; // Default to $0.30 if not found
  } catch (error) {
    console.error('Error fetching user rate per minute:', error);
    return 0.30; // Default fallback
  }
}

// Calculate actual AI expense for a refill amount
export async function calculateAIExpense(refillAmount: number): Promise<{
  expense: number;
  profit: number;
  profitMargin: number;
  minutesPurchased: number;
  aiCostPerMinute: number;
  userRatePerMinute: number;
}> {
  const aiCostPerMinute = await getAICostPerMinute();
  const userRatePerMinute = await getUserRatePerMinute();
  
  const minutesPurchased = refillAmount / userRatePerMinute;
  const expense = minutesPurchased * aiCostPerMinute;
  const profit = refillAmount - expense;
  const profitMargin = ((userRatePerMinute - aiCostPerMinute) / userRatePerMinute) * 100;
  
  const result = {
    expense: Math.round(expense * 100) / 100, // Round to 2 decimal places
    profit: Math.round(profit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
    minutesPurchased: Math.round(minutesPurchased * 100) / 100,
    aiCostPerMinute,
    userRatePerMinute,
  };
  
  console.log('📊 AI Expense Calculation:', {
    refillAmount: `$${refillAmount}`,
    userRate: `$${userRatePerMinute}/min`,
    aiCost: `$${aiCostPerMinute}/min`,
    minutes: `${result.minutesPurchased} min`,
    expense: `$${result.expense}`,
    profit: `$${result.profit}`,
    margin: `${result.profitMargin}%`
  });
  
  return result;
}
