# 🔗 Cal.ai + N8N Integration - Auto-Merge Contact Data

## How It Works Now

Your system now **automatically merges** Cal.ai bookings with N8N call data! 🎉

---

## 📋 The Flow

### **Step 1: Cal.ai Creates Appointment**
Someone books via Cal.ai → Appointment created with:
- ✅ Name
- ✅ Scheduled time
- ❌ Missing: Phone, Age, State

### **Step 2: N8N Makes the Call**
Your AI calls them → N8N sends call result with:
- ✅ Name
- ✅ Phone number
- ✅ Age (if available)
- ✅ State (if available)
- ✅ Outcome: BOOKED

### **Step 3: Auto-Merge! 🎯**
When outcome = "booked", the system:
1. Searches for matching Cal.ai appointment (same user + name)
2. Finds it (within last 7 days)
3. **Updates it automatically** with:
   - Phone number ✅
   - Age ✅
   - State ✅
   - Recording URL ✅
   - Links the call ID ✅

---

## 🎮 What You Need to Do

### **In Your N8N HTTP Request Node:**

Make sure you're sending these fields:

```json
{
  "userId": "your-user-id",
  "contactName": "John Doe",
  "contactPhone": "(555) 123-4567",
  "contactAge": 45,
  "contactState": "CA",
  "pickedUp": true,
  "outcome": "booked",
  "duration": 180,
  "recordingUrl": "https://..."
}
```

**Required for merging:**
- `userId` - Must match Cal.ai user
- `contactName` - Must match (or be similar to) Cal.ai booking name
- `contactPhone` - Will be added to appointment
- `outcome` - Must be `"booked"` to trigger merge
- `pickedUp` - Must be `true`

**Optional but recommended:**
- `contactAge` - Will be added if missing
- `contactState` - Will be added if missing
- `recordingUrl` - Will be added if missing

---

## 📊 Terminal Logs

**When a merge happens, you'll see:**

```
📞 Call update received from N8N
✅ Call saved to database: John Doe - answered → appointment_booked
🔗 Appointment booked! Looking for matching Cal.ai appointment...
✅ Found matching appointment: abc-123-def-456
   Name: John Doe
   Scheduled: 2024-10-26T14:00:00.000Z
   Adding phone: (555) 123-4567
   Adding age: 45
   Adding state: CA
   Adding recording URL
✅ Appointment updated with call details!
```

**If no match found:**
```
ℹ️  No matching Cal.ai appointment found (this is normal for non-Cal.ai bookings)
```

---

## 🔍 How Matching Works

The system finds Cal.ai appointments by:
1. **Same user ID** ✅
2. **Similar name** (case-insensitive) ✅
3. **Status: scheduled** ✅
4. **Created within last 7 days** ✅
5. **Most recent match** (if multiple found) ✅

---

## ✅ What Gets Updated

**Only fields that are MISSING get updated:**

| Field | Source | When Updated |
|-------|--------|--------------|
| `prospect_phone` | N8N call | If blank in appointment |
| `prospect_age` | N8N call | If blank in appointment |
| `prospect_state` | N8N call | If blank in appointment |
| `call_recording_url` | N8N call | If blank in appointment |
| `call_id` | N8N call | Always (links call to appointment) |

**Existing data is never overwritten!**

---

## 🧪 Test It

### **Test 1: Cal.ai → N8N Flow**

1. Book appointment via Cal.ai
   - Name: "Test User"
   - Check dashboard - phone/age/state are blank

2. Simulate N8N call with outcome "booked"
   - Send to: `/api/calls/update`
   - Include: same name, phone, age, state
   - Outcome: "booked"

3. Refresh dashboard
   - Appointment now has phone, age, state! ✅

---

### **Test 2: Check Terminal Logs**

Watch your terminal when N8N sends "booked" outcome:
- Should see: "🔗 Appointment booked!"
- Should see: "✅ Found matching appointment"
- Should see: "✅ Appointment updated!"

---

## 💡 Pro Tips

### **Tip 1: Name Matching**
- Names don't have to be EXACT matches
- "John Doe" matches "john doe", "JOHN DOE", etc.
- Even partial matches work if close enough

### **Tip 2: Multiple Bookings**
- If someone has multiple appointments, it updates the MOST RECENT one
- This ensures the right appointment gets updated

### **Tip 3: No Manual Work**
- Everything happens automatically!
- Just send the call data from N8N
- System handles the rest

### **Tip 4: Safe Updates**
- Won't overwrite existing data
- Won't fail if no match found
- Won't break if appointment matching fails

---

## 🔧 N8N Configuration

**Your HTTP Request node should look like:**

**URL:**
```
https://your-ngrok-url.ngrok.io/api/calls/update
```

**Method:** `POST`

**Body (JSON):**
```json
{
  "userId": "{{$json.userId}}",
  "contactName": "{{$json.contactName}}",
  "contactPhone": "{{$json.contactPhone}}",
  "contactAge": {{$json.contactAge}},
  "contactState": "{{$json.contactState}}",
  "pickedUp": {{$json.pickedUp}},
  "outcome": "{{$json.outcome}}",
  "duration": {{$json.duration}},
  "recordingUrl": "{{$json.recordingUrl}}"
}
```

---

## 🎯 Common Scenarios

### **Scenario 1: Cal.ai Booking → AI Calls Later**
✅ Works! Updates appointment when call outcome is "booked"

### **Scenario 2: AI Creates Booking Directly (No Cal.ai)**
✅ Works! Creates new appointment (no merging needed)

### **Scenario 3: Multiple Bookings Same Name**
✅ Works! Updates most recent scheduled appointment

### **Scenario 4: Name Doesn't Match Exactly**
✅ Works! Uses fuzzy matching (case-insensitive)

---

## ❌ Won't Merge If:

- Outcome is NOT "booked"
- Call was not answered (pickedUp = false)
- Name doesn't match any appointment
- All appointments are completed/cancelled
- Appointment is older than 7 days
- Different user ID

---

## ✅ Success!

Now your Cal.ai appointments automatically get filled with complete contact info from N8N calls! 

**No manual data entry needed!** 🎉

