-- First, let's see what columns exist in profiles
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Clear the stripe_customer_id (without email column)
UPDATE profiles 
SET stripe_customer_id = NULL
WHERE user_id = '27c69c87-44a1-47c0-853c-fcef5a08db86';

-- Verify it's cleared (without email column)
SELECT user_id, stripe_customer_id 
FROM profiles 
WHERE user_id = '27c69c87-44a1-47c0-853c-fcef5a08db86';
