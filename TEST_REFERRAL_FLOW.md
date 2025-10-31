# 🧪 Test Complete Referral Flow

## ✅ What Happens Now (Complete Flow):

### 1️⃣ Friend Signs Up with Referral Link
- User 1 (referrer) creates code: `MYCODE24`
- User 1 shares link: `yoursite.com/login?ref=MYCODE24`
- **User 2 (referee) clicks link** and signs up
- ✅ `referred_by = 'MYCODE24'` saved in User 2's profile
- ✅ Entry created in `referrals` table with `status='pending'`

### 2️⃣ Friend Subscribes (Gets Discount)
- User 2 goes to pricing page
- Clicks "Subscribe" on any plan
- ✅ **Stripe checkout shows 20% discount automatically!**
- User 2 pays discounted price

### 3️⃣ Referrer Gets Credited (Automatic)
- Stripe webhook fires: `checkout.session.completed`
- Webhook checks if User 2 has `referred_by` field ✅
- Webhook calls `/api/referral/credit` with User 2's ID
- ✅ **User 1 gets $200 added to balance instantly!**
- ✅ Referral status changes: `pending` → `credited`
- ✅ Transaction recorded in `balance_transactions`

### 4️⃣ Both See Results
- **User 1 (referrer):**
  - Balance increased by $200
  - Referral dashboard shows: "1 Completed Referral"
  - Shows "$200 Credits Earned"
  
- **User 2 (referee):**
  - Got 30% off first month
  - Subscription active
  - Can refer others too!

---

## 🧪 How to Test It End-to-End

### Step 1: Create Referral Code (Account 1)
1. Login as Account 1
2. Go to `/dashboard/settings/referrals`
3. Create code: `MYCODE24`
4. Copy the referral link

### Step 2: Sign Up with Referral (Account 2)
1. Open **incognito/private window**
2. Paste the referral link (or go to `/login?ref=MYCODE24`)
3. Sign up with new email
4. Verify you see: "✓ Using referral code: MYCODE24"
5. Check your terminal - should see:
   ```
   ✅ Profile updated with referral code
   ✅ User WILL receive 20% discount on first subscription!
   ```

### Step 3: Verify Discount Will Apply
With Account 2, visit:
```
http://localhost:3000/api/debug/check-referral
```

Should show:
```json
{
  "referred_by": "MYCODE24",
  "hasReferral": true,
  "shouldGetDiscount": "YES - 20% discount should apply!"
}
```

### Step 4: Subscribe (Account 2)
1. Stay logged in as Account 2
2. Go to `/pricing` or `/dashboard/settings/billing`
3. Click "Subscribe" on any plan
4. **Watch for 20% discount on Stripe checkout page!**
5. Complete payment (use test card: `4242 4242 4242 4242`)

### Step 5: Watch the Magic! ✨
**In your terminal, you should see:**
```
🎁 Checking for referral...
🎯 User [user2-id] was referred with code MYCODE24
💰 Found referral: Referrer [user1-id] will receive $200
📊 Referrer balance: $0 → $200 (+$200)
✅ Successfully credited $200 to referrer [user1-id]
✅ Successfully credited referrer: $200
```

### Step 6: Verify Results

**Account 1 (Referrer):**
1. Go to `/dashboard/settings/referrals`
2. Should see:
   - Total Referrals: **1**
   - Credits Earned: **$200**
   - Referral list shows the friend as "✅ Credited"

**Account 1 Balance:**
1. Go to `/dashboard/settings/billing`
2. Call balance should show: **$200.00**

**Account 2 (Referee):**
1. Go to `/dashboard/settings/billing`
2. Subscription should be active
3. First payment shows discounted amount

---

## 🔍 Debug Checklist

If it doesn't work, check these:

### ❌ Discount Not Applied
- Run: `/api/debug/check-referral` (should show `referred_by`)
- Check terminal for: `🎁 ✅ User was referred with code`
- Verify `REFERRAL30` coupon exists in Stripe

### ❌ Referrer Not Credited
- Check terminal for: `✅ Successfully credited referrer: $200`
- Verify `referrals` table has entry with `status='credited'`
- Check `balance_transactions` table for transaction record
- Verify `call_balance` table shows increased balance

### ❌ referred_by is null
- RLS policy issue - run `FIX_PROFILE_UPDATE_RLS.sql`
- Check terminal during signup for errors
- Manually fix: `UPDATE profiles SET referred_by = 'CODE' WHERE user_id = '...'`

---

## 💰 Expected Results

| Plan | Original Price | With 30% Off | Referrer Gets |
|------|---------------|--------------|---------------|
| Starter | $999 | **$699.30** | **$200** |
| Pro | $1,399 | **$979.30** | **$200** |
| Elite | $1,999 | **$1,399.30** | **$200** |

**After first month:** Referee pays full price, referrer keeps the $200!

---

## 🎉 Success Indicators

When everything works, you'll see:

**Terminal Logs:**
```
✅ Profile updated with referral code
✅ User WILL receive 20% discount on first subscription!
✅ 20% referral discount applied to checkout
✅ Successfully credited referrer: $200
```

**Stripe Checkout:**
```
Subtotal: $999.00
Discount (REFERRAL30): -$299.70
Total: $699.30
```

**Referrer Dashboard:**
```
Total Referrals: 1
Credits Earned: $200
✅ Credited
```

---

## 🚀 Production Checklist

Before going live:

- ✅ `REFERRAL30` coupon created in Stripe
- ✅ RLS policies allow profile updates
- ✅ Service role has permissions on all tables
- ✅ `NEXT_PUBLIC_APP_URL` set correctly in .env
- ✅ Stripe webhook secret configured
- ✅ Test the complete flow end-to-end

---

**The system is now fully automated! Referrers get paid instantly when friends subscribe!** 🎉💰

