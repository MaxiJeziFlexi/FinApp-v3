// API service for connecting React frontend to Flask backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  return handleResponse(response);
};

// Auth API calls
export const authAPI = {
  // Login user
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  // Register user
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: userData,
    });
  },

  // Logout user
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user profile
  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  },
};

// User profile API calls
export const userAPI = {
  // Get user profile with financial data
  getUserProfile: async () => {
    return apiRequest('/user/profile');
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: profileData,
    });
  },

  // Complete onboarding
  completeOnboarding: async (onboardingData) => {
    return apiRequest('/user/onboarding', {
      method: 'POST',
      body: onboardingData,
    });
  },

  // Get user achievements
  getAchievements: async () => {
    return apiRequest('/user/achievements');
  },

  // Add achievement
  addAchievement: async (achievementId) => {
    return apiRequest('/user/achievements', {
      method: 'POST',
      body: { achievementId },
    });
  },
};

// AI Chat API calls
export const chatAPI = {
  // Send message to AI advisor
  sendMessage: async (advisorId, message, context = {}) => {
    return apiRequest('/chat/message', {
      method: 'POST',
      body: {
        advisorId,
        message,
        context,
      },
    });
  },

  // Get chat history
  getChatHistory: async (advisorId) => {
    return apiRequest(`/chat/history/${advisorId}`);
  },

  // Save chat history
  saveChatHistory: async (advisorId, messages) => {
    return apiRequest('/chat/history', {
      method: 'POST',
      body: {
        advisorId,
        messages,
      },
    });
  },

  // Analyze sentiment
  analyzeSentiment: async (text) => {
    return apiRequest('/chat/sentiment', {
      method: 'POST',
      body: { text },
    });
  },
};

// Decision Tree API calls
export const decisionTreeAPI = {
  // Process decision step
  processDecisionStep: async (advisorId, step, decisionPath) => {
    return apiRequest('/decision-tree/step', {
      method: 'POST',
      body: {
        advisorId,
        step,
        decisionPath,
      },
    });
  },

  // Generate final recommendation
  generateReport: async (advisorId, decisionPath, userProfile) => {
    return apiRequest('/decision-tree/report', {
      method: 'POST',
      body: {
        advisorId,
        decisionPath,
        userProfile,
      },
    });
  },

  // Get decision tree structure
  getDecisionTree: async (advisorId) => {
    return apiRequest(`/decision-tree/structure/${advisorId}`);
  },
};

// Financial data API calls
export const financialAPI = {
  // Get financial progress data
  getFinancialData: async () => {
    return apiRequest('/financial/progress');
  },

  // Update financial data
  updateFinancialData: async (financialData) => {
    return apiRequest('/financial/progress', {
      method: 'POST',
      body: financialData,
    });
  },

  // Calculate goal progress
  calculateProgress: async (goalType, currentAmount, targetAmount) => {
    return apiRequest('/financial/calculate-progress', {
      method: 'POST',
      body: {
        goalType,
        currentAmount,
        targetAmount,
      },
    });
  },
};

// Export default API object
const API = {
  auth: authAPI,
  user: userAPI,
  chat: chatAPI,
  decisionTree: decisionTreeAPI,
  financial: financialAPI,
};

export default API;