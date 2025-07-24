// src/config/api.js
// COMPLETE API CONFIGURATION - Copy this to your React app

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
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

  console.log(`🌐 API Call: ${finalOptions.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return { ok: true, data, status: response.status };
    
  } catch (error) {
    console.error(`❌ API Call Failed:`, error);
    throw error;
  }
};

// API endpoints
export const api = {
  // Authentication
  login: async (credentials) => {
    return apiCall('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  register: async (userData) => {
    return apiCall('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Decision Tree - MAIN FLOW
  startDecisionTree: async (userId, advisorType) => {
    return apiCall('/decision-tree', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        current_node_id: 'root',
        answer: null,
        context: { advisor_type: advisorType }
      })
    });
  },

  processDecisionStep: async (userId, nodeId, answer, context = {}) => {
    return apiCall('/decision-tree', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        current_node_id: nodeId,
        answer: answer,
        context: context
      })
    });
  },

  getNextQuestion: async (userId, nodeId, context = {}) => {
    return apiCall('/decision-tree/question', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        current_node_id: nodeId,
        context: context
      })
    });
  },

  generateReport: async (userId, decisionPath, context = {}) => {
    return apiCall('/decision-tree/report', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        decision_path: decisionPath,
        context: context
      })
    });
  },

  resetDecisionTree: async (userId) => {
    return apiCall('/decision-tree/reset', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    });
  },

  // Chat
  sendChatMessage: async (userId, messages) => {
    return apiCall('/chat', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        messages: messages
      })
    });
  },

  getFinancialAdvice: async (userId, question, context = {}) => {
    return apiCall('/financial-chat', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        question: question,
        context: context
      })
    });
  },

  getChatHistory: async (userId) => {
    return apiCall(`/chat-history/${userId}`);
  },

  // User Profile
  getUserProfile: async (userId) => {
    return apiCall(`/user-profile/${userId}`);
  },

  processProfileForm: async (userId, answer, context = {}) => {
    return apiCall('/profile-form', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        answer: answer,
        context: context
      })
    });
  }
};

export default api;