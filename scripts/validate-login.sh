#!/bin/bash

# ==========================================
# LOGIN ENDPOINT VALIDATION SCRIPT
# WhiteLabel MVP - Autonomous Login Testing
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
EC2_IP="${EC2_IP:-18.217.14.91}"
TEST_EMAIL="${TEST_EMAIL:-novo.usuario@exemplo.com}"
TEST_PASSWORD="${TEST_PASSWORD:-SenhaSegura@123}"
MAX_RETRIES=10
RETRY_DELAY=10

# Auto-detect if we should use EC2 IP based on environment
if [ -n "$EC2_IP" ] && [ "$BACKEND_URL" = "http://localhost:4000" ]; then
    # Check if we can reach localhost:4000, if not, try EC2 IP
    if ! curl -f -s --connect-timeout 5 http://localhost:4000/health > /dev/null 2>&1; then
        BACKEND_URL="http://$EC2_IP:4000"
        log "Auto-detected EC2 environment, using $BACKEND_URL"
    fi
fi

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️ INFO: $1${NC}"
}

# Function to wait for backend to be ready
wait_for_backend() {
    log "Waiting for backend to be ready..."
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s "$BACKEND_URL/health" > /dev/null 2>&1; then
            log "✅ Backend health check passed"
            return 0
        fi
        
        warning "Backend not ready, attempt $i/$MAX_RETRIES"
        if [ $i -lt $MAX_RETRIES ]; then
            sleep $RETRY_DELAY
        fi
    done
    
    error "Backend health check failed after $MAX_RETRIES attempts"
    return 1
}

# Function to test user registration (create test user if needed)
ensure_test_user() {
    log "Ensuring test user exists..."
    
    # Try to register the test user (will fail if already exists, which is fine)
    REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Test User\",
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }" || echo "")
    
    if echo "$REGISTER_RESPONSE" | grep -q "token"; then
        log "✅ Test user created successfully"
    elif echo "$REGISTER_RESPONSE" | grep -q "already exists"; then
        log "✅ Test user already exists"
    else
        warning "Could not create test user, proceeding with login test anyway"
    fi
}

# Function to test login endpoint
test_login() {
    log "Testing login endpoint..."
    
    # Make login request
    LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    # Extract HTTP status code
    HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo ""
    info "Login Response Details:"
    echo "HTTP Status: $HTTP_STATUS"
    echo "Response Body: $RESPONSE_BODY"
    echo ""
    
    # Check if login was successful
    if [ "$HTTP_STATUS" = "200" ]; then
        if echo "$RESPONSE_BODY" | grep -q "token"; then
            log "🎉 LOGIN SUCCESS! Endpoint is working correctly"
            
            # Extract and validate token
            TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
            if [ ! -z "$TOKEN" ]; then
                log "✅ JWT Token received: ${TOKEN:0:20}..."
                
                # Test token validity with /me endpoint
                ME_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BACKEND_URL/api/auth/me" \
                    -H "Authorization: Bearer $TOKEN")
                
                ME_STATUS=$(echo "$ME_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
                
                if [ "$ME_STATUS" = "200" ]; then
                    log "✅ Token validation successful"
                else
                    warning "Token validation failed (status: $ME_STATUS)"
                fi
            fi
            
            return 0
        else
            error "Login returned 200 but no token found in response"
            return 1
        fi
    else
        error "Login failed with HTTP status: $HTTP_STATUS"
        error "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to diagnose common issues
diagnose_issues() {
    log "Running diagnostic checks..."
    
    # Check if backend is running
    if ! curl -f -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        error "Backend health check failed"
        
        # Check if containers are running
        if command -v docker-compose &> /dev/null; then
            echo ""
            warning "Container status:"
            docker-compose ps
        fi
        
        return 1
    fi
    
    # Check database connectivity
    log "Checking database connectivity..."
    DB_HEALTH=$(curl -s "$BACKEND_URL/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$DB_HEALTH" = "ok" ]; then
        log "✅ Basic health check passed"
    else
        warning "Health check returned: $DB_HEALTH"
    fi
    
    return 0
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "   🧪 LOGIN ENDPOINT VALIDATION SCRIPT   "
    echo "=========================================="
    echo -e "${NC}"
    
    info "Target URL: $BACKEND_URL"
    info "Test Email: $TEST_EMAIL"
    echo ""
    
    # Step 1: Wait for backend
    if ! wait_for_backend; then
        error "Backend is not ready. Please check your deployment."
        exit 1
    fi
    
    # Step 2: Ensure test user exists
    ensure_test_user
    
    # Step 3: Test login
    if test_login; then
        echo ""
        log "🎉 SUCCESS: Login endpoint is working correctly!"
        echo ""
        echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
        echo "The backend login functionality is working as expected."
        exit 0
    else
        echo ""
        error "❌ VALIDATION FAILED"
        echo ""
        
        # Run diagnostics
        diagnose_issues
        
        echo ""
        error "Login endpoint is not working. Please check the logs and deployment."
        exit 1
    fi
}

# Execute main function
main "$@"