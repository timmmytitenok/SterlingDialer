import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Demo user ID
const DEMO_USER_ID = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary', 'William', 'Patricia', 'Richard', 'Linda', 'Charles', 'Barbara', 'Joseph', 'Elizabeth', 'Thomas', 'Jennifer'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const OUTCOMES = ['not_interested', 'callback_later', 'appointment_booked', 'live_transfer'];

export async function POST() {
  try {
    console.log('🎭 Demo Data Refresh: Starting...');

    // Check which days are missing in revenue_tracking
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get existing revenue tracking records
    const { data: existingRevenue } = await supabaseAdmin
      .from('revenue_tracking')
      .select('date')
      .eq('user_id', DEMO_USER_ID)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const existingDates = new Set(existingRevenue?.map(r => r.date) || []);
    console.log(`📅 Found ${existingDates.size} existing revenue records`);

    // Determine which weekday is the "half day" this week (random 1-5)
    const halfDayWeekday = randomInt(1, 5);
    let insertedDays = 0;

    // Fill in missing days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Skip if already exists
      if (existingDates.has(dateStr)) continue;

      // Determine activity level
      let actualCalls = 0;
      let isHalfDay = false;

      if (dayOfWeek === 0) {
        // SUNDAY: No activity
        actualCalls = 0;
      } else if (dayOfWeek === 6) {
        // SATURDAY: Half activity
        actualCalls = randomInt(100, 150);
        isHalfDay = true;
      } else if (dayOfWeek === halfDayWeekday) {
        // Random half-day weekday
        actualCalls = randomInt(100, 150);
        isHalfDay = true;
      } else {
        // Normal weekday: Full activity (200-300 calls)
        actualCalls = randomInt(200, 300);
      }

      if (actualCalls > 0) {
        const connectedCalls = Math.floor(actualCalls * 0.54);
        let bookedCount = randomInt(0, 4);
        let callbackCount = randomInt(1, 7);
        let transferCount = randomInt(1, 2);
        let notInterestedCount = connectedCalls - bookedCount - callbackCount - transferCount;
        if (notInterestedCount < 0) notInterestedCount = 0;

        if (isHalfDay) {
          bookedCount = Math.floor(bookedCount / 2);
          callbackCount = Math.floor(callbackCount / 2);
          transferCount = Math.floor(transferCount / 2);
          notInterestedCount = Math.floor(notInterestedCount / 2);
        }

        // Generate some call records for this day (sample)
        const callsToInsert = [];
        const sampleSize = Math.min(connectedCalls, 30);
        
        for (let j = 0; j < sampleSize; j++) {
          const callTime = new Date(date);
          callTime.setHours(8 + randomInt(0, 10), randomInt(0, 59), 0);
          
          callsToInsert.push({
            user_id: DEMO_USER_ID,
            disposition: 'answered',
            outcome: randomChoice(OUTCOMES),
            connected: true,
            contact_name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
            contact_phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
            duration: (1 + Math.random() * 5).toFixed(2),
            recording_url: `https://example.com/recording-${Date.now()}-${j}`,
            created_at: callTime.toISOString(),
            cost: 0.03 + Math.random() * 0.05,
          });
        }

        // Add some no-answer calls
        const noAnswerCount = Math.min(actualCalls - connectedCalls, 20);
        for (let j = 0; j < noAnswerCount; j++) {
          const callTime = new Date(date);
          callTime.setHours(8 + randomInt(0, 10), randomInt(0, 59), 0);
          
          callsToInsert.push({
            user_id: DEMO_USER_ID,
            disposition: 'no_answer',
            connected: false,
            contact_name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
            contact_phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
            duration: 0.1,
            created_at: callTime.toISOString(),
            cost: 0.01,
          });
        }

        if (callsToInsert.length > 0) {
          await supabaseAdmin.from('calls').insert(callsToInsert);
        }

        // Generate appointments for this day
        for (let j = 0; j < bookedCount; j++) {
          const aptTime = new Date(date);
          aptTime.setDate(aptTime.getDate() + randomInt(1, 5));
          aptTime.setHours(9 + randomInt(0, 8), 0, 0);

          await supabaseAdmin.from('appointments').insert({
            user_id: DEMO_USER_ID,
            scheduled_at: aptTime.toISOString(),
            prospect_name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
            prospect_phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
            prospect_age: randomInt(60, 75),
            prospect_state: randomChoice(['CA', 'TX', 'FL', 'NY', 'PA']),
            status: Math.random() < 0.7 ? 'scheduled' : (Math.random() < 0.8 ? 'completed' : 'no_show'),
            is_sold: Math.random() < 0.3,
            is_no_show: false,
            created_at: date.toISOString(),
          });
        }

        // Calculate revenue for the day
        const dailyCost = 6 + Math.random() * 7;
        const dailyRevenue = Math.random() < 0.4 ? randomInt(2000, 4500) : 0;

        // Insert revenue tracking
        await supabaseAdmin.from('revenue_tracking').insert({
          user_id: DEMO_USER_ID,
          date: dateStr,
          revenue: isHalfDay ? dailyRevenue * 0.5 : dailyRevenue,
          ai_retainer_cost: 29.97,
          ai_daily_cost: isHalfDay ? dailyCost / 2 : dailyCost,
          total_calls: actualCalls,
          callbacks: callbackCount,
          not_interested: notInterestedCount,
          live_transfers: transferCount,
          appointments_booked: bookedCount,
          policies_sold: dailyRevenue > 0 ? 1 : 0,
        });
      } else {
        // Sunday - insert empty record
        await supabaseAdmin.from('revenue_tracking').insert({
          user_id: DEMO_USER_ID,
          date: dateStr,
          revenue: 0,
          ai_retainer_cost: 0,
          ai_daily_cost: 0,
          total_calls: 0,
          callbacks: 0,
          not_interested: 0,
          live_transfers: 0,
          appointments_booked: 0,
          policies_sold: 0,
        });
      }

      insertedDays++;
    }

    console.log(`✅ Demo Data Refresh: Inserted ${insertedDays} new days of data`);

    // Check lead count and add more if needed
    const { count: leadCount } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', DEMO_USER_ID);

    const targetLeads = 4792;
    const currentLeads = leadCount || 0;

    if (currentLeads < targetLeads) {
      const leadsToAdd = targetLeads - currentLeads;
      console.log(`📊 Adding ${leadsToAdd} leads to reach target of ${targetLeads}`);

      const LEAD_TYPES = ['turning_65', 'turning_66', 'aca', 'final_expense', 'medicare_advantage'];
      const STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
      
      // Insert in batches
      const batchSize = 500;
      for (let batch = 0; batch < Math.ceil(leadsToAdd / batchSize); batch++) {
        const leads = [];
        const count = Math.min(batchSize, leadsToAdd - batch * batchSize);
        
        for (let i = 0; i < count; i++) {
          const firstName = randomChoice(FIRST_NAMES);
          const lastName = randomChoice(LAST_NAMES);
          
          // Status distribution: 20% dead
          const rand = Math.random();
          let status;
          if (rand < 0.20) status = 'new';
          else if (rand < 0.35) status = 'unclassified';
          else if (rand < 0.55) status = 'no_answer';
          else if (rand < 0.67) status = 'not_interested';
          else if (rand < 0.75) status = 'callback_later';
          else if (rand < 0.78) status = 'live_transfer';
          else if (rand < 0.80) status = 'appointment_booked';
          else status = 'dead_lead';

          const timesCalled = status === 'new' ? 0 : randomInt(1, 4);

          leads.push({
            user_id: DEMO_USER_ID,
            name: `${firstName} ${lastName}`,
            phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@email.com`,
            age: randomInt(55, 75),
            state: randomChoice(STATES),
            lead_type: randomChoice(LEAD_TYPES),
            status,
            times_dialed: timesCalled,
            created_at: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        await supabaseAdmin.from('leads').insert(leads);
      }

      console.log(`✅ Added ${leadsToAdd} leads`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Refreshed demo data. Added ${insertedDays} days and ensured ${targetLeads} leads.`,
      daysInserted: insertedDays,
      leadsTotal: targetLeads
    });
  } catch (error: any) {
    console.error('❌ Demo Data Refresh Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

