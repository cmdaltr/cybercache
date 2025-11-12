#!/bin/bash

# CyberCache Restart Script
# Stops and then starts both servers

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================"
echo "🔄 Restarting CyberCache"
echo "========================================"
echo ""

# Stop servers
"$SCRIPT_DIR/stop.sh"

# Wait a moment for ports to be released
echo ""
echo "⏳ Waiting for ports to be released..."
sleep 2

# Start servers
echo ""
"$SCRIPT_DIR/start.sh"
