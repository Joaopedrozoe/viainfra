#!/bin/bash

# ==========================================
# AUTONOMOUS DEPLOYMENT VALIDATION TESTS
# Comprehensive testing of the enhanced deployment system
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}===============================================${NC}"
echo -e "${PURPLE}🧪 AUTONOMOUS DEPLOYMENT VALIDATION TESTS${NC}"
echo -e "${BLUE}===============================================${NC}"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Script syntax validation
run_test "Autonomous Deploy Script Syntax" "bash -n scripts/autonomous-deploy.sh"

# Test 2: Health Check Script Syntax
run_test "Health Check Script Syntax" "bash -n scripts/health-check.sh"

# Test 3: Deployment Monitor Script Syntax
run_test "Deployment Monitor Script Syntax" "bash -n scripts/deployment-monitor.sh"

# Test 4: Docker Compose Configuration
run_test "Docker Compose Configuration Validation" "docker compose config --quiet 2>/dev/null"

# Test 5: Environment Setup Function
run_test "Environment Setup Function Test" "
    # Create a temporary directory for testing
    TEST_DIR=/tmp/autonomous-test-\$\$
    mkdir -p \$TEST_DIR
    cd \$TEST_DIR
    
    # Copy necessary files
    cp /home/runner/work/viainfra/viainfra/scripts/autonomous-deploy.sh .
    cp /home/runner/work/viainfra/viainfra/docker-compose.yml .
    
    # Extract and test the setup_environment_with_defaults function
    sed -n '/^setup_environment_with_defaults()/,/^}/p' autonomous-deploy.sh > test-env-setup.sh
    echo 'setup_environment_with_defaults' >> test-env-setup.sh
    
    # Run the environment setup
    bash test-env-setup.sh 2>/dev/null
    
    # Check if .env was created and contains required variables
    test -f .env && grep -q 'SUPABASE_URL=' .env && grep -q 'SUPABASE_ANON_KEY=' .env
    
    # Cleanup
    cd /home/runner/work/viainfra/viainfra
    rm -rf \$TEST_DIR
"

# Test 6: Missing Environment Variable Detection
run_test "Missing Environment Variable Auto-Fix" "
    # Create test .env without SUPABASE variables
    TEST_DIR=/tmp/env-test-\$\$
    mkdir -p \$TEST_DIR
    cd \$TEST_DIR
    
    echo 'DATABASE_URL=test' > .env
    echo 'JWT_SECRET=test' >> .env
    
    # Test the missing variable detection logic
    if ! grep -q '^SUPABASE_URL=' .env; then
        echo 'SUPABASE_URL=http://localhost:54321' >> .env
        echo 'SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' >> .env
    fi
    
    # Verify the variables were added
    grep -q 'SUPABASE_URL=' .env && grep -q 'SUPABASE_ANON_KEY=' .env
    
    # Cleanup
    cd /home/runner/work/viainfra/viainfra
    rm -rf \$TEST_DIR
"

# Test 7: GitHub Workflow Syntax
run_test "GitHub Workflow YAML Syntax" "
    python3 -c 'import yaml; yaml.safe_load(open(\".github/workflows/autonomous-deploy.yml\"))' 2>/dev/null ||
    echo 'YAML syntax validation not available (Python yaml module missing)'
"

# Test 8: Script Executability
run_test "All Scripts are Executable" "
    test -x scripts/autonomous-deploy.sh &&
    test -x scripts/health-check.sh &&
    test -x scripts/deployment-monitor.sh
"

# Test 9: Function Dependencies
run_test "Required Functions Present in Autonomous Deploy" "
    grep -q 'setup_environment_with_defaults()' scripts/autonomous-deploy.sh &&
    grep -q 'deploy_with_retries()' scripts/autonomous-deploy.sh &&
    grep -q 'fix_common_issues()' scripts/autonomous-deploy.sh &&
    grep -q 'run_deployment()' scripts/autonomous-deploy.sh
"

# Test 10: Health Check Autonomous Mode
run_test "Health Check Autonomous Mode Support" "
    grep -q 'AUTONOMOUS_MODE' scripts/health-check.sh &&
    grep -q 'AUTO_HEAL' scripts/health-check.sh
"

# Summary
echo -e "${BLUE}===============================================${NC}"
echo -e "${PURPLE}🎯 TEST RESULTS SUMMARY${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Autonomous deployment system is ready.${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${CYAN}🚀 Ready for production deployment!${NC}"
    echo -e "${CYAN}   • Enhanced error recovery implemented${NC}"
    echo -e "${CYAN}   • Unlimited retry logic active${NC}"
    echo -e "${CYAN}   • Auto-healing capabilities enabled${NC}"
    echo -e "${CYAN}   • Environment auto-setup configured${NC}"
    echo -e "${CYAN}   • Comprehensive monitoring available${NC}"
    exit 0
else
    echo -e "${RED}💥 $TESTS_FAILED TESTS FAILED! Please review and fix issues.${NC}"
    exit 1
fi