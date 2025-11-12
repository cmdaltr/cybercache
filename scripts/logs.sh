#!/bin/bash

# CyberCache Logs Viewer
# Shows live logs from both servers

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "========================================"
echo "📋 CyberCache Logs"
echo "========================================"
echo ""
echo "Press Ctrl+C to exit"
echo ""

# Check if logs exist
if [ ! -f "$PROJECT_DIR/logs/backend.log" ] && [ ! -f "$PROJECT_DIR/logs/frontend.log" ]; then
    echo "❌ No log files found"
    echo ""
    echo "💡 Start CyberCache first: ./scripts/start.sh"
    exit 1
fi

# Follow both log files
tail -f "$PROJECT_DIR/logs/backend.log" "$PROJECT_DIR/logs/frontend.log" 2>/dev/null
