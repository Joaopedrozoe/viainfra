#!/bin/bash

# ==========================================
# AUTONOMOUS BACKEND VERIFICATION SCRIPT
# ==========================================
# This script automatically fixes, builds, and tests the backend
# until the login endpoint works successfully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/home/runner/work/viainfra/viainfra"
BACKEND_DIR="$PROJECT_DIR/backend"
TEST_URL="http://localhost:4000/api/auth/login"
TEST_CREDENTIALS='{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}'
MAX_RETRIES=5
WAIT_TIME=30

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if service is healthy
check_service_health() {
    local service=$1
    local max_wait=${2:-90}
    local check_interval=5
    
    for ((i=1; i<=max_wait; i+=check_interval)); do
        if docker compose ps | grep "$service" | grep -q "Up"; then
            case "$service" in
                "postgres")
                    if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
                        success "$service is healthy"
                        return 0
                    fi
                    ;;
                "whitelabel-backend")
                    if curl -f -s http://localhost:4000/health > /dev/null 2>&1; then
                        success "$service is healthy"
                        return 0
                    fi
                    ;;
                *)
                    success "$service is running"
                    return 0
                    ;;
            esac
        fi
        
        log "Waiting for $service to be healthy... (${i}/${max_wait}s)"
        sleep $check_interval
    done
    
    warning "$service may not be completely healthy"
    return 1
}

# Function to test login endpoint
test_login() {
    log "Testing login endpoint..."
    
    local response
    local http_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$TEST_CREDENTIALS" \
        "$TEST_URL" 2>/dev/null || echo "HTTPSTATUS:000")
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    log "HTTP Status: $http_code"
    log "Response: $body"
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q '"token"'; then
            success "Login successful! Token received."
            return 0
        else
            error "Login returned 200 but no token found"
            return 1
        fi
    else
        error "Login failed with status: $http_code"
        error "Response: $body"
        return 1
    fi
}

# Function to check Prisma client
check_prisma() {
    log "Checking Prisma client..."
    
    cd "$BACKEND_DIR"
    
    # Test Prisma connection
    if node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$queryRaw\`SELECT 1 as test\`
            .then(() => {
                console.log('Prisma connection successful');
                process.exit(0);
            })
            .catch((error) => {
                console.error('Prisma connection failed:', error.message);
                process.exit(1);
            })
            .finally(() => prisma.\$disconnect());
    " 2>/dev/null; then
        success "Prisma client working correctly"
        return 0
    else
        error "Prisma client connection failed"
        return 1
    fi
}

# Main deployment function
main() {
    log "🚀 Starting autonomous backend deployment and verification..."
    
    cd "$PROJECT_DIR"
    
    # Phase 1: Environment Setup
    log "📋 Phase 1: Environment Setup"
    
    # Create backend .env if not exists
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log "Creating backend .env file..."
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        
        # Update .env with proper values
        sed -i 's|DATABASE_URL="postgresql://postgres:password@localhost:5432/whitelabel_mvp"|DATABASE_URL="postgresql://postgres:password@postgres:5432/whitelabel_mvp"|g' "$BACKEND_DIR/.env"
        sed -i 's|REDIS_URL="redis://localhost:6379"|REDIS_URL="redis://redis:6379"|g' "$BACKEND_DIR/.env"
        sed -i 's|EVOLUTION_API_URL="http://localhost:8080"|EVOLUTION_API_URL="http://evolution-api:8080"|g' "$BACKEND_DIR/.env"
        
        success "Backend .env file created and configured"
    fi
    
    # Phase 2: Build and Deploy
    log "🏗️ Phase 2: Build and Deploy"
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker compose down --remove-orphans || true
    
    # Build backend with no cache to ensure fresh build
    log "Building backend container..."
    if docker compose build --no-cache whitelabel-backend; then
        success "Backend container built successfully"
    else
        error "Backend container build failed"
        
        # Try alternative build strategy
        warning "Attempting alternative build strategy..."
        
        # Build locally first
        cd "$BACKEND_DIR"
        npm ci
        npx prisma generate
        npm run build
        cd "$PROJECT_DIR"
        
        # Try build again
        if docker compose build whitelabel-backend; then
            success "Backend container built with alternative strategy"
        else
            error "Backend container build failed completely"
            exit 1
        fi
    fi
    
    # Start services
    log "Starting services..."
    docker compose up -d postgres redis
    
    # Wait for PostgreSQL
    check_service_health "postgres" 60
    
    # Run migrations and seeds
    log "Running database migrations..."
    if docker compose run --rm whitelabel-backend npx prisma migrate deploy; then
        success "Migrations completed"
    else
        warning "Migration failed, trying to push schema..."
        docker compose run --rm whitelabel-backend npx prisma db push --accept-data-loss || true
    fi
    
    log "Seeding database..."
    docker compose run --rm whitelabel-backend npm run seed || warning "Seeding failed but continuing..."
    
    # Start backend
    log "Starting backend service..."
    docker compose up -d whitelabel-backend
    
    # Phase 3: Health Verification
    log "🔍 Phase 3: Health Verification"
    
    # Wait for backend to be healthy
    check_service_health "whitelabel-backend" 120
    
    # Test Prisma connection
    check_prisma || warning "Prisma check failed but continuing..."
    
    # Phase 4: Login Testing
    log "🧪 Phase 4: Login Testing"
    
    # Wait a bit more for backend to fully initialize
    sleep 10
    
    # Test login endpoint with retries
    for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
        log "Login test attempt $attempt/$MAX_RETRIES"
        
        if test_login; then
            success "🎉 Login endpoint working successfully!"
            
            # Display final status
            echo ""
            log "✅ DEPLOYMENT SUCCESSFUL!"
            log "🔗 Backend URL: http://localhost:4000"
            log "🔗 Health Check: http://localhost:4000/health"
            log "🔗 Login Endpoint: http://localhost:4000/api/auth/login"
            log "👤 Test User: novo.usuario@exemplo.com"
            log "🔑 Test Password: SenhaSegura@123"
            echo ""
            
            return 0
        else
            warning "Login test failed, attempt $attempt/$MAX_RETRIES"
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                log "Waiting ${WAIT_TIME}s before next attempt..."
                sleep $WAIT_TIME
                
                # Check logs for errors
                log "Backend logs:"
                docker compose logs --tail=20 whitelabel-backend | tail -10
            fi
        fi
    done
    
    # If we reach here, all attempts failed
    error "❌ Login endpoint failed after $MAX_RETRIES attempts"
    
    # Show diagnostic information
    log "🔍 Diagnostic Information:"
    log "Container status:"
    docker compose ps
    
    log "Backend logs:"
    docker compose logs --tail=50 whitelabel-backend
    
    log "Database connection test:"
    docker compose exec -T postgres pg_isready -U postgres || true
    
    return 1
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    # Keep services running for debugging
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"