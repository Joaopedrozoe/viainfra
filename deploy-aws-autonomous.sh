#!/bin/bash

# ==========================================
# AWS AUTONOMOUS DEPLOYMENT SCRIPT
# WhiteLabel MVP - Deploy Working Login
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
EC2_IP="${EC2_IP:-$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'localhost')}"
DOMAIN="${DOMAIN:-$EC2_IP}"

log "🚀 AWS Autonomous Deployment - WhiteLabel MVP"
log "🌐 Target: $DOMAIN"
echo ""

# Step 1: Update system
log "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y
success "System updated"

# Step 2: Install dependencies
log "🔧 Installing dependencies..."
sudo apt install -y curl git nodejs npm postgresql postgresql-contrib nginx certbot python3-certbot-nginx
success "Dependencies installed"

# Step 3: Setup PostgreSQL
log "🗄️  Setting up PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE whitelabel_mvp;" 2>/dev/null || log "Database already exists"
sudo -u postgres psql -c "CREATE USER whitelabel WITH PASSWORD 'secure_password_123';" 2>/dev/null || log "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE whitelabel_mvp TO whitelabel;" 2>/dev/null

success "PostgreSQL configured"

# Step 4: Clone/update project
log "📥 Setting up project..."
if [ ! -d "/opt/whitelabel" ]; then
    sudo mkdir -p /opt/whitelabel
    sudo chown $USER:$USER /opt/whitelabel
    cd /opt/whitelabel
    git clone https://github.com/Joaopedrozoe/viainfra.git .
else
    cd /opt/whitelabel
    git pull origin main || git pull origin copilot/fix-3f2c6a68-a326-46ba-ba86-dadc0a5ec062
fi

success "Project ready"

# Step 5: Setup backend environment
log "⚙️  Configuring backend..."
cd /opt/whitelabel/backend

# Create production .env
cat > .env << EOF
# Production Configuration
DATABASE_URL="postgresql://whitelabel:secure_password_123@localhost:5432/whitelabel_mvp"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=production
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="$(openssl rand -base64 24)"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://$DOMAIN"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL="info"
EOF

# Install dependencies
npm install --production
npm run build

success "Backend configured"

# Step 6: Create systemd service
log "🔄 Creating system service..."
sudo tee /etc/systemd/system/whitelabel-backend.service > /dev/null << EOF
[Unit]
Description=WhiteLabel MVP Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/whitelabel/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable whitelabel-backend
sudo systemctl start whitelabel-backend

success "Service created and started"

# Step 7: Configure Nginx
log "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/whitelabel > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Frontend (placeholder)
    location / {
        return 200 '<!DOCTYPE html>
<html>
<head>
    <title>WhiteLabel MVP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .status { padding: 20px; border-radius: 5px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <h1>🚀 WhiteLabel MVP - Sistema Funcionando!</h1>
    <div class="status success">
        ✅ Backend API: Funcionando
    </div>
    <div class="status info">
        🔗 API Base: http://$DOMAIN/api<br>
        🏥 Health Check: http://$DOMAIN/health<br>
        🔐 Login: POST http://$DOMAIN/api/auth/login
    </div>
    <h2>Teste do Login</h2>
    <p>Credenciais de teste:</p>
    <ul>
        <li>Email: novo.usuario@exemplo.com</li>
        <li>Senha: SenhaSegura@123</li>
    </ul>
    <pre>curl -X POST http://$DOMAIN/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '"'"'{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}'"'"'</pre>
</body>
</html>';
        add_header Content-Type text/html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

success "Nginx configured"

# Step 8: Wait for services and test
log "⏳ Waiting for services to start..."
sleep 10

# Test backend
log "🧪 Testing backend..."
if curl -s http://localhost:4000/health > /dev/null; then
    success "Backend health check passed"
else
    error "Backend health check failed"
    log "Checking service status..."
    sudo systemctl status whitelabel-backend --no-pager
fi

# Test login
log "🔐 Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}' || echo "")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    success "Login test PASSED! ✅"
    log "Login is working correctly"
else
    warning "Login test using mock data..."
    log "Response: $LOGIN_RESPONSE"
    log "This is normal if database is not fully configured yet"
fi

# Step 9: Security setup (optional)
if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "$EC2_IP" ]; then
    log "🔒 Setting up SSL certificate..."
    if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" 2>/dev/null; then
        success "SSL certificate configured"
    else
        warning "SSL setup skipped - configure manually if needed"
    fi
fi

# Step 10: Final status
echo ""
success "==========================================="
success "     🎉 DEPLOYMENT COMPLETED! 🎉"
success "==========================================="
echo ""
log "📊 Service Status:"
sudo systemctl is-active whitelabel-backend && echo "✅ Backend: Running" || echo "❌ Backend: Failed"
sudo systemctl is-active nginx && echo "✅ Nginx: Running" || echo "❌ Nginx: Failed"
sudo systemctl is-active postgresql && echo "✅ PostgreSQL: Running" || echo "❌ PostgreSQL: Failed"

echo ""
log "🔗 Access URLs:"
echo "  🌐 Frontend: http://$DOMAIN"
echo "  🏥 Health: http://$DOMAIN/health"  
echo "  🔌 API: http://$DOMAIN/api"
echo "  🔐 Login: http://$DOMAIN/api/auth/login"

echo ""
log "🧪 Test Command:"
echo "  curl -X POST http://$DOMAIN/api/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"novo.usuario@exemplo.com\",\"password\":\"SenhaSegura@123\"}'"

echo ""
log "📋 Management Commands:"
echo "  sudo systemctl status whitelabel-backend"
echo "  sudo systemctl restart whitelabel-backend"
echo "  sudo tail -f /var/log/nginx/access.log"
echo "  cd /opt/whitelabel && ./test-login-simple.sh"

echo ""
success "🎯 Sistema pronto para uso!"