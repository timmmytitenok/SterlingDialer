# 🐛 Debug: Queue Not Reaching 0

## Let's Figure Out What's Wrong

---

## 🔍 **Step 1: Check Your Terminal Logs**

When you run N8N, your app terminal should show **multiple** queue updates:

**Expected (if limit = 4):**
```
📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 3 }
✅ Queue updated successfully to 3

📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 2 }
✅ Queue updated successfully to 2

📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 1 }
✅ Queue updated successfully to 1

📨 Update queue endpoint called
📦 Received body: { userId: '...', queueRemaining: 0 }
✅ Queue updated successfully to 0
```

**What do YOU see?**

---

## 🎯 **Question 1: How Many Times is HTTP Request Called?**

If limit = 4, the HTTP Request should be called **4 times**.

**Check N8N execution:**
1. Go to Executions tab
2. Click on your latest execution
3. Click on the HTTP Request node
4. How many times did it run?

**If it only runs 3 times instead of 4** → Loop is stopping early!

---

## 🎯 **Question 2: What Values Are Being Sent?**

Look at your terminal logs.

**Do you see:**
```
queueRemaining: 3
queueRemaining: 2
queueRemaining: 1
```

**Or do you see:**
```
queueRemaining: 3
queueRemaining: NaN
```

**Or something else?**

---

## 🔧 **Common N8N Loop Issues:**

### **Issue 1: Loop Stops Early**

**Check your loop node settings:**
- Max iterations should be set to `{{ $json.dailyCallLimit }}`
- OR no limit if using "Split in Batches"

### **Issue 2: HTTP Request Not in Loop**

**Make sure:**
- HTTP Request node is INSIDE the loop
- It should be indented/nested under the loop node

### **Issue 3: Wrong Expression**

**Try these expressions (test one at a time):**

**Option A:**
```
={{ $json.dailyCallLimit - ($itemIndex + 1) }}
```

**Option B:**
```
={{ $('Webhook').item.json.dailyCallLimit - $itemIndex - 1 }}
```

**Option C (if using Set node):**
```
={{ $('Set').item.json.dailyCallLimit - $itemIndex - 1 }}
```

---

## 🎨 **Simplest Solution:**

Instead of using complex expressions, use a **Code node** to calculate:

### **Add Code Node Before HTTP Request:**

```javascript
// Get values
const dailyLimit = $input.item.json.dailyCallLimit;
const currentIndex = $itemIndex;

// Calculate remaining AFTER this call
const remaining = dailyLimit - currentIndex - 1;

console.log(`Loop ${currentIndex + 1}/${dailyLimit}: ${remaining} remaining`);

return {
  userId: $input.item.json.userId,
  queueRemaining: remaining
};
```

Then in HTTP Request, just use:
```
userId: {{ $json.userId }}
queueRemaining: {{ $json.queueRemaining }}
```

**This is much more reliable!**

---

## 📋 **What to Tell Me:**

Look at your N8N execution and terminal, then answer:

1. **How many times does HTTP Request run?** (should equal dailyCallLimit)
2. **What queueRemaining values do you see in terminal?** (3, 2, 1, 0?)
3. **Does it reach 0 or stop at 1?**
4. **What loop type are you using?** (Split in Batches? Loop Over Items? Code loop?)

---

## 🎯 **Quick Fix:**

**Use this exact setup:**

**1. Your Loop Node:**
- Type: "Loop Over Items" or "Split in Batches"
- Items: Generate array of dailyCallLimit size

**2. HTTP Request (inside loop):**
- userId: `{{ $json.userId }}`
- queueRemaining: Start with `10` (fixed) to test

**3. See if it's called multiple times**

**4. Once that works, add the expression**

---

**Tell me what you see in your terminal when you run it!** 🔍

The logs will show EXACTLY what's being sent!

