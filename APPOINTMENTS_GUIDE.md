# 📅 Appointments System Guide

## Overview

The Appointments page provides a comprehensive calendar view to manage all your scheduled appointments with prospects.

---

## ✨ Features

### 1. **Appointment Stats** (Top Cards)

**Active Appointments Card:**
- Total count of scheduled/rescheduled appointments
- Shows current active appointments only
- Excludes completed, cancelled, and no-shows

**Today's Appointments Card:**
- Count of appointments scheduled for today
- Quick view of today's workload

### 2. **Calendar View** (5-Day Hourly View)

**Layout:**
- Shows **today + next 4 days** (5 days total)
- Each day shows: **Day of Week + Date** (e.g., "Mon, Dec 25")
- **Hourly slots from 8 AM to 8 PM**
- Scrollable view for easy navigation

**Appointment Display:**
- Appears in correct time slot
- Shows prospect name
- Shows exact time
- Color-coded by status:
  - 🔵 **Blue**: Scheduled
  - 🟢 **Green**: Completed
  - 🔴 **Red**: No-Show
- Click any appointment to view details

### 3. **Appointment Details Modal**

Click an appointment to see:

**Basic Info:**
- 📅 Exact date and time
- 👤 Prospect name
- 📞 Phone number
- 🎂 Age
- 📍 State/Origin
- 🎧 Call recording link (if available)
- 📝 Notes (if any)
- Status badge

**Actions:**
- **📅 Reschedule**: Select new date/time
- **⚠️ Mark No-Show**: Marks as no-show (stays on calendar in red)
- **🗑️ Delete**: Permanently removes appointment

### 4. **Testing Tools** (Settings → Testing)

Easy data generation for testing:

**Add Individual Items:**
- ➕ Add Random Appointment
- ✅ Add Booked Call
- ❌ Add Not Interested Call
- ⏰ Add Callback Call
- 📵 Add Missed Call

**Bulk Actions:**
- ⚡ Add 5 Random Appointments
- ⚡ Add 5 Mixed Calls

**Danger Zone:**
- 🗑️ Clear All Test Data

---

## 🗄️ Database Schema

### Appointments Table Structure

```sql
appointments (
  id UUID,
  user_id UUID,
  scheduled_at TIMESTAMPTZ,
  prospect_name TEXT,
  prospect_phone TEXT,
  prospect_age INTEGER,
  prospect_state TEXT,
  call_recording_url TEXT,
  status TEXT,
  is_no_show BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ
)
```

### Status Values
- `scheduled` - Active appointment
- `rescheduled` - Was moved to new time
- `completed` - Appointment happened
- `no_show` - Prospect didn't show up
- `cancelled` - Appointment cancelled

---

## 🚀 Setup

### Step 1: Run Database Schema

```bash
# In Supabase SQL Editor:
supabase/schema-v6-appointments.sql
```

### Step 2: Add Test Data

1. Go to **Settings → Testing (Admin)**
2. Click "Add Random Appointment"
3. Click multiple times to populate calendar
4. Or use "Add 5 Random Appointments" for bulk

### Step 3: View Calendar

1. Go to **Appointments** in sidebar
2. See your appointments in the calendar
3. Click any appointment to view details

---

## 🎯 How to Use

### View Appointments

1. Navigate to **Appointments** page
2. See stats at top (Active + Today's count)
3. Scroll through calendar to see upcoming days
4. Appointments appear in their scheduled time slots

### Manage an Appointment

**To Reschedule:**
1. Click appointment
2. Click "Reschedule" button
3. Select new date/time
4. Click "Confirm"
5. Appointment moves to new slot

**To Mark No-Show:**
1. Click appointment
2. Click "Mark No-Show" button
3. Appointment turns red
4. Stays visible on calendar
5. Status updates to "No-Show"

**To Delete:**
1. Click appointment
2. Click "Delete" button
3. Confirm deletion
4. Appointment removed from calendar

---

## 📊 Calendar Features

### Time Slots
- **8 AM - 8 PM**: Standard business hours
- Each hour is a row
- Easy to see availability
- Hover effects for interactivity

### Day Columns
- Today is on the left
- Next 4 days to the right
- Each shows day name and date
- Easy to plan ahead

### Visual Indicators
- **Blue border**: Scheduled
- **Green border**: Completed
- **Red border**: No-Show
- **Hover scale**: Grows slightly on hover
- **Truncated text**: Long names don't overflow

### No-Show Behavior
- Marked as no-show → stays on calendar
- Turns red for visibility
- Can still delete or reschedule
- Helps track attendance patterns

---

## 🧪 Testing

### Add Test Appointments

**Quick Method:**
```
Settings → Testing → Add Random Appointment
```

**Bulk Method:**
```
Settings → Testing → Add 5 Random Appointments
```

**Manual Method (SQL):**
```sql
INSERT INTO appointments (
  user_id,
  scheduled_at,
  prospect_name,
  prospect_phone,
  prospect_age,
  prospect_state,
  status
) VALUES (
  'YOUR_USER_ID',
  '2024-12-25 10:00:00',
  'John Smith',
  '(555) 123-4567',
  45,
  'CA',
  'scheduled'
);
```

### Test Actions

1. Add appointments using testing page
2. Go to Appointments page
3. Click an appointment
4. Try each action (reschedule, no-show, delete)
5. Verify calendar updates

---

## 🎨 Design Details

### Calendar Grid
- Fixed left column for time labels
- 5 scrollable day columns
- Hover effects on rows
- Responsive sizing
- Horizontal scroll on mobile

### Appointment Cards
- Compact design to fit in slots
- Name shown prominently
- Time shown below
- Status-based colors
- Click to expand

### Modal
- Centered overlay
- Dark backdrop with blur
- Detailed information
- Action buttons at bottom
- Close button (X) at top right

---

## 🔧 API Routes

**Appointment Management:**
- `POST /api/appointments/delete` - Delete appointment
- `POST /api/appointments/no-show` - Mark as no-show
- `POST /api/appointments/reschedule` - Reschedule to new time

**All routes:**
- Require authentication
- Verify user owns appointment
- Return success/error messages
- Trigger page refresh on success

---

## 💡 Pro Tips

### For Best Results:
1. **Use Testing Page**: Fastest way to add sample data
2. **Color Coding**: Quick visual status check
3. **No-Show Tracking**: Don't delete - mark as no-show for records
4. **Bulk Actions**: Use "Add 5" for quick calendar population
5. **Modal Actions**: All edits in one place - convenient!

### Calendar Navigation:
- Horizontal scroll to see more days
- Vertical scroll for more hours
- Click anywhere on appointment card
- Legend at bottom shows color meanings

### Data Management:
- Test liberally with admin page
- Clear all data when ready to go live
- Real appointments from N8N will appear automatically

---

## 📁 Files Created

**Pages:**
- `app/dashboard/appointments/page.tsx` - Main appointments page
- `app/dashboard/settings/testing/page.tsx` - Testing admin panel

**Components:**
- `components/appointment-calendar.tsx` - 5-day calendar grid
- `components/appointment-modal.tsx` - Appointment details popup
- `components/test-data-generator.tsx` - Admin testing tools

**Database:**
- `supabase/schema-v6-appointments.sql` - Extended appointments schema

**API Routes:**
- `app/api/appointments/delete/route.ts`
- `app/api/appointments/no-show/route.ts`
- `app/api/appointments/reschedule/route.ts`

---

## 🎯 Summary

Your Appointments system now has:

✅ **Active appointment count**  
✅ **Today's appointments count**  
✅ **5-day calendar view (today + 4)**  
✅ **Hourly view (8 AM - 8 PM)**  
✅ **Day of week + date headers**  
✅ **Click to view details**  
✅ **Prospect info (name, phone, age, state)**  
✅ **Call recording link**  
✅ **Reschedule functionality**  
✅ **Mark no-show (stays on calendar)**  
✅ **Delete option**  
✅ **Admin testing page**  
✅ **Beautiful dark theme UI**  

---

## 🚀 Quick Start

```bash
# 1. Run schema in Supabase
supabase/schema-v6-appointments.sql

# 2. Restart server
npm run dev

# 3. Add test data
Settings → Testing → Add 5 Random Appointments

# 4. View calendar
Appointments → See your calendar!

# 5. Click appointment → View details → Try actions
```

**Your appointment system is production-ready!** 🎉

