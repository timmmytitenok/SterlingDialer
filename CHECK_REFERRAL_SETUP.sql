-- =============================================
-- REFERRAL SYSTEM DIAGNOSTIC QUERIES
-- Run these to check if your referral system is set up correctly
-- =============================================

-- 1. Check if referral tables exist
SELECT 
  'Tables Check' as test,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ Both tables exist'
    ELSE '❌ Missing tables! Run schema-v14-referrals.sql'
  END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('referral_codes', 'referrals');

-- 2. Check if you have a referral code
SELECT 
  '✅ Your Referral Code' as info,
  code,
  created_at
FROM referral_codes
WHERE user_id = auth.uid()
LIMIT 1;

-- 3. Check all referral codes (for debugging)
SELECT 
  'All Referral Codes' as info,
  rc.code,
  p.full_name as user_name,
  p.email,
  rc.created_at
FROM referral_codes rc
LEFT JOIN profiles p ON p.user_id = rc.user_id
ORDER BY rc.created_at DESC
LIMIT 10;

-- 4. Check all referrals
SELECT 
  'All Referrals' as info,
  r.id,
  r.referral_code,
  r.status,
  referrer.full_name as referrer_name,
  referee.full_name as referee_name,
  r.created_at
FROM referrals r
LEFT JOIN profiles referrer ON referrer.user_id = r.referrer_id
LEFT JOIN profiles referee ON referee.user_id = r.referee_id
ORDER BY r.created_at DESC
LIMIT 10;

-- 5. Check your referrals specifically
SELECT 
  'Your Referrals' as info,
  r.id,
  r.referral_code,
  r.status,
  referee.full_name as referee_name,
  referee.email as referee_email,
  r.created_at,
  CASE 
    WHEN r.status = 'pending' THEN '⏳ Waiting for subscription'
    WHEN r.status = 'credited' THEN '✅ You earned $200!'
    ELSE r.status
  END as status_description
FROM referrals r
LEFT JOIN profiles referee ON referee.user_id = r.referee_id
WHERE r.referrer_id = auth.uid()
ORDER BY r.created_at DESC;

-- 6. Count summary
SELECT 
  'Summary' as info,
  (SELECT COUNT(*) FROM referral_codes) as total_codes,
  (SELECT COUNT(*) FROM referrals) as total_referrals,
  (SELECT COUNT(*) FROM referrals WHERE status = 'pending') as pending_referrals,
  (SELECT COUNT(*) FROM referrals WHERE status = 'credited') as credited_referrals;

