#!/bin/bash

# ==========================================
# HEALTH CHECK SCRIPT
# WhiteLabel MVP - Continuous Health Monitoring
# ==========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="$PROJECT_DIR/logs/health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure we're in the right directory
cd "$PROJECT_DIR" 2>/dev/null || {
    echo "[$TIMESTAMP] ❌ Project directory not found: $PROJECT_DIR" >> "$LOG_FILE"
    exit 1
}

# Function to log health status
log_health() {
    local service="$1"
    local status="$2"
    local details="$3"
    echo "[$TIMESTAMP] $status $service $details" >> "$LOG_FILE"
}

# Function to check service health
check_service() {
    local service_name="$1"
    local endpoint="$2"
    local timeout="${3:-5}"
    
    if curl -f -s --max-time "$timeout" "$endpoint" > /dev/null 2>&1; then
        log_health "$service_name" "✅" "Healthy"
        return 0
    else
        log_health "$service_name" "❌" "Unhealthy"
        return 1
    fi
}

# Function to check container health
check_container() {
    local container_name="$1"
    
    if docker-compose ps "$container_name" 2>/dev/null | grep -q "Up"; then
        log_health "Container $container_name" "✅" "Running"
        return 0
    else
        log_health "Container $container_name" "❌" "Not running"
        return 1
    fi
}

# Main health check
main() {
    local issues_found=0
    local critical_issues=0
    
    # Check containers
    local containers=("postgres" "redis" "whitelabel-backend" "whitelabel-frontend" "evolution-api")
    for container in "${containers[@]}"; do
        if ! check_container "$container"; then
            issues_found=$((issues_found + 1))
            if [[ "$container" == "postgres" || "$container" == "whitelabel-backend" ]]; then
                critical_issues=$((critical_issues + 1))
            fi
        fi
    done
    
    # Check service endpoints
    if ! check_service "Backend API" "http://localhost:4000/health" 10; then
        issues_found=$((issues_found + 1))
        critical_issues=$((critical_issues + 1))
    fi
    
    if ! check_service "Evolution API" "http://localhost:8080/manager/health" 10; then
        issues_found=$((issues_found + 1))
    fi
    
    if ! check_service "Frontend" "http://localhost:3000" 5; then
        issues_found=$((issues_found + 1))
    fi
    
    # Check database connectivity
    if ! docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_health "PostgreSQL Connection" "❌" "Not ready"
        issues_found=$((issues_found + 1))
        critical_issues=$((critical_issues + 1))
    else
        log_health "PostgreSQL Connection" "✅" "Ready"
    fi
    
    # Check Redis connectivity
    if ! docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_health "Redis Connection" "❌" "Not responding"
        issues_found=$((issues_found + 1))
    else
        log_health "Redis Connection" "✅" "Responding"
    fi
    
    # System resource checks
    # Disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_health "Disk Space" "❌" "Critical (${DISK_USAGE}%)"
        critical_issues=$((critical_issues + 1))
    elif [ "$DISK_USAGE" -gt 80 ]; then
        log_health "Disk Space" "⚠️" "Warning (${DISK_USAGE}%)"
        issues_found=$((issues_found + 1))
    else
        log_health "Disk Space" "✅" "OK (${DISK_USAGE}%)"
    fi
    
    # Memory usage
    MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
    if [ "$MEMORY_USAGE" -gt 90 ]; then
        log_health "Memory Usage" "❌" "Critical (${MEMORY_USAGE}%)"
        critical_issues=$((critical_issues + 1))
    elif [ "$MEMORY_USAGE" -gt 80 ]; then
        log_health "Memory Usage" "⚠️" "Warning (${MEMORY_USAGE}%)"
        issues_found=$((issues_found + 1))
    else
        log_health "Memory Usage" "✅" "OK (${MEMORY_USAGE}%)"
    fi
    
    # Summary
    if [ "$critical_issues" -gt 0 ]; then
        log_health "OVERALL HEALTH" "❌" "CRITICAL - $critical_issues critical issues found"
        
        # Auto-restart on critical issues (optional)
        if [ "${AUTO_RESTART:-false}" = "true" ]; then
            log_health "AUTO-RESTART" "🔄" "Attempting to restart services..."
            docker-compose restart 2>&1 >> "$LOG_FILE"
        fi
        
        exit 2
    elif [ "$issues_found" -gt 0 ]; then
        log_health "OVERALL HEALTH" "⚠️" "WARNING - $issues_found issues found"
        exit 1
    else
        log_health "OVERALL HEALTH" "✅" "ALL SYSTEMS HEALTHY"
        exit 0
    fi
}

# Run main function
main "$@"