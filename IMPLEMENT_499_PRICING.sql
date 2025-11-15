-- ============================================================================
-- IMPLEMENT $499/MONTH SINGLE-TIER PRICING
-- ============================================================================
-- This removes the complex 3-tier system and replaces it with:
-- - 30-day free trial
-- - Single $499/month subscription
-- - Everyone pays $0.30/min
-- ============================================================================

-- STEP 1: Set everyone to $0.30 per minute (universal rate)
UPDATE profiles SET cost_per_minute = 0.30;

-- STEP 2: Update subscription tiers to single "pro" tier
-- For existing paid users, convert them to "pro"
UPDATE profiles 
SET subscription_tier = 'pro'
WHERE subscription_tier IN ('starter', 'elite');

UPDATE subscriptions 
SET subscription_tier = 'pro'
WHERE subscription_tier IN ('starter', 'elite');

-- STEP 3: Verify changes
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE cost_per_minute = 0.30) as users_at_30_cents,
  COUNT(*) FILTER (WHERE subscription_tier = 'pro') as pro_users,
  COUNT(*) FILTER (WHERE subscription_tier = 'free_trial') as trial_users
FROM profiles;

-- ============================================================================
-- After running this, all users:
-- ✅ Pay $0.30/min (same rate)
-- ✅ Are on "pro" tier (if subscribed)
-- ✅ Or on "free_trial" (if in trial)
-- ============================================================================

