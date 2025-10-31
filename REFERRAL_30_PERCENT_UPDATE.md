# 🎁 Referral Discount Updated to 30%

## ✅ What I Changed:

### **Code Updates:**
- ✅ Coupon code: `REFERRAL20` → `REFERRAL30`
- ✅ All API endpoints updated (checkout, create-checkout)
- ✅ All log messages: 20% → 30%
- ✅ All documentation updated

### **New Discount Amounts:**

| Plan | Original Price | 30% Off | You Pay First Month |
|------|----------------|---------|---------------------|
| **Starter** | $999/mo | -$299.70 | **$699.30** |
| **Pro** | $1,399/mo | -$419.70 | **$979.30** |
| **Elite** | $1,999/mo | -$599.70 | **$1,399.30** |

**After month 1:** They pay full price!

---

## ⚠️ **REQUIRED: Update Stripe Dashboard**

### **YOU MUST DO THIS IN STRIPE:**

**1. Create NEW Coupon:**

Go to: https://dashboard.stripe.com/coupons

Click **"Create coupon"** and enter:

```
Name: Referral Discount - 30% Off First Month
ID: REFERRAL30
Type: Percentage
Percentage off: 30
Duration: Once
```

**Click "Create coupon"**

---

### **2. (Optional) Delete Old Coupon:**

If you had `REFERRAL20` from before, you can delete it (or keep it for legacy users).

---

## 🧪 **Test It:**

1. **Create a referral code** in your app
2. **Open referral link in incognito:**
   ```
   https://yourdomain.com/?ref=YOURCODE
   ```
3. **Sign up** for a new account
4. **Subscribe** to Starter plan
5. **On checkout, you should see:**
   ```
   Subtotal: $999.00
   Discount (REFERRAL30): -$299.70
   Total: $699.30
   ```

---

## 📝 **Stripe API Alternative (If You Prefer):**

Run this in terminal to create coupon via API:

```bash
curl https://api.stripe.com/v1/coupons \
  -u "YOUR_STRIPE_SECRET_KEY:" \
  -d "id=REFERRAL30" \
  -d "percent_off=30" \
  -d "duration=once" \
  -d "name=Referral Discount - 30% Off First Month"
```

Replace `YOUR_STRIPE_SECRET_KEY` with your actual Stripe secret key.

---

## ✅ **Summary:**

**In Your Code:**
- ✅ DONE - All updated to 30%

**In Stripe Dashboard:**
- ⚠️ **YOU MUST CREATE** `REFERRAL30` coupon (see instructions above)

**Once Stripe coupon is created:**
- ✅ Users with referral codes get 30% off automatically
- ✅ Referrers still get $200 credits (unchanged)
- ✅ Everything works!

---

## 💰 **Referral Program Summary:**

**Referrer Gets:**
- $200 in calling credits (instant)

**Referee Gets:**
- 30% off first month (up to $599.70 savings on Elite!)

**Everyone wins!** 🎉

