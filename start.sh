#!/bin/bash

# Definition of colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting AutoToll AI Setup & Launch...${NC}"

# 1. Check & Setup Backend
echo -e "${GREEN}[Backend] Checking Python environment...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 could not be found.${NC}"
    exit 1
fi

# Use .venv if it exists, otherwise fall back to venv
if [ -d ".venv" ]; then
    VENV_DIR=".venv"
elif [ -d "venv" ]; then
    VENV_DIR="venv"
else
    echo -e "${RED}Error: No virtual environment found (.venv or venv). Please run:${NC}"
    echo -e "${RED}  python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt${NC}"
    exit 1
fi

# Activate venv
source "$VENV_DIR/bin/activate"

# 2. Check & Setup Frontend
echo -e "${GREEN}[Frontend] Checking Node.js environment...${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm could not be found. Please install Node.js/npm manually.${NC}"
    echo -e "${RED}Example: sudo apt install npm${NC}"
    
    # We can still run the backend if frontend fails, but user asked for "whole program"
    echo -e "${GREEN}[Backend] Launching backend only (frontend checks failed)...${NC}"
    python3 backend/main.py
    exit 1
else
    echo -e "${GREEN}[Frontend] Installing dependencies...${NC}"
    npm install
fi

# 3. Launch Both
echo -e "${GREEN}DTO Launching services...${NC}"

# Trap SIGINT to kill child processes
trap 'kill 0' SIGINT

# Start Backend in background
echo -e "${GREEN}[Backend] Starting Server on http://0.0.0.0:8000${NC}"
python3 backend/main.py &
BACKEND_PID=$!

# Wait for backend to be ready (naive wait)
sleep 2

# Start Frontend
echo -e "${GREEN}[Frontend] Starting Client on http://localhost:3000${NC}"
npm run dev &
FRONTEND_PID=$!

# Launch Brave Browser
echo -e "${GREEN}[Browser] Launching Brave...${NC}"
if command -v brave-browser &> /dev/null; then
    brave-browser http://localhost:3000 &
elif command -v brave &> /dev/null; then
    brave http://localhost:3000 &
else
    echo -e "${RED}Brave browser not found. Trying default browser...${NC}"
    xdg-open http://localhost:3000 &
fi

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
