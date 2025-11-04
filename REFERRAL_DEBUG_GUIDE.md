# Free Trial Referral System - Debug Guide

## How It Should Work

1. **Referrer creates link** → Click "Sign Up" button in referrals page
2. **Referee signs up** → Uses link like `sterlingdialer.com/login?ref=REFERRER_USER_ID`
3. **Referral created** → API creates entry in `referrals` table with status='pending'
4. **Referee verifies email** → Confirms email address
5. **Referee adds payment method** → Completes first balance refill
6. **Webhook fires** → Stripe webhook detects first refill (`is_first_refill=true`)
7. **Referral completed** → Webhook updates referral to status='completed'
8. **Reward granted** → Referrer gets +7 days added to free trial

## Debug Steps

### Step 1: Check if referral was created
```sql
-- Find the referral entry
SELECT 
  r.id,
  r.referrer_id,
  r.referee_id,
  r.referee_email,
  r.status,
  r.referral_type,
  r.created_at,
  r.completed_at,
  p_referrer.subscription_tier as referrer_tier,
  p_referee.subscription_tier as referee_tier
FROM referrals r
LEFT JOIN profiles p_referrer ON r.referrer_id = p_referrer.user_id
LEFT JOIN profiles p_referee ON r.referee_id = p_referee.user_id
ORDER BY r.created_at DESC
LIMIT 10;
```

### Step 2: Check if referee has verified email
```sql
-- Check auth status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'referee@email.com';
```

### Step 3: Check if referee has payment method
```sql
-- Check if they have a Stripe customer ID
SELECT 
  user_id,
  stripe_customer_id,
  subscription_tier
FROM profiles
WHERE user_id = 'REFEREE_USER_ID';
```

### Step 4: Check call balance history
```sql
-- See if first refill was marked correctly
SELECT 
  user_id,
  balance,
  auto_refill_enabled,
  auto_refill_amount,
  last_refill_at
FROM call_balance
WHERE user_id = 'REFEREE_USER_ID';
```

### Step 5: Check referrer's trial days
```sql
-- See if days were added
SELECT 
  user_id,
  subscription_tier,
  free_trial_started_at,
  free_trial_ends_at,
  free_trial_total_days,
  free_trial_days_remaining
FROM profiles
WHERE user_id = 'REFERRER_USER_ID';
```

## Common Issues

### Issue 1: Referral not created at signup
- Check browser console for API errors
- Verify `ref` parameter in URL
- Check that referrer is on `free_trial` tier

### Issue 2: Email not verified
- User must click confirmation link in email
- Check Supabase auth.users table for `email_confirmed_at`

### Issue 3: Webhook not firing
- Check Stripe webhook logs
- Verify webhook endpoint is correct
- Ensure `is_first_refill` metadata is passed

### Issue 4: Referral not completed
- Check Stripe webhook logs for errors
- Verify referral status in database
- Check that referrer is still on free trial

## Manual Fix (if needed)

If a referral should have completed but didn't, you can manually complete it:

```sql
-- 1. Mark referral as completed
UPDATE referrals
SET 
  status = 'completed',
  completed_at = NOW()
WHERE referee_id = 'REFEREE_USER_ID'
  AND status = 'pending';

-- 2. Add 7 days to referrer's trial
UPDATE profiles
SET 
  free_trial_ends_at = free_trial_ends_at + INTERVAL '7 days',
  free_trial_total_days = COALESCE(free_trial_total_days, 30) + 7
WHERE user_id = 'REFERRER_USER_ID'
  AND subscription_tier = 'free_trial';

-- 3. Recalculate days remaining
SELECT calculate_trial_days_remaining('REFERRER_USER_ID');
```

## Testing Checklist

- [ ] Referrer is on free_trial tier
- [ ] Referral link contains correct `ref` parameter
- [ ] Referee signs up with referral link
- [ ] Referral entry created in database (status='pending')
- [ ] Referee verifies email
- [ ] Referee adds payment method (first refill)
- [ ] Stripe webhook fires with `is_first_refill=true`
- [ ] Referral status changes to 'completed'
- [ ] Referrer's `free_trial_ends_at` extended by 7 days
- [ ] Referrer's `free_trial_total_days` increased by 7
- [ ] Days remaining recalculated

