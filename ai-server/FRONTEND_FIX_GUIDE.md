# Frontend Crash Fix Guide

## Problem
Frontend crashes/lags when clicking advisor due to backend connectivity issues.

## Root Causes
1. **Port Mismatch**: Frontend connects to port 4001, backend runs on port 8000
2. **Missing Auth Endpoints**: Login endpoint wasn't available
3. **Database Connection**: PostgreSQL not running

## Immediate Fixes

### 1. Fix Frontend Port Configuration

In your React frontend, update the API base URL from:
```javascript
// OLD - WRONG
const response = await fetch("http://localhost:4001/login", {
```

To:
```javascript
// NEW - CORRECT
const response = await fetch("http://localhost:8000/api/login", {
```

**Find and replace in ALL frontend files:**
- `http://localhost:4001` → `http://localhost:8000/api`
- Make sure all API calls use the `/api` prefix

### 2. Start the Backend Server

```bash
cd /Users/maksbraziewicz/Desktop/logistics-dashboard/ai-server
python3 main.py
```

The server should start on port 8000 and show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Start PostgreSQL Database

Try these commands in order:
```bash
# Option 1: Homebrew service
brew services start postgresql

# Option 2: Direct start
pg_ctl -D /usr/local/var/postgres start

# Option 3: Alternative path
pg_ctl -D /opt/homebrew/var/postgres start

# Option 4: Check if already running
psql -U postgres -c "SELECT 1;"
```

### 4. Test the Connection

Once both are running, test:
```bash
# Test server
curl http://localhost:8000/

# Test login endpoint
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

## Frontend Code Changes Needed

### Update API Base URL
Create or update your API configuration file:

```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }
  
  return response.json();
};
```

### Update Login Component
```javascript
// components/Login.jsx
import { apiCall } from '../config/api';

const handleLogin = async () => {
  try {
    const response = await apiCall('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // Handle successful login
    console.log('Login successful:', response);
  } catch (error) {
    console.error('Login failed:', error);
    // Handle error appropriately
  }
};
```

### Update All API Calls
Replace all instances of:
```javascript
// OLD
fetch("http://localhost:4001/some-endpoint"

// NEW
fetch("http://localhost:8000/api/some-endpoint"
```

## Available Endpoints

Your backend now provides these endpoints:

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Chat & AI
- `POST /api/chat` - Main chat interface
- `POST /api/financial-chat` - Financial advisory chat
- `GET /api/chat-history/{user_id}` - Chat history

### Decision Tree
- `POST /api/decision-tree` - Process decision tree steps
- `POST /api/decision-tree/question` - Get next question
- `POST /api/decision-tree/report` - Generate reports
- `POST /api/decision-tree/reset` - Reset tree

### User Profile
- `GET /api/user-profile/{user_id}` - Get user profile
- `POST /api/profile-form` - Process profile form

## Debugging Steps

### 1. Check Server Status
```bash
curl http://localhost:8000/
# Should return: {"message": "Welcome to FinApp API..."}
```

### 2. Check Database Connection
```bash
psql -U postgres -c "SELECT version();"
```

### 3. Check Frontend Network Tab
- Open browser DevTools → Network tab
- Try clicking advisor
- Look for failed requests (red entries)
- Check if requests go to correct port (8000, not 4001)

### 4. Check Console Errors
- Open browser DevTools → Console tab
- Look for JavaScript errors
- Check for CORS errors

## Common Error Messages & Solutions

### "Failed to fetch"
- **Cause**: Backend not running or wrong port
- **Fix**: Start backend on port 8000, update frontend URLs

### "CORS error"
- **Cause**: Cross-origin request blocked
- **Fix**: Backend already has CORS enabled, check URL format

### "500 Internal Server Error"
- **Cause**: Database connection issue
- **Fix**: Start PostgreSQL database

### "404 Not Found"
- **Cause**: Wrong endpoint URL
- **Fix**: Add `/api` prefix to all endpoints

## Quick Test Script

Save this as `test-connection.js` and run with `node test-connection.js`:

```javascript
const fetch = require('node-fetch');

async function testConnection() {
  try {
    // Test server
    const serverResponse = await fetch('http://localhost:8000/');
    console.log('✅ Server:', await serverResponse.text());
    
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'test' })
    });
    console.log('✅ Login endpoint status:', loginResponse.status);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

## Next Steps

1. **Immediate**: Update frontend port from 4001 to 8000
2. **Start Services**: Backend server + PostgreSQL
3. **Test**: Use browser DevTools to verify connections
4. **Monitor**: Check server logs for any errors

The advisor should work smoothly once these connectivity issues are resolved!