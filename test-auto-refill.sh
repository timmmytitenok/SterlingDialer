#!/bin/bash

# Test Auto-Refill System
# This script simulates a call completion to test auto-refill functionality

echo "🧪 Testing Auto-Refill System"
echo "================================"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: 'jq' is not installed. Install it for better output formatting."
    echo "   Install with: brew install jq"
    echo ""
fi

# Get the API endpoint
API_URL="${1:-http://localhost:3000}"
echo "📡 API URL: $API_URL"
echo ""

# Prompt for test parameters
echo "Select test scenario:"
echo "1) Small call (1 minute = $0.10) - Won't trigger auto-refill"
echo "2) Large call (100 minutes = $10) - May trigger auto-refill if balance < $20"
echo "3) Custom amount"
echo ""
read -p "Choose (1-3): " choice

case $choice in
  1)
    MINUTES=1
    ;;
  2)
    MINUTES=100
    ;;
  3)
    read -p "Enter call duration in minutes: " MINUTES
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

COST=$(echo "scale=2; $MINUTES * 0.10" | bc)

echo ""
echo "📞 Simulating call:"
echo "   Duration: $MINUTES minutes"
echo "   Cost: \$$COST"
echo ""
echo "🔄 Calling balance deduction API..."
echo ""

# Make the API call
RESPONSE=$(curl -s -X POST "$API_URL/api/balance/deduct" \
  -H "Content-Type: application/json" \
  -d "{
    \"callId\": \"test-$(date +%s)\",
    \"durationMinutes\": $MINUTES
  }")

echo "📦 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Parse response and display results
if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  
  if [ "$SUCCESS" = "true" ]; then
    BALANCE=$(echo "$RESPONSE" | jq -r '.balance')
    AUTO_REFILLED=$(echo "$RESPONSE" | jq -r '.autoRefilled')
    REFILL_AMOUNT=$(echo "$RESPONSE" | jq -r '.refillAmount // empty')
    
    echo "✅ Balance Updated Successfully"
    echo "   New Balance: \$$BALANCE"
    
    if [ "$AUTO_REFILLED" = "true" ]; then
      echo ""
      echo "🎉 AUTO-REFILL TRIGGERED!"
      echo "   Refilled Amount: \$$REFILL_AMOUNT"
      echo "   ✅ Auto-refill working correctly!"
    elif [ "$BALANCE" != "null" ]; then
      BALANCE_NUM=$(echo "$BALANCE" | bc)
      if (( $(echo "$BALANCE_NUM < 10" | bc -l) )); then
        echo "   ⚠️  Balance is below \$10 but auto-refill didn't trigger"
        echo "   Check if auto-refill is enabled and payment method is saved"
      fi
    fi
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    echo "❌ Error: $ERROR"
  fi
fi

echo ""
echo "📊 Next Steps:"
echo "   1. Check your dashboard balance at $API_URL/dashboard/settings/billing"
echo "   2. View transaction history in the Call Balance card"
echo "   3. Check Stripe dashboard for auto-refill charges"
echo ""

