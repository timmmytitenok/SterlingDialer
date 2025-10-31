# 🐛 Dashboard Not Updating? Here's Why & How to Fix

## 🔍 The Issue

N8N is sending data to `/api/calls/update` but the dashboard and activity logs aren't updating.

---

## ✅ Most Common Causes & Fixes

### **1. Database Missing Columns** (MOST LIKELY)

Your `calls` table might be missing the required columns.

**Fix:** Run this SQL in Supabase:

```sql
-- Add ALL required columns to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('not_interested', 'callback_later', 'appointment_booked', 'live_transfer', 'other'));
ALTER TABLE calls ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS calls_outcome_idx ON calls(outcome);
CREATE INDEX IF NOT EXISTS calls_connected_idx ON calls(connected);
```

**Verify:**
```sql
-- Check if all columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'calls' 
ORDER BY ordinal_position;
```

You should see:
- ✅ `id`
- ✅ `user_id`
- ✅ `disposition`
- ✅ `created_at`
- ✅ `outcome` ← MUST HAVE
- ✅ `connected` ← MUST HAVE
- ✅ `contact_name` ← MUST HAVE
- ✅ `contact_phone`
- ✅ `recording_url`
- ✅ `duration_seconds`

---

### **2. N8N Using Wrong URL**

**Wrong:** `https://OLD-URL.ngrok-free.app/api/ai-control/update-queue`  
**Correct:** `https://YOUR-NGROK-URL.ngrok-free.app/api/calls/update`

**Check your ngrok URL:**
```bash
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -1
```

**Update N8N:**
- Open your HTTP Request node
- Change URL to: `https://[YOUR-NGROK-URL]/api/calls/update`
- Save workflow

---

### **3. N8N Not Sending Required Fields**

**Minimum required:**
```json
{
  "userId": "abc-123",
  "pickedUp": true
}
```

**Check N8N execution logs:**
- Did the HTTP Request node run?
- What was the response code?
- 200 = success
- 400 = missing userId
- 500 = database error

---

### **4. RLS Policy Blocking Service Role**

The endpoint uses service role which SHOULD bypass RLS, but let's verify:

```sql
-- Check RLS policies on calls table
SELECT * FROM pg_policies WHERE tablename = 'calls';
```

Service role should bypass all RLS automatically. If inserts are failing, check Supabase logs.

---

### **5. Dashboard Caching**

Both pages have `force-dynamic` so they shouldn't cache, but try:

**Hard refresh:**
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5`

**Or restart dev server:**
```bash
# Stop server
Ctrl+C

# Restart
npm run dev
```

---

## 🧪 Test the Endpoint Directly

Run the test script:

```bash
./test-call-endpoint.sh
```

This will:
1. Get your ngrok URL
2. Ask for your USER_ID
3. Send 5 test calls
4. Show responses

**Expected output:**
```
✅ Call saved: Test Booked - answered → appointment_booked
HTTP Status: 200
```

**If you see errors:**
- 400 = Missing userId or wrong format
- 500 = Database error (check missing columns)

---

## 🔍 Debug Checklist

Run through these steps:

### **Step 1: Check Database Schema**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calls';
```

**Missing columns?** → Run the ALTER TABLE commands above

### **Step 2: Test Endpoint**
```bash
# Run test script
./test-call-endpoint.sh
```

**Getting 200 response?** → Endpoint works!  
**Getting 500?** → Check terminal logs for database errors

### **Step 3: Check Terminal Logs**

When N8N sends a call, you should see:
```
📞 Call update received from N8N
📦 Call data: { userId: '...', pickedUp: true, outcome: 'booked', ... }
✅ Call saved: John Doe - answered → appointment_booked (Answered: true)
```

**Not seeing logs?** → N8N isn't reaching your endpoint (check URL)

### **Step 4: Verify Data in Database**

```sql
-- Check recent calls
SELECT * FROM calls 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 10;
```

**Calls appearing?** → Dashboard should update  
**No calls?** → Inserts are failing (check schema)

### **Step 5: Check Dashboard**

1. Go to Dashboard page
2. Hard refresh (Cmd+Shift+R)
3. Check stats numbers
4. Go to Activity Logs
5. Should see calls there

**Still not showing?** → Check that calls have `disposition = 'answered'` (Activity Logs only shows answered calls)

---

## 🎯 Quick Fix Steps

**Do this in order:**

1. **Run schema update in Supabase:**
```sql
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_phone TEXT;
```

2. **Get current ngrok URL:**
```bash
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -1
```

3. **Update N8N HTTP Request node:**
   - URL: `https://[YOUR-NGROK]/api/calls/update`
   - Body includes: `userId` and `pickedUp`

4. **Test with script:**
```bash
./test-call-endpoint.sh
```

5. **Check terminal for success messages**

6. **Refresh dashboard**

---

## 💡 Pro Tips

### **Enable Real-Time Updates**

The dashboard polls status every second for AI Control, but stats pages are server-rendered.

To see updates without refreshing:
- Activity Logs: Auto-refreshes every page load
- Dashboard stats: Manual refresh needed

### **Watch Terminal Logs**

Keep terminal visible when testing. You'll see:
- ✅ Calls being saved
- ❌ Errors if something fails
- 📊 What data N8N is sending

### **Test Before Full Run**

Before running N8N with 100 calls:
1. Test with 1-2 calls
2. Verify they show in dashboard
3. Then scale up

---

## 🆘 Still Not Working?

Share these with me:

1. **Terminal output when N8N sends a call**
2. **N8N execution log** (what does HTTP Request node show?)
3. **Database query result:**
```sql
SELECT COUNT(*) as total_calls FROM calls WHERE user_id = 'YOUR_USER_ID';
```
4. **Column check:**
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'calls';
```

---

**Most common fix: Run the ALTER TABLE commands to add missing columns!** 🎯

