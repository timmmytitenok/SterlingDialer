# 🧪 Queue Update Testing - Step by Step

## Issue: Queue not updating live

Let's debug this step by step!

---

## Step 1: Get Your User ID

**In Supabase:**
1. Go to Authentication → Users
2. Find your email
3. Copy the UUID (looks like: `550e8400-e29b-41d4-a716-446655440000`)

**OR check your browser console:**
1. Open AI Control Center page
2. Press F12 (open dev tools)
3. Look for logs that show: `🔄 Live queue component mounted`
4. It should show your userId

---

## Step 2: Test the Endpoint

**Replace `YOUR_USER_ID` with your actual UUID:**

```bash
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","queueRemaining":77}'
```

**Expected:**
```json
{"success":true,"queueRemaining":77}
```

**Check app terminal:**
```
📨 Update queue endpoint called
📦 Received body: { userId: 'YOUR_USER_ID', queueRemaining: 77 }
✅ Queue updated successfully
```

---

## Step 3: Check Dashboard Updates

**Open AI Control Center page:**

1. Open browser console (F12)
2. You should see every 2 seconds:
   ```
   🔍 Polling for queue updates...
   📊 Queue data: { queue_length: 77, status: 'stopped' }
   ✅ Queue updated: 0 → 77
   ```

3. The queue number on the page should change to **77**!

---

## Step 4: Test from N8N

**In your HTTP Request node:**

**Body (Using Fields Below):**

**Field 1:**
- Name: `userId`
- Value (expression): `{{ $json.userId }}`

**Field 2:**
- Name: `queueRemaining`
- Value: `50` (plain number)

**Click "Test Step"**

**Check app terminal** - should see:
```
📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 50 }
✅ Queue updated successfully
```

**Check dashboard** - queue should update to 50 within 2 seconds!

---

## 🔍 Debugging

### Problem: No logs in terminal

**Fix:** ngrok might not be forwarding requests
- Check ngrok terminal shows incoming requests
- Make sure URL in N8N is correct

### Problem: "userId is required" error

**Fix:** N8N isn't sending userId
- Check HTTP Request body has userId field
- Make sure expression is `{{ $json.userId }}`

### Problem: Queue updates in database but not on screen

**Fix:** Polling isn't working
1. Open browser console (F12)
2. Should see logs every 2 seconds
3. If no logs → Component not rendering correctly

### Problem: "Error fetching queue"

**Fix:** User ID mismatch
- Check the userId in the request matches your actual user ID
- Get user ID from Supabase Authentication tab

---

## ✅ Success Checklist

- [ ] Can access endpoint: `curl GET https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue` works
- [ ] Can update queue: `curl POST` with userId and queueRemaining works
- [ ] Terminal shows: "📨 Update queue endpoint called"
- [ ] Browser console shows: "🔍 Polling for queue updates..." every 2 seconds
- [ ] Queue number on page updates within 2 seconds
- [ ] N8N HTTP Request test step succeeds

---

## 🎯 Quick Fix

If nothing works, try this:

**1. Refresh the page completely** (Cmd+Shift+R)

**2. Open browser console** (F12)

**3. Run this test:**
```bash
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","queueRemaining":99}'
```

**4. Watch browser console** - within 2 seconds you should see:
```
📊 Queue data: { queue_length: 99, status: 'stopped' }
✅ Queue updated: X → 99
```

**5. Queue on page should show 99!**

---

**Follow these steps and tell me where it fails!** 🔍

