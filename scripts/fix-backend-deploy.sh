#!/bin/bash

# ==========================================
# BACKEND DEPLOY FIX SCRIPT
# WhiteLabel MVP - OpenSSL/Prisma Fix & Deploy
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="$PROJECT_DIR/logs/backend-fix.log"
BACKEND_URL="http://localhost:4000"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️ INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Function to stop containers gracefully
stop_containers() {
    log "Stopping containers..."
    
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        log "✅ Containers stopped"
    else
        info "No containers were running"
    fi
}

# Function to build backend with OpenSSL fix
build_backend() {
    log "Building backend with OpenSSL fix..."
    
    # Build with no cache to ensure fresh build
    if docker-compose build --no-cache whitelabel-backend; then
        log "✅ Backend built successfully with OpenSSL fix"
        return 0
    else
        error "Backend build failed"
        return 1
    fi
}

# Function to start containers
start_containers() {
    log "Starting containers..."
    
    # Start database first
    docker-compose up -d postgres redis
    log "📊 Database and Redis started"
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            log "✅ Database is ready"
            break
        fi
        sleep 2
    done
    
    # Start backend
    docker-compose up -d whitelabel-backend
    log "🚀 Backend started"
    
    # Start other services
    docker-compose up -d
    log "🌐 All services started"
}

# Function to check backend health
check_backend_health() {
    log "Checking backend health..."
    
    for i in {1..30}; do
        if curl -f -s "$BACKEND_URL/health" > /dev/null 2>&1; then
            log "✅ Backend health check passed"
            return 0
        fi
        
        if [ $i -eq 30 ]; then
            error "Backend health check failed after 30 attempts"
            
            # Show container logs for debugging
            warning "Backend container logs:"
            docker-compose logs --tail=50 whitelabel-backend
            
            return 1
        fi
        
        info "Waiting for backend... ($i/30)"
        sleep 10
    done
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Execute migrations inside the backend container
    if docker-compose exec -T whitelabel-backend npx prisma migrate deploy; then
        log "✅ Database migrations completed"
    else
        warning "Database migrations failed, but this might be normal if migrations were already applied"
    fi
    
    # Generate Prisma client (should already be done during build, but just in case)
    if docker-compose exec -T whitelabel-backend npx prisma generate; then
        log "✅ Prisma client generated"
    else
        warning "Prisma client generation failed"
    fi
}

# Function to create test user if needed
create_test_user() {
    log "Creating test user if needed..."
    
    # This will be handled by the login validation script
    info "Test user creation will be handled during login validation"
}

# Function to validate login endpoint
validate_login() {
    log "Validating login endpoint..."
    
    if [ -f "./scripts/validate-login.sh" ]; then
        if ./scripts/validate-login.sh; then
            log "🎉 LOGIN VALIDATION SUCCESSFUL!"
            return 0
        else
            error "Login validation failed"
            return 1
        fi
    else
        error "Login validation script not found"
        return 1
    fi
}

# Function to show final status
show_status() {
    echo ""
    log "=========================================="
    log "           FINAL DEPLOYMENT STATUS        "
    log "=========================================="
    
    # Show container status
    log "Container Status:"
    docker-compose ps
    
    echo ""
    log "Service URLs:"
    log "🔌 Backend API: $BACKEND_URL"
    log "🏥 Health Check: $BACKEND_URL/health"
    log "📊 Prisma Status: Check container logs for Prisma initialization"
    
    echo ""
    log "Test Commands:"
    echo "  # Test health:"
    echo "  curl $BACKEND_URL/health"
    echo ""
    echo "  # Test login:"
    echo "  curl -X POST $BACKEND_URL/api/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"novo.usuario@exemplo.com\",\"password\":\"SenhaSegura@123\"}'"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "   🔧 BACKEND DEPLOY FIX SCRIPT           "
    echo "   OpenSSL/Prisma Compatibility Fix       "
    echo "=========================================="
    echo -e "${NC}"
    
    # Create logs directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Change to project directory
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
    else
        log "Using current directory as project root"
    fi
    
    log "Starting backend deployment fix..."
    
    # Step 1: Stop containers
    stop_containers
    
    # Step 2: Build backend with OpenSSL fix
    if ! build_backend; then
        error "Build failed. Aborting deployment."
        exit 1
    fi
    
    # Step 3: Start containers
    start_containers
    
    # Step 4: Check backend health
    if ! check_backend_health; then
        error "Backend health check failed. Checking logs..."
        docker-compose logs --tail=100 whitelabel-backend
        exit 1
    fi
    
    # Step 5: Run migrations
    run_migrations
    
    # Step 6: Create test user
    create_test_user
    
    # Step 7: Validate login endpoint
    if validate_login; then
        log "🎉 DEPLOYMENT SUCCESSFUL!"
        log "Backend is running and login endpoint is working correctly."
    else
        error "Login validation failed. Deployment completed but login is not working."
        
        # Show additional debug info
        warning "Additional debugging information:"
        docker-compose logs --tail=50 whitelabel-backend
        
        exit 1
    fi
    
    # Step 8: Show final status
    show_status
    
    echo ""
    log "✅ BACKEND DEPLOYMENT FIX COMPLETED SUCCESSFULLY!"
    log "The OpenSSL/Prisma issue has been resolved and login is working."
}

# Execute main function
main "$@"