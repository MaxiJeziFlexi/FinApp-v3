/**
 * OpenAI Service - Frontend
 * Handles all OpenAI-related API calls to your FastAPI backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      detail: `HTTP error! status: ${response.status}` 
    }));
    throw new Error(error.detail || error.message || 'Network error');
  }
  return await response.json();
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
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

// Generate unique user ID for session tracking
const getUserIdFromStorage = () => {
  let userId = localStorage.getItem('finapp_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('finapp_user_id', userId);
  }
  return userId;
};

// Generate session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('finapp_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('finapp_session_id', sessionId);
  }
  return sessionId;
};

/**
 * OpenAI Service Class
 */
class OpenAIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.userId = getUserIdFromStorage();
    this.sessionId = getSessionId();
  }

  /**
   * Send message to OpenAI via your FastAPI backend
   * Uses your existing /api/chat/send endpoint
   */
  async sendMessage(message, advisorId = 'financial', userProfile = null, decisionPath = []) {
    try {
      const requestData = {
        message: message,
        advisorId: advisorId,
        userId: this.userId,
        sessionId: this.sessionId,
        userProfile: userProfile,
        decisionPath: decisionPath
      };

      console.log('Sending OpenAI request:', requestData);

      const response = await apiRequest('/api/chat/send', {
        method: 'POST',
        body: requestData
      });

      // Transform response to standardized format
      return {
        message: response.response || response.reply,
        success: true,
        metadata: {
          sentiment: response.sentiment,
          userSentiment: response.userSentiment,
          confidence: response.confidence,
          responseTime: response.responseTime,
          advisorUsed: response.advisorUsed,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('OpenAI sendMessage error:', error);
      
      // Try fallback endpoint
      return this.sendFinancialMessage(message, advisorId, userProfile);
    }
  }

  /**
   * Send financial chat message
   * Uses your existing /api/financial-chat endpoint
   */
  async sendFinancialMessage(message, advisorType = 'financial', userProfile = null, context = {}) {
    try {
      const requestData = {
        user_id: parseInt(this.userId.replace(/\D/g, '')) || Math.floor(Math.random() * 10000),
        question: message,
        context: {
          ...context,
          userProfile: userProfile,
          sessionId: this.sessionId
        },
        advisory_type: advisorType,
        language: 'pl',
        advisor_id: advisorType,
        session_id: this.sessionId
      };

      console.log('Sending financial chat request:', requestData);

      const response = await apiRequest('/api/financial-chat', {
        method: 'POST',
        body: requestData
      });

      return {
        message: response.reply || response.result,
        success: true,
        metadata: {
          sentiment: response.sentiment,
          confidence: response.confidence,
          advisorUsed: response.advisor_used,
          responseTime: response.response_time_ms,
          timestamp: new Date().toISOString(),
          fallback: true
        }
      };

    } catch (error) {
      console.error('Financial chat error:', error);
      return {
        message: "Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie później.",
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ask direct OpenAI question
   * Uses your existing /api/openai-question endpoint
   */
  async askDirectQuestion(question, context = {}) {
    try {
      const requestData = {
        user_id: parseInt(this.userId.replace(/\D/g, '')) || Math.floor(Math.random() * 10000),
        question: question,
        context: {
          ...context,
          sessionId: this.sessionId
        }
      };

      const response = await apiRequest('/api/openai-question', {
        method: 'POST',
        body: requestData
      });

      return {
        message: response.reply,
        success: true,
        metadata: {
          source: response.source || 'openai',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Direct OpenAI question error:', error);
      return {
        message: "Nie mogę teraz odpowiedzieć na to pytanie. Spróbuj ponownie.",
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get chat history for specific advisor
   * Uses your existing /api/chat/history/{advisor_id} endpoint
   */
  async getChatHistory(advisorId) {
    try {
      const response = await apiRequest(
        `/api/chat/history/${advisorId}?user_id=${this.userId}`
      );

      // Transform messages to expected format
      const messages = response.messages || [];
      return {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          sentiment: msg.sentiment,
          advisorId: msg.advisorId || advisorId
        })),
        success: true
      };

    } catch (error) {
      console.error('Get chat history error:', error);
      return {
        messages: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get general chat history
   * Uses your existing /api/chat-history/{user_id} endpoint
   */
  async getAllChatHistory() {
    try {
      const userId = parseInt(this.userId.replace(/\D/g, '')) || 1;
      const response = await apiRequest(`/api/chat-history/${userId}`);

      return {
        history: response.history || [],
        success: true
      };

    } catch (error) {
      console.error('Get all chat history error:', error);
      return {
        history: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process enhanced decision tree
   * Uses your existing /api/enhanced-decision-tree endpoint
   */
  async processDecisionTree(message, context = {}) {
    try {
      const requestData = {
        user_id: parseInt(this.userId.replace(/\D/g, '')) || 1,
        message: message,
        context: {
          ...context,
          sessionId: this.sessionId
        }
      };

      const response = await apiRequest('/api/enhanced-decision-tree', {
        method: 'POST',
        body: requestData
      });

      return {
        ...response,
        success: true
      };

    } catch (error) {
      console.error('Decision tree processing error:', error);
      return {
        message: "Wystąpił problem z procesowaniem drzewa decyzyjnego.",
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if ready for tree transition
   * Uses your existing /api/check-tree-transition endpoint
   */
  async checkTreeTransition(message, context = {}) {
    try {
      const requestData = {
        user_id: parseInt(this.userId.replace(/\D/g, '')) || 1,
        message: message,
        context: {
          ...context,
          sessionId: this.sessionId
        }
      };

      const response = await apiRequest('/api/check-tree-transition', {
        method: 'POST',
        body: requestData
      });

      return {
        ...response,
        success: true
      };

    } catch (error) {
      console.error('Tree transition check error:', error);
      return {
        ready_for_tree: false,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process profile form
   * Uses your existing /api/profile-form endpoint
   */
  async processProfileForm(answer, context = {}) {
    try {
      const requestData = {
        user_id: parseInt(this.userId.replace(/\D/g, '')) || 1,
        answer: answer,
        context: {
          ...context,
          sessionId: this.sessionId
        }
      };

      const response = await apiRequest('/api/profile-form', {
        method: 'POST',
        body: requestData
      });

      return {
        nextQuestion: response.next_question,
        isComplete: response.is_complete,
        profileData: response.profile_data,
        success: true
      };

    } catch (error) {
      console.error('Profile form processing error:', error);
      return {
        nextQuestion: "Wystąpił błąd podczas przetwarzania formularza.",
        isComplete: false,
        profileData: null,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start chat after form completion
   * Uses your existing /api/start-chat-after-form endpoint
   */
  async startChatAfterForm(profileData) {
    try {
      const requestData = {
        user_id: this.userId,
        profile_data: profileData
      };

      const response = await apiRequest('/api/start-chat-after-form', {
        method: 'POST',
        body: requestData
      });

      return {
        message: response.message,
        advisorType: response.advisor_type,
        success: true
      };

    } catch (error) {
      console.error('Start chat after form error:', error);
      return {
        message: "Rozpocznijmy rozmowę z Twoim doradcą finansowym!",
        advisorType: "financial",
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user ID (for authentication integration)
   */
  setUserId(newUserId) {
    this.userId = newUserId;
    localStorage.setItem('finapp_user_id', newUserId);
  }

  /**
   * Get current user ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Reset session (clear session storage)
   */
  resetSession() {
    sessionStorage.removeItem('finapp_session_id');
    this.sessionId = getSessionId();
  }

  /**
   * Health check for the backend
   */
  async healthCheck() {
    try {
      const response = await apiRequest('/health');
      return {
        ...response,
        success: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const openaiService = new OpenAIService();
export default openaiService;