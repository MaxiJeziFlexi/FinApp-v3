import { useState, useCallback, useRef } from 'react';


/**
 * Custom hook for OpenAI integration
 * Handles all OpenAI-related operations with your FastAPI backend
 */
export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const abortControllerRef = useRef(null);

  // Send message to OpenAI
  const sendMessage = useCallback(async (message, advisorId, userProfile = null, decisionPath = []) => {
    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // Analyze sentiment of user message
      let sentimentData = null;
      try {
        sentimentData = await analyzeSentiment(message);
      } catch (sentimentError) {
        console.warn('Sentiment analysis failed:', sentimentError);
      }

      // Send to OpenAI via backend
      const response = await openaiService.sendMessage(
        message,
        advisorId,
        userProfile,
        decisionPath
      );

      // Enhanced response with sentiment
      const enhancedResponse = {
        ...response,
        userSentiment: sentimentData,
        timestamp: new Date().toISOString()
      };

      setLastResponse(enhancedResponse);
      return enhancedResponse;

    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Request was cancelled
      }

      console.error('OpenAI sendMessage error:', error);
      setError(error.message);
      
      // Return fallback response
      return {
        message: "Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie.",
        success: false,
        error: error.message,
        fallback: true
      };
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Send financial chat message
  const sendFinancialMessage = useCallback(async (message, advisorType = 'financial', userProfile = null, context = {}) => {
    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await openaiService.sendFinancialMessage(
        message,
        advisorType,
        userProfile,
        context
      );

      setLastResponse(response);
      return response;

    } catch (error) {
      console.error('Financial chat error:', error);
      setError(error.message);
      return {
        message: "Nie mogę teraz pomóc. Spróbuj ponownie później.",
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ask direct OpenAI question
  const askQuestion = useCallback(async (question, context = {}) => {
    if (!question?.trim()) {
      throw new Error('Question is required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await openaiService.askDirectQuestion(question, context);
      setLastResponse(response);
      return response;

    } catch (error) {
      console.error('Ask question error:', error);
      setError(error.message);
      return {
        message: "Nie mogę odpowiedzieć na to pytanie w tej chwili.",
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get chat history
  const getChatHistory = useCallback(async (advisorId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await openaiService.getChatHistory(advisorId);
      return response;

    } catch (error) {
      console.error('Get chat history error:', error);
      setError(error.message);
      return {
        messages: [],
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process decision tree
  const processDecisionTree = useCallback(async (message, context = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await openaiService.processDecisionTree(message, context);
      return response;

    } catch (error) {
      console.error('Decision tree error:', error);
      setError(error.message);
      return {
        message: "Wystąpił problem z procesowaniem drzewa decyzyjnego.",
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check tree transition
  const checkTreeTransition = useCallback(async (message, context = {}) => {
    try {
      const response = await openaiService.checkTreeTransition(message, context);
      return response;
    } catch (error) {
      console.error('Tree transition check error:', error);
      return {
        ready_for_tree: false,
        success: false,
        error: error.message
      };
    }
  }, []);

  // Process profile form
  const processProfileForm = useCallback(async (answer, context = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await openaiService.processProfileForm(answer, context);
      return response;

    } catch (error) {
      console.error('Profile form error:', error);
      setError(error.message);
      return {
        nextQuestion: "Wystąpił błąd podczas przetwarzania formularza.",
        isComplete: false,
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start chat after form
  const startChatAfterForm = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await openaiService.startChatAfterForm(profileData);
      return response;

    } catch (error) {
      console.error('Start chat after form error:', error);
      setError(error.message);
      return {
        message: "Rozpocznijmy rozmowę z Twoim doradcą finansowym!",
        advisorType: "financial",
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // Health check
  const healthCheck = useCallback(async () => {
    try {
      const response = await openaiService.healthCheck();
      return response;
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        success: false,
        error: error.message
      };
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset hook state
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setLastResponse(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    lastResponse,

    // Main functions
    sendMessage,
    sendFinancialMessage,
    askQuestion,
    getChatHistory,

    // Decision tree functions
    processDecisionTree,
    checkTreeTransition,

    // Form functions
    processProfileForm,
    startChatAfterForm,

    // Utility functions
    cancelRequest,
    healthCheck,
    clearError,
    reset,

    // Service access
    getUserId: () => openaiService.getUserId(),
    getSessionId: () => openaiService.sessionId,
    setUserId: (userId) => openaiService.setUserId(userId),
    resetSession: () => openaiService.resetSession()
  };
};

export default useOpenAI;