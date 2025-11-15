# 🔄 Manual Sync Test - Get Your Leads Now!

Your Google Sheet looks **PERFECT** now! ✅

Here's exactly what to do to get those 24+ leads imported:

---

## 🚀 Step-by-Step Instructions:

### 1. Make Sure Dev Server is Running
Open terminal and check if you see:
```
○ Compiling /dashboard/leads ...
✓ Compiled in XXXms
```

If not running:
```bash
cd /Users/timothytitenok/life-insurance
npm run dev
```

---

### 2. Open Your Browser
Go to: **http://localhost:3000/dashboard/leads**

---

### 3. You Should See:
- ✅ "Connected Sheet: My Leads" (or similar)
- ✅ A green **"🔄 Sync Leads"** button
- ✅ Last synced time (if you synced before)

---

### 4. Click "🔄 Sync Leads"
Just click that button!

---

### 5. Watch for Success Message
You should see:
```
✅ Sync complete! 24 new leads imported, 0 leads updated.
```

---

### 6. Check the Tabs
After sync, you should see:
- **All Leads (24)** ← Click this tab
- **New (24)**
- Other tabs with counts

---

### 7. See Your Leads!
The table should show:
- Camilla (16149403824)
- Timmy (16142305525)
- Jessie (14013327665)
- And all the others!

---

## 🐛 Still Not Working? Try This:

### Option A: Hard Refresh
1. Hold **Shift** and click the **Refresh** button (or Ctrl+Shift+R / Cmd+Shift+R)
2. This clears the cache

### Option B: Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Click "Sync Leads"
4. Look for any RED error messages
5. Screenshot and send them to me

### Option C: Restart Everything
```bash
# Stop the server (Ctrl+C in terminal)
# Then:
npm run dev
```

Then go to `/dashboard/leads` and try sync again

---

## 📋 Verification Checklist

Before syncing, make sure:
- ✅ Dev server is running (terminal shows no errors)
- ✅ You're on `/dashboard/leads` page
- ✅ You see "Connected Sheet" message
- ✅ Your Google Sheet has headers in Row 1: Name, Phone, Email, Age, State, Status
- ✅ Sheet is shared with: `sterlingdailer@sterlingdialer.iam.gserviceaccount.com`

---

## 🎯 What Happens When You Click Sync:

1. Button text changes to "🔄 Syncing..."
2. After a few seconds (2-5 sec)
3. Success message appears
4. Tab counts update
5. Leads appear in table!

---

## 💡 Common Issues:

**Issue:** Button does nothing
- **Fix:** Check browser console (F12) for errors

**Issue:** "Permission denied" error
- **Fix:** Make sure sheet is shared with the service account email as **Editor**

**Issue:** "No Google Sheet connected"
- **Fix:** You need to connect the sheet first (enter URL, click Connect)

**Issue:** Sync button not visible
- **Fix:** Refresh the page, make sure you're logged in

---

## 🔍 Still Stuck?

If the sync button doesn't work:

1. Open browser console (F12 → Console)
2. Click "Sync Leads"
3. Screenshot any errors
4. Share with me

OR

Go to: **http://localhost:3000/dashboard/leads/debug**
- This page shows EXACTLY what's wrong
- Screenshot it and share

---

## ✅ Expected Result:

After clicking sync, you should see all 24 leads:
- Camilla (OH, 20)
- Timmy (OH, 17/20)
- Jessie (ME, 49)
- Terry (ME, 80)
- William (CA, 84)
- Kirk (IL, 66)
- And 18 more!

All with status "New" (0 → means new/uncontacted)

---

**Your sheet is perfect now! Just need to click that sync button!** 🚀

