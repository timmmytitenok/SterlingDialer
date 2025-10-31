# 📦 MASTER SCHEMA CONSOLIDATION - COMPLETE

## ✅ ALL SQL FILES CONSOLIDATED INTO ONE!

Your database schema is now **100% ready for deployment** in a single file:

**`supabase/MASTER_SCHEMA.sql`** ← Run this ONE file!

---

## 📁 WHAT WAS MERGED:

### **Original Schema Files:**
All individual migration files have been consolidated:

1. ✅ `add_onboarding_fields.sql` → **Merged into MASTER_SCHEMA**
2. ✅ `add_has_active_subscription.sql` → **Merged into MASTER_SCHEMA**
3. ✅ `fix_referral_codes_insert_policy.sql` → **Merged into MASTER_SCHEMA**

### **What's NOT Needed for Fresh Deploy:**
- ❌ `fix_existing_subscribers.sql` - Only for updating existing databases
- ❌ `CREATE_STERLING_REFERRAL_CODE.sql` - One-time admin task

---

## 🗃️ PROFILES TABLE - COMPLETE STRUCTURE

The `profiles` table now includes ALL fields we added during development:

```sql
CREATE TABLE profiles (
  -- Basic Info
  full_name TEXT,
  phone_number TEXT,
  company_name TEXT,
  avatar_url TEXT,
  
  -- Stripe Integration ← UPDATED!
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT,                    ← NEW!
  subscription_status TEXT,                  ← NEW!
  has_active_subscription BOOLEAN,           ← NEW!
  
  -- Referral System
  referred_by VARCHAR(12),
  
  -- AI Setup Status
  ai_setup_status TEXT,
  setup_requested_at TIMESTAMPTZ,
  setup_completed_at TIMESTAMPTZ,
  
  -- Onboarding Status ← NEW SECTION!
  onboarding_completed BOOLEAN,              ← NEW!
  onboarding_completed_at TIMESTAMPTZ,       ← NEW!
  
  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🔐 RLS POLICIES - ALL INCLUDED

The MASTER_SCHEMA includes ALL policies:

### **Referral Codes:**
- ✅ Users can view their own code
- ✅ **Users can INSERT their own code** ← FIXED!
- ✅ Service role full access

### **All Other Tables:**
- ✅ Complete SELECT, INSERT, UPDATE, DELETE policies
- ✅ Service role access for webhooks
- ✅ User-scoped access for security

---

## 📊 COMPLETE TABLE LIST (12 Total)

1. ✅ **profiles** - User info, subscriptions, onboarding status
2. ✅ **calls** - Call tracking
3. ✅ **appointments** - Bookings and calendar
4. ✅ **ai_control_settings** - AI agent controls
5. ✅ **subscriptions** - Stripe billing
6. ✅ **call_balance** - Prepaid credits
7. ✅ **balance_transactions** - Transaction history
8. ✅ **revenue_tracking** - Daily revenue
9. ✅ **referral_codes** - User referral codes
10. ✅ **referrals** - Referral tracking
11. ✅ **calendar_settings** - Display preferences
12. ✅ **user_n8n_webhooks** - Per-user workflows

---

## 🚀 HOW TO DEPLOY

### **For Fresh Supabase Project:**

1. Create new Supabase project
2. Go to SQL Editor
3. Copy **entire** `MASTER_SCHEMA.sql` file
4. Paste and run
5. Done! All tables, indexes, policies, triggers created! ✅

### **For Existing Project (Development):**

Your current database already has everything from individual migrations.  
No action needed - it's already up to date! ✅

---

## 🎯 WHAT'S NEW IN VERSION 2.0

Compared to the original schema, these fields/features were added:

### **Profiles Table:**
- `subscription_tier` - Current tier (starter/pro/elite)
- `subscription_status` - Stripe subscription status
- `has_active_subscription` - Boolean flag for middleware
- `onboarding_completed` - Onboarding completion flag
- `onboarding_completed_at` - When onboarding was done

### **RLS Policies:**
- INSERT policy for referral_codes (users can create codes)

### **Indexes:**
- `profiles_has_active_subscription_idx` - Fast middleware checks
- `profiles_subscription_tier_idx` - Quick tier lookups

---

## 📝 DEPLOYMENT ORDER

1. **Supabase:** Run `MASTER_SCHEMA.sql`
2. **Stripe:** Create products in LIVE mode
3. **GitHub:** Push code to repository
4. **Vercel:** Deploy from GitHub
5. **Vercel:** Add environment variables
6. **Stripe:** Create webhook pointing to deployed URL
7. **Supabase:** Update redirect URLs to deployed domain
8. **Test:** Full end-to-end test

---

## ✅ YOU'RE READY!

- ✅ Single schema file with everything
- ✅ All migrations consolidated
- ✅ Production-ready database structure
- ✅ Complete RLS security
- ✅ All indexes optimized

**Next step: Follow `DEPLOYMENT_CHECKLIST.md` to go live!** 🚀

