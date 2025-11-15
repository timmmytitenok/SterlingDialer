# 🔍 Check If Retell Webhook Is Set Up

## Step 1: Check Your Retell Dashboard

1. Go to **Retell Dashboard**: https://beta.retellai.com/dashboard
2. Click **Settings** (or **Webhooks**)
3. Look for **"Webhook URL"**

### What You Should See:

**For Local Development:**
```
https://YOUR-NGROK-URL.ngrok-free.app/api/retell/call-result
```

**For Production:**
```
https://your-domain.com/api/retell/call-result
```

---

## Step 2: If Webhook URL Is Not Set

You need to configure it in Retell:

1. Get your webhook URL:
   - **Local**: Start ngrok: `ngrok http 3000`
   - Copy the URL (e.g., `https://abc123.ngrok-free.app`)
   - Add `/api/retell/call-result` to the end

2. In Retell Dashboard:
   - Go to Settings → Webhooks
   - Set Webhook URL: `https://abc123.ngrok-free.app/api/retell/call-result`
   - Select events: **"Call Analyzed"** (most important!)
   - Save

---

## Step 3: Test If Webhook Is Working

After the next call, check your terminal for:

```
🚨 ========== RETELL WEBHOOK RECEIVED ==========
⏰ Timestamp: [time]
🔍 Event Type: call_analyzed
✅ Event is call_analyzed - processing full call analysis
📞 Call ID: [id]
📊 Call Status: ended
🎯 Metadata: { user_id: 'xxx', lead_id: 'yyy' }
```

**If you DON'T see this**, Retell is NOT sending webhooks!

---

## Step 4: Verify Webhook Logs

You can also check if webhooks are being saved:

```sql
SELECT * FROM webhook_logs
WHERE webhook_type = 'retell_call_analyzed'
ORDER BY created_at DESC
LIMIT 10;
```

If this table is empty, webhooks aren't reaching your server!

---

## Quick Fix for Local Development:

1. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

2. **Copy the URL** (looks like: `https://abc-123-def.ngrok-free.app`)

3. **Update Retell webhook URL:**
   - Go to Retell Dashboard
   - Settings → Webhooks
   - Paste: `https://abc-123-def.ngrok-free.app/api/retell/call-result`
   - Select "Call Analyzed" event
   - Save

4. **Make another test call**

5. **Watch terminal** - you should see webhook logs!

---

## If Webhook IS Being Called But Updates Aren't Working:

That means the database columns don't exist yet!

**Run this SQL in Supabase NOW:**

```sql
-- Add basic tracking columns (these MUST exist)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS times_dialed INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_outcome TEXT;

-- Verify columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('times_dialed', 'last_called', 'last_call_outcome');
```

Should show all 3 columns!

---

## Next Test Call Will Show:

```
💾 Updating lead xxx...
   - Outcome: not_interested (or whatever)
   - Status: not_interested
   - Incrementing times_dialed: 0 → 1
📝 Final update object: { status: '...', times_dialed: 1, ... }
✅ Lead updated successfully in database!
```

Then refresh Lead Manager and you'll see the update! 🎉

