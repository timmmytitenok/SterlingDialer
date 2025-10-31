# 📞 N8N Call Updates - Complete Guide

## Overview

Send call results to the dashboard after each call so the Activity Logs and stats update automatically!

---

## 🎯 New Endpoint Created

**Endpoint:** `POST /api/calls/update`

**Purpose:** Receive call results from N8N and save to database

**URL (ngrok):**
```
https://5e371d8d779a.ngrok-free.app/api/calls/update
```

---

## 📤 What to Send from N8N

### **Required Fields:**

**userId** (string, required)
- The user ID from the original webhook
- Example: `"550e8400-e29b-41d4-a716-446655440000"`

**pickedUp** (boolean, required)
- `true` = Call was answered
- `false` = Call was not answered (no answer, busy, voicemail)

### **Optional Fields:**

**contactName** (string)
- Name of person called
- Example: `"John Smith"`

**contactPhone** (string)
- Phone number
- Example: `"(555) 123-4567"`

**disposition** (string)
- `"answered"`, `"no_answer"`, `"busy"`, `"voicemail"`, `"other"`
- If not provided, uses `pickedUp` to determine

**outcome** (string)
- `"appointment_booked"` - They booked!
- `"not_interested"` - Declined
- `"callback_later"` - Follow up needed
- `"other"` - Other result

**duration** (number)
- Call length in seconds
- Example: `145` (2 minutes 25 seconds)

**recordingUrl** (string)
- Link to call recording
- Example: `"https://recordings.com/call123.mp3"`

---

## 🔧 N8N Setup

### **Add HTTP Request Node After Each Call:**

**Node Name:** `Update Dashboard`

**Method:** POST

**URL:**
```
https://5e371d8d779a.ngrok-free.app/api/calls/update
```

**Body - Using Fields Below:**

**Field 1:**
- Name: `userId`
- Value: (expression) `{{ $json.userId }}`

**Field 2:**
- Name: `pickedUp`
- Value: `true` or `false` (based on your call result)
- If expression: `={{ $json.callAnswered }}`

**Field 3:**
- Name: `contactName`
- Value: (expression) `{{ $json.leadName }}`

**Field 4:**
- Name: `contactPhone`
- Value: (expression) `{{ $json.leadPhone }}`

**Field 5:**
- Name: `outcome`
- Value: `appointment_booked` (or based on call result)

**Field 6:**
- Name: `duration`
- Value: `120` (or actual call duration)

---

## 📊 Example Data Flow

### **Call 1: Answered & Booked**

**N8N sends:**
```json
{
  "userId": "abc-123",
  "contactName": "John Smith",
  "contactPhone": "(555) 123-4567",
  "pickedUp": true,
  "outcome": "appointment_booked",
  "duration": 145
}
```

**Dashboard saves:**
- ✅ Call to database
- ✅ Shows in Activity Logs
- ✅ Updates "Answered Calls" stat
- ✅ Updates "Appointments Booked" stat

---

### **Call 2: Not Answered**

**N8N sends:**
```json
{
  "userId": "abc-123",
  "contactName": "Jane Doe",
  "contactPhone": "(555) 987-6543",
  "pickedUp": false,
  "disposition": "no_answer"
}
```

**Dashboard saves:**
- ✅ Call to database
- ✅ Counts as dial attempt
- ✅ Updates "Not Answered" stat

---

### **Call 3: Answered but Not Interested**

**N8N sends:**
```json
{
  "userId": "abc-123",
  "contactName": "Bob Wilson",
  "contactPhone": "(555) 456-7890",
  "pickedUp": true,
  "outcome": "not_interested",
  "duration": 65
}
```

**Dashboard saves:**
- ✅ Shows in Activity Logs
- ✅ Updates "Not Interested" stat
- ✅ Counts as answered call

---

## 🧪 Testing

### **Test from Terminal:**

```bash
# Test a successful call
curl -X POST https://5e371d8d779a.ngrok-free.app/api/calls/update \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "contactName": "Test Contact",
    "contactPhone": "(555) 111-2222",
    "pickedUp": true,
    "outcome": "appointment_booked",
    "duration": 120
  }'
```

**Expected in terminal:**
```
📞 Call update received from N8N
📦 Call data: { userId: '...', contactName: 'Test Contact', pickedUp: true, ... }
✅ Call saved: Test Contact - answered - Picked up: true
```

**Then check:**
- Go to **Activity Logs** → Should see "Test Contact"
- Go to **Dashboard** → Stats should increment

---

## 🔄 Complete N8N Workflow

```
1. Webhook Trigger (receives start request)
   ↓
2. Loop through leads
   ↓
   For each lead:
   ├─ Make Call (your AI logic)
   │
   ├─ HTTP Request #1: Update Queue
   │  └─ POST to /api/ai-control/update-queue
   │      Body: { userId, queueRemaining: X }
   │
   └─ HTTP Request #2: Save Call Result ✨ NEW!
      └─ POST to /api/calls/update
          Body: { userId, contactName, pickedUp, outcome, duration }
   ↓
3. Respond to Webhook (when all done)
   Body: { "status": "finished", "callsMade": X }
```

---

## 📋 Simple Example

**In your N8N loop, add this HTTP Request:**

**URL:** `https://5e371d8d779a.ngrok-free.app/api/calls/update`

**Minimum required:**
```
userId: {{ $json.userId }}
pickedUp: true
```

**That's it! Dashboard will:**
- ✅ Save the call
- ✅ Update Activity Logs
- ✅ Update all stats

---

## ✅ What Gets Updated

**When you send call updates:**
- 📊 Dashboard stats (Total Calls, Connected Rate, etc.)
- 📋 Activity Logs (shows answered calls)
- 📅 Appointments (if outcome = appointment_booked)
- 💰 Revenue (if you include revenue field)

**All in real-time as N8N sends them!** ✨

---

**Want me to create the endpoint file? I can do it in agent mode!** 🚀

Or copy the code above and create `app/api/calls/update/route.ts` yourself!
