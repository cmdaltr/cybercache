#!/bin/bash

# CyberCache Stop Script
# Stops both backend and frontend servers

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "========================================"
echo "🛑 Stopping CyberCache"
echo "========================================"

# Check if PID files exist
if [ ! -f "$PROJECT_DIR/.cybercache.pid" ]; then
    echo "⚠️  No PID file found. CyberCache may not be running."

    # Try to find processes anyway
    echo ""
    echo "🔍 Searching for running processes..."

    # Find backend processes
    BACKEND_PIDS=$(pgrep -f "python.*app.py" 2>/dev/null || true)
    if [ ! -z "$BACKEND_PIDS" ]; then
        echo "   Found backend process(es): $BACKEND_PIDS"
        kill $BACKEND_PIDS 2>/dev/null || true
        echo "   ✓ Backend stopped"
    fi

    # Find frontend processes
    FRONTEND_PIDS=$(pgrep -f "vite.*frontend" 2>/dev/null || true)
    if [ ! -z "$FRONTEND_PIDS" ]; then
        echo "   Found frontend process(es): $FRONTEND_PIDS"
        kill $FRONTEND_PIDS 2>/dev/null || true
        echo "   ✓ Frontend stopped"
    fi

    if [ -z "$BACKEND_PIDS" ] && [ -z "$FRONTEND_PIDS" ]; then
        echo "   No CyberCache processes found"
    fi

    exit 0
fi

# Read PIDs from file
PIDS=$(cat "$PROJECT_DIR/.cybercache.pid")
BACKEND_PID=$(echo $PIDS | cut -d',' -f1)
FRONTEND_PID=$(echo $PIDS | cut -d',' -f2)

echo ""
echo "📦 Stopping Backend (PID: $BACKEND_PID)..."
if kill $BACKEND_PID 2>/dev/null; then
    echo "   ✓ Backend stopped"
else
    echo "   ⚠️  Backend process not found (may have already stopped)"
fi

# Clean up backend PID file
rm -f "$PROJECT_DIR/.backend.pid"

echo ""
echo "🎨 Stopping Frontend (PID: $FRONTEND_PID)..."
if kill $FRONTEND_PID 2>/dev/null; then
    echo "   ✓ Frontend stopped"
else
    echo "   ⚠️  Frontend process not found (may have already stopped)"
fi

# Clean up frontend PID file
rm -f "$PROJECT_DIR/.frontend.pid"

# Clean up main PID file
rm -f "$PROJECT_DIR/.cybercache.pid"

echo ""
echo "========================================"
echo "✅ CyberCache stopped successfully"
echo "========================================"
echo ""
