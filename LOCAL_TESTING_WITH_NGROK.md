# Local Testing with Ngrok

## 🚀 Quick Setup

### Step 1: Start Your Local Dev Server
```bash
npm run dev
```

Your app should be running on `http://localhost:3000`

### Step 2: Start Ngrok Tunnel
Open a **new terminal** and run:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**Copy that HTTPS URL** (e.g., `https://abc123xyz.ngrok-free.app`)

### Step 3: Update Your .env.local File

Open `.env.local` and update/add this line:
```bash
NEXT_PUBLIC_APP_URL=https://YOUR_NGROK_URL.ngrok-free.app
```

**Example:**
```bash
NEXT_PUBLIC_APP_URL=https://abc123xyz.ngrok-free.app
```

### Step 4: Update Stripe Webhook

1. Go to https://dashboard.stripe.com (TEST MODE)
2. Go to **Developers** → **Webhooks**
3. Add a new endpoint or edit existing:
   - **Endpoint URL:** `https://YOUR_NGROK_URL.ngrok-free.app/api/stripe/webhook`
   - **Events to listen for:**
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Click **Add endpoint**
5. Click on the webhook → **Signing secret** → **Reveal**
6. Copy the secret (starts with `whsec_...`)
7. Update your `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

### Step 5: Update Supabase Redirect URLs

1. Go to https://supabase.com
2. Go to your project → **Authentication** → **URL Configuration**
3. Add your ngrok URL to **Redirect URLs**:
   - `https://YOUR_NGROK_URL.ngrok-free.app/**`

### Step 6: Restart Your Dev Server

Stop your `npm run dev` and restart it:
```bash
npm run dev
```

## 🧪 Now Test the Referral System!

### Create Account A (Referrer)
1. Go to `https://YOUR_NGROK_URL.ngrok-free.app`
2. Sign up with: `yourname+referrer@gmail.com`
3. Verify email
4. Start free trial
5. Add test card: `4242 4242 4242 4242`
6. Go to Settings → Referrals
7. Click **Sign Up** to get your referral link
8. **Copy the link** (should use your ngrok URL)

### Create Account B (Referee)
1. **Open an incognito/private window**
2. **Paste the referral link** from Account A
3. Sign up with: `yourname+referee@gmail.com`
4. Verify email (check your inbox)
5. Go to Settings → Call Balance
6. Add test card: `4242 4242 4242 4242`
7. Complete first refill purchase

### Check the Results!
1. Go back to Account A (referrer)
2. Go to Settings → Referrals
3. You should see **+7 days** added to your trial!
4. Check your terminal logs for:
   ```
   🎁 Creating referral: {...}
   🎉 SUCCESS! Free trial referral created
   🎁 First refill detected - checking for referral completion
   🎉 SUCCESS! Added 7 days to referrer's trial!
   ```

## 📝 Your .env.local Should Look Like:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (TEST MODE)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs (TEST MODE)
STRIPE_PRICE_ID_STARTER=price_YOUR_STARTER_ID
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
STRIPE_PRICE_ID_ELITE=price_YOUR_ELITE_ID

# Ngrok URL (IMPORTANT!)
NEXT_PUBLIC_APP_URL=https://YOUR_NGROK_URL.ngrok-free.app

# Email (Resend)
RESEND_API_KEY=your_resend_key
ADMIN_EMAIL=your_admin_email@gmail.com

# N8N Webhook (if using)
N8N_WEBHOOK_URL=your_n8n_webhook_url

# Master Password (for admin access)
MASTER_PASSWORD=your_master_password
```

## ⚠️ Important Notes

1. **Ngrok URL changes every time** you restart it (unless you have a paid plan)
   - You'll need to update `.env.local` and Stripe webhook each time
   - Or get a static domain with ngrok pro

2. **Keep ngrok running** - don't close that terminal while testing

3. **Use Incognito/Private browsing** for the referee account so sessions don't conflict

4. **Check terminal logs** - you'll see all the webhook logs in real-time!

## 🎯 Test Credit Cards (No Real Charges)

```
Success: 4242 4242 4242 4242
Requires 3D Secure: 4000 0025 0000 3155
Declined: 4000 0000 0000 9995

Expiry: Any future date (12/34)
CVC: Any 3 digits (123)
ZIP: Any ZIP (12345)
```

## ✅ Checklist

- [ ] `npm run dev` is running
- [ ] `ngrok http 3000` is running
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL` set to ngrok URL
- [ ] Stripe webhook points to ngrok URL
- [ ] Supabase has ngrok URL in redirect URLs
- [ ] Dev server restarted after changing `.env.local`
- [ ] Using TEST mode Stripe keys

## 🆘 Troubleshooting

**Webhook not firing?**
- Check Stripe Dashboard → Webhooks → Your endpoint → Logs
- Make sure ngrok is still running
- Make sure URL is correct in Stripe

**Referral link has wrong domain?**
- Check `NEXT_PUBLIC_APP_URL` in `.env.local`
- Restart dev server after changing it

**Can't access site through ngrok?**
- Click through the ngrok warning page (first time only)
- Make sure ngrok is still running

**Email verification not working?**
- Add ngrok URL to Supabase redirect URLs
- Check your spam folder for verification email

Now you can test everything locally with real webhook events! 🎉

