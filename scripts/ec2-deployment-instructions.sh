#!/bin/bash

# ==========================================
# EC2 DEPLOYMENT INSTRUCTIONS
# WhiteLabel MVP - OpenSSL/Prisma Fix
# ==========================================

echo "==========================================="
echo "🚀 EC2 DEPLOYMENT INSTRUCTIONS"
echo "   OpenSSL/Prisma Compatibility Fix"
echo "==========================================="
echo ""

echo "📋 STEP-BY-STEP EXECUTION ON EC2:"
echo ""

echo "1. 🔄 Connect to your EC2 instance:"
echo "   ssh -i your-key.pem ubuntu@18.217.14.91"
echo ""

echo "2. 📂 Navigate to project directory:"
echo "   cd /opt/whitelabel"
echo ""

echo "3. 📥 Pull latest changes:"
echo "   git pull origin main"
echo "   # OR if you're on a specific branch:"
echo "   git pull origin copilot/fix-66da5f2b-8a3f-476c-93ec-fbade2384557"
echo ""

echo "4. 🔧 Execute the backend fix script:"
echo "   chmod +x scripts/fix-backend-deploy.sh"
echo "   ./scripts/fix-backend-deploy.sh"
echo ""

echo "5. ✅ Validate the deployment:"
echo "   scripts/validate-login.sh"
echo ""

echo "==========================================="
echo "📝 ALTERNATIVE: MANUAL STEP-BY-STEP"
echo "==========================================="
echo ""

echo "If the automated script fails, execute manually:"
echo ""

echo "🛑 Stop containers:"
echo "   docker-compose down"
echo ""

echo "🔨 Rebuild backend with OpenSSL fix:"
echo "   docker-compose build --no-cache whitelabel-backend"
echo ""

echo "🚀 Start services:"
echo "   docker-compose up -d postgres redis"
echo "   sleep 10"
echo "   docker-compose up -d whitelabel-backend"
echo "   sleep 30"
echo "   docker-compose up -d"
echo ""

echo "📊 Run database migrations and seeds:"
echo "   docker-compose exec whitelabel-backend npx prisma migrate deploy"
echo "   docker-compose exec whitelabel-backend npm run seed"
echo ""

echo "🧪 Test the login endpoint:"
echo "   curl -X POST http://localhost:4000/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"novo.usuario@exemplo.com\",\"password\":\"SenhaSegura@123\"}'"
echo ""

echo "==========================================="
echo "🔍 TROUBLESHOOTING"
echo "==========================================="
echo ""

echo "If login still fails, check these:"
echo ""

echo "📋 1. Check container status:"
echo "   docker-compose ps"
echo ""

echo "📋 2. Check backend logs:"
echo "   docker-compose logs -f whitelabel-backend"
echo ""

echo "📋 3. Check Prisma errors:"
echo "   docker-compose logs whitelabel-backend | grep -i prisma"
echo ""

echo "📋 4. Check OpenSSL in container:"
echo "   docker-compose exec whitelabel-backend sh -c 'ls -la /usr/lib/libssl*'"
echo "   docker-compose exec whitelabel-backend sh -c 'ldd node_modules/.prisma/client/libquery_engine.so.node'"
echo ""

echo "📋 5. Test database connection:"
echo "   docker-compose exec postgres psql -U postgres -d whitelabel_mvp -c '\\dt'"
echo ""

echo "==========================================="
echo "🎯 SUCCESS CRITERIA"
echo "==========================================="
echo ""

echo "✅ The deployment is successful when:"
echo "   • Backend health check returns 200 OK"
echo "   • Login endpoint returns 200 with JWT token"
echo "   • No Prisma OpenSSL errors in logs"
echo "   • All containers show 'healthy' status"
echo ""

echo "🧪 Final test command:"
echo "   curl -X POST http://18.217.14.91:4000/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"novo.usuario@exemplo.com\",\"password\":\"SenhaSegura@123\"}'"
echo ""

echo "Expected response:"
echo "   HTTP 200 OK with JSON containing 'token' field"
echo ""

echo "==========================================="
echo "✅ EXECUTION READY"
echo "==========================================="
echo ""
echo "Copy and execute the commands above on your EC2 instance."
echo "The OpenSSL compatibility fix has been applied to the Dockerfile."
echo ""