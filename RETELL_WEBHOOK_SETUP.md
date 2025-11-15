# 🔗 Retell Webhook Setup Guide

## ✅ N8N IS GONE! New Call-by-Call System

Your AI Control Center now uses a **completely new system** that makes calls one-by-one using Retell's API directly. No more N8N!

---

## 🎯 How The New System Works

### When You Hit "Launch AI":

1. **You select 1 lead** (or any number from 1-600)
2. **AI Control starts** and sets status to "running"
3. **First call is made** to Retell API with the next callable lead
4. **Retell makes the call** to your lead
5. **Call completes** and Retell sends webhook to your app
6. **Your app processes the result:**
   - Updates lead status (answered/no answer/outcome)
   - Deducts balance if answered
   - Updates daily spend
   - Checks if limits reached
7. **If still running**, immediately triggers the next call
8. **Repeats** until target reached or AI stopped

---

## 📡 Your Webhook URL

Go to the **Admin Panel → Webhooks** page to get your webhook URL.

It will look like:
```
https://your-domain.com/api/retell/call-result
```

---

## 🛠️ Setup In Retell Dashboard

### Step 1: Get Your Webhook URL

1. Log into your admin panel (click logo 10x, enter master password)
2. Go to **Admin Dashboard**
3. Click **"🔗 Webhooks"**
4. **Copy the webhook URL** from the page

### Step 2: Configure in Retell

1. Go to [Retell Dashboard](https://app.retellai.com)
2. Navigate to **Settings → Webhooks**
3. Click **"Add Webhook"**
4. Paste your webhook URL
5. Select event type: **`call.ended`**
6. Save the webhook

### Step 3: Test It!

1. Go back to your app
2. Make sure you have at least 1 lead in Lead Manager
3. Go to **AI Control Center**
4. Click **"Launch AI"**
5. Select **"Lead Count"** mode
6. Slide to **1 lead**
7. Click **"Deploy"**
8. Wait for the call!

---

## 📦 What Retell Sends

When a call completes, Retell will POST this to your webhook:

```json
{
  "call_id": "abc123...",
  "call_status": "ended",
  "call_type": "web_call",
  "agent_id": "agent_xxx",
  "start_timestamp": 1234567890,
  "end_timestamp": 1234567900,
  "transcript": "Full call transcript...",
  "recording_url": "https://...",
  "public_log_url": "https://...",
  "call_analysis": {
    "sentiment": "positive",
    "keywords": ["interested", "appointment"],
    ...
  },
  "disconnection_reason": "user_hangup",
  "metadata": {
    "user_id": "your-user-uuid",
    "lead_id": "lead-uuid",
    "attempt_number": 1
  }
}
```

---

## 🤖 How Your App Processes It

### 1. **Call Not Answered** (< 10 seconds)
- Status: `no_answer`
- Cost: **$0** (no charge)
- Retry: Will try **once more** on next call
- After 2 attempts: Lead marked as `no_answer`

### 2. **Call Answered** (> 10 seconds)
- Cost: **$0.10 per minute**
- Balance deducted automatically
- Daily spend updated
- Outcome detected from transcript/analysis:
  - 🚫 **Not Interested** → Lead marked as `not_interested`
  - 📞 **Callback Later** → Lead marked as `callback_later`
  - 📅 **Appointment Booked** → Lead marked as `appointment_booked`
  - 🔄 **Live Transfer** → Lead marked as `live_transfer`
  - ❓ **Unclassified** → Lead marked as `unclassified`

### 3. **Next Call Triggered**
- If AI still running
- If daily spend limit not reached
- If target lead count not reached
- Immediately fetches next callable lead and dials

---

## 🎛️ Execution Modes

### Lead Count Mode
- Dials exactly **X leads** then stops
- Perfect for testing (1 lead = just you!)
- Example: Select 1 lead, it calls 1 lead, then stops

### Time Mode
- Runs until a **specific time** (e.g., 6:00 PM)
- Keeps calling until that time
- Example: Start at 2 PM, set target 6 PM, calls for 4 hours

---

## 📊 Monitoring Webhooks

### Admin Webhooks Page
- Shows your webhook URL
- Displays **last 10 calls** received
- See call status, outcome, duration in real-time
- Auto-refreshes

### What You Can See:
- ✅ Call ID
- ✅ Answered/No Answer status
- ✅ Outcome (interested, callback, etc.)
- ✅ Duration in minutes
- ✅ Timestamp
- ✅ Cost deducted

---

## 🛑 Stopping The AI

### Auto-Stop Conditions:
1. **Daily spend limit reached** (e.g., $10)
2. **Target lead count reached** (Lead Count mode)
3. **Target time reached** (Time mode)
4. **No more callable leads** available
5. **User clicks Stop button**

### Manual Stop:
- Click the **"Stop"** button in AI Control Center
- AI immediately stops after current call completes
- Does not trigger next call

---

## 🐛 Debugging

### If Calls Aren't Working:

1. **Check Retell Config** (Admin → Manage Users)
   - Make sure your `retell_agent_id` is set
   - Make sure your `phone_number` is in E.164 format (+15551234567)

2. **Check Webhook Setup** (Admin → Webhooks)
   - Verify webhook URL is correct
   - Test webhook in Retell dashboard
   - Check recent calls section for incoming webhooks

3. **Check Callable Leads**
   - Go to Lead Manager
   - Make sure you have leads with status:
     - `new` (never called)
     - `callback_later` (wants callback)
     - `no_answer` (< 2 attempts)

4. **Check Balance**
   - Make sure you have call balance
   - Check Settings → Call Balance

5. **Check Browser Console**
   - Open Dev Tools (F12)
   - Check Network tab for API calls
   - Look for errors in Console tab

---

## 🎉 Success Indicators

### When Everything Is Working:

1. ✅ You select 1 lead in AI Control
2. ✅ Click Launch
3. ✅ AI status changes to "Running"
4. ✅ Your phone rings within 10-30 seconds
5. ✅ After call ends, webhook appears in Admin → Webhooks
6. ✅ Lead status updates in Lead Manager
7. ✅ Balance is deducted (if answered)
8. ✅ AI stops (since target of 1 lead reached)

---

## 📞 Testing With Your Own Number

1. Add yourself as a lead in Lead Manager
2. Make sure your state is set (not "N/A")
3. Select **1 lead** in AI Control
4. Launch AI
5. Answer your phone
6. Talk to the AI agent
7. Check the webhook to see the result!

---

## 🚨 Important Notes

- **Webhook is PUBLIC** - No authentication required (Retell needs to call it)
- **Service Role Key** - Webhook uses service role to bypass RLS
- **Metadata is crucial** - We pass `user_id` and `lead_id` in metadata
- **Call chaining** - Each webhook triggers the next call automatically
- **No manual intervention** - System is fully automated once started

---

## 🎯 Next Steps

1. ✅ Run the Retell config SQL (if not done)
2. ✅ Configure your Retell Agent ID (Admin → Manage Users)
3. ✅ Get your webhook URL (Admin → Webhooks)
4. ✅ Configure webhook in Retell dashboard
5. ✅ Add yourself as a test lead
6. ✅ Launch with 1 lead
7. ✅ Answer the call and test!

---

**You're all set! No more N8N bullshit!** 🎉

