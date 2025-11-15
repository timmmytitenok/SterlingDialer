# 🚀 Enhanced Call System - Complete Setup Guide

## ✨ What's New?

Your AI calling system has been completely overhauled with professional-grade features:

### 🎯 Key Features Implemented

1. **✅ Accurate Event Detection**
   - Only processes `call_analyzed` events from Retell (fully processed calls)
   - Checks `in_voicemail` flag for accurate voicemail detection
   
2. **📞 Double-Dial Logic**
   - First call hits voicemail → Automatically calls again immediately
   - Second call also hits voicemail → Counts as 1 missed call, moves to next lead
   - **Both dials count as 1 missed call** (as you requested!)

3. **⏰ Time-Based Persistence (18-Missed-Call Logic)**
   - Tracks calls by time of day:
     - **Morning**: 8am - 12pm (noon)
     - **Daytime**: 12pm - 5pm
     - **Evening**: 6pm - 9pm
   - Requires **6 missed calls in EACH time period** before marking as dead
   - Total: **18 missed calls** across different days before giving up
   - System will call at different times on different days automatically

4. **🎯 Accurate Status Classification**
   - **NOT_INTERESTED** → Dead lead, never contact again
   - **CALLBACK** → Still potential, mark as callback later
   - **LIVE_TRANSFER** → Transferred to agent, still potential
   - **BOOKED** → Appointment scheduled, still potential (not closed yet)
   - **UNCLASSIFIED** → Call answered but unclear outcome, still potential

5. **📊 Enhanced Lead Tracking**
   - Morning/Daytime/Evening missed call counters
   - Total calls made
   - Total pickups
   - Pickup rate percentage
   - Last call time period
   - Double-dial tracking

6. **💾 Complete Dashboard Integration**
   - Lead manager shows all enhanced tracking data
   - Real-time updates after each call
   - Dead lead identification (💀 icon)
   - Missed calls breakdown by time period

---

## 🔧 Setup Instructions

### Step 1: Run the Database Schema

**Go to Supabase Dashboard → SQL Editor → New Query**

Paste and run this SQL:

```sql
-- Copy the entire contents of supabase/schema-enhanced-call-tracking.sql
```

Or run this command in your terminal:

```bash
cat supabase/schema-enhanced-call-tracking.sql
```

Then copy the output and paste it into Supabase SQL Editor.

**What this does:**
- Adds new tracking columns to `leads` table
- Adds enhanced columns to `calls` table
- Creates helper functions for time period calculation
- Creates smart lead update function with 18-missed-call logic

---

### Step 2: Verify Database Changes

Run this query in Supabase to verify columns exist:

```sql
-- Check leads table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN (
  'morning_missed_calls',
  'daytime_missed_calls', 
  'evening_missed_calls',
  'total_missed_calls',
  'total_calls_made',
  'total_pickups',
  'pickup_rate',
  'last_call_time_period',
  'double_dial_pending',
  'last_call_was_voicemail'
)
ORDER BY column_name;
```

You should see all 10 columns listed!

---

### Step 3: Restart Your Development Server

```bash
# Kill the current server (Ctrl+C)
# Then restart
npm run dev
```

---

## 📋 How It Works

### Call Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AI selects next lead (excludes dead/not_interested)     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Retell makes call                                        │
│    - Metadata includes: user_id, lead_id, was_double_dial   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Retell sends "call_analyzed" event (webhook)            │
│    - Includes: in_voicemail, custom_analysis_data          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Webhook processes call result                           │
│    ├─ Check: event === "call_analyzed" ✓                   │
│    ├─ Check: in_voicemail?                                  │
│    │   ├─ YES + First Dial → DOUBLE DIAL NOW!              │
│    │   └─ YES + Double Dial → Count as 1 missed call       │
│    └─ NO (Answered) → Check custom_analysis_data           │
│         ├─ NOT_INTERESTED? → Dead lead                      │
│         ├─ CALLBACK? → Callback later                       │
│         ├─ BOOKED? → Appointment                            │
│         ├─ LIVE_TRANSFER? → Transferred                     │
│         └─ All false? → Unclassified                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Update lead with enhanced tracking                      │
│    - Increment missed calls in current time period         │
│    - Update pickup rate                                     │
│    - Check if 18 missed calls reached → Mark as dead       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Decision: What's next?                                  │
│    ├─ Double dial needed? → Call same lead again           │
│    ├─ Target reached? → Stop AI                            │
│    ├─ No more leads? → Stop AI                             │
│    └─ Continue? → Select next lead                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Status Classification Logic

### When Call Goes to Voicemail:

```
if (in_voicemail === true) {
  if (NOT double dial) {
    → DOUBLE DIAL immediately (wait 2 seconds)
    → Keep current status
  } else {
    → Count as 1 missed call in current time period
    → Move to next lead
  }
}
```

### When Call is Answered:

**Cost Calculation:**
- **Starter Tier**: $0.30 per minute
- **Pro Tier**: $0.25 per minute
- **Elite Tier**: $0.20 per minute

```
Check custom_analysis_data:

if (NOT_INTERESTED === true) {
  → Status: "not_interested"
  → Dead lead - never contact again
  → Remove from callable pool
  → Charge user for call duration
}

else if (BOOKED === true) {
  → Status: "appointment_booked"
  → Still potential (not closed until sold)
  → Check Cal.AI for appointment details
  → Charge user for call duration
}

else if (LIVE_TRANSFER === true) {
  → Status: "live_transfer"
  → Still potential
  → Agent spoke with lead
  → Charge user for call duration
}

else if (CALLBACK === true) {
  → Status: "callback_later"
  → Still potential
  → Will call again another time
  → Charge user for call duration
}

else {
  → Status: "unclassified"
  → Still potential
  → Unclear outcome, needs review
  → Updates total dials and pickup rate
  → Charge user for call duration
}
```

---

## ⏰ 18-Missed-Call Logic Explained

### Time Periods:
- **Morning**: 8am - 12pm
- **Daytime**: 12pm - 5pm  
- **Evening**: 6pm - 9pm

### Tracking:
Each lead tracks:
- `morning_missed_calls` (0-6)
- `daytime_missed_calls` (0-6)
- `evening_missed_calls` (0-6)
- `total_missed_calls` (0-18)

### Example Scenario:

**Day 1:**
- 2pm (Daytime) - Call → Voicemail → Double dial → Voicemail again
  - `daytime_missed_calls` = 1
  - `total_missed_calls` = 1

**Day 2:**
- 9am (Morning) - Call → Voicemail → Double dial → Voicemail again
  - `morning_missed_calls` = 1
  - `total_missed_calls` = 2

**Day 3:**
- 7pm (Evening) - Call → Voicemail → Double dial → Voicemail again
  - `evening_missed_calls` = 1
  - `total_missed_calls` = 3

... continues across different days ...

**Day 18:**
- 8pm (Evening) - Call → Voicemail → Double dial → Voicemail again
  - `evening_missed_calls` = 6 ✓
  - `morning_missed_calls` = 6 ✓
  - `daytime_missed_calls` = 6 ✓
  - `total_missed_calls` = 18 ✓
  - **MARKED AS DEAD LEAD** 💀

The lead has been called **6 times in each time period** across **different days**, giving them every opportunity to answer.

---

## 🧪 Testing the System

### Test 1: Voicemail → Double Dial

1. Launch AI caller
2. When a call goes to voicemail (Retell sends `in_voicemail: true`)
3. System should automatically call the same lead again within 2 seconds
4. Check logs for: `🔄 INITIATING DOUBLE DIAL`

### Test 2: Status Classification

1. Launch AI, make calls
2. After each call completes, check:
   - Lead Manager shows updated status
   - Missed calls counters increment correctly
   - Pickup rate updates
   - Time period tracking works

### Test 3: Dead Lead Logic

1. Manually set a lead to have:
   ```sql
   UPDATE leads 
   SET 
     morning_missed_calls = 6,
     daytime_missed_calls = 6,
     evening_missed_calls = 6,
     total_missed_calls = 18
   WHERE id = 'some-lead-id';
   ```
2. System should mark it as `dead_lead`
3. Lead should NOT appear in callable leads anymore
4. Check Lead Manager → "Dead Leads" section

### Test 4: Real Call Flow

1. Launch AI with 5 lead target
2. Monitor terminal logs
3. Watch Lead Manager update in real-time
4. Verify:
   - ✅ Calls go to different leads
   - ✅ Voicemails trigger double dials
   - ✅ Statuses update correctly
   - ✅ Time periods tracked
   - ✅ Dashboard shows accurate data

---

## 📊 Lead Manager Features

### Main View:
- **Total Leads**: All qualified leads
- **Still Potential**: Leads worth calling (new, no_answer, callback, unclassified)
- **Dead Leads**: not_interested OR 18 missed calls reached

### Lead Detail Modal Shows:
- Total calls made
- Missed calls breakdown (Morning/Daytime/Evening)
- Total missed calls (X/18)
- Pickup rate percentage
- Last call time period
- Full call history

---

## 🔍 Monitoring & Debugging

### Check Webhook Logs:

```sql
SELECT * FROM webhook_logs 
WHERE webhook_type = 'retell_call_analyzed'
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Call Records:

```sql
SELECT 
  id,
  lead_id,
  in_voicemail,
  call_time_period,
  was_double_dial,
  outcome,
  created_at
FROM calls 
ORDER BY created_at DESC 
LIMIT 20;
```

### Check Lead Tracking:

```sql
SELECT 
  name,
  phone,
  status,
  morning_missed_calls,
  daytime_missed_calls,
  evening_missed_calls,
  total_missed_calls,
  total_calls_made,
  pickup_rate
FROM leads 
WHERE user_id = 'your-user-id'
ORDER BY total_missed_calls DESC
LIMIT 20;
```

---

## ⚠️ Important Notes

### Double Dial Behavior:
- ✅ First voicemail → Call again immediately
- ✅ Second voicemail → Count as 1 missed call
- ✅ Both dials count as 1 call attempt (not 2)

### Status Meanings:
- **not_interested** = Dead, never contact
- **dead_lead** = 18 missed calls, dead
- **callback_later** = Still potential
- **appointment_booked** = Still potential (not closed)
- **live_transfer** = Still potential
- **unclassified** = Still potential (needs review)

### Time Period Logic:
- Calls only happen during: 8am-9pm
- System tracks which time periods each lead was called
- Requires 6 missed calls in EACH period before giving up
- Automatically calls at different times across different days

---

## 🎉 You're All Set!

The system is now production-ready with:
- ✅ Accurate voicemail detection
- ✅ Double-dial logic
- ✅ 18-missed-call persistence
- ✅ Proper status classification
- ✅ Time-based tracking
- ✅ Complete dashboard integration

**Test it thoroughly, and let me know if you need any adjustments!** 🚀

---

## 📞 Quick Reference: Retell Webhook Data

### What to Look For:

```json
{
  "event": "call_analyzed",  // ← MUST be this event
  "call": {
    "call_analysis": {
      "in_voicemail": true,  // ← Voicemail detection
      "custom_analysis_data": {
        "NOT_INTERESTED": true,  // ← Dead lead
        "CALLBACK": false,
        "BOOKED": false,
        "LIVE_TRANSFER": false
      }
    },
    "disconnection_reason": "agent_hangup"  // ← Who hung up
  }
}
```

---

**Questions? Issues? Let me know! I'm here to help! 💙**

