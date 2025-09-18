#!/bin/bash

# ==========================================
# LOCAL DEVELOPMENT SETUP SCRIPT
# WhiteLabel MVP - Complete Local Setup
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

log "🚀 Starting WhiteLabel MVP Local Development Setup"
echo ""

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    error "This script must be run from the project root directory"
    exit 1
fi

log "📂 Checking project structure..."
success "Project root found"

# Step 2: Setup backend environment
log "🔧 Setting up backend environment..."
cd backend

if [ ! -f ".env" ]; then
    log "Creating backend .env file..."
    cp .env.example .env
    success "Backend .env created"
else
    log "Backend .env already exists"
fi

# Step 3: Install backend dependencies
log "📦 Installing backend dependencies..."
if ! npm install --no-optional 2>/dev/null; then
    warning "Network issues detected, trying local installation..."
    # Try to use any existing node_modules
    if [ ! -d "node_modules" ]; then
        error "Unable to install dependencies and no existing node_modules found"
        error "Please ensure internet connection or run 'npm install' manually"
        exit 1
    else
        warning "Using existing node_modules"
    fi
else
    success "Backend dependencies installed"
fi

# Step 4: Setup database (if PostgreSQL is available)
log "🗄️  Setting up database..."
if command -v psql >/dev/null 2>&1; then
    # Check if PostgreSQL service is running
    if pg_isready -q 2>/dev/null; then
        log "PostgreSQL is running, setting up database..."
        
        # Create database if it doesn't exist
        if ! psql -lqt | cut -d \| -f 1 | grep -qw whitelabel_mvp; then
            log "Creating whitelabel_mvp database..."
            createdb whitelabel_mvp 2>/dev/null || {
                log "Trying to create database with postgres user..."
                sudo -u postgres createdb whitelabel_mvp 2>/dev/null || {
                    warning "Could not create database automatically"
                    log "Please create the database manually:"
                    log "  createdb whitelabel_mvp"
                }
            }
        else
            log "Database whitelabel_mvp already exists"
        fi
        
        success "Database setup complete"
    else
        warning "PostgreSQL is not running"
        log "Please start PostgreSQL service:"
        log "  sudo systemctl start postgresql"
        log "  # or"
        log "  sudo service postgresql start"
    fi
else
    warning "PostgreSQL not found"
    log "Please install PostgreSQL:"
    log "  sudo apt update && sudo apt install postgresql postgresql-contrib"
fi

# Step 5: Try to generate Prisma client (skip if network issues)
log "🔄 Setting up Prisma..."
if npx prisma generate 2>/dev/null; then
    success "Prisma client generated"
    
    # Try to run migrations
    log "Running database migrations..."
    if npx prisma migrate dev --name init 2>/dev/null; then
        success "Database migrations completed"
    else
        warning "Migration failed - database might not be accessible"
    fi
else
    warning "Prisma generation failed (likely network issues)"
    log "You may need to run this manually when online:"
    log "  cd backend && npx prisma generate"
    log "  npx prisma migrate dev"
fi

# Step 6: Create a simple test endpoint that doesn't require database
log "🧪 Creating diagnostic test endpoint..."
cat > src/routes/test.ts << 'EOF'
import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

/**
 * @route GET /test/health
 * @desc Simple health check without database
 * @access Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @route POST /test/echo
 * @desc Echo back request data for testing
 * @access Public
 */
router.post('/echo', (req: Request, res: Response) => {
  res.json({
    message: 'Echo test successful',
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
});

export default router;
EOF

log "Adding test routes to main router..."
# Add test routes to main routes file
if ! grep -q "test" src/routes/index.ts 2>/dev/null; then
    if [ -f "src/routes/index.ts" ]; then
        # Backup original
        cp src/routes/index.ts src/routes/index.ts.backup
        
        # Add test routes
        sed -i '/import.*auth/a import testRoutes from '\''./test'\'';' src/routes/index.ts
        sed -i '/router.use.*auth/a router.use('\''/test'\'', testRoutes);' src/routes/index.ts
        
        success "Test routes added"
    else
        warning "Could not find routes/index.ts to add test routes"
    fi
fi

cd ..

# Step 7: Create development start script
log "📝 Creating development start script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting WhiteLabel MVP Development Server"
echo ""

# Start backend
echo "Starting backend on port 4000..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo ""
echo "🌐 Available endpoints:"
echo "  - Health Check: http://localhost:4000/health"
echo "  - API Test: http://localhost:4000/api/test/health"
echo "  - Login: http://localhost:4000/api/auth/login"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for backend to start
sleep 3

# Function to cleanup processes
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT

# Keep script running
wait $BACKEND_PID
EOF

chmod +x start-dev.sh

success "Development start script created"

# Step 8: Create simple login test script
log "🧪 Creating login test script..."
cat > test-login-simple.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing WhiteLabel MVP Login"
echo ""

BACKEND_URL="http://localhost:4000"

# Test 1: Health check
echo "1. Testing health endpoint..."
if curl -s "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed - is the server running?"
    echo "   Start it with: ./start-dev.sh"
    exit 1
fi

# Test 2: API health check
echo "2. Testing API health endpoint..."
API_RESPONSE=$(curl -s "$BACKEND_URL/api/test/health" 2>/dev/null)
if echo "$API_RESPONSE" | grep -q "ok"; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    echo "   Response: $API_RESPONSE"
fi

# Test 3: Login endpoint (will fail without database, but should give proper error)
echo "3. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}' 2>/dev/null)

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

if echo "$LOGIN_RESPONSE" | grep -q "error"; then
    echo "✅ Login endpoint is responding (with expected error)"
    echo "   This is normal if database is not set up yet"
else
    echo "❌ Login endpoint gave unexpected response"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Ensure PostgreSQL is running"
echo "2. Run: cd backend && npx prisma migrate dev"
echo "3. Run: npm run seed (if available)"
echo "4. Test login with valid credentials"
EOF

chmod +x test-login-simple.sh

success "Simple login test script created"

echo ""
success "🎉 Local development setup complete!"
echo ""
log "📋 Next steps:"
echo "1. Start the development server:"
echo "   ./start-dev.sh"
echo ""
echo "2. Test the setup:"
echo "   ./test-login-simple.sh"
echo ""
echo "3. If database issues persist:"
echo "   cd backend"
echo "   npx prisma migrate dev"
echo "   npm run seed"
echo ""
log "🔗 Useful URLs:"
echo "  - Backend Health: http://localhost:4000/health"
echo "  - API Test: http://localhost:4000/api/test/health"
echo "  - Login Endpoint: http://localhost:4000/api/auth/login"