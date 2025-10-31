# N8N Webhook Payload Documentation

## Start AI Session Webhook

When a user clicks "Start AI Session", the following payload is sent to your N8N webhook.

### Webhook URL
```
https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

### Request Details
- **Method**: `POST`
- **Content-Type**: `application/json`

### Payload Structure

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "userEmail": "user@example.com",
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "dailyCallLimit": 400,
  "callsMadeToday": 0,
  "sessionStatus": "active",
  "startedAt": "2024-01-15T10:30:00.000Z",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `userId` | UUID | Supabase user ID |
| `userEmail` | String | User's email address |
| `sessionId` | UUID | Unique ID for this AI session |
| `dailyCallLimit` | Integer | Maximum calls per day (set by user, default: 400) |
| `callsMadeToday` | Integer | Calls already made today (starts at 0) |
| `sessionStatus` | String | Always "active" when starting |
| `startedAt` | ISO 8601 | When the session was created |
| `timestamp` | ISO 8601 | Current timestamp |

### Example N8N Workflow

You can access these values in N8N using:

```javascript
// Get daily call limit
const dailyLimit = $json.dailyCallLimit;

// Get user info
const userId = $json.userId;
const userEmail = $json.userEmail;

// Get session info
const sessionId = $json.sessionId;
```

### Testing

To test the webhook:

1. Start your dev server: `npm run dev`
2. Log in to the dashboard
3. Go to AI Control Panel
4. Set a daily call limit (e.g., 100)
5. Click "Start AI Session"
6. Check your terminal for logs:
   ```
   🚀 Sending to N8N webhook: { userId: '...', dailyCallLimit: 100, ... }
   ✅ N8N webhook triggered successfully
   ```

### Error Handling

- If the webhook fails, the AI session is **still created** in the database
- Webhook errors are logged but don't prevent session creation
- You'll see error logs in the terminal if webhook fails

### Common Use Cases in N8N

#### 1. Start Calling X Leads Per Day
```javascript
// In your N8N workflow
const leadsToCall = $json.dailyCallLimit;
// Use this to limit how many leads to process
```

#### 2. Track User Sessions
```javascript
// Store session info
const session = {
  id: $json.sessionId,
  user: $json.userEmail,
  limit: $json.dailyCallLimit,
  started: $json.startedAt
};
```

#### 3. Send Notifications
```javascript
// When AI starts
const message = `AI calling started for ${$json.userEmail} with limit of ${$json.dailyCallLimit} calls`;
```

### Debugging

Check terminal logs when starting a session:
```bash
npm run dev

# When you click "Start AI Session", you'll see:
# 🚀 Sending to N8N webhook: {...}
# ✅ N8N webhook triggered successfully
# OR
# ❌ Webhook error: [error details]
```

### Environment Variable

Make sure this is set in your `.env.local`:
```env
N8N_WEBHOOK_START_DIAL=https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

---

## Summary

✅ **Daily Call Limit** is sent to N8N as `dailyCallLimit`  
✅ **User information** included (userId, email)  
✅ **Session tracking** with sessionId  
✅ **Timestamps** for scheduling  
✅ **Status** for workflow logic  
✅ **Error handling** - won't break if webhook fails  

Your N8N workflow will receive all the data it needs to manage AI calling sessions! 🚀

