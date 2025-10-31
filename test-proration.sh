#!/bin/bash

# Test Proration Script
# This will show you what Stripe will charge after an upgrade

echo "🔍 Testing Proration..."
echo ""

# You'll need your customer ID - find it in Stripe dashboard or logs
read -p "Enter your Stripe Customer ID (starts with cus_): " CUSTOMER_ID

echo ""
echo "📊 Fetching upcoming invoice..."
echo ""

# Use Stripe CLI to get the upcoming invoice
stripe invoices upcoming --customer $CUSTOMER_ID

echo ""
echo "✅ Done! Look for 'proration' lines above to see the charges/credits"

