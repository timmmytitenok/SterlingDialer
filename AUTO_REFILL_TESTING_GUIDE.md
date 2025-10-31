# Auto-Refill Testing Guide

## Overview
This guide explains how to test the auto-refill functionality for the call balance system.

## How Auto-Refill Works

1. **Trigger Condition**: When balance drops below $10
2. **Auto-Refill Amount**: User chooses $50 or $100 (configurable in UI)
3. **Payment**: Automatically charges the user's saved payment method
4. **Cost**: $0.10 per minute of call time

## Testing Methods

### Method 1: Using the Test Script (Recommended)

```bash
# Make sure you're logged in to the dashboard first
./test-auto-refill.sh

# Or specify a custom URL
./test-auto-refill.sh http://localhost:3000
```

The script will:
- Simulate a call completion
- Deduct balance based on call duration
- Trigger auto-refill if balance < $10
- Show you the results

**Test Scenarios:**
- **Option 1**: Small call (1 min = $0.10) - Won't trigger refill
- **Option 2**: Large call (100 min = $10) - May trigger refill
- **Option 3**: Custom amount

### Method 2: Manual API Testing with cURL

```bash
curl -X POST http://localhost:3000/api/balance/deduct \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-123",
    "durationMinutes": 100
  }'
```

**Response Example (Auto-Refill Triggered):**
```json
{
  "success": true,
  "balance": 65.50,
  "callCost": 10.00,
  "autoRefilled": true,
  "refillAmount": 50
}
```

**Response Example (No Auto-Refill):**
```json
{
  "success": true,
  "balance": 45.50,
  "callCost": 5.00,
  "autoRefilled": false
}
```

### Method 3: Database Manipulation

For quick testing, you can manually set a low balance:

```sql
-- Set your balance to $9 to test auto-refill
UPDATE call_balance 
SET balance = 9.00 
WHERE user_id = 'YOUR_USER_ID';

-- Then simulate a $1 call (10 minutes)
```

Then use Method 1 or 2 to simulate a call.

## Testing Checklist

### Before Testing

- [ ] Make sure you have a subscription (or at least a Stripe customer created)
- [ ] Add a test payment method in Stripe (use test card: 4242 4242 4242 4242)
- [ ] Enable auto-refill in the UI (Settings → Billing → Call Balance tab)
- [ ] Set your preferred refill amount ($50 or $100)
- [ ] Note your current balance

### During Testing

- [ ] Run test script or API call
- [ ] Check terminal/console for logs
- [ ] Verify balance deduction happened
- [ ] Confirm if auto-refill triggered (when balance < $10)

### After Testing

- [ ] Check dashboard balance at `/dashboard/settings/billing` (Call Balance tab)
- [ ] Review transaction history in the UI
- [ ] Check Stripe Dashboard → Payments for auto-refill charges
- [ ] Verify balance is correct

## Expected Behavior

### When Balance is Above $10
```
Initial Balance: $25.00
Call Cost: $5.00 (50 minutes)
Final Balance: $20.00
Auto-Refill: ❌ Not triggered
```

### When Balance Drops Below $10
```
Initial Balance: $15.00
Call Cost: $10.00 (100 minutes)
Balance After Call: $5.00 ← Below $10!
Auto-Refill: ✅ Triggered (+$50)
Final Balance: $55.00
```

### When Auto-Refill is Disabled
```
Initial Balance: $15.00
Call Cost: $10.00 (100 minutes)
Final Balance: $5.00
Auto-Refill: ❌ Disabled by user
```

## Common Test Scenarios

### Scenario 1: First Time Testing (Good Balance)
```bash
# Set balance to $50
./test-auto-refill.sh
# Choose option 1 (1 minute call)
# Expected: Balance = $49.90, No auto-refill
```

### Scenario 2: Testing Auto-Refill Trigger
```bash
# Manually set balance to $12 in database
# Then run:
./test-auto-refill.sh
# Choose option 2 (100 minutes = $10)
# Expected: Balance drops to $2, then auto-refills to $52
```

### Scenario 3: Multiple Small Calls
```bash
# Run multiple times to gradually reduce balance
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/balance/deduct \
    -H "Content-Type: application/json" \
    -d '{"callId": "test-'$i'", "durationMinutes": 1}'
  sleep 1
done
# Watch balance decrease by $0.10 each time
# Auto-refill should trigger when it hits $9.90, $9.80, etc.
```

## Troubleshooting

### Auto-Refill Not Triggering

**Check 1: Is auto-refill enabled?**
```sql
SELECT auto_refill_enabled, balance FROM call_balance WHERE user_id = 'YOUR_USER_ID';
```

**Check 2: Is there a payment method saved?**
```sql
SELECT stripe_customer_id FROM profiles WHERE user_id = 'YOUR_USER_ID';
```
Then check Stripe Dashboard → Customers → Payment Methods

**Check 3: Check the logs**
Look for these in your terminal:
```
💰 Deducting balance for call...
📊 Current balance: $X, New balance: $Y
🔄 Balance below $10, triggering auto-refill...
💳 Creating auto-refill charge...
✅ Auto-refill complete. New balance: $Z
```

### Payment Failed

If you see:
```json
{
  "success": true,
  "balance": 5.00,
  "autoRefillError": "Your card was declined"
}
```

**Solutions:**
1. Use Stripe test card: `4242 4242 4242 4242`
2. Ensure test mode is enabled in Stripe
3. Check Stripe Dashboard for more error details

### Balance Not Updating

1. Refresh the browser page
2. Check browser console for errors
3. Verify API endpoint returned success
4. Check database directly:
   ```sql
   SELECT * FROM balance_transactions ORDER BY created_at DESC LIMIT 10;
   ```

## Monitoring Auto-Refill in Production

### Database Queries

**View all auto-refill transactions:**
```sql
SELECT 
  user_id,
  amount,
  description,
  balance_after,
  created_at
FROM balance_transactions
WHERE transaction_type = 'auto_refill'
ORDER BY created_at DESC;
```

**Check users with low balance:**
```sql
SELECT 
  cb.user_id,
  p.full_name,
  cb.balance,
  cb.auto_refill_enabled,
  cb.auto_refill_amount
FROM call_balance cb
JOIN profiles p ON p.user_id = cb.user_id
WHERE cb.balance < 10
ORDER BY cb.balance ASC;
```

### Stripe Dashboard

1. Go to Stripe Dashboard → Payments
2. Filter by description: "Auto-refill"
3. Check metadata for `type: auto_refill`

## Next Steps

After confirming auto-refill works:

1. **Integrate with N8N**: Add balance deduction when calls complete
2. **Add Notifications**: Email user when auto-refill occurs
3. **Set Limits**: Add daily/monthly auto-refill limits
4. **Error Handling**: Retry failed auto-refills
5. **Monitoring**: Set up alerts for failed auto-refills

## Security Notes

- Auto-refill uses Stripe's `off_session` payments
- Payment is confirmed automatically without user interaction
- Only works with saved payment methods
- User must explicitly enable auto-refill
- Can be disabled anytime in settings

## Testing with Stripe Test Cards

| Card Number | Scenario |
|------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 9987 | Lost card |

Use these to test different payment scenarios!

