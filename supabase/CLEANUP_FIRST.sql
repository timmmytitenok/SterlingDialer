-- ============================================================================
-- RUN THIS FIRST TO CLEAN UP ALL OLD FUNCTIONS AND TRIGGERS
-- ============================================================================
-- This script removes ALL versions of free trial functions and triggers
-- Run this BEFORE running MASTER_SCHEMA_MIGRATION.sql
-- ============================================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS trg_calculate_trial_days_remaining ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_trial_days_remaining ON profiles CASCADE;
DROP TRIGGER IF EXISTS trg_extend_referrer_trial_on_completion ON referrals CASCADE;

-- Drop ALL possible function signatures with CASCADE
-- This handles functions with default parameters and different signatures

-- calculate_trial_days_remaining variants
DROP FUNCTION IF EXISTS calculate_trial_days_remaining() CASCADE;

-- start_free_trial variants
DROP FUNCTION IF EXISTS start_free_trial(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS start_free_trial(UUID) CASCADE;
DROP FUNCTION IF EXISTS start_free_trial(user_id_param UUID, duration_days INTEGER) CASCADE;

-- grant_free_access variants (THIS IS THE PROBLEM)
DROP FUNCTION IF EXISTS grant_free_access(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS grant_free_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS grant_free_access(user_id_param UUID, duration_days INTEGER) CASCADE;

-- extend_trial variants
DROP FUNCTION IF EXISTS extend_trial(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS extend_trial(user_id_param UUID, additional_days INTEGER) CASCADE;

-- expire_free_trials variants
DROP FUNCTION IF EXISTS expire_free_trials() CASCADE;

-- extend_referrer_trial_on_completion variants
DROP FUNCTION IF EXISTS extend_referrer_trial_on_completion() CASCADE;

-- add_to_balance variants
DROP FUNCTION IF EXISTS add_to_balance(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS add_to_balance(user_id_input UUID, amount_input DECIMAL) CASCADE;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ All old functions and triggers dropped successfully!';
  RAISE NOTICE '✅ Now run MASTER_SCHEMA_MIGRATION.sql';
END $$;

