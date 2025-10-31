# 🔧 IMMEDIATE DEBUG STEPS

## The dashboard isn't updating. Let's fix it RIGHT NOW.

---

## Step 1: Get Your User ID

1. Go to your dashboard in the browser
2. Open browser console (F12)
3. Run this:
```javascript
// Get your user ID
fetch('/api/calls/update').then(r => r.text()).then(console.log)
```

Or go to Supabase → Authentication → Users → Copy your User ID

**Save it - you'll need it!**

---

## Step 2: Test Database Insert Directly

Run this command (replace YOUR_USER_ID):

```bash
curl -X POST https://3c96718a9b5f.ngrok-free.app/api/calls/test-insert \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "inserted": { ... },
  "recentCallsCount": 1,
  "message": "Test call inserted! Check dashboard and refresh."
}
```

**If you get an error**, share the error message!

---

## Step 3: Check Your Terminal

Look at your terminal where `npm run dev` is running.

You should see:
```
🧪 TEST: Inserting test call for user: abc-123
✅ TEST: Call inserted successfully: {...}
📊 TEST: Recent calls for user: 1
```

**Not seeing this?** The dev server might not be running. Start it:
```bash
npm run dev
```

---

## Step 4: Refresh Dashboard

1. Go to your dashboard: `http://localhost:3000/dashboard`
2. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
3. Check if stats updated
4. Go to Activity Logs: `http://localhost:3000/dashboard/activity-logs`
5. Should see "TEST CALL" entry

**Still not showing?** → Continue to Step 5

---

## Step 5: Check N8N Request

When N8N sends a call, check your terminal for:

```
📞 Call update received from N8N
📦 Call data: { userId: '...', pickedUp: true, ... }
✅ Call saved: Contact Name - answered → appointment_booked
```

**Not seeing this?** N8N isn't reaching your server.

**Check N8N HTTP Request node URL:**
```
https://3c96718a9b5f.ngrok-free.app/api/calls/update
```

**NOT:**
```
https://OLD-URL.ngrok-free.app/api/ai-control/update-queue  ❌ WRONG!
```

---

## Step 6: Verify Database Columns

Go to Supabase → SQL Editor → Run:

```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'calls'
ORDER BY ordinal_position;
```

**Must have these columns:**
- id
- user_id
- disposition
- created_at
- **outcome** ← MUST HAVE
- **connected** ← MUST HAVE
- **contact_name** ← MUST HAVE
- **contact_phone**
- **recording_url**
- **duration_seconds**

**Missing columns?** Run this:

```sql
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
```

---

## Step 7: Check Actual Data in Database

Run this in Supabase SQL Editor (replace YOUR_USER_ID):

```sql
SELECT * FROM calls 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 10;
```

**If you see calls here but not in dashboard:**
- Dashboard is caching (I just fixed this)
- Hard refresh: Cmd+Shift+R

**If you DON'T see calls:**
- N8N isn't sending to correct endpoint
- Or database insert is failing

---

## Quick Fix Summary

**Most Common Issues:**

1. **N8N using wrong URL**
   - Should be: `https://YOUR-NGROK/api/calls/update`
   - NOT: `/api/ai-control/update-queue`

2. **Missing database columns**
   - Run the ALTER TABLE commands above

3. **Dashboard caching**
   - I just added `revalidate: 0`
   - Hard refresh browser

4. **Dev server not running**
   - Run: `npm run dev`

---

## Test Right Now

Run this (replace YOUR_USER_ID):

```bash
# Test insert
curl -X POST https://3c96718a9b5f.ngrok-free.app/api/calls/test-insert \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

Then:
1. Check terminal logs
2. Refresh dashboard (Cmd+Shift+R)
3. Check Activity Logs page

**It SHOULD show up now!**

---

## Share With Me

If still not working, share:

1. **Terminal output** when you run the test command
2. **Browser console errors** (F12 → Console)
3. **SQL query result** from checking calls table
4. **N8N HTTP Request node URL** (screenshot or copy it)

I'll fix it immediately! 🚀

