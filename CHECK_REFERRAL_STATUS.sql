-- ============================================================================
-- REFERRAL SYSTEM DEBUG - Check Current Status
-- ============================================================================
-- Run these queries to see what's happening with your referrals

-- 1. VIEW ALL RECENT REFERRALS (last 10)
-- ============================================================================
SELECT 
  r.id,
  r.referrer_id,
  r.referee_id,
  r.referee_email,
  r.status,
  r.referral_type,
  r.created_at,
  r.completed_at,
  -- Referrer info
  p_referrer.subscription_tier as referrer_tier,
  p_referrer.free_trial_ends_at as referrer_trial_ends,
  p_referrer.free_trial_total_days as referrer_total_days,
  -- Referee info
  p_referee.subscription_tier as referee_tier,
  p_referee.stripe_customer_id as referee_has_payment_method,
  -- Auth info
  auth_referee.email_confirmed_at as referee_email_verified
FROM referrals r
LEFT JOIN profiles p_referrer ON r.referrer_id = p_referrer.user_id
LEFT JOIN profiles p_referee ON r.referee_id = p_referee.user_id
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
ORDER BY r.created_at DESC
LIMIT 10;

-- 2. FIND PENDING REFERRALS THAT SHOULD BE COMPLETED
-- ============================================================================
-- These are referrals where:
-- - Status is 'pending'
-- - Referee has verified email
-- - Referee has payment method on file
SELECT 
  r.id as referral_id,
  r.referee_email,
  r.status,
  auth_referee.email_confirmed_at as email_verified,
  p_referee.stripe_customer_id as has_payment_method,
  cb.balance as referee_balance,
  cb.last_refill_at
FROM referrals r
LEFT JOIN profiles p_referee ON r.referee_id = p_referee.user_id
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
LEFT JOIN call_balance cb ON r.referee_id = cb.user_id
WHERE r.status = 'pending'
  AND auth_referee.email_confirmed_at IS NOT NULL
  AND p_referee.stripe_customer_id IS NOT NULL;

-- 3. CHECK SPECIFIC USER'S REFERRALS (replace with your email)
-- ============================================================================
-- INSTRUCTIONS: Replace 'your-email@example.com' with the actual referrer's email
SELECT 
  r.id,
  r.referee_email,
  r.status,
  r.created_at,
  r.completed_at,
  CASE 
    WHEN r.status = 'completed' THEN '✅ Completed'
    WHEN r.status = 'pending' AND auth_referee.email_confirmed_at IS NOT NULL 
         AND p_referee.stripe_customer_id IS NOT NULL THEN '⚠️ Should be complete but pending'
    WHEN r.status = 'pending' AND auth_referee.email_confirmed_at IS NULL THEN '📧 Waiting for email verification'
    WHEN r.status = 'pending' AND p_referee.stripe_customer_id IS NULL THEN '💳 Waiting for payment method'
    ELSE '❓ Unknown'
  END as referral_status_detail
FROM referrals r
LEFT JOIN profiles p_referrer ON r.referrer_id = p_referrer.user_id
LEFT JOIN profiles p_referee ON r.referee_id = p_referee.user_id
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
LEFT JOIN auth.users auth_referrer ON r.referrer_id = auth_referrer.id
WHERE auth_referrer.email LIKE '%YOUR_EMAIL%'
ORDER BY r.created_at DESC;

-- 4. MANUAL FIX - Complete a stuck referral
-- ============================================================================
-- ONLY USE THIS IF:
-- - The referee has verified their email
-- - The referee has added a payment method
-- - The referral is still showing as 'pending'
-- - The webhook logs show no errors OR didn't fire

-- Step 1: Find the referral ID you want to complete
-- (Use query #2 above to find stuck referrals)

-- Step 2: Manually complete the referral (REPLACE THE UUID)
/*
DO $$
DECLARE
  v_referral_id UUID := 'PASTE_REFERRAL_ID_HERE'; -- From query #2
  v_referrer_id UUID;
  v_referrer_profile RECORD;
  v_completed_count INT;
BEGIN
  -- Get referrer info
  SELECT referrer_id INTO v_referrer_id 
  FROM referrals 
  WHERE id = v_referral_id;
  
  -- Get referrer profile
  SELECT * INTO v_referrer_profile 
  FROM profiles 
  WHERE user_id = v_referrer_id;
  
  -- Check if they're on free trial
  IF v_referrer_profile.subscription_tier = 'free_trial' THEN
    -- Count completed referrals
    SELECT COUNT(*) INTO v_completed_count
    FROM referrals
    WHERE referrer_id = v_referrer_id
      AND status = 'completed';
    
    -- Only add days if they haven't reached max
    IF v_completed_count < 4 THEN
      -- Mark referral as completed
      UPDATE referrals
      SET 
        status = 'completed',
        completed_at = NOW()
      WHERE id = v_referral_id;
      
      -- Add 7 days to trial
      UPDATE profiles
      SET 
        free_trial_ends_at = free_trial_ends_at + INTERVAL '7 days',
        free_trial_total_days = COALESCE(free_trial_total_days, 30) + 7
      WHERE user_id = v_referrer_id;
      
      -- Recalculate days remaining
      PERFORM calculate_trial_days_remaining(v_referrer_id);
      
      RAISE NOTICE '✅ Referral completed and 7 days added to trial!';
    ELSE
      RAISE NOTICE '⚠️ Referrer has already reached max 4 referrals';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Referrer is not on free trial';
  END IF;
END $$;
*/

-- 5. VIEW TRIAL EXTENSION HISTORY
-- ============================================================================
-- See how many days a user has earned from referrals
SELECT 
  u.email,
  p.free_trial_started_at,
  p.free_trial_ends_at,
  p.free_trial_total_days,
  p.free_trial_days_remaining,
  COUNT(r.id) as total_referrals,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals,
  (COUNT(CASE WHEN r.status = 'completed' THEN 1 END) * 7) as days_earned_from_referrals
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
LEFT JOIN referrals r ON p.user_id = r.referrer_id
WHERE p.subscription_tier = 'free_trial'
GROUP BY u.email, p.free_trial_started_at, p.free_trial_ends_at, 
         p.free_trial_total_days, p.free_trial_days_remaining
ORDER BY p.free_trial_started_at DESC;

