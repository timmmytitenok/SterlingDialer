# How to Test Referrals on Production WITHOUT Real Charges

## ✅ Stripe Test Mode Setup

Your production app should already be using **Stripe Test Mode** (test API keys), which means:
- **NO REAL CHARGES** are made
- You can use test credit cards
- Everything works exactly like production

## 🧪 Stripe Test Credit Cards

Use these cards to test payments (they never charge real money):

### Success Card:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any ZIP (e.g., 12345)
```

### Other Test Cards:
- **4000 0025 0000 3155** - Requires 3D Secure authentication
- **4000 0000 0000 9995** - Declined (insufficient funds)
- **4000 0000 0000 0002** - Declined (generic)

## 📋 Testing Steps

### Step 1: Create Test Accounts

1. **Account A** (Referrer - YOU)
   - Sign up at https://sterlingdialer.com
   - Use email: `yourname+referrer@gmail.com`
   - Start free trial
   - Add test card: `4242 4242 4242 4242`

2. **Account B** (Referee - TEST)
   - Get referral link from Account A
   - Sign up using the referral link
   - Use email: `yourname+referee@gmail.com`
   - Verify email
   - Add test card: `4242 4242 4242 4242`
   - Complete first refill purchase

3. **Check Account A**
   - Should see +7 days added to trial
   - Check Settings → Referrals page

### Step 2: Check Vercel Logs

Go to Vercel → Your Project → Deployments → Latest → Runtime Logs

Look for these log messages:

**When referee signs up:**
```
🎁 Creating referral: {...}
✅ Using service role client
🔍 Looking up referrer profile...
✅ Referrer found: free_trial
📝 Creating referral entry...
🎉 SUCCESS! Free trial referral created
```

**When referee adds payment method:**
```
🎁 First refill detected - checking for referral completion
🔍 Looking for pending referral for user: [USER_ID]
📊 Referral query result: FOUND
✅ Email verified! Proceeding with referral completion...
✅ Referral marked as completed
🎉 SUCCESS! Added 7 days to referrer's trial!
```

### Step 3: Verify in Supabase

Run this SQL query in Supabase SQL Editor:

```sql
-- Check all referrals
SELECT 
  r.id,
  r.status,
  r.created_at,
  r.completed_at,
  auth_referrer.email as referrer_email,
  auth_referee.email as referee_email,
  p_referrer.free_trial_ends_at as referrer_trial_ends,
  p_referrer.free_trial_total_days as referrer_total_days
FROM referrals r
LEFT JOIN auth.users auth_referrer ON r.referrer_id = auth_referrer.id
LEFT JOIN auth.users auth_referee ON r.referee_id = auth_referee.id
LEFT JOIN profiles p_referrer ON r.referrer_id = p_referrer.user_id
ORDER BY r.created_at DESC
LIMIT 5;
```

## 🔧 If You're Using REAL Stripe Keys (Production Mode)

If your production app is using LIVE Stripe keys instead of TEST keys, you need to:

### Option 1: Switch to Test Mode (Recommended)

1. Go to Vercel Dashboard
2. Go to your project → Settings → Environment Variables
3. Update these variables to use TEST keys:
   ```
   STRIPE_SECRET_KEY=sk_test_...  (not sk_live_...)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  (not pk_live_...)
   STRIPE_WEBHOOK_SECRET=whsec_...  (from test mode webhook)
   ```
4. Redeploy

### Option 2: Create a Staging Environment

1. Create a new Vercel project for staging
2. Use test Stripe keys
3. Use a subdomain like `staging.sterlingdialer.com`
4. Test there instead

## 💡 Pro Tip: Use Gmail + Trick

Gmail ignores everything after a `+` sign, so you can create multiple test accounts with one email:

- `yourname+test1@gmail.com` → goes to `yourname@gmail.com`
- `yourname+test2@gmail.com` → goes to `yourname@gmail.com`
- `yourname+referrer@gmail.com` → goes to `yourname@gmail.com`
- `yourname+referee@gmail.com` → goes to `yourname@gmail.com`

All emails go to your inbox, but Supabase sees them as different accounts!

## ❓ How to Check if You're in Test Mode

Look at your Stripe Dashboard:
- Top left corner should say **"TEST MODE"** with an orange badge
- If it says **"LIVE MODE"**, you're using real keys

Or check your environment variables in Vercel:
- `STRIPE_SECRET_KEY` starts with `sk_test_...` = Test Mode ✅
- `STRIPE_SECRET_KEY` starts with `sk_live_...` = Live Mode ⚠️

## 🚨 Current Issue

Your production app needs to be in **TEST MODE** for safe testing. Check your Vercel environment variables and make sure you're using test keys, not live keys!

