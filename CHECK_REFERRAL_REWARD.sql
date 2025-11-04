-- ============================================================================
-- CHECK WHY REFERRAL REWARD WASN'T GIVEN
-- ============================================================================

-- Step 1: Check if the duplicate trigger is still active (it should NOT be)
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_extend_referrer_trial_on_completion';
-- If this returns a row, the trigger is STILL active! Run the disable script.

-- Step 2: Check the referral status
SELECT 
  r.id,
  r.status,
  r.created_at,
  r.completed_at,
  auth_referrer.email as referrer_email,
  auth_referee.email as referee_email,
  -- Referrer trial info
  p_referrer.free_trial_total_days,
  p_referrer.free_trial_ends_at,
  p_referrer.subscription_tier as referrer_tier
FROM referrals r
LEFT JOIN auth.users auth_referrer ON r.referrer_id = auth_referrer.id
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
LEFT JOIN profiles p_referrer ON r.referrer_id = p_referrer.user_id
ORDER BY r.created_at DESC
LIMIT 5;

-- Step 3: Check if referee has payment method
SELECT 
  user_id,
  stripe_customer_id,
  subscription_tier
FROM profiles
WHERE user_id IN (
  SELECT referee_id FROM referrals ORDER BY created_at DESC LIMIT 1
);

-- Step 4: Check if referee's email is verified
SELECT 
  id,
  email,
  email_confirmed_at
FROM auth.users
WHERE id IN (
  SELECT referee_id FROM referrals ORDER BY created_at DESC LIMIT 1
);

-- ============================================================================
-- MANUAL FIX: If referral is 'pending' but should be 'completed'
-- ============================================================================

-- Find the latest referral
SELECT 
  r.id as referral_id,
  r.referrer_id,
  r.status,
  auth_referee.email_confirmed_at,
  p_referee.stripe_customer_id
FROM referrals r
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
LEFT JOIN profiles p_referee ON r.referee_id = p_referee.user_id
ORDER BY r.created_at DESC
LIMIT 1;

-- If status is 'pending' and both email_confirmed_at and stripe_customer_id are NOT NULL:
-- Run this to manually complete it and award 7 days:

/*
-- Replace these UUIDs with the actual values from above query
UPDATE referrals
SET status = 'completed', completed_at = NOW()
WHERE id = 'PASTE_REFERRAL_ID_HERE';

UPDATE profiles
SET 
  free_trial_ends_at = free_trial_ends_at + INTERVAL '7 days',
  free_trial_total_days = COALESCE(free_trial_total_days, 30) + 7
WHERE user_id = 'PASTE_REFERRER_USER_ID_HERE'
  AND subscription_tier = 'free_trial';

-- Recalculate days remaining
UPDATE profiles
SET free_trial_days_remaining = GREATEST(
  0,
  EXTRACT(DAY FROM (free_trial_ends_at - NOW()))::INTEGER
)
WHERE user_id = 'PASTE_REFERRER_USER_ID_HERE';
*/

