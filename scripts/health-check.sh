#!/bin/bash

# ==========================================
# ENHANCED HEALTH CHECK SCRIPT
# WhiteLabel MVP - Autonomous Health Monitoring with Auto-Healing
# ==========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="$PROJECT_DIR/logs/health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
AUTO_RESTART=${AUTO_RESTART:-false}
AUTO_HEAL=${AUTO_HEAL:-true}
MAX_HEAL_ATTEMPTS=${MAX_HEAL_ATTEMPTS:-3}

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
    echo -e "${BLUE}[$TIMESTAMP]${NC} $status $service $details" | tee -a "$LOG_FILE"
}

# Function to log with color
log_color() {
    local message="$1"
    local color="${2:-$GREEN}"
    echo -e "${color}[$TIMESTAMP] $message${NC}" | tee -a "$LOG_FILE"
}

# Function to attempt service healing
heal_service() {
    local service_name="$1"
    local container_name="$2"
    local attempts=0
    
    log_color "🔧 Attempting to heal $service_name..." "$YELLOW"
    
    while [ $attempts -lt $MAX_HEAL_ATTEMPTS ]; do
        attempts=$((attempts + 1))
        log_health "$service_name Healing" "🔄" "Attempt $attempts/$MAX_HEAL_ATTEMPTS"
        
        # Try restarting the specific container
        if docker-compose restart "$container_name" 2>/dev/null; then
            sleep 10
            
            # Check if the service is now healthy
            case "$service_name" in
                "Backend API")
                    if curl -f -s --max-time 10 "http://localhost:4000/health" > /dev/null 2>&1; then
                        log_health "$service_name" "✅" "Healed successfully"
                        return 0
                    fi
                    ;;
                "Evolution API")
                    if curl -f -s --max-time 10 "http://localhost:8080" > /dev/null 2>&1; then
                        log_health "$service_name" "✅" "Healed successfully"
                        return 0
                    fi
                    ;;
                "Frontend")
                    if curl -f -s --max-time 10 "http://localhost:3000" > /dev/null 2>&1; then
                        log_health "$service_name" "✅" "Healed successfully"
                        return 0
                    fi
                    ;;
                *)
                    if docker-compose ps "$container_name" 2>/dev/null | grep -q "Up"; then
                        log_health "$service_name" "✅" "Healed successfully"
                        return 0
                    fi
                    ;;
            esac
        fi
        
        # If restart didn't work, try more aggressive healing
        if [ $attempts -eq 2 ]; then
            log_color "Trying more aggressive healing (rebuild)..." "$YELLOW"
            docker-compose up -d --force-recreate "$container_name" 2>/dev/null || true
            sleep 15
        fi
        
        sleep 5
    done
    
    log_health "$service_name" "❌" "Healing failed after $MAX_HEAL_ATTEMPTS attempts"
    return 1
}

# Function to check service health with auto-healing
check_service() {
    local service_name="$1"
    local endpoint="$2"
    local timeout="${3:-5}"
    local container_name="$4"
    
    if curl -f -s --max-time "$timeout" "$endpoint" > /dev/null 2>&1; then
        log_health "$service_name" "✅" "Healthy"
        return 0
    else
        log_health "$service_name" "❌" "Unhealthy"
        
        # Attempt auto-healing if enabled
        if [ "$AUTO_HEAL" = "true" ] && [ ! -z "$container_name" ]; then
            if heal_service "$service_name" "$container_name"; then
                return 0
            fi
        fi
        
        return 1
    fi
}

# Function to check container health with auto-healing
check_container() {
    local container_name="$1"
    
    if docker-compose ps "$container_name" 2>/dev/null | grep -q "Up"; then
        log_health "Container $container_name" "✅" "Running"
        return 0
    else
        log_health "Container $container_name" "❌" "Not running"
        
        # Attempt auto-healing if enabled
        if [ "$AUTO_HEAL" = "true" ]; then
            log_color "🔧 Attempting to heal container $container_name..." "$YELLOW"
            if docker-compose up -d "$container_name" 2>/dev/null; then
                sleep 10
                if docker-compose ps "$container_name" 2>/dev/null | grep -q "Up"; then
                    log_health "Container $container_name" "✅" "Healed successfully"
                    return 0
                fi
            fi
            log_health "Container $container_name" "❌" "Healing failed"
        fi
        
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
    
    # Check service endpoints with auto-healing
    if ! check_service "Backend API" "http://localhost:4000/health" 10 "whitelabel-backend"; then
        issues_found=$((issues_found + 1))
        critical_issues=$((critical_issues + 1))
    fi
    
    if ! check_service "Evolution API" "http://localhost:8080" 10 "evolution-api"; then
        issues_found=$((issues_found + 1))
    fi
    
    if ! check_service "Frontend" "http://localhost:3000" 5 "whitelabel-frontend"; then
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
    
    # System resource checks with auto-healing
    # Disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_health "Disk Space" "❌" "Critical (${DISK_USAGE}%)"
        critical_issues=$((critical_issues + 1))
        
        # Auto-healing: clean up disk space
        if [ "$AUTO_HEAL" = "true" ]; then
            log_color "🧹 Auto-healing: Cleaning up disk space..." "$YELLOW"
            docker system prune -af --volumes 2>/dev/null || true
            find "$PROJECT_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
            apt-get clean 2>/dev/null || true
            
            # Re-check disk usage
            NEW_DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
            if [ "$NEW_DISK_USAGE" -lt "$DISK_USAGE" ]; then
                log_health "Disk Space" "✅" "Cleaned up: ${NEW_DISK_USAGE}% (was ${DISK_USAGE}%)"
                critical_issues=$((critical_issues - 1))
            fi
        fi
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
        
        # Auto-healing: restart Docker to free memory
        if [ "$AUTO_HEAL" = "true" ]; then
            log_color "🔄 Auto-healing: Restarting Docker to free memory..." "$YELLOW"
            sudo systemctl restart docker
            sleep 30
            
            # Re-check memory usage
            NEW_MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
            if [ "$NEW_MEMORY_USAGE" -lt "$MEMORY_USAGE" ]; then
                log_health "Memory Usage" "✅" "Memory freed: ${NEW_MEMORY_USAGE}% (was ${MEMORY_USAGE}%)"
                critical_issues=$((critical_issues - 1))
            fi
        fi
    elif [ "$MEMORY_USAGE" -gt 80 ]; then
        log_health "Memory Usage" "⚠️" "Warning (${MEMORY_USAGE}%)"
        issues_found=$((issues_found + 1))
    else
        log_health "Memory Usage" "✅" "OK (${MEMORY_USAGE}%)"
    fi
    
    # CPU Load Average
    CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $1}' | sed 's/^ *//')
    CPU_CORES=$(nproc)
    if (( $(echo "$CPU_LOAD > $CPU_CORES" | bc -l 2>/dev/null || echo "0") )); then
        log_health "CPU Load" "⚠️" "High (${CPU_LOAD} on ${CPU_CORES} cores)"
        issues_found=$((issues_found + 1))
    else
        log_health "CPU Load" "✅" "OK (${CPU_LOAD} on ${CPU_CORES} cores)"
    fi
    
    # Summary with enhanced auto-restart logic
    if [ "$critical_issues" -gt 0 ]; then
        log_health "OVERALL HEALTH" "❌" "CRITICAL - $critical_issues critical issues found"
        
        # Enhanced auto-restart on critical issues
        if [ "${AUTO_RESTART:-false}" = "true" ]; then
            log_color "🔄 AUTO-RESTART: Attempting full system restart..." "$PURPLE"
            
            # Stop all services gracefully
            docker-compose down --timeout 30 2>&1 >> "$LOG_FILE" || true
            sleep 15
            
            # Clean up resources
            docker system prune -f 2>&1 >> "$LOG_FILE" || true
            docker network prune -f 2>&1 >> "$LOG_FILE" || true
            
            # Restart all services with retry
            local restart_attempts=0
            while [ $restart_attempts -lt 3 ]; do
                if docker-compose up -d 2>&1 >> "$LOG_FILE"; then
                    log_color "Services restarted successfully" "$GREEN"
                    break
                else
                    restart_attempts=$((restart_attempts + 1))
                    log_color "Restart attempt $restart_attempts failed, retrying..." "$YELLOW"
                    sleep 10
                fi
            done
            
            # Wait and re-check critical services
            sleep 45
            
            # Re-check backend API
            local api_attempts=0
            while [ $api_attempts -lt 6 ]; do
                if curl -f -s --max-time 10 "http://localhost:4000/health" > /dev/null 2>&1; then
                    log_health "AUTO-RESTART" "✅" "Backend API restored"
                    critical_issues=$((critical_issues - 1))
                    break
                else
                    api_attempts=$((api_attempts + 1))
                    if [ $api_attempts -lt 6 ]; then
                        log_color "API check attempt $api_attempts/6 failed, retrying in 10s..." "$YELLOW"
                        sleep 10
                    else
                        log_health "AUTO-RESTART" "❌" "Backend API still failing after restart"
                    fi
                fi
            done
            
            # Final assessment after auto-restart
            if [ "$critical_issues" -eq 0 ]; then
                log_health "AUTO-RESTART" "✅" "All critical issues resolved"
            else
                log_health "AUTO-RESTART" "⚠️" "Some critical issues remain"
            fi
        fi
        
        # In autonomous deployment mode, don't exit with error for auto-healing scenarios
        if [ "${AUTONOMOUS_MODE:-false}" = "true" ] && [ "${AUTO_HEAL:-false}" = "true" ]; then
            log_color "🤖 AUTONOMOUS MODE: Reporting issues but continuing deployment..." "$PURPLE"
            exit 0  # Let autonomous deployment handle the issues
        else
            # Traditional mode - exit with warning code
            exit 1
        fi
    elif [ "$issues_found" -gt 0 ]; then
        log_health "OVERALL HEALTH" "⚠️" "WARNING - $issues_found issues found"
        
        # Generate recommendations for warning state
        log_color "💡 RECOMMENDATIONS:" "$BLUE"
        log_color "  - Monitor system closely for the next 30 minutes" "$BLUE"
        log_color "  - Consider enabling AUTO_HEAL=true for automatic issue resolution" "$BLUE"
        log_color "  - Run health check again in 10 minutes: ./scripts/health-check.sh" "$BLUE"
        
        exit 1
    else
        log_health "OVERALL HEALTH" "✅" "ALL SYSTEMS HEALTHY"
        
        # Additional success information
        UPTIME=$(uptime -p 2>/dev/null || uptime)
        log_health "SYSTEM UPTIME" "ℹ️" "$UPTIME"
        
        # Docker stats summary
        RUNNING_CONTAINERS=$(docker-compose ps --filter "status=running" -q | wc -l)
        TOTAL_CONTAINERS=$(docker-compose ps -q | wc -l)
        log_health "CONTAINERS" "ℹ️" "$RUNNING_CONTAINERS/$TOTAL_CONTAINERS running"
        
        exit 0
    fi
}

# Run main function
main "$@"