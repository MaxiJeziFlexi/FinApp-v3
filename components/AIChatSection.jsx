import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  IconButton, 
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  Zoom,
  Slide,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Send, 
  Mic, 
  MicOff, 
  SmartToy, 
  Person,
  ArrowBack,
  Settings,
  Help,
  ArrowForward,
  EmojiEvents,
  Refresh,
  TrendingUp,
  Save,
  Check,
  Close,
  VolumeUp,
  AutoAwesome,
  Psychology
} from '@mui/icons-material';

// Import all your components
import OnboardingForm from './aichat/OnboardingForm';
import AdvisorSelection from './aichat/AdvisorSelection';
import DecisionTreeView from './aichat/DecisionTreeView';
import ChatWindow from './aichat/ChatWindow';
import AchievementNotification from './aichat/AchievementNotification';
import FinancialProgressChart from './aichat/FinancialProgressChart';

// Import utilities and services
import decisionTreeService from '../utils/decisionTreeService';
import { analyzeSentiment, analyzeFinancialSentiment } from '../utils/sentimentAnalysis';
import useSpeechRecognition from './aichat/hooks/useSpeechRecognition';
import useOpenAI from './aichat/hooks/useOpenAI';

// Define color scheme
const COLORS = {
  primary: '#0F3057',
  secondary: '#00A896',
  accent: '#E7E247',
  success: '#4CAF50',
  error: '#FF5252',
  warning: '#FFC107',
  lightBackground: '#F8F9FA',
  darkBackground: '#1A1A2E',
  lightText: '#6C757D',
  darkText: '#212529',
  white: '#FFFFFF'
};

// Chat API Service Class
class ChatAPIService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000';
    this.userId = localStorage.getItem('userId') || '1';
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || `${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = errorText || `${response.status}: ${response.statusText}`;
        }
        
        if (response.status === 405) {
          throw new Error('Method Not Allowed');
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // User Profile Methods
  async getUserProfile(userId) {
    return this.makeRequest(`/api/user/profile/${userId}`);
  }

  async updateUserProfile(userId, profileData) {
    return this.makeRequest(`/api/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: String(userId),
        name: profileData.name || '',
        financialGoal: profileData.goal || profileData.financialGoal,
        timeframe: profileData.timeframe,
        currentSavings: profileData.currentSavings,
        monthlyIncome: profileData.monthlyIncome,
        targetAmount: profileData.targetAmount,
        onboardingComplete: profileData.onboardingComplete || true,
        is_premium: profileData.is_premium || false,
        progress: profileData.progress || 0,
        achievements: profileData.achievements || [],
        consents: profileData.consents || {},
        financialData: profileData.financialData || []
      })
    });
  }

  // Decision Tree Methods
  async getDecisionTreeStatus(userId, advisorId) {
    return this.makeRequest(`/api/decision-tree/status/${userId}/${advisorId}`);
  }

  async saveDecisionTreeProgress(userId, advisorId, decisionPath, completed = false) {
    return this.makeRequest('/api/decision-tree/save', {
      method: 'POST',
      body: JSON.stringify({
        user_id: String(userId),
        advisor_id: advisorId,
        decision_path: decisionPath,
        completed: completed
      })
    });
  }

  async resetDecisionTree(userId, advisorId) {
    return this.makeRequest(`/api/decision-tree/reset/${userId}/${advisorId}`, {
      method: 'POST'
    });
  }

  // Chat Methods
  async sendChatMessage(message, advisorId, userProfile = null, decisionPath = [], model = 'gpt-3.5-turbo') {
    return this.makeRequest('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        advisor_id: advisorId,
        user_id: this.userId,
        session_id: this.sessionId,
        user_profile: userProfile,
        decision_path: decisionPath,
        model: model
      })
    });
  }

  async getChatHistory(advisorId, userId) {
    return this.makeRequest(`/api/chat/history/${advisorId}?user_id=${userId}`);
  }

  async getAvailableModels() {
    return this.makeRequest('/api/chat/models');
  }

  async getEnhancedResponse(message, advisorId, useChatGPT = true, model = 'gpt-3.5-turbo') {
    return this.makeRequest('/api/chat/enhanced-response', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        advisor_id: advisorId,
        user_id: this.userId,
        use_chatgpt: useChatGPT,
        model: model
      })
    });
  }

  // Health Check
  async healthCheck() {
    return this.makeRequest('/health');
  }
}

// Main AIChatSection Component
const AIChatSection = () => {
  const theme = useTheme();
  const chatAPIService = useRef(new ChatAPIService()).current;
  
  // Core state
  const [userId] = useState(chatAPIService.userId);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // UI state
  const [currentView, setCurrentView] = useState('onboarding'); // 'onboarding', 'advisorSelection', 'decisionTree', 'chat'
  const [showChart, setShowChart] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  
  // Onboarding state
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    timeframe: '',
    monthlyIncome: '',
    currentSavings: '',
    targetAmount: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [consents, setConsents] = useState({
    dataProcessing: false,
    profiling: false
  });
  
  // Advisor state
  const [currentAdvisor, setCurrentAdvisor] = useState(null);
  
  // Decision tree state
  const [currentStep, setCurrentStep] = useState(0);
  const [decisionPath, setDecisionPath] = useState([]);
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [finalRecommendation, setFinalRecommendation] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [useChatGPT, setUseChatGPT] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [availableModels, setAvailableModels] = useState(['gpt-3.5-turbo']);
  
  // Backend status
  const [backendStatus, setBackendStatus] = useState({
    healthy: false,
    openai: false,
    chatgpt_available: false,
    database: false
  });
  
  // Achievement state
  const [achievement, setAchievement] = useState(null);
  
  // Speech recognition
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    supported: speechRecognitionSupported
  } = useSpeechRecognition();
  
  // OpenAI hook
  const {
    sendMessage: sendOpenAIMessage,
    isLoading: openAILoading,
    error: openAIError
  } = useOpenAI();
  
  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check backend health
        const health = await chatAPIService.healthCheck();
        setBackendStatus({
          healthy: health.status === 'healthy',
          openai: health.openai || false,
          chatgpt_available: health.chatgpt_available || false,
          database: health.database || false
        });
        
        // Get available models
        const modelsData = await chatAPIService.getAvailableModels();
        setAvailableModels(modelsData.models || ['gpt-3.5-turbo']);
        
        // Load user profile
        const profile = await chatAPIService.getUserProfile(userId);
        if (profile && profile.onboardingComplete) {
          setUserProfile(profile);
          setCurrentView('advisorSelection');
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    
    initialize();
  }, [userId]);
  
  // Listen for transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      setNewMessage(prev => prev + ' ' + transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);
  
  // Validate onboarding form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Imię jest wymagane';
    }
    
    if (!formData.goal) {
      errors.goal = 'Wybierz cel finansowy';
    }
    
    if (!formData.timeframe) {
      errors.timeframe = 'Wybierz ramy czasowe';
    }
    
    if (!formData.monthlyIncome) {
      errors.monthlyIncome = 'Wybierz miesięczny dochód';
    }
    
    if (!consents.dataProcessing) {
      errors.consents = 'Musisz wyrazić zgodę na przetwarzanie danych';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle onboarding submission
  const handleOnboardingSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profileData = {
        ...formData,
        onboardingComplete: true,
        consents: consents,
        financialData: [
          { date: "2023-01", amount: 2000 },
          { date: "2023-02", amount: 2500 },
          { date: "2023-03", amount: 3000 },
          { date: "2023-04", amount: 3500 },
          { date: "2023-05", amount: 4200 },
          { date: "2023-06", amount: 4800 },
          { date: "2023-07", amount: 5500 },
          { date: "2023-08", amount: 6200 }
        ]
      };
      
      const updatedProfile = await chatAPIService.updateUserProfile(userId, profileData);
      setUserProfile(updatedProfile);
      setCurrentView('advisorSelection');
      
      // Show achievement
      setAchievement({
        title: 'Profil utworzony!',
        description: 'Rozpocząłeś swoją podróż finansową',
        icon: '🎉'
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Nie udało się zapisać profilu. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle advisor selection
  const handleAdvisorSelect = async (advisor) => {
    setCurrentAdvisor(advisor);
    setCurrentStep(0);
    setDecisionPath([]);
    setFinalRecommendation(null);
    setProgressValue(0);
    
    try {
      // Get existing progress
      const status = await chatAPIService.getDecisionTreeStatus(userId, advisor.id);
      if (status.completed) {
        // If already completed, show chat
        setChatVisible(true);
        setCurrentView('chat');
      } else {
        // Start decision tree
        if (status.decision_path && status.decision_path.length > 0) {
          setDecisionPath(status.decision_path);
          setCurrentStep(status.decision_path.length);
          setProgressValue(status.progress || 0);
        }
        
        // Get first question
        const question = decisionTreeService.getQuestion(advisor.id, 0);
        const options = await decisionTreeService.processDecisionStep(advisor.id, 0, []);
        setDecisionOptions(options || []);
        setCurrentView('decisionTree');
        
        // Initialize chat with advisor
        const initialMessage = {
          role: 'assistant',
          content: advisor.initialMessage || `Witaj! Jestem ${advisor.name}. ${advisor.specialty}`,
          timestamp: new Date().toISOString(),
          advisorId: advisor.id
        };
        setChatMessages([initialMessage]);
      }
    } catch (error) {
      console.error('Error selecting advisor:', error);
      setError('Nie udało się załadować doradcy');
    }
  };
  
  // Handle decision tree selection
  const handleDecisionSelect = async (optionIndex) => {
    if (!decisionOptions || !decisionOptions[optionIndex]) return;
    
    setLoading(true);
    try {
      const selectedOption = decisionOptions[optionIndex];
      const newDecision = {
        step: currentStep,
        selection: selectedOption.id,
        value: selectedOption.value,
        title: selectedOption.title,
        description: selectedOption.description,
        timestamp: new Date().toISOString()
      };
      
      const newPath = [...decisionPath, newDecision];
      setDecisionPath(newPath);
      
      // Save progress
      await chatAPIService.saveDecisionTreeProgress(
        userId,
        currentAdvisor.id,
        newPath,
        false
      );
      
      // Check if tree is complete
      if (decisionTreeService.isDecisionTreeComplete(currentAdvisor.id, newPath)) {
        // Generate final recommendation
        const report = await decisionTreeService.generateReport(
          currentAdvisor.id,
          newPath,
          userProfile
        );
        
        setFinalRecommendation(report);
        setProgressValue(100);
        
        // Save completion
        await chatAPIService.saveDecisionTreeProgress(
          userId,
          currentAdvisor.id,
          newPath,
          true
        );
        
        // Show achievement
        setAchievement({
          title: 'Drzewo decyzyjne ukończone!',
          description: `Otrzymałeś spersonalizowane rekomendacje od ${currentAdvisor.name}`,
          icon: '🏆'
        });
      } else {
        // Get next step
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        
        const nextOptions = await decisionTreeService.processDecisionStep(
          currentAdvisor.id,
          nextStep,
          newPath
        );
        setDecisionOptions(nextOptions || []);
        setProgressValue(decisionTreeService.getProgressPercentage(currentAdvisor.id, nextStep));
      }
    } catch (error) {
      console.error('Error processing decision:', error);
      setError('Nie udało się przetworzyć decyzji');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle going back in decision tree
  const handleDecisionBack = async () => {
    if (decisionPath.length === 0) return;
    
    const newPath = decisionPath.slice(0, -1);
    setDecisionPath(newPath);
    
    const previousStep = Math.max(0, currentStep - 1);
    setCurrentStep(previousStep);
    
    const options = await decisionTreeService.processDecisionStep(
      currentAdvisor.id,
      previousStep,
      newPath
    );
    setDecisionOptions(options || []);
    setProgressValue(decisionTreeService.getProgressPercentage(currentAdvisor.id, previousStep));
    
    // Save updated progress
    await chatAPIService.saveDecisionTreeProgress(
      userId,
      currentAdvisor.id,
      newPath,
      false
    );
  };
  
  // Handle sending chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;
    
    const userMessage = {
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);
    
    try {
      // Analyze sentiment
      const sentiment = analyzeSentiment(newMessage);
      const financialSentiment = analyzeFinancialSentiment(newMessage);
      
      // Send to backend
      let response;
      if (useChatGPT && backendStatus.chatgpt_available) {
        response = await chatAPIService.sendChatMessage(
          newMessage,
          currentAdvisor?.id || 'financial',
          userProfile,
          decisionPath,
          selectedModel
        );
      } else {
        response = await chatAPIService.getEnhancedResponse(
          newMessage,
          currentAdvisor?.id || 'financial',
          false,
          selectedModel
        );
      }
      
      const assistantMessage = {
        role: 'assistant',
        content: response.response || response.message || 'Przepraszam, wystąpił błąd.',
        timestamp: new Date().toISOString(),
        sentiment: response.sentiment,
        advisor_used: currentAdvisor?.id,
        response_time: response.responseTime
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'system',
        content: 'Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // Utility functions
  const toggleChart = () => setShowChart(!showChart);
  const toggleAdvancedMode = () => setAdvancedMode(!advancedMode);
  const changeAdvisor = () => {
    setCurrentAdvisor(null);
    setCurrentView('advisorSelection');
    setChatVisible(false);
  };
  const backToDecisionTree = () => {
    setChatVisible(false);
    setCurrentView('decisionTree');
  };
  
  // Calculate goal amount
  const goalAmount = 10000; // Default goal, can be calculated based on user input
  
  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'onboarding':
        return (
          <OnboardingForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            consents={consents}
            setConsents={setConsents}
            loading={loading}
            handleOnboardingSubmit={handleOnboardingSubmit}
            COLORS={COLORS}
          />
        );
        
      case 'advisorSelection':
        return (
          <AdvisorSelection
            userProfile={userProfile}
            goalAmount={goalAmount}
            showChart={showChart}
            toggleChart={toggleChart}
            setCurrentAdvisor={handleAdvisorSelect}
            COLORS={COLORS}
          />
        );
        
      case 'decisionTree':
        return chatVisible ? (
          <ChatWindow
            currentAdvisor={currentAdvisor}
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            isListening={isListening}
            startListening={startListening}
            stopListening={stopListening}
            speechRecognitionSupported={speechRecognitionSupported}
            handleSendMessage={handleSendMessage}
            loading={loading}
            setChatVisible={setChatVisible}
            useChatGPT={useChatGPT}
            selectedModel={selectedModel}
            backendStatus={backendStatus}
            COLORS={COLORS}
          />
        ) : (
          <DecisionTreeView
            currentAdvisor={currentAdvisor}
            currentStep={currentStep}
            decisionPath={decisionPath}
            decisionOptions={decisionOptions}
            progressValue={progressValue}
            loading={loading}
            finalRecommendation={finalRecommendation}
            userProfile={userProfile}
            advancedMode={advancedMode}
            handleDecisionSelect={handleDecisionSelect}
            handleDecisionBack={handleDecisionBack}
            changeAdvisor={changeAdvisor}
            toggleAdvancedMode={toggleAdvancedMode}
            setChatVisible={setChatVisible}
            backToDecisionTree={backToDecisionTree}
            COLORS={COLORS}
          />
        );
        
      case 'chat':
        return (
          <ChatWindow
            currentAdvisor={currentAdvisor}
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            isListening={isListening}
            startListening={startListening}
            stopListening={stopListening}
            speechRecognitionSupported={speechRecognitionSupported}
            handleSendMessage={handleSendMessage}
            loading={loading}
            setChatVisible={(visible) => {
              setChatVisible(visible);
              if (!visible) setCurrentView('advisorSelection');
            }}
            useChatGPT={useChatGPT}
            selectedModel={selectedModel}
            backendStatus={backendStatus}
            COLORS={COLORS}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* Achievement Notification */}
      {achievement && (
        <AchievementNotification
          achievement={achievement}
          onClose={() => setAchievement(null)}
          COLORS={COLORS}
        />
      )}
      
      {/* Main Content */}
      <Fade in={true} timeout={500}>
        <Box>
          {renderCurrentView()}
        </Box>
      </Fade>
      
      {/* Backend Status Indicator */}
      {!backendStatus.healthy && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            p: 2,
            backgroundColor: COLORS.warning,
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <Typography variant="caption">
            Tryb offline - niektóre funkcje mogą być niedostępne
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default AIChatSection;