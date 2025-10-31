# 🔍 Debug: Why N8N Webhook Isn't Triggering

## Common Issues & Solutions

### **Issue 1: Missing Environment Variable** ⚠️

**Check if you have this in `.env.local`:**

```bash
N8N_WEBHOOK_START_DIAL=https://your-n8n-url/webhook/...
```

**How to check:**
1. Open `.env.local` file in your project root
2. Look for `N8N_WEBHOOK_START_DIAL`
3. If missing, add it!

**Format:**
```bash
N8N_WEBHOOK_START_DIAL=https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

**After adding:**
- Save the file
- **Restart your dev server** (Ctrl+C and `npm run dev`)

---

### **Issue 2: Webhook URL is Wrong** ❌

**Your N8N webhook URL should be:**
- Production N8N: `https://timmmytitenok.app.n8n.cloud/webhook/your-webhook-id`
- Local N8N: `http://localhost:5678/webhook/your-webhook-id`

**Where to find it:**
1. Open your N8N workflow
2. Click on the **Webhook trigger node**
3. Copy the **"Production URL"** or **"Test URL"**

---

### **Issue 3: N8N Workflow Not Active** 🔴

**Make sure:**
1. Your N8N workflow is **Active** (toggle in top right)
2. The webhook node is the **first node** (trigger)
3. Webhook is set to **"Production"** mode (not test)

---

### **Issue 4: Server Not Restarted** 🔄

**If you just added the env variable:**
1. Stop your server (Ctrl+C)
2. Run `npm run dev` again
3. Try launching AI again

---

## 🔬 How to Debug

### **Step 1: Check Terminal Logs**

**When you click "Launch AI Agent", watch your terminal.**

**You should see:**
```
🚀 Starting AI with settings: {...}
📤 Sending to N8N: {...}
📡 N8N Response Status: 200
✅ N8N response received: {...}
```

**If you see:**
```
🚀 Starting AI with settings: {...}
```
**But NO "📤 Sending to N8N":**
- Environment variable is missing!
- Add `N8N_WEBHOOK_START_DIAL` to `.env.local`

---

### **Step 2: Check .env.local**

**Run this in terminal:**
```bash
cat .env.local | grep N8N_WEBHOOK
```

**Should output:**
```
N8N_WEBHOOK_START_DIAL=https://...
```

**If empty:**
- Variable is not set
- Add it now!

---

### **Step 3: Test N8N Webhook Manually**

**Test if N8N is receiving requests:**

```bash
curl -X POST https://your-n8n-url/webhook/your-id \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "action": "start",
    "executionMode": "leads",
    "targetLeadCount": 1
  }'
```

**If this works:**
- N8N is fine
- Problem is with your app's env variable

**If this fails:**
- N8N workflow is not active
- Webhook URL is wrong

---

### **Step 4: Add Debug Logging**

**Temporary fix to see what's happening:**

In your terminal, when you launch AI, you should see logs.

**If you see this:**
```
🚀 Starting AI with settings: {...}
```

**But NOT this:**
```
📤 Sending to N8N: {...}
```

**Then:** `webhookUrl` is undefined (environment variable missing)

---

## ✅ Quick Fix Checklist

1. [ ] Open `.env.local` in project root
2. [ ] Add this line:
   ```
   N8N_WEBHOOK_START_DIAL=https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
   ```
3. [ ] Save the file
4. [ ] Stop dev server (Ctrl+C)
5. [ ] Start dev server (`npm run dev`)
6. [ ] Go to AI Control Center
7. [ ] Click "Launch AI Agent"
8. [ ] Go through the flow
9. [ ] Watch terminal for "📤 Sending to N8N"

---

## 🎯 Most Likely Solution

**99% of the time it's one of these:**

1. **Missing env variable** → Add `N8N_WEBHOOK_START_DIAL` to `.env.local`
2. **Server not restarted** → Restart after adding variable
3. **Wrong webhook URL** → Copy from N8N workflow

---

## 📋 What the Code Does

**Line 65:** Reads environment variable
```typescript
const webhookUrl = process.env.N8N_WEBHOOK_START_DIAL;
```

**Line 68:** Only calls N8N if URL exists
```typescript
if (webhookUrl) {
  // Call N8N
}
```

**If `webhookUrl` is undefined:**
- Skips N8N call
- Still updates database
- AI status shows "running"
- But N8N never gets triggered!

---

## 🆘 Still Not Working?

**Share with me:**
1. Terminal output when you click launch
2. Contents of your `.env.local` (just the N8N line)
3. Your N8N webhook URL from the workflow

**I'll help you fix it!** 🔧

