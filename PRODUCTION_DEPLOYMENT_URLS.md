# 🚀 Production Deployment - URLs Reference

**Production Domain:** https://sterlingdailer.com/

---

## ✅ URLs Already Updated in Code

### 1. **Cal.ai Webhook URL** (for users)
Give this to users during onboarding:
```
https://sterlingdailer.com/api/appointments/cal-webhook
```

**Where it's shown:**
- Onboarding email (`app/api/onboarding/submit/route.ts`) ✅ Updated
- Setup guides (`CAL_AI_SETUP_GUIDE.md`, `CAL_AI_QUICK_START.md`) ✅ Updated

**Users paste this into:**
- Cal.ai → Settings → Webhooks → Subscriber URL

---

## 🔧 URLs You Need to Update Manually

### 2. **Environment Variable**
Add to your production hosting (Vercel/Netlify):
```bash
NEXT_PUBLIC_APP_URL=https://sterlingdailer.com
```

**Used for:**
- Referral link generation
- Stripe redirect URLs
- Email templates

---

### 3. **Stripe Webhook**
Update in Stripe Dashboard:
```
https://sterlingdailer.com/api/stripe/webhook
```

**Where to update:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Developers → Webhooks
3. Update endpoint URL

**Events to include:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## 📡 Webhook Endpoints (Already Working)

These endpoints are already built and will work automatically:

### From N8N → Your App:
```
https://sterlingdailer.com/api/calls/update
https://sterlingdailer.com/api/ai-control/update-queue
https://sterlingdailer.com/api/ai-control/complete
```

### From Cal.ai → Your App:
```
https://sterlingdailer.com/api/appointments/cal-webhook
```

### From Stripe → Your App:
```
https://sterlingdailer.com/api/stripe/webhook
```

---

## 🎯 Quick Deployment Checklist

Before going live:

- [ ] Add `NEXT_PUBLIC_APP_URL=https://sterlingdailer.com` to production env
- [ ] Update Stripe webhook URL in Stripe Dashboard
- [ ] Test a Cal.ai booking with production webhook URL
- [ ] Test a Stripe payment to verify webhook works
- [ ] Verify referral links generate with correct domain
- [ ] Test N8N callbacks to production endpoints

---

## 📝 What Users Need from You

When onboarding users, provide them with:

```
Cal.ai Webhook URL: https://sterlingdailer.com/api/appointments/cal-webhook

Instructions:
1. Go to Cal.ai Settings → Webhooks
2. Paste the URL above in "Subscriber URL"
3. Enable the webhook toggle
4. Select "Booking Created" event
5. Click "Create Webhook"
```

**That's it!** The code handles everything else automatically. 🎉

---

## 🆘 Troubleshooting

**If Cal.ai bookings aren't showing:**
- Verify the webhook URL is correct in Cal.ai settings
- Check terminal logs for webhook received messages
- Make sure `CAL_AI_USER_ID` env variable is set

**If Stripe payments aren't working:**
- Verify webhook URL in Stripe dashboard
- Check Stripe webhook signing secret is correct
- View Stripe webhook logs for errors

**If referral links are broken:**
- Verify `NEXT_PUBLIC_APP_URL` is set in production
- Check that the domain matches exactly (no trailing slash)

---

## ✨ You're Ready!

All webhook endpoints are configured and the URLs are documented. Deploy and go live! 🚀

