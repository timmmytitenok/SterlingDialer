# 🧪 Testing Call Updates

## Quick Test

### Step 1: Get Your User ID

**Go to Supabase:**
1. Authentication → Users
2. Find your email
3. Copy the UUID

### Step 2: Send a Test Call

**Replace YOUR_USER_ID and run:**

```bash
curl -X POST https://5e371d8d779a.ngrok-free.app/api/calls/update \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "contactName": "Test Contact",
    "contactPhone": "(555) 123-4567",
    "pickedUp": true,
    "outcome": "appointment_booked",
    "duration": 120
  }'
```

### Step 3: Check Terminal

**You should see:**
```
📞 Call update received from N8N
📦 Call data: { userId: '...', contactName: 'Test Contact', pickedUp: true, ... }
✅ Call saved: Test Contact - answered - Picked up: true
```

### Step 4: **REFRESH Dashboard Page**

**Important:** Dashboard stats update on page load!

1. Go to Dashboard page
2. Press **Cmd+R** (Mac) or **Ctrl+R** (Windows)
3. Stats should increment!

---

## ✅ What Should Update:

After sending test call:
- **Total Dials** → +1
- **Booked Appointments** → +1  
- **Total Calls** → +1
- **Connected Rate** → Updates
- **Appointments** stat → +1

**Activity Logs:**
- Should show "Test Contact"
- Shows as "Booked" (green badge)

---

## 🔍 Verify It Saved

**Check Supabase:**
1. Table Editor → `calls`
2. Should see your test call
3. Check fields: contact_name, disposition, outcome

---

**The endpoint is working! You just need to refresh the page to see updates!** 🔄

