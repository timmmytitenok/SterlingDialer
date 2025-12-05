# AI STATUS UI FIX - RUNNING STATUS NOT SHOWING

## 🔍 PROBLEM IDENTIFIED
The AI Status "Running" UI was NOT showing even though the AI was actively making calls.

## 🐛 ROOT CAUSE
**CRITICAL BUG**: The AI control logic and the UI status display were reading from **DIFFERENT DATABASE TABLES**:

1. **AI Control Start/Stop** (`/api/ai-control/start`) updates: `ai_control_settings` table
2. **UI Status Display** (`/api/dialer/status`) was reading: `dialer_sessions` table (OLD!)

This meant:
- When AI launched → updated `ai_control_settings.status = 'running'`
- UI checks status → checked `dialer_sessions.status` → always returned 'idle' or 'stopped'
- Result: AI runs but UI never shows "Running" 🤦‍♂️

## ✅ FIXES APPLIED

### 1. Fixed Status Endpoint (`/app/api/dialer/status/route.ts`)
**Changed from:**
```typescript
const { data: session } = await supabase
  .from('dialer_sessions')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

let status = session?.status || 'idle';
```

**Changed to:**
```typescript
const { data: aiSettings } = await supabase
  .from('ai_control_settings')
  .select('*')
  .eq('user_id', user.id)
  .single();

let status = aiSettings?.status || 'stopped';

// Map 'stopped' to 'idle' for UI consistency
if (status === 'stopped') {
  status = 'idle';
}
```

### 2. Already Fixed: Call Cost Calculation (`/app/api/retell/call-result/route.ts`)
- Corrected call cost formula: `callCost = durationMinutes * costPerMinute`
- Ensures 15-second call at $0.30/min = $0.075 (not $2.73!)

### 3. Already Fixed: Call History Name/Phone (`/app/api/retell/call-result/route.ts`)
- Now stores `contact_name` and `contact_phone` in the `calls` table
- Call History page will show correct name/phone instead of "Unknown" or "N/A"

### 4. Already Fixed: Real-time UI Updates (`/components/ai-dialer-control.tsx`)
- Increased polling from 20 seconds to 2 seconds when AI is running
- Fetches latest call details every 2 seconds for real-time display
- Shows latest call info: name, phone, outcome, duration

## 📊 EXPECTED BEHAVIOR NOW

### When AI Launches:
1. ✅ Status changes to "ACTIVE" immediately (green glowing border)
2. ✅ Daily spend progress bar appears at top
3. ✅ Latest call card appears showing real-time call details
4. ✅ UI polls every 2 seconds for updates

### Call Cost Calculation:
- **Before**: 15 sec call = $2.73 ❌
- **After**: 15 sec call = $0.075 (0.25 min × $0.30/min) ✅

### Call History:
- **Before**: Shows "Unknown" / "N/A" for name and phone ❌
- **After**: Shows actual lead name and phone number ✅

## 🗄️ DATABASE UPDATES NEEDED

Run this SQL in your Supabase SQL Editor to add the missing columns:

```sql
-- Add contact_name and contact_phone columns to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'calls'
AND column_name IN ('contact_name', 'contact_phone')
ORDER BY column_name;
```

## 🎯 TESTING STEPS

1. **Run the SQL script above** in Supabase SQL Editor
2. Launch the AI Dialer manually with 1-2 leads
3. **Verify Status UI**:
   - Should show "ACTIVE" with green glowing animation
   - Daily spend bar should appear at top
   - Latest call card should show real-time updates
4. **Check Dashboard**: AI Cost should reflect correct calculation ($0.30/min)
5. **Check Call History**: Should show lead name and phone number

## 📝 FILES MODIFIED

1. ✅ `/app/api/dialer/status/route.ts` - Fixed to read from `ai_control_settings`
2. ✅ `/app/api/retell/call-result/route.ts` - Fixed cost calculation and added contact fields
3. ✅ `/components/ai-dialer-control.tsx` - Increased polling to 2 seconds, added latest call display

## 🚀 DEPLOYMENT NOTES

- No breaking changes
- All fixes are backward compatible
- SQL migration is optional but recommended for Call History display
- If `contact_name` / `contact_phone` columns don't exist, they'll just show "Unknown" / "N/A" (no errors)

---

**Status**: ✅ FIXED - Ready for testing

