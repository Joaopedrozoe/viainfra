#!/bin/bash

# ==========================================
# FINAL VERIFICATION SCRIPT
# ==========================================
# Quick test to verify all fixes are working

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verifying Backend Fixes...${NC}"

# Test 1: Check Dockerfile has OpenSSL
echo "1. Checking Dockerfile OpenSSL compatibility..."
if grep -q "openssl" backend/Dockerfile; then
    echo -e "${GREEN}✅ OpenSSL libraries added to Dockerfile${NC}"
else
    echo "❌ OpenSSL not found in Dockerfile"
    exit 1
fi

# Test 2: Check test user seed exists
echo "2. Checking test user seed..."
if [ -f "backend/src/database/seeds/testUser.ts" ]; then
    echo -e "${GREEN}✅ Test user seed file exists${NC}"
else
    echo "❌ Test user seed file missing"
    exit 1
fi

# Test 3: Check deployment scripts
echo "3. Checking deployment scripts..."
if [ -x "scripts/deploy-ec2-fix.sh" ] && [ -x "scripts/deploy-autonomous.sh" ]; then
    echo -e "${GREEN}✅ Deployment scripts are executable${NC}"
else
    echo "❌ Deployment scripts missing or not executable"
    exit 1
fi

# Test 4: Check docker-compose service names
echo "4. Checking docker-compose configuration..."
if grep -q "backend:" docker-compose.yml; then
    echo -e "${GREEN}✅ Docker-compose service names updated${NC}"
else
    echo "❌ Docker-compose service names not updated"
    exit 1
fi

# Test 5: Check backend builds locally
echo "5. Testing backend build..."
cd backend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend TypeScript build successful${NC}"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

echo ""
echo -e "${GREEN}🎉 All verification tests passed!${NC}"
echo ""
echo "📋 Next steps for EC2 deployment:"
echo "1. Upload these changes to your EC2 instance"
echo "2. Run: ./scripts/deploy-ec2-fix.sh"
echo "3. Test: curl -X POST http://18.217.14.91:4000/api/auth/login \\"
echo "   -H 'Content-Type: application/json' \\"
echo "   -d '{\"email\":\"novo.usuario@exemplo.com\",\"password\":\"SenhaSegura@123\"}'"
echo ""
echo -e "${BLUE}🚀 Ready for autonomous deployment!${NC}"