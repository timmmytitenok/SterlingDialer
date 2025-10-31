# Complete AI Session Flow

This document explains the complete flow using N8N's **"Respond to Webhook"** feature.

**Key Point:** N8N responds directly to the original request, not via a separate webhook!

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER STARTS AI SESSION                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Dashboard: User sets daily limit (e.g., 100 calls)          │
│ User clicks "Start AI Session"                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND CREATES SESSION                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                POST /api/ai-session/start
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ - Create session in database (status: "active")             │
│ - Session ID generated: abc-123                              │
│ - Daily limit: 100                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. WEBHOOK SENT TO N8N (START)                              │
└─────────────────────────────────────────────────────────────┘
                            │
        POST https://timmmytitenok.app.n8n.cloud/webhook/...
                            │
                 Payload: {
                   sessionId: "abc-123",
                   dailyCallLimit: 100,
                   userEmail: "user@example.com"
                 }
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. N8N PROCESSES CALLS                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ N8N Workflow:                                                │
│ - Receives sessionId: "abc-123"                             │
│ - Receives dailyCallLimit: 100                              │
│ - Loads leads from database                                 │
│ - Makes calls (loop through leads)                          │
│ - Tracks: callsMade counter                                 │
│ - Continues until limit reached or list exhausted           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. N8N RESPONDS TO ORIGINAL REQUEST                         │
└─────────────────────────────────────────────────────────────┘
                            │
          Response back to the waiting HTTP request
                            │
                 Response: {
                   status: "finished",
                   callsMade: 100
                 }
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. BACKEND RECEIVES RESPONSE & UPDATES SESSION              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ - Update session status: "stopped"                          │
│ - Set stopped_at: timestamp                                 │
│ - Update calls_made_today: 100                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. USER SEES UPDATED DASHBOARD                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Dashboard shows:                                             │
│ ⚪ AI System Idle                                            │
│ Session completed: 100 calls made                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📤 Step 1: Start Webhook (Dashboard → N8N)

### Your App Sends:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "userEmail": "user@example.com",
  "sessionId": "abc-123-def-456",
  "dailyCallLimit": 100,
  "callsMadeToday": 0,
  "sessionStatus": "active",
  "startedAt": "2024-01-15T10:00:00Z",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### N8N Receives:
- Store `sessionId` for later (you'll need it!)
- Use `dailyCallLimit` to control how many calls to make
- Start your calling workflow

---

## 📥 Step 2: Completion Webhook (N8N → Dashboard)

### N8N Must Send:
```json
{
  "sessionId": "abc-123-def-456",
  "status": "finished",
  "callsMade": 100,
  "message": "Completed all calls"
}
```

**Important:**
- ✅ Use the SAME `sessionId` you received in step 1
- ✅ Set `status` to "finished" or "completed"
- ✅ Include `callsMade` so dashboard knows the count

### Endpoint:
```
POST https://your-app.com/api/ai-session/webhook
```

---

## 🔧 N8N Setup Instructions

### Node 1: Webhook Trigger (Start)
This already exists - it receives the start request.

### Node 2-X: Your Calling Logic
Do whatever you need to process calls.

### Final Node: HTTP Request (Completion)

**Settings:**
- **Node Type**: HTTP Request
- **Method**: POST
- **URL**: `https://your-app.vercel.app/api/ai-session/webhook`
  - For local testing: `http://localhost:3000/api/ai-session/webhook`
  - For ngrok: `https://abc123.ngrok.io/api/ai-session/webhook`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "sessionId": "{{ $json.sessionId }}",
  "status": "finished",
  "callsMade": {{ $('Count Calls').itemMatching(0).$json.count }},
  "message": "AI calling completed successfully"
}
```

**Notes:**
- Replace `$('Count Calls')` with your actual node name that tracks calls
- Use N8N expressions to get the sessionId from the original webhook
- Adjust `callsMade` based on how you track it in your workflow

---

## 🧪 Testing Locally

### Step 1: Start a Session

1. Open your dashboard
2. Go to AI Control Panel
3. Set daily limit to 10
4. Click "Start AI Session"
5. Copy the session ID from terminal logs

### Step 2: Simulate N8N Response

```bash
# Use the test script
./test-webhook.sh <session-id> <calls-made>

# Example:
./test-webhook.sh abc-123-def-456 10
```

### Step 3: Verify

1. Check terminal for success logs
2. Refresh dashboard
3. AI status should show "Idle"
4. Session should be stopped in database

---

## 🌐 Production Setup

### Option 1: Deployed App (Vercel)

**N8N Webhook URL:**
```
https://your-app.vercel.app/api/ai-session/webhook
```

### Option 2: Local Development with ngrok

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
ngrok http 3000
```

**N8N Webhook URL:**
```
https://abc123.ngrok.io/api/ai-session/webhook
```

---

## 🔍 Debugging

### Check Terminal Logs

When webhook is received, you'll see:
```
📨 Received webhook from N8N: { sessionId: '...', status: 'finished', callsMade: 100 }
✅ AI session updated: { id: '...', status: 'stopped' }
```

### Common Issues

#### ❌ "sessionId is required"
- N8N didn't send sessionId
- Check your N8N HTTP Request body

#### ❌ "Session not found"
- SessionId is wrong
- Session was already stopped
- Check the sessionId matches

#### ❌ Webhook not reaching app
- Check URL is correct
- For local: use ngrok
- Check firewall settings

### Test Endpoint

Visit in browser to test:
```
http://localhost:3000/api/ai-session/webhook
```

Should show:
```json
{
  "message": "AI Session Webhook Endpoint",
  "method": "POST",
  "expectedPayload": { ... }
}
```

---

## 📊 Database Changes

### Before Completion:
```sql
SELECT * FROM ai_sessions WHERE id = 'abc-123';

-- Result:
-- status: 'active'
-- calls_made_today: 0
-- stopped_at: null
```

### After Completion:
```sql
SELECT * FROM ai_sessions WHERE id = 'abc-123';

-- Result:
-- status: 'stopped'
-- calls_made_today: 100
-- stopped_at: '2024-01-15T15:30:00Z'
```

---

## 🎯 Summary Checklist

### Dashboard (Already Done ✅)
- [x] Start session creates record
- [x] Sends dailyCallLimit to N8N
- [x] Shows live status
- [x] Receives completion webhook
- [x] Updates UI when stopped

### N8N (You Need To Do 📝)
- [ ] Save sessionId from start webhook
- [ ] Use dailyCallLimit to control calls
- [ ] Track callsMade during workflow
- [ ] Send completion webhook at end
- [ ] Include sessionId in completion
- [ ] Test with real session

---

## 💡 Pro Tips

1. **Always save the sessionId** - You'll need it for completion
2. **Count your calls** - Dashboard wants to know the total
3. **Test locally first** - Use the test script before production
4. **Check logs** - Terminal shows exactly what's happening
5. **Handle errors** - N8N should catch issues gracefully

---

**Questions?** Check `N8N_WEBHOOK_RESPONSE.md` for detailed API docs! 📚

