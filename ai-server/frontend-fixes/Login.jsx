// components/Login.jsx
// FIXED LOGIN COMPONENT

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔐 Attempting login...');
      
      // FIXED: Use correct API endpoint (port 8000, not 4001)
      const response = await api.login({ username, password });
      
      console.log('✅ Login successful:', response.data);
      
      // Store token and user info
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('username', username);
        
        // Extract user ID from token or use default
        const userId = response.data.user_id || 1;
        localStorage.setItem('userId', userId.toString());
        
        console.log(`👤 User ${userId} logged in successfully`);
        
        // Navigate to advisors selection
        navigate('/advisors', { 
          state: { 
            userId: userId,
            username: username 
          } 
        });
      } else {
        throw new Error('No access token received');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle different types of errors
      if (error.message.includes('401')) {
        setError('Invalid username or password. Please try again.');
      } else if (error.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else if (error.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo login function for testing
  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use demo credentials
      const demoUserId = Math.floor(Math.random() * 1000) + 1;
      localStorage.setItem('userId', demoUserId.toString());
      localStorage.setItem('username', 'demo_user');
      localStorage.setItem('token', 'demo_token');
      
      console.log(`🎭 Demo login as user ${demoUserId}`);
      
      navigate('/advisors', { 
        state: { 
          userId: demoUserId,
          username: 'demo_user' 
        } 
      });
      
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Financial Advisory Platform</h1>
          <p>Get personalized financial guidance from AI-powered advisors</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button 
          onClick={handleDemoLogin}
          className="demo-button"
          disabled={loading}
        >
          🎭 Try Demo Mode
        </button>

        <div className="login-footer">
          <p>Don't have an account? <a href="/register">Sign up here</a></p>
          <div className="connection-status">
            <span className="status-indicator"></span>
            Connected to AI Advisory Server
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS Styles (add to your CSS file)
const styles = `
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 2rem;
  color: #1F2937;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6B7280;
  line-height: 1.5;
}

.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input:disabled {
  background: #F9FAFB;
  cursor: not-allowed;
}

.error-message {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #DC2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.login-button {
  width: 100%;
  background: #4F46E5;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-button:hover:not(:disabled) {
  background: #4338CA;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-divider {
  text-align: center;
  margin: 2rem 0;
  position: relative;
}

.login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #E5E7EB;
}

.login-divider span {
  background: white;
  color: #6B7280;
  padding: 0 1rem;
  font-size: 0.9rem;
}

.demo-button {
  width: 100%;
  background: #10B981;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.demo-button:hover:not(:disabled) {
  background: #059669;
}

.demo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
}

.login-footer p {
  color: #6B7280;
  margin-bottom: 1rem;
}

.login-footer a {
  color: #4F46E5;
  text-decoration: none;
  font-weight: 600;
}

.login-footer a:hover {
  text-decoration: underline;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #6B7280;
  font-size: 0.8rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.spinner {
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;

export default Login;