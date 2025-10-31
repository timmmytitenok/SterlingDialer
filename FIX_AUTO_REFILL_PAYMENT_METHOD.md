# Auto-Refill Payment Method Fix

## What Was Fixed

The auto-refill was failing with the error:
```
"You cannot confirm this PaymentIntent because it's missing a payment method"
```

### Root Cause
When creating a PaymentIntent for auto-refill, the code wasn't explicitly specifying which payment method to use. Stripe requires this for off-session payments.

### Changes Made

1. **Updated `/app/api/balance/deduct/route.ts`**:
   - Now retrieves the customer's payment methods from Stripe
   - Checks for default payment method in `invoice_settings`
   - Falls back to first available payment method if no default
   - Explicitly passes `payment_method` to PaymentIntent creation

2. **Updated `/app/api/stripe/webhook/route.ts`**:
   - Added code to set the subscription's payment method as default
   - This happens automatically on `checkout.session.completed`
   - Ensures future auto-refills work seamlessly

## How to Test Auto-Refill Now

### For New Subscriptions (After This Fix)
When users subscribe now, their payment method will automatically be set as default and auto-refill will work immediately.

### For Existing Test Subscriptions (Before This Fix)
You need to manually set a default payment method in Stripe:

**Option 1: Via Stripe Dashboard (Easiest)**
1. Go to Stripe Dashboard → Customers
2. Find your test customer
3. Click on the customer
4. Scroll to "Payment methods"
5. If a card is listed, click "Set as default for invoices"
6. Done! Auto-refill will now work

**Option 2: Via Stripe CLI**
```bash
# List customer's payment methods
stripe payment_methods list --customer cus_XXXX

# Set a payment method as default
stripe customers update cus_XXXX \
  --invoice-settings[default_payment_method]=pm_XXXX
```

**Option 3: Do a Fresh Test Subscription**
1. Remove your current test subscription
2. Go to Settings → Billing
3. Subscribe to a plan again
4. The payment method will be set automatically

## Testing Steps

1. **Ensure you have a subscription** with a payment method
2. **Enable auto-refill**: Settings → Billing → Call Balance tab
3. **Set balance low** (optional, for faster testing):
   ```sql
   UPDATE call_balance SET balance = 12.00 WHERE user_id = 'YOUR_USER_ID';
   ```
4. **Test auto-refill**: Settings → Testing → "Simulate 100-Min Call"
5. **Expected result**: 
   ```
   🎉 Call completed! Cost: $10.00 | Balance: $52.00 | 🔄 Auto-refilled: $50!
   ```

## Error Messages Explained

### ✅ "No payment method found"
```json
{
  "success": true,
  "balance": 5.00,
  "autoRefillError": "No payment method found. Please add a payment method in billing settings."
}
```
**Solution**: Add a payment method via Stripe Checkout or set one as default in Stripe Dashboard.

### ✅ "Customer not found"
```json
{
  "success": true,
  "balance": 5.00,
  "autoRefillError": "Customer not found"
}
```
**Solution**: User doesn't have a `stripe_customer_id` in their profile. They need to complete a checkout session first.

### ✅ "Your card was declined"
```json
{
  "success": true,
  "balance": 5.00,
  "autoRefillError": "Your card was declined"
}
```
**Solution**: 
- Use test card: `4242 4242 4242 4242`
- Or check Stripe Dashboard for the actual decline reason

## Production Checklist

Before going live, ensure:

- [ ] Stripe is in live mode (not test mode)
- [ ] All subscriptions go through Stripe Checkout (this sets payment methods automatically)
- [ ] Users are prompted to add payment method if missing
- [ ] Email notifications are sent when auto-refill succeeds/fails
- [ ] Failed auto-refills are retried with exponential backoff
- [ ] Users are notified when auto-refill fails multiple times

## Advanced: Manual Payment Method Setup

If you need to manually attach a payment method to a customer:

```javascript
// Attach payment method to customer
await stripe.paymentMethods.attach('pm_xxx', {
  customer: 'cus_xxx',
});

// Set as default
await stripe.customers.update('cus_xxx', {
  invoice_settings: {
    default_payment_method: 'pm_xxx',
  },
});
```

## Monitoring Auto-Refills

Check auto-refill transactions in database:
```sql
SELECT 
  bt.created_at,
  bt.amount,
  bt.description,
  bt.balance_after,
  bt.stripe_payment_intent_id,
  p.full_name,
  p.stripe_customer_id
FROM balance_transactions bt
JOIN profiles p ON p.user_id = bt.user_id
WHERE bt.transaction_type = 'auto_refill'
ORDER BY bt.created_at DESC;
```

Check in Stripe Dashboard:
1. Go to Payments
2. Filter by metadata: `type = auto_refill`
3. Review success/failure rates

## Next Steps

The auto-refill system is now fixed! To complete the integration:

1. **Add to N8N**: When a call completes, call `/api/balance/deduct` with the call duration
2. **Email notifications**: Send email when auto-refill occurs
3. **Low balance alerts**: Warn users when balance is low and auto-refill is disabled
4. **Retry logic**: Implement retries for failed auto-refills

## Support

If you still encounter issues:
1. Check terminal logs for detailed error messages
2. Verify Stripe Dashboard → Customers → [Your Customer] → Payment Methods
3. Test with a fresh subscription
4. Ensure you're using test mode and test cards

