# 🤖 AI Control Center Guide

## Overview

The AI Control Center is your command hub for managing the DialPro AI calling system. Control when AI calls, set limits, and configure behavior.

---

## 🎯 Features

### 1. **AI Status Display**

Two status cards showing:

**Card 1: AI Status**
- 🟢 **Running**: AI is actively making calls
- 🔴 **Stopped**: AI is idle
- Animated pulse when running
- Clear status indicator

**Card 2: Queue Length**
- Shows how many leads are left to call
- Progress bar visualization
- "X leads left in queue for today"

### 2. **Manual Controls**

Start/Stop buttons:
- **▶️ Start AI**: Begins calling session
  - Dimmed when AI is already running
  - Green gradient with glow effect
  
- **⏹️ Stop AI**: Stops current session
  - Dimmed when AI is stopped
  - Red gradient with glow effect
  - Asks for confirmation before stopping

### 3. **Auto-Start Schedule**

Schedule AI to start automatically:
- **Enable/Disable toggle**: Turn scheduling on/off
- **Time picker**: Set start time (e.g., 9:00 AM)
- **Day selection**: Choose which days (Mon-Fri default)
- Grid of clickable day buttons
- Blue highlight for selected days

**Example:**
```
Every weekday at 9:00 AM
Mon, Tue, Wed, Thu, Fri
```

### 4. **AI Settings**

Three key settings with toggles:

**🔄 Auto Transfer Calls**
- Toggle ON: AI transfers qualified leads to your phone
- Toggle OFF: AI handles all calls independently

**📊 Daily Call Limit**
- Slider: 1 to 600 calls
- Visual slider with gradient
- Large number display
- Sets maximum calls per day

**📞 Double Dial Leads**
- Toggle ON: AI calls leads twice if first attempt fails
- Toggle OFF: Single attempt per lead

---

## 📁 Database Structure

### `ai_control_settings` Table

```sql
- user_id: UUID (reference to user)
- status: 'running' | 'stopped'
- queue_length: INTEGER
- daily_call_limit: INTEGER (1-600)
- auto_transfer_calls: BOOLEAN
- double_dial_enabled: BOOLEAN
- schedule_enabled: BOOLEAN
- schedule_days: TEXT[]
- schedule_time: TIME
```

---

## 🚀 Setup

### Step 1: Run the Schema

In Supabase SQL Editor:
```sql
-- Run this file:
supabase/schema-v5-ai-settings.sql
```

Creates:
- ✅ `ai_control_settings` table
- ✅ Auto-initialization for new users
- ✅ RLS policies
- ✅ Triggers

### Step 2: Access the Page

1. Log in to dashboard
2. Click **AI Control Center** in sidebar
3. Configure your AI settings!

---

## 🎨 Design

### Layout
```
┌──────────────────────────────────────┐
│  AI Control Center                   │
├──────────────────┬───────────────────┤
│ 🟢 Running      │ 📋 37 leads       │
│                  │                   │
└──────────────────┴───────────────────┘

┌──────────────────────────────────────┐
│  Manual Controls                     │
│  [▶️ Start AI] [⏹️ Stop AI]         │
└──────────────────────────────────────┘

┌─────────────────┬────────────────────┐
│ ⏰ Schedule     │ ⚙️ Settings        │
│                 │                    │
│ • Enable        │ • Auto Transfer    │
│ • Time: 9:00 AM │ • Limit: 400       │
│ • Days: M-F     │ • Double Dial      │
└─────────────────┴────────────────────┘
```

### Color Coding
- **Green**: Running/Active states
- **Red**: Stopped/Stop actions
- **Blue**: Schedule/Settings
- **Purple**: AI Settings

---

## 🎮 How to Use

### Start AI Manually

1. Go to AI Control Center
2. Click **"Start AI"** button
3. AI status changes to 🟢 Running
4. Start button becomes dimmed
5. Stop button becomes active

### Stop AI Manually

1. Click **"Stop AI"** button
2. Confirm the action
3. AI status changes to 🔴 Stopped
4. Stop button becomes dimmed
5. Start button becomes active

### Set Up Auto-Schedule

1. Toggle **"Enable Schedule"** ON (turns green)
2. Set time (e.g., 09:00)
3. Select days (click to toggle)
   - Blue = selected
   - Gray = not selected
4. Click **"Save Schedule"**
5. AI will now start automatically!

### Configure AI Behavior

1. **Auto Transfer**: Toggle ON to receive calls
2. **Daily Limit**: Drag slider (1-600)
   - Number updates in real-time
   - Gradient shows progress
3. **Double Dial**: Toggle ON to retry failed calls
4. Click **"Save Settings"**

---

## 🔗 API Routes

All AI control managed through API:

- `POST /api/ai-control/start` - Start AI manually
- `POST /api/ai-control/stop` - Stop AI manually
- `POST /api/ai-control/schedule` - Update schedule
- `POST /api/ai-control/settings` - Update AI settings

**Webhooks:**
- Start AI → Triggers `N8N_WEBHOOK_START_DIAL`
- Stop AI → Triggers `N8N_WEBHOOK_STOP_DIAL` (if configured)

---

## 🧪 Testing

### Test Manual Controls

1. **Start AI**:
   - Click "Start AI"
   - Status changes to Running
   - Queue might update from N8N

2. **Stop AI**:
   - Click "Stop AI"
   - Confirm
   - Status changes to Stopped

### Test Schedule

1. Enable schedule for "Today" at current time + 2 minutes
2. Wait 2 minutes
3. AI should auto-start (if cron is set up)

### Test Settings

1. Set limit to 50
2. Enable auto-transfer
3. Enable double dial
4. Save
5. Settings persist on page refresh

---

## 💡 Features Explained

### Queue Length
- Updated by N8N when AI starts
- Shows remaining leads to call
- Decrements as calls are made
- Visual progress bar

### Schedule
- Based on user's timezone
- Days can be any combination
- Time in 24-hour format
- Requires cron job or scheduler service

### Daily Limit
- Hard cap on calls per day
- Prevents over-calling
- AI stops when limit reached
- Resets daily at midnight

### Double Dial
- First attempt: immediate
- Second attempt: if no answer, retry after delay
- Increases connection rate
- Optional feature

### Auto Transfer
- When enabled, AI transfers hot leads to you
- Requires phone number configuration
- Real-time transfer during call

---

## 🎨 UI Components

**Files Created:**
- `app/dashboard/ai-control/page.tsx` - Main page
- `components/ai-status-card.tsx` - Status display
- `components/ai-control-buttons.tsx` - Start/Stop
- `components/ai-schedule-settings.tsx` - Scheduling
- `components/ai-toggles-settings.tsx` - Settings toggles

**API Routes:**
- `app/api/ai-control/start/route.ts`
- `app/api/ai-control/stop/route.ts`
- `app/api/ai-control/schedule/route.ts`
- `app/api/ai-control/settings/route.ts`

---

## 🔧 Advanced Configuration

### Update Queue Length

Queue is typically updated by N8N, but you can manually update:

```sql
UPDATE ai_control_settings 
SET queue_length = 50 
WHERE user_id = 'YOUR_USER_ID';
```

### View All Settings

```sql
SELECT * FROM ai_control_settings 
WHERE user_id = 'YOUR_USER_ID';
```

---

## ✅ Checklist

Setup:
- [ ] Run `schema-v5-ai-settings.sql` in Supabase
- [ ] Restart dev server
- [ ] Navigate to AI Control Center
- [ ] Settings initialized automatically

Test:
- [ ] Click Start AI (status changes to Running)
- [ ] Click Stop AI (status changes to Stopped)
- [ ] Configure schedule
- [ ] Adjust daily limit slider
- [ ] Toggle all settings
- [ ] Save and verify persistence

---

## 🚀 Production Notes

### Scheduling
For auto-start to work in production, you need:
1. Cron job or scheduler service
2. Checks `ai_control_settings` table
3. Starts AI when schedule matches current time
4. Can use Vercel Cron Jobs or external service

### Queue Management
- N8N should update `queue_length` when starting
- Decrements as calls complete
- Dashboard shows real-time count

### Webhooks
Add to `.env.local`:
```env
N8N_WEBHOOK_START_DIAL=https://your-webhook-url
N8N_WEBHOOK_STOP_DIAL=https://your-stop-webhook-url (optional)
```

---

## 🎯 Summary

Your AI Control Center now has:
- ✅ Real-time status monitoring
- ✅ Queue length tracking
- ✅ Manual start/stop controls
- ✅ Auto-start scheduling
- ✅ Daily call limit (1-600)
- ✅ Auto-transfer toggle
- ✅ Double dial option
- ✅ Beautiful dark UI
- ✅ All settings persist in database

**Enjoy your new control center!** 🎉

