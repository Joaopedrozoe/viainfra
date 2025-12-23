#!/bin/bash

# API Testing Script
# Tests all backend endpoints without database dependency

API_URL="http://localhost:4000"

echo "🧪 Testing WhiteLabel Backend API"
echo "=================================="

# Test Health Endpoint
echo "📊 Testing Health Endpoint..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/health")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_code" = "200" ]; then
    echo "✅ Health endpoint working"
    echo "   Response: $body"
else
    echo "❌ Health endpoint failed (HTTP: $http_code)"
    echo "   Response: $body"
fi

echo ""

# Test Root Endpoint
echo "🏠 Testing Root Endpoint..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_code" = "200" ]; then
    echo "✅ Root endpoint working"
    echo "   Response: $body"
else
    echo "❌ Root endpoint failed (HTTP: $http_code)"
    echo "   Response: $body"
fi

echo ""

# Test API Health
echo "🔌 Testing API Health..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/api/health")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_code" = "200" ]; then
    echo "✅ API health endpoint working"
    echo "   Response: $body"
else
    echo "❌ API health endpoint failed (HTTP: $http_code)"
    echo "   Response: $body"
fi

echo ""

# Test 404 handling
echo "🚫 Testing 404 handling..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/api/nonexistent")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_code" = "404" ]; then
    echo "✅ 404 handling working"
    echo "   Response: $body"
else
    echo "❌ 404 handling failed (HTTP: $http_code)"
    echo "   Response: $body"
fi

echo ""

# Test CORS preflight
echo "🌐 Testing CORS..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X OPTIONS "$API_URL/api/health" -H "Origin: http://localhost:3000")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo "✅ CORS working"
else
    echo "❌ CORS failed (HTTP: $http_code)"
fi

echo ""

# Test WebSocket endpoint
echo "🔌 Testing WebSocket endpoint..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/socket.io/")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
    echo "✅ WebSocket endpoint accessible"
else
    echo "❌ WebSocket endpoint failed (HTTP: $http_code)"
fi

echo ""
echo "🎯 API Testing Complete!"
echo ""
echo "💡 Tips:"
echo "   - Ensure server is running: npm run dev"
echo "   - Check logs in logs/ directory"
echo "   - Test with database: setup PostgreSQL and run migrations"