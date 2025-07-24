#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Logistics Dashboard...${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Check if backend is already running
if check_port 8000; then
    echo -e "${GREEN}✅ Backend already running on port 8000${NC}"
else
    echo -e "${YELLOW}🔧 Starting backend server...${NC}"
    cd ai-server
    
    # Start backend in background
    python3 main.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 5
    
    if check_port 8000; then
        echo -e "${GREEN}✅ Backend started successfully on port 8000${NC}"
    else
        echo -e "${RED}❌ Failed to start backend. Check backend.log for errors${NC}"
    fi
    
    cd ..
fi

echo ""

# Check if frontend is already running
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend already running on port 3000${NC}"
else
    echo -e "${YELLOW}🔧 Starting frontend server...${NC}"
    
    # Start frontend in background
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    sleep 10
    
    if check_port 3000; then
        echo -e "${GREEN}✅ Frontend started successfully on port 3000${NC}"
    else
        echo -e "${RED}❌ Failed to start frontend. Check frontend.log for errors${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📋 Application Status:${NC}"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"

echo ""
echo -e "${BLUE}🔑 Login Credentials:${NC}"
echo "Username: admin"
echo "Password: admin123"

echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "Backend logs: tail -f backend.log"
echo "Frontend logs: tail -f frontend.log"

echo ""
echo -e "${GREEN}🎉 Application started successfully!${NC}"
echo -e "${YELLOW}💡 Open http://localhost:3000 in your browser${NC}"