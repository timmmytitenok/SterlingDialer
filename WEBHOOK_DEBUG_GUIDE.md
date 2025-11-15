# 🔍 Webhook Debug System - Complete Guide

## ✅ **What I Added:**

1. **📋 Extensive Terminal Logging** - See every webhook in console
2. **💾 Database Logging** - Save all webhooks to `webhook_logs` table  
3. **🖥️ UI Dashboard** - View webhooks at `/admin/webhooks`
4. **🔄 Auto-Refresh** - Updates every 3 seconds

---

## 🚀 **How to Use:**

### **Step 1: Create the Database Table**

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste from CREATE_WEBHOOK_LOGS_TABLE.sql
-- Or run: psql -f CREATE_WEBHOOK_LOGS_TABLE.sql
```

**File location:** `CREATE_WEBHOOK_LOGS_TABLE.sql` in your project root

---

### **Step 2: Make a Test Call**

1. Go to `/dashboard/ai-control`
2. Launch AI with 1 lead
3. Wait for the call to complete

---

### **Step 3: Check Terminal Logs**

Your server terminal will show:

```
🚨 ========== RETELL WEBHOOK RECEIVED ==========
⏰ Timestamp: 2025-11-11T06:35:03.353Z
🌐 Request URL: http://localhost:3000/api/retell/call-result
📋 Request Headers: {
  'content-type': 'application/json',
  'user-agent': 'Retell-Webhook/1.0',
  ...
}
📦 Full Webhook Body: {
  "call_id": "abc123",
  "call_status": "ended",
  "start_timestamp": 1699707000000,
  "end_timestamp": 1699707042000,
  "transcript": "Hello, this is...",
  "metadata": {
    "user_id": "user-123",
    "lead_id": "lead-456",
    ...
  },
  ...
}
🔍 Body Keys: ['call_id', 'call_status', 'metadata', ...]
📞 Call ID: abc123
📊 Call Status: ended
🎯 Metadata: { user_id: 'xxx', lead_id: 'yyy' }
🚨 ============================================
✅ Webhook logged to database
```

---

### **Step 4: Check UI Dashboard**

Go to: **`http://localhost:3000/admin/webhooks`**

You'll see:
- ✅ Webhook URL to paste into Retell
- ✅ Recent webhooks (auto-refreshes every 3 seconds)
- ✅ Call details, duration, status
- ✅ Full payload for each webhook

---

## 📊 **What the Logs Show:**

### **Terminal Logs:**
- ⏰ Exact timestamp
- 🌐 Request URL
- 📋 All HTTP headers
- 📦 **FULL webhook body** (complete JSON)
- 🔍 All object keys
- 📞 Call ID
- 📊 Call status
- 🎯 Metadata (user_id, lead_id, etc.)

### **Database Logs:**
Stored in `webhook_logs` table:
- `id` - Unique log ID
- `webhook_type` - Always "retell_call_result"
- `call_id` - Retell call ID
- `user_id` - Your user ID
- `lead_id` - Lead that was called
- `payload` - **Full JSON body** from Retell
- `headers` - HTTP headers
- `status` - Processing status
- `created_at` - Timestamp

---

## 🔍 **Debugging Steps:**

### **Problem: No webhooks showing at all**

**Check 1: Is Retell configured?**
```
1. Go to Retell dashboard
2. Settings → Webhooks
3. Add your webhook URL
4. Select "Call Ended" event
```

**Check 2: Is ngrok running?**
```bash
# Your webhook URL should be:
https://YOUR_NGROK_URL/api/retell/call-result

# NOT localhost (Retell can't reach localhost)
```

**Check 3: Check terminal for ANY requests**
```
Look for: "🚨 ========== RETELL WEBHOOK RECEIVED =========="
If missing: Retell is NOT sending webhooks
```

---

### **Problem: Webhooks received but UI not updating**

**Check 1: Are webhooks being saved?**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

**Check 2: Check terminal for errors**
```
Look for: "❌ Failed to log webhook"
If present: Check Supabase connection
```

**Check 3: Auto-refresh working?**
```
- Webhooks page refreshes every 3 seconds
- Lead Manager refreshes every 3 seconds
- Dashboard refreshes every 5 seconds
- Check browser console for errors
```

---

### **Problem: Webhooks show but leads don't update**

**Check terminal logs for:**

```
✅ Webhook logged to database
📊 Call abc123: Duration 0.42min, Answered: true
✅ Call answered: outcome = not_interested, cost = $0.04
💰 Balance updated: -$0.04, new balance: $9.96
🔄 Triggering next call...
```

**If you see these, the system is working!**

**If you see errors:**
- `❌ Missing user_id or lead_id in metadata` → Retell not sending metadata
- `❌ AI settings not found` → Database issue
- `❌ Lead not found` → Lead deleted or wrong ID

---

## 🎯 **Expected Webhook Flow:**

1. **Call starts** → Retell dials number
2. **Call ends** → Retell sends webhook
3. **Webhook received** → Terminal shows big log block
4. **Saved to database** → `webhook_logs` table
5. **Process result** → Update lead, balance, spend
6. **Check for more leads** → Continue or stop AI
7. **UI updates** → Within 3-5 seconds

---

## 📋 **What Retell Should Send:**

```json
{
  "call_id": "abc123",
  "call_status": "ended",
  "call_type": "outbound",
  "agent_id": "agent_xxx",
  "start_timestamp": 1699707000000,
  "end_timestamp": 1699707042000,
  "duration": 42,
  "transcript": "Full conversation...",
  "recording_url": "https://...",
  "public_log_url": "https://...",
  "call_analysis": {
    "summary": "...",
    "outcome": "not_interested"
  },
  "disconnection_reason": "hangup",
  "metadata": {
    "user_id": "your-user-id",
    "lead_id": "lead-id",
    "lead_name": "Timmmy",
    "attempt_number": 2
  }
}
```

---

## 🔧 **Manual Testing:**

You can test the webhook manually with `curl`:

```bash
curl -X POST http://localhost:3000/api/retell/call-result \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test-123",
    "call_status": "ended",
    "start_timestamp": 1699707000000,
    "end_timestamp": 1699707042000,
    "metadata": {
      "user_id": "YOUR_USER_ID",
      "lead_id": "YOUR_LEAD_ID",
      "attempt_number": 1
    }
  }'
```

**Replace:**
- `YOUR_USER_ID` - Your Supabase user ID
- `YOUR_LEAD_ID` - A real lead ID from your database

---

## 📊 **Viewing Logs:**

### **Option 1: Terminal**
- Just watch your server terminal
- Logs appear immediately when webhook received

### **Option 2: UI Dashboard**
- Go to `/admin/webhooks`
- Auto-refreshes every 3 seconds
- Shows recent calls and payloads

### **Option 3: Database**
```sql
-- View all webhooks
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- View webhooks for specific user
SELECT * FROM webhook_logs 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- View webhooks from last hour
SELECT * FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## ✅ **Success Checklist:**

When everything works, you'll see:

- ✅ Terminal shows `🚨 ========== RETELL WEBHOOK RECEIVED ==========`
- ✅ Terminal shows `✅ Webhook logged to database`
- ✅ Terminal shows `✅ Call answered: outcome = ...`
- ✅ Terminal shows `🔄 Triggering next call...`
- ✅ `/admin/webhooks` shows the webhook
- ✅ Lead Manager shows updated status
- ✅ Dashboard shows increased calls count

---

## 🎉 **You're All Set!**

Now you can:
- 📋 See EXACTLY what Retell is sending
- 🔍 Debug any webhook issues immediately
- 💾 Review historical webhooks
- 🎯 Verify call outcomes
- 🛠️ Troubleshoot UI update issues

**Make a test call and watch the logs! 🚀**

