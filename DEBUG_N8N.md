# Debugging N8N "Respond to Webhook" Integration

## 🔍 How to Debug

Follow these steps to identify the issue:

---

## Step 1: Check Your Terminal Logs

When you click "Start AI Session", you should see these logs in your terminal:

### ✅ **Expected Logs:**

```bash
🚀 Starting AI session with limit: 100
🚀 Sending to N8N webhook: { sessionId: '...', dailyCallLimit: 100, ... }
📍 N8N URL: https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137

# Wait for N8N to process...

📡 N8N Response Status: 200
📡 N8N Response Headers: { ... }
📄 N8N Raw Response: {"status":"finished","callsMade":100}
✅ N8N response parsed: { status: 'finished', callsMade: 100 }
🔄 Updating session to stopped...
📊 Calls made: 100
✅ Session updated successfully: { id: '...', status: 'stopped', ... }
```

### ❌ **Problem Scenarios:**

#### Scenario A: Request Never Completes
```bash
🚀 Sending to N8N webhook: { ... }
# Nothing after this - request hangs forever
```

**Problem:** N8N isn't responding at all
**Solution:** Check N8N workflow settings (see below)

#### Scenario B: N8N Returns Wrong Format
```bash
📄 N8N Raw Response: {"message":"ok"}
⚠️ N8N response does not indicate completion
Response status: undefined
```

**Problem:** N8N is responding but not with the right format
**Solution:** Fix your "Respond to Webhook" node (see below)

#### Scenario C: N8N Returns Error
```bash
❌ N8N webhook failed with status: 500
Error response: Internal Server Error
```

**Problem:** N8N workflow has an error
**Solution:** Check N8N execution logs

---

## Step 2: Check Browser Console

Open your browser's Developer Tools (F12) and look at the Console tab:

### ✅ **Expected:**
```
🚀 Starting AI session with limit: 100
📡 Response status: 200
📦 Response data: { success: true, n8nResponse: { status: 'finished', callsMade: 100 } }
✅ N8N Response received: { status: 'finished', callsMade: 100 }
```

### ❌ **Problems:**

#### If you see:
```
⚠️ No N8N response in data
```
**Problem:** Backend didn't receive proper response from N8N

#### If you see timeout error:
```
Failed to fetch
```
**Problem:** Request took too long or network error

---

## Step 3: Check N8N Workflow Settings

### A. Webhook Trigger Node

**Settings to check:**
- **Webhook URL**: Should be the one in your env (`N8N_WEBHOOK_START_DIAL`)
- **HTTP Method**: POST
- **Response Mode**: ⚠️ **MUST be "Wait for Webhook Response"**

**How to check:**
1. Open your N8N workflow
2. Click on the Webhook Trigger node
3. Look for "Response Mode" or "Respond" setting
4. Must say "Wait for Webhook Response" or "Last Node"

### B. Respond to Webhook Node

**This MUST be your LAST node!**

**Settings:**
- **Node Type**: "Respond to Webhook"
- **Response Code**: 200
- **Response Body**: Custom JSON

**Example Body:**
```json
{
  "status": "finished",
  "callsMade": {{ $('Count Node').itemMatching(0).$json.count }}
}
```

**Common mistakes:**
- ❌ Forgot to add "Respond to Webhook" node
- ❌ Node is not the last node
- ❌ Wrong field names (must be exactly `status` and `callsMade`)
- ❌ Status value is not "finished" or "completed"

---

## Step 4: Test N8N Directly

### Test with curl:

```bash
curl -X POST https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137 \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "dailyCallLimit": 5,
    "userId": "test-user"
  }'
```

**What you should see:**
```json
{
  "status": "finished",
  "callsMade": 5
}
```

**If you see nothing or different format:**
- N8N isn't set up correctly
- Check N8N execution logs
- Verify "Respond to Webhook" node

---

## Step 5: Common N8N Issues

### Issue 1: Webhook Doesn't Respond

**Symptoms:**
- Dashboard hangs with loading spinner
- Terminal shows request sent but no response

**Solutions:**
1. In N8N Webhook node, change setting to "Wait for Webhook Response"
2. Make sure workflow is ACTIVE (not paused)
3. Check N8N has execution limit available

### Issue 2: Wrong Response Format

**Symptoms:**
- Response received but session doesn't update
- Terminal shows "N8N response does not indicate completion"

**Solution:**
Fix your "Respond to Webhook" node to send:
```json
{
  "status": "finished",
  "callsMade": 100
}
```

**Exact field names matter!**
- ✅ `status` (lowercase)
- ✅ `callsMade` (camelCase)
- ❌ `Status` (wrong case)
- ❌ `calls_made` (wrong format)

### Issue 3: Workflow Takes Too Long

**Symptoms:**
- Request times out after 60 seconds
- Dashboard shows error

**Solutions:**
1. **Reduce test limit** - Use 5 calls for testing
2. **Optimize workflow** - Make calls in parallel
3. **Consider async** - For production, use separate callback webhook

---

## Step 6: Check Database

Check if session was created but not updated:

```sql
-- Check recent sessions
SELECT * FROM ai_sessions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;

-- Look for:
-- status = 'active' (not updated to 'stopped')
-- calls_made_today = 0 (not updated)
-- stopped_at = null (not set)
```

**If session exists but status is still 'active':**
- N8N didn't respond correctly
- Backend didn't update (check terminal logs for errors)

---

## Step 7: Quick Test Workflow

### Minimal N8N Test:

1. **Webhook Trigger**
   - Response Mode: "Wait for Webhook Response"

2. **Set Node** (optional)
   - Just to add a small delay

3. **Respond to Webhook** (MUST BE LAST)
   - Body:
   ```json
   {
     "status": "finished",
     "callsMade": 5
   }
   ```

Test this simple workflow first to verify the connection works!

---

## Step 8: Environment Variables

Make sure your `.env.local` has:

```env
N8N_WEBHOOK_START_DIAL=https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

**Verify it's loaded:**
- Stop dev server (Ctrl+C)
- Restart: `npm run dev`
- Check terminal logs show correct URL

---

## 🎯 Checklist

Before testing, verify:

### Dashboard:
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser console is open (F12)
- [ ] Terminal is visible for logs

### N8N:
- [ ] Workflow is ACTIVE (not paused)
- [ ] Webhook node has "Wait for Webhook Response"
- [ ] "Respond to Webhook" node exists
- [ ] It's the LAST node in workflow
- [ ] Response body has `status` and `callsMade`

### Test:
- [ ] Use small limit (5 calls) for testing
- [ ] Check terminal logs
- [ ] Check browser console
- [ ] Verify N8N execution logs

---

## 🆘 Still Not Working?

### Share these logs:

1. **Terminal logs** (complete output from starting session)
2. **Browser console** (any errors or warnings)
3. **N8N execution log** (click on execution, see what each node outputs)
4. **Your "Respond to Webhook" node settings** (screenshot)

### Quick Fixes:

1. **Restart everything:**
   ```bash
   # Stop dev server
   Ctrl+C
   
   # Clear cache
   rm -rf .next
   
   # Restart
   npm run dev
   ```

2. **Test N8N separately** with curl (see Step 4)

3. **Simplify N8N workflow** to just Webhook → Respond (no processing)

---

## 📚 Reference

**N8N Response Format:**
```json
{
  "status": "finished",      // or "completed"
  "callsMade": 100,          // number of calls
  "message": "Success"       // optional
}
```

**Dashboard will:**
1. Send request to N8N
2. Wait for response (with loading indicator)
3. Parse response
4. Update session if status is "finished" or "completed"
5. Show success message
6. Refresh to show updated UI

**The entire flow should take:**
- Test (5 calls): ~30 seconds
- Production (100 calls): ~5-10 minutes

If it takes longer, optimize your N8N workflow!

---

**Follow these steps and you'll find the issue!** 🔍

