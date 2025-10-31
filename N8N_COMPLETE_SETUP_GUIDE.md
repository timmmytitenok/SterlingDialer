# 🤖 N8N Setup Guide - Simplest Version

## 3 Nodes Total - That's It!

```
[Webhook Trigger] → [HTTP Request] → [Respond to Webhook]
```

---

## ✅ Node 1: Webhook Trigger (Already Set Up)

**Your webhook URL:**
```
https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

### **ONLY Setting to Check:**

**Response Mode:** MUST be `"Wait for Webhook Response"`

**How to check:**
1. Click on Webhook node
2. Look for "Respond" or "Response Mode" setting
3. Change to "Wait for Webhook Response"

**That's it for Node 1!** ✅

---

## ✅ Node 2: HTTP Request (Update Queue)

**Purpose:** Tell dashboard to update the queue number

### **Setup:**

1. Click **+** after Webhook
2. Search: `HTTP Request`
3. Add it

### **Settings:**

**Method:** `POST`

**URL:**
```
https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue
```
☝️ Use YOUR ngrok URL!

**Authentication:** `None`

**Send Body:** `Yes`

**Body Content Type:** `JSON`

**Specify Body:** `Using Fields Below`

**Click "Add Field" twice:**

**Field 1:**
- Name: `userId`
- Value: Click `=` button (expression)
- Paste: `{{ $json.userId }}`

**Field 2:**
- Name: `queueRemaining`
- Value: Type: `5` (plain number)

**That's it for Node 2!** ✅

---

## ✅ Node 3: Respond to Webhook (FINAL)

**Purpose:** Tell dashboard we're done

### **Setup:**

1. Click **+** after HTTP Request
2. Search: `Respond to Webhook`
3. Add it

### **Settings:**

**Response Code:** `200`

**Response Body:** Paste this EXACT JSON:

```
{"status":"finished","callsMade":5}
```

**ALL ON ONE LINE! No line breaks!**

**That's it for Node 3!** ✅

---

# 🧪 Test Your Workflow

## Step 1: Test in N8N

1. Click **"Test Workflow"** button
2. Should complete without errors
3. Check your app terminal

**Expected in terminal:**
```
📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 5 }
✅ Queue updated successfully to 5

📄 N8N Raw Response: {"status":"finished","callsMade":5}
✅ N8N response received: { status: 'finished', callsMade: 5 }
✅ AI status updated to stopped
```

---

## Step 2: Test from Dashboard

1. Go to **AI Control Center**
2. Click **"Start AI"**
3. Watch:
   - Status changes to 🟢 Running
   - Queue updates to 5
   - After ~2 seconds: Status changes to 🔴 Stopped
   - Message: "✅ AI automation completed! 5 calls made."

---

# 🎯 Making It Dynamic

Once the basic 3-node workflow works, make the numbers dynamic:

## For HTTP Request (queueRemaining):

**Option 1 - Simple counter:**
```
{{ 10 }}  ← Start here
{{ 9 }}
{{ 8 }}
...
```
Manually decrease it in a loop

**Option 2 - Use expression (if in a loop):**
```
={{ $json.dailyCallLimit - $itemIndex - 1 }}
```

## For Respond to Webhook (callsMade):

**Change from:**
```json
{"status":"finished","callsMade":5}
```

**To (dynamic):**
```json
{"status":"finished","callsMade":={{ $json.dailyCallLimit }}}
```

**Notice:** No quotes around the `={{ }}` for numbers!

---

# ⚠️ Critical Settings

## Webhook Trigger:
- ✅ Response Mode = "Wait for Webhook Response"

## HTTP Request:
- ✅ URL = Your ngrok URL + `/api/ai-control/update-queue`
- ✅ Body = Using Fields Below
- ✅ Has userId field (expression)
- ✅ Has queueRemaining field (number)

## Respond to Webhook:
- ✅ Is the LAST node
- ✅ Response Code = 200
- ✅ Body = Using Fields Below
- ✅ status = "finished"
- ✅ callsMade = number

---

# 🐛 Troubleshooting

## Dashboard stays "Running" forever

**Fix:** Respond to Webhook not configured correctly
- Check it's the LAST node
- Check status field = "finished" (not "complete")
- Check it's sending response

## Queue doesn't update

**Fix:** HTTP Request not being called
- Check ngrok is running
- Check URL is correct with `/api/ai-control/update-queue`
- Test the node separately

## "JSON parameter needs to be valid JSON"

**Fix:** Use "Using Fields Below" mode, not raw JSON

---

# ✅ Final Checklist

Before testing:
- [ ] Webhook: Response Mode = "Wait for Webhook Response"
- [ ] HTTP Request: Has correct ngrok URL
- [ ] HTTP Request: Body has userId and queueRemaining fields
- [ ] Respond to Webhook: Is last node
- [ ] Respond to Webhook: Has status and callsMade fields
- [ ] ngrok running in terminal
- [ ] App running: npm run dev
- [ ] Workflow is ACTIVE (not paused)

---

# 🚀 You're Done!

**Just 3 nodes:**
1. Webhook (check response mode)
2. HTTP Request (update queue)
3. Respond to Webhook (send finished)

**Test with fixed numbers first, then make dynamic later!**

That's the simplest possible setup! 🎯
