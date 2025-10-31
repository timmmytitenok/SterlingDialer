# 🧪 Testing Queue Updates

## Quick Test to Verify Queue Updates Work

### **Step 1: Test the Endpoint Directly**

Open a new terminal and run:

```bash
# Replace USER_ID with your actual user ID from Supabase
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","queueRemaining":25}'
```

**To get your USER_ID:**
1. Go to Supabase → Authentication → Users
2. Copy your user ID

**Expected response:**
```json
{"success":true,"queueRemaining":25,"updated":[...]}
```

**Check your app terminal - should see:**
```
📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 25 }
🔄 Updating queue for user ... to 25
✅ Queue updated successfully
```

**Check your dashboard:**
- Refresh AI Control Center page
- Queue should show: **25 leads**

---

### **Step 2: Test from N8N**

**In your HTTP Request node:**

**URL:**
```
https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue
```

**Body (Using Fields Below):**
- Field 1: `userId` = (expression) `{{ $json.userId }}`
- Field 2: `queueRemaining` = (plain number) `15`

**Click "Test Step"**

**Expected in terminal:**
```
📨 Update queue endpoint called
📦 Received body: { userId: 'abc-123', queueRemaining: 15 }
✅ Queue updated successfully
```

---

### **Step 3: Test Live Updates**

**Now with the new live component:**

1. Go to AI Control Center
2. Keep the page open
3. In terminal, run the curl command with different numbers:
   ```bash
   curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
     -H "Content-Type: application/json" \
     -d '{"userId":"YOUR_USER_ID","queueRemaining":20}'
   ```

4. **Watch the dashboard** - within 2 seconds, queue should update to **20**!

5. Run again with 15:
   ```bash
   curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
     -H "Content-Type: application/json" \
     -d '{"userId":"YOUR_USER_ID","queueRemaining":15}'
   ```

6. Queue should update to **15** without refreshing!

---

## 🔍 **Debugging Queue Updates**

### **Issue: Queue Not Updating**

**Check 1: Is ngrok running?**
```bash
# In ngrok terminal, should see requests coming in
```

**Check 2: Is endpoint being called?**
```bash
# In app terminal, should see:
📨 Update queue endpoint called
```

**Check 3: Is userId correct?**
```bash
# In terminal, the userId in the request should match your user
```

**Check 4: Is data updating in database?**
```sql
-- In Supabase SQL Editor:
SELECT queue_length, status FROM ai_control_settings 
WHERE user_id = 'YOUR_USER_ID';
```

---

## 🔧 **Fix: Respond to Webhook Not Stopping AI**

### **Make sure your "Respond to Webhook" sends:**

```json
{
  "status": "finished",
  "callsMade": 5
}
```

**Test it:**

1. Click "Test Workflow" in N8N
2. Check dashboard terminal immediately:

**You MUST see:**
```
📄 N8N Raw Response: {"status":"finished","callsMade":5}
✅ N8N response received: { status: 'finished', callsMade: 5 }
🔄 N8N finished - updating AI status to stopped
✅ AI status updated to stopped
```

**If you see:**
```
⚠️ N8N response status: undefined (expected "finished" or "completed")
```

→ Your Respond to Webhook is not sending the right format!

---

## 📋 **N8N Checklist:**

### HTTP Request Node:
- [ ] URL: `https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue`
- [ ] Method: POST
- [ ] Body: Using Fields Below
- [ ] Field `userId` with expression `{{ $json.userId }}`
- [ ] Field `queueRemaining` with number (10 for test)
- [ ] Test Step shows success

### Respond to Webhook Node:
- [ ] Is the absolute LAST node
- [ ] Response Code: 200
- [ ] Response Body: JSON or Fields Below
- [ ] Has field `status` = `finished`
- [ ] Has field `callsMade` = `5`
- [ ] Test shows it sends response

### Webhook Trigger:
- [ ] Response Mode: "Wait for Webhook Response"
- [ ] Workflow is ACTIVE
- [ ] Can see incoming requests

---

## 🎯 **What Should Happen:**

1. **Click Start AI** → Queue shows 20 immediately
2. **N8N sends update** → Queue changes to 19 (within 2 seconds)
3. **N8N sends update** → Queue changes to 18 (within 2 seconds)
4. **N8N finishes** → AI status changes to Stopped, queue to 0

**All without manual refresh!** ✨

---

## 🆘 **Still Not Working?**

Run this test and share the results:

```bash
# Test 1: Update queue
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","queueRemaining":99}'

# Wait 2 seconds, check if queue shows 99 on dashboard
```

If this works → N8N HTTP Request setup is wrong  
If this doesn't work → Dashboard issue (check terminal logs)

