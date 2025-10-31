-- Clear the old LIVE mode stripe_customer_id so a new TEST mode customer can be created
UPDATE profiles 
SET stripe_customer_id = NULL 
WHERE stripe_customer_id = 'cus_TIxO7o9Lr4iDPr';

-- Show the result
SELECT user_id, stripe_customer_id FROM profiles LIMIT 5;
