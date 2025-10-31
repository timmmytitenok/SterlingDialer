# 🚨 EMERGENCY DEBUG - Dashboard Not Updating

## Step 1: Check If Data Is Actually Being Saved

Go to this URL: **`http://localhost:3000/dashboard/api-test`**

This debug page will show you:
- ✅ How many calls are in the database
- ✅ Breakdown by outcome
- ✅ Last 20 calls with full details
- ✅ Current timestamp (to verify no caching)

**If you see 0 calls** → Data is NOT being saved (go to Step 2)  
**If you see calls but main dashboard is 0** → It's a caching issue (go to Step 3)

---

## Step 2: Test If API Endpoint Works

Run this command (replace YOUR_USER_ID):

```bash
curl -X POST https://3c96718a9b5f.ngrok-free.app/api/calls/update \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "pickedUp": true,
    "outcome": "booked",
    "contactName": "EMERGENCY TEST",
    "contactPhone": "999-9999",
    "duration": 60
  }'
```

**Check your terminal where `npm run dev` is running.**

You should see:
```
📞 Call update received from N8N
📦 Call data: { userId: '...', pickedUp: true, outcome: 'booked', ... }
✅ Call saved: EMERGENCY TEST - answered → appointment_booked (Answered: true)
```

**If you DON'T see this:**
- Your dev server isn't running: `npm run dev`
- ngrok isn't working
- N8N is hitting wrong URL

**If you DO see this:**
- Refresh debug page: `http://localhost:3000/dashboard/api-test`
- Should show "EMERGENCY TEST" call

---

## Step 3: Force Refresh Dashboard

1. Go to main dashboard: `http://localhost:3000/dashboard`
2. Open browser DevTools (F12)
3. Go to Network tab
4. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
5. Check terminal logs - should see:

```
🔄 Dashboard loading at: 2024-10-24T...
📊 Dashboard: Found X total calls for user
📈 Dashboard stats: { totalCalls: X, appointments: X, ... }
```

---

## Step 4: Verify Database Columns

Go to Supabase → SQL Editor → Run:

```sql
-- Check what columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'calls'
ORDER BY ordinal_position;
```

**Must have:**
- outcome
- connected
- contact_name
- contact_phone

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

## Step 5: Check N8N URL

Open your N8N HTTP Request node.

**URL should be:**
```
https://3c96718a9b5f.ngrok-free.app/api/calls/update
```

**NOT:**
```
https://OLD-URL.ngrok-free.app/api/ai-control/update-queue  ❌ WRONG
```

---

## Step 6: Watch Terminal Logs Live

Keep your terminal visible where `npm run dev` is running.

**When N8N sends a call, you should see:**
```
📞 Call update received from N8N
📦 Call data: {...}
✅ Call saved: Contact Name - answered → appointment_booked (Answered: true)
```

**When you refresh dashboard, you should see:**
```
🔄 Dashboard loading at: 2024-10-24T18:30:45.123Z
📊 Dashboard: Found 5 total calls for user
📈 Dashboard stats: { totalCalls: 5, appointments: 1, ... }
```

**Not seeing terminal logs?**
- Dev server not running
- Or requests aren't reaching the server

---

## Step 7: Direct Database Check

Go to Supabase → Table Editor → `calls` table

**Manually check:**
- Are there any rows?
- Do they have your user_id?
- Do they have outcome values?

**Or run SQL:**
```sql
SELECT 
  contact_name,
  outcome,
  disposition,
  connected,
  created_at
FROM calls
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Quick Checklist

- [ ] Dev server is running (`npm run dev`)
- [ ] ngrok is running (`ngrok http 3000`)
- [ ] Database columns exist (run ALTER TABLE commands)
- [ ] N8N using correct URL (`/api/calls/update`)
- [ ] Debug page shows calls: `http://localhost:3000/dashboard/api-test`
- [ ] Terminal shows "Call saved" messages when N8N runs
- [ ] Hard refresh dashboard (Cmd+Shift+R)

---

## 📞 Contact Flow Test

1. Send test call:
```bash
curl -X POST https://3c96718a9b5f.ngrok-free.app/api/calls/update \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","pickedUp":true,"outcome":"booked","contactName":"TEST NOW","contactPhone":"111-1111"}'
```

2. Check terminal immediately
3. Go to debug page: `http://localhost:3000/dashboard/api-test`
4. Should see "TEST NOW" at the top
5. Go to main dashboard: `http://localhost:3000/dashboard`
6. Hard refresh (Cmd+Shift+R)
7. Should see numbers updated

---

## 🆘 If Still Not Working

Share with me:

1. **Debug page screenshot**: `http://localhost:3000/dashboard/api-test`
2. **Terminal output** when you send test curl
3. **N8N HTTP Request node URL** (exact value)
4. **Supabase calls table** - how many rows?

I'll fix it immediately! 🚀

