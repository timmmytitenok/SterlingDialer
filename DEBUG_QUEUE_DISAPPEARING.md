# 🐛 Fix: Queue Number Disappearing After 2nd Loop

## The Problem

Queue shows a number, then after the 2nd loop iteration it disappears or goes to 0.

---

## 🔍 **Most Likely Cause:**

Your N8N expression for `queueRemaining` is calculating **wrong** or becoming **negative/NaN**.

---

## ✅ **Fix: Correct Expression**

### **In N8N HTTP Request Node:**

**For `queueRemaining` field, use this EXACT expression:**

```
={{ $json.dailyCallLimit - $itemIndex - 1 }}
```

**Important:**
- Use `$itemIndex` (NOT `$item(0).$itemIndex`)
- Make sure you're INSIDE a loop node
- The `-1` is important (because index starts at 0)

---

## 🧪 **Test Your Expression in N8N:**

### **1. Add a Code Node Before HTTP Request**

Add this to debug what's being calculated:

```javascript
const dailyLimit = $input.item.json.dailyCallLimit;
const currentIndex = $itemIndex;
const remaining = dailyLimit - currentIndex - 1;

console.log('Daily Limit:', dailyLimit);
console.log('Current Index:', currentIndex);
console.log('Queue Remaining:', remaining);

return {
  userId: $input.item.json.userId,
  queueRemaining: remaining
};
```

This will show you in N8N execution logs what values are being calculated!

---

## 🎯 **Common Mistakes:**

### ❌ **Wrong Expression:**
```
={{ $json.dailyCallLimit - $item(0).$itemIndex - 1 }}
```
**Problem:** `$item(0)` doesn't work in simple loops

### ❌ **Wrong Expression:**
```
={{ dailyCallLimit - $itemIndex - 1 }}
```
**Problem:** Missing `$json.` before dailyCallLimit

### ✅ **Correct Expression:**
```
={{ $json.dailyCallLimit - $itemIndex - 1 }}
```

---

## 📊 **What Should Happen:**

If dailyCallLimit = 10:

| Loop # | $itemIndex | Calculation | Queue Remaining |
|--------|-----------|-------------|-----------------|
| 1st    | 0         | 10 - 0 - 1  | 9              |
| 2nd    | 1         | 10 - 1 - 1  | 8              |
| 3rd    | 2         | 10 - 2 - 1  | 7              |
| ...    | ...       | ...         | ...            |
| 10th   | 9         | 10 - 9 - 1  | 0              |

---

## 🔍 **Check Your App Terminal:**

When N8N calls the endpoint, you should see:

```
📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 19 }
📊 Queue value type: number, value: 19
✅ Queue updated successfully to 19

📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 18 }
📊 Queue value type: number, value: 18
✅ Queue updated successfully to 18
```

**If you see:**
```
📦 Received body: { userId: '...', queueRemaining: NaN }
```
→ Your expression is wrong!

**If you see:**
```
📦 Received body: { userId: '...', queueRemaining: -5 }
```
→ Your calculation is going negative!

---

## 🛠️ **Alternative: Simple Counter**

### **Easier Method (If expressions are confusing):**

**Instead of calculating, just pass a simple counter:**

**In your loop, track a variable:**
1. Start: `callsRemaining = dailyCallLimit`
2. After each call: `callsRemaining = callsRemaining - 1`
3. Send: `{ queueRemaining: callsRemaining }`

**This is more reliable!**

---

## 🎯 **Simplest Test:**

### **In N8N HTTP Request:**

**Set queueRemaining to different numbers manually and test:**

**Test 1:** `queueRemaining` = `19` → Dashboard shows 19 ✅
**Test 2:** `queueRemaining` = `15` → Dashboard shows 15 ✅
**Test 3:** `queueRemaining` = `5` → Dashboard shows 5 ✅

Once manual numbers work, THEN add the expression!

---

## 📝 **Copy-Paste Ready:**

### **HTTP Request Body (Fields Below):**

**Field: userId**
- Type: String
- Value: (click `=`) `{{ $json.userId }}`

**Field: queueRemaining**
- Type: Number
- Value: (click `=`) `={{ $json.dailyCallLimit - $itemIndex - 1 }}`

### **Respond to Webhook Body (Raw JSON):**
```json
{"status":"finished","callsMade":={{ $json.dailyCallLimit }}}
```

---

## 🔍 **What to Watch:**

Run your N8N workflow and watch your **app terminal**.

You should see **multiple** update calls:
```
📨 Update queue endpoint called (Loop 1)
📊 Queue value: 19

📨 Update queue endpoint called (Loop 2)
📊 Queue value: 18

📨 Update queue endpoint called (Loop 3)
📊 Queue value: 17
```

**If you only see ONE call** → Your loop isn't working  
**If you see negative numbers** → Expression is wrong  
**If you see NaN** → Variable not accessible  

---

**Check your terminal logs and tell me what you see after running N8N!** 🔍

