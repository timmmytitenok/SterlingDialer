# N8N "Respond to Webhook" Setup

## Overview

Your N8N workflow uses the **"Respond to Webhook"** node, which means:
1. Dashboard sends request to N8N
2. N8N processes everything (makes calls)
3. N8N responds back to the same request with results
4. Dashboard receives response and updates immediately

This is a **synchronous** flow - the dashboard waits for N8N to complete.

---

## 🎯 N8N Workflow Structure

```
┌────────────────────────┐
│  Webhook Trigger       │ ← Receives request from dashboard
└───────────┬────────────┘
            │
            ↓
┌────────────────────────┐
│  Set Variables         │ ← Save sessionId, dailyCallLimit
└───────────┬────────────┘
            │
            ↓
┌────────────────────────┐
│  Load Leads            │ ← Get leads to call
└───────────┬────────────┘
            │
            ↓
┌────────────────────────┐
│  Loop: Make Calls      │ ← Call each lead
│  (up to dailyCallLimit)│
└───────────┬────────────┘
            │
            ↓
┌────────────────────────┐
│  Count Results         │ ← Track how many calls made
└───────────┬────────────┘
            │
            ↓
┌────────────────────────┐
│  Respond to Webhook    │ ← Send response back to dashboard
└────────────────────────┘
```

---

## 📤 What Dashboard Sends to N8N

When user clicks "Start AI Session":

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "userEmail": "user@example.com",
  "sessionId": "abc-123-def-456",
  "dailyCallLimit": 100,
  "callsMadeToday": 0,
  "sessionStatus": "active",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Access in N8N:**
```javascript
// In any node after webhook
const sessionId = $json.sessionId;
const dailyLimit = $json.dailyCallLimit;
const userEmail = $json.userEmail;
```

---

## 📥 What N8N Should Respond With

At the END of your workflow, use **"Respond to Webhook"** node:

### Response Body:

```json
{
  "status": "finished",
  "callsMade": 100,
  "message": "Completed all calls successfully",
  "sessionId": "{{ $json.sessionId }}"
}
```

### Field Descriptions:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | ✅ Yes | Use "finished" or "completed" |
| `callsMade` | Integer | ✅ Yes | Total calls made in this session |
| `message` | String | ⚠️ Optional | Success message or notes |
| `sessionId` | UUID | ⚠️ Optional | Echo back for logging |

---

## 🔧 N8N Node Configuration

### 1. Webhook Trigger Node (Already Set Up)

**Webhook URL:**
```
https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

**Settings:**
- Method: POST
- Response Mode: Wait for response (important!)

### 2. Your Processing Nodes

Example nodes you might have:
- Load leads from database
- Filter by status
- Loop through leads
- Make AI calls
- Track results

### 3. Respond to Webhook Node (FINAL NODE)

**Node Type:** `Respond to Webhook`

**Settings:**
- Response Code: 200
- Response Body: Custom JSON

**Body (in Expression mode):**
```json
{
  "status": "finished",
  "callsMade": {{ $('Count Calls').itemMatching(0).$json.totalCalls }},
  "message": "AI calling session completed successfully",
  "sessionId": "{{ $('Webhook').item.json.sessionId }}"
}
```

**Important Notes:**
- Replace `'Count Calls'` with your actual node name
- Adjust expressions based on your workflow
- Make sure to use the sessionId from the webhook trigger

---

## 💡 Example N8N Expressions

### Get sessionId from webhook:
```javascript
{{ $('Webhook').item.json.sessionId }}
```

### Get dailyCallLimit:
```javascript
{{ $('Webhook').item.json.dailyCallLimit }}
```

### Count items in a node:
```javascript
{{ $('Make Calls').itemMatching().length }}
```

### Get value from previous node:
```javascript
{{ $('Previous Node').itemMatching(0).$json.count }}
```

---

## 🎬 Complete Flow Example

### Step 1: Webhook Receives
```
Input: { sessionId: "abc-123", dailyCallLimit: 100 }
```

### Step 2: Process Calls
```
Make calls in a loop
Track: 98 calls made (reached limit or end of list)
```

### Step 3: Respond to Webhook
```json
{
  "status": "finished",
  "callsMade": 98,
  "message": "Completed 98 calls"
}
```

### Step 4: Dashboard Updates
```
Session status: stopped
Calls made: 98
Shows: "AI System Idle"
```

---

## 🧪 Testing

### Test from Dashboard

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to AI Control Panel

3. Set daily limit (e.g., 5 for quick testing)

4. Click "Start AI Session"

5. **Dashboard will wait** for N8N to respond

6. Check terminal logs:
   ```
   🚀 Sending to N8N webhook: {...}
   ✅ N8N response received: { status: 'finished', callsMade: 5 }
   ✅ Session updated with completion data
   ```

7. Dashboard shows completion message

### Test N8N Workflow

**Option 1: Use N8N Test Button**
- Click "Test Workflow" in N8N
- Use sample data:
  ```json
  {
    "sessionId": "test-123",
    "dailyCallLimit": 5
  }
  ```

**Option 2: Send Real Request**
```bash
curl -X POST https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137 \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "dailyCallLimit": 10,
    "userId": "test-user"
  }'
```

---

## 🚨 Important Considerations

### Timeout Handling

If N8N takes a long time (e.g., 100 calls = 10 minutes):

**Problem:** HTTP requests may timeout

**Solutions:**

1. **Process Faster** (Recommended)
   - Make calls in parallel
   - Optimize your workflow
   - Target: < 2 minutes total

2. **Break Into Batches**
   - Process 10 calls at a time
   - Return quickly with "in_progress"
   - Use polling or separate webhooks

3. **Add Timeout Handling**
   - Set reasonable limits
   - Show progress to user
   - Handle partial completions

### Progress Updates

For long-running processes, consider:

```javascript
// In N8N loop, send progress updates
// (requires separate webhook endpoint)
if (callsMade % 10 === 0) {
  // Update progress every 10 calls
  fetch('https://your-app.com/api/ai-session/progress', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: sessionId,
      progress: callsMade
    })
  });
}
```

---

## 📊 Dashboard Behavior

### While Waiting for N8N:
```
🔄 Starting AI session...
(Loading spinner)
```

### After N8N Responds - Success:
```
✅ AI session completed! 98 calls made.
(Auto-refreshes dashboard)
```

### After N8N Responds - Error:
```
❌ Error: Failed to complete calls
```

---

## 🔍 Debugging

### Check N8N Execution Logs

1. Go to N8N executions tab
2. Find your workflow run
3. Check each node's output
4. Verify "Respond to Webhook" sent data

### Check Dashboard Terminal

```bash
# You'll see:
🚀 Sending to N8N webhook: { sessionId: 'abc', dailyCallLimit: 100 }

# Wait for N8N to process...

# Then:
✅ N8N response received: { status: 'finished', callsMade: 98 }
✅ Session updated with completion data
```

### Common Issues

#### ❌ Dashboard shows "Request timeout"
- N8N is taking too long
- Optimize your workflow
- Consider async processing

#### ❌ Session stays "active" 
- N8N didn't respond with `status: "finished"`
- Check N8N "Respond to Webhook" node
- Verify response format

#### ❌ "callsMade" is 0
- N8N didn't send `callsMade` field
- Check your expression in response
- Make sure you're counting correctly

---

## ✅ Checklist

### N8N Setup:
- [ ] Webhook trigger URL is correct
- [ ] Response mode is "Wait for response"
- [ ] You're saving sessionId from webhook
- [ ] You're using dailyCallLimit to control calls
- [ ] You're counting calls made
- [ ] "Respond to Webhook" is the LAST node
- [ ] Response includes `status: "finished"`
- [ ] Response includes `callsMade` number
- [ ] Tested with small limit (5 calls)

### Dashboard Setup:
- [ ] Environment variable set correctly
- [ ] Start session works
- [ ] Terminal shows N8N request sent
- [ ] Terminal shows N8N response received
- [ ] Dashboard updates after completion
- [ ] Session status becomes "stopped"

---

## 🎯 Quick Reference

**Dashboard sends to N8N:**
```
POST https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
Body: { sessionId, dailyCallLimit, ... }
```

**N8N responds with:**
```json
{
  "status": "finished",
  "callsMade": 98
}
```

**Dashboard automatically:**
- Updates session to "stopped"
- Records calls_made_today
- Shows "AI System Idle"

---

**Perfect! Your dashboard now waits for N8N to finish and updates automatically!** 🚀

