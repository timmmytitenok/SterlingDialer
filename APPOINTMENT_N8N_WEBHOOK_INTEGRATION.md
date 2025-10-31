# 📞 Appointment Status → n8n Webhook Integration

## ✅ What's Implemented

Every time an appointment status changes, data is automatically sent to your n8n webhook!

**Webhook URL:** `https://timmmytitenok.app.n8n.cloud/webhook/167c711b-4cf9-46e7-a7cb-c37a4ef6f9f0`

---

## 🎯 Triggers - When Webhooks Are Sent

### 1️⃣ **Appointment Created** (`scheduled`)
**Endpoint:** `POST /api/appointments/create`

**Payload sent to n8n:**
```json
{
  "appointmentId": "uuid",
  "status": "scheduled",
  "phoneNumber": "+1234567890",
  "prospectName": "John Doe",
  "prospectAge": 45,
  "prospectState": "CA",
  "scheduledAt": "2024-10-28T14:30:00Z",
  "userId": "user-uuid",
  "timestamp": "2024-10-28T10:00:00Z"
}
```

---

### 2️⃣ **Appointment Completed** (`completed`)
**Endpoint:** `POST /api/appointments/complete`

**Payload sent to n8n:**
```json
{
  "appointmentId": "uuid",
  "status": "completed",
  "phoneNumber": "+1234567890",
  "prospectName": "John Doe",
  "userId": "user-uuid",
  "timestamp": "2024-10-28T10:00:00Z"
}
```

---

### 3️⃣ **Appointment No-Show** (`no_show`)
**Endpoint:** `POST /api/appointments/no-show`

**Payload sent to n8n:**
```json
{
  "appointmentId": "uuid",
  "status": "no_show",
  "phoneNumber": "+1234567890",
  "prospectName": "John Doe",
  "userId": "user-uuid",
  "timestamp": "2024-10-28T10:00:00Z"
}
```

---

### 4️⃣ **Appointment Sold** (`sold`)
**Endpoint:** `POST /api/appointments/sold`

**Payload sent to n8n:**
```json
{
  "appointmentId": "uuid",
  "status": "sold",
  "phoneNumber": "+1234567890",
  "prospectName": "John Doe",
  "monthlyPayment": 150,
  "annualPremium": 1800,
  "userId": "user-uuid",
  "timestamp": "2024-10-28T10:00:00Z"
}
```

---

### 5️⃣ **Appointment Rescheduled** (`rescheduled`)
**Endpoint:** `POST /api/appointments/reschedule`

**Payload sent to n8n:**
```json
{
  "appointmentId": "uuid",
  "status": "rescheduled",
  "phoneNumber": "+1234567890",
  "prospectName": "John Doe",
  "newScheduledAt": "2024-10-29T14:30:00Z",
  "userId": "user-uuid",
  "timestamp": "2024-10-28T10:00:00Z"
}
```

---

## 🔄 How It Works

1. User clicks appointment in dashboard
2. User selects status (Complete, No-Show, Sold, etc.)
3. **Status updated in database** ✅
4. **Webhook sent to n8n** ✅
5. **Even if webhook fails, appointment still updates** (non-blocking)
6. n8n receives the data and can process it

---

## 📊 n8n Workflow Setup

### Webhook Node Configuration

1. **Add Webhook node** in n8n
2. **URL:** Already set to your webhook URL
3. **Method:** POST
4. **Authentication:** None (or add if needed)

### Example n8n Flow

```
[Webhook Trigger]
   ↓
[Switch Node - Based on Status]
   ├── scheduled → [Send confirmation SMS/Email]
   ├── completed → [Update Google Sheets, Send thank you]
   ├── no_show → [Flag for follow-up]
   ├── sold → [Update CRM, Celebrate! 🎉]
   └── rescheduled → [Update calendar, Send reminder]
```

### Access Data in n8n

Use these expressions in your n8n nodes:

```javascript
// Status
{{ $json.status }}

// Phone Number
{{ $json.phoneNumber }}

// Prospect Name
{{ $json.prospectName }}

// Appointment ID
{{ $json.appointmentId }}

// User ID
{{ $json.userId }}

// For sold appointments
{{ $json.monthlyPayment }}
{{ $json.annualPremium }}

// For rescheduled appointments
{{ $json.newScheduledAt }}
```

---

## 🧪 Testing

### Test Each Status Change

1. **Create Appointment:**
   - Go to Appointments page
   - Create new appointment
   - Check n8n - should receive `"status": "scheduled"`

2. **Mark as Complete:**
   - Click on appointment
   - Click "Mark Complete"
   - Check n8n - should receive `"status": "completed"`

3. **Mark as No-Show:**
   - Click on appointment
   - Click "Mark No-Show"
   - Check n8n - should receive `"status": "no_show"`

4. **Mark as Sold:**
   - Click on appointment
   - Enter monthly payment
   - Click "Save"
   - Check n8n - should receive `"status": "sold"` with payment data

5. **Reschedule:**
   - Click on appointment
   - Select new date/time
   - Click "Reschedule"
   - Check n8n - should receive `"status": "rescheduled"`

---

## 📝 Server Logs

Watch your terminal for these logs:

```
📤 Sending appointment status to n8n webhook...
✅ Webhook sent successfully to n8n
```

Or if it fails (non-critical):
```
⚠️ Webhook failed but continuing: 500
⚠️ Webhook error (non-critical): Network error
```

**The appointment will update regardless of webhook success!**

---

## 🔧 Webhook Error Handling

### Non-Blocking Design
- Webhook failures **don't stop appointment updates**
- Errors are logged but not shown to users
- Appointments always save successfully

### Why?
- n8n might be down temporarily
- Network issues shouldn't break your app
- Users get immediate feedback
- n8n can be fixed later without data loss

---

## 💡 Example n8n Use Cases

### 1. **Send Follow-Up SMS After No-Show**
```
[Webhook] → [IF: status = no_show] → [Twilio SMS Node]
"Hi {{ $json.prospectName }}, we missed you! Call us to reschedule."
```

### 2. **Update Google Sheets with Sales**
```
[Webhook] → [IF: status = sold] → [Google Sheets - Append Row]
Row: [Date, Name, Phone, Monthly Payment, Annual Premium]
```

### 3. **Send Confirmation Emails**
```
[Webhook] → [IF: status = scheduled] → [Gmail Node]
"Your appointment is confirmed for {{ $json.scheduledAt }}"
```

### 4. **Slack Notifications for Sales**
```
[Webhook] → [IF: status = sold] → [Slack Node]
"🎉 New sale! {{ $json.prospectName }} - ${{ $json.annualPremium }}/year!"
```

---

## 📋 Data Fields Reference

| Field | Type | Available In | Description |
|-------|------|--------------|-------------|
| `appointmentId` | String (UUID) | All | Unique appointment ID |
| `status` | String | All | scheduled, completed, no_show, sold, rescheduled |
| `phoneNumber` | String | All | Prospect's phone (from appointment) |
| `prospectName` | String | All | Prospect's name |
| `userId` | String (UUID) | All | User who owns the appointment |
| `timestamp` | ISO Date | All | When status changed |
| `prospectAge` | Number | scheduled only | Prospect's age |
| `prospectState` | String | scheduled only | Prospect's state |
| `scheduledAt` | ISO Date | scheduled only | When appointment is scheduled |
| `monthlyPayment` | Number | sold only | Monthly premium amount |
| `annualPremium` | Number | sold only | Annual premium (monthly × 12) |
| `newScheduledAt` | ISO Date | rescheduled only | New appointment time |

---

## 🚀 Next Steps

1. **Set up n8n workflow** to receive webhook
2. **Test each status** (create, complete, no-show, sold, reschedule)
3. **Check n8n execution logs** to see data received
4. **Build your automation** (SMS, Sheets, CRM, etc.)

---

## 🔒 Security Notes

- Webhook has no authentication (add if needed)
- Sent from server-side (not exposed to client)
- Contains user data - keep webhook URL private
- Consider adding API key in headers if needed

### Add Authentication (Optional)

Update the webhook calls to include auth:

```typescript
headers: { 
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_SECRET_KEY'
}
```

Then configure n8n webhook to require this header.

---

**Your appointment status changes now sync to n8n in real-time!** 🎉

