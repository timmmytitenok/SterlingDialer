'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

interface TestDataGeneratorProps {
  userId: string;
}

const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Lisa'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA'];

export function TestDataGenerator({ userId }: TestDataGeneratorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const randomName = () => {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
  };

  const randomPhone = () => {
    const area = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `(${area}) ${prefix}-${line}`;
  };

  const randomAge = () => Math.floor(Math.random() * 40) + 25; // 25-65
  const randomState = () => states[Math.floor(Math.random() * states.length)];

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      setIsSubscribed(!!data);
    } catch (error) {
      setIsSubscribed(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const toggleSubscription = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (isSubscribed) {
        // Remove subscription
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;

        setIsSubscribed(false);
        setMessage('❌ Subscription removed (AI agent blocked)');
      } else {
        // Add subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: userId,
            stripe_customer_id: 'test_customer_' + Math.random().toString(36).substr(2, 9),
            stripe_subscription_id: 'test_sub_' + Math.random().toString(36).substr(2, 9),
            status: 'active',
            plan_name: 'Sterling AI Basic',
            amount: 99.00,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false,
          }]);

        if (error) throw error;

        setIsSubscribed(true);
        setMessage('✅ Subscription activated (AI agent unlocked)');
      }

      setTimeout(() => router.refresh(), 800);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // For individual day revenue (when appointments are booked)
  const randomSingleRevenue = () => Math.floor(Math.random() * 4000) + 1000; // $1,000-$5,000 per appointment
  
  // AI costs EVERY day
  const randomAICost = () => {
    const flatRate = 33; // $33 flat rate
    const variable = Math.floor(Math.random() * 81) + 20; // $20-$100 variable
    return flatRate + variable; // Total: $53-$133 per day
  };

  const addAppointment = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Random time in next 5 days
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 5));
      futureDate.setHours(8 + Math.floor(Math.random() * 12)); // 8 AM - 8 PM
      futureDate.setMinutes(Math.random() > 0.5 ? 0 : 30);
      futureDate.setSeconds(0);

      const { error } = await supabase.from('appointments').insert([{
        user_id: userId,
        scheduled_at: futureDate.toISOString(),
        prospect_name: randomName(),
        prospect_phone: randomPhone(),
        prospect_age: randomAge(),
        prospect_state: randomState(),
        status: 'scheduled',
      }]);

      if (error) throw error;

      setMessage('✅ Added 1 appointment');
      setTimeout(() => router.refresh(), 800);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addCall = async (disposition: string, outcome?: string, daysAgo: number = 0) => {
    try {
      const isAnswered = disposition === 'answered';
      const duration = isAnswered ? Math.floor(Math.random() * 600) + 60 : null; // 1-10 minutes
      
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      const { error } = await supabase.from('calls').insert([{
        user_id: userId,
        disposition,
        outcome,
        connected: isAnswered,
        contact_name: isAnswered ? randomName() : null,
        contact_phone: isAnswered ? randomPhone() : null,
        duration_seconds: duration,
        recording_url: isAnswered ? 'https://example.com/recording-' + Math.random().toString(36).substr(2, 9) : null,
        created_at: date.toISOString(),
      }]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      throw error;
    }
  };

  const addCallWithUI = async (disposition: string, outcome?: string) => {
    setLoading(true);
    setMessage('');

    try {
      await addCall(disposition, outcome, 0);
      setMessage(`✅ Added 1 ${disposition} call`);
      setTimeout(() => router.refresh(), 800);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addRevenue = async (daysAgo: number = 0, revenue: number = 0) => {
    try {
      const aiCost = randomAICost();
      
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];

      const { error } = await supabase.from('revenue_tracking').insert([{
        user_id: userId,
        date: dateStr,
        revenue: revenue,
        ai_retainer_cost: 33,
        ai_daily_cost: aiCost - 33,
      }]);

      if (error) {
        // If date already exists, update it
        const { error: updateError } = await supabase
          .from('revenue_tracking')
          .update({
            revenue: revenue,
            ai_retainer_cost: 33,
            ai_daily_cost: aiCost - 33,
          })
          .eq('user_id', userId)
          .eq('date', dateStr);

        if (updateError) throw updateError;
      }

      return { revenue, aiCost, date: dateStr };
    } catch (error: any) {
      throw error;
    }
  };

  const addRevenueWithUI = async () => {
    setLoading(true);
    setMessage('');

    try {
      const revenue = randomSingleRevenue();
      const result = await addRevenue(0, revenue);
      setMessage(`✅ Added revenue: $${result.revenue.toLocaleString()} | AI Cost: $${result.aiCost}`);
      setTimeout(() => router.refresh(), 800);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ This will delete ALL your test data (calls, appointments, revenue). Are you sure?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await Promise.all([
        supabase.from('calls').delete().eq('user_id', userId),
        supabase.from('appointments').delete().eq('user_id', userId),
        supabase.from('revenue_tracking').delete().eq('user_id', userId),
        supabase.from('leads').delete().eq('user_id', userId),
      ]);

      setMessage('✅ All data cleared!');
      setTimeout(() => router.refresh(), 1000);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addLead = async (outcome?: string) => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.from('leads').insert([{
        user_id: userId,
        name: randomName(),
        phone: randomPhone(),
        email: `${randomName().toLowerCase().replace(' ', '.')}@example.com`,
        age: randomAge(),
        state: randomState(),
        status: outcome || 'new',
        last_call_outcome: outcome,
        times_dialed: outcome ? Math.floor(Math.random() * 3) + 1 : 0,
      }]);

      if (error) throw error;

      setMessage(`✅ Added 1 lead (${outcome || 'new'})`);
      setTimeout(() => router.refresh(), 800);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Toggle */}
      <div className="bg-gradient-to-br from-blue-950/50 to-indigo-950/50 rounded-lg p-6 border-2 border-blue-500/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💳</span>
              <h3 className="text-lg font-bold text-white">Subscription Control</h3>
            </div>
            <p className="text-sm text-gray-400">Toggle subscription to test AI agent access</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            checkingSubscription
              ? 'bg-gray-700 text-gray-300'
              : isSubscribed
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {checkingSubscription ? '...' : isSubscribed ? '✓ SUBSCRIBED' : '✗ NOT SUBSCRIBED'}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={toggleSubscription}
            disabled={loading || checkingSubscription}
            className={`w-full ${
              isSubscribed
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
            }`}
          >
            {isSubscribed ? '❌ Remove Subscription' : '✅ Activate Subscription'}
          </Button>
          
          <div className="bg-[#0B1437] rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">
              <span className="font-semibold text-white">Current Status:</span>
            </p>
            <ul className="text-xs text-gray-300 space-y-1 ml-4">
              {isSubscribed ? (
                <>
                  <li>✓ Can access AI Control Center</li>
                  <li>✓ Can launch AI calling agent</li>
                  <li>✓ Full dashboard access</li>
                </>
              ) : (
                <>
                  <li>✗ AI Control Center blocked</li>
                  <li>✗ Cannot launch AI agent</li>
                  <li>✓ Dashboard stats still accessible</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Leads Section */}
      <div className="bg-[#0B1437] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">👥 Leads</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={async () => {
              setLoading(true);
              setMessage('⏳ Adding callback leads...');
              for (let i = 0; i < 5; i++) {
                await addLead('callback_later');
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              setLoading(false);
            }}
            disabled={loading}
            variant="outline"
            className="border-orange-600 text-orange-400 hover:bg-orange-900/20"
          >
            📞 Add 5 Callback Leads
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              setMessage('⏳ Adding not interested leads...');
              for (let i = 0; i < 5; i++) {
                await addLead('not_interested');
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              setLoading(false);
            }}
            disabled={loading}
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-900/20"
          >
            ❌ Add 5 Not Interested
          </Button>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="bg-[#0B1437] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">📅 Appointments</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={addAppointment}
            disabled={loading}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
          >
            ➕ Add Random Appointment
          </Button>
        </div>
      </div>

      {/* Calls Section */}
      <div className="bg-[#0B1437] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">📞 Calls</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => addCallWithUI('answered', 'appointment_booked')}
            disabled={loading}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-900/20"
          >
            ✅ Add Booked Call
          </Button>
          <Button
            onClick={() => addCallWithUI('answered', 'not_interested')}
            disabled={loading}
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-900/20"
          >
            ❌ Add Not Interested
          </Button>
          <Button
            onClick={() => addCallWithUI('answered', 'callback_later')}
            disabled={loading}
            variant="outline"
            className="border-orange-600 text-orange-400 hover:bg-orange-900/20"
          >
            ⏰ Add Callback
          </Button>
          <Button
            onClick={() => addCallWithUI('no_answer')}
            disabled={loading}
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-900/20"
          >
            📵 Add Missed Call
          </Button>
        </div>
      </div>

      {/* Call Balance Testing */}
      <div className="bg-gradient-to-br from-emerald-950/50 to-teal-950/50 rounded-lg p-6 border-2 border-emerald-500/30">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💸</span>
          <h3 className="text-lg font-bold text-white">Call Balance Testing</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">Test auto-refill functionality and balance deductions</p>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={async () => {
              setLoading(true);
              setMessage('⏳ Simulating 5-minute call...');
              
              try {
                const response = await fetch('/api/balance/deduct', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    callId: `test-${Date.now()}`,
                    durationMinutes: 5,
                  }),
                });

                const data = await response.json();

                if (data.success) {
                  const cost = data.callCost.toFixed(3);
                  const balance = data.balance.toFixed(3);
                  
                  if (data.autoRefilled) {
                    setMessage(`🎉 Call completed! Cost: $${cost} | Balance: $${balance} | 🔄 Auto-refilled: $${data.refillAmount}!`);
                  } else {
                    setMessage(`✅ Call completed! Cost: $${cost} | New balance: $${balance}`);
                  }
                  
                  setTimeout(() => router.refresh(), 1500);
                } else {
                  throw new Error(data.error || 'Failed to deduct balance');
                }
              } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            variant="outline"
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/20"
          >
            📞 Simulate 5-Min Call ($0.50)
          </Button>

          <Button
            onClick={async () => {
              setLoading(true);
              setMessage('⏳ Simulating 100-minute call...');
              
              try {
                const response = await fetch('/api/balance/deduct', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    callId: `test-${Date.now()}`,
                    durationMinutes: 100,
                  }),
                });

                const data = await response.json();

                if (data.success) {
                  const cost = data.callCost.toFixed(3);
                  const balance = data.balance.toFixed(3);
                  
                  if (data.autoRefilled) {
                    setMessage(`🎉 Call completed! Cost: $${cost} | Balance: $${balance} | 🔄 Auto-refilled: $${data.refillAmount}!`);
                  } else {
                    setMessage(`✅ Call completed! Cost: $${cost} | New balance: $${balance}`);
                  }
                  
                  setTimeout(() => router.refresh(), 1500);
                } else {
                  throw new Error(data.error || 'Failed to deduct balance');
                }
              } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            variant="outline"
            className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
          >
            📞 Simulate 100-Min Call ($10)
          </Button>
        </div>

        <div className="mt-4 bg-[#0B1437] rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-2">
            <span className="font-semibold text-white">💡 Testing Tips:</span>
          </p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4">
            <li>• Rate: $0.10 per minute</li>
            <li>• Auto-refill triggers when balance drops below $10</li>
            <li>• Enable auto-refill in Settings → Billing → Call Balance tab</li>
            <li>• Use 100-min call to test auto-refill if balance is low</li>
          </ul>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-[#0B1437] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">💰 Revenue</h3>
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={addRevenueWithUI}
            disabled={loading}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-900/20"
          >
            💵 Add Today's Revenue
          </Button>
          <p className="text-xs text-gray-400">
            Revenue: Random $1,000-$5,000 per day | AI Cost: $33 + $20-$100 daily
          </p>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-[#0B1437] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">🎲 Quick Test Data</h3>
        <div className="space-y-3">
          <Button
            onClick={async () => {
              setLoading(true);
              for (let i = 0; i < 10; i++) {
                await addLead(Math.random() > 0.5 ? 'callback_later' : 'not_interested');
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              setLoading(false);
            }}
            disabled={loading}
            variant="outline"
            className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/20"
          >
            ⚡ Add 10 Random Leads
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              for (let i = 0; i < 5; i++) {
                await addAppointment();
                await new Promise(resolve => setTimeout(resolve, 300));
              }
              setLoading(false);
            }}
            disabled={loading}
            variant="outline"
            className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/20"
          >
            ⚡ Add 5 Random Appointments
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              await addCall('answered', 'appointment_booked');
              await addCall('answered', 'appointment_booked');
              await addCall('answered', 'not_interested');
              await addCall('answered', 'callback_later');
              await addCall('no_answer');
              setLoading(false);
            }}
            disabled={loading}
            variant="outline"
            className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/20"
          >
            ⚡ Add 5 Mixed Calls
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              setMessage('⏳ Generating 30 days of call data...');
              
              try {
                // Add 60-100 calls spread across last 30 days
                const totalCalls = Math.floor(Math.random() * 41) + 60; // 60-100 calls
                
                for (let i = 0; i < totalCalls; i++) {
                  const randomDay = Math.floor(Math.random() * 30); // 0-29 days ago
                  const randomOutcome = Math.random();
                  
                  if (randomOutcome < 0.6) {
                    // 60% answered
                    const outcomeType = Math.random();
                    if (outcomeType < 0.3) {
                      await addCall('answered', 'appointment_booked', randomDay);
                    } else if (outcomeType < 0.7) {
                      await addCall('answered', 'not_interested', randomDay);
                    } else {
                      await addCall('answered', 'callback_later', randomDay);
                    }
                  } else {
                    // 40% not answered
                    const missedType = ['no_answer', 'busy', 'voicemail'][Math.floor(Math.random() * 3)];
                    await addCall(missedType, null, randomDay);
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                setMessage(`✅ Added ${totalCalls} calls across 30 days!`);
                setTimeout(() => router.refresh(), 1500);
              } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            variant="outline"
            className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/20"
          >
            ⚡ Add 30 Days Call Data
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              setMessage('⏳ Adding revenue for last 30 days...');
              
              try {
                // Generate realistic monthly revenue ($30k-$40k total)
                const targetRevenue = Math.floor(Math.random() * 10000) + 30000; // $30k-$40k
                const revenueDays = Math.floor(Math.random() * 6) + 8; // 8-13 days with revenue
                const revenuePerDay = targetRevenue / revenueDays;
                
                const revenueOnDays = new Set();
                
                // Pick random days for revenue
                while (revenueOnDays.size < revenueDays) {
                  const randomDay = Math.floor(Math.random() * 30);
                  revenueOnDays.add(randomDay);
                }
                
                // Add ALL 30 days with AI costs, but only some have revenue
                for (let day = 0; day < 30; day++) {
                  const hasRevenue = revenueOnDays.has(day);
                  const revenue = hasRevenue 
                    ? Math.floor(revenuePerDay + (Math.random() * 1000 - 500)) // Vary slightly
                    : 0;
                  
                  await addRevenue(day, revenue);
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                setMessage(`✅ Added 30 days: ~$${Math.floor(targetRevenue / 1000)}k revenue, daily AI costs!`);
                setTimeout(() => router.refresh(), 1500);
              } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            variant="outline"
            className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/20"
          >
            ⚡ Add Last Month Revenue
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 rounded-lg p-6 border border-red-500/30">
        <h3 className="text-lg font-bold text-red-400 mb-4">⚠️ Danger Zone</h3>
        <Button
          onClick={clearAllData}
          disabled={loading}
          variant="outline"
          className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
        >
          🗑️ Clear All Test Data
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.includes('Error')
            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
            : 'bg-green-500/20 text-green-300 border border-green-500/30'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

