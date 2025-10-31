# 📅 Cal.ai Integration Setup Guide

## Complete Step-by-Step Instructions

Follow these steps to connect Cal.ai bookings to your dashboard automatically!

---

## 🎯 What This Does

When someone books a meeting through your Cal.ai link:
1. Cal.ai sends a webhook to your app
2. Your app automatically creates the appointment in the database
3. Appointment appears on your dashboard calendar instantly! 🎉

---

## 📋 Step 1: Get Your User ID

**You need your user ID to link Cal.ai bookings to your account.**

### Option A: From Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"Authentication"** in sidebar
4. Click **"Users"** tab
5. Find your user and **copy the UUID**
6. It looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Option B: From Your App
1. Open your dashboard in browser
2. Open browser console (press F12)
3. Go to "Console" tab
4. Type: `document.cookie`
5. Look for your user ID in the output

---

## 🔐 Step 2: Add User ID to Environment Variables

1. Open your project in your code editor
2. Find the file: `.env.local` (in the root folder)
3. Add this line at the bottom:

```bash
# Cal.ai Integration - Your User ID
CAL_AI_USER_ID=paste-your-user-id-here
```

**Example:**
```bash
CAL_AI_USER_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

4. Save the file
5. **Restart your dev server** (Stop with Ctrl+C and run `npm run dev` again)

---

## 🌐 Step 3: Get Your Webhook URL

### For Local Testing (Development)

**You need ngrok to test locally:**

1. **Install ngrok** (if you don't have it):
   - Download from: https://ngrok.com/download
   - Or use: `brew install ngrok` (Mac)

2. **Start your app:**
   ```bash
   npm run dev
   ```

3. **In a NEW terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok output:
   ```
   Forwarding   https://abc123.ngrok.io -> http://localhost:3000
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                Copy this part!
   ```

5. **Your webhook URL is:**
   ```
   https://your-ngrok-url.ngrok.io/api/appointments/cal-webhook
   ```

### For Production (Deployed App)

**Your webhook URL is:**
```
https://sterlingdailer.com/api/appointments/cal-webhook
```

---

## 🎨 Step 4: Configure Cal.ai Webhook

**Now go to Cal.ai settings (you showed me this screen!):**

### **1. Subscriber URL**
Paste your webhook URL:
```
https://your-ngrok-url.ngrok.io/api/appointments/cal-webhook
```
OR for production:
```
https://sterlingdailer.com/api/appointments/cal-webhook
```

### **2. Enable Webhook**
- Click the toggle to turn it **ON** (should be black/active)

### **3. Event Triggers**
- Keep **"Booking Created"** selected ✅
- This is the event we want to capture!

### **4. Secret**
- Leave this **BLANK** for now
- You can add a secret later for extra security

### **5. Payload Template**
- Select **"Default"**
- This sends all the booking information we need

### **6. Test It!**
- Click the **"Ping test"** button
- Check your terminal/console for logs
- You should see: `📅 Cal.ai webhook received`

### **7. Create Webhook**
- Click the **"Create Webhook"** button at bottom
- Your webhook is now active! 🎉

---

## 🎤 Step 5: (Optional) Add Custom Booking Form Fields

**If you want to collect Age and State during booking:**

1. Go to your Cal.com Event Type settings
2. Click on your event type to edit it
3. Scroll to **"Booking Questions"**
4. Add these custom fields:

**Age Field:**
- Question: "What is your age?"
- Type: "Short Text" or "Number"
- Required: Optional (your choice)
- System name: `age`

**State Field:**
- Question: "What state do you live in?"
- Type: "Short Text" or "Dropdown"
- Required: Optional (your choice)
- System name: `state`

**Phone Field:**
- Question: "What is your phone number?"
- Type: "Phone"
- Required: Yes (recommended)
- System name: `phone`

5. Save your event type

**These fields will automatically be captured in the webhook!**

---

## 🧪 Step 6: Test Your Integration

### **Test 1: Check Endpoint**

1. Open browser and go to:
   ```
   http://localhost:3000/api/appointments/cal-webhook
   ```

2. You should see:
   ```json
   {
     "status": "ready",
     "endpoint": "/api/appointments/cal-webhook",
     "message": "Cal.ai webhook endpoint is active..."
   }
   ```

### **Test 2: Use Cal.ai Ping Test**

1. In Cal.ai webhook settings, click **"Ping test"**
2. Check your terminal/console
3. Look for these logs:
   ```
   📅 Cal.ai webhook received
   📦 Full Cal.ai Payload: {...}
   ```

### **Test 3: Create Real Booking**

1. Go to your Cal.ai booking link
2. Book a test meeting
3. Fill out the form (including phone, age, state if you added them)
4. Submit the booking
5. Check your terminal for:
   ```
   ✅ Appointment created successfully!
   ```
6. **Check your dashboard!** The appointment should appear! 🎉

---

## 🔍 Troubleshooting

### **Problem: "Missing user_id" Error**

**Solution:**
- Make sure you added `CAL_AI_USER_ID` to `.env.local`
- Restart your dev server after adding it
- Check the user ID is correct (no spaces, full UUID)

### **Problem: Terminal shows "Skipping event"**

**Solution:**
- Make sure "Booking Created" is selected in Cal.ai webhook settings
- The webhook only processes `BOOKING_CREATED` events

### **Problem: No logs appear**

**Solution:**
- Check your webhook URL is correct
- Make sure ngrok is running
- Verify the webhook is enabled (toggle is ON)
- Try the ping test first

### **Problem: Appointment not appearing on dashboard**

**Solution:**
- Check terminal for database errors
- Verify your user_id is correct
- Refresh the dashboard page
- Check the appointments page specifically

---

## 📊 What Gets Captured

From each Cal.ai booking, we capture:

✅ **Attendee Name** → `prospect_name`  
✅ **Phone Number** → `prospect_phone`  
✅ **Age** → `prospect_age` (if you added the field)  
✅ **State** → `prospect_state` (if you added the field)  
✅ **Meeting Time** → `scheduled_at`  
✅ **Meeting Title** → Saved in `notes`  
✅ **Email** → Saved in `notes` for reference  

**Status:** Automatically set to `scheduled`

---

## 🚀 Production Deployment

**When you deploy to production:**

1. Deploy your app to Vercel/Netlify/etc.
2. Add `CAL_AI_USER_ID` to your production environment variables
3. Update Cal.ai webhook URL to your production domain:
   ```
   https://sterlingdailer.com/api/appointments/cal-webhook
   ```
4. Test with a real booking!

---

## 🎯 Success Checklist

Before you're done, verify:

- [ ] Copied user ID from Supabase
- [ ] Added `CAL_AI_USER_ID` to `.env.local`
- [ ] Restarted dev server
- [ ] Started ngrok (for local testing)
- [ ] Added webhook URL in Cal.ai
- [ ] Enabled webhook toggle
- [ ] Selected "Booking Created" trigger
- [ ] Clicked "Create Webhook"
- [ ] Ran ping test (saw logs)
- [ ] Created test booking
- [ ] Appointment appeared on dashboard! 🎉

---

## 💡 Pro Tips

1. **Keep ngrok running** while testing locally
2. **Watch the terminal** - all webhook activity is logged
3. **Test with yourself first** - book a meeting to see it work
4. **Check the logs** - they show exactly what data Cal.ai sends
5. **Adjust field mappings** - if Cal.ai sends different field names

---

## 🆘 Need Help?

**Check your terminal logs!** They show:
- When webhooks are received
- What data is in the payload
- Any errors that occur
- Success confirmations

**Common Cal.ai field names:**
- `payload.startTime` - Meeting start time
- `payload.attendees[0].name` - Attendee name
- `payload.attendees[0].email` - Attendee email
- `payload.responses.phone` - Phone from form
- `payload.responses.age` - Age from form
- `payload.responses.state` - State from form

---

## ✨ You're Done!

Your Cal.ai bookings will now automatically appear on your dashboard!

**What happens now:**
1. Someone books via Cal.ai
2. Webhook fires instantly
3. Appointment created in database
4. Shows up on your calendar
5. You can mark it complete, sold, etc.

**Everything is automated!** 🎉

