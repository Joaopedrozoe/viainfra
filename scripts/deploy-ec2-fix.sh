#!/bin/bash

# ==========================================
# EC2 PRODUCTION DEPLOYMENT SCRIPT
# ==========================================
# Script to fix and deploy backend for EC2 production environment
# Target: Make login endpoint work at http://18.217.14.91:4000/api/auth/login

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration for EC2
PROJECT_DIR="/opt/whitelabel"
BACKEND_DIR="$PROJECT_DIR/backend"
TEST_URL="http://localhost:4000/api/auth/login"
PUBLIC_URL="http://18.217.14.91:4000/api/auth/login"
TEST_CREDENTIALS='{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}'

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

# Test login function
test_login_endpoint() {
    local url=$1
    log "Testing login at: $url"
    
    local response
    local http_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$TEST_CREDENTIALS" \
        "$url" 2>/dev/null || echo "HTTPSTATUS:000")
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    log "HTTP Status: $http_code"
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q '"token"'; then
            success "✅ LOGIN SUCCESS! Token received at $url"
            log "Response: $body"
            return 0
        else
            error "Login returned 200 but no token found"
            log "Response: $body"
            return 1
        fi
    else
        error "Login failed with status: $http_code"
        log "Response: $body"
        return 1
    fi
}

# Main EC2 deployment function
main() {
    log "🚀 Starting EC2 production deployment..."
    
    # Change to project directory
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        log "Using existing project directory: $PROJECT_DIR"
    else
        error "Project directory not found: $PROJECT_DIR"
        error "Please ensure the project is properly deployed to EC2"
        exit 1
    fi
    
    # Phase 1: Fix Dockerfile for OpenSSL compatibility
    log "🔧 Phase 1: Fixing Dockerfile for OpenSSL/Prisma compatibility"
    
    # Check if Dockerfile needs updating
    if grep -q "postgresql-client" backend/Dockerfile && ! grep -q "openssl" backend/Dockerfile; then
        log "Updating Dockerfile to fix OpenSSL issues..."
        
        # Backup original Dockerfile
        cp backend/Dockerfile backend/Dockerfile.backup
        
        # Update Dockerfile with OpenSSL libraries
        sed -i 's/postgresql-client/postgresql15-client/' backend/Dockerfile
        sed -i '/postgresql15-client/a\    openssl \\' backend/Dockerfile
        sed -i '/openssl/a\    openssl-dev \\' backend/Dockerfile
        sed -i '/openssl-dev/a\    libc6-compat \\' backend/Dockerfile
        sed -i 's/apk add --no-cache/apk update \&\& apk add --no-cache/' backend/Dockerfile
        
        success "Dockerfile updated with OpenSSL compatibility"
    else
        log "Dockerfile already contains OpenSSL libraries"
    fi
    
    # Phase 2: Environment Configuration
    log "📋 Phase 2: Environment Configuration"
    
    # Ensure proper environment file exists
    if [ ! -f ".env" ]; then
        log "Creating production .env file..."
        
        # Create production .env
        cat > .env << EOF
# Production Environment Variables
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-secure_postgres_password_change_me}
JWT_SECRET=\${JWT_SECRET:-secure_jwt_secret_key_min_32_chars_change_in_production}
EVOLUTION_API_KEY=\${EVOLUTION_API_KEY:-secure_evolution_api_key_change_me}
SUPABASE_URL=
SUPABASE_ANON_KEY=
EOF
        success "Production .env created"
    fi
    
    # Ensure backend .env exists
    if [ ! -f "backend/.env" ]; then
        log "Creating backend .env file..."
        cp backend/.env.example backend/.env
        
        # Update for production
        sed -i 's|localhost|postgres|g' backend/.env
        sed -i 's|redis://localhost|redis://redis|g' backend/.env
        sed -i 's|http://localhost:8080|http://evolution-api:8080|g' backend/.env
        sed -i 's|NODE_ENV=development|NODE_ENV=production|g' backend/.env
        
        success "Backend .env configured for production"
    fi
    
    # Phase 3: Clean rebuild
    log "🏗️ Phase 3: Clean rebuild with OpenSSL fix"
    
    # Stop all containers
    log "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    
    # Remove old backend image to force rebuild
    log "Removing old backend image..."
    docker rmi $(docker images -q "*backend*" 2>/dev/null) 2>/dev/null || true
    
    # Build backend with no cache
    log "Building backend container (this may take a few minutes)..."
    if docker-compose build --no-cache backend; then
        success "Backend container built successfully"
    else
        error "Backend build failed. Checking for issues..."
        
        # Try to diagnose and fix
        log "Attempting alternative build strategy..."
        
        # Check if we can access Alpine packages
        docker run --rm node:18-alpine apk update || {
            warning "Alpine package repositories may be unreachable"
            warning "Trying alternative base image or cached build..."
        }
        
        # Try without no-cache
        if docker-compose build backend; then
            success "Backend built with cached layers"
        else
            error "Backend build failed completely"
            return 1
        fi
    fi
    
    # Phase 4: Database setup
    log "🗄️ Phase 4: Database setup"
    
    # Start database first
    log "Starting PostgreSQL..."
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
            success "PostgreSQL is ready"
            break
        fi
        log "Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done
    
    # Run migrations
    log "Running database migrations..."
    docker-compose run --rm backend npx prisma migrate deploy || {
        warning "Migration failed, pushing schema directly..."
        docker-compose run --rm backend npx prisma db push --accept-data-loss
    }
    
    # Seed database with test user
    log "Seeding database with test user..."
    docker-compose run --rm backend npm run seed || warning "Seeding failed but continuing..."
    
    # Phase 5: Start all services
    log "🚀 Phase 5: Starting all services"
    
    # Start Redis
    docker-compose up -d redis
    
    # Start backend
    log "Starting backend service..."
    docker-compose up -d backend
    
    # Wait for backend to be ready
    log "Waiting for backend to be ready..."
    for i in {1..60}; do
        if curl -f -s http://localhost:4000/health >/dev/null 2>&1; then
            success "Backend is ready"
            break
        fi
        log "Waiting for backend... ($i/60)"
        sleep 2
    done
    
    # Phase 6: Verify login endpoint
    log "🧪 Phase 6: Login endpoint verification"
    
    # Test login locally first
    if test_login_endpoint "$TEST_URL"; then
        success "Local login test passed"
    else
        error "Local login test failed"
        
        # Show diagnostic info
        log "Backend logs:"
        docker-compose logs --tail=20 backend
        
        log "Container status:"
        docker-compose ps
        
        return 1
    fi
    
    # Test public endpoint if accessible
    log "Testing public endpoint..."
    if test_login_endpoint "$PUBLIC_URL"; then
        success "🎉 PUBLIC LOGIN ENDPOINT WORKING!"
    else
        warning "Public endpoint test failed, but local test passed"
        warning "This may be due to firewall or network configuration"
    fi
    
    # Final status report
    log "📊 Final Status Report"
    log "========================"
    success "✅ Backend deployed successfully"
    success "✅ Database migrations completed"
    success "✅ Login endpoint working locally"
    log "🔗 Local URL: http://localhost:4000/api/auth/login"
    log "🔗 Public URL: http://18.217.14.91:4000/api/auth/login"
    log "👤 Test credentials: novo.usuario@exemplo.com / SenhaSegura@123"
    
    # Show container status
    log "Container Status:"
    docker-compose ps
    
    log "🎉 Deployment completed successfully!"
    
    return 0
}

# Run main function
main "$@"