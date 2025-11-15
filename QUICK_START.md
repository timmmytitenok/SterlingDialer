# 🚀 Quick Start - Direct Calling System

## What Was Built

✅ **Complete leads management system** that eliminates N8N  
✅ **Google Sheets integration** - Read leads from any sheet  
✅ **Direct Retell AI calling** - App calls directly  
✅ **Auto status updates** - Updates dashboard + Google Sheets  
✅ **Double dial logic** - Retries unanswered calls automatically  
✅ **New "Leads" page** - Manage all leads with filtering  

---

## 🎯 Quick Setup (3 Steps)

### 1. Run Database Schema

In Supabase SQL Editor, run:

```bash
supabase/schema-leads-system.sql
```

This creates all necessary tables for the new system.

### 2. Add Google Service Account Key

In your `.env.local`, add:

```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"SterlingDailer@gmail.com",...}'
```

**Where to get this:**
- Use your existing Google service account JSON key
- The one for `SterlingDailer@gmail.com`
- Put the ENTIRE JSON on ONE line as a string

### 3. Configure Retell (Per User)

Each user needs to add their Retell credentials. You can either:

**Option A: Create a settings page** with a form:
- Retell API Key input
- Retell Agent ID input
- POST to `/api/retell/config`

**Option B: Add directly via API:**

```bash
curl -X POST https://your-app.com/api/retell/config \
  -H "Content-Type: application/json" \
  -d '{
    "retellApiKey": "your-key",
    "retellAgentId": "agent-id"
  }'
```

---

## 📱 How Users Use It

### Step 1: Connect Google Sheet

1. User goes to **"Leads"** page (new menu item)
2. Enters their Google Sheet URL
3. Clicks "Connect Sheet"

**Their sheet must:**
- Be shared with `SterlingDailer@gmail.com` as Editor
- Have columns: Name, Phone, Email (optional), Age, State

### Step 2: Sync Leads

1. Click "Sync Leads" button
2. System imports all leads from sheet
3. Leads appear in the table

### Step 3: Launch AI

1. Go to "AI Control Center"
2. Click "Launch AI Agent"
3. System starts calling leads automatically

### Step 4: Monitor Results

**In Dashboard:**
- Activity logs show call results
- Stats update in real-time

**In Google Sheets:**
- Column F updates with status:
  - "New", "No Answer", "Not Interested", "Booked", "Sold"

**In Leads Page:**
- Filter by status using tabs
- See all attempts and outcomes

---

## 🔄 How It Works (Behind the Scenes)

```
User launches AI
    ↓
App fetches callable leads from database
    ↓
For each lead:
    → Calls Retell API directly (no N8N!)
    → Retell makes phone call
    → Retell sends webhook when done
    ↓
Webhook received at /api/retell/webhook
    ↓
System updates:
    ✓ Lead status in database
    ✓ Call record in calls table
    ✓ Status in Google Sheet (Column F)
    ✓ Dashboard stats
    ↓
If no answer + attempts < 2:
    → Lead kept for retry
    → Next launch will call again
```

---

## 📊 New Features

### 1. Leads Page (`/dashboard/leads`)

**Features:**
- Connect/sync Google Sheets
- View all leads
- Filter by status tabs:
  - All, New, Call Back, No Answer, Not Interested, Booked, Sold
- See attempt counts and last call dates

### 2. Google Sheets Integration

**What it does:**
- Reads leads from any Google Sheet
- Imports: Name, Phone, Email, Age, State
- Writes status back to Column F
- Keeps everything in sync

### 3. Direct Retell Calling

**What changed:**
- No more N8N dependency
- App calls Retell directly
- Faster and more reliable
- Easier to debug

### 4. Smart Lead Management

**Knows who to call:**
- ✅ New leads (never called)
- ✅ Callback leads (asked to be called)
- ✅ No answer leads (if < 2 attempts)
- ❌ Not interested (skip)
- ❌ Booked (skip)
- ❌ Sold (skip)

---

## 🗂️ Files Created

### Database
- `supabase/schema-leads-system.sql` - Complete database schema

### API Endpoints
- `app/api/google-sheets/connect/route.ts` - Connect Google Sheet
- `app/api/google-sheets/sync/route.ts` - Import leads from sheet
- `app/api/retell/call/route.ts` - Initiate call with Retell
- `app/api/retell/webhook/route.ts` - Handle Retell webhooks
- `app/api/retell/config/route.ts` - Configure Retell credentials
- `app/api/leads/list/route.ts` - List/filter leads
- `app/api/ai-control/start-direct/route.ts` - Start AI with direct calling

### UI Components
- `app/dashboard/leads/page.tsx` - Leads page
- `components/leads-manager.tsx` - Lead management UI
- Updated sidebar navigation (both desktop & mobile)

### Documentation
- `DIRECT_CALLING_SETUP.md` - Comprehensive setup guide
- `QUICK_START.md` - This file!

---

## ✅ Testing Checklist

Before going live:

- [ ] Database schema ran successfully
- [ ] Google service account key added to env
- [ ] Test Google Sheet connection works
- [ ] Test lead sync imports correctly
- [ ] Retell credentials configured
- [ ] Test call initiates successfully
- [ ] Webhook receives and processes calls
- [ ] Google Sheet status updates
- [ ] Dashboard updates
- [ ] Double dial logic works (retry after no answer)

---

## 🎬 Demo Flow

**For testing:**

1. Create test Google Sheet:
   ```
   Name       | Phone        | Email           | Age | State
   John Doe   | 5551234567  | john@test.com   | 45  | IL
   Jane Smith | 5559876543  | jane@test.com   | 38  | CA
   ```

2. Share with `SterlingDailer@gmail.com` as Editor

3. In app:
   - Go to Leads → Connect Sheet
   - Enter URL → Connect
   - Click "Sync Leads"
   - Should see 2 leads appear

4. Configure Retell (if not done)

5. Go to AI Control Center → Launch AI

6. Watch magic happen:
   - Calls initiated
   - Webhooks received
   - Statuses update
   - Google Sheet Column F updates

---

## 🆘 Need Help?

**Common Issues:**

**"Permission denied" on Google Sheets**
- Make sure sheet is shared with correct email
- Check email is `SterlingDailer@gmail.com`
- Make sure permission is "Editor", not "Viewer"

**"Retell AI not configured"**
- Add API key and Agent ID
- Use `/api/retell/config` endpoint

**"No callable leads"**
- Sync Google Sheet first
- Check lead statuses in Leads page
- Make sure some leads have status "new" or "callback"

**Calls not updating status**
- Check Retell webhook URL is correct
- Should be: `https://your-domain.com/api/retell/webhook`
- Check webhook logs in terminal

---

## 🎉 You're Ready!

The system is fully built and ready to use. Users can now:

1. ✅ Connect their Google Sheets
2. ✅ Import leads automatically
3. ✅ Launch AI to call leads directly
4. ✅ See results in real-time
5. ✅ Track everything in one place

**No more N8N! Everything runs through your app now.** 🚀

---

**Questions?** Check `DIRECT_CALLING_SETUP.md` for detailed documentation.

