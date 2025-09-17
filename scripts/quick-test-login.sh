#!/bin/bash

# ==========================================
# QUICK LOGIN TEST SCRIPT
# WhiteLabel MVP - Test from any location
# ==========================================

EC2_IP="18.217.14.91"
BACKEND_URL="http://$EC2_IP:4000"

echo "🧪 Testing login endpoint on EC2..."
echo "URL: $BACKEND_URL/api/auth/login"
echo ""

# Test the login endpoint
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}' \
    --connect-timeout 10)

# Extract status and body
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')

echo "HTTP Status: $HTTP_STATUS"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Check result
if [ "$HTTP_STATUS" = "200" ] && echo "$RESPONSE_BODY" | grep -q "token"; then
    echo "✅ SUCCESS: Login is working correctly!"
    echo "🎉 Backend fix was successful!"
else
    echo "❌ FAILED: Login is not working"
    echo "❗ Status: $HTTP_STATUS"
    
    if [ "$HTTP_STATUS" = "000" ]; then
        echo "💡 This might be a connection issue. Check if:"
        echo "   - EC2 instance is running"
        echo "   - Security group allows port 4000"
        echo "   - Backend container is up"
    fi
fi