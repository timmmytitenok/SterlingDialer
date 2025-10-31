# 🎁 STERLING Public Referral Code

## Overview

**STERLING** is a public referral code that anyone can use to get **30% off their first month**!

This is perfect for:
- ✅ Marketing campaigns
- ✅ Social media promotions  
- ✅ Giving everyone a discount without individual referrals
- ✅ Launch promotions

---

## 🚀 How to Set It Up

### **Step 1: Run SQL in Supabase**

Go to Supabase SQL Editor and run:

```sql
-- Create STERLING referral code
-- Replace 'YOUR_EMAIL_HERE' with your email

INSERT INTO referral_codes (user_id, code, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE' LIMIT 1),
  'STERLING',
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- Verify it was created
SELECT code, created_at FROM referral_codes WHERE code = 'STERLING';
```

### **Step 2: Share It Everywhere!**

**Public Landing Page:**
```
Use code STERLING for 30% off! 🎉
```

**Social Media:**
```
Get started with Sterling AI!
Use code STERLING at signup for 30% off your first month.
https://sterlingai.com/?ref=STERLING
```

**Email Campaigns:**
```
Special Offer: Get 30% off with code STERLING
```

---

## 🎯 How It Works

### **For Users:**

**With referral link:**
```
https://yourdomain.com/?ref=STERLING
```
- Page auto-fills "STERLING" in referral code field
- User signs up
- Gets 30% off automatically ✅

**Manual entry:**
- User signs up normally
- Enters "STERLING" in referral code field
- Gets 30% off ✅

### **For You:**

**Option A: Collect $200 per STERLING use (Default)**
- STERLING code is tied to YOUR account
- Every person who uses it gives YOU $200 credits
- You get paid for your marketing! 💰

**Option B: Pure Discount (No Credits)**
- Modify the code to skip crediting for STERLING
- Just gives discount, no $200 reward
- See implementation below

---

## 💰 Option A: Default Behavior

**Current behavior:**
1. User signs up with `STERLING`
2. User gets 30% off first month ✅
3. YOU get $200 in credits ✅

**Your credits could add up fast:**
- 10 signups with STERLING = $2,000 in credits!
- 50 signups = $10,000!
- 100 signups = $20,000!

---

## 🎁 Option B: Pure Discount (Optional)

If you want STERLING to ONLY give discount (no $200 credits to anyone):

**Add this to** `app/api/referral/credit/route.ts`:

```typescript
// After line 31 (after finding referral):

// Skip crediting for public STERLING code
if (referral.referral_code === 'STERLING') {
  console.log('ℹ️ STERLING public code used - applying discount only, no credit');
  
  // Mark as credited so it doesn't process again
  await supabase
    .from('referrals')
    .update({
      status: 'credited',
      completed_at: new Date().toISOString(),
      credited_at: new Date().toISOString()
    })
    .eq('id', referral.id);
  
  return NextResponse.json({ 
    success: true,
    message: 'Public code - discount applied'
  });
}
```

---

## 📊 Marketing Use Cases

### **Social Media Posts:**
```
🚀 Launch Special!
Sign up now with code STERLING
Get 30% off your first month

Start automating your insurance sales today!
[Sign Up Link]
```

### **Email Signature:**
```
---
Want to 10x your appointments?
Try Sterling AI - Use code STERLING for 30% off
sterlingai.com/?ref=STERLING
```

### **Paid Ads:**
```
Headline: Automate Your Insurance Calls 24/7
CTA: Use Code STERLING - Save 30%
URL: sterlingai.com/?ref=STERLING
```

---

## ✅ Advantages of STERLING Code

1. **No barriers** - Everyone can get discount
2. **Trackable** - See how many people use it
3. **Flexible** - Can enable/disable anytime
4. **Simple** - Easy to remember and share
5. **Professional** - Your company name = your code

---

## 📈 Tracking STERLING Usage

**See how many people used STERLING:**

```sql
SELECT 
  COUNT(*) as total_uses,
  COUNT(CASE WHEN status = 'credited' THEN 1 END) as subscribed_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM referrals
WHERE referral_code = 'STERLING';
```

**See all STERLING users:**

```sql
SELECT 
  u.email,
  u.created_at as signup_date,
  r.status,
  r.credited_at,
  s.subscription_tier
FROM referrals r
JOIN auth.users u ON r.referee_id = u.id
LEFT JOIN subscriptions s ON r.referee_id = s.user_id
WHERE r.referral_code = 'STERLING'
ORDER BY u.created_at DESC;
```

---

## 🎯 Quick Setup Summary

1. ✅ Run SQL: Create STERLING code (tied to your email)
2. ✅ Create REFERRAL30 coupon in Stripe (30% off)
3. ✅ Share STERLING everywhere
4. 💰 Collect $200 per signup (or skip credits with Option B)

**That's it!** 🚀

---

## ⚠️ Important Notes

- **STERLING** works exactly like any other referral code
- Users get 30% off first month
- After month 1, they pay full price
- Code never expires
- Unlimited uses
- Can be disabled by deleting from `referral_codes` table

**Your universal discount code is ready!** 🎉

