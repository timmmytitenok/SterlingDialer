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

    return data ? parseFloat(data.value) : 0.35; // Default to $0.35 if not found
  } catch (error) {
    console.error('Error fetching user rate per minute:', error);
    return 0.35; // Default fallback
  }
}

// Calculate actual AI expense for a refill amount
// Now supports custom user rate for per-user pricing
export async function calculateAIExpense(refillAmount: number, customUserRate?: number): Promise<{
  expense: number;
  profit: number;
  profitMargin: number;
  minutesPurchased: number;
  aiCostPerMinute: number;
  userRatePerMinute: number;
}> {
  const aiCostPerMinute = await getAICostPerMinute(); // Your expense: $0.15/min
  // Use custom user rate if provided, otherwise fetch global default
  const userRatePerMinute = customUserRate || await getUserRatePerMinute();
  
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

// Calculate profit for a specific user based on their custom rate
export function calculateUserProfit(refillAmount: number, userCostPerMinute: number, yourExpensePerMinute: number = 0.15): {
  profit: number;
  expense: number;
  minutesPurchased: number;
  profitMargin: number;
} {
  const minutesPurchased = refillAmount / userCostPerMinute;
  const expense = minutesPurchased * yourExpensePerMinute;
  const profit = refillAmount - expense;
  const profitMargin = ((userCostPerMinute - yourExpensePerMinute) / userCostPerMinute) * 100;
  
  return {
    profit: Math.round(profit * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    minutesPurchased: Math.round(minutesPurchased * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
  };
}
