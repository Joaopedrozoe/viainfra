# Deployment Guide - WhiteLabel Backend

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start services (if not using Docker)
# PostgreSQL on port 5432
# Redis on port 6379

# 4. Run database setup
npm run generate
npm run migrate
npm run seed

# 5. Start development server
npm run dev
```

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Deploy
```bash
# From project root
docker-compose up -d
```

This will start:
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Backend API server
- ✅ Frontend React app
- ✅ Evolution API (WhatsApp)

### Environment Variables

Create `.env` file in project root:

```env
# Required
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
EVOLUTION_API_KEY=your_evolution_api_key

# Optional
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## 🌐 Production Deployment

### Option 1: AWS EC2 with Docker

```bash
# 1. Launch EC2 instance (t3.medium recommended)
# 2. Install Docker and Docker Compose
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER

# 3. Clone repository
git clone <your-repo-url>
cd viainfra

# 4. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 5. Deploy
docker-compose up -d

# 6. Setup SSL (optional)
# Use Let's Encrypt with nginx-proxy
```

### Option 2: Manual Deployment

```bash
# 1. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PostgreSQL 15
sudo apt install postgresql postgresql-contrib

# 3. Install Redis
sudo apt install redis-server

# 4. Setup application
cd backend
npm install
npm run build

# 5. Setup database
npm run migrate
npm run seed

# 6. Setup PM2 (process manager)
npm install -g pm2
pm2 start dist/index.js --name "whitelabel-backend"
pm2 startup
pm2 save
```

## 🔧 Configuration

### Database Setup

```sql
-- Create database
CREATE DATABASE whitelabel_mvp;

-- Create user
CREATE USER whitelabel_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE whitelabel_mvp TO whitelabel_user;
```

### Environment Variables (Production)

```env
# Database
DATABASE_URL="postgresql://whitelabel_user:password@localhost:5432/whitelabel_mvp"

# JWT (Generate strong secret)
JWT_SECRET="your-very-long-random-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=production

# Evolution API
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="your-production-evolution-key"

# Redis
REDIS_URL="redis://localhost:6379"

# CORS
FRONTEND_URL="https://yourdomain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL="info"
```

## 🔐 SSL/HTTPS Setup

### With Nginx + Let's Encrypt

```nginx
# /etc/nginx/sites-available/whitelabel
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring

### Health Checks

```bash
# API Health
curl http://localhost:4000/health

# Database connectivity
curl http://localhost:4000/api/health

# WebSocket
curl -I http://localhost:4000/socket.io/
```

### Logs

```bash
# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log

# Docker logs
docker-compose logs -f whitelabel-backend
```

### PM2 Monitoring

```bash
# Process status
pm2 status

# Logs
pm2 logs

# Restart
pm2 restart whitelabel-backend
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U whitelabel_user -d whitelabel_mvp
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port
   sudo lsof -i :4000
   
   # Kill process
   sudo kill -9 <PID>
   ```

4. **WebSocket Connection Failed**
   - Check CORS settings
   - Verify proxy configuration
   - Check firewall rules

5. **Evolution API Not Working**
   ```bash
   # Check Evolution API logs
   docker-compose logs evolution-api
   
   # Restart Evolution API
   docker-compose restart evolution-api
   ```

## 🔒 Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] Secure database password
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS/SSL enabled
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Environment variables secured
- [ ] Database user with minimal privileges
- [ ] Log rotation configured

## 📈 Performance Optimization

### Production Settings

```env
# Increase connection pool
DATABASE_POOL_SIZE=20

# Optimize rate limiting
RATE_LIMIT_MAX_REQUESTS=1000

# Enable compression
COMPRESSION_ENABLED=true

# Configure Redis memory
REDIS_MAX_MEMORY=512mb
```

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'whitelabel-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

## 🔄 Backup & Recovery

### Database Backup

```bash
# Create backup
pg_dump whitelabel_mvp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql whitelabel_mvp < backup_file.sql

# Automated backup (crontab)
0 2 * * * pg_dump whitelabel_mvp > /backups/whitelabel_$(date +%Y%m%d).sql
```

### Redis Backup

```bash
# Manual backup
redis-cli --rdb /backup/dump.rdb

# Restore
cp dump.rdb /var/lib/redis/
sudo systemctl restart redis
```

## 📞 Support

For technical support:
- Check logs: `logs/` directory
- API documentation: `/api/health`
- WebSocket test: `/socket.io`
- Evolution API: Port 8080