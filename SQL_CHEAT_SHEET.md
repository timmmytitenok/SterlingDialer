# 🛠️ SQL Cheat Sheet - Sterling AI Management

## Quick Reference for Common Operations

---

## 🎁 Free Trial Management

### Start a 30-Day Free Trial
```sql
SELECT start_free_trial('USER_UUID', 30);
```

### View All Active Trials
```sql
SELECT 
  u.email,
  p.free_trial_days_remaining || ' days left' as time_left,
  p.free_trial_ends_at,
  p.cost_per_minute
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.subscription_tier = 'free_trial'
ORDER BY p.free_trial_days_remaining ASC;
```

### Extend a Trial (Add Days)
```sql
-- Add 10 more days
SELECT extend_trial('USER_UUID', 10);

-- Add 30 more days
SELECT extend_trial('USER_UUID', 30);
```

### Manually Expire a Trial
```sql
UPDATE profiles 
SET free_trial_ends_at = NOW(),
    free_trial_days_remaining = 0,
    subscription_tier = NULL,
    has_active_subscription = FALSE
WHERE user_id = 'USER_UUID';

UPDATE subscriptions 
SET status = 'canceled'
WHERE user_id = 'USER_UUID' AND subscription_tier = 'free_trial';
```

### Run Expiration Check (Should Run Daily)
```sql
SELECT * FROM expire_free_trials();
```

---

## 👥 FreeAccess Management

### Grant Free Access - Standard (90 days, $0.10/min, 1 AI)
```sql
SELECT grant_free_access('USER_UUID', 90, 0.10, 1, 600);
```

### Grant Free Access - VIP (Lifetime, $0.05/min, 3 AIs)
```sql
SELECT grant_free_access('USER_UUID', 36500, 0.05, 3, 1800);
```

### Grant Free Access - Short Test (30 days, $0.30/min, 1 AI)
```sql
SELECT grant_free_access('USER_UUID', 30, 0.30, 1, 600);
```

### View All FreeAccess Users
```sql
SELECT 
  u.email,
  p.cost_per_minute,
  s.ai_caller_count,
  s.max_daily_calls,
  s.current_period_end as expires_at,
  s.free_access_duration_days || ' days' as duration
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
JOIN subscriptions s ON s.user_id = p.user_id
WHERE p.subscription_tier = 'free_access'
ORDER BY s.current_period_end ASC;
```

### Extend FreeAccess Duration
```sql
UPDATE subscriptions 
SET current_period_end = current_period_end + INTERVAL '30 days',
    free_access_duration_days = free_access_duration_days + 30
WHERE user_id = 'USER_UUID' AND subscription_tier = 'free_access';
```

---

## 💰 Pricing Adjustments

### Change Cost Per Minute for a User
```sql
-- Update both tables
UPDATE profiles SET cost_per_minute = 0.20 WHERE user_id = 'USER_UUID';
UPDATE subscriptions SET cost_per_minute = 0.20 WHERE user_id = 'USER_UUID';
```

### Set Custom Pricing by Tier
```sql
-- Starter users: $0.25/min instead of $0.30
UPDATE profiles p
SET cost_per_minute = 0.25
FROM subscriptions s
WHERE p.user_id = s.user_id 
  AND s.subscription_tier = 'starter';
```

### View All Users' Cost Per Minute
```sql
SELECT 
  u.email,
  p.subscription_tier,
  p.cost_per_minute,
  s.ai_caller_count
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
LEFT JOIN subscriptions s ON s.user_id = p.user_id
ORDER BY p.cost_per_minute DESC;
```

---

## 🤖 AI Caller Adjustments

### Change Number of AI Callers (FreeAccess Only)
```sql
-- Give user 2 AI callers
UPDATE subscriptions 
SET ai_caller_count = 2,
    max_daily_calls = 1200
WHERE user_id = 'USER_UUID' AND subscription_tier = 'free_access';

-- Give user 3 AI callers
UPDATE subscriptions 
SET ai_caller_count = 3,
    max_daily_calls = 1800
WHERE user_id = 'USER_UUID' AND subscription_tier = 'free_access';
```

### View AI Caller Limits
```sql
SELECT 
  u.email,
  p.subscription_tier,
  s.ai_caller_count,
  s.max_daily_calls
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
JOIN subscriptions s ON s.user_id = p.user_id
WHERE s.status = 'active'
ORDER BY s.ai_caller_count DESC, s.max_daily_calls DESC;
```

---

## 📊 Monitoring & Analytics

### View All Subscriptions Summary
```sql
SELECT 
  subscription_tier,
  COUNT(*) as user_count,
  AVG(cost_per_minute)::DECIMAL(10,2) as avg_cost_per_min,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
FROM subscriptions
GROUP BY subscription_tier
ORDER BY user_count DESC;
```

### Find Users About to Expire (Trial or FreeAccess)
```sql
-- Trials expiring in next 3 days
SELECT 
  u.email,
  'free_trial' as type,
  p.free_trial_days_remaining as days_left
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.subscription_tier = 'free_trial'
  AND p.free_trial_days_remaining <= 3

UNION ALL

-- FreeAccess expiring in next 7 days
SELECT 
  u.email,
  'free_access' as type,
  EXTRACT(DAY FROM (s.current_period_end - NOW()))::INTEGER as days_left
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.subscription_tier = 'free_access'
  AND s.current_period_end <= NOW() + INTERVAL '7 days'
  
ORDER BY days_left ASC;
```

### Revenue by Tier (Last 30 Days)
```sql
SELECT 
  s.subscription_tier,
  COUNT(DISTINCT s.user_id) as users,
  SUM(rt.revenue) as total_revenue,
  SUM(rt.total_ai_cost) as total_costs,
  SUM(rt.profit) as total_profit
FROM subscriptions s
JOIN revenue_tracking rt ON rt.user_id = s.user_id
WHERE rt.date >= CURRENT_DATE - INTERVAL '30 days'
  AND s.status = 'active'
GROUP BY s.subscription_tier
ORDER BY total_profit DESC;
```

---

## 🔍 Debugging

### Check User's Complete Status
```sql
SELECT 
  u.email,
  p.subscription_tier,
  p.cost_per_minute,
  p.has_active_subscription,
  p.onboarding_completed,
  p.free_trial_days_remaining,
  p.free_trial_ends_at,
  s.ai_caller_count,
  s.max_daily_calls,
  s.status as subscription_status,
  s.exclude_from_cost_graph
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
LEFT JOIN subscriptions s ON s.user_id = p.user_id
WHERE u.email = 'USER_EMAIL_HERE';
```

### Find Users with Mismatched Data
```sql
-- Users with active subscription but wrong has_active_subscription flag
SELECT 
  u.email,
  p.has_active_subscription,
  s.status
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
JOIN subscriptions s ON s.user_id = p.user_id
WHERE s.status = 'active' 
  AND p.has_active_subscription = FALSE;
```

### Check Recent Call Costs
```sql
SELECT 
  u.email,
  p.cost_per_minute,
  c.duration_seconds,
  (c.duration_seconds / 60.0 * p.cost_per_minute) as calculated_cost,
  c.created_at
FROM calls c
JOIN profiles p ON p.user_id = c.user_id
JOIN auth.users u ON u.id = c.user_id
WHERE c.created_at >= NOW() - INTERVAL '24 hours'
  AND c.duration_seconds > 0
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## 🚨 Emergency Operations

### Reset User's Subscription
```sql
-- WARNING: This will cancel their subscription
DELETE FROM subscriptions WHERE user_id = 'USER_UUID';

UPDATE profiles 
SET subscription_tier = NULL,
    has_active_subscription = FALSE,
    free_trial_started_at = NULL,
    free_trial_ends_at = NULL,
    free_trial_days_remaining = NULL,
    upgraded_from_trial = FALSE
WHERE user_id = 'USER_UUID';
```

### Fix Stuck Trial
```sql
-- If someone's trial is stuck, reset it
UPDATE profiles 
SET free_trial_ends_at = NOW() + INTERVAL '30 days',
    free_trial_days_remaining = 30,
    free_trial_started_at = NOW()
WHERE user_id = 'USER_UUID';

UPDATE subscriptions
SET status = 'active',
    trial_ends_at = NOW() + INTERVAL '30 days',
    current_period_end = NOW() + INTERVAL '30 days'
WHERE user_id = 'USER_UUID' AND subscription_tier = 'free_trial';
```

### Bulk Update All Starter Users to New Pricing
```sql
-- Update cost per minute for all Starter users
UPDATE profiles p
SET cost_per_minute = 0.30
FROM subscriptions s
WHERE p.user_id = s.user_id 
  AND s.subscription_tier = 'starter';

UPDATE subscriptions
SET cost_per_minute = 0.30
WHERE subscription_tier = 'starter';
```

---

## 📋 Useful Queries

### Users Who Upgraded from Trial
```sql
SELECT 
  u.email,
  p.previous_tier,
  p.subscription_tier as current_tier,
  p.upgraded_from_trial
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.upgraded_from_trial = TRUE;
```

### Most Active Users (by Call Volume)
```sql
SELECT 
  u.email,
  p.subscription_tier,
  COUNT(c.id) as total_calls,
  SUM(c.duration_seconds) as total_seconds,
  (SUM(c.duration_seconds) / 60.0 * p.cost_per_minute)::DECIMAL(10,2) as total_cost
FROM calls c
JOIN profiles p ON p.user_id = c.user_id
JOIN auth.users u ON u.id = c.user_id
WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.email, p.subscription_tier, p.cost_per_minute
ORDER BY total_calls DESC
LIMIT 20;
```

### Users with Low Balance
```sql
SELECT 
  u.email,
  cb.balance,
  cb.auto_refill_enabled,
  cb.auto_refill_amount
FROM call_balance cb
JOIN auth.users u ON u.id = cb.user_id
WHERE cb.balance < 10
ORDER BY cb.balance ASC;
```

---

## 💡 Pro Tips

1. **Always Update Both Tables**: When changing `cost_per_minute`, update BOTH `profiles` AND `subscriptions` tables

2. **Use Transactions for Critical Changes**:
```sql
BEGIN;
  UPDATE profiles SET cost_per_minute = 0.25 WHERE user_id = 'USER_UUID';
  UPDATE subscriptions SET cost_per_minute = 0.25 WHERE user_id = 'USER_UUID';
COMMIT;
```

3. **Test on a Single User First**: Before bulk updates, test on one user and verify

4. **Backup Before Bulk Changes**:
```sql
-- Create backup table
CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;
```

5. **Use Email for Lookups**: It's easier than UUIDs
```sql
-- Get UUID from email
SELECT id FROM auth.users WHERE email = 'user@example.com';

-- Then use in other queries
SELECT grant_free_access(
  (SELECT id FROM auth.users WHERE email = 'friend@example.com'),
  90, 0.10, 1, 600
);
```

---

**Save this file for quick reference! 📚**

