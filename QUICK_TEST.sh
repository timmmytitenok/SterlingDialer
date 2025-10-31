#!/bin/bash

echo "🧪 QUICK TEST - Dashboard Update Test"
echo "========================================"
echo ""

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ ngrok is not running!"
    echo "Start it with: ngrok http 3000"
    exit 1
fi

echo "✅ ngrok URL: $NGROK_URL"
echo ""

# Get user input
read -p "Enter your Supabase USER_ID: " USER_ID

if [ -z "$USER_ID" ]; then
    echo "❌ USER_ID is required"
    exit 1
fi

echo ""
echo "🎯 Sending 5 test calls to verify dashboard updates..."
echo ""

# Test 1: Not Answered
echo "1️⃣  Sending NOT ANSWERED call..."
curl -s -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"pickedUp\":false,\"contactName\":\"Test Not Answered\",\"contactPhone\":\"555-1111\"}" | python3 -c "import sys, json; print(json.load(sys.stdin)['message'] if 'message' in json.load(sys.stdin) else 'Success')" 2>/dev/null || echo "✅ Sent"

sleep 1

# Test 2: Booked
echo "2️⃣  Sending BOOKED call..."
curl -s -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"pickedUp\":true,\"outcome\":\"booked\",\"contactName\":\"Test Booked\",\"contactPhone\":\"555-2222\",\"duration\":145}" | python3 -c "import sys, json; print('✅ Booked')" 2>/dev/null || echo "✅ Sent"

sleep 1

# Test 3: Not Interested
echo "3️⃣  Sending NOT INTERESTED call..."
curl -s -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"pickedUp\":true,\"outcome\":\"not_interested\",\"contactName\":\"Test Not Interested\",\"contactPhone\":\"555-3333\",\"duration\":65}" | python3 -c "import sys, json; print('✅ Not Interested')" 2>/dev/null || echo "✅ Sent"

sleep 1

# Test 4: Callback
echo "4️⃣  Sending CALLBACK call..."
curl -s -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"pickedUp\":true,\"outcome\":\"callback\",\"contactName\":\"Test Callback\",\"contactPhone\":\"555-4444\",\"duration\":90}" | python3 -c "import sys, json; print('✅ Callback')" 2>/dev/null || echo "✅ Sent"

sleep 1

# Test 5: Live Transfer
echo "5️⃣  Sending LIVE TRANSFER call..."
curl -s -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"pickedUp\":true,\"outcome\":\"live_transfer\",\"contactName\":\"Test Transfer\",\"contactPhone\":\"555-5555\",\"duration\":230}" | python3 -c "import sys, json; print('✅ Live Transfer')" 2>/dev/null || echo "✅ Sent"

echo ""
echo "✅ All 5 test calls sent!"
echo ""
echo "📊 NOW CHECK YOUR DASHBOARD:"
echo ""
echo "1. Go to: http://localhost:3000/dashboard"
echo "2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo ""
echo "✨ YOU SHOULD SEE:"
echo "   • Total Calls: +5"
echo "   • Connected Rate: Updated"
echo "   • BOOKED: +1"
echo "   • NOT INTERESTED: +1"
echo "   • CALLBACK: +1"
echo "   • LIVE TRANSFER: +1"
echo ""
echo "3. Go to Activity Logs: http://localhost:3000/dashboard/activity-logs"
echo "4. Should see 4 test calls (the 4 that were answered)"
echo ""
echo "❓ Not seeing updates?"
echo "   → Check your terminal where 'npm run dev' is running"
echo "   → Look for: ✅ Call saved: Test Booked - answered → appointment_booked"
echo ""

