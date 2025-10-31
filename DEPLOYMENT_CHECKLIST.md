# 🚀 STERLING AI - DEPLOYMENT CHECKLIST

**Version 2.0 - Ready for Production**  
**Date:** October 31, 2025

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### **1. Database Setup (Supabase)**

- [ ] Run `MASTER_SCHEMA.sql` in Supabase SQL Editor
- [ ] Verify all 12 tables created successfully
- [ ] Check RLS (Row Level Security) is enabled on all tables
- [ ] Verify all policies are active

**Quick Verification Query:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
```
Should show 12 tables.

---

### **2. Environment Variables**

Create `.env.local` with these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe (LIVE MODE for production!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs (LIVE MODE!)
STRIPE_PRICE_ID_STARTER=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_ELITE=price_xxx

# Resend Email
RESEND_API_KEY=re_6Pqyd4Pa_PcjCkoFjgfyfKMTR6Sq8Ns2x
RESEND_ONBOARDING_API_KEY=re_xxx (optional - if using separate account)

# Base URL (UPDATE AFTER DEPLOYMENT!)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

**Checklist:**
- [ ] Supabase URL and keys added
- [ ] Stripe LIVE mode keys added (not test mode!)
- [ ] Stripe price IDs for all three tiers
- [ ] Resend API key added
- [ ] Base URL will be updated after deployment

---

### **3. Stripe Setup (LIVE MODE)**

**Switch to Live Mode in Stripe Dashboard!**

- [ ] Create **Starter** product ($999/month) → Get price ID
- [ ] Create **Pro** product ($1399/month) → Get price ID
- [ ] Create **Elite** product ($1999/month) → Get price ID
- [ ] Copy all 3 price IDs to `.env.local`
- [ ] Create webhook endpoint (will be configured after deployment)

---

### **4. Supabase Configuration**

- [ ] **Authentication → URL Configuration:**
  - Site URL: `https://yourdomain.com`
  - Redirect URLs: `https://yourdomain.com/auth/callback`

- [ ] **API Settings:**
  - Enable Auto-refresh tokens
  - Session timeout: 604800 (7 days)

---

## 🌐 DEPLOYMENT STEPS

### **Option A: Deploy to Vercel (Recommended)**

#### **Step 1: Push to GitHub**
```bash
cd /Users/timothytitenok/life-insurance
git add .
git commit -m "Ready for production deployment"
git push origin main
```

#### **Step 2: Deploy to Vercel**
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Import your `SterlingAI` repository
5. Vercel auto-detects Next.js ✅

#### **Step 3: Add Environment Variables in Vercel**
- Go to Project Settings → Environment Variables
- Add ALL the variables from `.env.local`
- **IMPORTANT:** Use LIVE Stripe keys, not test!

#### **Step 4: Deploy**
- Click "Deploy"
- Wait for build to complete
- You'll get a URL: `your-app.vercel.app`

#### **Step 5: Add Custom Domain** (Optional)
- Settings → Domains → Add Domain
- Follow DNS instructions for your domain registrar
- SSL certificate auto-generated ✅

---

### **Option B: Deploy to Hostinger VPS**

See separate guide in deployment notes.

---

## ⚙️ POST-DEPLOYMENT CONFIGURATION

### **1. Update Environment Variables**

In Vercel (or your hosting), update:
```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

Redeploy after changing!

---

### **2. Configure Stripe Webhook**

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://yourdomain.com/api/stripe/webhook`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** (`whsec_xxx`)
6. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
7. Redeploy

---

### **3. Update Supabase Redirect URLs**

1. Supabase Dashboard → Authentication → URL Configuration
2. Update:
   - **Site URL:** `https://yourdomain.com`
   - **Redirect URLs:** `https://yourdomain.com/auth/callback`

---

### **4. Test Everything!**

- [ ] Visit your live site
- [ ] Create a test account
- [ ] Subscribe to a plan (use real card or Stripe test card)
- [ ] Verify redirect to onboarding
- [ ] Complete onboarding form
- [ ] Check email arrives at `timothytitenok9@gmail.com`
- [ ] Test AI Control Center
- [ ] Test billing page
- [ ] Test referral system
- [ ] Test sign out/sign in

---

## 📋 CRITICAL FILES FOR DEPLOYMENT

### **Must Include:**
- ✅ `supabase/MASTER_SCHEMA.sql` - Complete database schema
- ✅ All environment variables set
- ✅ GitHub repository with all code
- ✅ Stripe products created in LIVE mode
- ✅ Resend account verified

---

## 🐛 COMMON DEPLOYMENT ISSUES

### **Build Fails:**
```bash
# Test locally first
npm run build
```
Fix any errors before deploying.

### **Database Connection Fails:**
- Verify Supabase URL and keys are correct
- Check RLS policies allow access
- Verify service role key is set

### **Stripe Webhook Not Working:**
- Verify webhook URL matches deployment URL
- Check `STRIPE_WEBHOOK_SECRET` is set
- View webhook logs in Stripe Dashboard

### **Emails Not Sending:**
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Ensure sending to verified email in Resend

---

## 🎯 DEPLOYMENT SUCCESS CRITERIA

✅ Site loads on custom domain (or Vercel URL)  
✅ Users can sign up and create accounts  
✅ Stripe checkout works and redirects properly  
✅ Middleware correctly gates dashboard access  
✅ Onboarding emails arrive at `timothytitenok9@gmail.com`  
✅ Contact form emails arrive at `timothytitenok9@gmail.com`  
✅ Dashboard shows correct data  
✅ AI Control Center accessible  
✅ Billing page works with Stripe  
✅ Referral system creates codes  

---

## 📞 SUPPORT

**Issues?** Check:
- Vercel deployment logs
- Browser console for errors
- Supabase logs
- Stripe webhook logs

**Email:** timothytitenok9@gmail.com

---

## 🎉 YOU'RE READY TO DEPLOY!

Follow the steps above carefully and your app will be live! 🚀

