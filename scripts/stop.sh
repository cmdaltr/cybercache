#!/bin/bash

# CyberCache Stop Script
echo "Stopping CyberCache..."

# Kill backend (Flask on port 22244)
BACKEND_PIDS=$(lsof -ti :22244 2>/dev/null)
if [ -n "$BACKEND_PIDS" ]; then
    echo "Stopping backend (PIDs: $BACKEND_PIDS)..."
    echo "$BACKEND_PIDS" | xargs kill 2>/dev/null
else
    echo "Backend not running"
fi

# Kill frontend (Vite on port 5173)
FRONTEND_PIDS=$(lsof -ti :5173 2>/dev/null)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "Stopping frontend (PIDs: $FRONTEND_PIDS)..."
    echo "$FRONTEND_PIDS" | xargs kill 2>/dev/null
else
    echo "Frontend not running"
fi

echo "CyberCache stopped"
