# 📧 Resend Setup - Two Separate Accounts

## ✅ What's Configured:

You now have **TWO separate Resend accounts** for different purposes:

### 1️⃣ **Contact Form** (Landing Page)
- **API Key:** `RESEND_API_KEY`
- **Sends To:** `timothytitenok9@gmail.com`
- **Used For:** General contact inquiries from your website

### 2️⃣ **Onboarding Form** (AI Setup)
- **API Key:** `RESEND_ONBOARDING_API_KEY`
- **Sends To:** `SterlingDailer@gmail.com`
- **Used For:** New user AI agent setup requests

---

## 🔑 **Environment Variables You Need:**

Add these to your `.env.local` file:

```bash
# Resend - Contact Form (timothytitenok9 account)
RESEND_API_KEY=re_YOUR_CONTACT_FORM_API_KEY

# Resend - Onboarding (SterlingDailer account)
RESEND_ONBOARDING_API_KEY=re_YOUR_ONBOARDING_API_KEY
```

---

## 📋 **How to Get Your Resend API Keys:**

### **For Contact Form (timothytitenok9@gmail.com):**

1. Go to: https://resend.com
2. **Sign up/login** with `timothytitenok9@gmail.com`
3. Go to **API Keys**
4. Click **"Create API Key"**
5. Name: `Sterling AI Contact Form`
6. Copy the key (starts with `re_...`)
7. Add to `.env.local` as `RESEND_API_KEY`

### **For Onboarding Form (SterlingDailer@gmail.com):**

1. **Sign out** of current Resend account
2. Go to: https://resend.com
3. **Sign up** with `SterlingDailer@gmail.com`
4. Go to **API Keys**
5. Click **"Create API Key"**
6. Name: `Sterling AI Onboarding`
7. Copy the key (starts with `re_...`)
8. Add to `.env.local` as `RESEND_ONBOARDING_API_KEY`

---

## 🎯 **Email Flow:**

### **Contact Form Submission:**
```
User fills contact form → /api/contact 
→ Uses RESEND_API_KEY
→ Sends to timothytitenok9@gmail.com ✓
```

### **Onboarding Form Submission:**
```
User fills onboarding form → /api/onboarding/submit
→ Uses RESEND_ONBOARDING_API_KEY
→ Sends to SterlingDailer@gmail.com ✓
```

---

## ⚙️ **Your .env.local Should Look Like:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_STARTER=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_ELITE=price_xxx

# Resend - Contact Form
RESEND_API_KEY=re_6Pqyd4Pa_PcjCkoFjgfyfKMTR6Sq8Ns2x

# Resend - Onboarding (NEW!)
RESEND_ONBOARDING_API_KEY=re_YOUR_NEW_KEY_HERE

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🧪 **Test It:**

### **Test Contact Form:**
1. Go to `/contact` on your site
2. Fill out the form
3. Submit
4. Check `timothytitenok9@gmail.com` for the email

### **Test Onboarding Form:**
1. Go to `/onboarding/form`
2. Fill out the form
3. Submit
4. Check `SterlingDailer@gmail.com` for the email

---

## ✅ **Next Steps:**

1. **Sign up for new Resend account** with `SterlingDailer@gmail.com`
2. **Get the API key** from that account
3. **Add to `.env.local`** as `RESEND_ONBOARDING_API_KEY=re_xxx`
4. **Restart your dev server** (`npm run dev`)
5. **Test the onboarding form!**

---

**Want me to walk you through creating the new Resend account?** 😊

