-- ============================================================================
-- MANUALLY CREATE A REFERRAL FOR TESTING
-- ============================================================================
-- Use this to manually create a referral entry if signup didn't create one

-- Step 1: Find your referrer USER ID (the person who should get the reward)
SELECT 
  id as user_id,
  email
FROM auth.users
WHERE email LIKE '%YOUR_REFERRER_EMAIL%';
-- Copy the user_id from above

-- Step 2: Find your referee USER ID (the person who signed up with the link)
SELECT 
  id as user_id,
  email,
  email_confirmed_at
FROM auth.users
WHERE email LIKE '%YOUR_REFEREE_EMAIL%';
-- Copy the user_id from above

-- Step 3: Create the referral entry
INSERT INTO referrals (
  referrer_id,
  referee_id,
  referee_email,
  status,
  referral_type,
  created_at
) VALUES (
  'PASTE_REFERRER_USER_ID_HERE',  -- The person who gets the reward
  'PASTE_REFEREE_USER_ID_HERE',    -- The person who signed up
  'referee@email.com',              -- Referee's email
  'pending',                        -- Status (will be completed when they add payment)
  'free_trial_extension',           -- Type
  NOW()
);

-- Step 4: Verify it was created
SELECT 
  r.id,
  r.status,
  r.created_at,
  auth_referrer.email as referrer_email,
  auth_referee.email as referee_email
FROM referrals r
LEFT JOIN auth.users auth_referrer ON r.referrer_id = auth_referrer.id
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
ORDER BY r.created_at DESC
LIMIT 5;

-- ============================================================================
-- EXAMPLE (Replace with your actual UUIDs and emails)
-- ============================================================================

/*
-- Example: Creating a referral for testing

-- Referrer: yourname+referrer@gmail.com (will get +7 days)
-- Referee: yourname+referee@gmail.com (the one who signed up)

INSERT INTO referrals (
  referrer_id,
  referee_id,
  referee_email,
  status,
  referral_type,
  created_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Referrer's user_id
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',  -- Referee's user_id
  'yourname+referee@gmail.com',
  'pending',
  'free_trial_extension',
  NOW()
);
*/

-- ============================================================================
-- NOW TEST: Have the referee add a payment method
-- ============================================================================
-- After creating the referral manually:
-- 1. Login as the referee account
-- 2. Go to Settings → Call Balance
-- 3. Add payment method (test card: 4242 4242 4242 4242)
-- 4. Complete first refill purchase
-- 5. Check terminal logs for "🎉 SUCCESS! Added 7 days to referrer's trial!"
-- 6. Login as referrer and check if +7 days were added

