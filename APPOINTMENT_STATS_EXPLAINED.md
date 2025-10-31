# 📊 Appointment Stats - How They Work

## ✅ Fixed: Booked Appointments Only Count from Cal.ai

### **The Problem Before:**
- N8N sends call outcome "booked" → Stats incremented ❌
- Cal.ai creates appointment → Stats incremented ❌
- **Result:** Double counting or counting non-Cal.ai bookings!

### **The Solution Now:**
- N8N sends call outcome "booked" → Just for matching, NO stat increment ✅
- Cal.ai creates appointment → Stats increment ✅
- **Result:** Only REAL Cal.ai appointments counted!

---

## 🎯 How It Works Now

### **Where Appointment Stats Come From:**

**Booked Appointments = Count from `appointments` table**

NOT from `calls` table with outcome='appointment_booked'!

---

## 📋 Data Flow

### **Scenario 1: Cal.ai Booking (Counts!)**

1. Customer books via Cal.ai
2. Cal.ai webhook fires → Creates appointment in `appointments` table ✅
3. **Stats increment!** 📈
4. Later: N8N calls customer
5. N8N sends outcome "booked" → Matches/updates appointment
6. Stats DON'T increment again (already counted)

---

### **Scenario 2: N8N Only (Doesn't Count)**

1. N8N makes call
2. Outcome: "booked"
3. Call recorded in `calls` table with outcome='appointment_booked'
4. **Stats DON'T increment** (no entry in `appointments` table)

This is correct because there's no actual Cal.ai appointment!

---

## 🔢 What Each Stat Counts

### **Dashboard Stats:**

| Stat | Source | What It Counts |
|------|--------|----------------|
| **Total Calls** | `calls` table | ALL calls (answered + not answered) |
| **Connected Rate** | `calls` table | % of calls answered |
| **Booked Appointments** | `appointments` table | Only Cal.ai or manual bookings |
| **Not Interested** | `calls` table | Calls with outcome='not_interested' |
| **Callback** | `calls` table | Calls with outcome='callback_later' |
| **Live Transfers** | `calls` table | Calls with outcome='live_transfer' |
| **Policy Sold** | `appointments` table | Appointments marked as sold |
| **Revenue** | `revenue_tracking` table | Total revenue from sold policies |

---

## 🎮 N8N Can Still Send "Booked"

**N8N should still send outcome="booked" because:**

1. ✅ It's accurate - the call resulted in a booking
2. ✅ Helps with matching - finds Cal.ai appointment to update
3. ✅ Good for records - call logs show what happened
4. ❌ Just won't increment appointment stats

---

## 💡 Why This Makes Sense

### **Use Cases:**

**1. Cal.ai Booking First**
- Cal.ai creates appointment (stats +1)
- N8N calls later, outcome "booked" (stats stay same)
- Result: Counted once ✅

**2. Manual Booking**
- You click ➕ button, create appointment (stats +1)
- N8N might call, outcome "booked" (stats stay same)
- Result: Counted once ✅

**3. N8N Says "Booked" But No Cal.ai**
- N8N outcome "booked" (just recorded in calls)
- No Cal.ai appointment created
- Result: NOT counted ✅ (correct, as no appointment exists)

---

## 📊 Time Period Filtering

**All appointment stats filter by `created_at` timestamp:**

- **Today:** Appointments created today
- **Last 7 Days:** Appointments created in last 7 days
- **Last 30 Days:** Appointments created in last 30 days
- **All Time:** All appointments ever

---

## 🧪 How to Verify

### **Test 1: Cal.ai Booking**
1. Note current appointment stat
2. Book via Cal.ai
3. Check dashboard - stat should increase by 1 ✅

### **Test 2: N8N Call Only**
1. Note current appointment stat
2. Send N8N call with outcome "booked" (no Cal.ai booking)
3. Check dashboard - stat should stay same ✅

### **Test 3: Cal.ai + N8N**
1. Note current appointment stat
2. Book via Cal.ai (stat +1)
3. N8N calls with outcome "booked"
4. Check dashboard - stat should still be +1 (not +2) ✅

---

## 🔍 Where to Look in Code

**Dashboard stats calculation:**
```typescript
// app/dashboard/page.tsx

// Fetch from appointments table
const { data: allAppointmentsData } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', user.id);

// Count by time period
const totalAppointments = allAppointmentsData?.length || 0;
const appointments7Days = allAppointmentsData?.filter(apt => {
  const aptDate = new Date(apt.created_at);
  return aptDate >= startOf7Days;
}).length || 0;
```

**N8N call recording:**
```typescript
// app/api/calls/update/route.ts

// Still records outcome='appointment_booked'
// But this is just for call logs and matching
// Doesn't affect appointment stats
```

---

## ✅ Summary

**Booked Appointments Stats:**
- ✅ Only count from `appointments` table
- ✅ Incremented by Cal.ai webhook
- ✅ Incremented by manual creation (➕ button)
- ❌ NOT incremented by N8N call outcomes

**N8N outcome="booked":**
- ✅ Still recorded in `calls` table
- ✅ Used for matching Cal.ai appointments
- ✅ Shows in call logs
- ❌ Doesn't increment appointment stats

**Result:** Accurate, non-duplicated appointment counting! 🎯

