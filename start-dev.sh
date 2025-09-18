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
