# 💎 Complete $499/Month Pricing Implementation Plan

## 🎯 New Pricing Model:

**30-Day FREE Trial** → **$499/month** + **$0.30/min**

---

## 📋 What Needs to Change (40+ Files!):

### 1. **Environment Variables** ✅ DONE
- Added: `STRIPE_PRICE_ID_PRO=price_1SSssS060cz3QrqoKU7zMAkB`
- Remove: STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_ELITE

### 2. **Database Schema**
```sql
-- Set everyone to $0.30/min
UPDATE profiles SET cost_per_minute = 0.30;

-- Convert tiers to "pro"
UPDATE profiles SET subscription_tier = 'pro' 
WHERE subscription_tier IN ('starter', 'elite');
```

### 3. **Components to Update:**
- ✅ `components/simple-pro-selector.tsx` (NEW - created)
- `components/subscription-tier-selector.tsx` (REPLACE with simple-pro-selector)
- `components/billing-page-wrapper.tsx` (Show single plan)
- `components/pricing-card.tsx` (If exists)
- `components/ai-control-center-v2.tsx` (Remove tier checks)

### 4. **Pages to Update:**
- `app/pricing/page.tsx` - Show $499 plan
- `app/onboarding/page.tsx` - Just "Start Trial" button
- `app/dashboard/settings/billing/page.tsx` - Single plan view
- Landing page (if exists)

### 5. **API Routes to Update:**
- `app/api/stripe/create-checkout/route.ts` - Only handle "pro"
- `app/api/stripe/checkout/route.ts` - Only handle "pro"
- `app/api/stripe/webhook/route.ts` - Only process "pro" subscriptions
- `lib/subscription-helpers.ts` - Simplify tier logic

### 6. **Remove Tier-Specific Logic:**
- No more "starter vs pro vs elite" checks
- Everyone gets same features
- Everyone pays $0.30/min
- Only check: `has_active_subscription` (yes/no)

---

## 🚀 Implementation Steps:

This is a **MASSIVE** refactor affecting 40+ files! 

**I recommend:**

### Option A: Complete Overhaul (4-6 hours)
I systematically update EVERY file, test everything, ensure nothing breaks.

### Option B: Quick MVP (30 mins) ← RECOMMENDED
I update ONLY the critical user-facing pages:
1. ✅ Onboarding - "Start 30-Day Trial" button
2. ✅ Billing - Show single $499 plan
3. ✅ Stripe checkout - Use $499 price
4. ✅ Webhook - Process $499 subscriptions
5. ✅ Set cost_per_minute = $0.30 for everyone

Leave old code in place but inactive (doesn't hurt anything).

---

## 💡 My Recommendation:

**Do Option B** (Quick MVP) NOW to get it working, then clean up old code later!

This gets you:
- ✅ Working $499 subscriptions
- ✅ 30-day free trial
- ✅ $0.30/min for everyone
- ✅ Functional in 30 mins

Then later (when you have time):
- Clean up old tier references
- Remove unused components
- Polish UI

---

## 🎯 Want me to proceed with Option B (Quick MVP)?

Say "yes do quick MVP" and I'll:
1. Update onboarding to just show "Start Free Trial"
2. Update billing to show single $499 plan
3. Update Stripe integration
4. Set everyone to $0.30/min
5. Test it works

**This gets your $499 pricing live FAST!** 🚀

Or say "do complete overhaul" and I'll update every single file (will take longer but cleaner).

**Which do you prefer?**

