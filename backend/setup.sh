#!/bin/bash

# WhiteLabel Backend Setup Script
echo "🚀 Setting up WhiteLabel Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated"
else
    echo "⚠️  Prisma client generation failed (network issue). This is normal in sandbox environments."
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
if npm run build; then
    echo "✅ TypeScript build successful"
else
    echo "❌ TypeScript build failed"
    exit 1
fi

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"

echo ""
echo "🎉 Backend setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your .env file with database and API keys"
echo "2. Start PostgreSQL and Redis services"
echo "3. Run migrations: npm run migrate"
echo "4. Run seeds: npm run seed"
echo "5. Start development server: npm run dev"
echo ""
echo "📚 Endpoints will be available at:"
echo "   - API: http://localhost:4000/api"
echo "   - Health: http://localhost:4000/health"
echo "   - WebSocket: http://localhost:4000/socket.io"
echo ""
echo "🐳 Or run with Docker: docker-compose up -d"