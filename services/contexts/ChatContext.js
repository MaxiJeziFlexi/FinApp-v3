import React, { createContext, useContext, useReducer, useCallback } from 'react';
import openaiService from '../services/openaiService';

// Initial state
const initialState = {
  messages: [],
  currentAdvisor: null,
  isLoading: false,
  error: null,
  chatHistory: {},
  typingIndicator: false,
  sessionInfo: {
    sessionId: null,
    startedAt: null,
    messageCount: 0
  }
};

// Action types
const CHAT_ACTIONS = {
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_CURRENT_ADVISOR: 'SET_CURRENT_ADVISOR',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TYPING: 'SET_TYPING',
  LOAD_CHAT_HISTORY: 'LOAD_CHAT_HISTORY',
  UPDATE_SESSION_INFO: 'UPDATE_SESSION_INFO',
  CLEAR_CHAT: 'CLEAR_CHAT',
  RESET_CHAT: 'RESET_CHAT'
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
        sessionInfo: {
          ...state.sessionInfo,
          messageCount: action.payload.length
        }
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      const newMessages = [...state.messages, action.payload];
      return {
        ...state,
        messages: newMessages,
        sessionInfo: {
          ...state.sessionInfo,
          messageCount: newMessages.length
        }
      };

    case CHAT_ACTIONS.SET_CURRENT_ADVISOR:
      return {
        ...state,
        currentAdvisor: action.payload,
        // Clear messages when switching advisors
        messages: action.payload?.id !== state.currentAdvisor?.id ? [] : state.messages
      };

    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case CHAT_ACTIONS.SET_TYPING:
      return {
        ...state,
        typingIndicator: action.payload
      };

    case CHAT_ACTIONS.LOAD_CHAT_HISTORY:
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          [action.payload.advisorId]: action.payload.messages
        }
      };

    case CHAT_ACTIONS.UPDATE_SESSION_INFO:
      return {
        ...state,
        sessionInfo: {
          ...state.sessionInfo,
          ...action.payload
        }
      };

    case CHAT_ACTIONS.CLEAR_CHAT:
      return {
        ...state,
        messages: [],
        error: null,
        sessionInfo: {
          ...state.sessionInfo,
          messageCount: 0
        }
      };

    case CHAT_ACTIONS.RESET_CHAT:
      return {
        ...initialState,
        sessionInfo: {
          sessionId: openaiService.sessionId,
          startedAt: new Date().toISOString(),
          messageCount: 0
        }
      };

    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// Provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    sessionInfo: {
      sessionId: openaiService.sessionId,
      startedAt: new Date().toISOString(),
      messageCount: 0
    }
  });

  // Send message to OpenAI
  const sendMessage = useCallback(async (messageText, userProfile = null, decisionPath = []) => {
    if (!messageText.trim() || !state.currentAdvisor) {
      return;
    }

    // Add user message
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      advisorId: state.currentAdvisor.id
    };

    dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: userMessage });
    dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: CHAT_ACTIONS.SET_TYPING, payload: true });
    dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: null });

    try {
      // Send to OpenAI via backend
      const response = await openaiService.sendMessage(
        messageText,
        state.currentAdvisor.id,
        userProfile,
        decisionPath
      );

      // Add AI response
      const aiMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        advisorId: state.currentAdvisor.id,
        metadata: response.metadata || {}
      };

      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: aiMessage });

      if (!response.success) {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: response.error });
      }

      return response;

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: 'Przepraszam, wystąpił błąd podczas komunikacji. Spróbuj ponownie.',
        timestamp: new Date().toISOString(),
        advisorId: state.currentAdvisor.id,
        isError: true
      };

      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: errorMessage });
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.message });

    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
      dispatch({ type: CHAT_ACTIONS.SET_TYPING, payload: false });
    }
  }, [state.currentAdvisor]);

  // Load chat history for advisor
  const loadChatHistory = useCallback(async (advisorId) => {
    try {
      const response = await openaiService.getChatHistory(advisorId);
      
      if (response.success) {
        dispatch({ 
          type: CHAT_ACTIONS.LOAD_CHAT_HISTORY, 
          payload: { advisorId, messages: response.messages } 
        });

        // If this is the current advisor, update messages
        if (state.currentAdvisor?.id === advisorId) {
          dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: response.messages });
        }
      }

    } catch (error) {
      console.error('Error loading chat history:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [state.currentAdvisor]);

  // Set current advisor and load history
  const setCurrentAdvisor = useCallback(async (advisor) => {
    dispatch({ type: CHAT_ACTIONS.SET_CURRENT_ADVISOR, payload: advisor });
    
    if (advisor) {
      // Load existing history for this advisor
      await loadChatHistory(advisor.id);
      
      // If no history, add initial message
      if (!state.chatHistory[advisor.id] || state.chatHistory[advisor.id].length === 0) {
        const initialMessage = {
          id: `init_${Date.now()}`,
          role: 'assistant',
          content: advisor.initialMessage || `Witaj! Jestem ${advisor.name}. W czym mogę Ci pomóc?`,
          timestamp: new Date().toISOString(),
          advisorId: advisor.id
        };
        
        dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: [initialMessage] });
      }
    }
  }, [loadChatHistory, state.chatHistory]);

  // Clear current chat
  const clearChat = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_CHAT });
  }, []);

  // Reset entire chat state
  const resetChat = useCallback(() => {
    openaiService.resetSession();
    dispatch({ type: CHAT_ACTIONS.RESET_CHAT });
  }, []);

  // Process decision tree
  const processDecisionTree = useCallback(async (message, context = {}) => {
    dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await openaiService.processDecisionTree(message, context);
      return response;
    } catch (error) {
      console.error('Error processing decision tree:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Check tree transition
  const checkTreeTransition = useCallback(async (message, context = {}) => {
    try {
      const response = await openaiService.checkTreeTransition(message, context);
      return response;
    } catch (error) {
      console.error('Error checking tree transition:', error);
      return { ready_for_tree: false, success: false, error: error.message };
    }
  }, []);

  // Process profile form
  const processProfileForm = useCallback(async (answer, context = {}) => {
    try {
      const response = await openaiService.processProfileForm(answer, context);
      return response;
    } catch (error) {
      console.error('Error processing profile form:', error);
      return { 
        nextQuestion: "Wystąpił błąd podczas przetwarzania formularza.",
        isComplete: false,
        success: false,
        error: error.message 
      };
    }
  }, []);

  // Start chat after form
  const startChatAfterForm = useCallback(async (profileData) => {
    try {
      const response = await openaiService.startChatAfterForm(profileData);
      return response;
    } catch (error) {
      console.error('Error starting chat after form:', error);
      return { 
        message: "Rozpocznijmy rozmowę z Twoim doradcą finansowym!",
        advisorType: "financial",
        success: false,
        error: error.message 
      };
    }
  }, []);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    sendMessage,
    setCurrentAdvisor,
    loadChatHistory,
    clearChat,
    resetChat,
    processDecisionTree,
    checkTreeTransition,
    processProfileForm,
    startChatAfterForm,
    
    // Utilities
    getUserId: () => openaiService.getUserId(),
    getSessionId: () => openaiService.sessionId,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;