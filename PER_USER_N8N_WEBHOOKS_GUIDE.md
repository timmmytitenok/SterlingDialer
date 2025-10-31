# 🔗 Per-User N8N Webhooks - Complete Guide

## 🎯 Overview

Each user now has their **own dedicated N8N workflow** with a unique webhook URL. This enables:
- ✅ **Isolation:** User A's AI doesn't interfere with User B's AI
- ✅ **Scalability:** Add unlimited users without conflicts
- ✅ **Customization:** Different scripts/settings per user
- ✅ **Control:** Enable/disable individual users
- ✅ **Security:** Each workflow is independent

---

## 🗄️ Database Schema

### **New Table: `user_n8n_webhooks`**

```sql
CREATE TABLE user_n8n_webhooks (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,  -- One webhook config per user
  
  -- AI Agent Webhook
  ai_agent_webhook_url TEXT,           -- N8N workflow URL
  ai_agent_webhook_enabled BOOLEAN,    -- Enable/disable
  
  -- Future: Appointment webhooks
  appointment_webhook_url TEXT,
  appointment_webhook_enabled BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ
);
```

---

## 🔄 How It Works

### **Old System (Single Workflow):**
```
User A launches → N8N_WEBHOOK_START_DIAL (env var)
User B launches → N8N_WEBHOOK_START_DIAL (same!) ❌
```
**Problem:** Both users trigger the SAME workflow = conflicts!

### **New System (Per-User Workflows):**
```
User A launches → Looks up User A's webhook in DB → Triggers User A's N8N workflow ✅
User B launches → Looks up User B's webhook in DB → Triggers User B's N8N workflow ✅
```
**Benefit:** Complete isolation!

---

## 🛠️ Your Workflow (Onboarding New Users)

### **Step 1: User Subscribes**
- User pays for Starter/Pro/Elite
- `ai_setup_status` = 'pending_setup' (automatic)
- User sees "Setup In Progress" screen

### **Step 2: You Create Their N8N Workflow (12-24 hrs)**

**In N8N:**
1. **Duplicate your template workflow**
2. **Rename it:** "Sterling AI - User: john@example.com"
3. **Update the webhook trigger** → Copy the new webhook URL
4. **Activate the workflow**

Example URL: `https://yourn8n.app.n8n.cloud/webhook/a1b2c3d4-user-john`

### **Step 3: Add Webhook to Database**

**Option A: Via Admin UI (Easiest)**
1. Go to **Settings → Testing**
2. Find "N8N Webhook Configuration"
3. Paste the webhook URL
4. Click "Test Webhook" to verify
5. Click "Save Configuration"

**Option B: Via Supabase SQL**
```sql
INSERT INTO user_n8n_webhooks (user_id, ai_agent_webhook_url)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  'https://yourn8n.app.n8n.cloud/webhook/a1b2c3d4-user-john'
);
```

### **Step 4: Mark User as Ready**

```sql
UPDATE profiles
SET ai_setup_status = 'ready', setup_completed_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### **Step 5: Email User**
"Your AI agent is ready! You can now launch it from your dashboard."

### **Step 6: User Launches AI**
- Goes to AI Control Center
- Clicks "Launch AI Agent"
- **Your app** looks up THEIR webhook URL
- **Triggers THEIR specific N8N workflow**
- AI runs independently! ✅

---

## 🎮 What Happens When User Launches

### **Code Flow:**

1. **User clicks "Launch AI Agent"**
2. **App checks database:**
   ```sql
   SELECT ai_agent_webhook_url, ai_agent_webhook_enabled
   FROM user_n8n_webhooks
   WHERE user_id = 'abc-123';
   ```

3. **Validation:**
   - ❌ No webhook found → Error: "AI not configured, contact support"
   - ❌ Webhook disabled → Error: "AI temporarily disabled"
   - ✅ Webhook found + enabled → Proceed

4. **Trigger N8N:**
   ```javascript
   fetch(user.webhookUrl, {
     userId: "abc-123",
     dailyCallLimit: 600,
     executionMode: "leads",
     targetLeadCount: 100
   })
   ```

5. **N8N receives** → Starts THAT user's calling automation

---

## 📊 Managing Multiple Users

### **Scenario: 10 Users**

You create:
- 10 separate N8N workflows (duplicate from template)
- 10 webhook URLs stored in database
- Each user triggers their own workflow

**Database:**
```
user_id                     webhook_url
abc-123 (john@ex.com)  →   https://n8n.../webhook/john-abc123
def-456 (jane@ex.com)  →   https://n8n.../webhook/jane-def456
ghi-789 (bob@ex.com)   →   https://n8n.../webhook/bob-ghi789
```

---

## 🔐 Security & Control

### **Enable/Disable Individual Users**

**Disable a user (emergency stop):**
```sql
UPDATE user_n8n_webhooks
SET ai_agent_webhook_enabled = false
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'problem-user@example.com');
```

**Re-enable:**
```sql
UPDATE user_n8n_webhooks
SET ai_agent_webhook_enabled = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### **Testing Without Affecting Production**

You can test a new workflow by:
1. Temporarily updating YOUR webhook URL in database
2. Launch AI → Tests new workflow
3. Restore original URL

---

## 🧪 Testing The System

### **Test 1: Configure Your Own Webhook**
1. Go to Settings → Testing
2. Paste your N8N webhook URL
3. Click "Test Webhook" → Should see success
4. Click "Save Configuration"
5. Go to AI Control Center → Click "Launch AI Agent"
6. Check N8N → Your workflow should trigger

### **Test 2: Missing Webhook Error**
1. Delete your webhook from database:
   ```sql
   DELETE FROM user_n8n_webhooks WHERE user_id = auth.uid();
   ```
2. Try to launch AI
3. Should see error: "AI agent not configured. Please contact support."

### **Test 3: Disabled Webhook**
1. In Settings → Testing, toggle webhook to "Disabled"
2. Try to launch AI
3. Should see error: "AI agent temporarily disabled."

---

## 📝 SQL Quick Commands

All commands are in **`MANAGE_USER_WEBHOOKS.sql`**

**Most common:**

### View all webhooks:
```sql
SELECT u.email, w.ai_agent_webhook_url, w.ai_agent_webhook_enabled
FROM user_n8n_webhooks w
JOIN auth.users u ON w.user_id = u.id;
```

### Add webhook for new user:
```sql
INSERT INTO user_n8n_webhooks (user_id, ai_agent_webhook_url)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'USER_EMAIL'),
  'https://n8n.../webhook/USER-ID'
);
```

### Find users without webhooks:
```sql
SELECT u.email
FROM auth.users u
LEFT JOIN user_n8n_webhooks w ON u.id = w.user_id
WHERE w.id IS NULL;
```

---

## 🚀 Production Deployment Checklist

### **Before Going Live:**
- [ ] Run schema: `schema-user-n8n-webhooks.sql` in production Supabase
- [ ] Create N8N workflows for all existing users
- [ ] Add webhook URLs to database for each user
- [ ] Test at least one user end-to-end
- [ ] Update webhook URLs from ngrok → production domain

### **For Each New User:**
1. [ ] User subscribes (automatic: `ai_setup_status = 'pending_setup'`)
2. [ ] You duplicate N8N workflow template
3. [ ] You add webhook URL to database
4. [ ] You set `ai_setup_status = 'ready'`
5. [ ] You email user: "Your AI is ready!"

---

## 🎯 Benefits of This Architecture

1. **Scalable:** Add 100 users = 100 workflows (N8N supports this)
2. **Debuggable:** Problems with User A? Check THEIR workflow only
3. **Flexible:** Give Pro users different scripts than Starter
4. **Safe:** Disable one user without affecting everyone
5. **Trackable:** See which webhooks are tested/working
6. **Professional:** Enterprise-grade multi-tenancy

---

## 💡 Pro Tips

1. **N8N Workflow Naming Convention:**
   - `Sterling AI - Starter - john@example.com`
   - `Sterling AI - Pro - jane@example.com`
   - `Sterling AI - Elite - bob@example.com`

2. **Test New Workflows on Your Account First:**
   - Update YOUR webhook URL to the new workflow
   - Test it thoroughly
   - Then deploy to customer

3. **Keep a Template Workflow:**
   - Never modify the template
   - Always duplicate it for new users
   - Makes onboarding faster

4. **Monitor Webhook Health:**
   - Check `last_tested_at` timestamps
   - Test webhooks periodically
   - Proactively fix broken ones

---

## ⚠️ Important Notes

1. **Webhooks are per-user, not per-tier**
   - Starter, Pro, and Elite users all have separate workflows
   - Tier affects LIMITS, not webhook architecture

2. **N8N sends data BACK to same app**
   - Call updates: `https://yourdomain.com/api/calls/update`
   - AI complete: `https://yourdomain.com/api/ai-control/complete`
   - These URLs are THE SAME for all users (not per-user)

3. **Only the START webhook is per-user**
   - Starting AI → per-user webhook
   - Call updates → shared endpoint (uses userId in payload)
   - Complete callback → shared endpoint (uses userId in payload)

---

## 🔧 Troubleshooting

**Error: "AI agent not configured"**
- Check: Does user have record in `user_n8n_webhooks`?
- Fix: Add their webhook URL

**Error: "AI agent temporarily disabled"**
- Check: Is `ai_agent_webhook_enabled = false`?
- Fix: Set to `true`

**Webhook not triggering:**
- Check: Is N8N workflow active?
- Check: Is webhook URL correct (no typos)?
- Test: Use "Test Webhook" button in admin UI

**N8N doesn't respond:**
- Check: Is N8N workflow published/active?
- Check: Did you update to production domain (not ngrok)?
- Check: Firewall/security settings in N8N

---

## 📚 Related Files

- **Schema:** `supabase/schema-user-n8n-webhooks.sql`
- **SQL Commands:** `MANAGE_USER_WEBHOOKS.sql`
- **UI Component:** `components/webhook-manager.tsx`
- **API - Update:** `app/api/admin/update-webhook/route.ts`
- **API - Test:** `app/api/admin/test-webhook/route.ts`
- **Launch Logic:** `app/api/ai-control/start/route.ts`
- **Testing Page:** `app/dashboard/settings/testing/page.tsx`

---

**You're now running a truly scalable, multi-tenant AI calling platform!** 🎉

