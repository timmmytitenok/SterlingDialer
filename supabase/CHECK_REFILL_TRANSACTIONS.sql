-- Check all balance transactions with Stripe payment IDs
-- This shows what the revenue API should be seeing

SELECT 
  id,
  user_id,
  type,
  amount,
  description,
  stripe_payment_intent_id,
  created_at
FROM balance_transactions
WHERE stripe_payment_intent_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Summary by type
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total_revenue
FROM balance_transactions
WHERE stripe_payment_intent_id IS NOT NULL
GROUP BY type
ORDER BY count DESC;

