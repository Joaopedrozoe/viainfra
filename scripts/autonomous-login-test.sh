#!/bin/bash

# ==========================================
# AUTONOMOUS LOGIN TESTING SCRIPT
# WhiteLabel MVP - Complete Login Validation
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
TEST_EMAIL="${TEST_EMAIL:-novo.usuario@exemplo.com}"
TEST_PASSWORD="${TEST_PASSWORD:-SenhaSegura@123}"

# Functions for output
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# Function to test backend health
test_backend_health() {
    log "Testing backend health..."
    
    HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BACKEND_URL/health" || echo "HTTPSTATUS:000")
    HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$HTTP_STATUS" = "200" ]; then
        log "✅ Backend health check passed"
        info "Health response: $RESPONSE_BODY"
        return 0
    else
        error "❌ Backend health check failed (Status: $HTTP_STATUS)"
        return 1
    fi
}

# Function to test login endpoint
test_login() {
    log "Testing login endpoint..."
    
    LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo ""
    info "Login Test Results:"
    info "HTTP Status: $HTTP_STATUS"
    info "Response Body: $RESPONSE_BODY"
    echo ""
    
    if [ "$HTTP_STATUS" = "200" ]; then
        # Check if response contains token
        if echo "$RESPONSE_BODY" | grep -q "token"; then
            log "🎉 LOGIN SUCCESS! Authentication is working correctly"
            
            # Extract token for further testing
            TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
            if [ ! -z "$TOKEN" ]; then
                info "✅ JWT Token received: ${TOKEN:0:20}..."
                export AUTH_TOKEN="$TOKEN"
                return 0
            else
                error "Token extraction failed"
                return 1
            fi
        else
            error "Login returned 200 but no token found"
            return 1
        fi
    else
        error "❌ LOGIN FAILED with HTTP status: $HTTP_STATUS"
        error "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to test token validation with /me endpoint
test_token_validation() {
    if [ -z "$AUTH_TOKEN" ]; then
        warning "No auth token available, skipping token validation"
        return 1
    fi
    
    log "Testing token validation with /me endpoint..."
    
    ME_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BACKEND_URL/api/auth/me" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    ME_STATUS=$(echo "$ME_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    ME_BODY=$(echo "$ME_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo ""
    info "Token Validation Results:"
    info "HTTP Status: $ME_STATUS"
    info "Response: $ME_BODY"
    echo ""
    
    if [ "$ME_STATUS" = "200" ]; then
        log "✅ Token validation successful"
        if echo "$ME_BODY" | grep -q "user"; then
            log "✅ User data retrieved successfully"
            return 0
        else
            warning "Token valid but user data format unexpected"
            return 1
        fi
    else
        error "❌ Token validation failed (Status: $ME_STATUS)"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    echo -e "${BLUE}"
    echo "==========================================="
    echo "   🧪 AUTONOMOUS LOGIN TESTING SCRIPT     "
    echo "==========================================="
    echo -e "${NC}"
    
    info "Target URL: $BACKEND_URL"
    info "Test Email: $TEST_EMAIL"
    echo ""
    
    local TESTS_PASSED=0
    local TOTAL_TESTS=3
    
    # Test 1: Backend Health
    if test_backend_health; then
        ((TESTS_PASSED++))
    fi
    
    echo ""
    
    # Test 2: Login
    if test_login; then
        ((TESTS_PASSED++))
    fi
    
    echo ""
    
    # Test 3: Token Validation
    if test_token_validation; then
        ((TESTS_PASSED++))
    fi
    
    echo ""
    echo "==========================================="
    echo "           TEST RESULTS SUMMARY           "
    echo "==========================================="
    
    if [ $TESTS_PASSED -eq $TOTAL_TESTS ]; then
        log "🎉 ALL TESTS PASSED ($TESTS_PASSED/$TOTAL_TESTS)"
        log "✅ Login system is working correctly!"
        echo ""
        log "Ready for production use:"
        echo "  • Health endpoint: $BACKEND_URL/health"
        echo "  • Login endpoint: $BACKEND_URL/api/auth/login"
        echo "  • User profile: $BACKEND_URL/api/auth/me"
        echo ""
        return 0
    else
        error "❌ SOME TESTS FAILED ($TESTS_PASSED/$TOTAL_TESTS passed)"
        error "Login system needs attention before production use"
        echo ""
        return 1
    fi
}

# Main execution
main() {
    if run_all_tests; then
        exit 0
    else
        exit 1
    fi
}

# Execute main function
main "$@"