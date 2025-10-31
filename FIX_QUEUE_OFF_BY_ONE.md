# 🔧 Fix: Queue Stops at 1 (Off-by-One Error)

## The Problem

If you start with 4, queue shows: 4 → 3 → stops
If you start with 6, queue shows: 6 → 5 → stops

**Should go all the way to 0!**

---

## ✅ **The Fix: Adjust Your Expression**

The issue is your HTTP Request is probably being called **BEFORE** the call, not **AFTER**.

### **In N8N HTTP Request Node:**

**Change `queueRemaining` expression to:**

```
={{ $json.dailyCallLimit - $itemIndex }}
```

**Remove the `-1` !**

---

## 🎯 **Why This Works:**

**If dailyCallLimit = 4:**

| Loop # | $itemIndex | Old Calc (wrong) | New Calc (right) | Queue Shows |
|--------|-----------|------------------|------------------|-------------|
| Start  | -         | -                | -                | 4           |
| 1st    | 0         | 4 - 0 - 1 = 3    | 4 - 0 = 4 ❌     | -           |
| 1st    | 0         | -                | After call: 4-1=3| 3 ✅        |

**Wait, let me rethink...**

Actually, the issue depends on WHEN you call the HTTP Request:

### **If HTTP Request is AFTER each call:**
```
={{ $itemIndex }}
```
(Shows how many completed)

### **If HTTP Request is BEFORE each call:**
```
={{ $json.dailyCallLimit - $itemIndex - 1 }}
```
(Shows how many remaining)

---

## 🔄 **Better Solution: Calculate AFTER Call**

### **Change your expression to:**

```
={{ $json.dailyCallLimit - ($itemIndex + 1) }}
```

**This means:**
- After 1st call (index 0): 4 - (0 + 1) = 3 ✅
- After 2nd call (index 1): 4 - (1 + 1) = 2 ✅
- After 3rd call (index 2): 4 - (2 + 1) = 1 ✅
- After 4th call (index 3): 4 - (3 + 1) = 0 ✅

---

## 🎯 **Copy-Paste Ready:**

### **HTTP Request - queueRemaining field:**

**Use this expression:**
```
={{ $json.dailyCallLimit - ($itemIndex + 1) }}
```

---

## 🧪 **Test It:**

**Set dailyCallLimit to 4, run workflow:**

**You should see in terminal:**
```
📦 queueRemaining: 3  (after 1st call)
📦 queueRemaining: 2  (after 2nd call)
📦 queueRemaining: 1  (after 3rd call)
📦 queueRemaining: 0  (after 4th call)
```

**Dashboard queue should show:** 4 → 3 → 2 → 1 → 0 ✅

---

## 🎨 **Alternative: Manual Counter**

If expressions are confusing, use a counter variable:

**1. Before loop, set:**
```javascript
callsRemaining = $json.dailyCallLimit
```

**2. After each call:**
```javascript
callsRemaining = callsRemaining - 1
```

**3. In HTTP Request:**
```
queueRemaining = {{ $json.callsRemaining }}
```

This is more explicit and easier to debug!

---

## ✅ **Summary:**

**Change the expression from:**
```
={{ $json.dailyCallLimit - $itemIndex - 1 }}
```

**To:**
```
={{ $json.dailyCallLimit - ($itemIndex + 1) }}
```

**This will make queue count down properly: 4 → 3 → 2 → 1 → 0** ✅

