-- =====================================================
-- STERLING AI - FREE TRIAL & CUSTOM PRICING MIGRATION
-- Version: 3.0
-- Date: November 2, 2025
-- =====================================================
-- 
-- This migration adds:
-- 1. FreeTrial tier (30-day trial, customizable)
-- 2. FreeAccess tier (for friends, customizable duration & pricing)
-- 3. Per-user cost per minute (customizable)
-- 4. Trial expiration tracking
-- 5. Custom AI caller limits for FreeAccess
-- 6. Flag to exclude FreeAccess from cost graphs
--
-- =====================================================

-- Step 1: Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 4) DEFAULT 0.30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_total_days INTEGER DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_days_remaining INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgraded_from_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS previous_tier TEXT;

-- Add comments
COMMENT ON COLUMN profiles.cost_per_minute IS 'Custom cost per minute for calls. Defaults: Starter $0.30, Pro $0.25, Elite $0.20, but can be customized per user';
COMMENT ON COLUMN profiles.free_trial_started_at IS 'When the user started their free trial';
COMMENT ON COLUMN profiles.free_trial_ends_at IS 'When the free trial expires (can be extended manually)';
COMMENT ON COLUMN profiles.free_trial_total_days IS 'Total duration of the trial in days (e.g., 30, 60, 90). Can be increased to extend trial.';
COMMENT ON COLUMN profiles.free_trial_days_remaining IS 'Days left in free trial (auto-calculated from end date)';
COMMENT ON COLUMN profiles.upgraded_from_trial IS 'TRUE if user upgraded from free trial to paid plan';
COMMENT ON COLUMN profiles.previous_tier IS 'Previous subscription tier (used when upgrading from trial)';

-- Step 2: Expand subscription_tier enum to include new tiers
-- Drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- No need to alter type since we're using TEXT, just add comment
COMMENT ON COLUMN profiles.subscription_tier IS 'Subscription tier: starter, pro, elite, free_trial, free_access, or NULL';

-- Step 3: Add new columns to subscriptions table
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_subscription_tier_check;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 4) DEFAULT 0.30;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS exclude_from_cost_graph BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS free_access_duration_days INTEGER;

-- Add comments
COMMENT ON COLUMN subscriptions.subscription_tier IS 'Tier: starter, pro, elite, free_trial, free_access';
COMMENT ON COLUMN subscriptions.cost_per_minute IS 'Custom cost per minute for this subscription';
COMMENT ON COLUMN subscriptions.exclude_from_cost_graph IS 'If TRUE, do not include subscription costs in AI cost graphs (for FreeAccess tier)';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'When free trial expires (for free_trial tier)';
COMMENT ON COLUMN subscriptions.free_access_duration_days IS 'Duration of free access in days (for free_access tier, can be set to 36500 for "lifetime")';

-- Step 4: Update default cost_per_minute for existing users based on tier
UPDATE profiles 
SET cost_per_minute = CASE subscription_tier
  WHEN 'starter' THEN 0.30
  WHEN 'pro' THEN 0.25
  WHEN 'elite' THEN 0.20
  ELSE 0.30
END
WHERE cost_per_minute = 0.30 OR cost_per_minute IS NULL;

UPDATE subscriptions
SET cost_per_minute = CASE subscription_tier
  WHEN 'starter' THEN 0.30
  WHEN 'pro' THEN 0.25
  WHEN 'elite' THEN 0.20
  ELSE 0.30
END
WHERE cost_per_minute = 0.30 OR cost_per_minute IS NULL;

-- Step 5: Create function to calculate trial days remaining
CREATE OR REPLACE FUNCTION calculate_trial_days_remaining()
RETURNS TRIGGER AS $$
DECLARE
  days_diff NUMERIC;
BEGIN
  IF NEW.free_trial_ends_at IS NOT NULL THEN
    -- Calculate total days between now and end date
    days_diff := EXTRACT(EPOCH FROM (NEW.free_trial_ends_at - NOW())) / 86400;
    NEW.free_trial_days_remaining := GREATEST(0, CEIL(days_diff)::INTEGER);
  ELSE
    NEW.free_trial_days_remaining := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-update trial days remaining
DROP TRIGGER IF EXISTS update_trial_days_remaining ON profiles;
CREATE TRIGGER update_trial_days_remaining
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.free_trial_ends_at IS NOT NULL)
  EXECUTE FUNCTION calculate_trial_days_remaining();

-- Step 7: Create helper function to start free trial
CREATE OR REPLACE FUNCTION start_free_trial(user_id_param UUID, trial_duration_days INTEGER DEFAULT 30)
RETURNS VOID AS $$
DECLARE
  v_trial_start TIMESTAMPTZ := NOW();
  v_trial_end TIMESTAMPTZ := NOW() + (trial_duration_days || ' days')::INTERVAL;
  v_days_remaining INTEGER;
BEGIN
  -- Calculate days remaining in seconds, then convert to days
  v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_trial_end - NOW())) / 86400)::INTEGER;
  
  -- Update profile
  UPDATE profiles 
  SET 
    subscription_tier = 'free_trial',
    cost_per_minute = 0.30,
    free_trial_started_at = v_trial_start,
    free_trial_ends_at = v_trial_end,
    free_trial_total_days = trial_duration_days,
    free_trial_days_remaining = v_days_remaining,
    has_active_subscription = TRUE
  WHERE user_id = user_id_param;

  -- Create subscription record
  INSERT INTO subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_tier,
    status,
    plan_name,
    amount,
    currency,
    current_period_start,
    current_period_end,
    max_daily_calls,
    ai_caller_count,
    cost_per_minute,
    trial_ends_at
  )
  VALUES (
    user_id_param,
    'free_trial',
    'free_trial_' || user_id_param,
    'free_trial',
    'active',
    'Free Trial (30 Days)',
    0.00,
    'usd',
    v_trial_start,
    v_trial_end,
    600,
    1,
    0.30,
    v_trial_end
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE
  SET
    status = 'active',
    current_period_end = EXCLUDED.current_period_end,
    trial_ends_at = EXCLUDED.trial_ends_at,
    updated_at = NOW();

  -- Initialize AI settings
  INSERT INTO ai_control_settings (user_id, daily_call_limit)
  VALUES (user_id_param, 600)
  ON CONFLICT (user_id) DO UPDATE
  SET daily_call_limit = 600;

  -- Initialize call balance (optional: give trial users some credits)
  INSERT INTO call_balance (user_id, balance)
  VALUES (user_id_param, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Free trial started for user % (expires: %)', user_id_param, v_trial_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create helper function to grant free access
CREATE OR REPLACE FUNCTION grant_free_access(
  user_id_param UUID,
  duration_days INTEGER DEFAULT 90,
  custom_cost_per_minute DECIMAL DEFAULT 0.10,
  num_ai_callers INTEGER DEFAULT 1,
  max_calls_per_day INTEGER DEFAULT 600
)
RETURNS VOID AS $$
DECLARE
  v_access_start TIMESTAMPTZ := NOW();
  v_access_end TIMESTAMPTZ := NOW() + (duration_days || ' days')::INTERVAL;
BEGIN
  -- Validate inputs
  IF num_ai_callers < 1 OR num_ai_callers > 3 THEN
    RAISE EXCEPTION 'num_ai_callers must be between 1 and 3';
  END IF;

  -- Update profile
  UPDATE profiles 
  SET 
    subscription_tier = 'free_access',
    cost_per_minute = custom_cost_per_minute,
    has_active_subscription = TRUE
  WHERE user_id = user_id_param;

  -- Create subscription record
  INSERT INTO subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_tier,
    status,
    plan_name,
    amount,
    currency,
    current_period_start,
    current_period_end,
    max_daily_calls,
    ai_caller_count,
    cost_per_minute,
    exclude_from_cost_graph,
    free_access_duration_days
  )
  VALUES (
    user_id_param,
    'free_access',
    'free_access_' || user_id_param,
    'free_access',
    'active',
    'Free Access',
    0.00,
    'usd',
    v_access_start,
    v_access_end,
    max_calls_per_day,
    num_ai_callers,
    custom_cost_per_minute,
    TRUE, -- Exclude from cost graph
    duration_days
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE
  SET
    status = 'active',
    max_daily_calls = EXCLUDED.max_daily_calls,
    ai_caller_count = EXCLUDED.ai_caller_count,
    cost_per_minute = EXCLUDED.cost_per_minute,
    current_period_end = EXCLUDED.current_period_end,
    free_access_duration_days = EXCLUDED.free_access_duration_days,
    updated_at = NOW();

  -- Initialize AI settings
  INSERT INTO ai_control_settings (user_id, daily_call_limit)
  VALUES (user_id_param, max_calls_per_day)
  ON CONFLICT (user_id) DO UPDATE
  SET daily_call_limit = max_calls_per_day;

  -- Initialize call balance
  INSERT INTO call_balance (user_id, balance)
  VALUES (user_id_param, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Free access granted to user % for % days (cost: $%/min, AIs: %, calls/day: %)', 
    user_id_param, duration_days, custom_cost_per_minute, num_ai_callers, max_calls_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to extend trial
CREATE OR REPLACE FUNCTION extend_trial(user_id_param UUID, additional_days INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    free_trial_ends_at = free_trial_ends_at + (additional_days || ' days')::INTERVAL,
    free_trial_total_days = free_trial_total_days + additional_days,
    free_trial_days_remaining = free_trial_days_remaining + additional_days
  WHERE user_id = user_id_param
    AND subscription_tier = 'free_trial';

  UPDATE subscriptions
  SET
    trial_ends_at = trial_ends_at + (additional_days || ' days')::INTERVAL,
    current_period_end = current_period_end + (additional_days || ' days')::INTERVAL
  WHERE user_id = user_id_param
    AND subscription_tier = 'free_trial';

  RAISE NOTICE '✅ Extended trial for user % by % days (new total: % days)', 
    user_id_param, additional_days, (SELECT free_trial_total_days FROM profiles WHERE user_id = user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to check and expire trials (run via cron job)
CREATE OR REPLACE FUNCTION expire_free_trials()
RETURNS TABLE(expired_user_id UUID, user_email TEXT) AS $$
BEGIN
  RETURN QUERY
  WITH expired_users AS (
    UPDATE profiles
    SET 
      subscription_tier = NULL,
      has_active_subscription = FALSE,
      free_trial_days_remaining = 0
    WHERE subscription_tier = 'free_trial'
      AND free_trial_ends_at < NOW()
    RETURNING user_id
  ),
  deactivated_subscriptions AS (
    UPDATE subscriptions
    SET status = 'canceled'
    WHERE user_id IN (SELECT user_id FROM expired_users)
      AND subscription_tier = 'free_trial'
    RETURNING user_id
  )
  SELECT 
    e.user_id,
    u.email
  FROM expired_users e
  JOIN auth.users u ON u.id = e.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Grant permissions
GRANT EXECUTE ON FUNCTION start_free_trial TO authenticated;
GRANT EXECUTE ON FUNCTION grant_free_access TO service_role;
GRANT EXECUTE ON FUNCTION extend_trial TO service_role;
GRANT EXECUTE ON FUNCTION expire_free_trials TO service_role;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Start a 30-day free trial for a user
-- SELECT start_free_trial('USER_UUID_HERE', 30);

-- Example 2: Grant free access to a friend for 90 days at $0.10/min with 1 AI
-- SELECT grant_free_access('USER_UUID_HERE', 90, 0.10, 1, 600);

-- Example 3: Grant lifetime free access (100 years) at $0.05/min with 3 AIs
-- SELECT grant_free_access('USER_UUID_HERE', 36500, 0.05, 3, 1800);

-- Example 4: Extend someone's trial by 10 days
-- SELECT extend_trial('USER_UUID_HERE', 10);

-- Example 5: Manually adjust someone's cost per minute
-- UPDATE profiles SET cost_per_minute = 0.15 WHERE user_id = 'USER_UUID_HERE';
-- UPDATE subscriptions SET cost_per_minute = 0.15 WHERE user_id = 'USER_UUID_HERE';

-- Example 6: Check who has free trials expiring soon
-- SELECT 
--   p.user_id,
--   u.email,
--   p.free_trial_days_remaining,
--   p.free_trial_ends_at
-- FROM profiles p
-- JOIN auth.users u ON u.id = p.user_id
-- WHERE p.subscription_tier = 'free_trial'
--   AND p.free_trial_days_remaining <= 7
-- ORDER BY p.free_trial_days_remaining ASC;

-- Example 7: Run trial expiration check (returns expired users)
-- SELECT * FROM expire_free_trials();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('cost_per_minute', 'free_trial_started_at', 'free_trial_ends_at', 'free_trial_days_remaining');

-- Check subscriptions columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('cost_per_minute', 'exclude_from_cost_graph', 'trial_ends_at', 'free_access_duration_days');

-- Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('start_free_trial', 'grant_free_access', 'extend_trial', 'expire_free_trials')
ORDER BY routine_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ FREE TRIAL & CUSTOM PRICING MIGRATION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 New Features:';
  RAISE NOTICE '  • FreeTrial tier (30 days, 1 AI, 600 calls/day, $0.30/min)';
  RAISE NOTICE '  • FreeAccess tier (customizable everything)';
  RAISE NOTICE '  • Per-user cost per minute';
  RAISE NOTICE '  • Trial expiration tracking';
  RAISE NOTICE '  • Manual tier customization via SQL';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Helper Functions:';
  RAISE NOTICE '  • start_free_trial(user_id, days)';
  RAISE NOTICE '  • grant_free_access(user_id, days, cost/min, AIs, calls/day)';
  RAISE NOTICE '  • extend_trial(user_id, additional_days)';
  RAISE NOTICE '  • expire_free_trials() - run daily via cron';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to rock!';
  RAISE NOTICE '';
END $$;

