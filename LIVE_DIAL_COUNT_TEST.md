# 📞 Live Dial Count - Testing Guide

## ✅ It's Already Set Up!

Your dashboard updates **LIVE every 1 second** when AI is running!

---

## 🧪 Quick Test (Without N8N)

**Test if live updates work:**

**Terminal 1:** Keep your app running (`npm run dev`)

**Terminal 2:** Run these commands one by one:

```bash
# Send dial count 1
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","queueRemaining":1}'

# Wait 2 seconds, then send count 2
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","queueRemaining":2}'

# Wait 2 seconds, then send count 3
curl -X POST https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","queueRemaining":3}'
```

**Watch your dashboard** - the number should update **within 1 second** each time! No refresh needed!

---

## 🎯 For N8N to Send Live Updates

### **Inside Your Loop - HTTP Request:**

**URL:**
```
https://5e371d8d779a.ngrok-free.app/api/ai-control/update-queue
```

**Body - Using Fields Below:**
- `userId`: `{{ $json.userId }}`
- `queueRemaining`: `={{ $itemIndex + 1 }}`

### **What Happens:**

**Loop 1:** N8N sends `queueRemaining: 1` → Dashboard shows **1** (within 1 second)
**Loop 2:** N8N sends `queueRemaining: 2` → Dashboard shows **2** (within 1 second)
**Loop 3:** N8N sends `queueRemaining: 3` → Dashboard shows **3** (within 1 second)

**All automatic! No refresh needed!**

---

## 🔍 What You Should See

### **On Dashboard:**

```
┌─────────────────────────┐
│ Leads Dialed            │
│       1                 │  ← Updates live!
│ calls                   │
└─────────────────────────┘
```

Number changes: 0 → 1 → 2 → 3 → ... → 10

### **In Terminal:**

```
📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 1 }
✅ Queue updated successfully to 1

📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 2 }
✅ Queue updated successfully to 2
```

---

## ⚡ It's Already Working!

The live polling is active! Just make sure:

1. **N8N is sending updates** (check terminal for "📨 Update queue endpoint called")
2. **ngrok is running**
3. **Dashboard page is open** on AI Control Center

**The count updates automatically every second!** ✨

---

## 🎯 Summary

**Dashboard:** ✅ Already polling every 1 second
**N8N:** Just needs to POST to ngrok URL with `queueRemaining`
**Result:** Live count! 📈

**Test with the curl commands to see it work instantly!**

