-- Clear ALL stripe customer IDs to start fresh
UPDATE profiles 
SET stripe_customer_id = NULL;

-- Also clear any old subscriptions from failed attempts
DELETE FROM subscriptions 
WHERE status != 'active';

-- Show current state
SELECT 
  user_id, 
  email,
  stripe_customer_id 
FROM profiles 
LIMIT 5;

SELECT COUNT(*) as active_subscriptions FROM subscriptions WHERE status = 'active';
