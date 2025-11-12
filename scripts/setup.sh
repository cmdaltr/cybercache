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

# Get the project root directory (parent of scripts/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Install Python dependencies
echo "Installing Python dependencies..."
cd "$PROJECT_DIR/backend"
if pip install -r requirements.txt; then
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install Python dependencies${NC}"
    exit 1
fi

echo ""

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd "$PROJECT_DIR/frontend"
if npm install; then
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install Node.js dependencies${NC}"
    exit 1
fi

echo ""

# Create necessary directories
echo "Creating directories..."
cd "$PROJECT_DIR"
mkdir -p content uploads logs
echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "To start CyberCache, simply run:"
echo ""
echo -e "${GREEN}  ./start${NC}"
echo ""
echo "Then open your browser to: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}Happy organizing! 🛡️${NC}"
