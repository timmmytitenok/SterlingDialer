# 🚀 Simple N8N Setup - Step by Step

## Quick Setup (5 Minutes)

### Your Workflow Needs 3 Nodes:

```
[Webhook Trigger] → [HTTP Request] → [Respond to Webhook]
```

---

## 🎯 Node 1: Webhook Trigger

**Already set up at:**
```
https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

**Settings to check:**
- Method: POST ✅
- Response Mode: **"Wait for Webhook Response"** ⚠️ MUST BE SET!
- Click "Listen for Test Event" to see what dashboard sends

**What you'll receive from dashboard:**
```json
{
  "userId": "abc-123",
  "dailyCallLimit": 20,
  "liveTransferEnabled": true
}
```

---

## 🔄 Node 2: HTTP Request (Update Queue)

**Purpose:** Tell dashboard to update the queue number

**Settings:**
- Node Type: **HTTP Request**
- Method: **POST**
- URL: **`https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue`**
  ☝️ Use YOUR ngrok URL!

**Body - Use "Using Fields Below":**

Click **"Add Field"** twice:

**Field 1:**
- Name: `userId`
- Value: Click `=` icon, paste: `{{ $json.userId }}`

**Field 2:**
- Name: `queueRemaining`
- Value: Type: `10` (plain number for testing)

**Test it:**
- Click "Test Step"
- Should see success in your terminal!

---

## 🏁 Node 3: Respond to Webhook

**Purpose:** Tell dashboard "I'm done!"

**Settings:**
- Node Type: **Respond to Webhook**
- Response Code: **200**
- Response Body: **Define Below in 'Response Body'**

**IMPORTANT:** If you see options, choose **"JSON"** mode

### **For Raw JSON Mode:**

Paste this EXACTLY (no extra characters!):

```
{ "status": "finished", "callsMade": 5 }
```

☝️ **All on ONE line, no line breaks!**

### **For Fields Below Mode:**

Click "Add Field" twice:

**Field 1:**
- Name: `status`
- Value: `finished`

**Field 2:**
- Name: `callsMade`
- Value: `5`

---

## ✅ **Testing Your Setup:**

### **Test 1: Basic Flow**

1. Make sure all 3 nodes are connected
2. Click **"Test Workflow"** in N8N
3. Check your dashboard terminal - should see:
   ```
   ✅ Queue updated: 10 remaining
   ✅ N8N response received: { status: 'finished', callsMade: 5 }
   ✅ AI status updated to stopped
   ```

### **Test 2: From Dashboard**

1. Go to AI Control Center
2. Click "Start AI"
3. Watch:
   - Status immediately shows 🟢 Running
   - Terminal shows queue update
   - When N8N finishes: Status shows 🔴 Stopped

---

## 🐛 **Troubleshooting:**

### **Queue not updating?**

**Check terminal for:**
```
✅ Queue updated for user abc-123: 10 remaining
```

**If you don't see this:**
- N8N isn't calling the update-queue endpoint
- Check the HTTP Request node URL
- Make sure ngrok is running
- Test the HTTP Request node separately

### **Dashboard stays "Running" forever?**

**Problem:** Respond to Webhook isn't sending correct format

**Fix:**
1. Make sure Response Body is EXACTLY:
   ```
   { "status": "finished", "callsMade": 5 }
   ```
2. No extra spaces, no line breaks
3. Use "finished" not "complete" or "done"

**Check terminal for:**
```
✅ N8N response received: { status: 'finished', callsMade: 5 }
```

**If you see:**
```
⚠️ N8N response does not indicate completion
```
Then your response format is wrong!

---

## 📋 **Quick Checklist:**

### Webhook Trigger:
- [ ] Response Mode = "Wait for Webhook Response"

### HTTP Request (Update Queue):
- [ ] URL = Your ngrok URL + `/api/ai-control/update-queue`
- [ ] Method = POST
- [ ] Body has userId field
- [ ] Body has queueRemaining field
- [ ] Test Step shows success

### Respond to Webhook:
- [ ] Is the LAST node
- [ ] Response Code = 200
- [ ] Body = `{ "status": "finished", "callsMade": 5 }`
- [ ] No extra characters or line breaks

---

## 🎯 **Exact Copy-Paste:**

### **HTTP Request Body (Using Fields Below):**
```
Field 1:
Name: userId
Value (expression): {{ $json.userId }}

Field 2:
Name: queueRemaining
Value: 10
```

### **Respond to Webhook Body (Raw JSON):**
```
{ "status": "finished", "callsMade": 5 }
```

---

## 🧪 **Test Each Part:**

### **Test Update Queue Alone:**

In terminal, test the endpoint:
```bash
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id","queueRemaining":15}'
```

Should return: `{"success":true,"queueRemaining":15}`

---

**Follow this guide exactly and both issues should be fixed!** 🎯

The key problems are usually:
1. ngrok URL incorrect
2. Response body format wrong (extra spaces/breaks)
3. Response Mode not set to "Wait for Webhook Response"

