import { useState, useEffect, useRef } from 'react';
import { ADVISORS, getGoalName, getFirstStepForGoal, getSecondStepForGoal, getThirdStepForGoal } from '../constants';
import { analyzeSentiment } from '../../../utils/sentimentAnalysis';
import decisionTreeService from '../../../utils/decisionTreeService';

// Mock functions for API calls - these should be replaced with actual API calls
const getChatHistory = async (advisorId) => {
  return {
    messages: []  // Return empty messages to ensure we add the initial message
  };
};

const saveChatHistory = async (advisorId, messages) => {
  console.log('Chat history saved', { advisorId, messagesCount: messages.length });
  return true;
};

const getUserProfile = async () => {
  return {
    name: "Jan Kowalski",
    financialGoal: "emergency_fund",
    timeframe: "medium",
    currentSavings: "5000",
    monthlyIncome: "4000",
    onboardingComplete: false,
    progress: 0,
    achievements: [],
    financialData: [
      { date: '2023-01', amount: 2000 },
      { date: '2023-02', amount: 2500 },
      { date: '2023-03', amount: 3000 },
      { date: '2023-04', amount: 3200 },
      { date: '2023-05', amount: 3800 },
      { date: '2023-06', amount: 4200 },
      { date: '2023-07', amount: 4500 },
      { date: '2023-08', amount: 5000 }
    ]
  };
};

// Enhanced chat functionality to work with the decision tree and OpenAI API
const sendEnhancedAIMessage = async (message, advisorId, userProfile, decisionPath, sentimentData = null) => {
  try {
    // Determine the correct advisory type based on advisor ID
    const advisor = ADVISORS.find(a => a.id === advisorId) || ADVISORS[0];
    const advisoryType = advisor.goal || "emergency_fund";

    // Get current step in the decision tree if applicable
    let currentDecisionStep = -1;
    if (decisionPath && decisionPath.length > 0) {
      currentDecisionStep = decisionPath.length - 1;
    }

    // Check if message is requesting decision tree help
    const isAskingForHelp = message.toLowerCase().includes('pomóż') || 
                           message.toLowerCase().includes('poradź') ||
                           message.toLowerCase().includes('jak') ||
                           message.toLowerCase().includes('cel');

    // Create context object with all relevant information
    const context = {
      userProfile: userProfile,
      decisionPath: decisionPath,
      sentiment: sentimentData,
      advisorId: advisorId,
      currentStep: currentDecisionStep,
      goalType: advisoryType
    };

    // Try to call the OpenAI API first
    try {
      const apiResponse = await fetch('http://localhost:8000/api/openai-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userProfile?.id || 1,
          question: message,
          context: context
        })
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        return {
          message: apiData.reply || apiData.message,
          updatedProfile: {...userProfile}
        };
      } else {
        console.warn('OpenAI API call failed, falling back to mock response');
      }
    } catch (apiError) {
      console.warn('OpenAI API call error, falling back to mock response:', apiError);
    }

    // Fallback to mock response if API fails
    let response = {
      message: "",
      updatedProfile: {...userProfile}
    };

    // If user is asking for help and we don't have an active decision tree yet
    if (isAskingForHelp && currentDecisionStep < 0) {
      // Suggest starting the decision tree
      response.message = `Dziękuję za pytanie! Jako ${advisor.name}, mogę pomóc Ci z ${advisor.specialty.toLowerCase()} ` +
                         `Chcesz rozpocząć proces planowania ${getGoalName(advisoryType)}? ` +
                         `Odpowiedz "Tak", aby rozpocząć, lub zadaj inne pytanie.`;
    } 
    // If user agrees to start (simple keyword detection)
    else if ((message.toLowerCase().includes('tak') || message.toLowerCase().includes('start') || 
              message.toLowerCase().includes('rozpocznij') || message.toLowerCase().includes('pomóż')) 
             && currentDecisionStep < 0) {
      response.message = `Świetnie! Przygotowałem kilka pytań, które pozwolą mi lepiej zrozumieć Twoją sytuację i cel. ` +
                        `Przejdźmy do planowania ${getGoalName(advisoryType)}. Odpowiedz na pytania, które pojawią się na ekranie.`;
      
      // Send notification to start the decision tree
      response.startDecisionTree = true;
    }
    // User is in middle of a decision tree but chatting
    else if (currentDecisionStep >= 0 && currentDecisionStep < 3) {
      response.message = `Dziękuję za wiadomość! Aby przygotować najlepszą strategię ${getGoalName(advisoryType)}, ` +
                        `potrzebuję jeszcze kilku informacji. Odpowiedz na pytania, które widzisz na ekranie, ` +
                        `a potem przygotujemy pełen plan działania.`;
    }
    // User has completed the decision tree
    else if (currentDecisionStep >= 3) {
      response.message = `Dziękuję za wiadomość! Masz już przygotowaną strategię ${getGoalName(advisoryType)}. ` +
                        `Czy masz jakieś pytania dotyczące planu? Chętnie wyjaśnię szczegóły lub pomogę z implementacją.`;
      
      // Handle specific queries about the recommendation
      if (message.toLowerCase().includes('wyjaśnij')) {
        response.message = `Oczywiście, wyjaśnię Ci szczegóły planu. Twoja strategia ${getGoalName(advisoryType)} ` +
                           `została stworzona na podstawie Twoich odpowiedzi. Główne kroki to:\n` +
                           `1. ${getFirstStepForGoal(advisoryType)}\n` +
                           `2. ${getSecondStepForGoal(advisoryType)}\n` +
                           `3. ${getThirdStepForGoal(advisoryType)}\n\n` +
                           `Czy potrzebujesz dodatkowych wyjaśnień dotyczących któregoś z tych kroków?`;
      }
      else if (message.toLowerCase().includes('jak zacząć') || message.toLowerCase().includes('od czego zacząć')) {
        response.message = `Najlepiej zacząć od pierwszego kroku w Twoim planie: ${getFirstStepForGoal(advisoryType)}. ` +
                           `Sugeruję zacząć już dzisiaj lub w najbliższym tygodniu. Czasem najtrudniejszy jest pierwszy krok, ` +
                           `ale gdy już zaczniesz, zobaczysz, że kolejne kroki będą łatwiejsze.`;
      }
    }
    // Default conversation
    else {
      response.message = `Jako ${advisor.name}, specjalizuję się w ${advisor.specialty.toLowerCase()} ` +
                         `Czy chcesz dowiedzieć się więcej na temat ${getGoalName(advisoryType)}? Mogę odpowiedzieć na Twoje pytania ` +
                         `lub pomóc w stworzeniu spersonalizowanego planu.`;
      
      // Sentiment-based adjustments
      if (sentimentData) {
        if (sentimentData.sentiment === 'negative' && sentimentData.confidence > 0.6) {
          response.message = `Rozumiem Twoje obawy. ${response.message}`;
        } else if (sentimentData.sentiment === 'positive' && sentimentData.confidence > 0.6) {
          response.message = `Cieszę się Twoim entuzjazmem! ${response.message}`;
        }
      }
    }

    // Handle keyword-based queries
    if (message.toLowerCase().includes('oszczędza') || message.toLowerCase().includes('oszczędności')) {
      response.updatedProfile.currentSavings = parseInt(response.updatedProfile.currentSavings || 0) + 100;
      response.updatedProfile.achievements = response.updatedProfile.achievements || [];
      
      if (response.updatedProfile.currentSavings >= 1000 && !response.updatedProfile.achievements.includes('savings_1000')) {
        response.updatedProfile.achievements.push('savings_1000');
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error in enhanced sendEnhancedAIMessage:', error);
    // Fallback to basic response
    return {
      message: "Przepraszam, wystąpił problem z uzyskaniem odpowiedzi. Czy możesz powtórzyć swoje pytanie?",
      updatedProfile: userProfile || {}
    };
  }
};

// Helper function to determine node ID from step and previous decisions
const getNodeIdFromStep = (step, decisions, advisorId) => {
  if (step === 0) return "root";
  
  const advisorToGoalMap = {
    "budget_planner": "emergency_fund",
    "savings_strategist": "home_purchase",
    "execution_expert": "debt_reduction",
    "optimization_advisor": "retirement"
  };
  
  const goal = advisorToGoalMap[advisorId] || "emergency_fund";
  
  // Goal-specific node mapping
  if (goal === "emergency_fund") {
    if (step === 1) return "ef_timeframe";
    if (step === 2) return "ef_amount";
    if (step === 3) return "ef_savings_method";
  } 
  else if (goal === "debt_reduction") {
    if (step === 1) return "debt_type";
    if (step === 2) return "debt_total_amount";
    if (step === 3) return "debt_strategy";
  }
  else if (goal === "home_purchase") {
    if (step === 1) return "home_timeframe";
    if (step === 2) return "home_down_payment";
    if (step === 3) return "home_budget";
  }
  else if (goal === "retirement") {
    if (step === 1) return "retirement_age";
    if (step === 2) return "retirement_current_age";
    if (step === 3) return "retirement_vehicle";
  }
  
  // Fallback
  return `step_${step}`;
};

export const useAIChatLogic = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [finalRecommendation, setFinalRecommendation] = useState(null);
  const previousProfileRef = useRef(null);

  // Initialize user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          setUserProfile(profile);
          previousProfileRef.current = {...profile};
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  // Load chat history when advisor changes
  const loadChatHistory = async (advisorId) => {
    try {
      const history = await getChatHistory(advisorId);
      if (history && history.messages && history.messages.length > 0) {
        setChatMessages(history.messages);
      } else {
        // If there's no history, add initial advisor message
        const advisor = ADVISORS.find(a => a.id === advisorId);
        if (advisor) {
          const initialMessage = {
            role: 'assistant',
            content: advisor.initialMessage || `Witaj! Jestem ${advisor.name}. W czym mogę pomóc?`,
            timestamp: new Date().toISOString()
          };
          setChatMessages([initialMessage]);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // Add initial message even if fetch fails
      const advisor = ADVISORS.find(a => a.id === advisorId);
      if (advisor) {
        const initialMessage = {
          role: 'assistant',
          content: advisor.initialMessage || `Witaj! Jestem ${advisor.name}. W czym mogę pomóc?`,
          timestamp: new Date().toISOString()
        };
        setChatMessages([initialMessage]);
      }
    }
  };

  // Load decision options for decision tree
  const loadDecisionOptions = async (advisorId, currentStep, decisionPath) => {
    setLoading(true);
    try {
      // Create a properly formatted decision path from the current state
      const formattedDecisionPath = decisionPath.map((decision, index) => ({
        step: index,
        node_id: decision.step !== undefined ? 
          (index === 0 ? "root" : getNodeIdFromStep(index, decisionPath, advisorId)) : undefined,
        selection: decision.selection,
        value: decision.value
      }));

      // Call the decision tree service
      const options = await decisionTreeService.processDecisionStep(
        advisorId, 
        currentStep, 
        formattedDecisionPath
      );

      setDecisionOptions(options);
      
      // If there are no options, we've reached the end of the tree
      if (!options || options.length === 0) {
        return { shouldGenerateRecommendation: true };
      }
      
      return { shouldGenerateRecommendation: false };
    } catch (error) {
      console.error('Error loading decision options:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Generate final recommendation
  const generateFinalRecommendation = async (advisorId, decisionPath, userProfile) => {
    setLoading(true);
    try {
      // Create a properly formatted decision path from the current state
      const formattedDecisionPath = decisionPath.map((decision, index) => ({
        step: index,
        node_id: decision.step !== undefined ? 
          (index === 0 ? "root" : getNodeIdFromStep(index, decisionPath, advisorId)) : undefined,
        selection: decision.selection,
        value: decision.value
      }));

      // Call the decision tree service to generate the recommendation
      const recommendation = await decisionTreeService.generateReport(
        advisorId, 
        formattedDecisionPath, 
        userProfile
      );

      setFinalRecommendation(recommendation);
      return recommendation;
    } catch (error) {
      console.error('Error generating recommendation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send message to AI
  const sendMessage = async (message, advisorId, decisionPath) => {
    if (!message.trim()) return;
    
    let sentimentData;
    try {
      sentimentData = await analyzeSentiment(message);
      console.log('Sentiment analysis:', sentimentData);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      sentimentData = { sentiment: 'neutral', confidence: 0.5 };
    }
    
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      sentiment: sentimentData.sentiment
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setLoading(true);
    
    try {
      // Call the enhanced AI message function
      const response = await sendEnhancedAIMessage(
        message,
        advisorId,
        userProfile,
        decisionPath,
        sentimentData
      );
      
      if (response && response.message) {
        const aiMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        setChatMessages(finalMessages);
        
        // Save chat history
        await saveChatHistory(advisorId, finalMessages);
        
        // Update user profile if needed
        if (response.updatedProfile) {
          setUserProfile(response.updatedProfile);
        }
        
        return response;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      setChatMessages([
        ...updatedMessages,
        {
          role: 'system',
          content: 'Przepraszamy, wystąpił błąd podczas komunikacji z doradcą. Spróbuj ponownie później.',
          timestamp: new Date().toISOString()
        }
      ]);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    userProfile,
    setUserProfile,
    chatMessages,
    setChatMessages,
    loading,
    decisionOptions,
    finalRecommendation,
    setFinalRecommendation,
    loadChatHistory,
    loadDecisionOptions,
    generateFinalRecommendation,
    sendMessage,
    previousProfileRef
  };
};