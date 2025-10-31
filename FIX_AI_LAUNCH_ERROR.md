# 🔧 Fix AI Launch Error - Run This SQL Now!

## The Error:
```
Could not find the 'execution_mode' column of 'ai_control_settings' in the schema cache
```

## The Problem:
Your database is missing the new columns for execution mode tracking.

---

## ✅ SOLUTION: Run This SQL in Supabase

### **Go to Supabase Dashboard:**
1. Open https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **"New query"**
5. Paste this SQL:

```sql
-- Add execution mode tracking to AI control settings
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS execution_mode TEXT DEFAULT 'leads';
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS target_lead_count INTEGER;
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS target_time_military INTEGER;
```

6. Click **"Run"** (or press Ctrl+Enter)
7. Should see: **"Success. No rows returned"**

---

## ✅ After Running SQL:

1. Go back to your app
2. Refresh the AI Control Center page
3. Click "Launch AI Agent"
4. Go through the flow
5. Should work now! 🎉

---

## 🧪 Verify It Worked

**Run this query in Supabase to verify columns exist:**

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_control_settings' 
AND column_name IN ('execution_mode', 'target_lead_count', 'target_time_military');
```

**Should show:**
- execution_mode (text)
- target_lead_count (integer)
- target_time_military (integer)

---

## 📍 SQL File Location

The SQL is already created at:
`/supabase/schema-ADD-execution-mode.sql`

You can also copy it from there!

---

**Run the SQL and try launching again!** ✅

