import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  CircularProgress, 
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip as MuiTooltip,
  Divider,
  Snackbar,
  Alert,
  Slide,
  Slider,
  Chip,
  Step,
  Stepper,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  ArrowForward,
  Settings,
  Info,
  ArrowBack,
  Help,
  Refresh,
  Check,
  Close as CloseIcon,
  Mic,
  MicOff,
  EmojiEvents,
  TrendingUp,
  Save
} from '@mui/icons-material';
import jsPDF from 'jspdf'; // Dodano bibliotekę jsPDF do generowania PDF

// Rejestracja komponentów Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Opcje dla pól formularza onboardingowego
const incomeOptions = [
  { value: 'below_2000', label: 'Poniżej 2000 zł' },
  { value: '2000_4000', label: '2000 - 4000 zł' },
  { value: '4000_6000', label: '4000 - 6000 zł' },
  { value: '6000_8000', label: '6000 - 8000 zł' },
  { value: 'above_8000', label: 'Powyżej 8000 zł' }
];

const savingsOptions = [
  { value: '0_1000', label: '0 - 1000 zł' },
  { value: '1000_5000', label: '1000 - 5000 zł' },
  { value: '5000_10000', label: '5000 - 10 000 zł' },
  { value: '10000_20000', label: '10 000 - 20 000 zł' },
  { value: 'above_20000', label: 'Powyżej 20 000 zł' }
];

// Update the ADVISORS array to better align with specific financial goals
const ADVISORS = [
  { 
    id: 'budget_planner', 
    name: 'Planista Budżetu', 
    description: 'Ekspert od funduszu awaryjnego i budżetowania.', 
    icon: '📊',
    goal: 'emergency_fund',
    specialty: 'Pomogę Ci zbudować solidny fundusz awaryjny, który zapewni Ci bezpieczeństwo finansowe w nieprzewidzianych sytuacjach.',
    initialMessage: 'Witaj! Jestem Planistą Budżetu. Moją specjalnością jest pomoc w zbudowaniu funduszu awaryjnego i efektywnym zarządzaniu budżetem. Jak mogę Ci pomóc?'
  },
  { 
    id: 'savings_strategist', 
    name: 'Strateg Oszczędności', 
    description: 'Specjalista od oszczędzania na cele długoterminowe.', 
    icon: '💰',
    goal: 'home_purchase',
    specialty: 'Pomogę Ci zrealizować plan zakupu nieruchomości poprzez odpowiednią strategię oszczędzania.',
    initialMessage: 'Witaj! Jestem Strategiem Oszczędności. Specjalizuję się w planowaniu długoterminowych celów, jak zakup nieruchomości. Jak mogę Ci pomóc?'
  },
  { 
    id: 'execution_expert', 
    name: 'Ekspert Spłaty Zadłużenia', 
    description: 'Specjalista od redukcji zadłużenia.', 
    icon: '🎯',
    goal: 'debt_reduction',
    specialty: 'Pomogę Ci opracować optymalną strategię spłaty zadłużenia, dopasowaną do Twojej sytuacji.',
    initialMessage: 'Witaj! Jestem Ekspertem Spłaty Zadłużenia. Moją specjalnością jest pomoc w redukcji zadłużenia w optymalny sposób. Jak mogę Ci pomóc?'
  },
  { 
    id: 'optimization_advisor', 
    name: 'Doradca Emerytalny', 
    description: 'Specjalista od planowania emerytalnego.', 
    icon: '⚙️',
    goal: 'retirement',
    specialty: 'Pomogę Ci zaplanować zabezpieczenie emerytalne dopasowane do Twoich potrzeb i możliwości.',
    initialMessage: 'Witaj! Jestem Doradcą Emerytalnym. Specjalizuję się w planowaniu zabezpieczenia emerytalnego. Jak mogę Ci pomóc?'
  }
];

// Helper functions for the chat
const getGoalName = (goalType) => {
  switch(goalType) {
    case 'emergency_fund': return 'funduszu awaryjnego';
    case 'debt_reduction': return 'redukcji zadłużenia';
    case 'home_purchase': return 'zakupu nieruchomości';
    case 'retirement': return 'zabezpieczenia emerytalnego';
    case 'education': return 'finansowania edukacji';
    case 'vacation': return 'wakacji';
    default: return 'celu finansowego';
  }
};

const getFirstStepForGoal = (goalType) => {
  switch(goalType) {
    case 'emergency_fund': 
      return 'Określ swoje miesięczne wydatki, aby ustalić docelową kwotę funduszu awaryjnego';
    case 'debt_reduction': 
      return 'Sporządź listę wszystkich swoich zobowiązań z kwotami, oprocentowaniem i terminami spłaty';
    case 'home_purchase': 
      return 'Otwórz dedykowane konto oszczędnościowe na wkład własny';
    case 'retirement': 
      return 'Oszacuj swoje potrzeby finansowe na emeryturze';
    default: 
      return 'Zdefiniuj dokładnie swój cel finansowy';
  }
};

const getSecondStepForGoal = (goalType) => {
  switch(goalType) {
    case 'emergency_fund': 
      return 'Wybierz bezpieczne, płynne instrumenty finansowe (konto oszczędnościowe, lokaty)';
    case 'debt_reduction': 
      return 'Przygotuj budżet, który pozwoli przeznaczyć maksymalną kwotę na spłatę zadłużenia';
    case 'home_purchase': 
      return 'Ustaw automatyczne przelewy na konto oszczędnościowe w dniu wypłaty';
    case 'retirement': 
      return 'Wybierz odpowiednie instrumenty inwestycyjne (IKE/IKZE, akcje, obligacje)';
    default: 
      return 'Ustal realny harmonogram realizacji celu';
  }
};

const getThirdStepForGoal = (goalType) => {
  switch(goalType) {
    case 'emergency_fund': 
      return 'Automatyzuj proces oszczędzania poprzez stałe zlecenie po otrzymaniu wynagrodzenia';
    case 'debt_reduction': 
      return 'Zastosuj wybraną metodę spłaty (lawina, kula śnieżna) i monitoruj postępy';
    case 'home_purchase': 
      return 'Regularnie monitoruj rynek nieruchomości w interesujących Cię lokalizacjach';
    case 'retirement': 
      return 'Regularnie rewizuj strategię inwestycyjną, dostosowując ją do wieku i sytuacji';
    default: 
      return 'Regularnie monitoruj postępy w realizacji celu';
  }
};

// Helper function to get display name for goals
const getGoalDisplayName = (goal) => {
  switch(goal) {
    case 'emergency_fund': return 'Fundusz awaryjny';
    case 'debt_reduction': return 'Redukcja zadłużenia';
    case 'home_purchase': return 'Zakup nieruchomości';
    case 'retirement': return 'Zabezpieczenie emerytalne';
    case 'education': return 'Finansowanie edukacji';
    case 'vacation': return 'Wakacje i podróże';
    default: return 'Ogólne doradztwo';
  }
};

// Mock functions for sentiment analysis
const analyzeSentiment = async (text) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const lowerText = text.toLowerCase();
  const negativeWords = ['problem', 'trudno', 'stres', 'martwi', 'obawa', 'nie dam rady', 'boję'];
  const positiveWords = ['super', 'świetnie', 'dobrze', 'cieszy', 'podoba', 'wspaniały', 'dziękuję'];
  let sentiment = 'neutral';
  let confidence = 0.5;
  if (negativeWords.some(word => lowerText.includes(word))) {
    sentiment = 'negative';
    confidence = 0.7;
  } else if (positiveWords.some(word => lowerText.includes(word))) {
    sentiment = 'positive';
    confidence = 0.7;
  }
  return { sentiment, confidence };
};

// Mock functions for chat history
const getChatHistory = async (advisorId) => {
  return {
    messages: []  // Return empty messages to ensure we add the initial message
  };
};

const saveChatHistory = async (advisorId, messages) => {
  console.log('Chat history saved', { advisorId, messagesCount: messages.length });
  return true;
};

// Mock function for user profile
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

// Enhanced chat functionality to work with the decision tree
const sendAIMessage = async (message, advisorId, userProfile, decisionPath, sentimentData = null) => {
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

    // For demonstration, we'll use a mock approach
    // In a real implementation, this would call the API with the full context
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
      // In a real implementation, we would trigger the decision tree UI here
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
    console.error('Error in enhanced sendAIMessage:', error);
    // Fallback to basic response
    return {
      message: "Przepraszam, wystąpił problem z uzyskaniem odpowiedzi. Czy możesz powtórzyć swoje pytanie?",
      updatedProfile: userProfile || {}
    };
  }
};

// Decision tree service with improved implementation
const decisionTreeService = {
  processDecisionStep: async (advisorId, step, decisionPath) => {
    try {
      // Create the request body
      const requestBody = {
        user_id: 1, // Default user ID, in a real app would be the actual user ID
        advisor_id: advisorId,
        step: step,
        decision_path: decisionPath
      };

      // In a real implementation, this would be an API call to the backend
      // const response = await fetch('/api/financial-tree/process-step', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(requestBody)
      // });
      // return await response.json();

      // For now, simulate API response based on mock data
      console.log(`Processing step ${step} for advisor ${advisorId}`);
      
      // Map advisor ID to appropriate financial goal
      let financialGoal;
      if (advisorId === "budget_planner") {
        financialGoal = "emergency_fund";
      } else if (advisorId === "savings_strategist") {
        financialGoal = "home_purchase";
      } else if (advisorId === "execution_expert") {
        financialGoal = "debt_reduction";
      } else if (advisorId === "optimization_advisor") {
        financialGoal = "retirement";
      } else {
        financialGoal = "emergency_fund"; // Default
      }

      // Simulate tree structure based on goal
      if (step === 0) {
        // First question depends on the advisor/goal
        if (financialGoal === "emergency_fund") {
          return [
            {
              id: "short",
              text: "W ciągu 6 miesięcy",
              value: "short",
              question: "W jakim czasie chcesz zgromadzić fundusz awaryjny?"
            },
            {
              id: "medium",
              text: "W ciągu roku",
              value: "medium",
              question: "W jakim czasie chcesz zgromadzić fundusz awaryjny?"
            },
            {
              id: "long",
              text: "W ciągu 1-2 lat",
              value: "long",
              question: "W jakim czasie chcesz zgromadzić fundusz awaryjny?"
            }
          ];
        } else if (financialGoal === "debt_reduction") {
          return [
            {
              id: "credit_card",
              text: "Karty kredytowe / Chwilówki (wysokie oprocentowanie)",
              value: "credit_card",
              question: "Jaki rodzaj zadłużenia chcesz spłacić w pierwszej kolejności?"
            },
            {
              id: "consumer",
              text: "Kredyty konsumpcyjne",
              value: "consumer",
              question: "Jaki rodzaj zadłużenia chcesz spłacić w pierwszej kolejności?"
            },
            {
              id: "mortgage",
              text: "Kredyt hipoteczny",
              value: "mortgage",
              question: "Jaki rodzaj zadłużenia chcesz spłacić w pierwszej kolejności?"
            },
            {
              id: "multiple",
              text: "Mam kilka różnych zobowiązań",
              value: "multiple",
              question: "Jaki rodzaj zadłużenia chcesz spłacić w pierwszej kolejności?"
            }
          ];
        } else if (financialGoal === "home_purchase") {
          return [
            {
              id: "short",
              text: "W ciągu 1-2 lat",
              value: "short",
              question: "W jakim czasie planujesz zakup nieruchomości?"
            },
            {
              id: "medium",
              text: "W ciągu 3-5 lat",
              value: "medium",
              question: "W jakim czasie planujesz zakup nieruchomości?"
            },
            {
              id: "long",
              text: "W ciągu 5-10 lat",
              value: "long",
              question: "W jakim czasie planujesz zakup nieruchomości?"
            }
          ];
        } else if (financialGoal === "retirement") {
          return [
            {
              id: "early",
              text: "Wcześniej niż wiek emerytalny",
              value: "early",
              question: "W jakim wieku planujesz przejść na emeryturę?"
            },
            {
              id: "standard",
              text: "W standardowym wieku emerytalnym",
              value: "standard",
              question: "W jakim wieku planujesz przejść na emeryturę?"
            },
            {
              id: "late",
              text: "Później niż wiek emerytalny",
              value: "late",
              question: "W jakim wieku planujesz przejść na emeryturę?"
            }
          ];
        }
      } else if (step === 1) {
        // Second question depends on the goal
        if (financialGoal === "emergency_fund") {
          return [
            {
              id: "three",
              text: "3 miesiące wydatków",
              value: "three",
              question: "Ile miesięcznych wydatków chcesz pokryć funduszem awaryjnym?"
            },
            {
              id: "six",
              text: "6 miesięcy wydatków",
              value: "six",
              question: "Ile miesięcznych wydatków chcesz pokryć funduszem awaryjnym?"
            },
            {
              id: "twelve",
              text: "12 miesięcy wydatków",
              value: "twelve",
              question: "Ile miesięcznych wydatków chcesz pokryć funduszem awaryjnym?"
            }
          ];
        } else if (financialGoal === "debt_reduction") {
          return [
            {
              id: "small",
              text: "Do 10,000 zł",
              value: "small",
              question: "Jaka jest łączna kwota Twojego zadłużenia?"
            },
            {
              id: "medium",
              text: "10,000 - 50,000 zł",
              value: "medium",
              question: "Jaka jest łączna kwota Twojego zadłużenia?"
            },
            {
              id: "large",
              text: "50,000 - 200,000 zł",
              value: "large",
              question: "Jaka jest łączna kwota Twojego zadłużenia?"
            },
            {
              id: "very_large",
              text: "Powyżej 200,000 zł",
              value: "very_large",
              question: "Jaka jest łączna kwota Twojego zadłużenia?"
            }
          ];
        } else if (financialGoal === "home_purchase") {
          return [
            {
              id: "ten",
              text: "10% (minimalne wymaganie)",
              value: "ten",
              question: "Ile procent wartości nieruchomości planujesz zgromadzić jako wkład własny?"
            },
            {
              id: "twenty",
              text: "20% (standard)",
              value: "twenty",
              question: "Ile procent wartości nieruchomości planujesz zgromadzić jako wkład własny?"
            },
            {
              id: "thirty_plus",
              text: "30% lub więcej",
              value: "thirty_plus",
              question: "Ile procent wartości nieruchomości planujesz zgromadzić jako wkład własny?"
            },
            {
              id: "full",
              text: "100% (zakup bez kredytu)",
              value: "full",
              question: "Ile procent wartości nieruchomości planujesz zgromadzić jako wkład własny?"
            }
          ];
        } else if (financialGoal === "retirement") {
          return [
            {
              id: "early",
              text: "Początek kariery (20-35 lat)",
              value: "early",
              question: "Na jakim etapie życia zawodowego jesteś obecnie?"
            },
            {
              id: "mid",
              text: "Środek kariery (36-50 lat)",
              value: "mid",
              question: "Na jakim etapie życia zawodowego jesteś obecnie?"
            },
            {
              id: "late",
              text: "Późny etap kariery (51+ lat)",
              value: "late",
              question: "Na jakim etapie życia zawodowego jesteś obecnie?"
            }
          ];
        }
      } else if (step === 2) {
        // Third question depends on the goal
        if (financialGoal === "emergency_fund") {
          return [
            {
              id: "automatic",
              text: "Automatyczne odkładanie stałej kwoty",
              value: "automatic",
              question: "Jaki sposób oszczędzania preferujesz?"
            },
            {
              id: "percentage",
              text: "Odkładanie procentu dochodów",
              value: "percentage",
              question: "Jaki sposób oszczędzania preferujesz?"
            },
            {
              id: "surplus",
              text: "Odkładanie nadwyżek z budżetu",
              value: "surplus",
              question: "Jaki sposób oszczędzania preferujesz?"
            }
          ];
        } else if (financialGoal === "debt_reduction") {
          return [
            {
              id: "avalanche",
              text: "Najpierw najwyżej oprocentowane (metoda lawiny)",
              value: "avalanche",
              question: "Jaką strategię spłaty zadłużenia preferujesz?"
            },
            {
              id: "snowball",
              text: "Najpierw najmniejsze kwoty (metoda kuli śnieżnej)",
              value: "snowball",
              question: "Jaką strategię spłaty zadłużenia preferujesz?"
            },
            {
              id: "consolidation",
              text: "Konsolidacja zadłużenia",
              value: "consolidation",
              question: "Jaką strategię spłaty zadłużenia preferujesz?"
            },
            {
              id: "not_sure",
              text: "Nie jestem pewien/pewna",
              value: "not_sure",
              question: "Jaką strategię spłaty zadłużenia preferujesz?"
            }
          ];
        } else if (financialGoal === "home_purchase") {
          return [
            {
              id: "small",
              text: "Do 300,000 zł",
              value: "small",
              question: "Jaki jest Twój budżet na zakup nieruchomości?"
            },
            {
              id: "medium",
              text: "300,000 - 600,000 zł",
              value: "medium",
              question: "Jaki jest Twój budżet na zakup nieruchomości?"
            },
            {
              id: "large",
              text: "600,000 - 1,000,000 zł",
              value: "large",
              question: "Jaki jest Twój budżet na zakup nieruchomości?"
            },
            {
              id: "very_large",
              text: "Powyżej 1,000,000 zł",
              value: "very_large",
              question: "Jaki jest Twój budżet na zakup nieruchomości?"
            }
          ];
        } else if (financialGoal === "retirement") {
          return [
            {
              id: "ike_ikze",
              text: "IKE/IKZE (indywidualne konta emerytalne)",
              value: "ike_ikze",
              question: "Jakie formy oszczędzania na emeryturę rozważasz?"
            },
            {
              id: "investment",
              text: "Własne inwestycje długoterminowe",
              value: "investment",
              question: "Jakie formy oszczędzania na emeryturę rozważasz?"
            },
            {
              id: "real_estate",
              text: "Nieruchomości na wynajem",
              value: "real_estate",
              question: "Jakie formy oszczędzania na emeryturę rozważasz?"
            },
            {
              id: "combined",
              text: "Strategia łączona",
              value: "combined",
              question: "Jakie formy oszczędzania na emeryturę rozważasz?"
            }
          ];
        }
      } else {
        // No more questions, return empty array to trigger recommendation generation
        return [];
      }

      // Fallback if none of the specific paths matched
      return [];
    } catch (error) {
      console.error("Error in processDecisionStep:", error);
      return [
        {
          id: "error",
          text: "Wystąpił błąd, spróbuj ponownie",
          value: "error",
          question: "Przepraszamy, wystąpił błąd. Czy chcesz spróbować ponownie?"
        }
      ];
    }
  },

  generateReport: async (advisorId, decisionPath, userProfile) => {
    try {
      // Create the request body
      const requestBody = {
        user_id: 1, // Default user ID, in a real app would be the actual user ID
        advisor_id: advisorId,
        decision_path: decisionPath,
        user_profile: userProfile
      };

      // In a real implementation, this would be an API call to the backend
      // const response = await fetch('/api/financial-tree/generate-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(requestBody)
      // });
      // return await response.json();

      // For now, simulate API response based on mock data
      console.log(`Generating report for advisor ${advisorId}`);
      
      // Map advisor ID to appropriate financial goal
      let financialGoal;
      if (advisorId === "budget_planner") {
        financialGoal = "emergency_fund";
      } else if (advisorId === "savings_strategist") {
        financialGoal = "home_purchase";
      } else if (advisorId === "execution_expert") {
        financialGoal = "debt_reduction";
      } else if (advisorId === "optimization_advisor") {
        financialGoal = "retirement";
      } else {
        financialGoal = "emergency_fund"; // Default
      }

      // Generate report based on financial goal and decision path
      if (financialGoal === "emergency_fund") {
        // Find the answers from the decision path
        const timeframeDecision = decisionPath.find(d => d.selection === "short" || d.selection === "medium" || d.selection === "long");
        const amountDecision = decisionPath.find(d => d.selection === "three" || d.selection === "six" || d.selection === "twelve");
        const methodDecision = decisionPath.find(d => d.selection === "automatic" || d.selection === "percentage" || d.selection === "surplus");
        
        const timeframe = timeframeDecision ? timeframeDecision.selection : "medium";
        const amount = amountDecision ? amountDecision.selection : "six";
        const method = methodDecision ? methodDecision.selection : "automatic";
        
        // Map selections to human-readable text
        const timeframeText = {
          "short": "6 miesięcy",
          "medium": "roku",
          "long": "1-2 lat"
        }[timeframe];
        
        const amountText = {
          "three": "3 miesiące",
          "six": "6 miesięcy",
          "twelve": "12 miesięcy"
        }[amount];
        
        const methodText = {
          "automatic": "automatycznego odkładania stałej kwoty",
          "percentage": "odkładania procentu dochodów",
          "surplus": "odkładania nadwyżek z budżetu"
        }[method];
        
        return {
          summary: `Na podstawie Twoich odpowiedzi rekomendujemy strategię budowy funduszu awaryjnego pokrywającego ${amountText} wydatków w ciągu ${timeframeText} poprzez wykorzystanie ${methodText}.`,
          steps: [
            `Określ swoje miesięczne wydatki i pomnóż je przez ${amountText.split(" ")[0]}, aby ustalić docelową kwotę funduszu`,
            "Wybierz bezpieczne, płynne instrumenty finansowe (np. konto oszczędnościowe, lokaty krótkoterminowe)",
            "Skorzystaj z funkcji automatycznych przelewów w swoim banku",
            "Korzystaj z funduszu tylko w prawdziwych sytuacjach awaryjnych"
          ]
        };
      } else if (financialGoal === "debt_reduction") {
        // Find the answers from the decision path
        const typeDecision = decisionPath.find(d => ["credit_card", "consumer", "mortgage", "multiple"].includes(d.selection));
        const amountDecision = decisionPath.find(d => ["small", "medium", "large", "very_large"].includes(d.selection));
        const strategyDecision = decisionPath.find(d => ["avalanche", "snowball", "consolidation", "not_sure"].includes(d.selection));
        
        const type = typeDecision ? typeDecision.selection : "credit_card";
        const amount = amountDecision ? amountDecision.selection : "medium";
        const strategy = strategyDecision ? strategyDecision.selection : "avalanche";
        
        // Map selections to human-readable text
        const typeText = {
          "credit_card": "kart kredytowych i chwilówek",
          "consumer": "kredytów konsumpcyjnych",
          "mortgage": "kredytu hipotecznego",
          "multiple": "wielu różnych zobowiązań"
        }[type];
        
        const strategyText = {
          "avalanche": "metodą lawiny (spłata zobowiązań z najwyższym oprocentowaniem w pierwszej kolejności)",
          "snowball": "metodą kuli śnieżnej (spłata najmniejszych zobowiązań w pierwszej kolejności)",
          "consolidation": "poprzez konsolidację zadłużenia",
          "not_sure": "strategią dostosowaną do Twojej sytuacji"
        }[strategy];
        
        return {
          summary: `Na podstawie Twoich odpowiedzi rekomendujemy strategię spłaty ${typeText} ${strategyText}.`,
          steps: [
            "Stwórz pełną listę wszystkich zobowiązań z kwotami, oprocentowaniem i terminami",
            "Przygotuj budżet, który pozwoli przeznaczyć maksymalną kwotę na spłatę zadłużenia",
            strategy === "avalanche" ? "Dodatkowe środki kieruj na zobowiązanie z najwyższym oprocentowaniem" : 
            strategy === "snowball" ? "Dodatkowe środki kieruj na zobowiązanie z najmniejszą kwotą" :
            strategy === "consolidation" ? "Porównaj oferty kredytów konsolidacyjnych od różnych banków" :
            "Skonsultuj się z doradcą finansowym w celu wyboru optymalnej strategii",
            "Unikaj zaciągania nowych długów w trakcie realizacji planu spłaty"
          ]
        };
      } else if (financialGoal === "home_purchase") {
        // Find the answers from the decision path
        const timeframeDecision = decisionPath.find(d => ["short", "medium", "long"].includes(d.selection));
        const downPaymentDecision = decisionPath.find(d => ["ten", "twenty", "thirty_plus", "full"].includes(d.selection));
        const budgetDecision = decisionPath.find(d => ["small", "medium", "large", "very_large"].includes(d.selection));
        
        const timeframe = timeframeDecision ? timeframeDecision.selection : "medium";
        const downPayment = downPaymentDecision ? downPaymentDecision.selection : "twenty";
        const budget = budgetDecision ? budgetDecision.selection : "medium";
        
        // Map selections to human-readable text
        const timeframeText = {
          "short": "1-2 lat",
          "medium": "3-5 lat",
          "long": "5-10 lat"
        }[timeframe];
        
        const downPaymentText = {
          "ten": "10%",
          "twenty": "20%",
          "thirty_plus": "30% lub więcej",
          "full": "100% (bez kredytu)"
        }[downPayment];
        
        const budgetText = {
          "small": "do 300 tys. zł",
          "medium": "300-600 tys. zł",
          "large": "600 tys. - 1 mln zł",
          "very_large": "powyżej 1 mln zł"
        }[budget];
        
        return {
          summary: `Na podstawie Twoich odpowiedzi rekomendujemy strategię oszczędzania na zakup nieruchomości o wartości ${budgetText} z wkładem własnym ${downPaymentText} w okresie ${timeframeText}.`,
          steps: [
            "Utwórz dedykowane konto oszczędnościowe na wkład własny",
            "Ustaw automatyczne przelewy na to konto w dniu wypłaty",
            timeframe === "short" ? "Maksymalizuj oszczędności - rozważ odkładanie 30-40% miesięcznych dochodów" :
            timeframe === "medium" ? "Ustaw plan systematycznego oszczędzania 20-25% miesięcznych dochodów" :
            "Rozważ bardziej zróżnicowaną strategię inwestycyjną dla długoterminowego oszczędzania",
            "Monitoruj rynek nieruchomości i trendy cenowe w interesujących Cię lokalizacjach"
          ]
        };
      } else if (financialGoal === "retirement") {
        // Find the answers from the decision path
        const ageDecision = decisionPath.find(d => ["early", "standard", "late"].includes(d.selection) && decisionPath.indexOf(d) === 0);
        const currentAgeDecision = decisionPath.find(d => ["early", "mid", "late"].includes(d.selection) && decisionPath.indexOf(d) === 1);
        const vehicleDecision = decisionPath.find(d => ["ike_ikze", "investment", "real_estate", "combined"].includes(d.selection));
        
        const age = ageDecision ? ageDecision.selection : "standard";
        const currentAge = currentAgeDecision ? currentAgeDecision.selection : "mid";
        const vehicle = vehicleDecision ? vehicleDecision.selection : "combined";
        
        // Map selections to human-readable text
        const ageText = {
          "early": "wcześniejszej emerytury",
          "standard": "emerytury w standardowym wieku",
          "late": "późniejszej emerytury"
        }[age];
        
        const currentAgeText = {
          "early": "wczesnym etapie kariery (20-35 lat)",
          "mid": "środkowym etapie kariery (36-50 lat)",
          "late": "późnym etapie kariery (51+ lat)"
        }[currentAge];
        
        const vehicleText = {
          "ike_ikze": "IKE/IKZE",
          "investment": "własne inwestycje długoterminowe",
          "real_estate": "nieruchomości na wynajem",
          "combined": "strategię łączoną"
        }[vehicle];
        
        return {
          summary: `Na podstawie Twoich odpowiedzi rekomendujemy strategię budowania zabezpieczenia na ${ageText} będąc obecnie na ${currentAgeText} poprzez ${vehicleText}.`,
          steps: [
            "Określ swoje potrzeby finansowe na emeryturze",
            currentAge === "early" ? "Wykorzystaj długi horyzont inwestycyjny - rozważ wyższy udział akcji (70-80%)" :
            currentAge === "mid" ? "Zwiększ kwotę oszczędności do 15-20% dochodów" :
            "Maksymalizuj oszczędności - rozważ odkładanie 25-30% dochodów",
            vehicle === "ike_ikze" ? "Maksymalizuj roczne wpłaty do limitu (szczególnie na IKZE dla bieżących korzyści podatkowych)" :
            vehicle === "investment" ? "Stwórz zdywersyfikowany portfel dostosowany do Twojego horyzontu emerytalnego" :
            vehicle === "real_estate" ? "Inwestuj w nieruchomości generujące stabilny przepływ gotówki (wynajem)" :
            "Łącz różne instrumenty (państwowy system emerytalny, IKE/IKZE, własne inwestycje)",
            "Systematycznie weryfikuj i dostosowuj strategię do zmieniających się warunków"
          ]
        };
      }

      // Fallback if none of the specific paths matched
      return {
        summary: "Na podstawie Twoich odpowiedzi przygotowaliśmy ogólne rekomendacje finansowe.",
        steps: [
          "Stwórz budżet miesięczny i monitoruj wydatki",
          "Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków",
          "Spłać zadłużenia o wysokim oprocentowaniu",
          "Regularnie odkładaj na długoterminowe cele"
        ]
      };
    } catch (error) {
      console.error("Error in generateReport:", error);
      return {
        summary: "Wystąpił błąd podczas generowania raportu.",
        steps: [
          "Spróbuj ponownie później",
          "Sprawdź połączenie internetowe",
          "Skontaktuj się z obsługą klienta jeśli problem będzie się powtarzał"
        ]
      };
    }
  }
};

const ACHIEVEMENTS = [
  { id: 'first_goal', title: 'Pierwszy krok', description: 'Ustawiłeś cel', icon: '🚀' },
  { id: 'savings_1000', title: 'Oszczędzający', description: 'Zaoszczędziłeś 1000 zł', icon: '💰' },
  { id: 'budget_3_months', title: 'Mistrz budżetu', description: '3 miesiące budżetu', icon: '📊' },
  { id: 'emergency_fund', title: 'Fundusz', description: 'Utworzyłeś fundusz awaryjny', icon: '🛡️' }
];

const COLORS = {
  primary: '#0F3057',
  secondary: '#00A896',
  background: '#f8f9fa',
  lightBackground: '#ffffff',
  text: '#333333',
  lightText: '#666666',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pl-PL';
      recognitionRef.current.onresult = (event) => setTranscript(event.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      if (recognitionRef.current && isListening) recognitionRef.current.stop();
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    setTranscript('');
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, supported: !!recognitionRef.current };
};

const FinancialProgressChart = ({ financialData, goalAmount }) => {
  const chartData = {
    labels: financialData.map(entry => entry.date),
    datasets: [
      { label: 'Oszczędności', data: financialData.map(entry => entry.amount), borderColor: COLORS.secondary, backgroundColor: 'rgba(0, 168, 150, 0.1)', fill: true, tension: 0.4 },
      { label: 'Cel', data: Array(financialData.length).fill(goalAmount), borderColor: COLORS.primary, borderDash: [5, 5], backgroundColor: 'rgba(0, 0, 0, 0)', fill: false }
    ]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.raw.toLocaleString()} zł` } }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Kwota (zł)' }, ticks: { callback: value => value.toLocaleString() + ' zł' } },
      x: { title: { display: true, text: 'Miesiąc' } }
    }
  };
  return <Box height={300} width="100%" mb={3}><Line data={chartData} options={chartOptions} /></Box>;
};

const AchievementNotification = ({ achievement, onClose }) => (
  <Slide direction="up" in={!!achievement}>
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', backgroundColor: '#f8f9d2', position: 'fixed', bottom: 20, right: 20, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: 350 }}>
      <Typography variant="h3" sx={{ mr: 2 }}>{achievement.icon}</Typography>
      <Box>
        <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>{achievement.title}</Typography>
        <Typography variant="body2">{achievement.description}</Typography>
      </Box>
      <IconButton onClick={onClose} sx={{ ml: 1 }}><CloseIcon /></IconButton>
    </Paper>
  </Slide>
);

const AIChatSection = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentAdvisor, setCurrentAdvisor] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [decisionPath, setDecisionPath] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', goal: '', timeframe: '', currentSavings: '', monthlyIncome: '' });
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [finalRecommendation, setFinalRecommendation] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [consents, setConsents] = useState({ dataProcessing: false, profiling: false });
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'info' });
  const [newAchievement, setNewAchievement] = useState(null);
  const [goalAmount, setGoalAmount] = useState(10000);
  const [showChart, setShowChart] = useState(false);

  const { isListening, transcript, startListening, stopListening, supported: speechRecognitionSupported } = useSpeechRecognition();
  const chatContainerRef = useRef(null);
  const previousProfileRef = useRef(null);

  useEffect(() => { if (transcript) setNewMessage(transcript); }, [transcript]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          setUserProfile(profile);
          previousProfileRef.current = {...profile};
          setIsAuthenticated(true);
          if (profile.onboardingComplete) {
            setIsOnboardingComplete(true);
            setProgressValue(profile.progress || 0);
          }
          if (profile.targetAmount) setGoalAmount(parseInt(profile.targetAmount));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setNotification({ show: true, message: 'Błąd pobierania profilu', severity: 'error' });
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentAdvisor) {
      const fetchChatHistory = async () => {
        try {
          const history = await getChatHistory(currentAdvisor.id);
          if (history && history.messages && history.messages.length > 0) {
            setChatMessages(history.messages);
          } else {
            // If there's no history, add initial advisor message
            const initialMessage = {
              role: 'assistant',
              content: currentAdvisor.initialMessage || `Witaj! Jestem ${currentAdvisor.name}. W czym mogę pomóc?`,
              timestamp: new Date().toISOString()
            };
            setChatMessages([initialMessage]);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
          // Add initial message even if fetch fails
          const initialMessage = {
            role: 'assistant',
            content: currentAdvisor.initialMessage || `Witaj! Jestem ${currentAdvisor.name}. W czym mogę pomóc?`,
            timestamp: new Date().toISOString()
          };
          setChatMessages([initialMessage]);
          setNotification({ show: true, message: 'Błąd pobierania historii', severity: 'warning' });
        }
      };
      fetchChatHistory();
    }
  }, [isAuthenticated, currentAdvisor]);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (currentAdvisor && isOnboardingComplete) loadDecisionOptions();
  }, [currentAdvisor, currentStep, isOnboardingComplete]);

  useEffect(() => {
    if (userProfile && previousProfileRef.current) {
      if (parseInt(previousProfileRef.current.currentSavings) < 1000 && parseInt(userProfile.currentSavings) >= 1000 && (!userProfile.achievements || !userProfile.achievements.includes('savings_1000'))) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'savings_1000');
        setNewAchievement(achievement);
      }
      previousProfileRef.current = {...userProfile};
    }
  }, [userProfile]);

  const loadDecisionOptions = async () => {
    setLoading(true);
    try {
      // Create a properly formatted decision path from the current state
      const formattedDecisionPath = decisionPath.map((decision, index) => ({
        step: index,
        node_id: decision.step !== undefined ? 
          (index === 0 ? "root" : getNodeIdFromStep(index, decisionPath)) : undefined,
        selection: decision.selection,
        value: decision.value
      }));

      // Call the decision tree service
      const options = await decisionTreeService.processDecisionStep(
        currentAdvisor.id, 
        currentStep, 
        formattedDecisionPath
      );

      setDecisionOptions(options);
      
      // If there are no options, we've reached the end of the tree
      if (!options || options.length === 0) {
        generateFinalRecommendation();
      }
    } catch (error) {
      console.error('Error loading decision options:', error);
      setNotification({ 
        show: true, 
        message: 'Błąd ładowania opcji decyzyjnych', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine node ID from step and previous decisions
  const getNodeIdFromStep = (step, decisions) => {
    // This mapping function would ideally be part of the backend API
    // Here we're using a simplified version based on the decision tree structure
    if (step === 0) return "root";
    
    const advisorToGoalMap = {
      "budget_planner": "emergency_fund",
      "savings_strategist": "home_purchase",
      "execution_expert": "debt_reduction",
      "optimization_advisor": "retirement"
    };
    
    const goal = advisorToGoalMap[currentAdvisor.id] || "emergency_fund";
    
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

  const generateFinalRecommendation = async () => {
    setLoading(true);
    try {
      // Create a properly formatted decision path from the current state
      const formattedDecisionPath = decisionPath.map((decision, index) => ({
        step: index,
        node_id: decision.step !== undefined ? 
          (index === 0 ? "root" : getNodeIdFromStep(index, decisionPath)) : undefined,
        selection: decision.selection,
        value: decision.value
      }));

      // Call the decision tree service to generate the recommendation
      const recommendation = await decisionTreeService.generateReport(
        currentAdvisor.id, 
        formattedDecisionPath, 
        userProfile
      );

      setFinalRecommendation(recommendation);
      
      // Update progress
      const newProgress = Math.min(100, progressValue + 25);
      setProgressValue(newProgress);
      
      // Update user profile
      if (userProfile) {
        const updatedProfile = { 
          ...userProfile, 
          progress: newProgress, 
          lastCompletedAdvisor: currentAdvisor.id 
        };
        
        // Check if this is the first goal achievement and award achievement if so
        if (!updatedProfile.achievements || !updatedProfile.achievements.includes('first_goal')) {
          const achievement = ACHIEVEMENTS.find(a => a.id === 'first_goal');
          setNewAchievement(achievement);
          updatedProfile.achievements = updatedProfile.achievements || [];
          updatedProfile.achievements.push('first_goal');
        }
        
        setUserProfile(updatedProfile);
      }
      
      setNotification({ 
        show: true, 
        message: 'Rekomendacje gotowe!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error generating recommendation:', error);
      setNotification({ 
        show: true, 
        message: 'Błąd generowania rekomendacji', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle decision selection
  const handleDecisionSelect = (optionIndex) => {
    const selectedOption = decisionOptions[optionIndex];
    
    // Create a new decision object
    const newDecision = {
      step: currentStep,
      selection: selectedOption.id,
      value: selectedOption.value
    };
    
    // Update the decision path
    const newPath = [...decisionPath, newDecision];
    setDecisionPath(newPath);
    
    // Calculate progress
    const stepsInFlow = 4; // Most paths are 4 steps long
    const newStepProgress = ((currentStep + 1) / stepsInFlow) * 100;
    const adjustedProgress = Math.min(75, progressValue + newStepProgress / stepsInFlow);
    setProgressValue(adjustedProgress);
    
    // Show notification
    setNotification({ 
      show: true, 
      message: 'Wybór zapisany!', 
      severity: 'success' 
    });
    
    // Move to next step
    setCurrentStep(currentStep + 1);
  };

  // Update handleSendMessage to integrate with the decision tree
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (isListening) stopListening();
    
    let sentimentData;
    try {
      sentimentData = await analyzeSentiment(newMessage);
      console.log('Sentiment analysis:', sentimentData);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      sentimentData = { sentiment: 'neutral', confidence: 0.5 };
    }
    
    const userMessage = {
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      sentiment: sentimentData.sentiment
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setNewMessage('');
    setLoading(true);
    
    try {
      // Call the enhanced AI message function
      const response = await sendAIMessage(
        newMessage,
        currentAdvisor?.id,
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
        await saveChatHistory(currentAdvisor.id, finalMessages);
        
        // Update user profile if needed
        if (response.updatedProfile) {
          setUserProfile(response.updatedProfile);
        }
        
        // Check if we should start decision tree
        if (response.startDecisionTree) {
          // Close the chat and show decision tree
          setChatVisible(false);
          // Reset decision path to start fresh
          setDecisionPath([]);
          setCurrentStep(0);
          // Load initial decision options
          loadDecisionOptions();
        }
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
      
      setNotification({
        show: true,
        message: 'Wystąpił błąd podczas wysyłania wiadomości',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Podaj swoje imię';
    if (!formData.goal.trim()) errors.goal = 'Wybierz cel';
    if (!formData.timeframe.trim()) errors.timeframe = 'Wybierz ramy czasowe';
    if (!formData.monthlyIncome.trim()) errors.monthlyIncome = 'Wybierz dochód';
    if (!consents.dataProcessing) errors.consents = 'Wymagana zgoda';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setLoading(true);
    try {
      let targetAmount = 10000;
      switch (formData.goal) {
        case 'emergency_fund': targetAmount = 12000; break;
        case 'home_purchase': targetAmount = 100000; break;
        case 'debt_reduction': targetAmount = 20000; break;
        case 'education': targetAmount = 15000; break;
        case 'vacation': targetAmount = 5000; break;
        default: targetAmount = 10000;
      }
      const profile = userProfile || {};
      const updatedProfile = {
        ...profile,
        name: formData.name,
        financialGoal: formData.goal,
        timeframe: formData.timeframe,
        currentSavings: formData.currentSavings || '0',
        monthlyIncome: formData.monthlyIncome,
        targetAmount: targetAmount.toString(),
        onboardingComplete: true,
        progress: 10,
        consents,
        achievements: profile.achievements || []
      };
      if (!updatedProfile.achievements.includes('first_goal')) {
        updatedProfile.achievements.push('first_goal');
        setTimeout(() => setNewAchievement(ACHIEVEMENTS.find(a => a.id === 'first_goal')), 1000);
      }
      setGoalAmount(targetAmount);
      setUserProfile(updatedProfile);
      setIsOnboardingComplete(true);
      setProgressValue(10);
      setNotification({ show: true, message: 'Dane zapisane!', severity: 'success' });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setNotification({ show: true, message: 'Błąd zapisu danych', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced PDF generation function with better formatting
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add company logo/header
    doc.setFillColor(15, 48, 87); // COLORS.primary
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DisiNow - Raport Finansowy', 105, 15, { align: 'center' });
    
    // Add user information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Raport przygotowany dla: ${userProfile.name || 'Użytkownika'}`, 20, 35);
    doc.text(`Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}`, 20, 42);
    
    // Add advisor information
    doc.setFillColor(0, 168, 150, 0.1); // Light COLORS.secondary
    doc.rect(20, 50, 170, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(`Doradca: ${currentAdvisor.name}`, 25, 58);
    
    // Add summary section
    doc.setFontSize(16);
    doc.setTextColor(15, 48, 87);
    doc.text('Podsumowanie', 20, 75);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Handle long summary text with text wrapping
    const summaryLines = doc.splitTextToSize(finalRecommendation.summary, 170);
    doc.text(summaryLines, 20, 85);
    
    // Calculate next Y position based on number of summary lines
    let yPos = 85 + (summaryLines.length * 7);
    
    // Add steps section
    if (finalRecommendation.steps && finalRecommendation.steps.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(15, 48, 87);
      doc.setFont('helvetica', 'bold');
      doc.text('Następne kroki', 20, yPos + 10);
      
      yPos += 20;
      
      // Add each step with bullet points
      finalRecommendation.steps.forEach((step, index) => {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Create bullet point
        doc.setFillColor(0, 168, 150); // COLORS.secondary
        doc.circle(25, yPos, 1.5, 'F');
        
        // Add step text with wrapping
        const stepLines = doc.splitTextToSize(step, 160);
        doc.text(stepLines, 30, yPos);
        
        // Move Y position for next step
        yPos += (stepLines.length * 7) + 10;
      });
    }
    
    // Add financial information
    doc.setFontSize(16);
    doc.setTextColor(15, 48, 87);
    doc.setFont('helvetica', 'bold');
    doc.text('Twoja sytuacja finansowa', 20, yPos + 10);
    
    yPos += 20;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Current financial situation
    doc.text(`Miesięczny dochód: ${userProfile.monthlyIncome || '0'} zł`, 25, yPos);
    yPos += 7;
    doc.text(`Obecne oszczędności: ${userProfile.currentSavings || '0'} zł`, 25, yPos);
    yPos += 7;
    doc.text(`Cel finansowy: ${userProfile.targetAmount || '0'} zł`, 25, yPos);
    
    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('© DisiNow - Twój inteligentny asystent finansowy', 105, 285, { align: 'center' });
    
    // Save the PDF
    doc.save('raport_finansowy.pdf');
    
    // Show success notification
    setNotification({
      show: true,
      message: 'Raport PDF został wygenerowany i pobrany',
      severity: 'success'
    });
  };

  const handleReset = () => {
    setCurrentAdvisor(null);
    setCurrentStep(0);
    setDecisionPath([]);
    setFinalRecommendation(null);
    setChatVisible(false);
    setDecisionOptions([]);
  };

  const toggleAdvancedMode = () => setAdvancedMode(!advancedMode);
  const changeAdvisor = () => {
    setCurrentAdvisor(null);
    setCurrentStep(0);
    setDecisionPath([]);
    setFinalRecommendation(null);
    setChatVisible(false);
  };
  const handleCloseAchievement = () => setNewAchievement(null);
  const toggleChart = () => setShowChart(!showChart);

  // Helper functions for decision tree visualization
  const getDecisionLabel = (decision, index) => {
    if (index === 0) {
      // First question label - based on advisor type
      const advisor = ADVISORS.find(a => a.id === currentAdvisor?.id);
      if (advisor) {
        return `Wybór celu: ${getGoalDisplayName(advisor.goal)}`;
      }
      return 'Wybór celu finansowego';
    }
    
    // For subsequent decisions, show the selected option text
    const decision_text = decisionOptions.find(opt => opt.id === decision.selection)?.text;
    if (decision_text) {
      return decision_text;
    }
    
    // Fallback labels based on goal type and step
    const goalType = currentAdvisor?.goal || 'emergency_fund';
    switch(goalType) {
      case 'emergency_fund':
        if (index === 1) return 'Wybór okresu czasu';
        if (index === 2) return 'Wybór wielkości funduszu';
        if (index === 3) return 'Wybór metody oszczędzania';
        break;
      case 'debt_reduction':
        if (index === 1) return 'Wybór rodzaju zadłużenia';
        if (index === 2) return 'Wybór kwoty zadłużenia';
        if (index === 3) return 'Wybór strategii spłaty';
        break;
      case 'home_purchase':
        if (index === 1) return 'Wybór okresu czasu';
        if (index === 2) return 'Wybór wkładu własnego';
        if (index === 3) return 'Wybór budżetu';
        break;
      case 'retirement':
        if (index === 1) return 'Wybór wieku emerytalnego';
        if (index === 2) return 'Wybór obecnego etapu kariery';
        if (index === 3) return 'Wybór formy oszczędzania';
        break;
    }
    
    return `Krok ${index + 1}`;
  };

  const getDecisionDescription = (decision, index) => {
    // Generate description based on selection
    const selection = decision.selection;
    
    // Map of common descriptions for selections
    const descriptions = {
      // Time horizons
      'short': 'Krótki okres czasu',
      'medium': 'Średni okres czasu',
      'long': 'Długi okres czasu',
      'very_long': 'Bardzo długi okres czasu',
      
      // Emergency fund amounts
      'three': '3 miesiące wydatków',
      'six': '6 miesięcy wydatków',
      'twelve': '12 miesięcy wydatków',
      
      // Saving methods
      'automatic': 'Automatyczne odkładanie stałej kwoty',
      'percentage': 'Odkładanie procentu dochodów',
      'surplus': 'Odkładanie nadwyżek z budżetu',
      
      // Debt types
      'credit_card': 'Karty kredytowe i chwilówki',
      'consumer': 'Kredyty konsumpcyjne',
      'mortgage': 'Kredyt hipoteczny',
      'multiple': 'Różne zobowiązania',
      
      // Debt strategies
      'avalanche': 'Metoda lawiny (najwyższe oprocentowanie)',
      'snowball': 'Metoda kuli śnieżnej (najmniejsze kwoty)',
      'consolidation': 'Konsolidacja zadłużenia',
      
      // Home purchase down payment
      'ten': '10% wkładu własnego',
      'twenty': '20% wkładu własnego',
      'thirty_plus': '30% lub więcej wkładu własnego',
      'full': 'Zakup w 100% za gotówkę',
      
      // General amount scales
      'small': 'Mała kwota',
      'medium': 'Średnia kwota',
      'large': 'Duża kwota',
      'very_large': 'Bardzo duża kwota',
      
      // Retirement
      'early': 'Wcześniejsza emerytura',
      'standard': 'Standardowy wiek emerytalny',
      'late': 'Późniejsza emerytura',
      'mid': 'Środkowy etap kariery',
      
      // Retirement vehicles
      'ike_ikze': 'IKE/IKZE',
      'investment': 'Własne inwestycje długoterminowe',
      'real_estate': 'Nieruchomości na wynajem',
      'combined': 'Strategia łączona'
    };
    
    return descriptions[selection] || `Wybór: ${selection}`;
  };

  // Improved onboarding form with better layout and more attractive design
  const renderOnboardingForm = () => (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        maxWidth: 600, 
        margin: '0 auto', 
        backgroundColor: COLORS.lightBackground,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 1 }}>
          Rozpocznij swoją podróż finansową
        </Typography>
        <Typography variant="body1" sx={{ color: COLORS.lightText }}>
          Wybierz opcje, które najlepiej pasują do Twojej sytuacji
        </Typography>
      </Box>
      
      <Box component="form" sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* User Name */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              mb: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Jak się nazywasz?
              </Typography>
              <TextField
                fullWidth
                placeholder="Wpisz swoje imię"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                error={!!formErrors.name}
                helperText={formErrors.name}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ mr: 1, color: COLORS.primary }}>👤</Box>
                  ),
                  sx: { borderRadius: '8px' }
                }}
              />
            </Box>
          </Grid>
          
          {/* Financial Goal */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              mb: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Twój główny cel finansowy
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {[
                  { value: 'emergency_fund', label: 'Fundusz awaryjny', icon: '🛡️' },
                  { value: 'debt_reduction', label: 'Spłata długów', icon: '💸' },
                  { value: 'home_purchase', label: 'Zakup mieszkania', icon: '🏠' },
                  { value: 'retirement', label: 'Emerytura', icon: '👵' },
                  { value: 'education', label: 'Edukacja', icon: '🎓' },
                  { value: 'vacation', label: 'Wakacje', icon: '🏖️' },
                  { value: 'other', label: 'Inny cel', icon: '🎯' }
                ].map((goal) => (
                  <Button
                    key={goal.value}
                    variant={formData.goal === goal.value ? "contained" : "outlined"}
                    onClick={() => setFormData({...formData, goal: goal.value})}
                    sx={{
                      borderRadius: '30px',
                      py: 1,
                      px: 2,
                      backgroundColor: formData.goal === goal.value ? COLORS.secondary : 'transparent',
                      color: formData.goal === goal.value ? 'white' : COLORS.primary,
                      borderColor: COLORS.secondary,
                      '&:hover': {
                        backgroundColor: formData.goal === goal.value 
                          ? COLORS.secondary 
                          : 'rgba(0, 168, 150, 0.1)',
                      }
                    }}
                  >
                    {goal.icon} {goal.label}
                  </Button>
                ))}
              </Box>
              {formErrors.goal && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {formErrors.goal}
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Timeframe */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              mb: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                W jakim czasie chcesz osiągnąć swój cel?
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                {[
                  { value: 'short', label: 'Krótki termin', sublabel: 'do 1 roku', icon: '🚲' },
                  { value: 'medium', label: 'Średni termin', sublabel: '1-5 lat', icon: '🚗' },
                  { value: 'long', label: 'Długi termin', sublabel: 'ponad 5 lat', icon: '🚀' }
                ].map((timeframe) => (
                  <Button
                    key={timeframe.value}
                    variant="outlined"
                    onClick={() => setFormData({...formData, timeframe: timeframe.value})}
                    sx={{
                      borderRadius: '12px',
                      p: 2,
                      width: '32%',
                      height: '100px',
                      flexDirection: 'column',
                      backgroundColor: formData.timeframe === timeframe.value 
                        ? 'rgba(0, 168, 150, 0.1)' 
                        : 'white',
                      borderColor: formData.timeframe === timeframe.value 
                        ? COLORS.secondary 
                        : '#e0e0e0',
                      borderWidth: formData.timeframe === timeframe.value ? 2 : 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 168, 150, 0.05)',
                        borderColor: COLORS.secondary
                      }
                    }}
                  >
                    <Typography variant="h5" sx={{ mb: 1 }}>{timeframe.icon}</Typography>
                    <Typography variant="body2" fontWeight="bold">{timeframe.label}</Typography>
                    <Typography variant="caption">{timeframe.sublabel}</Typography>
                  </Button>
                ))}
              </Box>
              {formErrors.timeframe && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {formErrors.timeframe}
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Monthly Income */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Miesięczny dochód
              </Typography>
              <FormControl fullWidth variant="outlined" error={!!formErrors.monthlyIncome}>
                <Select
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">Wybierz przedział</Typography>
                  </MenuItem>
                  {incomeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.monthlyIncome && (
                  <Typography variant="caption" color="error">
                    {formErrors.monthlyIncome}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Grid>
          
          {/* Current Savings */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Obecne oszczędności
              </Typography>
              <FormControl fullWidth variant="outlined">
                <Select
                  value={formData.currentSavings}
                  onChange={(e) => setFormData({...formData, currentSavings: e.target.value})}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">Wybierz przedział</Typography>
                  </MenuItem>
                  {savingsOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
          
          {/* Consents */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Zgody i oświadczenia
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consents.dataProcessing}
                    onChange={(e) => setConsents({...consents, dataProcessing: e.target.checked})}
                    sx={{
                      color: COLORS.secondary,
                      '&.Mui-checked': {
                        color: COLORS.secondary,
                      },
                    }}
                  />
                }
                label="Wyrażam zgodę na przetwarzanie moich danych w celu otrzymania spersonalizowanych porad finansowych"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consents.profiling}
                    onChange={(e) => setConsents({...consents, profiling: e.target.checked})}
                    sx={{
                      color: COLORS.secondary,
                      '&.Mui-checked': {
                        color: COLORS.secondary,
                      },
                    }}
                  />
                }
                label="Wyrażam zgodę na automatyczne profilowanie moich preferencji finansowych"
              />
              
              {formErrors.consents && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {formErrors.consents}
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={handleOnboardingSubmit}
              sx={{ 
                backgroundColor: COLORS.secondary,
                '&:hover': {
                  backgroundColor: '#008f82'
                },
                py: 1.5,
                mt: 2,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 168, 150, 0.2)'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Rozpocznij swoją podróż finansową'
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  // Enhanced advisor selection layout
  const renderAdvisorSelection = () => (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        maxWidth: 800, 
        margin: '0 auto', 
        backgroundColor: COLORS.lightBackground,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 1 }}>
          Wybierz doradcę dla swojego celu finansowego
        </Typography>
        <Typography variant="body1" sx={{ color: COLORS.lightText }}>
          Każdy z naszych ekspertów specjalizuje się w innym obszarze finansów
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
        {ADVISORS.map((advisor) => (
          <Paper
            key={advisor.id}
            elevation={2}
            sx={{
              p: 0,
              display: 'flex',
              alignItems: 'stretch',
              borderRadius: '12px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
              }
            }}
            onClick={() => setCurrentAdvisor(advisor)}
          >
            {/* Icon Section */}
            <Box sx={{ 
              width: '90px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: COLORS.primary,
              color: 'white',
              fontSize: '2.5rem'
            }}>
              {advisor.icon}
            </Box>
            
            {/* Content Section */}
            <Box sx={{ 
              flexGrow: 1, 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" sx={{ 
                color: COLORS.primary, 
                fontWeight: 'bold', 
                mb: 1
              }}>
                {advisor.name}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.lightText, mb: 1 }}>
                {advisor.description}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: COLORS.secondary,
                fontStyle: 'italic'
              }}>
                Cel: {getGoalDisplayName(advisor.goal)}
              </Typography>
            </Box>
            
            {/* Arrow Section */}
            <Box sx={{ 
              width: '60px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: 'rgba(0, 168, 150, 0.1)',
              color: COLORS.secondary
            }}>
              <ArrowForward />
            </Box>
          </Paper>
        ))}
      </Box>
      
      {userProfile && userProfile.financialData && (
        <Box sx={{ 
          mt: 4, 
          p: 3, 
          borderRadius: '12px', 
          backgroundColor: 'rgba(15, 48, 87, 0.03)',
          borderLeft: `4px solid ${COLORS.primary}`
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
              Twój postęp w osiąganiu celów
            </Typography>
            <Button
              variant="outlined"
              startIcon={showChart ? <Save /> : <TrendingUp />}
              onClick={toggleChart}
              sx={{ 
                borderColor: COLORS.secondary,
                color: COLORS.secondary,
                borderRadius: '20px'
              }}
            >
              {showChart ? 'Ukryj wykres' : 'Pokaż wykres oszczędności'}
            </Button>
          </Box>
          
          {showChart && (
            <FinancialProgressChart 
              financialData={userProfile.financialData} 
              goalAmount={goalAmount} 
            />
          )}
          
          {/* Add advisor history if available */}
          {userProfile.lastCompletedAdvisor && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ color: COLORS.primary, fontWeight: 'medium', mb: 2 }}>
                Twoje ostatnie konsultacje:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {userProfile.lastCompletedAdvisor && (
                  <Chip 
                    icon={<Check sx={{ color: COLORS.success }} />}
                    label={`${ADVISORS.find(a => a.id === userProfile.lastCompletedAdvisor)?.name || 'Doradca'} - ${new Date().toLocaleDateString()}`}
                    sx={{ 
                      backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                      borderColor: COLORS.success,
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );

  // Enhanced decision tree UI
  const renderDecisionTree = () => (
    <Paper elevation={3} sx={{ 
      p: 4, 
      maxWidth: 800, 
      margin: '0 auto', 
      backgroundColor: COLORS.lightBackground, 
      borderRadius: '16px', 
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)' 
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Box sx={{ 
            width: 50, 
            height: 50, 
            borderRadius: '50%', 
            backgroundColor: COLORS.primary, 
            color: 'white', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            fontSize: '1.5rem',
            mr: 2
          }}>
            {currentAdvisor.icon}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
              {currentAdvisor.name}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.lightText }}>
              Cel: {getGoalDisplayName(currentAdvisor.goal)}
            </Typography>
          </Box>
        </Box>
        <Box>
          <MuiTooltip title="Zmień doradcę">
            <IconButton onClick={changeAdvisor} sx={{ color: COLORS.primary }}>
              <ArrowBack />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title={advancedMode ? "Tryb standardowy" : "Tryb zaawansowany"}>
            <IconButton onClick={toggleAdvancedMode} sx={{ color: COLORS.primary }}>
              <Settings />
            </IconButton>
          </MuiTooltip>
        </Box>
      </Box>

      {/* Progress steps visualization */}
      <Box mb={4}>
        <LinearProgress 
          variant="determinate" 
          value={progressValue} 
          sx={{ 
            height: 10, 
            borderRadius: 5, 
            backgroundColor: '#e0e0e0', 
            '& .MuiLinearProgress-bar': { 
              backgroundColor: COLORS.secondary 
            } 
          }} 
        />
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="body2" color={COLORS.lightText}>Początek</Typography>
          <Typography variant="body2" fontWeight="bold" color={COLORS.secondary}>
            {`${Math.round(progressValue)}%`}
          </Typography>
          <Typography variant="body2" color={COLORS.lightText}>Cel</Typography>
        </Box>
      </Box>

      {/* Decision path visualization */}
      {decisionPath.length > 0 && !finalRecommendation && (
        <Box mb={4}>
          <Typography variant="subtitle1" sx={{ color: COLORS.primary, mb: 2, fontWeight: 'medium' }}>
            Twoja ścieżka decyzji:
          </Typography>
          <Stepper activeStep={currentStep} orientation="vertical" sx={{ mb: 3 }}>
            {decisionPath.map((decision, index) => (
              <Step key={index} completed={index < currentStep}>
                <StepLabel>
                  <Typography variant="body2" sx={{ fontWeight: index === currentStep - 1 ? 'bold' : 'normal' }}>
                    {getDecisionLabel(decision, index)}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" sx={{ color: COLORS.lightText }}>
                    {getDecisionDescription(decision, index)}
                  </Typography>
                </StepContent>
              </Step>
            ))}
            {currentStep > 0 && currentStep < 4 && (
              <Step active>
                <StepLabel>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: COLORS.primary }}>
                    Obecny krok
                  </Typography>
                </StepLabel>
              </Step>
            )}
          </Stepper>
        </Box>
      )}

      {finalRecommendation ? (
        <Box>
          <Paper elevation={2} sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: '#f5f9ff', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
              Twoje rekomendacje
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              {finalRecommendation.summary}
            </Typography>
            
            {finalRecommendation.steps && (
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                  Następne kroki:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {finalRecommendation.steps.map((step, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        backgroundColor: 'rgba(0, 168, 150, 0.05)',
                        p: 2,
                        borderRadius: '8px'
                      }}
                    >
                      <Box 
                        sx={{ 
                          minWidth: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: COLORS.secondary,
                          color: 'white',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mr: 2,
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body1">{step}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          <Box mt={3} sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<EmojiEvents />}
              onClick={generatePDF}
              sx={{ 
                backgroundColor: COLORS.success, 
                '&:hover': { backgroundColor: '#388e3c' },
                borderRadius: '8px',
                px: 3
              }}
            >
              Pobierz raport PDF
            </Button>
            
            <Button 
              variant="contained" 
              endIcon={<ArrowForward />} 
              onClick={() => setChatVisible(true)} 
              sx={{ 
                backgroundColor: COLORS.secondary, 
                '&:hover': { backgroundColor: '#008f82' },
                borderRadius: '8px',
                px: 3
              }}
            >
              Porozmawiaj z doradcą
            </Button>
          </Box>
          
          <Box display="flex" justifyContent="center" mt={3}>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />} 
              onClick={changeAdvisor} 
              sx={{ 
                borderColor: COLORS.primary, 
                color: COLORS.primary,
                borderRadius: '8px'
              }}
            >
              Zmień doradcę
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center" p={4}>
              <CircularProgress sx={{ color: COLORS.secondary, mb: 2 }} />
              <Typography variant="body2" color={COLORS.lightText}>
                Analizuję najlepsze opcje dla Twojego celu...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '12px', 
                backgroundColor: 'rgba(15, 48, 87, 0.03)',
                borderLeft: `4px solid ${COLORS.primary}`
              }}>
                <Typography variant="body1" paragraph fontWeight="medium">
                  {decisionOptions.length > 0 ? decisionOptions[0].question : "Ładowanie opcji..."}
                </Typography>
              </Paper>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {decisionOptions.map((option, index) => (
                  <Button
                    key={index}
                    fullWidth
                    variant="outlined"
                    onClick={() => handleDecisionSelect(index)}
                    sx={{
                      p: 2,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      borderColor: '#e0e0e0',
                      color: COLORS.text,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateX(5px)',
                        borderColor: COLORS.secondary,
                        backgroundColor: 'rgba(0, 168, 150, 0.05)'
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 20,
                        height: 20,
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2300A896\'%3E%3Cpath d=\'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z\'/%3E%3C/svg%3E")',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat'
                      }
                    }}
                  >
                    {option.text}
                  </Button>
                ))}
              </Box>
              
              {advancedMode && (
                <Box mt={4}>
                  <Divider sx={{ mb: 2 }} />
                  <Button 
                    variant="text" 
                    startIcon={<Help />} 
                    onClick={() => setChatVisible(true)} 
                    sx={{ color: COLORS.primary }}
                  >
                    Potrzebuję dodatkowych informacji
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );

  // Enhanced chat UI
  const renderChat = () => (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 0, 
        maxWidth: 800, 
        margin: '0 auto', 
        backgroundColor: COLORS.lightBackground,
        display: 'flex',
        flexDirection: 'column',
        height: 550,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          backgroundColor: COLORS.primary,
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center">
          <Box 
            sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              fontSize: '1.2rem',
              mr: 2
            }}
          >
            {currentAdvisor.icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {currentAdvisor.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Specjalizacja: {getGoalDisplayName(currentAdvisor.goal)}
            </Typography>
          </Box>
        </Box>
        
        <Box>
          {finalRecommendation && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Info />}
              onClick={() => setChatVisible(false)}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                mr: 2,
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Pokaż plan
            </Button>
          )}
          
          <IconButton onClick={() => setChatVisible(false)} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
        </Box>
      </Box>
      
      <Box
        ref={chatContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 3,
          backgroundColor: '#f5f7fa',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {chatMessages.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
            gap={2}
          >
            <Box 
              sx={{ 
                fontSize: '3rem',
                backgroundColor: 'rgba(0, 168, 150, 0.1)',
                width: 80,
                height: 80,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                color: COLORS.secondary
              }}
            >
              {currentAdvisor.icon}
            </Box>
            <Typography variant="body1" color={COLORS.lightText} textAlign="center">
              {currentAdvisor.specialty || `Rozpocznij rozmowę z ${currentAdvisor.name}.`} <br/>
              Zadaj pytanie dotyczące Twojego celu finansowego.
            </Typography>
          </Box>
        ) : (
          chatMessages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              {msg.role !== 'user' && (
                <Box 
                  sx={{ 
                    backgroundColor: 'rgba(0, 168, 150, 0.1)',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '50%',
                    mr: 1,
                    fontSize: '1rem'
                  }}
                >
                  {currentAdvisor.icon}
                </Box>
              )}
              
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '75%',
                  backgroundColor: msg.role === 'user' ? COLORS.primary : 'white',
                  color: msg.role === 'user' ? 'white' : COLORS.text,
                  borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                  boxShadow: msg.role === 'user' ? 
                    '0 2px 8px rgba(15, 48, 87, 0.2)' : 
                    '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Typography variant="body1">
                  {msg.content}
                </Typography>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 1, 
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    opacity: 0.7
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Typography>
              </Paper>
              
              {msg.role === 'user' && msg.sentiment && (
                <Box 
                  sx={{ 
                    ml: 1,
                    fontSize: '1.2rem'
                  }}
                >
                  {msg.sentiment === 'positive' ? '😊' : 
                   msg.sentiment === 'negative' ? '😟' : ''}
                </Box>
              )}
            </Box>
          ))
        )}
        
        {loading && (
          <Box alignSelf="flex-start" display="flex" alignItems="center" mt={2} mb={2}>
            <Box 
              sx={{ 
                backgroundColor: 'rgba(0, 168, 150, 0.1)',
                width: 36,
                height: 36,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                mr: 1,
                fontSize: '1rem'
              }}
            >
              {currentAdvisor.icon}
            </Box>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: 'white',
                borderRadius: '18px 18px 18px 0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.secondary, animation: 'pulse 1s infinite' }}></Box>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.secondary, animation: 'pulse 1s infinite 0.2s' }}></Box>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.secondary, animation: 'pulse 1s infinite 0.4s' }}></Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
      
      <Box 
        sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {speechRecognitionSupported && (
          <IconButton
            color={isListening ? 'secondary' : 'default'}
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            {isListening ? <MicOff /> : <Mic />}
          </IconButton>
        )}
        
        <TextField
          fullWidth
          placeholder={`Zapytaj ${currentAdvisor.name} o ${getGoalDisplayName(currentAdvisor.goal)}...`}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          variant="outlined"
          disabled={loading}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          sx={{ 
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '30px',
              backgroundColor: '#f5f7fa'
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton 
                color="primary"
                disabled={loading || !newMessage.trim()}
                onClick={handleSendMessage}
              >
                <ArrowForward />
              </IconButton>
            )
          }}
        />
      </Box>
      
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </Paper>
  );

  const renderContent = () => {
    if (!isAuthenticated) return <Box textAlign="center" p={4}><CircularProgress sx={{ color: COLORS.secondary }} /><Typography variant="body1" sx={{ mt: 2 }}>Weryfikacja...</Typography></Box>;
    if (!isOnboardingComplete) return renderOnboardingForm();
    if (!currentAdvisor) return renderAdvisorSelection();
    if (chatVisible) return renderChat();
    return renderDecisionTree();
  };

  return (
    <Box sx={{ py: 4, backgroundColor: COLORS.background, minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 1200, margin: '0 auto', px: 2 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>DisiNow</Typography>
          <Typography variant="body1" sx={{ color: COLORS.lightText }}>Twój asystent finansowy</Typography>
        </Box>
        {renderContent()}
        <Snackbar open={notification.show} autoHideDuration={5000} onClose={() => setNotification({...notification, show: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
          <Alert onClose={() => setNotification({...notification, show: false})} severity={notification.severity} variant="filled">{notification.message}</Alert>
        </Snackbar>
        {newAchievement && <AchievementNotification achievement={newAchievement} onClose={handleCloseAchievement} />}
      </Box>
    </Box>
  );
};

export default AIChatSection;