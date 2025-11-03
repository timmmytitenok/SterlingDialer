# Testing Pending Setup After Upgrade

## Quick SQL Check

Run this to see if pending_setup was actually set:

```sql
SELECT 
  user_id,
  email,
  subscription_tier,
  ai_setup_status,
  setup_requested_at,
  cost_per_minute
FROM profiles
WHERE email = 'your-test-email@example.com';
```

## If ai_setup_status is NOT 'pending_setup':

The webhook might not have fired. Check Stripe webhook logs:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Look for recent `customer.subscription.updated` events
4. Check if they succeeded or failed

## Manual Fix (if webhook didn't fire):

```sql
UPDATE profiles
SET 
  ai_setup_status = 'pending_setup',
  setup_requested_at = NOW(),
  setup_completed_at = NULL
WHERE email = 'your-test-email@example.com';
```

## Test Again:

1. Upgrade from one tier to another (e.g., Starter → Pro)
2. Wait 5 seconds
3. Run the SELECT query above
4. Should see: ai_setup_status = 'pending_setup'
