#!/bin/bash

# CyberCache Startup Script
# Starts both backend and frontend servers

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "========================================"
echo "🚀 Starting CyberCache"
echo "========================================"

# Check if already running
if [ -f "$PROJECT_DIR/.cybercache.pid" ]; then
    echo "⚠️  CyberCache appears to be already running"
    echo "   If this is incorrect, run: ./scripts/stop.sh"
    exit 1
fi

# Start Backend
echo ""
echo "📦 Starting Backend API..."
cd "$PROJECT_DIR/backend"

# Activate virtual environment and start backend in background
source venv/bin/activate
nohup python app.py > "$PROJECT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/.backend.pid"
echo "   ✓ Backend started (PID: $BACKEND_PID)"
echo "   📍 API running at: http://localhost:5000"

# Wait for backend to start
echo "   ⏳ Waiting for backend to initialize..."
sleep 3

# Check if backend is responding
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✓ Backend is healthy"
else
    echo "   ⚠️  Backend may not be responding yet (this is sometimes normal)"
fi

# Start Frontend
echo ""
echo "🎨 Starting Frontend Dev Server..."
cd "$PROJECT_DIR/frontend"

nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_DIR/.frontend.pid"
echo "   ✓ Frontend started (PID: $FRONTEND_PID)"
echo "   📍 Web app running at: http://localhost:3000"

# Save combined PID file
echo "$BACKEND_PID,$FRONTEND_PID" > "$PROJECT_DIR/.cybercache.pid"

echo ""
echo "========================================"
echo "✅ CyberCache is now running!"
echo "========================================"
echo ""
echo "📱 Open your browser to: http://localhost:3000"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    tail -f logs/backend.log logs/frontend.log"
echo "   Stop servers: ./scripts/stop.sh"
echo "   Restart:      ./scripts/restart.sh"
echo ""
echo "💡 Logs are saved to:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
