# 📞 N8N Call Tracking - Correct Setup

## 🎯 The Problem You Had

You were using **`/api/ai-control/update-queue`** which doesn't update the dashboard!

## ✅ The Correct Endpoint

Use: **`/api/calls/update`**

This endpoint:
- ✅ Tracks ALL calls (dialed AND answered)
- ✅ Updates dashboard stats in real-time
- ✅ Shows in Activity Logs
- ✅ Supports your 4 outcomes

---

## 🔧 N8N HTTP Request Node Setup

### **When:** After EVERY call (answered or not)

### **Settings:**

**Method:** `POST`

**URL:**
```
https://3c96718a9b5f.ngrok-free.app/api/calls/update
```
*(Use your current ngrok URL)*

**Authentication:** `None`

**Send Body:** `Yes`

**Body Content Type:** `JSON`

**Specify Body:** `Using Fields Below`

---

## 📋 Required Fields

### **Field 1: userId**
- **Name:** `userId`
- **Value:** (Expression) `={{ $json.userId }}`
- **Description:** From the original webhook

### **Field 2: pickedUp**
- **Name:** `pickedUp`
- **Value:** `true` or `false`
- **Description:** Was the call answered?
- **Example Expression:** `={{ $json.callAnswered }}`

---

## 📋 Optional Fields (Recommended)

### **Field 3: contactName**
- **Name:** `contactName`
- **Value:** (Expression) `={{ $json.leadName }}`

### **Field 4: contactPhone**
- **Name:** `contactPhone`
- **Value:** (Expression) `={{ $json.leadPhone }}`

### **Field 5: outcome** (ONLY if call was answered)
- **Name:** `outcome`
- **Value:** One of these:
  - `booked` - Appointment scheduled
  - `not_interested` - Lead declined
  - `callback` - Follow up later
  - `live_transfer` - Transferred to agent

### **Field 6: duration** (if available)
- **Name:** `duration`
- **Value:** Call length in seconds
- **Example:** `145`

### **Field 7: recordingUrl** (if available)
- **Name:** `recordingUrl`
- **Value:** URL to recording

---

## 📊 Your 4 Outcomes Explained

### 1. **BOOKED** → `outcome: "booked"`
When the AI successfully schedules an appointment.

**Dashboard Impact:**
- ✅ Increments "Appointments Booked" stat
- ✅ Shows in Activity Logs
- ✅ Can create appointment record (if you want)

### 2. **NOT INTERESTED** → `outcome: "not_interested"`
Lead explicitly declined or not interested.

**Dashboard Impact:**
- ✅ Increments "Not Interested" count
- ✅ Shows in Activity Logs as declined

### 3. **CALLBACK** → `outcome: "callback"`
Lead wants to be called back later.

**Dashboard Impact:**
- ✅ Tracks callbacks needed
- ✅ Shows in Activity Logs
- ✅ Can trigger follow-up workflow

### 4. **LIVE TRANSFER** → `outcome: "live_transfer"`
Call transferred to live agent.

**Dashboard Impact:**
- ✅ Tracks transfer rate
- ✅ Shows in Activity Logs
- ✅ Counts as successful connection

---

## 🔄 Complete N8N Flow

```
┌─────────────────────────────────────────────┐
│ 1. Webhook Trigger                          │
│    (Receives start request from dashboard)  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 2. Loop Through Leads                       │
└──────────────┬──────────────────────────────┘
               │
               ▼ For Each Lead:
┌─────────────────────────────────────────────┐
│ 3. Make AI Call                             │
│    (Your calling logic)                     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 4. HTTP Request: /api/calls/update          │
│    ✨ THIS IS THE IMPORTANT ONE! ✨         │
│                                             │
│    Body:                                    │
│    {                                        │
│      "userId": "{{ $json.userId }}",        │
│      "pickedUp": true/false,                │
│      "outcome": "booked",  // if answered   │
│      "contactName": "John Doe",             │
│      "contactPhone": "555-1234",            │
│      "duration": 120                        │
│    }                                        │
└──────────────┬──────────────────────────────┘
               │
               ▼ Repeat for all leads
               │
               ▼
┌─────────────────────────────────────────────┐
│ 5. Respond to Webhook                       │
│    (Tell dashboard we're done)              │
│                                             │
│    Body:                                    │
│    {                                        │
│      "status": "finished",                  │
│      "callsMade": 50                        │
│    }                                        │
└─────────────────────────────────────────────┘
```

---

## 🧪 Example Scenarios

### **Scenario 1: Call Dialed but Not Answered**

**Send to N8N:**
```json
{
  "userId": "abc-123",
  "pickedUp": false,
  "contactName": "John Doe",
  "contactPhone": "555-1234"
}
```

**Dashboard Updates:**
- ✅ Total Calls: +1
- ✅ Connection Rate: Decreases (call not answered)
- ✅ Activity Log: Shows "Call attempted"

---

### **Scenario 2: Call Answered - Appointment Booked**

**Send to N8N:**
```json
{
  "userId": "abc-123",
  "pickedUp": true,
  "outcome": "booked",
  "contactName": "Jane Smith",
  "contactPhone": "555-5678",
  "duration": 145,
  "recordingUrl": "https://recordings.com/call123.mp3"
}
```

**Dashboard Updates:**
- ✅ Total Calls: +1
- ✅ Connected Calls: +1
- ✅ Appointments Booked: +1
- ✅ Connection Rate: Increases
- ✅ Activity Log: Shows "Appointment booked"

---

### **Scenario 3: Call Answered - Not Interested**

**Send to N8N:**
```json
{
  "userId": "abc-123",
  "pickedUp": true,
  "outcome": "not_interested",
  "contactName": "Bob Wilson",
  "contactPhone": "555-9999",
  "duration": 45
}
```

**Dashboard Updates:**
- ✅ Total Calls: +1
- ✅ Connected Calls: +1
- ✅ Not Interested: +1
- ✅ Activity Log: Shows "Not interested"

---

### **Scenario 4: Call Answered - Transferred**

**Send to N8N:**
```json
{
  "userId": "abc-123",
  "pickedUp": true,
  "outcome": "live_transfer",
  "contactName": "Sarah Lee",
  "contactPhone": "555-7777",
  "duration": 230
}
```

**Dashboard Updates:**
- ✅ Total Calls: +1
- ✅ Connected Calls: +1
- ✅ Transfers: +1
- ✅ Activity Log: Shows "Transferred to agent"

---

## 🧪 Testing the Endpoint

### **Test from Terminal:**

```bash
# Get your ngrok URL
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -1

# Test a call
curl -X POST https://YOUR-NGROK-URL/api/calls/update \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "pickedUp": true,
    "outcome": "booked",
    "contactName": "Test User",
    "contactPhone": "555-0000",
    "duration": 120
  }'
```

### **Expected Response:**
```json
{
  "success": true,
  "call": { ... },
  "message": "Call recorded successfully"
}
```

### **Check Dashboard:**
1. Refresh dashboard
2. Check stats updated
3. Go to Activity Logs
4. Should see "Test User" entry

---

## ⚠️ Important Notes

### **1. Track EVERY Call**
Send to `/api/calls/update` for EVERY call attempt:
- ✅ Answered calls (with outcome)
- ✅ Not answered calls (without outcome)
- ✅ Busy signals
- ✅ Voicemails

### **2. Dashboard Auto-Updates**
- Stats update **instantly** when N8N sends data
- No need to refresh manually
- Activity logs show calls in real-time

### **3. ngrok URL Changes**
Remember to update N8N when you restart ngrok:
```bash
# Check current ngrok URL
curl -s http://localhost:4040/api/tunnels | python3 -m json.tool
```

### **4. Don't Use `/api/ai-control/update-queue`**
That endpoint is simplified now and doesn't track calls.

---

## ✅ Checklist

Before running N8N:

- [ ] ngrok is running (`ngrok http 3000`)
- [ ] Got current ngrok URL
- [ ] Updated N8N HTTP Request URL
- [ ] HTTP Request sends `userId` and `pickedUp`
- [ ] Optionally sends `outcome` for answered calls
- [ ] Tested with curl command
- [ ] Verified dashboard updates

---

## 🎯 Summary

**Use this endpoint:** `https://YOUR-NGROK-URL/api/calls/update`

**Required fields:**
- `userId`
- `pickedUp` (true/false)

**Your 4 outcomes (only if answered):**
- `"booked"`
- `"not_interested"`
- `"callback"`
- `"live_transfer"`

**Result:**
- ✅ Dashboard updates in real-time
- ✅ All stats track correctly
- ✅ Activity logs populate
- ✅ You can see what's happening!

---

**Questions? Test the endpoint first with curl, then move to N8N!** 🚀

