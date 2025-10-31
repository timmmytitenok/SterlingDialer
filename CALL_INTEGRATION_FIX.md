# Call Integration Fix - Balance & Graph Updates

## What Was Broken

When you made a real call:
1. ❌ Balance didn't drop
2. ❌ Graph didn't update  
3. ❌ Base subscription cost wasn't showing on graph

## Root Causes

### Issue 1: Fetch Failed from Webhook
```javascript
// OLD (BROKEN):
fetch(`${request.headers.get('origin')}/api/balance/deduct`, ...)
// ↑ N8N webhooks don't have 'origin' header → fetch fails → balance not deducted
```

### Issue 2: Base Subscription Cost Missing
The graph was only showing per-minute charges, not the base subscription fee divided by 30 days.

## What I Fixed

### 1. Direct Balance Deduction (No HTTP Call)
Instead of calling `/api/balance/deduct` via fetch, I now do it directly in the webhook:

```javascript
// NEW (WORKING):
// Direct database update - no HTTP call needed
const cost = durationMinutes * 0.10;

await supabase
  .from('call_balance')
  .update({ balance: currentBalance - cost })
  .eq('user_id', userId);

await supabase
  .from('balance_transactions')
  .insert({ amount: -cost, ... });
```

**Benefits:**
- ✅ Works from N8N webhooks
- ✅ Faster (no HTTP overhead)
- ✅ More reliable (no network issues)

### 2. Base Subscription Cost Added to Graph

Now calculates daily base cost from subscription tier:

```javascript
// Get user's tier
const subscription = await supabase
  .from('subscriptions')
  .select('tier')
  .eq('user_id', userId)
  .single();

// Calculate daily base
let dailyBaseCost = 0;
switch (subscription.tier) {
  case 'starter':
    dailyBaseCost = 999 / 30;   // $33.30/day
    break;
  case 'pro':
    dailyBaseCost = 1299 / 30;  // $43.30/day
    break;
  case 'elite':
    dailyBaseCost = 1899 / 30;  // $63.30/day
    break;
}

// Save to revenue_tracking
await supabase
  .from('revenue_tracking')
  .insert({
    date: today,
    ai_retainer_cost: dailyBaseCost,  // Base cost
    ai_daily_cost: callCost,          // Per-minute charges
  });
```

## How It Works Now

### Example: Pro User Makes Calls

**Day 1:**
```
Subscription: Pro ($1,299/month)
Daily Base Cost: $1,299 ÷ 30 = $43.30

Call 1: 3 minutes → $0.30
Call 2: 5 minutes → $0.50
Call 3: 2 minutes → $0.20

Total for Day:
  Base: $43.30
  Calls: $1.00
  ─────────────
  Total: $44.30  ← Shows on graph!
```

### Terminal Output You'll See

When a call completes:
```
✅ Call saved to database: John Doe - answered → appointment_booked
💰 Processing balance deduction: 180s = 3.00 minutes
📊 Current balance: $50.00, Cost: $0.30, New balance: $49.70
✅ Balance deducted: $0.30 | New balance: $49.70
📊 Updating AI costs for 2025-10-27: +$0.3000
💰 Daily base cost (pro): $43.30
✅ AI costs updated: Base $43.30 + Variable $0.00 → $0.30
```

## Graph Display

The revenue graph now shows:
- **ai_retainer_cost**: Your subscription ÷ 30 (e.g., $43.30 for Pro)
- **ai_daily_cost**: Sum of all per-minute charges for the day
- **Total AI Cost**: ai_retainer_cost + ai_daily_cost

### Example Graph Data:
```
October 25: Base $43.30 + Calls $5.20 = $48.50 total
October 26: Base $43.30 + Calls $8.10 = $51.40 total
October 27: Base $43.30 + Calls $12.50 = $55.80 total
```

## Testing

### Test with Real Call
1. Make a call through N8N (or use test endpoint)
2. Check terminal for the logs above
3. Verify balance decreased: 
   ```sql
   SELECT balance FROM call_balance WHERE user_id = 'YOUR_ID';
   ```
4. Check transaction recorded:
   ```sql
   SELECT * FROM balance_transactions 
   WHERE user_id = 'YOUR_ID' 
   ORDER BY created_at DESC LIMIT 5;
   ```
5. Verify graph updated:
   ```sql
   SELECT * FROM revenue_tracking 
   WHERE user_id = 'YOUR_ID' 
   AND date = CURRENT_DATE;
   ```

### Quick SQL Checks

**Check today's costs:**
```sql
SELECT 
  date,
  ai_retainer_cost as "Base (Sub/30)",
  ai_daily_cost as "Call Costs",
  (ai_retainer_cost + ai_daily_cost) as "Total AI Cost"
FROM revenue_tracking
WHERE user_id = 'YOUR_USER_ID'
  AND date = CURRENT_DATE;
```

**Expected result for Pro user:**
```
date       | Base (Sub/30) | Call Costs | Total AI Cost
-----------+---------------+------------+--------------
2025-10-27 | 43.30         | 5.50       | 48.80
```

## Subscription Costs

| Tier    | Monthly Price | Daily Base (÷ 30) |
|---------|---------------|-------------------|
| Starter | $999          | $33.30            |
| Pro     | $1,299        | $43.30            |
| Elite   | $2,499        | $83.30            |

Plus per-minute charges: **$0.10/minute**

## What Happens on Each Call

```
1. N8N sends call data to /api/calls/update
        ↓
2. Save call to database ✅
        ↓
3. Calculate cost: duration ÷ 60 × $0.10
        ↓
4. Deduct from call_balance ✅
        ↓
5. Record in balance_transactions ✅
        ↓
6. Get user's subscription tier
        ↓
7. Calculate daily base: price ÷ 30
        ↓
8. Update revenue_tracking:
   - ai_retainer_cost = base cost
   - ai_daily_cost += call cost ✅
        ↓
9. Graph auto-updates! ✅
```

## Differences from Before

| Feature | Before | After |
|---------|--------|-------|
| Balance Deduction | ❌ Failed (fetch issue) | ✅ Works (direct DB) |
| Graph Update | ❌ Failed | ✅ Works |
| Base Cost | ❌ Not shown | ✅ Shows sub ÷ 30 |
| Call Costs | ❌ Not tracked | ✅ Accumulated daily |
| Auto-Refill | ❌ N/A (balance didn't deduct) | 🔄 Ready (logged for now) |

## Notes on Auto-Refill

For now, auto-refill is **logged but not executed automatically** from webhooks. This is intentional because:
- Stripe charges need proper error handling
- Should be in a background job/queue
- Webhooks should be fast and not block on payments

**Current behavior:**
```javascript
if (balance < 10 && auto_refill_enabled) {
  console.log('🔄 Balance below $10 - Auto-refill will be triggered by background job');
}
```

**To trigger auto-refill manually:**
Use the test button in Settings → Testing, which calls the full auto-refill flow.

## Monitoring

Watch your terminal when calls come in. You should see:
1. ✅ Call saved
2. 💰 Balance deduction with amounts
3. 📊 AI cost update with base + variable
4. ✅ Success confirmations

If you don't see these, check:
- Is `duration` being sent from N8N?
- Is it a number (not string)?
- Does user have a `call_balance` record?
- Does user have an active subscription?

---

🎉 **Everything is fixed!** Your next call should update balance and graph correctly!

