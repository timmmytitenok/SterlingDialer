# 🚀 Deployment Guide - Free Trial & New Pricing

## Step-by-Step Deployment

### 1. **Run Database Migration** ⚡
```bash
# In Supabase SQL Editor, run this file:
supabase/FREE_TRIAL_AND_CUSTOM_PRICING_MIGRATION.sql
```

This will:
- Add all new database columns
- Create SQL helper functions
- Set up triggers
- Initialize default values for existing users

**Expected Result:**
```
✅ FREE TRIAL & CUSTOM PRICING MIGRATION COMPLETE!
```

---

### 2. **Update Stripe Price IDs** (Optional) 💳

If you want to create new Stripe products for the new prices:

#### Option A: Create New Prices in Stripe
1. Go to Stripe Dashboard → Products
2. Create new prices:
   - **Starter**: $499/month
   - **Pro**: $899/month
   - **Elite**: $1,499/month
3. Copy the price IDs (e.g., `price_xxxxxxxxxxxxx`)
4. Update your `.env.local`:
```bash
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_ELITE=price_xxxxxxxxxxxxx
```

#### Option B: Update Existing Prices
1. Go to Stripe Dashboard → Products
2. Edit your existing product prices directly to $499, $899, $1,499
3. No code changes needed!

---

### 3. **Set Up Trial Expiration Cron Job** ⏰

You need a daily cron job to check for expired trials.

#### Using Supabase Edge Functions:
```typescript
// supabase/functions/expire-trials/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase.rpc('expire_free_trials')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ 
    message: 'Trial expiration check complete',
    expired_users: data 
  }))
})
```

Then set up a cron trigger in Supabase:
```sql
-- Run every day at midnight
SELECT cron.schedule(
  'expire-free-trials',
  '0 0 * * *',
  $$
  SELECT expire_free_trials();
  $$
);
```

#### Or Use External Cron (e.g., GitHub Actions):
```yaml
# .github/workflows/expire-trials.yml
name: Expire Free Trials
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
jobs:
  expire:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run SQL
        run: |
          curl -X POST https://your-app.com/api/cron/expire-trials \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

### 4. **Test the Free Trial Flow** 🧪

#### Test Scenario 1: New User Sign-Up
1. Go to `/pricing` or `/subscribe`
2. Click "Start Free Trial"
3. Should redirect to `/onboarding`
4. Complete onboarding
5. Check database:
```sql
SELECT * FROM profiles WHERE subscription_tier = 'free_trial';
SELECT * FROM subscriptions WHERE subscription_tier = 'free_trial';
```

#### Test Scenario 2: Trial Countdown Banner
1. As trial user, go to `/dashboard`
2. Should see countdown banner at top
3. Banner color should change based on days remaining:
   - Blue: 8-30 days
   - Amber: 4-7 days
   - Red: 0-3 days

#### Test Scenario 3: Trial Expiration
1. Manually expire a trial:
```sql
UPDATE profiles 
SET free_trial_ends_at = NOW() - INTERVAL '1 day',
    free_trial_days_remaining = 0
WHERE user_id = 'TEST_USER_UUID';

UPDATE subscriptions 
SET status = 'canceled'
WHERE user_id = 'TEST_USER_UUID' AND subscription_tier = 'free_trial';
```

2. User should be redirected to `/trial-expired`
3. Page should show all paid tiers (no free trial option)

---

### 5. **Grant Free Access to Friends** 🎁

Use SQL to grant custom free access:

```sql
-- Example 1: 90 days at $0.10/min with 1 AI
SELECT grant_free_access(
  'FRIEND_USER_UUID', -- Their user ID
  90,                 -- Days of access
  0.10,               -- Cost per minute
  1,                  -- Number of AIs (1-3)
  600                 -- Max calls per day
);

-- Example 2: Lifetime access at $0.05/min with 3 AIs
SELECT grant_free_access(
  'VIP_FRIEND_UUID',
  36500,    -- 100 years = "lifetime"
  0.05,     -- Super cheap rate
  3,        -- All 3 AIs
  1800      -- Max calls
);

-- Example 3: Short-term test at $0.30/min
SELECT grant_free_access(
  'TEST_USER_UUID',
  30,       -- 30 days
  0.30,     -- Standard rate
  1,        -- 1 AI
  600       -- 600 calls/day
);
```

**Verify:**
```sql
SELECT 
  p.user_id,
  u.email,
  p.subscription_tier,
  p.cost_per_minute,
  s.ai_caller_count,
  s.max_daily_calls,
  s.exclude_from_cost_graph
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
JOIN subscriptions s ON s.user_id = p.user_id
WHERE p.subscription_tier = 'free_access';
```

---

### 6. **Monitor & Manage Trials** 📊

#### View All Active Trials:
```sql
SELECT 
  p.user_id,
  u.email,
  p.free_trial_days_remaining,
  p.free_trial_ends_at,
  p.cost_per_minute
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.subscription_tier = 'free_trial'
ORDER BY p.free_trial_days_remaining ASC;
```

#### Extend Someone's Trial:
```sql
SELECT extend_trial('USER_UUID', 10); -- Add 10 more days
```

#### Manually Adjust Pricing:
```sql
-- Change cost per minute for a specific user
UPDATE profiles 
SET cost_per_minute = 0.20 
WHERE user_id = 'USER_UUID';

UPDATE subscriptions 
SET cost_per_minute = 0.20 
WHERE user_id = 'USER_UUID';
```

#### Check Who's About to Expire:
```sql
SELECT 
  u.email,
  p.free_trial_days_remaining,
  p.free_trial_ends_at
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.subscription_tier = 'free_trial'
  AND p.free_trial_days_remaining <= 3
ORDER BY p.free_trial_days_remaining ASC;
```

---

### 7. **Verify Pricing Updates** ✅

Check these pages to ensure prices are correct:

- [ ] `/pricing` - Shows $499, $899, $1,499
- [ ] `/subscribe` - Shows "Start Free Trial" banner + correct prices
- [ ] `/dashboard/settings/billing` - Shows correct prices in tier selector
- [ ] Dashboard revenue graph - Uses correct daily costs

---

### 8. **Update Marketing Materials** 📢

Update any external references to your pricing:
- [ ] Website landing page (if applicable)
- [ ] Email templates
- [ ] Social media
- [ ] Ads/campaigns

**Current Pricing:**
- Starter: $499/month
- Pro: $899/month
- Elite: $1,499/month
- Plus: $0.20-$0.30/minute for calls

---

## 🔐 Security Notes

1. **Trial Limit**: Currently, users can only start ONE free trial per account
2. **FreeAccess Grants**: Only available via SQL (admin only)
3. **Cost Adjustments**: Require database access (admin only)
4. **Trial Extensions**: Require database access (admin only)

---

## 📞 Troubleshooting

### "Free trial already exists" Error
```sql
-- Check if user already has a trial
SELECT * FROM subscriptions 
WHERE user_id = 'USER_UUID' 
  AND subscription_tier = 'free_trial';

-- If needed, reset it
DELETE FROM subscriptions 
WHERE user_id = 'USER_UUID' 
  AND subscription_tier = 'free_trial';

UPDATE profiles 
SET subscription_tier = NULL, 
    has_active_subscription = FALSE,
    free_trial_started_at = NULL,
    free_trial_ends_at = NULL,
    free_trial_days_remaining = NULL
WHERE user_id = 'USER_UUID';
```

### Trial Not Expiring
```sql
-- Manually run expiration check
SELECT * FROM expire_free_trials();

-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'expire-free-trials';
```

### Cost Per Minute Not Updating
```sql
-- Force update for a user
UPDATE profiles SET cost_per_minute = 0.30 WHERE user_id = 'USER_UUID';
UPDATE subscriptions SET cost_per_minute = 0.30 WHERE user_id = 'USER_UUID';

-- Verify
SELECT 
  p.cost_per_minute as profile_rate,
  s.cost_per_minute as subscription_rate
FROM profiles p
JOIN subscriptions s ON s.user_id = p.user_id
WHERE p.user_id = 'USER_UUID';
```

---

## 🎉 You're All Set!

Your app now has:
- ✅ 30-day free trials
- ✅ Custom FreeAccess tier
- ✅ Per-user pricing
- ✅ Updated pricing ($499/$899/$1,499)
- ✅ Trial countdown banners
- ✅ Automatic expiration
- ✅ SQL management tools

**Happy launching! 🚀**

