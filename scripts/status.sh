#!/bin/bash

# CyberCache Status Script
# Shows the current status of backend and frontend servers

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "========================================"
echo "📊 CyberCache Status"
echo "========================================"
echo ""

# Check PID files
if [ -f "$PROJECT_DIR/.cybercache.pid" ]; then
    PIDS=$(cat "$PROJECT_DIR/.cybercache.pid")
    BACKEND_PID=$(echo $PIDS | cut -d',' -f1)
    FRONTEND_PID=$(echo $PIDS | cut -d',' -f2)

    echo "📦 Backend:"
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "   ✅ Running (PID: $BACKEND_PID)"
        # Check if responding
        if curl -s http://localhost:22244/api/health > /dev/null 2>&1; then
            echo "   ✅ Responding at http://localhost:22244"
        else
            echo "   ⚠️  Process running but not responding"
        fi
    else
        echo "   ❌ Not running (stale PID: $BACKEND_PID)"
    fi

    echo ""
    echo "🎨 Frontend:"
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "   ✅ Running (PID: $FRONTEND_PID)"
        echo "   📍 http://localhost:22243"
    else
        echo "   ❌ Not running (stale PID: $FRONTEND_PID)"
    fi
else
    echo "❌ CyberCache is not running"
    echo ""
    echo "💡 Start it with: ./scripts/start.sh"
fi

echo ""
echo "========================================"

# Show recent log entries if running
if [ -f "$PROJECT_DIR/.cybercache.pid" ]; then
    echo ""
    echo "📋 Recent Backend Logs (last 5 lines):"
    echo "----------------------------------------"
    if [ -f "$PROJECT_DIR/logs/backend.log" ]; then
        tail -n 5 "$PROJECT_DIR/logs/backend.log"
    else
        echo "   No log file found"
    fi

    echo ""
    echo "📋 Recent Frontend Logs (last 5 lines):"
    echo "----------------------------------------"
    if [ -f "$PROJECT_DIR/logs/frontend.log" ]; then
        tail -n 5 "$PROJECT_DIR/logs/frontend.log"
    else
        echo "   No log file found"
    fi
fi

echo ""
