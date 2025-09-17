# 🚀 AUTONOMOUS DEPLOYMENT INSTRUCTIONS

## 📋 Quick Start Commands for EC2

### 1. **Immediate Fix Script** (Recommended)
Run this on your EC2 instance to automatically fix and deploy:

```bash
# Navigate to project directory
cd /opt/whitelabel

# Run the autonomous fix script
./scripts/deploy-ec2-fix.sh
```

### 2. **Manual Step-by-Step** (If script fails)

```bash
# 1. Stop existing containers
docker-compose down --remove-orphans

# 2. Rebuild backend with OpenSSL fix
docker-compose build --no-cache backend

# 3. Start services in order
docker-compose up -d postgres redis
sleep 30

# 4. Run migrations
docker-compose run --rm backend npx prisma migrate deploy

# 5. Seed database
docker-compose run --rm backend npm run seed

# 6. Start backend
docker-compose up -d backend

# 7. Test login
curl -X POST http://18.217.14.91:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}'
```

## ✅ What was Fixed

### 1. **Dockerfile OpenSSL Compatibility**
- Added `openssl` and `openssl-dev` to Alpine packages
- Updated `postgresql-client` to `postgresql15-client`
- Added `libc6-compat` for better Node.js compatibility

### 2. **Database Seeding**
- Created test user with exact credentials from test case
- Email: `novo.usuario@exemplo.com`
- Password: `SenhaSegura@123`

### 3. **Service Configuration**
- Updated docker-compose.yml service names for consistency
- Fixed webhook URLs to use correct backend service name

### 4. **Autonomous Scripts**
- `deploy-ec2-fix.sh`: Complete EC2 deployment and fix script
- `deploy-autonomous.sh`: Local development deployment script

## 🎯 Success Verification

After running the fix script, you should see:
1. ✅ All containers running healthy
2. ✅ Backend responding at `/health`
3. ✅ Login endpoint returning JWT token

**Test the login:**
```bash
curl -X POST http://18.217.14.91:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"novo.usuario@exemplo.com","password":"SenhaSegura@123"}'
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "novo.usuario@exemplo.com",
    "name": "Novo Usuario",
    "role": "user"
  },
  "token": "eyJ...",
  "company": {
    "id": "...",
    "name": "Test Company",
    "slug": "test-company"
  }
}
```

## 🔍 Troubleshooting

### If login still fails:
1. Check backend logs: `docker-compose logs backend`
2. Verify database: `docker-compose exec postgres pg_isready`
3. Test health endpoint: `curl http://localhost:4000/health`

### Common Issues:
- **500 Error**: Usually Prisma/OpenSSL issue → Run the fix script
- **404 Error**: Service not running → Check `docker-compose ps`
- **Connection refused**: Port not exposed → Check firewall settings

## 📞 Support Commands

```bash
# Check container status
docker-compose ps

# View backend logs
docker-compose logs --tail=50 backend

# Restart just backend
docker-compose restart backend

# Full system restart
docker-compose down && docker-compose up -d
```