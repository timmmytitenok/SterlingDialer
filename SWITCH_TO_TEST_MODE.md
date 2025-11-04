# Switch to Stripe Test Mode

## 🎯 What You Need to Do

You need to update your **Vercel Environment Variables** to use Stripe TEST keys instead of LIVE keys.

## 📋 Step-by-Step Instructions

### Step 1: Get Your Stripe TEST Keys

1. Go to https://dashboard.stripe.com
2. **Make sure you're in TEST MODE** (toggle in top right - should show orange "TEST MODE" badge)
3. Click **Developers** → **API Keys**
4. You'll see:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

### Step 2: Get Your Stripe TEST Webhook Secret

1. In Stripe Dashboard (TEST MODE), go to **Developers** → **Webhooks**
2. Click on your webhook endpoint (should point to your production URL)
   - If you don't have one, click **Add endpoint**
   - URL: `https://sterlingdialer.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Click on the webhook
4. Click **Signing secret** → **Reveal**
5. Copy the secret (starts with `whsec_...`)

### Step 3: Update Vercel Environment Variables

1. Go to https://vercel.com
2. Go to your project → **Settings** → **Environment Variables**
3. **Update** these 3 variables (or add if missing):

```
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET_HERE
```

**IMPORTANT:** 
- Make sure to select **Production**, **Preview**, and **Development** for each variable
- Click **Save** after each one

### Step 4: Redeploy Your App

After updating the variables:

1. Go to **Deployments** tab in Vercel
2. Click the **3 dots** on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (~2 minutes)

### Step 5: Update Stripe Price IDs (If Using Subscriptions)

If you have subscription tiers, you need to create TEST mode price IDs:

1. In Stripe Dashboard (TEST MODE), go to **Products**
2. Create products for each tier:
   - **Sterling AI - Starter**: $499/month
   - **Sterling AI - Pro**: $899/month  
   - **Sterling AI - Elite**: $1499/month
3. Copy each Price ID (starts with `price_...`)
4. Update these in Vercel Environment Variables:

```
STRIPE_PRICE_ID_STARTER=price_YOUR_STARTER_PRICE_ID
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
STRIPE_PRICE_ID_ELITE=price_YOUR_ELITE_PRICE_ID
```

### Step 6: Test!

Now you can test safely with NO REAL CHARGES:

**Test Credit Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

## ✅ How to Verify You're in Test Mode

After deployment:

1. Go to your production site: https://sterlingdialer.com
2. Try to subscribe or add a payment method
3. Use the test card above
4. Check Stripe Dashboard - the transaction should appear in **TEST MODE** (orange badge)

## 🔄 Switching Back to Live Mode (When Ready)

When you're ready to go live:

1. Get your LIVE keys from Stripe (switch to LIVE MODE in dashboard)
2. Update the same Vercel environment variables with `sk_live_...` and `pk_live_...`
3. Update webhook secret from LIVE mode
4. Redeploy

## 📝 Current Keys to Replace

You need to find and replace these in your Vercel settings:

| Variable Name | Current (LIVE) | Replace With (TEST) |
|--------------|----------------|---------------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from live) | `whsec_...` (from test) |

## ❓ FAQ

**Q: Will this affect my current customers?**
A: No! Test mode uses a completely separate database. Live customers won't be affected.

**Q: Can I test locally instead?**
A: For webhooks to work, you need to test on production (or use Stripe CLI for local testing).

**Q: How do I know if I'm currently in test or live mode?**
A: Check your Vercel env variables. If `STRIPE_SECRET_KEY` starts with `sk_test_`, you're in test mode.

**Q: What happens if I mix test and live keys?**
A: The app will error. Make sure ALL three keys (secret, publishable, webhook) are from the same mode (all test or all live).

## 🆘 Need Help?

If you're stuck:

1. Double-check you copied the full key (test keys are long!)
2. Make sure you selected all environments (Production, Preview, Development)
3. Make sure you redeployed after changing variables
4. Check Vercel deployment logs for any errors

