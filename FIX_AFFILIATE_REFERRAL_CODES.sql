-- ============================================================================
-- FIX: Add affiliate codes to referral_codes table
-- ============================================================================
-- This script ensures all affiliate partners have their codes in the
-- referral_codes table so that referral validation can find them.
-- ============================================================================

-- Insert affiliate codes into referral_codes table (skip duplicates)
INSERT INTO referral_codes (user_id, code, created_at)
SELECT 
  user_id,
  UPPER(affiliate_code) as code,
  NOW() as created_at
FROM profiles
WHERE is_affiliate_partner = true
  AND affiliate_code IS NOT NULL
  AND affiliate_code != ''
ON CONFLICT (user_id) DO UPDATE
SET 
  code = EXCLUDED.code;

-- Also backfill from referral_code column (for regular users who created custom codes)
INSERT INTO referral_codes (user_id, code, created_at)
SELECT 
  user_id,
  UPPER(referral_code) as code,
  NOW() as created_at
FROM profiles
WHERE referral_code IS NOT NULL
  AND referral_code != ''
  AND user_id NOT IN (SELECT user_id FROM referral_codes)
ON CONFLICT (user_id) DO NOTHING;

-- Show results
SELECT 
  'Affiliate codes synced:' as message,
  COUNT(*) as count
FROM referral_codes rc
INNER JOIN profiles p ON p.user_id = rc.user_id
WHERE p.is_affiliate_partner = true;

