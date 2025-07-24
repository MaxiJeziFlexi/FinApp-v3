#!/bin/bash

echo "🚀 Starting Logistics Dashboard System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server is running on port 8000${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend server is not running${NC}"
        return 1
    fi
}

# Function to check PostgreSQL
check_postgres() {
    if psql -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
        return 0
    else
        echo -e "${RED}❌ PostgreSQL is not running${NC}"
        return 1
    fi
}

# Check current status
echo "📊 Checking current system status..."
check_service
check_postgres

echo ""
echo "🔧 Starting services..."

# Start PostgreSQL
echo "Starting PostgreSQL..."
if ! check_postgres; then
    # Try different methods to start PostgreSQL
    if command -v brew &> /dev/null; then
        echo "Trying to start PostgreSQL with brew..."
        brew services start postgresql > /dev/null 2>&1 || brew services start postgresql@14 > /dev/null 2>&1
    fi
    
    # Try direct start
    pg_ctl -D /usr/local/var/postgres start > /dev/null 2>&1 || \
    pg_ctl -D /opt/homebrew/var/postgres start > /dev/null 2>&1 || \
    pg_ctl -D /usr/local/var/postgresql@14 start > /dev/null 2>&1
    
    sleep 2
    
    if check_postgres; then
        echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL might need manual start${NC}"
        echo "Try: brew services start postgresql"
    fi
fi

# Start Backend Server
echo "Starting Backend Server..."
if ! check_service; then
    echo "Starting Python backend on port 8000..."
    cd "$(dirname "$0")"
    
    # Check if virtual environment exists
    if [ -d "venv" ]; then
        echo "Activating virtual environment..."
        source venv/bin/activate
    elif [ -d ".venv" ]; then
        echo "Activating virtual environment..."
        source .venv/bin/activate
    fi
    
    # Start the server in background
    python3 main.py > server.log 2>&1 &
    SERVER_PID=$!
    echo "Backend server started with PID: $SERVER_PID"
    
    # Wait a moment for server to start
    sleep 3
    
    if check_service; then
        echo -e "${GREEN}✅ Backend server started successfully${NC}"
        echo "Server logs are being written to server.log"
    else
        echo -e "${RED}❌ Failed to start backend server${NC}"
        echo "Check server.log for errors"
    fi
else
    echo -e "${GREEN}✅ Backend server already running${NC}"
fi

echo ""
echo "🌐 System Status:"
check_service
check_postgres

echo ""
echo "📋 Available endpoints:"
echo "  • Main API: http://localhost:8000/"
echo "  • Login: http://localhost:8000/api/login"
echo "  • Chat: http://localhost:8000/api/chat"
echo "  • Decision Tree: http://localhost:8000/api/decision-tree"

echo ""
echo "🔧 Frontend Fix Required:"
echo "  Update your React app to use: http://localhost:8000/api"
echo "  Instead of: http://localhost:4001"

echo ""
echo "📝 To stop services:"
echo "  • Backend: kill $SERVER_PID (or check server.log for PID)"
echo "  • PostgreSQL: brew services stop postgresql"

echo ""
echo -e "${GREEN}🎉 System startup complete!${NC}"