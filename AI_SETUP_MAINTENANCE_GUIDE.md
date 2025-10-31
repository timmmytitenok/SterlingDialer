# 🔧 AI Setup & Maintenance Mode - Complete Guide

## 📋 Overview

When users subscribe or upgrade, their AI Control Center enters a **setup/maintenance mode** while you configure their N8N workflows and AI agents. This prevents them from launching incomplete systems and sets proper expectations.

---

## 🎯 How It Works

### **Automatic Triggers:**

1. **New Subscription (pending_setup)**
   - User purchases Starter/Pro/Elite plan
   - Status automatically set to: `pending_setup`
   - Shows: "AI Setup In Progress" message
   - Timeline: 12-24 hours

2. **Upgrade (maintenance)**
   - User upgrades from Starter → Pro
   - User upgrades from Pro → Elite
   - Status automatically set to: `maintenance`
   - Shows: "Maintenance Mode" message
   - Timeline: Until N8N workflows configured

3. **Downgrade (NO maintenance)**
   - User downgrades from Elite → Pro → Starter
   - Status: **Unchanged** (stays `ready`)
   - User can continue using until you manually adjust
   - No interruption to service

---

## 🗄️ Database Fields

Added to `profiles` table:

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `ai_setup_status` | TEXT | `'ready'`, `'pending_setup'`, `'maintenance'` | Current AI access status |
| `setup_requested_at` | TIMESTAMPTZ | ISO timestamp | When setup/maintenance was triggered |
| `setup_completed_at` | TIMESTAMPTZ | ISO timestamp | When admin marked as ready |

---

## 🎨 What Users See

### **Pending Setup Screen:**
```
🚧 AI Setup In Progress

Our team is configuring your AI calling agent
This typically takes 12-24 hours

What We're Setting Up:
1. Creating N8N Workflows
2. Configuring AI Agents (Training your X AI callers)
3. Testing & Validation

📧 We'll Email You When Ready
You'll receive an email notification as soon as your AI agent 
is configured and ready to launch. Expected within 12-24 hours.
```

### **Maintenance Screen (Upgrade):**
```
🔧 Maintenance Mode

Upgrading your AI system with new workflows
Setting up additional AI agents for your account

What We're Setting Up:
1. Creating N8N Workflows
2. Configuring AI Agents (Training your X AI callers)
3. Testing & Validation

📧 We'll Email You When Ready
You'll receive an email notification as soon as your AI agent 
is configured and ready to launch. Should be ready soon.
```

---

## 🛠️ Managing Setup Status (Supabase)

### **Quick Commands:**

#### ✅ **Mark User as Ready (Most Common)**

When you've finished setting up their AI:

```sql
UPDATE profiles
SET 
  ai_setup_status = 'ready',
  setup_completed_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
```

#### 📋 **View All Pending Setups**

See who's waiting:

```sql
SELECT 
  u.email,
  p.ai_setup_status,
  s.subscription_tier,
  p.setup_requested_at,
  EXTRACT(EPOCH FROM (NOW() - p.setup_requested_at)) / 3600 AS hours_waiting
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN subscriptions s ON p.user_id = s.user_id AND s.status = 'active'
WHERE p.ai_setup_status IN ('pending_setup', 'maintenance')
ORDER BY p.setup_requested_at ASC;
```

#### 🔧 **Manually Set to Maintenance (For Testing)**

```sql
UPDATE profiles
SET 
  ai_setup_status = 'maintenance',
  setup_requested_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
```

#### 🧪 **Manually Set to Pending (For Testing)**

```sql
UPDATE profiles
SET 
  ai_setup_status = 'pending_setup',
  setup_requested_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
```

---

## 📊 Status Flow Diagram

### **New Subscription:**
```
1. User purchases Starter/Pro/Elite
   ↓
2. Stripe webhook fires
   ↓
3. ai_setup_status = 'pending_setup'
   ↓
4. User sees "Setup In Progress" screen
   ↓
5. You configure N8N workflows (12-24 hrs)
   ↓
6. Run SQL: UPDATE ai_setup_status = 'ready'
   ↓
7. User refreshes page → Can now launch AI ✅
```

### **Upgrade:**
```
1. User upgrades (Starter → Pro or Pro → Elite)
   ↓
2. Stripe webhook fires
   ↓
3. ai_setup_status = 'maintenance'
   ↓
4. User sees "Maintenance Mode" screen
   ↓
5. You add additional N8N agents
   ↓
6. Run SQL: UPDATE ai_setup_status = 'ready'
   ↓
7. User can now use upgraded AI ✅
```

### **Downgrade:**
```
1. User downgrades (Elite → Pro or Pro → Starter)
   ↓
2. Stripe webhook fires
   ↓
3. ai_setup_status = NO CHANGE (stays 'ready')
   ↓
4. User can continue using AI
   ↓
5. You manually adjust their N8N limit when convenient
```

---

## 🔔 Email Notification Workflow

**When you mark a user as ready:**

1. Run the SQL to set `ai_setup_status = 'ready'`
2. Send them an email:

**Subject:** 🚀 Your Sterling AI Agent is Ready!

**Body:**
```
Hi [Name],

Great news! Your AI calling agent is now fully configured and ready to launch.

✅ N8N workflows created
✅ AI agents trained and tested
✅ All systems verified

You can now log in to your dashboard and launch your AI:
https://your-domain.com/dashboard/ai-control

If you have any questions, just reply to this email.

Happy calling!
- Sterling AI Team
```

---

## 🧪 Testing the Setup Flow

### **Test 1: New Subscription**

1. Create a test user
2. Subscribe to Starter plan
3. Check AI Control Center → Should show "Setup In Progress"
4. Run SQL: Mark as ready
5. Refresh page → Should now show normal AI Control Center

### **Test 2: Upgrade**

1. User with Starter plan
2. Upgrade to Pro
3. Check AI Control Center → Should show "Maintenance Mode"
4. Run SQL: Mark as ready
5. Refresh page → Can now launch with 2 AI callers

### **Test 3: Downgrade**

1. User with Elite plan
2. Downgrade to Pro
3. Check AI Control Center → Should still work (no maintenance)
4. User can continue using AI

---

## 📝 Daily Workflow

### **Morning Routine:**

1. **Check for new setups:**
```sql
-- See all pending
SELECT u.email, s.subscription_tier, p.setup_requested_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
JOIN subscriptions s ON p.user_id = s.user_id
WHERE p.ai_setup_status IN ('pending_setup', 'maintenance')
ORDER BY p.setup_requested_at ASC;
```

2. **Configure N8N workflows** for each user

3. **Mark as ready** when complete:
```sql
UPDATE profiles
SET ai_setup_status = 'ready', setup_completed_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

4. **Send email notification**

---

## 🔐 Important Notes

1. **Always mark as ready** after configuring N8N - users can't launch AI until you do
2. **Downgrades are graceful** - users keep access until you manually adjust
3. **Upgrades need maintenance** - new AI agents require new N8N workflows
4. **Check email regularly** - users will email asking when ready
5. **Status is per-user** - controlled individually in Supabase

---

## 📂 Related Files

- **Schema:** `supabase/schema-ai-setup-status.sql`
- **SQL Commands:** `MANAGE_AI_SETUP_STATUS.sql`
- **UI Component:** `components/ai-control-center-v2.tsx`
- **Page Handler:** `app/dashboard/ai-control/page.tsx`
- **Webhook:** `app/api/stripe/webhook/route.ts`

---

## ✅ Quick Reference

| Action | SQL Command | Result |
|--------|-------------|--------|
| Mark Ready | `UPDATE profiles SET ai_setup_status = 'ready' WHERE ...` | User can launch AI |
| Set Pending | `UPDATE profiles SET ai_setup_status = 'pending_setup' WHERE ...` | Shows setup message |
| Set Maintenance | `UPDATE profiles SET ai_setup_status = 'maintenance' WHERE ...` | Shows upgrade message |
| View Pending | `SELECT * FROM profiles WHERE ai_setup_status != 'ready'` | See who's waiting |

---

**You're all set!** New subscriptions and upgrades will automatically enter maintenance mode until you mark them as ready in Supabase. 🎉

