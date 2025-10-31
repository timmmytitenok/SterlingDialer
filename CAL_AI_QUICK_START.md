# 🚀 Cal.ai Quick Start - Do This Now!

## ⚡ 5-Minute Setup

### **Step 1: Get Your User ID** (2 min)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **Authentication** → **Users**
3. **Copy your user UUID** (looks like: `a1b2c3d4-e5f6-...`)

---

### **Step 2: Add to Environment** (1 min)

1. Open `.env.local` file in your project root
2. Add this line:

```bash
CAL_AI_USER_ID=paste-your-user-id-here
```

3. Save and **restart your dev server**

**Don't have .env.local?** Create it in your project root folder!

---

### **Step 3: Start ngrok** (1 min)

In a new terminal:
```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

---

### **Step 4: Configure Cal.ai** (1 min)

In Cal.ai webhook settings (the screen you showed me):

1. **Subscriber URL:**
   ```
   https://your-ngrok-url.ngrok.io/api/appointments/cal-webhook
   ```

2. **Enable Webhook:** Turn toggle **ON**

3. **Event Triggers:** Keep **"Booking Created"** selected

4. **Secret:** Leave blank

5. **Payload Template:** Select **"Default"**

6. Click **"Ping test"** to verify

7. Click **"Create Webhook"**

---

### **Step 5: Test It!** (30 sec)

1. Book a test meeting on your Cal.ai link
2. Check your terminal - you'll see:
   ```
   📅 Cal.ai webhook received
   ✅ Appointment created successfully!
   ```
3. Check your dashboard - appointment is there! 🎉

---

## ✅ Done!

Your Cal.ai bookings now automatically appear on your dashboard!

**See full details:** Read `CAL_AI_SETUP_GUIDE.md`

---

## 🆘 Troubleshooting

**Error: "Missing user_id"**
- Add `CAL_AI_USER_ID` to `.env.local`
- Restart dev server

**No logs appearing?**
- Check ngrok is running
- Verify webhook URL is correct
- Try ping test first

**Appointment not showing?**
- Refresh dashboard page
- Check terminal for errors
- Verify user_id is correct

