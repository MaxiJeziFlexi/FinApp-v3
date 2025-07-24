// Frontend API Configuration
// Copy this to your React app's src/config/api.js

const API_CONFIG = {
  // CORRECT backend URL
  BASE_URL: 'http://localhost:8000/api',
  
  // Available endpoints
  ENDPOINTS: {
    LOGIN: '/login',
    REGISTER: '/register',
    CHAT: '/chat',
    FINANCIAL_CHAT: '/financial-chat',
    DECISION_TREE: '/decision-tree',
    DECISION_TREE_QUESTION: '/decision-tree/question',
    DECISION_TREE_REPORT: '/decision-tree/report',
    USER_PROFILE: '/user-profile',
    CHAT_HISTORY: '/chat-history'
  }
};

// API helper function
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    console.log(`🌐 API Call: ${finalOptions.method || 'GET'} ${url}`);
    
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ API Call Failed:`, error);
    throw error;
  }
};

// Usage examples:
export const authAPI = {
  login: (username, password) => 
    apiCall(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
    
  register: (username, email, password) =>
    apiCall(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
};

export const chatAPI = {
  sendMessage: (user_id, messages) =>
    apiCall(API_CONFIG.ENDPOINTS.CHAT, {
      method: 'POST',
      body: JSON.stringify({ user_id, messages }),
    }),
    
  getHistory: (user_id) =>
    apiCall(`${API_CONFIG.ENDPOINTS.CHAT_HISTORY}/${user_id}`),
};

export const advisorAPI = {
  getFinancialAdvice: (user_id, question, context = {}) =>
    apiCall(API_CONFIG.ENDPOINTS.FINANCIAL_CHAT, {
      method: 'POST',
      body: JSON.stringify({ user_id, question, context }),
    }),
    
  processDecisionTree: (user_id, current_node_id, answer, context = {}) =>
    apiCall(API_CONFIG.ENDPOINTS.DECISION_TREE, {
      method: 'POST',
      body: JSON.stringify({ user_id, current_node_id, answer, context }),
    }),
};

export default API_CONFIG;

// QUICK FIX FOR EXISTING CODE:
// Replace all instances of:
// "http://localhost:4001/login" → apiCall('/login', { method: 'POST', body: JSON.stringify({username, password}) })
// "http://localhost:4001/chat" → apiCall('/chat', { method: 'POST', body: JSON.stringify({user_id, messages}) })
// etc.