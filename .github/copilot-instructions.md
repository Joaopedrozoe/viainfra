# WhiteLabel MVP - CRM and WhatsApp Integration System

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test Repository
- Clone repository: `git clone https://github.com/Joaopedrozoe/viainfra.git && cd viainfra`
- Install frontend dependencies: `npm install` -- takes ~5 seconds to complete. NEVER CANCEL: Set timeout to 300+ seconds
- Install backend dependencies: `cd backend && npm install && cd ..` -- takes ~1 second to complete. NEVER CANCEL: Set timeout to 300+ seconds
- Build frontend: `npm run build` -- takes ~10 seconds to complete. Uses Vite for React/TypeScript build. NEVER CANCEL: Set timeout to 600+ seconds
- Build backend: `cd backend && npm run build && cd ..` -- takes ~3 seconds to complete. Uses TypeScript compiler. NEVER CANCEL: Set timeout to 300+ seconds
- Validate system: `./scripts/validate-system.sh` -- comprehensive pre-deployment validation script. NEVER CANCEL: Set timeout to 180+ seconds
- Pull Docker images: `docker compose pull` -- takes ~18 seconds for Evolution API, ~5 seconds for PostgreSQL, ~2 seconds for Redis. NEVER CANCEL: Set timeout to 600+ seconds

### Development Environment
- Start frontend development: `npm run dev` -- serves on http://localhost:8080/ (NOT 5173)
- Start backend development: `cd backend && npm run dev` -- serves on http://localhost:4000/
- Generate environment file: `cp .env.template .env` then edit or use `./scripts/generate-secrets.sh`
- Docker validation: `docker compose config` -- validates docker-compose.yml (uses v2 syntax)
- NEVER use `docker-compose` (hyphenated) - always use `docker compose` (space)

### Required Environment Variables
Essential variables that MUST be set in .env:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key (minimum 32 characters)
- `POSTGRES_PASSWORD` - Database password
- `EVOLUTION_API_KEY` - WhatsApp Evolution API key
- `EVOLUTION_API_URL` - Evolution API endpoint (default: http://evolution-api:8080)

## Validation

### Pre-deployment Validation
- ALWAYS run `./scripts/validate-system.sh` before making changes - reports system readiness
- Current baseline: 22/24 checks pass (91% success rate) - this is acceptable
- Known failing checks: Docker Compose command naming (uses v2 syntax) and missing .env file
- ALWAYS validate builds work: `npm run build && cd backend && npm run build && cd ..`

### Manual Testing Scenarios
After making changes, ALWAYS test these user scenarios:
1. **Frontend loads correctly**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` should return 200
2. **Development server starts**: `npm run dev` should serve on port 8080 without errors
3. **Build process completes**: Both frontend and backend builds should complete successfully
4. **Environment configuration**: `.env` file should be creatable from template

### Health Checks
When services are running:
- Frontend: http://localhost:8080/ (development) or http://localhost:3000/ (production)
- Backend API: http://localhost:4000/health
- Evolution API: http://localhost:8080/manager/health
- Database: PostgreSQL on localhost:5432

## System Architecture

### Frontend Stack
- **React 18** with TypeScript and Vite
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Tanstack Query** for API state management
- Build output: `dist/` directory with optimized assets

### Backend Stack
- **Node.js 18+** with Express and TypeScript
- **Prisma ORM** with PostgreSQL database
- **Redis** for caching and sessions
- **Socket.io** for real-time WebSocket connections
- **JWT** authentication with bcryptjs password hashing
- Build output: `backend/dist/` directory with compiled JavaScript

### Infrastructure
- **Docker Compose** for local development and production deployment
- **Evolution API** (atendai/evolution-api:latest) for WhatsApp integration
- **PostgreSQL 15** as primary database
- **Redis 7** for caching and session storage
- **Nginx** for reverse proxy (production deployments)

## Common Issues and Solutions

### Build Issues
- **Linting failures**: System has ~279 TypeScript linting issues (mainly `any` types) - these do not break builds
- **Node.js environment**: Vite warns about NODE_ENV=production in .env - this is expected and safe
- **Dependencies**: Use `npm ci` for clean installs in production, `npm install` for development

### Docker Issues
- **Command syntax**: Always use `docker compose` (space) not `docker-compose` (hyphen)
- **Compose validation**: Run `docker compose config` to validate docker-compose.yml
- **Missing services**: Evolution API requires PostgreSQL and Redis to be running first

### Development Issues
- **Port conflicts**: Frontend dev server uses port 8080, not the typical 5173
- **Environment variables**: VITE_ prefix required for frontend environment variables
- **Backend connection**: Backend expects to connect to services via Docker container names in production

## Key Project Files

### Build and Configuration
- `package.json` - Frontend dependencies and scripts
- `backend/package.json` - Backend dependencies and scripts
- `vite.config.ts` - Frontend build configuration
- `backend/tsconfig.json` - Backend TypeScript configuration
- `docker-compose.yml` - Multi-service container orchestration
- `eslint.config.js` - Linting configuration (has known issues)

### Environment and Deployment
- `.env.template` - Environment variable template with all required settings
- `scripts/validate-system.sh` - Pre-deployment system validation
- `scripts/test-system.sh` - Comprehensive system testing
- `scripts/generate-secrets.sh` - Secure credential generation
- `scripts/deploy-ec2.sh` - AWS EC2 deployment automation

### Key Source Files
- `src/main.tsx` - Frontend application entry point
- `backend/src/index.ts` - Backend server entry point
- `backend/prisma/schema.prisma` - Database schema definition
- `src/lib/environment.ts` - Frontend environment configuration

## Automation Scripts

The `scripts/` directory contains validated automation:
- `setup-server.sh` - EC2 server preparation (installs Docker, Node.js, security)
- `deploy-ec2.sh` - Full production deployment to AWS EC2
- `test-system.sh` - Multi-category system validation (infrastructure, containers, services)
- `validate-system.sh` - Pre-deployment validation checklist
- `generate-secrets.sh` - Secure password and key generation
- `health-check.sh` - Service health monitoring

All scripts are executable and expect to be run from the repository root directory.

## Testing Strategy

### No Unit Tests Currently
- Backend: `npm run test` returns "No tests found" - this is expected
- Frontend: No test files exist currently
- Focus on integration testing and manual validation

### Integration Testing
- Use `./scripts/test-system.sh` for comprehensive system testing
- Tests cover infrastructure, Docker containers, service connectivity, and health checks
- Acceptable baseline: >90% test pass rate

### Manual Validation Requirements
ALWAYS perform these validations after changes:
1. **Dependencies install cleanly**: `npm install && cd backend && npm install`
2. **Builds complete successfully**: Frontend and backend builds finish without errors
3. **Development servers start**: Frontend on port 8080, backend on port 4000
4. **Environment configurable**: Can copy .env.template to .env and modify settings
5. **Docker configuration valid**: `docker compose config` parses without critical errors

## Production Deployment

### AWS EC2 Quick Deploy
```bash
# Prerequisites: EC2 instance with Docker, domain configured
./scripts/setup-server.sh
./scripts/deploy-ec2.sh
```

### Docker Production
```bash
# Generate secure environment
./scripts/generate-secrets.sh
# Start all services
docker compose up -d
# Verify deployment
./scripts/test-system.sh
```

## Support Documentation

Comprehensive guides available:
- `README.md` - Project overview and quick start
- `INICIO_RAPIDO.md` - 30-minute deployment guide
- `GUIA_DEPLOY_COMPLETO_EC2.md` - Detailed EC2 deployment
- `BACKEND_REQUIREMENTS.md` - Technical specifications
- `DEPLOYMENT_GUIDE.md` - Frontend deployment specifics
- `TESTING_VALIDATION_GUIDE.md` - Complete testing procedures

## Critical Reminders

- **Timeout Settings**: Use 300+ second timeouts for dependency installs, 600+ seconds for builds and Docker operations
- **Docker Image Pulls**: Evolution API is largest image (~18s), PostgreSQL (~5s), Redis (~2s) - budget accordingly
- **Command Validation**: ALWAYS test commands before documenting them - every command in these instructions has been validated
- **Environment Security**: Never commit .env files, always use .env.template as base
- **Docker Syntax**: Use `docker compose` (space) not `docker-compose` (hyphen) - system uses Docker Compose v2
- **Port Configuration**: Frontend dev uses 8080, production uses 3000
- **Build Validation**: ALWAYS verify both frontend and backend builds complete before deployment
- **Expected Baseline**: System validation achieves 88-91% success rate (22-24/24 checks) - minor variations are normal and acceptable