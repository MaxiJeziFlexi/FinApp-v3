# Complete Application Setup & Fix

## Problem Analysis
After onboarding → Click advisor → Should redirect to decision-tree → **CRASHES**

## Root Causes
1. **Frontend API calls** pointing to wrong backend (port 4001 vs 8000)
2. **Missing decision tree routing** integration
3. **Backend endpoints** not properly connected to frontend flow
4. **CORS and authentication** issues

## Complete Fix Implementation

### 1. Backend Setup (Already Fixed)
✅ Decision tree endpoints working
✅ Auth endpoints available
✅ CORS enabled
✅ All APIs integrated

### 2. Frontend Configuration Fixes

#### A. Update API Base URL
Create/Update: `src/config/api.js`
```javascript
// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const api = {
  // Auth endpoints
  login: (credentials) => 
    fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }),

  register: (userData) =>
    fetch(`${API_BASE_URL}/register`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),

  // Decision Tree endpoints
  startDecisionTree: (userId, advisorType) =>
    fetch(`${API_BASE_URL}/decision-tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        current_node_id: 'root',
        answer: null,
        context: { advisor_type: advisorType }
      })
    }),

  processDecisionStep: (userId, nodeId, answer, context = {}) =>
    fetch(`${API_BASE_URL}/decision-tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        current_node_id: nodeId,
        answer: answer,
        context: context
      })
    }),

  getNextQuestion: (userId, nodeId, context = {}) =>
    fetch(`${API_BASE_URL}/decision-tree/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        current_node_id: nodeId,
        context: context
      })
    }),

  generateReport: (userId, decisionPath, context = {}) =>
    fetch(`${API_BASE_URL}/decision-tree/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        decision_path: decisionPath,
        context: context
      })
    }),

  // Chat endpoints
  sendChatMessage: (userId, messages) =>
    fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        messages: messages
      })
    }),

  getFinancialAdvice: (userId, question, context = {}) =>
    fetch(`${API_BASE_URL}/financial-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        question: question,
        context: context
      })
    })
};

export default api;
```

#### B. Fix Advisor Selection Component
Update your advisor selection component:
```javascript
// components/AdvisorSelection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const AdvisorSelection = ({ userId }) => {
  const navigate = useNavigate();

  const advisors = [
    {
      id: 'financial',
      name: 'Financial Advisor',
      description: 'Personal finance, budgeting, savings',
      icon: '💰'
    },
    {
      id: 'investment',
      name: 'Investment Advisor', 
      description: 'Stocks, bonds, portfolio management',
      icon: '📈'
    },
    {
      id: 'tax',
      name: 'Tax Advisor',
      description: 'Tax optimization, deductions',
      icon: '📊'
    },
    {
      id: 'legal',
      name: 'Legal Advisor',
      description: 'Legal planning, contracts',
      icon: '⚖️'
    }
  ];

  const handleAdvisorClick = async (advisorType) => {
    try {
      console.log(`🎯 Starting ${advisorType} advisor for user ${userId}`);
      
      // Start decision tree for selected advisor
      const response = await api.startDecisionTree(userId, advisorType);
      
      if (!response.ok) {
        throw new Error(`Failed to start decision tree: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Decision tree started:', data);
      
      // Navigate to decision tree with advisor context
      navigate('/decision-tree', {
        state: {
          userId: userId,
          advisorType: advisorType,
          initialData: data
        }
      });
      
    } catch (error) {
      console.error('❌ Error starting advisor:', error);
      alert(`Failed to start ${advisorType} advisor. Please try again.`);
    }
  };

  return (
    <div className="advisor-selection">
      <h2>Choose Your Advisor</h2>
      <div className="advisors-grid">
        {advisors.map((advisor) => (
          <div
            key={advisor.id}
            className="advisor-card"
            onClick={() => handleAdvisorClick(advisor.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="advisor-icon">{advisor.icon}</div>
            <h3>{advisor.name}</h3>
            <p>{advisor.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvisorSelection;
```

#### C. Create Decision Tree Component
Create: `components/DecisionTree.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../config/api';

const DecisionTree = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { userId, advisorType, initialData } = location.state || {};
  
  const [currentNode, setCurrentNode] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({ advisor_type: advisorType });
  const [journey, setJourney] = useState([]);

  useEffect(() => {
    if (initialData) {
      setCurrentNode(initialData.node);
      setProgress(initialData.progress || 0);
    } else if (userId && advisorType) {
      // Start fresh decision tree
      startDecisionTree();
    } else {
      // No proper state, redirect back
      navigate('/advisors');
    }
  }, []);

  const startDecisionTree = async () => {
    try {
      setLoading(true);
      const response = await api.startDecisionTree(userId, advisorType);
      const data = await response.json();
      
      setCurrentNode(data.node);
      setProgress(data.progress || 0);
      setContext(data.context || { advisor_type: advisorType });
    } catch (error) {
      console.error('Error starting decision tree:', error);
      alert('Failed to start decision tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      setLoading(true);
      
      const response = await api.processDecisionStep(
        userId,
        currentNode.id,
        answer,
        context
      );
      
      const data = await response.json();
      
      // Update state
      setCurrentNode(data.node);
      setProgress(data.progress || 0);
      setContext(data.context || context);
      setJourney(prev => [...prev, { nodeId: currentNode.id, answer }]);
      
      // Check if we have recommendations (end of tree)
      if (data.recommendations && data.recommendations.length > 0) {
        navigate('/recommendations', {
          state: {
            userId,
            advisorType,
            recommendations: data.recommendations,
            journey
          }
        });
      }
      
    } catch (error) {
      console.error('Error processing decision step:', error);
      alert('Failed to process your answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="decision-tree-loading">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="decision-tree-error">
        <h2>Error</h2>
        <p>Failed to load decision tree. Please try again.</p>
        <button onClick={() => navigate('/advisors')}>
          Back to Advisors
        </button>
      </div>
    );
  }

  return (
    <div className="decision-tree">
      <div className="decision-tree-header">
        <h2>{advisorType} Advisor</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">{Math.round(progress * 100)}% Complete</span>
      </div>

      <div className="decision-tree-content">
        <div className="question-section">
          <h3>{currentNode.question}</h3>
          
          <div className="options-grid">
            {currentNode.options?.map((option) => (
              <button
                key={option.id}
                className="option-button"
                onClick={() => handleAnswer(option.id)}
                disabled={loading}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="decision-tree-footer">
        <button 
          className="back-button"
          onClick={() => navigate('/advisors')}
        >
          ← Back to Advisors
        </button>
      </div>
    </div>
  );
};

export default DecisionTree;
```

#### D. Update App Routing
Update your main App.js routing:
```javascript
// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdvisorSelection from './components/AdvisorSelection';
import DecisionTree from './components/DecisionTree';
import Recommendations from './components/Recommendations';
import Login from './components/Login';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/advisors" element={<AdvisorSelection />} />
          <Route path="/decision-tree" element={<DecisionTree />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

#### E. Fix Login Component
Update your Login component:
```javascript
// components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // FIXED: Use correct API endpoint
      const response = await api.login({ username, password });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userId', data.user_id || 1);
      
      // Navigate to advisors
      navigate('/advisors');
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

### 3. Backend Verification

Let me verify the backend is properly set up: