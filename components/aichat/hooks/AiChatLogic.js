import { useState, useCallback, useRef, useEffect } from 'react';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useAIChatLogic = () => {
  // State management
  const [userProfile, setUserProfile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [finalRecommendation, setFinalRecommendation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  // Ref to track previous profile for achievements
  const previousProfileRef = useRef(null);

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Store in sessionStorage for persistence
      sessionStorage.setItem('finapp_session_id', newSessionId);
    }
    
    // Get or create user ID
    let storedUserId = localStorage.getItem('finapp_user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('finapp_user_id', storedUserId);
    }
    setUserId(storedUserId);
  }, [sessionId]);

  // API call helper with automatic data collection
  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
      'X-Session-ID': sessionId,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Track user behavior automatically
  const trackBehavior = useCallback(async (actionType, component, details = {}) => {
    if (!userId || !sessionId) return;
    
    try {
      await apiCall('/api/behavior/track', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          actionType: actionType,
          component: component,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
            url: window.location.pathname
          },
          sessionId: sessionId
        })
      });
    } catch (error) {
      console.error('Error tracking behavior:', error);
    }
  }, [userId, sessionId]);

  // Load chat history for specific advisor
  const loadChatHistory = useCallback(async (advisorId) => {
    if (!advisorId || !userId) return;

    try {
      setLoading(true);
      console.log('Loading chat history for advisor:', advisorId);
      
      // Track behavior
      await trackBehavior('load_chat_history', 'chat_window', { advisorId });
      
      const data = await apiCall(`/api/chat/history/${advisorId}?user_id=${userId}`);
      
      if (data.messages && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
        
        // If no messages, add welcome message from constants
        if (data.messages.length === 0) {
          const { ADVISORS } = await import('../constants');
          const advisor = ADVISORS.find(a => a.id === advisorId);
          const welcomeMessage = {
            id: 'welcome',
            content: advisor?.welcomeMessage || 'Witaj! Jak mogę Ci pomóc?',
            role: 'assistant',
            timestamp: new Date().toISOString(),
            sentiment: 'positive',
            advisorId: advisorId
          };
          setChatMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      
      // Set welcome message on error
      try {
        const { ADVISORS } = await import('../constants');
        const advisor = ADVISORS.find(a => a.id === advisorId);
        const welcomeMessage = {
          id: 'welcome',
          content: advisor?.welcomeMessage || 'Witaj! Jak mogę Ci pomóc?',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          sentiment: 'positive',
          advisorId: advisorId
        };
        setChatMessages([welcomeMessage]);
      } catch (importError) {
        console.error('Error importing constants:', importError);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, trackBehavior]);

  // Send message to OpenAI via backend
  const sendMessage = useCallback(async (message, advisorId, decisionPath = []) => {
    if (!message.trim() || !advisorId || !userId) return;

    try {
      setLoading(true);

      // Track behavior
      await trackBehavior('send_message', 'chat_window', { 
        advisorId, 
        messageLength: message.length,
        hasDecisionPath: decisionPath.length > 0
      });

      // Add user message immediately to UI
      const userMessage = {
        id: `user_${Date.now()}`,
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
        advisorId: advisorId
      };

      setChatMessages(prev => [...prev, userMessage]);

      // Send to backend with all context
      const response = await apiCall('/api/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          advisorId: advisorId,
          userId: userId,
          sessionId: sessionId,
          decisionPath: decisionPath,
          userProfile: userProfile
        })
      });

      // Add AI response to chat
      const aiMessage = {
        id: `ai_${Date.now()}`,
        content: response.response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sentiment: response.sentiment || 'neutral',
        advisorId: advisorId,
        confidence: response.confidence || 0,
        responseTime: response.responseTime || 0
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Update user message with sentiment analysis
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, sentiment: response.userSentiment || 'neutral' }
            : msg
        )
      );

      // Track successful message
      await trackBehavior('message_success', 'chat_window', {
        advisorId,
        responseTime: response.responseTime,
        sentiment: response.sentiment,
        userSentiment: response.userSentiment
      });

      return {
        response: response.response,
        sentiment: response.sentiment,
        userSentiment: response.userSentiment,
        startDecisionTree: response.startDecisionTree || false
      };

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Track error
      await trackBehavior('message_error', 'chat_window', { 
        advisorId, 
        error: error.message 
      });
      
      // Add error message to chat
      const errorMessage = {
        id: `error_${Date.now()}`,
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sentiment: 'neutral',
        advisorId: advisorId,
        isError: true
      };

      setChatMessages(prev => [...prev, errorMessage]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, userProfile, trackBehavior]);

  // Save user profile with data collection
  const saveUserProfile = useCallback(async (profileData) => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Track behavior
      await trackBehavior('save_profile', 'onboarding', profileData);

      const response = await apiCall('/api/user/profile', {
        method: 'POST',
        body: JSON.stringify({
          ...profileData,
          email: profileData.email || `${userId}@finapp.local`
        })
      });

      if (response.success) {
        setUserProfile({
          ...profileData,
          id: response.userId || userId,
          onboardingComplete: true
        });
        
        // Track successful onboarding
        await trackBehavior('onboarding_complete', 'onboarding', {
          goal: profileData.financialGoal,
          timeframe: profileData.timeframe
        });
      }

      return response;
    } catch (error) {
      console.error('Error saving profile:', error);
      await trackBehavior('profile_error', 'onboarding', { error: error.message });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, trackBehavior]);

  // Load decision options for decision tree
  const loadDecisionOptions = useCallback(async (advisorId, step, decisionPath = []) => {
    if (!advisorId || !userId) return;

    try {
      setLoading(true);
      
      // Track behavior
      await trackBehavior('load_decision_options', 'decision_tree', { 
        advisorId, 
        step, 
        pathLength: decisionPath.length 
      });

      console.log('Loading decision options for:', { advisorId, step, decisionPath });

      // Mock decision options for now - replace with actual API call
      const mockOptions = [
        { id: 'option1', value: 'conservative', label: 'Bezpieczne podejście' },
        { id: 'option2', value: 'moderate', label: 'Umiarkowane podejście' },
        { id: 'option3', value: 'aggressive', label: 'Agresywne podejście' }
      ];

      setDecisionOptions(mockOptions);

      return {
        options: mockOptions,
        shouldGenerateRecommendation: step >= 3
      };

    } catch (error) {
      console.error('Error loading decision options:', error);
      await trackBehavior('decision_options_error', 'decision_tree', { error: error.message });
      setDecisionOptions([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, trackBehavior]);

  // Generate final recommendation
  const generateFinalRecommendation = useCallback(async (advisorId, decisionPath, userProfile) => {
    if (!advisorId || !userId) return;

    try {
      setLoading(true);
      
      // Track behavior  
      await trackBehavior('generate_recommendation', 'decision_tree', {
        advisorId,
        pathLength: decisionPath.length,
        userGoal: userProfile?.financialGoal
      });

      // Mock recommendation for now - replace with actual API call
      const mockRecommendation = {
        summary: `Na podstawie Twoich odpowiedzi, polecamy ${advisorId === 'retirement' ? 'długoterminową strategię emerytalną' : 'dopasowaną strategię finansową'}.`,
        steps: [
          'Rozpocznij regularne miesięczne oszczędzanie',
          'Zdywersyfikuj swoje inwestycje',
          'Monitoruj postępy co kwartał',
          'Dostosuj strategię w razie potrzeby'
        ],
        riskLevel: decisionPath.length > 0 ? decisionPath[0].value : 'moderate',
        expectedReturn: '6-8% rocznie',
        timeframe: userProfile?.timeframe || '5 lat'
      };

      setFinalRecommendation(mockRecommendation);
      
      // Track successful recommendation
      await trackBehavior('recommendation_generated', 'decision_tree', {
        advisorId,
        riskLevel: mockRecommendation.riskLevel
      });

      return mockRecommendation;

    } catch (error) {
      console.error('Error generating recommendation:', error);
      await trackBehavior('recommendation_error', 'decision_tree', { error: error.message });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, trackBehavior]);

  // Get user analytics
  const getUserAnalytics = useCallback(async () => {
    if (!userId) return null;

    try {
      const [behaviorData, sentimentData] = await Promise.all([
        apiCall(`/api/analytics/user-behavior/${userId}`),
        apiCall(`/api/analytics/sentiment-trends/${userId}`)
      ]);

      return {
        behavior: behaviorData.behaviors || [],
        sentiment: sentimentData.sentiments || []
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }, [userId]);

  // Clear chat history
  const clearChatHistory = useCallback(async (advisorId) => {
    if (!advisorId || !userId) return;

    try {
      await trackBehavior('clear_chat', 'chat_window', { advisorId });
      setChatMessages([]);
      
      // Add welcome message back
      const { ADVISORS } = await import('../constants');
      const advisor = ADVISORS.find(a => a.id === advisorId);
      const welcomeMessage = {
        id: 'welcome',
        content: advisor?.welcomeMessage || 'Witaj! Jak mogę Ci pomóc?',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sentiment: 'positive',
        advisorId: advisorId
      };
      setChatMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  }, [userId, trackBehavior]);

  return {
    // State
    userProfile,
    setUserProfile,
    chatMessages,
    setChatMessages,
    loading,
    decisionOptions,
    finalRecommendation,
    setFinalRecommendation,
    userId,
    sessionId,
    
    // Methods
    loadChatHistory,
    sendMessage,
    saveUserProfile,
    loadDecisionOptions,
    generateFinalRecommendation,
    getUserAnalytics,
    clearChatHistory,
    trackBehavior,
    
    // Refs
    previousProfileRef
  };
};