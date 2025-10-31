# 🗄️ Database Setup Guide

## ✅ **For FRESH Supabase Project (Recommended)**

### **Step 1: Run Master Schema**

1. Open **Supabase Dashboard** → Your Project
2. Click **"SQL Editor"** in sidebar
3. Click **"+ New Query"**
4. Copy/paste contents of: **`supabase/MASTER_SCHEMA.sql`**
5. Click **"Run"**
6. Wait for completion (should see success message)

**That's it!** All 12 tables created with correct structure, indexes, and RLS policies.

---

## 🔄 **For EXISTING Database (Has Data)**

⚠️ **WARNING:** Only use this if you have REAL USER DATA you want to keep!

Since you haven't launched yet, **just use the Fresh setup above** - it's cleaner.

But if you need to migrate:

### **Migration Steps:**

1. **Backup current data:**
   ```sql
   -- Export to CSV in Supabase Dashboard
   -- Table Editor → Export to CSV for each table
   ```

2. **Run in Supabase SQL Editor:**
   ```sql
   -- This will ADD missing columns without deleting data
   -- Safe to run on existing database
   ```

3. **Copy/paste:** `supabase/MASTER_SCHEMA.sql`
   - All CREATE TABLE statements use `IF NOT EXISTS`
   - All ALTER TABLE use `ADD COLUMN IF NOT EXISTS`
   - Won't destroy existing data

4. **Verify:**
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public';
   ```

---

## 📊 **What Gets Created:**

| # | Table | Purpose | Key Features |
|---|-------|---------|--------------|
| 1 | **profiles** | User info | Name, phone, company, Stripe ID, AI setup status |
| 2 | **calls** | Call tracking | Every dial, outcome, recording, duration |
| 3 | **appointments** | Calendar | Cal.ai bookings, manual appointments, sold policies |
| 4 | **ai_control_settings** | AI status | Running/stopped, execution mode, limits |
| 5 | **subscriptions** | Billing | Stripe integration, tier, limits |
| 6 | **call_balance** | Credits | Prepaid balance, auto-refill settings |
| 7 | **balance_transactions** | Audit trail | All balance changes |
| 8 | **revenue_tracking** | Analytics | Daily revenue, costs, profit |
| 9 | **referral_codes** | Referrals | Unique codes per user |
| 10 | **referrals** | Ref tracking | Who referred whom, $200 credits |
| 11 | **calendar_settings** | Display | Calendar start/end hours |
| 12 | **user_n8n_webhooks** | N8N config | Per-user workflow URLs |

**Total: 12 tables** - Clean, organized, production-ready!

---

## 🔐 **Security Features:**

✅ **Row Level Security (RLS)** enabled on ALL tables
✅ **Service Role** policies for webhooks/automation
✅ **User isolation** - users can only see their own data
✅ **Referential integrity** with foreign keys
✅ **Check constraints** for valid values

---

## 🚀 **After Running Schema:**

### **1. Verify Tables Created:**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Should see 12 tables!**

### **2. Test User Creation:**
1. Sign up a test user in your app
2. Check Supabase → Table Editor → profiles
3. Should see user automatically created (via trigger)
4. Check ai_control_settings → Should see entry
5. Check call_balance → Should see $0.00 balance

### **3. Verify RLS:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**All should show `rowsecurity = true`**

---

## 🧹 **Clean Up Old Files:**

After running `MASTER_SCHEMA.sql` successfully, you can **DELETE these old files:**

```bash
# Delete these from /supabase/ folder:
schema.sql
schema-v2.sql
schema-v3-revenue.sql
schema-v4-profiles.sql
schema-v5-ai-settings.sql
schema-v6-appointments.sql
schema-v7-sold-appointments.sql
schema-v8-call-recordings.sql
schema-v9-leads-tracking.sql
schema-v10-add-unclassified.sql
schema-v11-stripe.sql
schema-v12-subscription-tiers.sql
schema-v13-call-balance.sql
schema-v14-referrals.sql
schema-v15-stripe-customer-index.sql
schema-v16-custom-referral-codes.sql
schema-v17-fix-referral-insert.sql
schema-ADD-execution-mode.sql
schema-ADD-manual-appointments.sql
schema-COMPLETE-calls-table.sql
schema-ai-setup-status.sql
schema-calendar-settings.sql
schema-profile-enhancements.sql
schema-user-n8n-webhooks.sql
FIX_PROFILE_UPDATE_RLS.sql
FIX_REFERRAL_DUPLICATE_ERROR.sql
COMPLETE_REFERRAL_FIX.sql
UPDATE_DEFAULT_EXECUTION_MODE.sql
UPDATE_REFERRAL_TO_200.sql
```

**Keep ONLY:**
- ✅ `MASTER_SCHEMA.sql` - Your single source of truth

---

## 📝 **Going Forward:**

### **Need to make a change?**

1. **Update** `MASTER_SCHEMA.sql`
2. **Save as** `MASTER_SCHEMA_V2.sql` (versioned)
3. **Create migration script** for existing databases
4. **Document the change**

### **For Production:**

```
supabase/
  ├── MASTER_SCHEMA.sql           ← Current version
  ├── MASTER_SCHEMA_V2.sql        ← Future updates
  └── migrations/
      └── v1_to_v2.sql            ← Migration scripts
```

Keep it organized!

---

## ⚡ **Quick Start (New Database):**

```bash
# 1. Copy MASTER_SCHEMA.sql
# 2. Go to Supabase SQL Editor
# 3. Paste and run
# 4. Done! ✅
```

**One file. One command. Clean start.** 🎯

---

## 🎯 **Benefits:**

✅ **Clarity** - One file has everything
✅ **Speed** - Run once, done
✅ **Safety** - No conflicting schemas
✅ **Maintainability** - Easy to update
✅ **Production-Ready** - Professional setup
✅ **Onboarding** - New dev runs one file
✅ **Documentation** - Self-documenting with comments

---

## ⚠️ **IMPORTANT:**

- This schema is designed for **production use**
- All security policies are in place
- All indexes optimized for performance
- All triggers automated
- No test/debug tables included

**You're ready to launch!** 🚀

