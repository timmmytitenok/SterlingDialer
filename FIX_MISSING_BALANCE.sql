-- FIX: Credit user braydenwurst100@gmail.com who paid $25 but didn't receive balance
-- Stripe Customer ID: cus_TZeD9pI9ceXZFj
-- Payment Date: Dec 11, 2025 at 3:27 AM

-- Step 1: Find the user
SELECT 
  p.user_id,
  p.stripe_customer_id,
  au.email,
  cb.balance as current_balance
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.user_id
LEFT JOIN call_balance cb ON cb.user_id = p.user_id
WHERE p.stripe_customer_id = 'cus_TZeD9pI9ceXZFj'
   OR au.email = 'braydenwurst100@gmail.com';

-- Step 2: Credit $25 to their call_balance (run this after confirming user_id from Step 1)
-- Replace 'USER_ID_HERE' with the actual user_id from Step 1

-- Option A: If they already have a call_balance record, update it:
UPDATE call_balance 
SET 
  balance = balance + 25,
  last_refill_at = NOW()
WHERE user_id = (
  SELECT p.user_id 
  FROM profiles p 
  WHERE p.stripe_customer_id = 'cus_TZeD9pI9ceXZFj'
);

-- Option B: If they DON'T have a call_balance record yet, insert one:
INSERT INTO call_balance (user_id, balance, auto_refill_enabled, auto_refill_amount, last_refill_at)
SELECT 
  p.user_id,
  25,
  true,
  25,
  NOW()
FROM profiles p
WHERE p.stripe_customer_id = 'cus_TZeD9pI9ceXZFj'
ON CONFLICT (user_id) 
DO UPDATE SET 
  balance = call_balance.balance + 25,
  last_refill_at = NOW();

-- Step 3: Verify the fix
SELECT 
  p.user_id,
  au.email,
  cb.balance as new_balance,
  cb.last_refill_at
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.user_id
LEFT JOIN call_balance cb ON cb.user_id = p.user_id
WHERE p.stripe_customer_id = 'cus_TZeD9pI9ceXZFj';

-- Step 4: Also log the transaction for revenue tracking
INSERT INTO balance_transactions (user_id, amount, type, description, balance_after)
SELECT 
  p.user_id,
  25,
  'manual_credit',
  'Manual credit - webhook failed to process checkout.session.completed',
  cb.balance
FROM profiles p
JOIN call_balance cb ON cb.user_id = p.user_id
WHERE p.stripe_customer_id = 'cus_TZeD9pI9ceXZFj';
