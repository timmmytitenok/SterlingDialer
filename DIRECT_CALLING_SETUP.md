# 🚀 Direct Calling System - Setup Guide

## Overview

This system eliminates N8N as a middleware and allows the app to directly call leads using Retell AI. The app reads leads from Google Sheets, makes calls, and updates both the dashboard and Google Sheets with results.

---

## ✅ What You Get

- **📊 Google Sheets Integration** - Connect any Google Sheet with leads
- **📞 Direct Retell Calling** - No N8N required, app calls directly
- **🔄 Auto Status Updates** - Both dashboard and Google Sheets update automatically
- **♻️ Double Dial Logic** - Automatically retries unanswered calls (up to 2 attempts)
- **📋 Lead Management** - View and filter leads by status (New, Booked, No Answer, etc.)
- **🎯 Smart Calling** - System knows which leads to call/skip based on status

---

## 🔧 Setup Steps

### Step 1: Run Database Schema

Run this SQL in your Supabase SQL Editor:

```bash
/supabase/schema-leads-system.sql
```

This creates:
- `user_google_sheets` table - Stores Google Sheet connections
- `user_retell_config` table - Stores Retell API credentials
- `call_queue` table - Tracks calls in progress
- Enhanced `leads` table - Adds call tracking columns

### Step 2: Set Up Google Service Account

1. **Create Service Account** (if not already done):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Sheets API
   - Create a Service Account
   - Download the JSON key file

2. **Add to Environment Variables**:

In your `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"SterlingDailer@gmail.com",...}'
```

**⚠️ Important:** The entire JSON key must be on ONE line as a string.

### Step 3: Configure Retell AI

Users need to add their Retell credentials. Create a settings page or use the API:

**API Endpoint:**
```typescript
POST /api/retell/config
Body: {
  retellApiKey: "your-retell-api-key",
  retellAgentId: "your-agent-id"
}
```

**Where to find Retell credentials:**
1. Log in to [Retell AI Dashboard](https://dashboard.retellai.com)
2. Go to Settings → API Keys
3. Copy your API Key
4. Go to Agents → Select your agent → Copy Agent ID

---

## 📊 How It Works

### 1. User Connects Google Sheet

```
User → Leads Page → "Connect Google Sheet"
↓
Enters Sheet URL
↓
System extracts Sheet ID
↓
Saves to user_google_sheets table
```

**Sheet Format (Columns):**
- **Column A:** Name (First name only)
- **Column B:** Phone number
- **Column C:** Email (optional)
- **Column D:** Age
- **Column E:** State
- **Column F:** Status (auto-updated by system)

### 2. User Syncs Leads

```
User clicks "Sync Leads"
↓
System reads Google Sheet via service account
↓
Imports all rows into `leads` table
↓
Stores row numbers for future updates
```

### 3. User Launches AI

```
User clicks "Launch AI"
↓
System fetches callable leads:
  - status = 'new'
  - status = 'callback'
  - status = 'no_answer' AND times_dialed < 2
↓
For each lead:
  - Calls Retell API to initiate phone call
  - Updates lead status to 'calling'
  - Adds to call_queue
```

### 4. Retell Makes Call

```
Retell AI calls the lead's phone number
↓
Call happens (answered or not)
↓
Retell sends webhook to /api/retell/webhook
```

### 5. Webhook Updates Everything

```
Webhook received
↓
Parse call result:
  - Was it answered?
  - What was the outcome? (booked, not interested, callback, etc.)
↓
Update Database:
  - Update lead status
  - Increment times_dialed
  - Insert into calls table
↓
Update Google Sheet:
  - Write status to Column F
  - User sees status in real-time
```

### 6. Double Dial Logic

```
If call NOT answered:
  - Check times_dialed
  - If < 2: Keep status as 'no_answer' for retry
  - If = 2: Mark as 'no_answer' (final)
↓
Next AI launch:
  - Leads with times_dialed < 2 will be called again
  - Leads with times_dialed >= 2 are skipped
```

---

## 📋 Lead Statuses

| Status | Meaning | Will Be Called Again? |
|--------|---------|----------------------|
| `new` | Fresh lead, never called | ✅ Yes |
| `calling` | Call in progress | ⏳ Wait |
| `no_answer` | Didn't pick up | ✅ Yes (if < 2 attempts) |
| `callback` | Asked to be called later | ✅ Yes |
| `not_interested` | Declined | ❌ No |
| `booked` | Appointment scheduled | ❌ No |
| `sold` | Policy closed | ❌ No |
| `do_not_call` | Blocked | ❌ No |

---

## 🎯 API Endpoints

### Google Sheets

**Connect Sheet:**
```
POST /api/google-sheets/connect
Body: { sheetUrl: "https://docs.google.com/..." }
```

**Sync Leads:**
```
POST /api/google-sheets/sync
```

**Get Connected Sheet:**
```
GET /api/google-sheets/connect
```

### Retell AI

**Configure Retell:**
```
POST /api/retell/config
Body: {
  retellApiKey: "...",
  retellAgentId: "...",
  webhookUrl: "..." (optional)
}
```

**Get Retell Config:**
```
GET /api/retell/config
```

**Initiate Call:**
```
POST /api/retell/call
Body: { leadId: "uuid" }
```

**Webhook (Retell calls this):**
```
POST /api/retell/webhook
Body: { call_id, call_status, call_analysis, ... }
```

### Leads

**List Leads:**
```
GET /api/leads/list?status=all&limit=100&offset=0
```

**Status filters:**
- `all` - All leads
- `new` - New leads
- `callback` - Leads to call back
- `no_answer` - No answer leads
- `not_interested` - Not interested
- `booked` - Booked appointments
- `sold` - Sold policies
- `callable` - All leads that can be called (new, callback, or no_answer with < 2 attempts)

### AI Control

**Start AI (Direct Calling):**
```
POST /api/ai-control/start-direct
Body: { dailyCallLimit: 50 }
```

**Stop AI:**
```
POST /api/ai-control/stop
Body: { userId: "..." }
```

---

## 🎨 UI Pages

### Leads Page (`/dashboard/leads`)

Features:
- Google Sheet connection form
- Sync button
- Tabbed lead view:
  - All Leads
  - New
  - Call Back
  - No Answer
  - Not Interested
  - Booked
  - Sold
- Lead table with:
  - Name, Phone, State, Age
  - Status badges
  - Attempt count
  - Last call date

### AI Control Center (`/dashboard/ai-control`)

Update to use direct calling:
- Check if Retell is configured
- Check if leads exist
- Use `/api/ai-control/start-direct` instead of N8N webhook

---

## 🔐 Security Notes

1. **Service Account Key:**
   - Keep `GOOGLE_SERVICE_ACCOUNT_KEY` secret
   - Never commit to git
   - Use environment variables only

2. **Retell API Keys:**
   - Stored encrypted in database
   - Only accessible by owner
   - Never exposed to client

3. **Webhooks:**
   - Retell webhook is public (necessary)
   - Validates call_id against database
   - Only processes valid calls

---

## 🧪 Testing

### Test Google Sheets Connection

1. Create a test Google Sheet:
   - Add columns: Name, Phone, Email, Age, State, Status
   - Add a few test rows
   - Share with `SterlingDailer@gmail.com` as Editor

2. Connect in app:
   - Go to `/dashboard/leads`
   - Enter sheet URL
   - Click "Connect Sheet"

3. Sync:
   - Click "Sync Leads"
   - Check database: `SELECT * FROM leads;`
   - Should see imported leads

### Test Retell Calling

1. Configure Retell:
   - Add API key and Agent ID
   - Verify saved: `SELECT * FROM user_retell_config;`

2. Make test call:
   ```bash
   curl -X POST http://localhost:3000/api/retell/call \
     -H "Content-Type: application/json" \
     -d '{"leadId":"YOUR_LEAD_ID"}'
   ```

3. Check results:
   - Should receive webhook when call completes
   - Lead status should update
   - Google Sheet Column F should update

---

## 🐛 Troubleshooting

### Google Sheets Not Syncing

**Error:** "Permission denied"
- **Fix:** Make sure sheet is shared with `SterlingDailer@gmail.com` as Editor

**Error:** "Sheet not found"
- **Fix:** Check URL is correct and sheet isn't deleted

### Retell Not Calling

**Error:** "Retell AI not configured"
- **Fix:** Add API key and Agent ID via `/api/retell/config`

**Error:** "No callable leads"
- **Fix:** Sync Google Sheet first or check lead statuses

### Webhook Not Updating

**Error:** Calls made but status not updating
- **Fix:** Check webhook URL is set correctly in Retell dashboard
- **URL:** `https://your-domain.com/api/retell/webhook`

### Double Dial Not Working

**Issue:** Leads not being retried
- **Check:** `times_dialed` column in database
- **Should be:** Less than 2 for retries
- **Fix:** Update manually if needed: `UPDATE leads SET times_dialed = 0 WHERE id = '...';`

---

## 📚 Next Steps

1. ✅ Run database schema
2. ✅ Configure Google service account
3. ✅ Test Google Sheets connection
4. ✅ Configure Retell AI
5. ✅ Test making calls
6. ✅ Verify webhook updates
7. ✅ Test double dial logic
8. 🎉 Launch and scale!

---

## 💡 Tips

- **Start Small:** Test with 5-10 leads first
- **Monitor Webhooks:** Check logs for webhook responses
- **Check Google Sheet:** Status should update in real-time
- **Rate Limiting:** System adds 2-second delay between calls
- **Balance:** Make sure you have Retell credits
- **Agent Configuration:** Configure your Retell agent's script and voice

---

## 🚧 Future Enhancements

- [ ] Scheduling: Set specific times for calling
- [ ] Bulk actions: Update multiple lead statuses at once
- [ ] Manual calling: Call individual leads from UI
- [ ] Call recordings: Listen to calls directly in dashboard
- [ ] Analytics: Detailed insights on call performance
- [ ] Custom retry logic: Configure retry delays and attempts
- [ ] Multi-sheet support: Connect multiple Google Sheets
- [ ] Lead scoring: Prioritize high-value leads

---

**Need Help?** Check the logs in your terminal and Supabase dashboard for detailed error messages.

**Questions?** Open an issue or contact support.

🎉 **Happy Calling!**

