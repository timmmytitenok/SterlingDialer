# 🐛 Debug: N8N Webhook Not Receiving Data

## Quick Checklist

### ✅ Step 1: Is Your N8N Workflow ACTIVE?

**In N8N:**
1. Go to your workflow
2. Look at the top - should say **"Active"** (not "Inactive")
3. If it says "Inactive" → Click to activate it!

**This is the #1 reason webhooks don't work!**

---

### ✅ Step 2: Check Your Dashboard Terminal

When you click "Start AI", you should see:

```
🚀 Starting AI with settings: { liveTransfer: true, dailyCallLimit: 10 }
📤 Sending to N8N: { userId: '...', dailyCallLimit: 10, ... }
```

**Do you see this?**

**If YES** → Dashboard is sending correctly ✅  
**If NO** → Something's wrong with the dashboard

---

### ✅ Step 3: Test the Webhook Directly

**Run this in terminal:**

```bash
curl -X POST https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137 \
  -H "Content-Type: application/json" \
  -d '{"test":"hello","dailyCallLimit":5}'
```

**Then check N8N Executions tab**

**If you see an execution** → Webhook works! ✅  
**If no execution** → Workflow is inactive or webhook URL is wrong

---

### ✅ Step 4: Check Environment Variable is Loaded

**In your app terminal, run:**

```bash
echo $N8N_WEBHOOK_START_DIAL
```

**Should show:**
```
https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

**If blank** → Environment variable not loaded!

**Fix:**
1. Check `.env.local` has the variable
2. Restart your dev server: `npm run dev`

---

## 🔍 Common Issues

### Issue 1: Workflow is Inactive

**Symptom:** No executions appear in N8N

**Fix:**
1. Open workflow in N8N
2. Click "Activate" button (top right)
3. Should turn green/say "Active"

### Issue 2: Dev Server Not Restarted

**Symptom:** Environment variable not found

**Fix:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue 3: Wrong Webhook URL

**Symptom:** 404 error or no response

**Fix:**
- Check `.env.local` has correct URL
- Should end with `/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137`

---

## 🧪 Quick Test

**Test 1: Can you reach the webhook?**
```bash
curl https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

**Test 2: Can you POST to it?**
```bash
curl -X POST https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137 \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

**Check N8N Executions** - should see a new execution!

---

## 📋 What to Check:

1. **N8N workflow is ACTIVE** ← Most common issue!
2. **Dashboard terminal shows "📤 Sending to N8N"**
3. **N8N Executions tab shows new runs**
4. **Environment variable is loaded**
5. **Dev server was restarted after adding .env.local**

---

## 🎯 Tell Me:

1. **Is your N8N workflow Active or Inactive?**
2. **When you click Start AI, do you see "📤 Sending to N8N" in terminal?**
3. **Does the curl test create an execution in N8N?**

With these answers, I can pinpoint the exact issue!

