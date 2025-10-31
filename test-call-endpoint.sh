#!/bin/bash

# Test script for /api/calls/update endpoint
# This will help diagnose if N8N requests are working

echo "🧪 Testing /api/calls/update endpoint"
echo "======================================"
echo ""

# Get current ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ ngrok is not running!"
    echo "Start ngrok with: ngrok http 3000"
    exit 1
fi

echo "✅ ngrok URL: $NGROK_URL"
echo ""

# Ask for user ID
echo "Enter your USER_ID (from Supabase):"
read USER_ID

if [ -z "$USER_ID" ]; then
    echo "❌ USER_ID is required"
    exit 1
fi

echo ""
echo "📞 Test 1: Call dialed but not answered"
echo "--------------------------------------"

curl -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"pickedUp\": false,
    \"contactName\": \"Test Not Answered\",
    \"contactPhone\": \"555-1111\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""
echo "📞 Test 2: Call answered - Booked"
echo "--------------------------------------"

curl -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"pickedUp\": true,
    \"outcome\": \"booked\",
    \"contactName\": \"Test Booked\",
    \"contactPhone\": \"555-2222\",
    \"duration\": 145
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""
echo "📞 Test 3: Call answered - Not Interested"
echo "--------------------------------------"

curl -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"pickedUp\": true,
    \"outcome\": \"not_interested\",
    \"contactName\": \"Test Not Interested\",
    \"contactPhone\": \"555-3333\",
    \"duration\": 65
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""
echo "📞 Test 4: Call answered - Callback"
echo "--------------------------------------"

curl -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"pickedUp\": true,
    \"outcome\": \"callback\",
    \"contactName\": \"Test Callback\",
    \"contactPhone\": \"555-4444\",
    \"duration\": 90
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""
echo "📞 Test 5: Call answered - Live Transfer"
echo "--------------------------------------"

curl -X POST "$NGROK_URL/api/calls/update" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"pickedUp\": true,
    \"outcome\": \"live_transfer\",
    \"contactName\": \"Test Transfer\",
    \"contactPhone\": \"555-5555\",
    \"duration\": 230
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""
echo "✅ Tests completed!"
echo ""
echo "Now check:"
echo "1. Your terminal logs (should see call updates)"
echo "2. Dashboard -> refresh page"
echo "3. Activity Logs -> should see test calls"
echo ""

