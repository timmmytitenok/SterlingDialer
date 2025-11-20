# 🔧 Referral "Pending" Status - Fixed & Debug Guide

## What Was Fixed

### Problem:
- Referrals stuck on "Pending" status forever
- Even after user added card, referral not marked as "Completed"
- Referrer never got +7 days trial extension

### Root Cause:
- Old system waited for **email verification**
- Email verification is **disabled** now
- Referrals never moved from "pending" to "completed"

---

## ✅ Fixes Applied

### 1. **Webhook Now Auto-Completes Referrals**
When user adds card for trial, webhook:
- ✅ Finds pending referrals by `referee_id`
- ✅ Marks as `status: 'completed'`
- ✅ Extends referrer's trial (+7 days)
- ✅ Updates BOTH database AND Stripe

### 2. **Removed Email Verification Requirement**
- `/api/referral/complete-signup/route.ts` - No longer checks email
- Now only requires payment method on file

### 3. **Fixed Metadata Lookup**
- Trial activation now sets BOTH `user_id` AND `supabase_user_id`
- Webhook checks both keys for fallback
- More reliable user lookup

---

## 🧪 How To Test

### Step 1: Run Debug SQL
In Supabase SQL Editor, run:
```
DEBUG_REFERRAL_STATUS.sql
```

This shows:
- All recent referrals with names
- Which ones are pending vs completed
- If referee has payment method on file

### Step 2: Test New Referral
1. **Delete old pending referral** (use admin trash button)
2. **Share your referral link** (copy from dashboard)
3. **Open in incognito window**
4. **Sign up with test email**
5. **Add card during trial activation**
6. **Check terminal/console logs** for:

```
✅ Webhook received: checkout.session.completed
📦 Processing subscription from checkout
🔍 Checking for pending free trial referrals...
🎯 Found pending referral - marking as completed!
✅ Referral marked as COMPLETED!
🎁 Extending referrer's trial...
✅ Extended trial in DATABASE and STRIPE to: [DATE]
🎉 Referrer gets +7 days!
```

### Step 3: Verify in Dashboard
Go to Settings → Referrals:
- Should show "Completed ✅" (not "Pending ⏰")
- Referrer should see +7 days added

---

## 🔍 Debugging Checklist

### If Still Shows "Pending":

**1. Check if referral was created:**
```sql
SELECT * FROM referrals 
WHERE referee_email = 'test@example.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

Should show:
- ✅ `status: 'pending'`
- ✅ `referrer_id` matches your user ID
- ✅ `created_at` is recent

**2. Check if webhook fired:**
Look in your terminal for:
```
✅ Webhook received: checkout.session.completed
```

If you DON'T see this, webhook isn't being triggered!

**3. Check if user lookup succeeded:**
Look for:
```
✅ Found user for customer: [USER_ID]
```

If you see:
```
❌ No user found for customer
```

Then the customer ID lookup failed!

**4. Check if pending referral was found:**
Look for:
```
🔍 Checking for pending free trial referrals...
🎯 Found pending referral
```

If you see:
```
ℹ️ No pending referrals found
```

Then the referral wasn't found in database!

---

## 🚨 Manual Fix (If Needed)

If webhook didn't work, manually complete the referral:

```sql
-- 1. Find the pending referral
SELECT * FROM referrals 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- 2. Mark it as completed (replace the ID)
UPDATE referrals
SET 
  status = 'completed',
  completed_at = NOW()
WHERE id = 'PASTE_REFERRAL_ID_HERE';

-- 3. Manually extend referrer's trial
UPDATE profiles
SET 
  free_trial_ends_at = free_trial_ends_at + INTERVAL '7 days',
  free_trial_total_days = COALESCE(free_trial_total_days, 30) + 7
WHERE user_id = 'PASTE_REFERRER_USER_ID_HERE';

-- 4. Verify
SELECT 
  u.email,
  p.free_trial_ends_at,
  p.free_trial_total_days
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.user_id = 'PASTE_REFERRER_USER_ID_HERE';
```

**Note:** This only fixes the database. You'll need to manually update Stripe subscription trial_end in Stripe Dashboard.

---

## 🎯 Expected Webhook Flow

### When Someone Uses Your Referral:

```
1. User clicks: /signup?ref=YOUR_UUID
   ↓
2. User signs up → Referral created (status: 'pending')
   ↓
3. User clicks "Add Card & Start Trial"
   ↓
4. Stripe checkout opens → User enters card
   ↓
5. Checkout completes → Stripe sends webhook
   ↓
6. Webhook: checkout.session.completed
   ↓
7. Webhook retrieves subscription
   ↓
8. Webhook looks up user by customer_id
   ↓
9. Webhook finds pending referral for this user
   ↓
10. Webhook marks referral as 'completed' ✅
   ↓
11. Webhook extends YOUR trial +7 days
   ↓
12. Updates both database AND Stripe ✅
   ↓
13. Your dashboard shows "Completed ✅"
```

---

## 💡 Common Issues

### Issue: "No user found for customer"
**Cause:** Customer ID not saved to profile or metadata missing

**Fix:**
```sql
-- Update profile with customer ID
UPDATE profiles
SET stripe_customer_id = 'cus_xxxxx'
WHERE user_id = 'user-id-here';
```

### Issue: "No pending referrals found"
**Cause:** Referral wasn't created during signup

**Check:**
```sql
SELECT * FROM referrals 
WHERE referee_id = 'new-user-id';
```

If empty, the signup didn't create the referral!

### Issue: Referral created but status stays pending
**Cause:** Webhook not reaching the completion code

**Check terminal for:**
- ✅ "Webhook received: checkout.session.completed"
- ✅ "Processing subscription from checkout"
- ✅ "Checking for pending free trial referrals"

If missing, webhook flow is breaking before it reaches referral code!

---

## ✅ Summary

### What Should Happen Now:
1. ✅ User signs up with referral → Status: 'pending'
2. ✅ User adds card → Webhook fires
3. ✅ Webhook marks referral as 'completed'
4. ✅ Referrer gets +7 days (DB + Stripe)
5. ✅ Dashboard shows "Completed ✅"

### Files Changed:
- ✅ `/api/trial/activate/route.ts` - Added supabase_user_id metadata
- ✅ `/api/stripe/webhook/route.ts` - Auto-completes pending referrals
- ✅ `/api/referral/complete-signup/route.ts` - Removed email requirement

**Test it out and check the webhook logs!** 🚀

