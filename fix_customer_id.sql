-- Clear the stripe_customer_id for your user specifically
UPDATE profiles 
SET stripe_customer_id = NULL
WHERE user_id = '27c69c87-44a1-47c0-853c-fcef5a08db86';

-- Verify it's cleared
SELECT user_id, email, stripe_customer_id 
FROM profiles 
WHERE user_id = '27c69c87-44a1-47c0-853c-fcef5a08db86';
