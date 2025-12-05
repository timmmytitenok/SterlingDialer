# Simplified 20-Attempt Retry Logic

## ✅ What Changed

### Before (Complex System):
- **18 total attempts** across 3 time periods
- **6 morning** calls (8am-12pm)
- **6 daytime** calls (12pm-5pm)  
- **6 evening** calls (6pm-9pm)
- Time-period tracking for every lead
- Complex filtering logic

### After (Simple System):
- **20 total attempts** (no time restrictions)
- No time-period tracking
- Simple counter: `total_calls_made`
- After 20 attempts with no answer → `status = 'dead_lead'`

---

## 🔧 How It Works Now

### Lead Selection Logic
```
1. Get all leads from ACTIVE Google Sheets
2. Filter by callable statuses:
   - new
   - callback_later
   - unclassified
   - no_answer
3. Exclude leads with:
   - total_calls_made >= 20 (hit limit)
   - status = 'dead_lead'
   - Already called today (call_attempts_today > 0 on same date)
4. Order by: fewest attempts first (fresh leads prioritized)
5. Call the next lead
```

### Double-Dial Logic (Unchanged)
- **First attempt → No answer** → Try again immediately (double dial)
- **Second attempt → No answer** → Count as 1 call attempt, move to next lead
- **First attempt → Answered** → Count as 1 call attempt, process outcome

### Call Tracking
- `total_calls_made`: Increments on answered calls OR double-dial no-answer
- `call_attempts_today`: Prevents calling same lead twice in one day
- `last_attempt_date`: Tracks when lead was last called

### Dead Lead Detection
```javascript
if (total_calls_made >= 20 && !callWasAnswered) {
  status = 'dead_lead';
  // Lead will no longer appear in callable leads
}
```

---

## 📊 Database Columns Used

### Primary Columns:
- `total_calls_made` (INTEGER) - Total attempts (0-20)
- `total_pickups` (INTEGER) - How many times they answered
- `pickup_rate` (DECIMAL) - Percentage of answered calls
- `status` (TEXT) - Lead status (new, callback_later, dead_lead, etc.)
- `call_attempts_today` (INTEGER) - Calls made today (resets daily)
- `last_attempt_date` (TEXT) - Date of last call

### Deprecated Columns (No Longer Used):
- `morning_missed_calls`
- `daytime_missed_calls`
- `evening_missed_calls`
- `total_missed_calls`
- `last_call_time_period`

---

## 🚀 Benefits

1. **Simpler Logic** - No time-period tracking needed
2. **More Flexible** - Can call leads any time during calling hours
3. **Faster Queries** - Less filtering needed
4. **Easier to Understand** - Single counter instead of 3 time-period counters
5. **More Attempts** - 20 attempts vs 18 attempts
6. **Less Database Writes** - Fewer columns to update

---

## 🧪 Testing

### To Test:
1. Upload a Google Sheet with leads
2. Launch AI with 1 lead count
3. Watch terminal logs - should show:
   ```
   📊 Lead Count Mode: 0 / 1 calls made
   ✅ Within limit, continuing (1 calls remaining)
   🔍 Searching for next callable lead...
   ✅ Found lead to call: John Doe
      - Total attempts: 0 / 20
   📞 Making call...
   ```

### To Simulate Dead Lead:
```sql
-- Manually set a lead to 20 attempts
UPDATE leads 
SET total_calls_made = 20, status = 'dead_lead' 
WHERE id = 'some-lead-id';

-- Lead should no longer be callable
```

---

## 📝 Files Modified

1. `/app/api/ai-control/next-call/route.ts`
   - Removed time-period calculation
   - Simplified lead selection query
   - Updated to use `total_calls_made` instead of time-period counters
   - Added active Google Sheets filtering

2. `/app/api/retell/call-result/route.ts`
   - Removed time-period tracking
   - Simplified counter increments
   - Added dead lead detection at 20 attempts
   - Removed `morning_missed_calls`, `daytime_missed_calls`, `evening_missed_calls` updates

3. `/app/api/ai-control/start/route.ts`
   - Changed `.update()` to `.upsert()` to auto-create settings if missing

---

## 🔥 What to Run

1. **Run SQL Setup:**
   ```sql
   -- Run SIMPLIFIED_20_ATTEMPT_SYSTEM.sql in Supabase SQL Editor
   ```

2. **Restart Dev Server:**
   ```bash
   # Kill current server (Ctrl+C)
   npm run dev
   ```

3. **Test AI Launch:**
   - Go to `/dashboard/ai-dialer`
   - Click "Launch AI Dialer"
   - Select "Lead Count" mode
   - Set to 1 lead
   - Click "Launch AI"
   - Watch terminal logs for success

---

## ✅ Expected Behavior

- ✅ AI starts immediately (no shutoff)
- ✅ Calls leads from active Google Sheets
- ✅ Double-dials on no-answer
- ✅ Marks lead status after each call
- ✅ After 20 attempts with no answer → marks as 'dead_lead'
- ✅ Stops when lead count/budget limit reached
- ✅ Updates Lead Manager with call results

---

## 🚨 Troubleshooting

### AI Stops Immediately
- Check: Do you have active Google Sheets uploaded?
- Check: Are leads in `status = 'new'` or callable statuses?
- Check: Terminal logs for "NO CALLABLE LEADS" message

### Leads Not Being Called
- Check: `is_qualified = true` for leads
- Check: `google_sheet_id` matches an active sheet
- Check: `status` is callable (not 'dead_lead', 'not_interested', etc.)

### Double-Dial Not Working
- Check: Retell webhook is hitting `/api/retell/call-result`
- Check: `in_voicemail` flag is being detected correctly
- Check: Terminal logs show "🔄 FIRST ATTEMPT NO ANSWER - Will double dial"

---

## 🎯 Summary

The system is now **much simpler**:
- **20 attempts** before marking dead
- **No time-period complexity**
- **Faster lead selection**
- **Easier to understand and debug**

