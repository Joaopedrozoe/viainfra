#!/bin/bash

# ==========================================
# AUTONOMOUS BACKEND FIX FOR EC2
# WhiteLabel MVP - Complete OpenSSL/Prisma Fix
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="/opt/whitelabel/logs/autonomous-backend-fix.log"
EC2_IP="18.217.14.91"
MAX_WAIT=300  # 5 minutes max wait for services

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

success() {
    echo -e "${PURPLE}[$(date '+%Y-%m-%d %H:%M:%S')] 🎉 SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

# Function to check if we're on EC2
check_environment() {
    log "Checking environment..."
    
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        log "✅ Project directory found: $PROJECT_DIR"
    else
        error "Project directory not found: $PROJECT_DIR"
        error "Please ensure you're running this on the correct EC2 instance"
        exit 1
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose not found. Please install Docker Compose first."
        exit 1
    fi
    
    log "✅ Environment check passed"
}

# Function to backup current state
backup_current_state() {
    log "Creating backup of current state..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup docker-compose file
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml "$BACKUP_DIR/"
        log "✅ docker-compose.yml backed up"
    fi
    
    # Backup backend Dockerfile
    if [ -f "backend/Dockerfile" ]; then
        cp backend/Dockerfile "$BACKUP_DIR/"
        log "✅ backend/Dockerfile backed up"
    fi
    
    # Save current container status
    docker-compose ps > "$BACKUP_DIR/container_status_before.txt" 2>/dev/null || true
    
    log "✅ Backup created in $BACKUP_DIR"
}

# Function to stop all containers gracefully
stop_containers() {
    log "Stopping all containers..."
    
    if docker-compose ps | grep -q "Up"; then
        log "Containers are running, stopping them..."
        docker-compose down --timeout 30
        
        # Wait a bit for proper cleanup
        sleep 10
        
        # Force stop any remaining containers
        if docker ps | grep -q whitelabel; then
            warning "Some containers still running, force stopping..."
            docker stop $(docker ps -q --filter name=whitelabel) 2>/dev/null || true
        fi
        
        log "✅ All containers stopped"
    else
        info "No containers were running"
    fi
}

# Function to clean up old images to free space
cleanup_images() {
    log "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f > /dev/null 2>&1 || true
    
    # Remove old backend images (keep latest)
    docker images | grep whitelabel-backend | tail -n +2 | awk '{print $3}' | xargs -r docker rmi -f > /dev/null 2>&1 || true
    
    log "✅ Docker cleanup completed"
}

# Function to build backend with OpenSSL fix
build_backend() {
    log "Building backend with OpenSSL compatibility fix..."
    
    # Ensure we have the latest Dockerfile with OpenSSL fix
    if ! grep -q "openssl1.1-compat" backend/Dockerfile; then
        error "Dockerfile does not contain OpenSSL fix!"
        error "Please ensure the git repository is up to date with the OpenSSL fix."
        exit 1
    fi
    
    log "✅ OpenSSL fix detected in Dockerfile"
    
    # Build with no cache to ensure clean build
    if docker-compose build --no-cache whitelabel-backend; then
        success "Backend built successfully with OpenSSL fix"
        return 0
    else
        error "Backend build failed"
        
        # Show build logs for debugging
        warning "Recent Docker build logs:"
        docker logs $(docker ps -a --format "table {{.Names}}" | grep build | head -1) 2>/dev/null || true
        
        return 1
    fi
}

# Function to start database first
start_database() {
    log "Starting database and Redis..."
    
    # Start database and cache services first
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    log "Waiting for PostgreSQL to be ready..."
    for i in $(seq 1 60); do
        if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            success "PostgreSQL is ready"
            return 0
        fi
        
        if [ $i -eq 60 ]; then
            error "PostgreSQL failed to start after 60 attempts"
            docker-compose logs postgres
            return 1
        fi
        
        sleep 2
    done
}

# Function to start backend service
start_backend() {
    log "Starting backend service..."
    
    # Start backend
    docker-compose up -d whitelabel-backend
    
    # Wait for backend to be healthy
    log "Waiting for backend to be healthy..."
    for i in $(seq 1 90); do
        # Check if container is running
        if ! docker-compose ps whitelabel-backend | grep -q "Up"; then
            warning "Backend container is not running, attempt $i/90"
            sleep 5
            continue
        fi
        
        # Check health endpoint
        if curl -f -s http://localhost:4000/health > /dev/null 2>&1; then
            success "Backend is healthy and responding"
            return 0
        fi
        
        if [ $i -eq 90 ]; then
            error "Backend health check failed after 90 attempts"
            
            warning "Backend container logs:"
            docker-compose logs --tail=100 whitelabel-backend
            
            return 1
        fi
        
        sleep 5
    done
}

# Function to run database setup
setup_database() {
    log "Setting up database..."
    
    # Run migrations
    log "Running Prisma migrations..."
    if docker-compose exec -T whitelabel-backend npx prisma migrate deploy; then
        success "Database migrations completed"
    else
        warning "Migration might have failed, but continuing..."
    fi
    
    # Generate Prisma client (should be done in build, but ensuring)
    log "Generating Prisma client..."
    if docker-compose exec -T whitelabel-backend npx prisma generate; then
        success "Prisma client generated"
    else
        warning "Prisma generate failed, but client might already exist"
    fi
    
    # Run seeds to create test user
    log "Running database seeds..."
    if docker-compose exec -T whitelabel-backend npm run seed; then
        success "Database seeds completed"
    else
        warning "Seeds might have failed, continuing with validation..."
    fi
}

# Function to start remaining services
start_all_services() {
    log "Starting all remaining services..."
    
    # Start all services
    docker-compose up -d
    
    # Brief wait for services to stabilize
    sleep 30
    
    log "✅ All services started"
}

# Function to validate login endpoint
validate_login() {
    log "Validating login endpoint..."
    
    # Use the validation script if available
    if [ -f "scripts/validate-login.sh" ]; then
        # Set EC2 environment for the validation script
        export BACKEND_URL="http://localhost:4000"
        export EC2_IP="$EC2_IP"
        
        if bash scripts/validate-login.sh; then
            success "Login validation PASSED!"
            return 0
        else
            error "Login validation FAILED!"
            return 1
        fi
    else
        # Manual validation
        log "Manual login validation..."
        
        LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST http://localhost:4000/api/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}')
        
        HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
        
        if [ "$HTTP_STATUS" = "200" ] && echo "$RESPONSE_BODY" | grep -q "token"; then
            success "Manual login validation PASSED!"
            return 0
        else
            error "Manual login validation FAILED!"
            error "HTTP Status: $HTTP_STATUS"
            error "Response: $RESPONSE_BODY"
            return 1
        fi
    fi
}

# Function to test external access
test_external_access() {
    log "Testing external access via EC2 public IP..."
    
    EXTERNAL_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "http://$EC2_IP:4000/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}' \
        --connect-timeout 10 || echo "HTTPSTATUS:000")
    
    EXTERNAL_STATUS=$(echo "$EXTERNAL_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$EXTERNAL_STATUS" = "200" ]; then
        success "External access validation PASSED!"
        return 0
    else
        warning "External access validation FAILED (Status: $EXTERNAL_STATUS)"
        warning "This might be due to security groups or firewall settings"
        return 1
    fi
}

# Function to show final status
show_final_status() {
    echo ""
    success "=========================================="
    success "         DEPLOYMENT STATUS REPORT        "
    success "=========================================="
    
    # Container status
    log "Container Status:"
    docker-compose ps
    
    echo ""
    log "Service URLs:"
    log "🔌 Backend API (local): http://localhost:4000"
    log "🔌 Backend API (external): http://$EC2_IP:4000"
    log "🏥 Health Check: http://$EC2_IP:4000/health"
    
    echo ""
    log "Test Commands:"
    echo "  # Local test:"
    echo "  curl -X POST http://localhost:4000/api/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"novo.usuario@exemplo.com\",\"password\":\"SenhaSegura@123\"}'"
    echo ""
    echo "  # External test:"
    echo "  curl -X POST http://$EC2_IP:4000/api/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"novo.usuario@exemplo.com\",\"password\":\"SenhaSegura@123\"}'"
}

# Main execution function
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "   🔧 AUTONOMOUS BACKEND FIX FOR EC2     "
    echo "   OpenSSL/Prisma Compatibility Solution  "
    echo "=========================================="
    echo -e "${NC}"
    
    log "Starting autonomous backend fix process..."
    
    # Step 1: Environment check
    check_environment
    
    # Step 2: Backup current state
    backup_current_state
    
    # Step 3: Stop containers
    stop_containers
    
    # Step 4: Cleanup
    cleanup_images
    
    # Step 5: Build backend with fix
    if ! build_backend; then
        error "Build failed. Aborting deployment."
        exit 1
    fi
    
    # Step 6: Start database
    if ! start_database; then
        error "Database startup failed. Aborting deployment."
        exit 1
    fi
    
    # Step 7: Start backend
    if ! start_backend; then
        error "Backend startup failed. Aborting deployment."
        exit 1
    fi
    
    # Step 8: Setup database
    setup_database
    
    # Step 9: Start all services
    start_all_services
    
    # Step 10: Validate login
    if validate_login; then
        success "🎉 LOGIN VALIDATION SUCCESSFUL!"
    else
        error "❌ LOGIN VALIDATION FAILED"
        error "Check the logs above for troubleshooting information"
        exit 1
    fi
    
    # Step 11: Test external access
    test_external_access
    
    # Step 12: Show final status
    show_final_status
    
    echo ""
    success "✅ AUTONOMOUS BACKEND FIX COMPLETED SUCCESSFULLY!"
    success "The OpenSSL/Prisma issue has been resolved."
    success "Backend login is working correctly."
    
    log "Deployment completed at $(date)"
}

# Execute main function
main "$@"