# 🔐 Admin URLs - Hidden Access

These pages are not shown in navigation but are still accessible via direct URL.

---

## 🧪 Testing & Admin Page

**Direct URL:**
```
http://localhost:3000/dashboard/settings/testing
```

**Or in production:**
```
https://your-domain.com/dashboard/settings/testing
```

**What it does:**
- Generate test call data
- Populate dashboard with sample calls
- Test different outcomes (booked, not interested, callback, transfer)
- Useful for development and demos

---

## 📊 Debug Pages

### **Database Debug View**
```
http://localhost:3000/dashboard/api-test
```

**What it shows:**
- Raw database data
- Current call counts
- Breakdown by outcome
- Last 20 calls with full details
- Timestamp to verify no caching

---

## 🎯 Quick Access Bookmarks

Save these for easy access:

1. **Testing Page:** `http://localhost:3000/dashboard/settings/testing`
2. **Debug View:** `http://localhost:3000/dashboard/api-test`
3. **Main Dashboard:** `http://localhost:3000/dashboard`
4. **Activity Logs:** `http://localhost:3000/dashboard/activity-logs`
5. **AI Control:** `http://localhost:3000/dashboard/ai-control`

---

## 🔒 Security Note

These pages are still protected by authentication - users must be logged in to access them. They're just hidden from the UI navigation.

**Before production:**
- Consider removing the testing page entirely
- Or add role-based access control to restrict to admin users only

---

## 💡 Pro Tip

You can still navigate to the testing page even though the button is hidden. Just type the URL directly in your browser or bookmark it! 🚀

