# Testing Guide: N8N Integration

## 🧪 Two Ways to Test

### Option 1: Test with Mock (No N8N Needed)

Test if your dashboard works correctly without hitting N8N:

1. **Add to `.env.local`:**
   ```env
   N8N_TEST_MODE=true
   ```

2. **Restart server:**
   ```bash
   npm run dev
   ```

3. **Test:**
   - Go to AI Control Panel
   - Click "Start AI Session"
   - Wait 2 seconds
   - Should see: "✅ AI session completed! X calls made."

4. **Check logs:**
   ```
   🧪 TEST MODE: Using mock endpoint
   🧪 Mock N8N received: {...}
   🧪 Mock N8N responding with: { status: 'finished', callsMade: 5 }
   ```

**This proves your dashboard code works!**

---

### Option 2: Test with Real N8N

Test the actual N8N integration:

1. **Remove test mode from `.env.local`:**
   ```env
   # N8N_TEST_MODE=true  <- Comment out or delete
   N8N_WEBHOOK_START_DIAL=https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
   ```

2. **Restart server:**
   ```bash
   npm run dev
   ```

3. **Start a session:**
   - Set limit to 5 (for quick testing)
   - Click "Start AI Session"
   - Watch terminal logs

4. **What to look for:**

   **✅ Success:**
   ```
   🚀 Sending to N8N webhook: {...}
   📡 N8N Response Status: 200
   📄 N8N Raw Response: {"status":"finished","callsMade":5}
   ✅ N8N response parsed: { status: 'finished', callsMade: 5 }
   ✅ Session updated successfully
   ```

   **❌ Problem - No Response:**
   ```
   🚀 Sending to N8N webhook: {...}
   # Hangs here forever
   ```
   → N8N isn't responding. Check N8N settings (see DEBUG_N8N.md)

   **❌ Problem - Wrong Format:**
   ```
   📄 N8N Raw Response: {"message":"success"}
   ⚠️ N8N response does not indicate completion
   ```
   → N8N is responding but with wrong format. Fix "Respond to Webhook" node

---

## 🔍 Debugging Steps

### Step 1: Test Dashboard Only (Mock Mode)

```bash
# Enable test mode
echo "N8N_TEST_MODE=true" >> .env.local

# Restart
npm run dev

# Test in browser
```

**If this works:** Dashboard code is fine, problem is N8N
**If this fails:** Dashboard has an issue, check browser console

### Step 2: Test N8N Separately

```bash
# Test N8N directly with curl
curl -X POST https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137 \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","dailyCallLimit":5}' \
  -v
```

**Should return:**
```json
{
  "status": "finished",
  "callsMade": 5
}
```

**If you get nothing or different format:**
→ N8N workflow needs fixing

### Step 3: Check N8N Workflow

**Most common issues:**

1. **Webhook Response Mode is wrong**
   - Open Webhook Trigger node
   - Find "Response Mode" setting
   - Must be: "Wait for Webhook Response" or "Last Node"

2. **Missing "Respond to Webhook" node**
   - Add it as the LAST node
   - Set response body:
     ```json
     {
       "status": "finished",
       "callsMade": {{ yourCountExpression }}
     }
     ```

3. **Workflow is not active**
   - Check workflow status
   - Must show "Active" not "Inactive"

---

## 📊 Expected Terminal Output

### With Test Mode (Mock):
```bash
🚀 Starting AI session with limit: 5
🧪 TEST MODE: Using mock endpoint
🧪 Mock URL: http://localhost:3000/api/test-n8n-mock
🧪 Mock N8N received: { sessionId: '...', dailyCallLimit: 5, ... }
🧪 Mock N8N responding with: { status: 'finished', callsMade: 5, ... }
🧪 Mock response: { status: 'finished', callsMade: 5 }
🔄 Updating session to stopped...
📊 Calls made: 5
✅ Session updated successfully: { id: '...', status: 'stopped', ... }
```

### With Real N8N:
```bash
🚀 Starting AI session with limit: 5
🚀 Sending to N8N webhook: { sessionId: '...', dailyCallLimit: 5, ... }
📍 N8N URL: https://timmmytitenok.app.n8n.cloud/webhook/...
📡 N8N Response Status: 200
📡 N8N Response Headers: { content-type: 'application/json', ... }
📄 N8N Raw Response: {"status":"finished","callsMade":5}
✅ N8N response parsed: { status: 'finished', callsMade: 5 }
🔄 Updating session to stopped...
📊 Calls made: 5
✅ Session updated successfully: { id: '...', status: 'stopped', ... }
```

---

## 🎯 Quick Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Dashboard hangs forever | N8N not responding | Check N8N response mode |
| "No N8N response in data" | N8N sent wrong format | Fix "Respond to Webhook" node |
| "Failed to parse" | Invalid JSON from N8N | Check N8N response body |
| Mock works but N8N doesn't | N8N configuration issue | Follow DEBUG_N8N.md |
| Both fail | Dashboard code issue | Check browser console |

---

## ✅ Success Checklist

Before reporting an issue, verify:

- [ ] Tested with mock mode - works? (If yes, problem is N8N)
- [ ] Tested N8N with curl - responds? (If no, fix N8N workflow)
- [ ] N8N has "Respond to Webhook" node as LAST node
- [ ] Response includes `status: "finished"` and `callsMade: number`
- [ ] Webhook response mode is set to "Wait for Webhook Response"
- [ ] Workflow is ACTIVE
- [ ] Terminal shows all expected logs
- [ ] Browser console has no errors

---

## 📞 Need Help?

If still not working, provide:

1. **Test mode result:**
   ```bash
   # Set N8N_TEST_MODE=true and share terminal output
   ```

2. **N8N curl test:**
   ```bash
   curl -X POST [your-webhook-url] -d '{"test":true}' -v
   ```

3. **N8N workflow screenshot:**
   - Show all nodes
   - Show "Respond to Webhook" settings
   - Show Webhook Trigger settings

4. **Terminal logs:**
   - Full output when clicking "Start AI Session"

With these, we can pinpoint the exact issue! 🔍

