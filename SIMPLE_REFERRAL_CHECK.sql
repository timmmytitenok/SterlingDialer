-- ============================================================================
-- SIMPLE REFERRAL CHECK - Works with current table structure
-- ============================================================================

-- 1. VIEW ALL REFERRALS (works with any referrals table structure)
-- ============================================================================
SELECT 
  r.id,
  r.referrer_id,
  r.referee_id,
  r.status,
  r.created_at,
  -- Get emails from auth.users
  auth_referrer.email as referrer_email,
  auth_referee.email as referee_email,
  -- Check if referee completed signup
  auth_referee.email_confirmed_at as referee_email_verified,
  p_referee.stripe_customer_id as referee_has_payment,
  -- Referrer info
  p_referrer.subscription_tier as referrer_tier,
  p_referrer.free_trial_ends_at as referrer_trial_ends,
  p_referrer.free_trial_total_days as referrer_total_days
FROM referrals r
LEFT JOIN auth.users auth_referrer ON r.referrer_id = auth_referrer.id
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
LEFT JOIN profiles p_referrer ON r.referrer_id = p_referrer.user_id
LEFT JOIN profiles p_referee ON r.referee_id = p_referee.user_id
ORDER BY r.created_at DESC
LIMIT 10;

-- 2. FIND STUCK REFERRALS (should be completed but aren't)
-- ============================================================================
SELECT 
  r.id as referral_id,
  r.status,
  r.referrer_id,
  r.referee_id,
  auth_referee.email as referee_email,
  auth_referee.email_confirmed_at as email_verified,
  p_referee.stripe_customer_id as has_payment_method,
  p_referrer.subscription_tier as referrer_tier,
  CASE 
    WHEN r.status = 'completed' THEN '✅ Already completed'
    WHEN r.status = 'pending' AND auth_referee.email_confirmed_at IS NULL THEN '📧 Waiting for email verification'
    WHEN r.status = 'pending' AND p_referee.stripe_customer_id IS NULL THEN '💳 Waiting for payment method'
    WHEN r.status = 'pending' AND auth_referee.email_confirmed_at IS NOT NULL 
         AND p_referee.stripe_customer_id IS NOT NULL THEN '⚠️ STUCK - Should be completed!'
    ELSE '❓ Unknown status'
  END as issue
FROM referrals r
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
LEFT JOIN profiles p_referee ON r.referee_id = p_referee.user_id
LEFT JOIN profiles p_referrer ON r.referrer_id = p_referrer.user_id
ORDER BY r.created_at DESC;

-- 3. MANUAL FIX - Complete a specific stuck referral
-- ============================================================================
-- INSTRUCTIONS:
-- 1. First, run query #2 above to find the referral_id that's stuck
-- 2. Replace 'PASTE_REFERRAL_ID_HERE' below with the actual UUID
-- 3. Uncomment and run this block

/*
DO $$
DECLARE
  v_referral_id UUID := 'PASTE_REFERRAL_ID_HERE';
  v_referral RECORD;
  v_referrer_profile RECORD;
  v_completed_count INT;
  v_new_trial_end TIMESTAMPTZ;
  v_new_total_days INT;
BEGIN
  RAISE NOTICE '🔍 Starting manual referral completion...';
  
  -- Get referral info
  SELECT * INTO v_referral 
  FROM referrals 
  WHERE id = v_referral_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE '❌ Referral not found with ID: %', v_referral_id;
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Found referral: % -> %', v_referral.referrer_id, v_referral.referee_id;
  
  -- Get referrer profile
  SELECT * INTO v_referrer_profile 
  FROM profiles 
  WHERE user_id = v_referral.referrer_id;
  
  RAISE NOTICE '👤 Referrer tier: %', v_referrer_profile.subscription_tier;
  
  -- Check if they're on free trial
  IF v_referrer_profile.subscription_tier != 'free_trial' THEN
    RAISE NOTICE '⚠️ Referrer is not on free trial - cannot award days';
    RETURN;
  END IF;
  
  -- Count completed referrals
  SELECT COUNT(*) INTO v_completed_count
  FROM referrals
  WHERE referrer_id = v_referral.referrer_id
    AND status = 'completed';
  
  RAISE NOTICE '📊 Referrer has % completed referrals (max: 4)', v_completed_count;
  
  -- Only add days if they haven't reached max
  IF v_completed_count >= 4 THEN
    RAISE NOTICE '⚠️ Referrer has reached max 4 referrals';
    RETURN;
  END IF;
  
  -- Calculate new trial end date
  v_new_trial_end := v_referrer_profile.free_trial_ends_at + INTERVAL '7 days';
  v_new_total_days := COALESCE(v_referrer_profile.free_trial_total_days, 30) + 7;
  
  RAISE NOTICE '📅 Current trial ends: %', v_referrer_profile.free_trial_ends_at;
  RAISE NOTICE '📅 New trial ends: %', v_new_trial_end;
  
  -- Mark referral as completed
  UPDATE referrals
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_referral_id;
  
  RAISE NOTICE '✅ Referral marked as completed';
  
  -- Add 7 days to trial
  UPDATE profiles
  SET 
    free_trial_ends_at = v_new_trial_end,
    free_trial_total_days = v_new_total_days
  WHERE user_id = v_referral.referrer_id;
  
  RAISE NOTICE '✅ Added 7 days to trial';
  
  -- Recalculate days remaining
  PERFORM calculate_trial_days_remaining(v_referral.referrer_id);
  
  RAISE NOTICE '✅ Days remaining recalculated';
  RAISE NOTICE '🎉 SUCCESS! Referral completed and 7 days added!';
END $$;
*/

-- 4. VIEW YOUR REFERRAL STATS (replace with your email)
-- ============================================================================
SELECT 
  auth_referrer.email as your_email,
  p.subscription_tier,
  p.free_trial_ends_at,
  p.free_trial_total_days,
  p.free_trial_days_remaining,
  COUNT(r.id) as total_referrals,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals,
  (COUNT(CASE WHEN r.status = 'completed' THEN 1 END) * 7) as days_earned
FROM profiles p
LEFT JOIN auth.users auth_referrer ON p.user_id = auth_referrer.id
LEFT JOIN referrals r ON p.user_id = r.referrer_id
WHERE auth_referrer.email LIKE '%YOUR_EMAIL_HERE%'
  AND p.subscription_tier = 'free_trial'
GROUP BY auth_referrer.email, p.subscription_tier, p.free_trial_ends_at, 
         p.free_trial_total_days, p.free_trial_days_remaining;

