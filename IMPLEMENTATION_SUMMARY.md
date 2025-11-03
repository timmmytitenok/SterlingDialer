# Sterling AI - Free Trial & Custom Pricing Implementation Summary

## 🎉 What Was Implemented

### 1. **Updated Pricing Structure**
**New Pricing:**
- **Starter**: $499/month (was $999) - $0.30/min - 600 free minutes/day
- **Pro**: $899/month (was $1,399) - $0.25/min - 1200 free minutes/day
- **Elite**: $1,499/month (was $1,999) - $0.20/min - 2000 free minutes/day

**Updated Files:**
- `/app/pricing/page.tsx` - Updated all pricing displays, ROI calculations
- `/components/subscription-tier-selector.tsx` - Updated tier cards with new prices
- `/lib/pricing-config.ts` - **NEW FILE** - Centralized pricing configuration
- `/app/dashboard/page.tsx` - Updated daily cost calculations

---

### 2. **30-Day Free Trial System**

#### Features:
- ✅ **No credit card required**
- ✅ **1 AI Caller, 600 calls/day, $0.30/min**
- ✅ **Automatic expiration tracking**
- ✅ **Countdown banner in dashboard**
- ✅ **Trial expiration page**
- ✅ **Onboarding flow (same as paid tiers)**

#### New Files Created:
- `/app/api/trial/start/route.ts` - API endpoint to start free trial
- `/app/trial-expired/page.tsx` - Page shown when trial expires
- `/components/trial-countdown-banner.tsx` - Dashboard banner showing days remaining

#### Database Changes:
```sql
-- New columns in profiles table:
- cost_per_minute (DECIMAL) - Custom per-user pricing
- free_trial_started_at (TIMESTAMPTZ)
- free_trial_ends_at (TIMESTAMPTZ)
- free_trial_days_remaining (INTEGER)
- upgraded_from_trial (BOOLEAN)
- previous_tier (TEXT)

-- New columns in subscriptions table:
- cost_per_minute (DECIMAL)
- exclude_from_cost_graph (BOOLEAN)
- trial_ends_at (TIMESTAMPTZ)
- free_access_duration_days (INTEGER)
```

#### SQL Functions Created:
- `start_free_trial(user_id, days)` - Start a free trial
- `grant_free_access(user_id, days, cost/min, AIs, calls/day)` - Grant custom free access
- `extend_trial(user_id, additional_days)` - Extend trial duration
- `expire_free_trials()` - Check and expire trials (run via cron)

---

### 3. **FreeAccess Tier (For Friends)**

#### Features:
- ✅ **$0 monthly cost** (only pay for call minutes)
- ✅ **Customizable cost per minute** ($0.05 - $0.30)
- ✅ **1-3 AI callers** (manually adjustable)
- ✅ **Custom duration** (90 days, lifetime, etc.)
- ✅ **Excluded from cost graphs** (no monthly subscription showing)

#### How to Grant:
```sql
-- Grant 90 days at $0.10/min with 1 AI
SELECT grant_free_access('USER_UUID', 90, 0.10, 1, 600);

-- Grant lifetime (100 years) at $0.05/min with 3 AIs
SELECT grant_free_access('USER_UUID', 36500, 0.05, 3, 1800);
```

#### Manual Adjustments:
```sql
-- Change someone's cost per minute
UPDATE profiles SET cost_per_minute = 0.15 
WHERE user_id = 'USER_UUID';

UPDATE subscriptions SET cost_per_minute = 0.15 
WHERE user_id = 'USER_UUID';

-- Change number of AI callers (FreeAccess only)
UPDATE subscriptions SET ai_caller_count = 2 
WHERE user_id = 'USER_UUID' AND subscription_tier = 'free_access';

-- Extend free access duration
UPDATE subscriptions 
SET current_period_end = current_period_end + INTERVAL '30 days',
    free_access_duration_days = free_access_duration_days + 30
WHERE user_id = 'USER_UUID' AND subscription_tier = 'free_access';
```

---

### 4. **Per-User Custom Pricing**

#### Implementation:
- **Database**: `profiles.cost_per_minute` and `subscriptions.cost_per_minute`
- **Call Cost Calculation**: Updated to use user-specific rate
- **Balance Deduction**: Uses custom rate per user
- **Revenue Tracking**: Records correct costs based on user rate

#### Default Rates by Tier:
- **Starter**: $0.30/minute
- **Pro**: $0.25/minute
- **Elite**: $0.20/minute
- **Free Trial**: $0.30/minute
- **Free Access**: $0.10/minute (or custom)

#### Updated Files:
- `/app/api/calls/update/route.ts` - Uses per-user cost_per_minute
- `/app/api/balance/deduct/route.ts` - Uses per-user cost_per_minute
- `/app/dashboard/page.tsx` - Updated pricing calculations

---

### 5. **Free Trial User Experience**

#### Sign-Up Flow:
1. User lands on pricing page → Sees "30-Day Free Trial" banner
2. Clicks "Start Free Trial" → Creates free trial subscription
3. Redirected to onboarding → Completes AI setup
4. After onboarding → AI goes into "Maintenance" mode (admin activates)
5. Dashboard shows countdown banner with days remaining

#### During Trial:
- **Dashboard Banner**: Shows days left with color coding
  - Blue: 8-30 days left
  - Amber: 4-7 days left  
  - Red: 0-3 days left (urgent)
- **Full Access**: 1 AI, 600 calls/day, all features
- **Cost**: Only pay for call minutes ($0.30/min)

#### Trial Expiration:
- **Automatic Check**: `expire_free_trials()` function (run via cron)
- **Redirect**: User sent to `/trial-expired` page
- **Choose Plan Page**: Shows all paid tiers (no free trial option)
- **Seamless Upgrade**: If upgrading to Starter, no maintenance needed
- **Pro/Elite Upgrade**: Maintenance mode activated (you manually enable more AIs)

---

### 6. **Onboarding & Upgrading Logic**

#### First-Time Subscribers (Free Trial or Paid):
1. Complete onboarding form
2. `onboarding_completed = true` in database
3. AI set to "Maintenance" mode
4. Admin activates AI manually

#### Upgrading from Free Trial:
- **To Starter**: No onboarding, no maintenance (same 1 AI)
- **To Pro**: No onboarding, maintenance ON (admin enables 2nd AI)
- **To Elite**: No onboarding, maintenance ON (admin enables 2nd & 3rd AI)

**Logic**: `upgraded_from_trial` flag prevents re-onboarding

---

### 7. **Cost Graph Exclusions**

#### FreeAccess Tier:
- `subscriptions.exclude_from_cost_graph = TRUE`
- **Revenue Graph**: Only shows call costs (no monthly subscription cost)
- **Reason**: Friends don't pay monthly fee, only call minutes

#### Implementation:
- Updated `/app/api/calls/update/route.ts`
- Checks `exclude_from_cost_graph` flag
- Skips `ai_retainer_cost` updates for FreeAccess users

---

## 📊 Database Migration

### Run This SQL File:
```bash
/supabase/FREE_TRIAL_AND_CUSTOM_PRICING_MIGRATION.sql
```

This will:
- ✅ Add all new columns
- ✅ Create helper functions
- ✅ Set up triggers
- ✅ Update existing users with default cost_per_minute

---

## 🔧 Manual Operations

### Check Free Trial Status:
```sql
SELECT 
  p.user_id,
  u.email,
  p.subscription_tier,
  p.free_trial_days_remaining,
  p.free_trial_ends_at,
  p.cost_per_minute
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.subscription_tier = 'free_trial'
ORDER BY p.free_trial_days_remaining ASC;
```

### Extend Someone's Trial:
```sql
SELECT extend_trial('USER_UUID', 10); -- Add 10 days
```

### Grant Free Access:
```sql
-- 90 days, $0.10/min, 1 AI, 600 calls/day
SELECT grant_free_access('USER_UUID', 90, 0.10, 1, 600);
```

### Manually Adjust Pricing:
```sql
-- Change cost per minute
UPDATE profiles SET cost_per_minute = 0.20 WHERE user_id = 'USER_UUID';
UPDATE subscriptions SET cost_per_minute = 0.20 WHERE user_id = 'USER_UUID';
```

---

## 🚀 What to Test

### 1. Free Trial Flow:
- [ ] Sign up → Start free trial
- [ ] See countdown banner in dashboard
- [ ] Let trial expire → See trial-expired page
- [ ] Choose paid plan → Subscribe successfully

### 2. Pricing Updates:
- [ ] Verify pricing page shows $499/$899/$1,499
- [ ] Check subscription selector shows correct prices
- [ ] Verify call costs use correct per-minute rate

### 3. FreeAccess Testing:
- [ ] Grant free access via SQL
- [ ] Verify no monthly cost in revenue graph
- [ ] Check custom cost per minute works
- [ ] Confirm AI caller limits work

### 4. Upgrade Flow:
- [ ] Free trial → Starter (no maintenance)
- [ ] Free trial → Pro/Elite (maintenance ON)
- [ ] Verify no re-onboarding required

---

## ⚠️ Important Notes

1. **Stripe Price IDs**: The app still uses existing Stripe price IDs. You'll need to:
   - Create new Stripe products/prices for $499, $899, $1,499
   - Update `.env` with new price IDs
   - Or adjust Stripe prices directly in dashboard

2. **Trial Expiration Cron**: Set up a daily cron job to run:
   ```sql
   SELECT * FROM expire_free_trials();
   ```

3. **Free Trial Button**: Only shows on `/subscribe` page when `currentTier` is `none` or `null`

4. **Landing Page**: NOT updated with new pricing (per your request). Only internal pages updated.

---

## 📝 Files Modified

### New Files:
- `lib/pricing-config.ts`
- `app/api/trial/start/route.ts`
- `app/trial-expired/page.tsx`
- `components/trial-countdown-banner.tsx`
- `supabase/FREE_TRIAL_AND_CUSTOM_PRICING_MIGRATION.sql`

### Modified Files:
- `app/pricing/page.tsx`
- `components/subscription-tier-selector.tsx`
- `app/dashboard/page.tsx`
- `app/api/calls/update/route.ts`
- `app/api/balance/deduct/route.ts`

---

## 🎯 Summary

You now have:
1. ✅ Updated pricing ($499/$899/$1,499)
2. ✅ 30-day free trial system
3. ✅ FreeAccess tier for friends
4. ✅ Per-user custom pricing
5. ✅ Trial countdown banner
6. ✅ Trial expiration page
7. ✅ Cost graph exclusions
8. ✅ Upgrade logic (skip onboarding)
9. ✅ SQL functions for manual control
10. ✅ Complete database schema

**Everything is ready to rock! 🚀**

Just run the migration SQL and test the free trial flow!

