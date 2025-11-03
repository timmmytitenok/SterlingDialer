-- =====================================================
-- FREE TRIAL REFERRAL SYSTEM MIGRATION
-- =====================================================
-- This migration adds support for free trial referrals
-- where users can extend their trial by inviting friends
-- =====================================================

-- Add referral_type column to distinguish between free trial and paid referrals
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referral_type VARCHAR(50) DEFAULT 'subscription_discount';

-- Add completed_at timestamp to track when referral was completed
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update existing referrals to have the 'subscription_discount' type
UPDATE referrals 
SET referral_type = 'subscription_discount' 
WHERE referral_type IS NULL;

-- Create an index on referral_type for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_type 
ON referrals(referral_type);

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_status 
ON referrals(status);

-- Create a function to automatically extend trial when referral is completed
-- This runs whenever a referral status changes to 'completed'
CREATE OR REPLACE FUNCTION extend_trial_on_referral_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_tier VARCHAR(50);
  v_current_trial_end TIMESTAMPTZ;
  v_new_trial_end TIMESTAMPTZ;
  v_current_total_days INTEGER;
  v_new_total_days INTEGER;
  v_completed_count INTEGER;
BEGIN
  -- Only proceed if status changed to 'completed' and it's a free trial referral
  IF NEW.status = 'completed' 
     AND OLD.status != 'completed' 
     AND NEW.referral_type = 'free_trial_extension' THEN
    
    -- Get referrer's subscription tier and trial details
    SELECT subscription_tier, free_trial_ends_at, free_trial_total_days
    INTO v_referrer_tier, v_current_trial_end, v_current_total_days
    FROM profiles
    WHERE user_id = NEW.referrer_id;
    
    -- Only extend if referrer is still on free trial
    IF v_referrer_tier = 'free_trial' AND v_current_trial_end IS NOT NULL THEN
      
      -- Count how many completed referrals they have
      SELECT COUNT(*)
      INTO v_completed_count
      FROM referrals
      WHERE referrer_id = NEW.referrer_id
        AND status = 'completed'
        AND referral_type = 'free_trial_extension';
      
      -- Max 4 referrals (including this one)
      IF v_completed_count <= 4 THEN
        -- Add 7 days to trial
        v_new_trial_end := v_current_trial_end + INTERVAL '7 days';
        v_new_total_days := COALESCE(v_current_total_days, 30) + 7;
        
        -- Update the profile
        UPDATE profiles
        SET 
          free_trial_ends_at = v_new_trial_end,
          free_trial_total_days = v_new_total_days
        WHERE user_id = NEW.referrer_id;
        
        RAISE NOTICE 'Extended trial for user % by 7 days. New end date: %', 
          NEW.referrer_id, v_new_trial_end;
      ELSE
        RAISE NOTICE 'User % has already reached max referrals (4)', NEW.referrer_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_extend_trial_on_referral_completion ON referrals;

CREATE TRIGGER trigger_extend_trial_on_referral_completion
AFTER UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION extend_trial_on_referral_completion();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked:

-- Check referrals table structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'referrals' 
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'referrals';

-- Test the trigger function exists
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_name = 'extend_trial_on_referral_completion';

