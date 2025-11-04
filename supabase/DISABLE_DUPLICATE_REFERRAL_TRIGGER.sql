-- ============================================================================
-- DISABLE DUPLICATE REFERRAL TRIGGER
-- ============================================================================
-- The database has BOTH a trigger AND webhook adding days for referrals
-- This causes duplicate rewards! We'll use ONLY the webhook.

-- Drop the duplicate trigger
DROP TRIGGER IF EXISTS trg_extend_referrer_trial_on_completion ON referrals CASCADE;

-- Drop the function too
DROP FUNCTION IF EXISTS extend_referrer_trial_on_completion() CASCADE;

-- Verify it's gone
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_extend_referrer_trial_on_completion';

-- Should return no results if successfully dropped

