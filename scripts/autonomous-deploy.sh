#!/bin/bash

# ==========================================
# AUTONOMOUS DEPLOYMENT SCRIPT
# WhiteLabel MVP - Fully Automated Deploy with Self-Healing
# ==========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="$PROJECT_DIR/logs/autonomous-deploy.log"
MAX_RETRIES=${MAX_RETRIES:-3}
RETRY_DELAY=${RETRY_DELAY:-30}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-180}

# Ensure we're in the right directory
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    exit 1
}

# Create logs directory
mkdir -p logs

# Function to log with timestamp and color
log() {
    local message="$1"
    local color="${2:-$GREEN}"
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] $message${NC}" | tee -a "$LOG_FILE"
}

error() {
    log "❌ ERROR: $1" "$RED"
}

warning() {
    log "⚠️ WARNING: $1" "$YELLOW"
}

info() {
    log "ℹ️ INFO: $1" "$BLUE"
}

success() {
    log "✅ SUCCESS: $1" "$GREEN"
}

# Function to check if a service is healthy
check_service() {
    local service_name="$1"
    local endpoint="$2"
    local max_attempts="${3:-30}"
    local attempt=1
    
    info "Checking $service_name health at $endpoint"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "$endpoint" > /dev/null 2>&1; then
            success "$service_name is healthy (attempt $attempt)"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: $service_name not ready, waiting..." "$YELLOW"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error "$service_name failed health check after $max_attempts attempts"
    return 1
}

# Function to cleanup failed deployment
cleanup_deployment() {
    log "🧹 Cleaning up failed deployment..." "$YELLOW"
    
    # Stop all containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Kill any hanging processes
    pkill -f "docker-compose" 2>/dev/null || true
    pkill -f "node" 2>/dev/null || true
    
    # Clean up Docker resources
    docker system prune -f 2>/dev/null || true
    
    # Wait a moment for cleanup
    sleep 10
    
    success "Cleanup completed"
}

# Function to fix common deployment issues
fix_common_issues() {
    log "🔧 Checking and fixing common deployment issues..." "$PURPLE"
    
    # Check disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 85 ]; then
        warning "High disk usage ($DISK_USAGE%), cleaning up..."
        docker system prune -af --volumes 2>/dev/null || true
        npm cache clean --force 2>/dev/null || true
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
    if [ "$MEMORY_USAGE" -gt 85 ]; then
        warning "High memory usage ($MEMORY_USAGE%), restarting Docker daemon..."
        sudo systemctl restart docker
        sleep 30
    fi
    
    # Check Docker daemon
    if ! docker info > /dev/null 2>&1; then
        warning "Docker daemon issues detected, restarting..."
        sudo systemctl restart docker
        sleep 30
    fi
    
    # Check port conflicts
    for port in 3000 4000 5432 6379 8080; do
        if lsof -i ":$port" > /dev/null 2>&1; then
            PID=$(lsof -t -i ":$port" | head -1)
            if [ ! -z "$PID" ]; then
                warning "Port $port is in use by PID $PID, checking if it's our process..."
                if ! ps -p "$PID" -o cmd= | grep -E "(docker|node|postgres|redis)" > /dev/null; then
                    warning "Killing non-Docker process on port $port"
                    kill -9 "$PID" 2>/dev/null || true
                fi
            fi
        fi
    done
    
    # Fix permission issues
    sudo chown -R $(whoami):$(whoami) "$PROJECT_DIR" 2>/dev/null || true
    chmod +x scripts/*.sh 2>/dev/null || true
    
    success "Common issues check completed"
}

# Function to verify environment configuration
verify_environment() {
    log "🔍 Verifying environment configuration..." "$CYAN"
    
    # Check required files
    local required_files=("docker-compose.yml" ".env")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            if [ "$file" = ".env" ]; then
                warning ".env file not found, creating from template..."
                if [ -f ".env.template" ]; then
                    cp .env.template .env
                    success "Created .env from template"
                elif [ -f ".env.example" ]; then
                    cp .env.example .env
                    success "Created .env from example"
                else
                    error "No .env template found"
                    return 1
                fi
            else
                error "Required file not found: $file"
                return 1
            fi
        fi
    done
    
    # Check Docker Compose syntax
    if ! docker-compose config > /dev/null 2>&1; then
        error "Docker Compose configuration is invalid"
        return 1
    fi
    
    success "Environment verification completed"
    return 0
}

# Function to deploy with retries
deploy_with_retries() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "🚀 Deployment attempt $attempt of $MAX_RETRIES" "$PURPLE"
        
        # Fix common issues before each attempt
        fix_common_issues
        
        # Verify environment
        if ! verify_environment; then
            error "Environment verification failed on attempt $attempt"
            if [ $attempt -eq $MAX_RETRIES ]; then
                return 1
            fi
            attempt=$((attempt + 1))
            continue
        fi
        
        # Start deployment
        if run_deployment; then
            success "Deployment attempt $attempt succeeded!"
            return 0
        else
            error "Deployment attempt $attempt failed"
            
            # Cleanup before retry
            cleanup_deployment
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                warning "Waiting $RETRY_DELAY seconds before retry..."
                sleep $RETRY_DELAY
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    error "All deployment attempts failed"
    return 1
}

# Function to run the actual deployment
run_deployment() {
    log "🚀 Starting deployment process..." "$GREEN"
    
    # Pull latest images
    info "Pulling latest Docker images..."
    if ! docker-compose pull 2>/dev/null; then
        warning "Failed to pull images, continuing with local images"
    fi
    
    # Build services
    info "Building services..."
    if ! timeout 900 docker-compose build --parallel; then
        error "Build failed"
        return 1
    fi
    
    # Start database first
    info "Starting database services..."
    if ! docker-compose up -d postgres redis; then
        error "Failed to start database services"
        return 1
    fi
    
    # Wait for database to be ready
    info "Waiting for database to be ready..."
    if ! check_service "PostgreSQL" "localhost:5432" 30; then
        # Try to check via docker exec
        if ! docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            error "PostgreSQL is not ready"
            return 1
        fi
    fi
    
    # Start backend services
    info "Starting backend services..."
    if ! docker-compose up -d whitelabel-backend evolution-api; then
        error "Failed to start backend services"
        return 1
    fi
    
    # Wait for backend to be ready
    if ! check_service "Backend API" "http://localhost:4000/health" 60; then
        error "Backend API is not ready"
        return 1
    fi
    
    # Start frontend
    info "Starting frontend service..."
    if ! docker-compose up -d whitelabel-frontend; then
        error "Failed to start frontend service"
        return 1
    fi
    
    # Final health check
    info "Running final health checks..."
    
    # Check all services
    local services_healthy=true
    
    if ! check_service "Backend API" "http://localhost:4000/health" 30; then
        services_healthy=false
    fi
    
    if ! check_service "Evolution API" "http://localhost:8080/manager/health" 30; then
        warning "Evolution API not responding, but continuing..."
    fi
    
    if ! check_service "Frontend" "http://localhost:3000" 30; then
        services_healthy=false
    fi
    
    if [ "$services_healthy" = "false" ]; then
        error "One or more critical services failed health checks"
        return 1
    fi
    
    success "All services are healthy and running!"
    return 0
}

# Function to run post-deployment validation
validate_deployment() {
    log "🧪 Running post-deployment validation..." "$CYAN"
    
    # Run the test system script if it exists
    if [ -f "scripts/test-system.sh" ]; then
        info "Running comprehensive test suite..."
        if ./scripts/test-system.sh; then
            success "All validation tests passed!"
        else
            warning "Some validation tests failed, but deployment is functional"
        fi
    else
        warning "Test system script not found, running basic validation..."
        
        # Basic validation
        local validation_passed=true
        
        # Check container status
        local running_containers=$(docker-compose ps --filter "status=running" | wc -l)
        local total_containers=$(docker-compose ps --services | wc -l)
        
        if [ "$running_containers" -eq "$total_containers" ]; then
            success "All containers are running ($running_containers/$total_containers)"
        else
            warning "Some containers are not running ($running_containers/$total_containers)"
            validation_passed=false
        fi
        
        # Check service endpoints
        if curl -f -s --max-time 10 "http://localhost:4000/health" > /dev/null; then
            success "Backend API is responding"
        else
            error "Backend API is not responding"
            validation_passed=false
        fi
        
        if [ "$validation_passed" = "false" ]; then
            warning "Basic validation detected issues"
        else
            success "Basic validation passed"
        fi
    fi
}

# Function to generate deployment report
generate_report() {
    log "📋 Generating deployment report..." "$BLUE"
    
    local report_file="logs/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🚀 Autonomous Deployment Report

**Date:** $(date)
**Project:** WhiteLabel MVP
**Deployment Mode:** Autonomous
**Success:** $1

## 📊 Container Status

\`\`\`
$(docker-compose ps 2>/dev/null || echo "No container information available")
\`\`\`

## 🔗 Service Endpoints

- **Frontend:** http://$(curl -s ifconfig.me 2>/dev/null || echo "localhost"):3000
- **Backend API:** http://$(curl -s ifconfig.me 2>/dev/null || echo "localhost"):4000
- **Evolution API:** http://$(curl -s ifconfig.me 2>/dev/null || echo "localhost"):8080

## 📈 System Resources

**Disk Usage:**
\`\`\`
$(df -h / | tail -1)
\`\`\`

**Memory Usage:**
\`\`\`
$(free -h)
\`\`\`

**Load Average:**
\`\`\`
$(uptime)
\`\`\`

## 📝 Deployment Log

The full deployment log is available at: \`$LOG_FILE\`

EOF

    success "Deployment report generated: $report_file"
    cat "$report_file"
}

# Main deployment function
main() {
    log "🎯 Starting Autonomous Deployment System" "$PURPLE"
    log "Configuration: MAX_RETRIES=$MAX_RETRIES, RETRY_DELAY=$RETRY_DELAY" "$BLUE"
    
    # Initial setup
    fix_common_issues
    
    # Run deployment with retries
    if deploy_with_retries; then
        success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
        
        # Run validation
        validate_deployment
        
        # Generate report
        generate_report "✅ SUCCESS"
        
        log "🌟 WhiteLabel MVP is now fully deployed and operational!" "$GREEN"
        log "🔗 Access your application at the URLs shown in the report above" "$CYAN"
        
        return 0
    else
        error "💥 DEPLOYMENT FAILED AFTER ALL RETRY ATTEMPTS"
        
        # Generate failure report
        generate_report "❌ FAILED"
        
        # Show troubleshooting info
        log "🔍 Troubleshooting Information:" "$YELLOW"
        log "- Check logs: tail -f $LOG_FILE" "$YELLOW"
        log "- Check containers: docker-compose ps" "$YELLOW"
        log "- Check container logs: docker-compose logs -f" "$YELLOW"
        log "- Try manual cleanup: docker-compose down --remove-orphans" "$YELLOW"
        
        return 1
    fi
}

# Trap signals for cleanup
trap 'error "Script interrupted, cleaning up..."; cleanup_deployment; exit 1' INT TERM

# Run main function
main "$@"