#!/bin/bash

# CyberCache Restart Script
cd "$(dirname "$0")"

echo "Restarting CyberCache..."
echo ""

# Stop everything first
./stop.sh

echo ""
sleep 2

# Start everything
./start.sh
