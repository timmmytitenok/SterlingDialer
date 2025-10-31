# 🎁 Create 30% Off Referral Coupon in Stripe

## Step 1: Create Coupon in Stripe Dashboard

1. Go to your **Stripe Dashboard**: https://dashboard.stripe.com/coupons
2. Click **"Create coupon"** button
3. Fill in the details:

### Coupon Details:
```
Name: Referral Discount - 30% Off First Month
ID: REFERRAL30
Type: Percentage
Percentage off: 30
Duration: Once (applies to first invoice only)
```

4. **Optional Settings:**
   - Leave "Max redemptions" blank (unlimited)
   - Leave "Redeem by" blank (never expires)

5. Click **Create coupon**

---

## Step 2: Copy the Coupon ID

After creating, you'll see:
```
Coupon ID: REFERRAL30
```

Copy this ID - it's already in the code!

---

## Step 3: Test It

1. Sign up with a referral link
2. Subscribe to any plan
3. On Stripe checkout, you should see:
   ```
   Subtotal: $999.00
   Discount (REFERRAL30): -$299.70
   Total: $699.30
   ```

---

## Alternative: Create via API (if needed)

Run this in your terminal to create the coupon programmatically:

```bash
curl https://api.stripe.com/v1/coupons \
  -u "YOUR_STRIPE_SECRET_KEY:" \
  -d "id=REFERRAL30" \
  -d "percent_off=30" \
  -d "duration=once" \
  -d "name=Referral Discount - 30% Off First Month"
```

Replace `YOUR_STRIPE_SECRET_KEY` with your actual key from `.env.local`

---

## Pricing Examples with Discount:

| Plan | Original Price | 30% Off | First Month Total |
|------|---------------|---------|-------------------|
| Starter | $999 | -$299.70 | **$699.30** |
| Pro | $1,399 | -$419.70 | **$979.30** |
| Elite | $1,999 | -$599.70 | **$1,399.30** |

After the first month, they pay the full price!

---

## ✅ That's it!

Once the coupon is created in Stripe, the code will automatically apply it when users subscribe with a referral code.

