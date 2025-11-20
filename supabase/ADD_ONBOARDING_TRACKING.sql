-- ============================================================================
-- ADD ONBOARDING TRACKING TO PROFILES
-- ============================================================================

-- Add onboarding step tracking columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_1_form BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_2_balance BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_3_sheet BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_4_schedule BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_all_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_all_complete);

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name LIKE 'onboarding%'
ORDER BY column_name;

