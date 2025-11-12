#!/bin/bash
set -e

# CyberCache Docker Entrypoint Script

echo "🗄️  Starting CyberCache..."

# Create data directory if it doesn't exist
mkdir -p /app/data

# Set database path
export DATABASE_PATH=${DATABASE_PATH:-/app/data/cybercache.db}

# Check if database exists
if [ ! -f "$DATABASE_PATH" ]; then
    echo "📦 Initializing new database..."
fi

# Run migrations if needed
if [ -d "/app/content" ] && [ "$(ls -A /app/content)" ]; then
    echo "📁 Content directory found, will auto-import files..."
fi

# Start the Flask application
echo "🚀 Starting Flask server..."
exec python backend/app.py
