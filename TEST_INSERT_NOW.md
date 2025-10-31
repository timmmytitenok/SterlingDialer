# 🚨 IMMEDIATE TEST - Find The Problem

## The Issue:
- Terminal shows data coming in ✅
- Terminal says "Call saved" ✅  
- But database has 0 calls ❌

This means: **INSERT IS FAILING SILENTLY**

---

## Test 1: Check Terminal for Database Errors

When N8N sends a call, look at your terminal carefully.

**You should see:**
```
📞 Call update received from N8N
📦 Call data: {...}
🔄 Attempting to insert call into database...
📝 Insert data: {...}
✅ Call saved to database: Contact Name - answered → appointment_booked
✅ Inserted record ID: abc-123-def-456
```

**If you see an ERROR between "Attempting to insert" and "Call saved":**
```
❌ DATABASE INSERT ERROR: {...}
```
→ That's the problem! Share the error with me.

---

## Test 2: Direct Database Insert

Go to Supabase → SQL Editor → Run this (REPLACE YOUR_USER_ID):

```sql
INSERT INTO calls (
  user_id,
  disposition,
  outcome,
  contact_name,
  contact_phone,
  duration_seconds,
  connected,
  created_at
) VALUES (
  'YOUR_USER_ID',
  'answered',
  'appointment_booked',
  'SQL DIRECT TEST',
  '555-DIRECT',
  99,
  true,
  NOW()
) RETURNING *;
```

**If this works:**
- Refresh debug page: http://localhost:3000/dashboard/api-test
- Should see "SQL DIRECT TEST"
- Problem is with service role, not database

**If this fails:**
- You'll see an error like "column does not exist"
- Run the ALTER TABLE commands to add missing columns

---

## Test 3: Service Role Verification

Run this endpoint to test if service role can insert:

```bash
curl -X POST http://localhost:3000/api/calls/verify-insert \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID"}'
```

This will run 4 tests and tell you exactly what's failing.

---

## Most Likely Issues:

### Issue A: Missing Columns
**Symptom:** Direct SQL insert fails  
**Fix:** Run in Supabase:

```sql
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
```

### Issue B: RLS Blocking Service Role
**Symptom:** Direct insert works, but API insert fails  
**Fix:** Run in Supabase:

```sql
-- Allow service role to insert
CREATE POLICY "Service role can insert any call"
  ON calls
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

### Issue C: Service Role Key Missing
**Symptom:** API says "Call saved" but nothing in database  
**Fix:** Check .env.local has:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

---

## DO THIS NOW:

1. Send a test call from N8N
2. Watch terminal CAREFULLY for errors between "Attempting to insert" and "Call saved"
3. Run the SQL direct insert test
4. Share what you see!

The error message will tell us exactly what's wrong! 🎯
