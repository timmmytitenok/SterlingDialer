-- ============================================================================
-- DEBUG: Check Referral Status
-- ============================================================================

-- 1. Check all recent referrals
SELECT 
  r.id,
  r.status,
  r.referral_type,
  r.created_at,
  r.completed_at,
  p_referrer.full_name as referrer_name,
  u_referrer.email as referrer_email,
  p_referee.full_name as referee_name,
  u_referee.email as referee_email,
  p_referee.stripe_customer_id as referee_has_stripe,
  CASE 
    WHEN r.status = 'pending' THEN '⏰ PENDING'
    WHEN r.status = 'completed' THEN '✅ COMPLETED'
    ELSE r.status
  END as status_display
FROM referrals r
LEFT JOIN profiles p_referrer ON p_referrer.user_id = r.referrer_id
LEFT JOIN profiles p_referee ON p_referee.user_id = r.referee_id
LEFT JOIN auth.users u_referrer ON u_referrer.id = r.referrer_id
LEFT JOIN auth.users u_referee ON u_referee.id = r.referee_id
ORDER BY r.created_at DESC
LIMIT 10;

-- 2. Check specific pending referrals
SELECT 
  r.*,
  p.full_name,
  p.stripe_customer_id,
  CASE 
    WHEN p.stripe_customer_id IS NOT NULL THEN '✅ Has payment method'
    ELSE '❌ No payment method'
  END as payment_status
FROM referrals r
LEFT JOIN profiles p ON p.user_id = r.referee_id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;

-- 3. Manually mark a referral as completed (TESTING ONLY)
-- Uncomment and replace the ID to manually complete a referral:
/*
UPDATE referrals
SET 
  status = 'completed',
  completed_at = NOW()
WHERE id = 'REFERRAL_ID_HERE';

-- Verify it worked
SELECT * FROM referrals WHERE id = 'REFERRAL_ID_HERE';
*/

