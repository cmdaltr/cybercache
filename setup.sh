#!/bin/bash

# OneStopCyberShop v2.0 Setup Script

echo "=================================="
echo "CyberCache Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Python
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.10 or higher.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Check for Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"

echo ""
echo "=================================="
echo "Installing Dependencies"
echo "=================================="
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
if pip install -r requirements.txt; then
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install Python dependencies${NC}"
    exit 1
fi
cd ..

echo ""

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd frontend
if npm install; then
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install Node.js dependencies${NC}"
    exit 1
fi
cd ..

echo ""

# Create necessary directories
echo "Creating directories..."
mkdir -p content uploads
echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "To start the application, use the management scripts:"
echo ""
echo -e "${YELLOW}Quick Start:${NC}"
echo "  ./scripts/start.sh"
echo ""
echo -e "${YELLOW}Other Commands:${NC}"
echo "  ./scripts/status.sh   # Check if running"
echo "  ./scripts/logs.sh     # View live logs"
echo "  ./scripts/stop.sh     # Stop servers"
echo "  ./scripts/restart.sh  # Restart servers"
echo ""
echo -e "${YELLOW}Or manually in separate terminals:${NC}"
echo "  Terminal 1: cd backend && source venv/bin/activate && python app.py"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open your browser to: http://localhost:3000"
echo ""
echo -e "${GREEN}Happy organizing! 🛡️${NC}"
