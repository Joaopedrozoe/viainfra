#!/bin/bash

# ==========================================
# AUTONOMOUS DEPLOYMENT MONITOR
# Real-time deployment progress tracking
# ==========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/whitelabel"
MONITOR_INTERVAL=${MONITOR_INTERVAL:-30}
MAX_MONITOR_TIME=${MAX_MONITOR_TIME:-7200}  # 2 hours

# Ensure we're in the right directory
cd "$PROJECT_DIR" 2>/dev/null || {
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    exit 1
}

# Function to log with timestamp
log_monitor() {
    local message="$1"
    local color="${2:-$GREEN}"
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] $message${NC}"
}

# Function to check deployment progress
check_deployment_progress() {
    local containers_running=$(docker-compose ps --filter "status=running" -q 2>/dev/null | wc -l)
    local containers_total=$(docker-compose ps -q 2>/dev/null | wc -l)
    
    # Service health checks
    local backend_health="❌"
    local frontend_health="❌"
    local database_health="❌"
    local redis_health="❌"
    
    if curl -f -s --max-time 5 "http://localhost:4000/health" > /dev/null 2>&1; then
        backend_health="✅"
    fi
    
    if curl -f -s --max-time 5 "http://localhost:3000" > /dev/null 2>&1; then
        frontend_health="✅"
    fi
    
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        database_health="✅"
    fi
    
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        redis_health="✅"
    fi
    
    # System resources
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    local memory_usage=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $1}' | sed 's/^ *//')
    
    # Display status
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${PURPLE}🚀 AUTONOMOUS DEPLOYMENT MONITOR${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${CYAN}📊 Container Status:${NC} $containers_running/$containers_total running"
    echo -e "${CYAN}🔧 Backend API:${NC} $backend_health"
    echo -e "${CYAN}🌐 Frontend:${NC} $frontend_health"
    echo -e "${CYAN}🗄️  Database:${NC} $database_health"
    echo -e "${CYAN}📡 Redis:${NC} $redis_health"
    echo -e "${CYAN}💾 Disk Usage:${NC} ${disk_usage}%"
    echo -e "${CYAN}🧠 Memory Usage:${NC} ${memory_usage}%"
    echo -e "${CYAN}⚡ CPU Load:${NC} $cpu_load"
    echo -e "${BLUE}===============================================${NC}"
    
    # Calculate deployment readiness score
    local score=0
    [ "$backend_health" = "✅" ] && score=$((score + 30))
    [ "$frontend_health" = "✅" ] && score=$((score + 30))
    [ "$database_health" = "✅" ] && score=$((score + 20))
    [ "$redis_health" = "✅" ] && score=$((score + 10))
    [ $containers_running -ge 3 ] && score=$((score + 10))
    
    if [ $score -ge 80 ]; then
        log_monitor "🎉 DEPLOYMENT SUCCESS! Readiness Score: ${score}% - All critical services operational" "$GREEN"
        return 0
    elif [ $score -ge 50 ]; then
        log_monitor "⚠️  DEPLOYMENT PARTIAL: Readiness Score: ${score}% - Core services running, working on remaining issues" "$YELLOW"
        return 1
    else
        log_monitor "🔄 DEPLOYMENT IN PROGRESS: Readiness Score: ${score}% - Autonomous healing in progress" "$BLUE"
        return 2
    fi
}

# Function to monitor deployment logs
monitor_deployment_logs() {
    local latest_log=$(ls -t logs/autonomous-deploy-*.log 2>/dev/null | head -1)
    if [ -n "$latest_log" ]; then
        local recent_errors=$(tail -20 "$latest_log" | grep -i "error\|failed\|critical" | wc -l)
        if [ $recent_errors -gt 0 ]; then
            log_monitor "⚠️  $recent_errors recent errors detected in deployment log" "$YELLOW"
            echo -e "${YELLOW}Last errors:${NC}"
            tail -20 "$latest_log" | grep -i "error\|failed\|critical" | tail -3
        fi
    fi
}

# Function to provide recommendations
provide_recommendations() {
    local score=$1
    
    if [ $score -lt 50 ]; then
        echo -e "${YELLOW}💡 AUTONOMOUS HEALING RECOMMENDATIONS:${NC}"
        
        # Check if containers are stuck
        local stuck_containers=$(docker ps --filter "status=exited" --format "table {{.Names}}" | grep -v NAMES | wc -l)
        if [ $stuck_containers -gt 0 ]; then
            echo -e "${YELLOW}   🔄 Restarting failed containers...${NC}"
            docker-compose up -d 2>/dev/null || true
        fi
        
        # Check for resource issues
        local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
        if [ $disk_usage -gt 85 ]; then
            echo -e "${YELLOW}   🧹 Cleaning up disk space...${NC}"
            docker system prune -f 2>/dev/null || true
        fi
        
        local memory_usage=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
        if [ $memory_usage -gt 85 ]; then
            echo -e "${YELLOW}   🔄 High memory usage detected, considering restart...${NC}"
        fi
    fi
}

# Main monitoring function
main() {
    log_monitor "🚀 Starting Autonomous Deployment Monitor" "$PURPLE"
    log_monitor "📊 Monitor interval: ${MONITOR_INTERVAL}s, Max time: ${MAX_MONITOR_TIME}s" "$BLUE"
    
    local start_time=$(date +%s)
    local last_success_check=false
    local consecutive_success_checks=0
    
    while true; do
        local current_time=$(date +%s)
        local elapsed_time=$((current_time - start_time))
        
        # Check if max monitor time exceeded
        if [ $elapsed_time -gt $MAX_MONITOR_TIME ]; then
            log_monitor "⏰ Maximum monitoring time reached (${MAX_MONITOR_TIME}s)" "$YELLOW"
            break
        fi
        
        # Perform deployment progress check
        check_deployment_progress
        local progress_result=$?
        
        case $progress_result in
            0)  # Success
                consecutive_success_checks=$((consecutive_success_checks + 1))
                if [ $consecutive_success_checks -ge 3 ]; then
                    log_monitor "🎊 DEPLOYMENT VERIFIED SUCCESSFUL after 3 consecutive successful checks!" "$GREEN"
                    log_monitor "⏱️  Total deployment time: ${elapsed_time} seconds" "$GREEN"
                    exit 0
                fi
                last_success_check=true
                ;;
            1)  # Partial success
                consecutive_success_checks=0
                monitor_deployment_logs
                provide_recommendations 60
                ;;
            2)  # In progress
                consecutive_success_checks=0
                monitor_deployment_logs
                provide_recommendations 30
                ;;
        esac
        
        # Log progress every 5 minutes
        if [ $((elapsed_time % 300)) -eq 0 ] && [ $elapsed_time -gt 0 ]; then
            log_monitor "📈 Progress Update: ${elapsed_time}s elapsed, deployment continues..." "$BLUE"
        fi
        
        sleep $MONITOR_INTERVAL
    done
    
    log_monitor "🏁 Monitoring session completed" "$BLUE"
}

# Handle signals
trap 'log_monitor "Monitor interrupted, exiting gracefully..." "$YELLOW"; exit 0' INT TERM

# Run main function
main "$@"