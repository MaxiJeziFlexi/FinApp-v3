# Complete Implementation Guide

## 🚨 IMMEDIATE FIX FOR ADVISOR CRASH

Your advisor crashes because the frontend is connecting to the **wrong backend port**. Here's the complete fix:

### Problem Summary
- ❌ Frontend connects to `localhost:4001` 
- ✅ Backend runs on `localhost:8000`
- ❌ Missing `/api` prefix in URLs
- ❌ Incorrect routing after advisor selection

## 🔧 Step-by-Step Fix

### 1. Update Your Frontend Files

Replace these files in your React app with the fixed versions I created:

#### A. API Configuration
**File:** `src/config/api.js`
- Copy from: `frontend-fixes/api.js`
- This fixes all API endpoints to use port 8000

#### B. Login Component  
**File:** `src/components/Login.jsx`
- Copy from: `frontend-fixes/Login.jsx`
- Fixes login to connect to correct backend

#### C. Advisor Selection
**File:** `src/components/AdvisorSelection.jsx`
- Copy from: `frontend-fixes/AdvisorSelection.jsx`
- Fixes advisor click → decision tree navigation

#### D. Decision Tree Component
**File:** `src/components/DecisionTree.jsx`
- Copy from: `frontend-fixes/DecisionTree.jsx`
- Complete decision tree implementation

### 2. Update Your App.js Routing

```javascript
// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AdvisorSelection from './components/AdvisorSelection';
import DecisionTree from './components/DecisionTree';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/advisors" element={<AdvisorSelection />} />
          <Route path="/decision-tree" element={<DecisionTree />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

### 3. Start the Backend Server

```bash
cd /Users/maksbraziewicz/Desktop/logistics-dashboard/ai-server
python3 main.py
```

The server should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 4. Test the Complete Flow

1. **Login** → Should connect to `localhost:8000/api/login`
2. **Select Advisor** → Should start decision tree
3. **Answer Questions** → Should progress through tree
4. **Get Recommendations** → Should show final results

## 🔍 Quick Verification

Run this test to verify everything works:

```bash
cd /Users/maksbraziewicz/Desktop/logistics-dashboard/ai-server
node debug-frontend-issue.js
```

Should show:
- ✅ Backend Port 8000: HTTP 200
- ✅ Login Endpoint (8000): HTTP 422 (expected for empty request)
- ✅ Decision Tree: HTTP 200

## 🎯 The Exact Fix for Your Issue

**Before (BROKEN):**
```javascript
// This connects to wrong service on port 4001
const response = await fetch("http://localhost:4001/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});
```

**After (FIXED):**
```javascript
// This connects to correct AI backend on port 8000
const response = await fetch("http://localhost:8000/api/login", {
  method: "POST", 
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});
```

## 🚀 Complete Flow After Fix

1. **User completes onboarding** ✅
2. **Clicks on advisor** ✅
3. **Frontend calls:** `POST http://localhost:8000/api/decision-tree`
4. **Backend responds** with first question ✅
5. **User redirected** to decision tree page ✅
6. **Decision tree loads** and shows questions ✅
7. **No more crashes!** 🎉

## 📋 Files You Need to Update

1. **Copy these files** from `frontend-fixes/` to your React app:
   - `api.js` ��� `src/config/api.js`
   - `Login.jsx` → `src/components/Login.jsx`
   - `AdvisorSelection.jsx` → `src/components/AdvisorSelection.jsx`
   - `DecisionTree.jsx` → `src/components/DecisionTree.jsx`

2. **Update your App.js** with the routing above

3. **Start the backend** with `python3 main.py`

## 🔧 If You Still Have Issues

1. **Check browser console** for errors
2. **Check Network tab** - requests should go to `localhost:8000`
3. **Verify backend is running** on port 8000
4. **Clear browser cache** and localStorage

## 📞 Quick Test Commands

```bash
# Test backend is running
curl http://localhost:8000/

# Test decision tree endpoint
curl -X POST http://localhost:8000/api/decision-tree \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "current_node_id": "root", "context": {"advisor_type": "financial"}}'
```

Both should return JSON responses, not errors.

---

**This fix will completely resolve the advisor crash issue!** The problem was simply that your frontend was connecting to the wrong backend service. Once you update the API URLs to use port 8000 with the `/api` prefix, everything will work smoothly.