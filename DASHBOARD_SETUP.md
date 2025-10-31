# Dashboard Setup Guide

## 🎉 What You Get

A complete, production-ready AI-powered calling dashboard with:

- **Dark-themed modern UI** inspired by professional analytics dashboards
- **Sidebar navigation** with multiple pages
- **Overview page** with comprehensive metrics
- **AI Control Panel** to manage calling sessions
- **Live activity feed** showing real-time call status
- **Test data generators** for easy testing

---

## 🚀 Getting Started

### Step 1: Run the Extended Database Schema

You need to run **TWO** SQL files in your Supabase dashboard:

1. **First time setup**: Run `supabase/schema.sql` (if you haven't already)
2. **New tables**: Run `supabase/schema-v2.sql` for the extended features

**How to run:**
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Open `supabase/schema-v2.sql` from your project
4. Copy and paste the SQL
5. Click **Run** (or Cmd/Ctrl + Enter)

This adds:
- ✅ `leads` table
- ✅ `appointments` table
- ✅ `ai_sessions` table
- ✅ Extended `calls` table fields
- ✅ All RLS policies

### Step 2: Start the Development Server

```bash
npm run dev
```

### Step 3: Log In and Explore

1. Visit [http://localhost:3000](http://localhost:3000)
2. Log in with your account
3. You'll see the new dark-themed dashboard!

---

## 📊 Dashboard Features

### 1. **Overview Page** (`/dashboard`)

**Metrics Displayed:**
- 👥 Total Leads
- 📞 Calls Today / This Week / This Month
- 📅 Total Appointments
- 📈 Conversion Rate (appointments ÷ calls)
- ✅ Completed Appointments
- ❌ No-Shows
- Call breakdown (answered vs not answered)

**Live AI Status:**
- Shows if AI is currently active
- Displays current lead being called
- Progress bar for daily call limit

### 2. **AI Control Panel** (`/dashboard/ai-control`)

**Controls:**
- ▶️ **Start Session**: Begin AI calling with custom daily limit
- ⏸️ **Pause Session**: Temporarily pause calling
- ▶️ **Resume Session**: Continue paused session
- ⏹️ **Stop Session**: End the calling session

**Session Info:**
- Status indicator (Active / Paused / Stopped)
- Calls made today vs daily limit
- Progress bar
- Session start time

**Live Call Feed:**
- Real-time activity feed
- Shows recent calls with status
- Call duration and disposition
- "Calling now" indicator for active calls

### 3. **Sidebar Navigation**

Easy access to:
- 📊 Overview
- 🤖 AI Control
- 👥 Leads (coming soon)
- 📅 Appointments (coming soon)
- 📞 Call History (coming soon)

---

## 🎮 Testing the Dashboard

### Quick Test Data

Use the **test buttons** in the top-right corner:

1. **➕ Add 1 Call** - Adds random call
2. **✅ Add Answered** - Adds successful call
3. **❌ Add Missed** - Adds missed call
4. **🗑️ Reset All** - Clears all data

### Testing AI Sessions

1. Go to **AI Control** page
2. Set a daily call limit (e.g., 10)
3. Click **Start AI Session**
4. Session becomes active with green indicator
5. Test **Pause** and **Resume** buttons
6. Click **Stop** to end the session

### Adding More Test Data via SQL

```sql
-- Add test leads
INSERT INTO leads (user_id, name, phone, email, status) VALUES
  ('YOUR_USER_ID', 'John Smith', '555-0100', 'john@example.com', 'new'),
  ('YOUR_USER_ID', 'Jane Doe', '555-0101', 'jane@example.com', 'contacted'),
  ('YOUR_USER_ID', 'Bob Wilson', '555-0102', 'bob@example.com', 'qualified');

-- Add test appointments
INSERT INTO appointments (user_id, scheduled_at, status) VALUES
  ('YOUR_USER_ID', NOW() + INTERVAL '1 day', 'scheduled'),
  ('YOUR_USER_ID', NOW() - INTERVAL '1 day', 'completed'),
  ('YOUR_USER_ID', NOW() - INTERVAL '2 days', 'no_show');
```

Replace `YOUR_USER_ID` with your actual user ID from `auth.users` table.

---

## 🎨 Design Features

### Color Scheme
- Background: `#0B1437` (deep navy blue)
- Cards: `#1A2647` (lighter navy)
- Borders: Gray-800
- Accent: Blue, Green, Purple gradients

### Components
- Metric cards with gradient icons
- Status badges (Live, Active, Paused)
- Progress bars
- Hover effects
- Smooth transitions

### Responsive
- Mobile-friendly sidebar
- Grid layouts adjust to screen size
- Touch-friendly buttons

---

## 🔗 API Routes

All AI session management is handled through API routes:

- `POST /api/ai-session/start` - Start new session
- `POST /api/ai-session/pause` - Pause active session
- `POST /api/ai-session/resume` - Resume paused session
- `POST /api/ai-session/stop` - Stop session

**Authentication**: All routes require valid user session

**Webhook Integration**: Starting a session triggers the N8N webhook with session details

---

## 🐛 Troubleshooting

### "Cannot read property of null" errors

- Make sure you ran `schema-v2.sql` in Supabase
- Check that all new tables exist in Table Editor

### Metrics showing 0

- Add test data using the buttons or SQL
- Refresh the page after adding data
- Check RLS policies are enabled

### AI Control not working

- Verify environment variables are set
- Check browser console for errors
- Ensure N8N webhook URL is correct

### Dark theme not showing

- Clear browser cache
- Hard refresh (Cmd/Ctrl + Shift + R)
- Check if `globals.css` is loading

---

## 📈 Next Steps

### Implement Real Features

1. **Leads Management Page**: CRUD for leads
2. **Appointments Page**: Calendar view
3. **Call History Page**: Detailed call logs
4. **Real-time Updates**: WebSocket for live feed
5. **Charts**: Add Recharts for visual analytics
6. **Filters**: Date range pickers
7. **Export**: CSV/PDF reports

### Production Checklist

- [ ] Set up proper error monitoring
- [ ] Add loading skeletons
- [ ] Implement pagination
- [ ] Add search and filters
- [ ] Set up automated backups
- [ ] Configure production webhooks
- [ ] Add user settings page
- [ ] Implement notifications

---

## 🎯 Key Files

```
app/dashboard/
  ├── layout.tsx           # Dark themed layout with sidebar
  ├── page.tsx            # Overview with all metrics
  ├── ai-control/
  │   └── page.tsx        # AI control panel
  └── add-test-data.tsx   # Test data buttons

components/
  ├── dashboard-sidebar.tsx  # Navigation sidebar
  ├── metric-card.tsx       # Reusable metric card
  ├── live-ai-status.tsx    # Live AI indicator
  ├── ai-control-panel.tsx  # Session controls
  └── live-call-feed.tsx    # Activity feed

app/api/ai-session/
  ├── start/route.ts      # Start session API
  ├── pause/route.ts      # Pause session API
  ├── resume/route.ts     # Resume session API
  └── stop/route.ts       # Stop session API
```

---

## 💡 Tips

1. **Use the test buttons** - Fastest way to see the dashboard in action
2. **Check the live feed** - Watch calls appear in real-time
3. **Test with multiple users** - RLS ensures data isolation
4. **Monitor the console** - Helpful for debugging
5. **Refresh after updates** - Some changes need a page reload

---

🎉 **Enjoy your new dashboard!** If you need any features added or customizations, just ask!

