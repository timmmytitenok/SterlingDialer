# 🎉 New Dashboard Guide

## Overview

Your Life Insurance AI dashboard has been completely redesigned with a sleek, professional look featuring all the metrics you requested!

---

## 🎨 What's New

### **Single Page Dashboard**
Clean, focused design with everything on one page - no more navigation!

### **Key Features:**

#### 1. **Toggleable Stats Cards** (Top Section)
- **Total Dials**: Switch between Today / Last 7 Days / Last 30 Days
- **Booked Appointments**: Switch between Today / Last 7 Days / Last 30 Days
- Click the dropdown arrow to toggle between time periods

#### 2. **Revenue & Profit Chart** (Middle Section)
- **Green Area**: Revenue generated
- **Orange Area**: AI costs (retainer + daily running costs)
- **Blue Line**: Net profit (revenue - costs)
- Shows all-time totals at the top
- Monthly breakdown in the graph

#### 3. **Performance Stats** (Bottom Section)
Five key metrics in a row:
- 📊 **Total Calls**: All-time call count
- ✅ **Connected Rate**: Percentage of answered calls
- ❌ **Not Interested**: Count of prospects not interested
- ⏰ **Callback Later**: Follow-ups needed
- 🎯 **Appointments**: Successfully booked

---

## 📊 Database Setup

### Step 1: Run the New Schema

In your Supabase SQL Editor, run this file:
```
supabase/schema-v3-revenue.sql
```

This adds:
- ✅ `outcome` field to track call results
- ✅ `revenue` field to track income per call
- ✅ `connected` boolean for connection status
- ✅ `revenue_tracking` table for daily tracking
- ✅ `user_settings` table for cost configuration

### Step 2: Configure Your Costs

To track profit accurately, you need to set your AI costs:

```sql
-- In Supabase SQL Editor:
INSERT INTO user_settings (user_id, monthly_retainer, cost_per_call)
VALUES (
  'YOUR_USER_ID',  -- Get from auth.users table
  999.00,          -- Your monthly retainer (e.g., $999)
  0.50             -- Cost per call (e.g., $0.50)
);
```

---

## 🎯 How Data Works

### Call Outcomes
When a call is made, it can have one of these outcomes:
- `not_interested` - Prospect declined
- `callback_later` - Needs follow-up
- `appointment_booked` - Success!
- `other` - Other result

### Revenue Tracking
- Set revenue on individual calls
- Automatically aggregates to daily totals
- Calculates profit: Revenue - (Retainer + Call Costs)

### Connection Rate
- Calculated from calls where `disposition = 'answered'`
- Shows percentage of successfully connected calls

---

## 🧪 Testing with Sample Data

### Add Test Calls with Outcomes

```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Add test calls with various outcomes
INSERT INTO calls (user_id, disposition, outcome, connected, revenue, created_at) VALUES
  -- Successful appointments (3)
  ('YOUR_USER_ID', 'answered', 'appointment_booked', true, 500, NOW()),
  ('YOUR_USER_ID', 'answered', 'appointment_booked', true, 750, NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'answered', 'appointment_booked', true, 600, NOW() - INTERVAL '2 days'),
  
  -- Not interested (5)
  ('YOUR_USER_ID', 'answered', 'not_interested', true, 0, NOW()),
  ('YOUR_USER_ID', 'answered', 'not_interested', true, 0, NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'answered', 'not_interested', true, 0, NOW() - INTERVAL '3 days'),
  ('YOUR_USER_ID', 'answered', 'not_interested', true, 0, NOW() - INTERVAL '5 days'),
  ('YOUR_USER_ID', 'answered', 'not_interested', true, 0, NOW() - INTERVAL '7 days'),
  
  -- Callback later (3)
  ('YOUR_USER_ID', 'answered', 'callback_later', true, 0, NOW()),
  ('YOUR_USER_ID', 'answered', 'callback_later', true, 0, NOW() - INTERVAL '2 days'),
  ('YOUR_USER_ID', 'answered', 'callback_later', true, 0, NOW() - INTERVAL '4 days'),
  
  -- Not answered (10)
  ('YOUR_USER_ID', 'no_answer', NULL, false, 0, NOW()),
  ('YOUR_USER_ID', 'busy', NULL, false, 0, NOW()),
  ('YOUR_USER_ID', 'voicemail', NULL, false, 0, NOW()),
  ('YOUR_USER_ID', 'no_answer', NULL, false, 0, NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'busy', NULL, false, 0, NOW() - INTERVAL '2 days'),
  ('YOUR_USER_ID', 'voicemail', NULL, false, 0, NOW() - INTERVAL '3 days'),
  ('YOUR_USER_ID', 'no_answer', NULL, false, 0, NOW() - INTERVAL '5 days'),
  ('YOUR_USER_ID', 'busy', NULL, false, 0, NOW() - INTERVAL '6 days'),
  ('YOUR_USER_ID', 'voicemail', NULL, false, 0, NOW() - INTERVAL '8 days'),
  ('YOUR_USER_ID', 'no_answer', NULL, false, 0, NOW() - INTERVAL '10 days');
```

This gives you:
- 21 total calls
- 11 connected (52% connection rate)
- 3 appointments booked
- 5 not interested
- 3 callback later
- $1,850 in revenue

---

## 💰 Revenue Tracking

### Manual Entry (for testing)

```sql
-- Add revenue for specific dates
INSERT INTO revenue_tracking (user_id, date, revenue, ai_retainer_cost, ai_daily_cost) VALUES
  ('YOUR_USER_ID', CURRENT_DATE, 500, 33.30, 5.00),        -- Today
  ('YOUR_USER_ID', CURRENT_DATE - 1, 750, 33.30, 8.50),    -- Yesterday
  ('YOUR_USER_ID', CURRENT_DATE - 2, 600, 33.30, 6.00),    -- 2 days ago
  ('YOUR_USER_ID', CURRENT_DATE - 5, 1000, 33.30, 10.00),  -- 5 days ago
  ('YOUR_USER_ID', CURRENT_DATE - 10, 800, 33.30, 7.50);   -- 10 days ago
```

### Automatic Entry (via trigger)
Revenue is automatically tracked when you add `revenue` to a call:

```sql
UPDATE calls 
SET revenue = 500 
WHERE id = 'YOUR_CALL_ID';
```

---

## 🎨 Design Features

### Dark Theme
- Background: `#0B1437` (deep navy)
- Cards: `#1A2647` (lighter navy)
- Borders: Gray-800
- Professional color-coded metrics

### Responsive Design
- Mobile-friendly
- Cards stack on small screens
- Graph adjusts to screen size

### Interactive Elements
- Dropdown toggles for time periods
- Hover effects on all cards
- Smooth animations

---

## 🚀 Getting Started

1. **Run the schema:**
   ```sql
   -- In Supabase SQL Editor, run:
   supabase/schema-v3-revenue.sql
   ```

2. **Add your AI costs:**
   ```sql
   INSERT INTO user_settings (user_id, monthly_retainer, cost_per_call)
   VALUES ('YOUR_USER_ID', 999.00, 0.50);
   ```

3. **Add test data** (use SQL above)

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Visit the dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

---

## 📊 What You'll See

### With Test Data:
```
┌─────────────────────┬─────────────────────┐
│ Total Dials         │ Booked Appointments │
│ Today: 5            │ Today: 1            │
│ 7 Days: 15          │ 7 Days: 2           │
│ 30 Days: 21         │ 30 Days: 3          │
└─────────────────────┴─────────────────────┘

┌──────────────────────────────────────────┐
│ Revenue & Profit Chart                    │
│ Revenue: $3,650  Costs: $450  Profit: $3,200│
│ [Beautiful graph showing trends]          │
└──────────────────────────────────────────┘

┌─────┬─────┬─────┬─────┬─────┐
│ 21  │ 52% │  5  │  3  │  3  │
│Calls│Conn │ N/I │ CB  │Appt │
└─────┴─────┴─────┴─────┴─────┘
```

---

## 🎯 Real-World Usage

### When N8N Makes a Call

Your N8N workflow should send back:
```json
{
  "callId": "uuid",
  "disposition": "answered",
  "outcome": "appointment_booked",
  "revenue": 500.00
}
```

Then update via API:
```typescript
await supabase
  .from('calls')
  .update({
    disposition: 'answered',
    outcome: 'appointment_booked',
    connected: true,
    revenue: 500
  })
  .eq('id', callId);
```

---

## 🔧 Customization

### Change Colors
Edit the card components in:
- `components/toggle-stat-card.tsx`
- `components/revenue-profit-chart.tsx`

### Adjust Time Periods
Modify the dashboard page queries:
- `app/dashboard/page.tsx`

### Add More Metrics
Add new stats cards in the bottom grid section

---

## 💡 Pro Tips

1. **Use Real Revenue**: Update calls with actual revenue when deals close
2. **Track Costs Accurately**: Set your actual monthly retainer and per-call costs
3. **Review Daily**: Use the toggle cards to track daily performance
4. **Watch Profit**: The graph shows if your AI is profitable
5. **Follow Up**: Check "Callback Later" count regularly

---

## 🎉 You're All Set!

Your new dashboard is:
- ✅ Beautiful & professional
- ✅ Mobile responsive
- ✅ Tracking all key metrics
- ✅ Showing profit/loss
- ✅ Easy to use with toggles

**Enjoy your new dashboard!** 🚀

