-- Check if stripe_customer_id is NULL now
SELECT user_id, email, stripe_customer_id 
FROM profiles 
WHERE user_id = '27c69c87-44a1-47c0-853c-fcef5a08db86';
