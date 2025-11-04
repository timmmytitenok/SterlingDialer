-- ============================================================================
-- FIX REFERRALS TABLE - Add missing columns
-- ============================================================================
-- Run this if you're getting "column referee_email does not exist" error

-- Add referee_email column if it doesn't exist
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referee_email TEXT;

-- Add referral_type column if it doesn't exist
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referral_type TEXT DEFAULT 'free_trial_extension';

-- Add completed_at column if it doesn't exist
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Verify the columns now exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'referrals'
ORDER BY ordinal_position;

