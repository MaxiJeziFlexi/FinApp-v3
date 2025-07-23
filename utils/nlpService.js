/**
 * Enhanced NLP Service - utils/nlpService.js
 * 
 * This module provides advanced natural language processing capabilities:
 * - Intent classification for financial queries
 * - Entity extraction for financial terms
 * - Pattern matching for specific financial questions
 * - Language detection and multilingual support (focused on Polish/English)
 * - Contextual understanding across conversation history
 * - Query expansion for better matching
 */

import axios from 'axios';
import { logError } from './securityLogger';

// API endpoint for advanced NLP processing
const NLP_API_URL = process.env.REACT_APP_NLP_API_URL || 'http://localhost:5000/api/nlp';

// Financial domain intents with example utterances (Polish)
const FINANCIAL_INTENTS = {
  ask_for_advice: [
    'co powinienem zrobić', 'jak najlepiej', 'co sugerujesz', 'doradzisz mi', 
    'jakie są opcje', 'co byś polecił', 'jak mam postąpić', 'co byś zrobił',
    'jak podejść do', 'w jaki sposób', 'jaka jest najlepsza strategia'
  ],
  get_information: [
    'co to jest', 'jak działa', 'czym jest', 'wyjaśnij', 'wytłumacz', 
    'na czym polega', 'jaka jest różnica', 'co oznacza', 'czy mógłbyś opisać',
    'jakie są cechy', 'jak rozumieć', 'podaj przykład'
  ],
  express_concern: [
    'martwię się', 'obawiam się', 'boję się', 'niepokoi mnie', 'nie wiem czy',
    'wątpię', 'trudno mi', 'wydaje mi się ryzykowne', 'niepewność', 'ryzyko',
    'problem z', 'kłopot z', 'trudność'
  ],
  confirm_understanding: [
    'czy dobrze rozumiem', 'czyli', 'to znaczy że', 'rozumiem to tak', 
    'innymi słowy', 'masz na myśli', 'czy chodzi o to, że', 'czy to oznacza',
    'jeśli dobrze zrozumiałem'
  ],
  set_goal: [
    'chcę', 'planuję', 'zamierzam', 'moim celem jest', 'dążę do', 
    'zależy mi na', 'chciałbym', 'chciałabym', 'pragnę', 'potrzebuję',
    'interesuje mnie', 'powinienem'
  ],
  ask_for_comparison: [
    'co jest lepsze', 'jakie są różnice', 'co się bardziej opłaca', 
    'która opcja', 'porównaj', 'czy warto', 'co wybrać', 'co jest korzystniejsze',
    'co przyniesie większy zysk', 'co jest bezpieczniejsze'
  ],
  ask_about_risk: [
    'jakie jest ryzyko', 'czy to bezpieczne', 'jak bezpieczne', 'co jeśli stracę',
    'czy mogę stracić', 'jaka jest pewność', 'jakie zagrożenia', 'czy to pewne',
    'jaka jest gwarancja', 'co w przypadku kryzysu'
  ],
  ask_about_timeline: [
    'jak długo', 'ile czasu', 'kiedy', 'jak szybko', 'ile trwa', 'ile zajmie',
    'w jakim terminie', 'jaki jest czas', 'jak często', 'do kiedy'
  ],
  share_financial_situation: [
    'zarabiam', 'mam', 'posiadam', 'moje oszczędności', 'moja sytuacja', 
    'moje dochody', 'moje wydatki', 'moje zobowiązania', 'spłacam',
    'moje wpływy', 'moje zarobki', 'wydaję' 
  ],
  ask_for_recommendation: [
    'co polecasz', 'jakie produkty', 'jaki bank', 'jaki fundusz',
    'gdzie najlepiej', 'które konto', 'jaka lokata', 'jaki kredyt',
    'co wybrać', 'czy warto skorzystać'
  ]
};

// Financial entities with patterns for extraction
const FINANCIAL_ENTITIES = {
  money_amount: {
    patterns: [
      /(\d+(\s*[ ,.]?\s*\d+)*)\s*(zł|złotych|pln|euro|eur|dolarów|usd)/i,
      /(\d+)(\s*[ ,.]?\s*\d+)*\s*(tys\.?|tysiąc|tysięcy)/i,
      /(\d+)(\s*[ ,.]?\s*\d+)*\s*(mln\.?|milion|milionów)/i
    ],
    normalize: (match) => {
      // Normalize extracted money amount
      let value = match[1].replace(/\s+/g, '').replace(',', '.');
      let unit = match[3].toLowerCase();
      
      // Handle special cases
      if (unit.includes('tys')) {
        value = parseFloat(value) * 1000;
        unit = 'zł';
      } else if (unit.includes('mln')) {
        value = parseFloat(value) * 1000000;
        unit = 'zł';
      }
      
      return {
        value: parseFloat(value) || 0,
        currency: unit.includes('eur') ? 'EUR' : 
                 unit.includes('usd') ? 'USD' : 'PLN'
      };
    }
  },
  time_period: {
    patterns: [
      /(\d+)\s*(dni|dzień|tygodni|tydzień|miesięcy|miesiąc|miesiace|lat|lata|rok|roku)/i,
      /(krótkterm|średnioterm|długoterm)/i,
      /(krótki|średni|długi)\s*(okres|czas|termin)/i
    ],
    normalize: (match) => {
      // Normalize time period
      if (match[1] && !isNaN(parseInt(match[1]))) {
        let value = parseInt(match[1]);
        let unit = match[2].toLowerCase();
        
        // Normalize unit
        if (unit.includes('dzień') || unit.includes('dni')) return { value, unit: 'days' };
        if (unit.includes('tydz')) return { value, unit: 'weeks' };
        if (unit.includes('miesi')) return { value, unit: 'months' };
        if (unit.includes('rok') || unit.includes('lat')) return { value, unit: 'years' };
      } else {
        // Handle qualitative time references
        const term = match[0].toLowerCase();
        if (term.includes('krótk')) return { value: 1, unit: 'short_term' };
        if (term.includes('średni')) return { value: 1, unit: 'medium_term' };
        if (term.includes('długi')) return { value: 1, unit: 'long_term' };
      }
      
      return { value: 0, unit: 'unknown' };
    }
  },
  percentage: {
    patterns: [
      /(\d+([.,]\d+)?)\s*(%|procent|proc\.)/i
    ],
    normalize: (match) => {
      return {
        value: parseFloat(match[1].replace(',', '.')) || 0
      };
    }
  },
  financial_product: {
    patterns: [
      /(lokata|konto|kredyt|pożyczka|hipoteka|karta kredytowa|ubezpieczenie|fundusz|inwestycja|obligacja|akcja)/i,
      /(IKE|IKZE|PPK|OFE)/i
    ],
    normalize: (match) => {
      return {
        type: match[1].toLowerCase()
      };
    }
  },
  financial_goal: {
    patterns: [
      /(emerytur|fundusz awaryjny|fundusz bezpieczeństwa|zakup mieszkania|zakup domu|spłata długu|spłata kredytu)/i,
      /(edukacja|studia|szkoła|wakacje|podróż|remont|samochód|działalność|firma)/i
    ],
    normalize: (match) => {
      const goalText = match[1].toLowerCase();
      
      // Map to standardized goal types
      if (goalText.includes('emerytur')) return { type: 'retirement' };
      if (goalText.includes('fundusz')) return { type: 'emergency_fund' };
      if (goalText.includes('mieszkani') || goalText.includes('domu')) return { type: 'home_purchase' };
      if (goalText.includes('długu') || goalText.includes('kredytu')) return { type: 'debt_reduction' };
      if (goalText.includes('edukac') || goalText.includes('studi') || goalText.includes('szkoł')) return { type: 'education' };
      if (goalText.includes('wakac') || goalText.includes('podróż')) return { type: 'vacation' };
      
      return { type: 'other', originalText: goalText };
    }
  }
};

/**
 * Analyzes text for intent classification and entity extraction
 * 
 * @param {string} text - Text to analyze
 * @param {Object} options - Analysis options
 * @param {boolean} options.useAPI - Whether to use external API
 * @param {Array} options.conversationHistory - Previous messages
 * @param {string} options.language - Text language
 * @returns {Promise<Object>} - NLP analysis results
 */
export const analyzeText = async (text, options = {}) => {
  const { 
    useAPI = true,
    conversationHistory = [],
    language = 'pl'
  } = options;
  
  try {
    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    // Initialize results object
    const results = {
      intent: {
        type: 'unknown',
        confidence: 0
      },
      entities: [],
      language: language,
      requestTime: new Date().toISOString()
    };
    
    // Try using external API if enabled
    if (useAPI) {
      try {
        const apiResults = await callNlpAPI(normalizedText, {
          history: conversationHistory.slice(-5).map(m => m.content),
          language: language
        });
        
        // If API results are confident, use them
        if (apiResults && apiResults.intent && apiResults.intent.confidence > 0.7) {
          return apiResults;
        }
      } catch (error) {
        console.warn('NLP API request failed, using fallback analysis', error);
      }
    }
    
    // Fallback: Perform client-side analysis
    const localIntentResult = detectIntent(normalizedText);
    const localEntities = extractEntities(normalizedText);
    
    // Enhance with conversation context
    const enhancedResults = enhanceWithConversationContext({
      intent: localIntentResult,
      entities: localEntities,
      language: language
    }, conversationHistory);
    
    return enhancedResults;
  } catch (error) {
    console.error('Error in text analysis:', error);
    logError({
      component: 'nlpService',
      method: 'analyzeText',
      error: error.message
    });
    
    // Return basic result on error
    return {
      intent: { type: 'unknown', confidence: 0 },
      entities: [],
      language: language,
      isError: true
    };
  }
};

/**
 * Calls external NLP API for advanced analysis
 * 
 * @param {string} text - Text to analyze
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API analysis results
 */
async function callNlpAPI(text, options) {
  try {
    const response = await axios.post(NLP_API_URL, {
      text,
      options
    }, {
      timeout: 2000 // 2 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calling NLP API:', error);
    throw error;
  }
}

/**
 * Detects intent in text using pattern matching
 * 
 * @param {string} text - Text to analyze
 * @returns {Object} - Detected intent with confidence
 */
function detectIntent(text) {
  let bestMatch = { type: 'unknown', confidence: 0 };
  
  // Check each intent pattern
  Object.entries(FINANCIAL_INTENTS).forEach(([intentType, patterns]) => {
    // Count how many patterns match
    const matchedPatterns = patterns.filter(pattern => text.includes(pattern));
    
    if (matchedPatterns.length > 0) {
      // Calculate confidence based on pattern matches
      const totalPatternLength = matchedPatterns.reduce((sum, p) => sum + p.length, 0);
      const coverage = Math.min(totalPatternLength / text.length, 0.8);
      const matchRatio = matchedPatterns.length / patterns.length;
      
      const confidence = 0.4 + (coverage * 0.3) + (matchRatio * 0.3);
      
      // If better than current best match, update
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          type: intentType,
          confidence,
          matchedPatterns
        };
      }
    }
  });
  
  return bestMatch;
}

/**
 * Extracts financial entities from text
 * 
 * @param {string} text - Text to analyze
 * @returns {Array} - Extracted entities
 */
function extractEntities(text) {
  const entities = [];
  
  // Check each entity type
  Object.entries(FINANCIAL_ENTITIES).forEach(([entityType, entityDef]) => {
    // Try each pattern
    entityDef.patterns.forEach(pattern => {
      const matches = text.match(pattern);
      
      if (matches) {
        try {
          // Normalize the entity value
          const normalizedValue = entityDef.normalize(matches);
          
          entities.push({
            type: entityType,
            value: normalizedValue,
            originalText: matches[0],
            position: {
              start: text.indexOf(matches[0]),
              end: text.indexOf(matches[0]) + matches[0].length
            }
          });
        } catch (error) {
          console.warn(`Error normalizing entity ${entityType}:`, error);
        }
      }
    });
  });
  
  return entities;
}

/**
 * Enhances NLP results with conversation context
 * 
 * @param {Object} results - Initial NLP results
 * @param {Array} conversationHistory - Previous messages
 * @returns {Object} - Enhanced NLP results
 */
function enhanceWithConversationContext(results, conversationHistory) {
  // If we have a low confidence intent and conversation history
  if (results.intent.confidence < 0.6 && conversationHistory.length > 0) {
    // Look at the last system message for context
    const lastSystemMsg = [...conversationHistory]
      .reverse()
      .find(msg => msg.role === 'assistant');
    
    // If the last system message was asking a question
    if (lastSystemMsg && lastSystemMsg.content.includes('?')) {
      // Check if current message looks like an answer
      if (results.intent.type === 'unknown' && 
          results.entities.length > 0 && 
          results.entities.some(e => ['money_amount', 'time_period', 'percentage'].includes(e.type))) {
        
        // This is likely an answer to a question
        results.intent = {
          type: 'provide_information',
          confidence: 0.7,
          contextDerived: true
        };
      }
    }
  }
  
  return results;
}

/**
 * Generates appropriate response based on intent and entities
 * 
 * @param {Object} nlpResults - NLP analysis results
 * @param {string} advisorType - Type of financial advisor
 * @returns {Object} - Response suggestion
 */
export const generateResponseSuggestion = (nlpResults, advisorType) => {
  if (!nlpResults || !nlpResults.intent) {
    return null;
  }
  
  // Map intent to recommendation type
  const intentToResponseType = {
    ask_for_advice: 'advice',
    get_information: 'information',
    express_concern: 'reassurance',
    confirm_understanding: 'confirmation',
    set_goal: 'goal_setting',
    ask_for_comparison: 'comparison',
    ask_about_risk: 'risk_explanation',
    ask_about_timeline: 'timeline',
    share_financial_situation: 'analysis',
    ask_for_recommendation: 'recommendation'
  };
  
  const responseType = intentToResponseType[nlpResults.intent.type] || 'general';
  
  // Find most relevant entity if applicable
  let primaryEntity = null;
  if (nlpResults.entities && nlpResults.entities.length > 0) {
    // Prioritize financial goals and products
    primaryEntity = nlpResults.entities.find(e => e.type === 'financial_goal') ||
                   nlpResults.entities.find(e => e.type === 'financial_product') ||
                   nlpResults.entities[0];
  }
  
  return {
    responseType,
    primaryEntity,
    confidence: nlpResults.intent.confidence,
    advisorType
  };
};

// Export the API for use in the application
export default {
  analyzeText,
  generateResponseSuggestion
};