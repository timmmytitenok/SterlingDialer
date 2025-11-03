# Free Trial Referral System - Testing Guide

## 🎯 Overview
Free trial users can now extend their trial by inviting friends. Each valid referral adds **7 days** to their trial, up to a maximum of **4 referrals (28 extra days)**.

---

## 📋 Required SQL Migration

Before testing, run this SQL in your Supabase SQL Editor:

```sql
-- File: supabase/FREE_TRIAL_REFERRAL_MIGRATION.sql
-- This adds referral_type column and creates automatic trial extension trigger
```

Run the entire `FREE_TRIAL_REFERRAL_MIGRATION.sql` file in your Supabase dashboard.

---

## 🧪 Testing Steps

### Step 1: Start a Free Trial (User A - Referrer)

1. Go to `/login` and create a new account (User A)
2. Verify email
3. Click "Start Free Trial" on the billing page
4. Add a payment method (required for auto-refill)

**Verify:**
```sql
SELECT user_id, subscription_tier, free_trial_ends_at, free_trial_total_days, free_trial_days_remaining
FROM profiles
WHERE email = 'userA@example.com';
```
Should show: `subscription_tier = 'free_trial'`, `free_trial_total_days = 30`

---

### Step 2: Get Referral Link (User A)

1. Go to `/dashboard/settings/referrals`
2. You should see the **Free Trial Referral Dashboard** (not the paid version)
3. Copy your unique referral link
   - Format: `https://yourdomain.com/login?ref=USER_A_ID`

**Visual Check:**
- ✅ Should see 4 tier cards (all locked)
- ✅ Should see "0 Valid Referrals" and "+0 Extra Days Earned"
- ✅ Should see your referral link with copy button

---

### Step 3: Refer a Friend (User B - Referee)

1. **Open referral link in incognito/private window** (or different browser)
2. Sign up as User B using the referral link
3. **Verify email** (check inbox and click confirmation link)
4. **Add payment method** (this completes the referral)

**What happens behind the scenes:**
- ✅ When User B signs up → referral entry created with `status = 'pending'`
- ✅ When User B verifies email + adds payment → `status = 'completed'`
- ✅ Database trigger automatically adds 7 days to User A's trial

---

### Step 4: Verify Referral Completion (User A)

1. Go back to User A's browser
2. Refresh `/dashboard/settings/referrals`

**Expected Results:**
- ✅ "1 Valid Referrals" counter
- ✅ "+7 Extra Days Earned" counter
- ✅ **Tier 1 unlocked** (green, animated, with checkmark)
- ✅ User B appears in "Your Referrals" list with "✅ +7 Days" badge
- ✅ Free trial banner on dashboard shows extended days

**SQL Verification:**
```sql
-- Check User A's extended trial
SELECT user_id, free_trial_ends_at, free_trial_total_days, free_trial_days_remaining
FROM profiles
WHERE email = 'userA@example.com';
```
Should show: `free_trial_total_days = 37` (30 + 7)

```sql
-- Check referral status
SELECT referrer_id, referee_email, status, referral_type, completed_at
FROM referrals
WHERE referrer_id = 'USER_A_ID';
```
Should show: `status = 'completed'`, `referral_type = 'free_trial_extension'`

---

### Step 5: Test Multiple Referrals (Max 4)

Repeat Step 3 with User C, User D, User E (total 4 referrals):

**Expected Progressive Unlocking:**
- 1 referral → Tier 1 unlocked (🎁 +7 days)
- 2 referrals → Tier 2 unlocked (🎉 +14 days total)
- 3 referrals → Tier 3 unlocked (🚀 +21 days total)
- 4 referrals → Tier 4 unlocked (👑 +28 days total)

**SQL Verification After 4 Referrals:**
```sql
SELECT user_id, free_trial_total_days, free_trial_days_remaining
FROM profiles
WHERE email = 'userA@example.com';
```
Should show: `free_trial_total_days = 58` (30 + 28)

---

## 🎨 Visual Features to Test

### Free Trial Referral Dashboard
- ✅ Beautiful gradient background with animated pulses
- ✅ Tier cards scale up and glow when unlocked
- ✅ Lock icon for locked tiers, check icon for unlocked
- ✅ Progress summary cards with large numbers
- ✅ "How It Works" 3-step guide
- ✅ Referral link with copy button (shows "Copied!" animation)
- ✅ Referral list showing all invited users with status badges

### Trial Countdown Banner (Dashboard)
- ✅ Should show updated days remaining after referrals
- ✅ Progress bar should recalculate based on new total days
- ✅ Example: "25 of 37 days remaining (67%)" after 1 referral

---

## 🚨 Edge Cases to Test

### 1. Already Paid Users Can't Use Free Trial Referrals
**Test:**
- Upgrade User A to a paid plan (Starter/Pro/Elite)
- Go to `/dashboard/settings/referrals`
- Should see the **paid referral dashboard** (30% discount codes)
- Should NOT see free trial referral system

### 2. Max Referrals Cap (4 Total)
**Test:**
- After User A has 4 completed referrals, try referring User F
- User F signs up and completes setup
- User A should NOT get additional days (stays at +28 max)

**SQL Check:**
```sql
SELECT COUNT(*) FROM referrals
WHERE referrer_id = 'USER_A_ID' 
  AND status = 'completed' 
  AND referral_type = 'free_trial_extension';
```
Should cap at 4.

### 3. Duplicate Referrals
**Test:**
- Try using the same email twice
- Second sign-up should fail (email already registered)

### 4. Incomplete Referrals Stay Pending
**Test:**
- User G signs up via referral link but doesn't verify email
- Referral should stay `status = 'pending'`
- User A should NOT get extra days yet

**SQL Check:**
```sql
SELECT status FROM referrals WHERE referee_email = 'userG@example.com';
```
Should show: `status = 'pending'`

### 5. Email Verified But No Payment Method
**Test:**
- User H signs up and verifies email but doesn't add payment method
- Referral should stay `status = 'pending'`
- User A should NOT get extra days yet

---

## 🔧 Manual SQL Commands (For Testing)

### Manually Mark Referral as Completed (Testing Only)
```sql
UPDATE referrals
SET status = 'completed', completed_at = NOW()
WHERE referee_email = 'test@example.com';
```

### Manually Extend Trial (Testing Only)
```sql
SELECT extend_trial(
  (SELECT id FROM auth.users WHERE email = 'userA@example.com'),
  7  -- Add 7 days
);
```

### Reset User's Referrals (Testing Only)
```sql
DELETE FROM referrals WHERE referrer_id = 'USER_A_ID';

UPDATE profiles
SET 
  free_trial_total_days = 30,
  free_trial_ends_at = NOW() + INTERVAL '30 days',
  free_trial_days_remaining = 30
WHERE user_id = 'USER_A_ID';
```

### Check All Free Trial Referrals
```sql
SELECT 
  r.referrer_id,
  p.email as referrer_email,
  r.referee_email,
  r.status,
  r.created_at,
  r.completed_at
FROM referrals r
JOIN profiles p ON r.referrer_id = p.user_id
WHERE r.referral_type = 'free_trial_extension'
ORDER BY r.created_at DESC;
```

---

## 📊 Analytics Queries

### Total Free Trial Referrals by Status
```sql
SELECT 
  status,
  COUNT(*) as count
FROM referrals
WHERE referral_type = 'free_trial_extension'
GROUP BY status;
```

### Top Referrers (Free Trial Users)
```sql
SELECT 
  p.email,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
  SUM(CASE WHEN r.status = 'completed' THEN 7 ELSE 0 END) as days_earned
FROM profiles p
LEFT JOIN referrals r ON p.user_id = r.referrer_id AND r.referral_type = 'free_trial_extension'
WHERE p.subscription_tier = 'free_trial'
GROUP BY p.user_id, p.email
HAVING COUNT(CASE WHEN r.status = 'completed' THEN 1 END) > 0
ORDER BY completed_referrals DESC;
```

---

## 🎯 Expected User Journey

### Free Trial User (Referrer)
1. Start 30-day free trial
2. Add payment method
3. Go to Referrals page → see free trial dashboard
4. Copy referral link
5. Share with friends
6. Each friend signs up + verifies email + adds payment → +7 days automatically
7. Watch tiers unlock as more friends join
8. Max 4 referrals = 58 total days (30 + 28)

### Referred User (Referee)
1. Click referral link → `?ref=REFERRER_ID` in URL
2. Sign up for account
3. Verify email
4. Start free trial
5. Add payment method → **Referrer gets +7 days instantly**
6. Can now become a referrer themselves!

---

## ✅ Success Criteria

- [x] Free trial users see new referral dashboard
- [x] Paid users still see old 30% discount referral system
- [x] Referral link contains `?ref=USER_ID`
- [x] Sign-up creates `pending` referral entry
- [x] Email + payment completion triggers `completed` status
- [x] Automatic 7-day extension to referrer's trial
- [x] Tier cards unlock progressively (1→2→3→4)
- [x] Max 4 referrals enforced (28 days cap)
- [x] Trial countdown banner reflects new total days
- [x] SQL trigger handles extension automatically
- [x] Referral list shows all invited users with status

---

## 🐛 Common Issues & Fixes

### Issue: Referral link doesn't work
**Fix:** Make sure the URL parameter is `ref` not `referral_code`
- ✅ Correct: `/login?ref=USER_ID`
- ❌ Wrong: `/login?referral_code=USER_ID`

### Issue: Trial not extending after referral
**Check:**
1. Is referral marked as `completed`?
   ```sql
   SELECT status FROM referrals WHERE referee_email = 'test@example.com';
   ```
2. Is referrer still on `free_trial` tier?
   ```sql
   SELECT subscription_tier FROM profiles WHERE user_id = 'REFERRER_ID';
   ```
3. Has referrer already hit 4 referrals?
   ```sql
   SELECT COUNT(*) FROM referrals 
   WHERE referrer_id = 'REFERRER_ID' 
     AND status = 'completed' 
     AND referral_type = 'free_trial_extension';
   ```

### Issue: Trigger not firing
**Re-run migration:**
```sql
-- Re-create the trigger
DROP TRIGGER IF EXISTS trigger_extend_trial_on_referral_completion ON referrals;
CREATE TRIGGER trigger_extend_trial_on_referral_completion
AFTER UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION extend_trial_on_referral_completion();
```

---

## 🚀 Production Checklist

Before going live:
- [ ] Run `FREE_TRIAL_REFERRAL_MIGRATION.sql` in production
- [ ] Test full flow with 2 real accounts
- [ ] Verify email confirmation works
- [ ] Verify payment method setup works
- [ ] Verify automatic trial extension works
- [ ] Check dashboard displays correctly on mobile
- [ ] Test all 4 tier unlocks
- [ ] Verify max 4 referrals cap
- [ ] Test that paid users don't see free trial referrals
- [ ] Monitor database logs for trigger execution

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase logs (Database > Logs)
3. Run SQL verification queries above
4. Check that migration was applied successfully

Happy testing! 🎉

