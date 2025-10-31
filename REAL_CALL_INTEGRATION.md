# Real Call Integration with Balance & AI Cost Tracking

## Overview
The call balance system is now fully integrated with your real call flow! When N8N sends call completions, the system automatically:
1. ✅ Deducts balance based on call duration
2. ✅ Checks for auto-refill and charges if needed
3. ✅ Updates AI costs on the revenue graph in the dashboard

## How It Works

### Flow Diagram
```
N8N Call Completion
        ↓
/api/calls/update (receives call data with duration)
        ↓
1. Insert call into database
        ↓
2. Calculate cost ($0.10/minute)
        ↓
3. Call /api/balance/deduct
        ↓
        ├──→ Deduct balance
        ├──→ Check if balance < $10
        ├──→ If yes + auto_refill_enabled:
        │        ├──→ Get payment method
        │        ├──→ Charge via Stripe
        │        └──→ Add $50/$100/$200 to balance
        └──→ Record transaction
        ↓
4. Update revenue_tracking
        ├──→ Add to ai_daily_cost
        └──→ Update graph data
        ↓
5. Return success to N8N
```

## API Endpoints

### `/api/calls/update` (Main Webhook from N8N)

**Purpose**: Receives call completion data from N8N and processes it.

**Request from N8N:**
```json
{
  "userId": "user-uuid-here",
  "contactName": "John Doe",
  "contactPhone": "555-1234",
  "pickedUp": true,
  "outcome": "booked",
  "duration": 145,
  "recordingUrl": "https://..."
}
```

**What It Does:**
1. Saves call to `calls` table
2. **NEW**: Deducts balance (if duration > 0)
3. **NEW**: Updates AI costs in `revenue_tracking`
4. Links appointments (if booked)

**Balance Deduction Logic:**
```javascript
if (duration && duration > 0) {
  const durationMinutes = duration / 60;
  // Calls /api/balance/deduct internally
  // Cost = durationMinutes * $0.10
}
```

**AI Cost Tracking:**
```javascript
const callCost = (duration / 60) * 0.10;
// Adds to revenue_tracking.ai_daily_cost for today
```

### `/api/balance/deduct` (Internal or Test)

**Purpose**: Deducts balance and handles auto-refill.

**Two Usage Modes:**

**1. Internal (from N8N via `/api/calls/update`):**
```json
{
  "callId": "call-uuid",
  "durationMinutes": 2.42,
  "userId": "user-uuid"  ← Bypasses auth
}
```

**2. Manual Test (from Settings → Testing):**
```json
{
  "callId": "test-123",
  "durationMinutes": 5
}
```
Uses session auth instead of userId parameter.

**Response (Normal):**
```json
{
  "success": true,
  "balance": 45.58,
  "callCost": 0.50,
  "autoRefilled": false
}
```

**Response (Auto-Refill Triggered):**
```json
{
  "success": true,
  "balance": 95.58,
  "callCost": 10.00,
  "autoRefilled": true,
  "refillAmount": 50
}
```

## Database Updates

### 1. `call_balance` Table
```sql
-- Balance is updated immediately after each call
UPDATE call_balance 
SET balance = balance - (duration_minutes * 0.10)
WHERE user_id = '...';
```

### 2. `balance_transactions` Table
```sql
-- Every deduction is recorded
INSERT INTO balance_transactions (
  user_id,
  amount,           -- Negative for deduction
  transaction_type, -- 'deduction' or 'auto_refill'
  description,
  balance_after
) VALUES (...);
```

### 3. `revenue_tracking` Table
```sql
-- AI costs accumulate daily
UPDATE revenue_tracking 
SET ai_daily_cost = ai_daily_cost + (duration_minutes * 0.10)
WHERE user_id = '...' AND date = CURRENT_DATE;

-- Or create new record if first call of the day
INSERT INTO revenue_tracking (
  user_id,
  date,
  revenue,
  ai_retainer_cost,  -- $33 base
  ai_daily_cost      -- Per-minute costs
) VALUES (...);
```

## Auto-Refill System

### Trigger Conditions
```javascript
if (balance < $10 && auto_refill_enabled) {
  // Trigger auto-refill
}
```

### Refill Amounts by Tier
- **Starter/Pro**: $50 or $100
- **Elite**: $100 or $200

### Payment Process
1. Check `call_balance.auto_refill_enabled`
2. If `true`, get user's `stripe_customer_id`
3. Retrieve saved payment method from Stripe
4. Create PaymentIntent with `off_session: true`
5. Charge automatically (no user interaction)
6. Update balance immediately
7. Record in `balance_transactions`

### Auto-Refill Logs
Watch for these in your terminal:
```
💰 Processing balance deduction: 145s = 2.42 minutes
📊 Current balance: $12.00, Cost: $0.24, New balance: $11.76
✅ Balance deducted: $0.24 | New balance: $11.76

// Later call that triggers refill:
💰 Processing balance deduction: 600s = 10.00 minutes
📊 Current balance: $11.76, Cost: $1.00, New balance: $10.76

// Next call drops below $10:
💰 Processing balance deduction: 120s = 2.00 minutes
📊 Current balance: $10.76, Cost: $0.20, New balance: $10.56

// Eventually:
📊 Current balance: $8.50, Cost: $5.00, New balance: $3.50
🔄 Balance below $10, triggering auto-refill...
💳 Creating auto-refill charge for $50...
✅ Auto-refill payment created: pi_xxxxx
✅ Auto-refill complete. New balance: $53.50
🔄 AUTO-REFILL TRIGGERED: +$50
```

## Revenue Graph Integration

### How AI Costs Appear
The revenue graph on your main dashboard now shows:
- **Daily AI Costs**: Accumulated per-minute charges
- **Retainer Cost**: $33/day base (if tracked)
- **Total Daily AI Spending**: Retainer + per-minute costs

### Calculation Example
```
Day 1:
- 50 calls, avg 3 minutes each = 150 minutes
- Cost: 150 * $0.10 = $15.00
- Plus retainer: $33.00
- Total AI cost: $48.00

Day 2:
- 100 calls, avg 2.5 minutes each = 250 minutes  
- Cost: 250 * $0.10 = $25.00
- Plus retainer: $33.00
- Total AI cost: $58.00
```

### Graph Updates
- **Real-time**: Updates immediately after each call
- **Cumulative**: Daily costs accumulate throughout the day
- **Historical**: Past days show total costs

## Testing

### 1. Test with Simulation Button
```bash
# Go to Settings → Testing
Click "Simulate 5-Min Call ($0.50)"

# Check terminal for:
💰 [Authenticated] Deducting balance for user ...
💰 Processing call test-xxx: 5.00 minutes
📊 Current balance: $50.00, Cost: $0.50, New balance: $49.50
✅ Balance deducted: $0.50 | New balance: $49.50
```

### 2. Test with Real N8N Call
```bash
# N8N sends POST to /api/calls/update with:
{
  "userId": "your-user-id",
  "contactName": "Test User",
  "pickedUp": true,
  "duration": 180,  // 3 minutes
  "outcome": "booked"
}

# Should see in terminal:
✅ Call saved to database
💰 Processing balance deduction: 180s = 3.00 minutes
✅ Balance deducted: $0.30 | New balance: $X.XX
📊 Updating AI costs for 2025-10-27: +$0.30
✅ AI costs updated: $5.20 → $5.50
```

### 3. Test Auto-Refill
```sql
-- Set balance low
UPDATE call_balance SET balance = 12.00 WHERE user_id = 'YOUR_ID';
```

Then simulate a 100-minute call:
```bash
Click "Simulate 100-Min Call ($10)"

# Should trigger auto-refill:
🔄 Balance below $10, triggering auto-refill...
💳 Creating auto-refill charge for $50...
✅ Auto-refill complete. New balance: $52.00
```

## N8N Integration

### What N8N Needs to Send
```javascript
// After each call completes in N8N workflow:
fetch('https://your-domain.com/api/calls/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: userIdFromWorkflow,
    contactName: leadName,
    contactPhone: leadPhone,
    pickedUp: callWasAnswered,  // true/false
    outcome: appointmentBooked ? 'booked' : 'not_interested',
    duration: callDurationSeconds,  // IMPORTANT!
    recordingUrl: recordingUrl || null
  })
});
```

### Duration Field is Critical
- **Must be in seconds**
- **Must be a number** (not string)
- Examples:
  - 30 seconds = `30`
  - 2.5 minutes = `150`
  - 5 minutes = `300`

## Monitoring

### Check Balance in Real-Time
```sql
SELECT 
  balance,
  auto_refill_enabled,
  auto_refill_amount,
  updated_at
FROM call_balance
WHERE user_id = 'YOUR_ID';
```

### View Transaction History
```sql
SELECT 
  created_at,
  transaction_type,
  amount,
  description,
  balance_after
FROM balance_transactions
WHERE user_id = 'YOUR_ID'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Daily AI Costs
```sql
SELECT 
  date,
  ai_retainer_cost,
  ai_daily_cost,
  (ai_retainer_cost + ai_daily_cost) as total_ai_cost
FROM revenue_tracking
WHERE user_id = 'YOUR_ID'
ORDER BY date DESC
LIMIT 30;
```

## Error Handling

### Balance Deduction Fails
- Call is still recorded ✅
- Error is logged but doesn't fail N8N webhook
- User can manually resolve balance issues

### Auto-Refill Fails
- Balance deduction still happens ✅
- Error reason returned in response
- Common issues:
  - No payment method: "No payment method found"
  - Card declined: "Your card was declined"
  - Customer not found: "Customer not found"

### Revenue Tracking Fails
- Call and balance still process ✅
- Error logged but non-fatal
- Graph may temporarily show incorrect data until next successful update

## Production Checklist

Before going live:
- [ ] Test with real N8N workflow
- [ ] Verify duration is sent in seconds
- [ ] Test auto-refill with real Stripe payment
- [ ] Confirm graph updates after calls
- [ ] Set up balance low alerts
- [ ] Monitor auto-refill success rate
- [ ] Add email notifications for failed auto-refills
- [ ] Set up daily cost reports
- [ ] Test with multiple users
- [ ] Verify RLS policies protect data

## Troubleshooting

### "Balance not deducting"
1. Check if duration is sent: `console.log` in `/api/calls/update`
2. Verify duration is a number, not string
3. Check call_balance table exists
4. Verify user has a balance record

### "Auto-refill not working"
1. Check `auto_refill_enabled` is `true`
2. Verify user has `stripe_customer_id` in profiles
3. Check payment method is saved in Stripe
4. Look for auto-refill errors in terminal logs

### "Graph not updating"
1. Verify `revenue_tracking` table exists
2. Check if record exists for today's date
3. Look for SQL errors in terminal
4. Refresh dashboard page

## Next Steps

Optional enhancements:
1. **Email notifications** when auto-refill occurs
2. **Balance alerts** when below threshold
3. **Usage reports** sent weekly
4. **Cost analytics** dashboard
5. **Refill history** UI component
6. **Bulk refill** options for high-volume users
7. **Retry logic** for failed auto-refills
8. **Rate limiting** to prevent abuse

---

🎉 **Your call balance system is now live!** Every real call will automatically deduct balance, trigger refills, and update your revenue graph!

