-- ============================================================================
-- MASTER SCHEMA MIGRATION - Sterling AI
-- ============================================================================
-- This file contains ALL database schema changes for the free trial system,
-- custom pricing, referral system, and call balance functionality.
-- Run this file ONCE on a fresh database or to update an existing one.
-- ============================================================================

-- ============================================================================
-- PART 1: PROFILES TABLE EXTENSIONS
-- ============================================================================
-- Add columns for free trial tracking, custom pricing, and referral system

-- Free Trial & Custom Pricing Columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 2) DEFAULT 0.30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_total_days INTEGER DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_days_remaining INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgraded_from_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS previous_tier TEXT;

-- ============================================================================
-- PART 2: SUBSCRIPTIONS TABLE EXTENSIONS
-- ============================================================================
-- Add columns for custom pricing and free access tracking

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 2);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS exclude_from_cost_graph BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS free_access_duration_days INTEGER;

-- ============================================================================
-- PART 3: REFERRALS TABLE
-- ============================================================================
-- Create referrals table for tracking free trial referrals

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referee_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  referral_type TEXT DEFAULT 'free_trial_extension', -- free_trial_extension, etc.
  completed_at TIMESTAMPTZ,
  CONSTRAINT fk_referrer FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_referee FOREIGN KEY (referee_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY (RLS) FOR REFERRALS
-- ============================================================================
-- Enable RLS and create policies for referrals table

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referrals (as referrer)
CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_id);

-- Policy: Users can view referrals where they are the referee
CREATE POLICY "Users can view referrals where they are referee" ON referrals
  FOR SELECT
  USING (auth.uid() = referee_id);

-- Policy: Users can insert referrals where they are the referrer
CREATE POLICY "Users can insert their own referrals" ON referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Policy: System can update any referral (for API operations)
CREATE POLICY "Service role can update referrals" ON referrals
  FOR UPDATE
  USING (true);

-- ============================================================================
-- PART 5: FREE TRIAL MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function: Start a free trial for a user
CREATE OR REPLACE FUNCTION start_free_trial(
  p_user_id UUID,
  p_duration_days INTEGER DEFAULT 30
) RETURNS VOID AS $$
DECLARE
  v_trial_start TIMESTAMPTZ;
  v_trial_end TIMESTAMPTZ;
  v_days_remaining INTEGER;
BEGIN
  v_trial_start := NOW();
  v_trial_end := v_trial_start + (p_duration_days || ' days')::INTERVAL;
  
  -- Calculate days remaining using CEIL for accurate rounding
  v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_trial_end - NOW())) / 86400)::INTEGER;

  -- Update user profile
  UPDATE profiles
  SET
    subscription_tier = 'free_trial',
    cost_per_minute = 0.30,
    free_trial_started_at = v_trial_start,
    free_trial_ends_at = v_trial_end,
    free_trial_total_days = p_duration_days,
    free_trial_days_remaining = v_days_remaining
  WHERE user_id = p_user_id;

  -- Create or update subscription record
  INSERT INTO subscriptions (
    user_id,
    tier,
    status,
    cost_per_minute,
    trial_ends_at,
    stripe_subscription_id
  ) VALUES (
    p_user_id,
    'free_trial',
    'active',
    0.30,
    v_trial_end,
    'free_trial_' || p_user_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    cost_per_minute = EXCLUDED.cost_per_minute,
    trial_ends_at = EXCLUDED.trial_ends_at,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id;

  RAISE NOTICE 'Free trial started for user % (% days, ends at %)', p_user_id, p_duration_days, v_trial_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Grant free access to a user (no trial, permanent free tier)
CREATE OR REPLACE FUNCTION grant_free_access(
  p_user_id UUID,
  p_duration_days INTEGER DEFAULT NULL -- NULL = permanent
) RETURNS VOID AS $$
DECLARE
  v_end_date TIMESTAMPTZ;
BEGIN
  IF p_duration_days IS NOT NULL THEN
    v_end_date := NOW() + (p_duration_days || ' days')::INTERVAL;
  ELSE
    v_end_date := NULL; -- Permanent access
  END IF;

  -- Update user profile
  UPDATE profiles
  SET
    subscription_tier = 'free_access',
    cost_per_minute = 0.30
  WHERE user_id = p_user_id;

  -- Create or update subscription record
  INSERT INTO subscriptions (
    user_id,
    tier,
    status,
    cost_per_minute,
    exclude_from_cost_graph,
    trial_ends_at,
    free_access_duration_days,
    stripe_subscription_id
  ) VALUES (
    p_user_id,
    'free_access',
    'active',
    0.30,
    TRUE, -- Exclude from AI cost graph
    v_end_date,
    p_duration_days,
    'free_access_' || p_user_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    cost_per_minute = EXCLUDED.cost_per_minute,
    exclude_from_cost_graph = EXCLUDED.exclude_from_cost_graph,
    trial_ends_at = EXCLUDED.trial_ends_at,
    free_access_duration_days = EXCLUDED.free_access_duration_days,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id;

  RAISE NOTICE 'Free access granted to user %', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Extend a user's free trial
CREATE OR REPLACE FUNCTION extend_trial(
  p_user_id UUID,
  p_additional_days INTEGER
) RETURNS VOID AS $$
DECLARE
  v_current_end TIMESTAMPTZ;
  v_new_end TIMESTAMPTZ;
  v_new_total_days INTEGER;
  v_days_remaining INTEGER;
BEGIN
  -- Get current trial end date and total days
  SELECT free_trial_ends_at, free_trial_total_days
  INTO v_current_end, v_new_total_days
  FROM profiles
  WHERE user_id = p_user_id;

  IF v_current_end IS NULL THEN
    RAISE EXCEPTION 'User % is not on a free trial', p_user_id;
  END IF;

  -- Calculate new end date
  v_new_end := v_current_end + (p_additional_days || ' days')::INTERVAL;
  
  -- Update total days
  v_new_total_days := COALESCE(v_new_total_days, 30) + p_additional_days;
  
  -- Calculate days remaining
  v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_new_end - NOW())) / 86400)::INTEGER;

  -- Update user profile
  UPDATE profiles
  SET
    free_trial_ends_at = v_new_end,
    free_trial_total_days = v_new_total_days,
    free_trial_days_remaining = v_days_remaining
  WHERE user_id = p_user_id;

  -- Update subscription record
  UPDATE subscriptions
  SET trial_ends_at = v_new_end
  WHERE user_id = p_user_id;

  RAISE NOTICE 'Trial extended for user % by % days (new end: %)', p_user_id, p_additional_days, v_new_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire free trials (run via cron job)
CREATE OR REPLACE FUNCTION expire_free_trials() RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    subscription_tier = 'none',
    free_trial_days_remaining = 0
  WHERE
    subscription_tier = 'free_trial'
    AND free_trial_ends_at IS NOT NULL
    AND free_trial_ends_at < NOW();

  UPDATE subscriptions
  SET status = 'expired'
  WHERE
    tier = 'free_trial'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < NOW();

  RAISE NOTICE 'Expired free trials processed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate trial days remaining (trigger function)
CREATE OR REPLACE FUNCTION calculate_trial_days_remaining()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.free_trial_ends_at IS NOT NULL THEN
    NEW.free_trial_days_remaining := CEIL(EXTRACT(EPOCH FROM (NEW.free_trial_ends_at - NOW())) / 86400)::INTEGER;
    IF NEW.free_trial_days_remaining < 0 THEN
      NEW.free_trial_days_remaining := 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate days remaining
DROP TRIGGER IF EXISTS trg_calculate_trial_days_remaining ON profiles;
CREATE TRIGGER trg_calculate_trial_days_remaining
  BEFORE INSERT OR UPDATE OF free_trial_ends_at ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trial_days_remaining();

-- ============================================================================
-- PART 6: REFERRAL TRIGGER FUNCTION
-- ============================================================================
-- Automatically extend referrer's trial when referee completes signup

CREATE OR REPLACE FUNCTION extend_referrer_trial_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_days_to_add INTEGER := 5; -- 5 days per successful referral
  v_referrer_tier TEXT;
BEGIN
  -- Only process if status changed to 'completed' and wasn't completed before
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if referrer is on free trial
    SELECT subscription_tier INTO v_referrer_tier
    FROM profiles
    WHERE user_id = NEW.referrer_id;
    
    IF v_referrer_tier = 'free_trial' THEN
      -- Extend the referrer's trial
      PERFORM extend_trial(NEW.referrer_id, v_days_to_add);
      
      -- Set completed_at timestamp
      NEW.completed_at := NOW();
      
      RAISE NOTICE 'Referrer % trial extended by % days due to completed referral', NEW.referrer_id, v_days_to_add;
    ELSE
      RAISE NOTICE 'Referrer % is not on free trial, skipping extension', NEW.referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral completion
DROP TRIGGER IF EXISTS trg_extend_referrer_trial_on_completion ON referrals;
CREATE TRIGGER trg_extend_referrer_trial_on_completion
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION extend_referrer_trial_on_completion();

-- ============================================================================
-- PART 7: HELPER FUNCTIONS FOR CALL BALANCE
-- ============================================================================

-- Function: Add to balance (used by webhooks)
CREATE OR REPLACE FUNCTION add_to_balance(
  user_id_input UUID,
  amount_input DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  new_balance DECIMAL;
BEGIN
  INSERT INTO call_balance (user_id, balance)
  VALUES (user_id_input, amount_input)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = call_balance.balance + amount_input
  RETURNING balance INTO new_balance;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes on profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_free_trial_ends_at ON profiles(free_trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Indexes on subscriptions table
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);

-- ============================================================================
-- PART 9: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN profiles.cost_per_minute IS 'Custom per-minute calling cost for this user (starter: $0.30, pro: $0.25, elite: $0.20)';
COMMENT ON COLUMN profiles.free_trial_started_at IS 'Timestamp when the free trial began';
COMMENT ON COLUMN profiles.free_trial_ends_at IS 'Timestamp when the free trial ends';
COMMENT ON COLUMN profiles.free_trial_total_days IS 'Total duration of the free trial in days (can be extended via referrals)';
COMMENT ON COLUMN profiles.free_trial_days_remaining IS 'Days remaining in the trial (auto-calculated)';
COMMENT ON COLUMN profiles.upgraded_from_trial IS 'TRUE if user upgraded from a free trial to a paid plan';
COMMENT ON COLUMN profiles.previous_tier IS 'Previous subscription tier before upgrade/downgrade';

COMMENT ON COLUMN subscriptions.cost_per_minute IS 'Per-minute calling cost for this subscription tier';
COMMENT ON COLUMN subscriptions.exclude_from_cost_graph IS 'If TRUE, exclude this subscription from AI cost graphs (for free_access tier)';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'End date for trial or free access period';
COMMENT ON COLUMN subscriptions.free_access_duration_days IS 'Duration of free access in days (NULL = permanent)';

COMMENT ON TABLE referrals IS 'Tracks free trial referrals for extending trial periods';
COMMENT ON COLUMN referrals.referral_type IS 'Type of referral reward (free_trial_extension, etc.)';
COMMENT ON COLUMN referrals.completed_at IS 'Timestamp when the referee completed signup (added payment method)';

-- ============================================================================
-- PART 10: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION start_free_trial TO authenticated;
GRANT EXECUTE ON FUNCTION grant_free_access TO authenticated;
GRANT EXECUTE ON FUNCTION extend_trial TO authenticated;
GRANT EXECUTE ON FUNCTION add_to_balance TO authenticated;

-- Grant execute on expire_free_trials to service role (for cron jobs)
GRANT EXECUTE ON FUNCTION expire_free_trials TO service_role;

-- ============================================================================
-- END OF MASTER SCHEMA MIGRATION
-- ============================================================================
-- 
-- USAGE INSTRUCTIONS:
-- 
-- 1. Start a free trial for a user:
--    SELECT start_free_trial(
--      (SELECT id FROM auth.users WHERE email = 'user@example.com'),
--      30  -- duration in days
--    );
--
-- 2. Extend a trial (e.g., for referrals):
--    SELECT extend_trial(
--      (SELECT id FROM auth.users WHERE email = 'user@example.com'),
--      5  -- additional days
--    );
--
-- 3. Grant permanent free access:
--    SELECT grant_free_access(
--      (SELECT id FROM auth.users WHERE email = 'user@example.com'),
--      NULL  -- NULL = permanent, or specify days
--    );
--
-- 4. Check trial status:
--    SELECT 
--      email,
--      subscription_tier,
--      free_trial_days_remaining,
--      free_trial_ends_at,
--      cost_per_minute
--    FROM profiles p
--    JOIN auth.users u ON p.user_id = u.id
--    WHERE email = 'user@example.com';
--
-- 5. View referrals for a user:
--    SELECT * FROM referrals
--    WHERE referrer_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
--    ORDER BY created_at DESC;
--
-- ============================================================================

