/**
 * Enhanced Sentiment Analysis Service - utils/sentimentAnalysis.js
 * 
 * This module provides robust sentiment analysis capabilities for chat interactions:
 * - Multiple analysis models with fallbacks
 * - Context-aware sentiment detection
 * - Emotion classification beyond positive/negative
 * - Confidence scores with thresholds
 * - Polish language support with customized dictionaries
 * - Financial domain-specific terminology handling
 */

import axios from 'axios';
import { logError } from './securityLogger';

// API endpoint for primary sentiment analysis
const SENTIMENT_API_URL = process.env.REACT_APP_SENTIMENT_API_URL || 'http://localhost:5000/api/sentiment';

// Polish financial sentiment dictionaries (simplified version)
const POLISH_POSITIVE_FINANCIAL_TERMS = [
  'zysk', 'wzrost', 'oszczędzać', 'oszczędności', 'zarobić', 'zarabiać', 'zyskowny',
  'dobra inwestycja', 'pewny', 'bezpieczny', 'stabilny', 'pewność', 'sukces',
  'pomnażać', 'mądre', 'skuteczny', 'efektywny', 'korzystny', 'spokój', 'zadowolony',
  'opłacalny', 'pewność', 'spokój', 'zabezpieczenie', 'bezpieczeństwo', 'dobrze',
  'super', 'świetnie', 'wspaniale', 'doskonale', 'cieszę się', 'zadowolony', 'pozytywnie'
];

const POLISH_NEGATIVE_FINANCIAL_TERMS = [
  'strata', 'dług', 'kredyt', 'pożyczka', 'zadłużenie', 'ryzyko', 'niepewność',
  'obawa', 'strach', 'niepokój', 'zmartwienie', 'problem', 'kłopot', 'trudność',
  'upadek', 'kryzys', 'bankructwo', 'niewypłacalność', 'niestabilny', 'drogi',
  'kosztowny', 'inflacja', 'wysoka rata', 'brak', 'niewystarczająco', 'martwię się',
  'boję się', 'obawy', 'stresujące', 'trudne', 'ciężkie', 'problem', 'szkoda'
];

const POLISH_NEUTRAL_FINANCIAL_TERMS = [
  'inwestycja', 'lokata', 'konto', 'bank', 'fundusz', 'emerytura', 'oszczędności',
  'portfel', 'giełda', 'akcje', 'obligacje', 'waluta', 'złoty', 'euro', 'dolar',
  'budżet', 'wydatki', 'przychody', 'plan', 'strategia', 'cel', 'finansowy',
  'pieniądze', 'gotówka', 'przelew', 'transakcja', 'inwestowanie', 'środki'
];

// Special polarity-changing phrases in Polish
const POLISH_NEGATION_PHRASES = [
  'nie ', 'bez ', 'brak ', 'nigdy ', 'żaden ', 'ani ', 'żadnych ', 'wcale ',
  'nie ma ', 'nie było ', 'nie będzie ', 'nie jest ', 'nie są ', 'niezbyt ',
  'nie bardzo ', 'nie do końca ', 'mało ', 'trudno '
];

/**
 * Analyzes sentiment of a message with advanced NLP techniques
 * and Polish language support
 * 
 * @param {string} message - Text message to analyze
 * @param {Object} options - Analysis options
 * @param {boolean} options.useAPI - Whether to use API (default true)
 * @param {string} options.context - Context of the conversation (e.g., 'financial_advice')
 * @param {Array} options.messageHistory - Previous messages for context
 * @returns {Promise<Object>} - Sentiment analysis results
 */
export const analyzeSentiment = async (message, options = {}) => {
  const { 
    useAPI = true, 
    context = 'financial_advice',
    messageHistory = [],
    language = 'pl'
  } = options;
  
  try {
    // Normalize text for analysis
    const normalizedText = message.toLowerCase().trim();
    
    // Try external API first if enabled
    if (useAPI) {
      try {
        const apiResult = await analyzeWithAPI(normalizedText, context, language);
        
        // If API result has high confidence, return it
        if (apiResult.confidence > 0.7) {
          return apiResult;
        }
        
        console.log('API sentiment result has low confidence, using fallback analysis');
      } catch (error) {
        console.warn('API sentiment analysis failed, using fallback analysis', error);
      }
    }
    
    // Fallback to local dictionary-based analysis
    const localResult = analyzeWithDictionary(normalizedText, language);
    
    // Enhance with context from message history if available
    if (messageHistory && messageHistory.length > 0) {
      return enhanceWithContext(localResult, messageHistory, normalizedText);
    }
    
    return localResult;
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    logError({
      component: 'sentimentAnalysis',
      method: 'analyzeSentiment',
      error: error.message
    });
    
    // Return neutral sentiment on error
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      emotions: {},
      isError: true
    };
  }
};

/**
 * Analyzes sentiment using external API service
 * 
 * @param {string} text - Text to analyze
 * @param {string} context - Analysis context
 * @param {string} language - Text language
 * @returns {Promise<Object>} - API sentiment result
 */
async function analyzeWithAPI(text, context, language) {
  try {
    const response = await axios.post(SENTIMENT_API_URL, {
      text,
      context,
      language
    }, {
      timeout: 2000 // 2 second timeout to ensure UI responsiveness
    });
    
    return {
      sentiment: response.data.sentiment,
      confidence: response.data.confidence,
      emotions: response.data.emotions || {},
      source: 'api'
    };
  } catch (error) {
    console.error('API sentiment analysis error:', error);
    throw error;
  }
}

/**
 * Analyzes sentiment using local dictionaries
 * 
 * @param {string} text - Text to analyze
 * @param {string} language - Text language
 * @returns {Object} - Local sentiment result
 */
function analyzeWithDictionary(text, language) {
  // Select dictionaries based on language
  const positiveDictionary = language === 'pl' ? 
    POLISH_POSITIVE_FINANCIAL_TERMS : POLISH_POSITIVE_FINANCIAL_TERMS;
  
  const negativeDictionary = language === 'pl' ? 
    POLISH_NEGATIVE_FINANCIAL_TERMS : POLISH_NEGATIVE_FINANCIAL_TERMS;
  
  const negationPhrases = language === 'pl' ? 
    POLISH_NEGATION_PHRASES : POLISH_NEGATION_PHRASES;
  
  // Count positive and negative words
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Check for positive terms
  positiveDictionary.forEach(term => {
    // Check if term is in text
    if (text.includes(term)) {
      // Check if term is negated
      if (hasNegation(text, term, negationPhrases)) {
        negativeScore += 1;
      } else {
        positiveScore += 1;
      }
    }
  });
  
  // Check for negative terms
  negativeDictionary.forEach(term => {
    // Check if term is in text
    if (text.includes(term)) {
      // Check if term is negated
      if (hasNegation(text, term, negationPhrases)) {
        positiveScore += 0.5; // Negated negative is less positive than direct positive
      } else {
        negativeScore += 1;
      }
    }
  });
  
  // Determine sentiment
  let sentiment = 'neutral';
  let confidence = 0.5;
  
  if (positiveScore > negativeScore) {
    sentiment = 'positive';
    confidence = Math.min(0.5 + (positiveScore / (positiveScore + negativeScore + 1)) * 0.5, 0.9);
  } else if (negativeScore > positiveScore) {
    sentiment = 'negative';
    confidence = Math.min(0.5 + (negativeScore / (positiveScore + negativeScore + 1)) * 0.5, 0.9);
  }
  
  // Simple emotion detection
  const emotions = detectEmotions(text, language);
  
  return {
    sentiment,
    confidence,
    emotions,
    positiveScore,
    negativeScore,
    source: 'dictionary'
  };
}

/**
 * Checks if a term in the text is preceded by negation
 * 
 * @param {string} text - Full text
 * @param {string} term - Term to check for negation
 * @param {Array} negationPhrases - List of negation phrases
 * @returns {boolean} - Whether the term is negated
 */
function hasNegation(text, term, negationPhrases) {
  const termIndex = text.indexOf(term);
  if (termIndex < 0) return false;
  
  // Check if term is preceded by negation within reasonable distance
  const contextBefore = text.substring(Math.max(0, termIndex - 20), termIndex);
  
  return negationPhrases.some(negation => contextBefore.includes(negation));
}

/**
 * Detect specific emotions in text
 * 
 * @param {string} text - Text to analyze
 * @param {string} language - Text language
 * @returns {Object} - Detected emotions with scores
 */
function detectEmotions(text, language) {
  const emotions = {
    fear: 0,
    confusion: 0,
    satisfaction: 0,
    excitement: 0,
    frustration: 0,
    trust: 0
  };
  
  // Polish emotion dictionaries
  const emotionDictionaries = {
    fear: ['strach', 'obawa', 'boję', 'niepewność', 'ryzyko', 'niebezpieczeństwo'],
    confusion: ['nie rozumiem', 'skomplikowane', 'zagmatwane', 'trudne', 'niejasne', 'wątpliwości'],
    satisfaction: ['zadowolony', 'satysfakcja', 'dobrze', 'odpowiada mi', 'podoba mi się'],
    excitement: ['super', 'świetnie', 'ekscytujące', 'doskonale', 'fantastycznie', 'wspaniale'],
    frustration: ['zdenerwowany', 'sfrustrowany', 'irytujące', 'denerwujące', 'problem', 'przeszkadza'],
    trust: ['ufam', 'pewny', 'bezpieczny', 'stabilny', 'wiarygodny', 'zaufanie']
  };
  
  // Calculate emotion scores
  Object.entries(emotionDictionaries).forEach(([emotion, terms]) => {
    terms.forEach(term => {
      if (text.includes(term)) {
        emotions[emotion] += 1;
      }
    });
    
    // Normalize to 0-1 range
    if (emotions[emotion] > 0) {
      emotions[emotion] = Math.min(emotions[emotion] / 3, 1);
    }
  });
  
  return emotions;
}

/**
 * Enhances sentiment analysis with conversation context
 * 
 * @param {Object} currentAnalysis - Current message analysis
 * @param {Array} messageHistory - Previous messages
 * @param {string} currentText - Current message text
 * @returns {Object} - Enhanced sentiment analysis
 */
function enhanceWithContext(currentAnalysis, messageHistory, currentText) {
  // Simple context enhancement - if current message is very short,
  // give more weight to recent message history
  if (currentText.length < 10 && messageHistory.length > 0) {
    // Get last 3 messages or all if fewer
    const recentMessages = messageHistory.slice(-3);
    let recentSentimentCount = {
      positive: 0,
      negative: 0,
      neutral: 0
    };
    
    // Count recent sentiments
    recentMessages.forEach(msg => {
      if (msg.sentiment) {
        recentSentimentCount[msg.sentiment] = 
          (recentSentimentCount[msg.sentiment] || 0) + 1;
      }
    });
    
    // Adjust current confidence based on history
    const dominantSentiment = Object.entries(recentSentimentCount)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // If current sentiment is weak but history has strong pattern
    if (currentAnalysis.confidence < 0.6 && 
        recentSentimentCount[dominantSentiment] >= 2) {
      
      if (dominantSentiment === currentAnalysis.sentiment) {
        // Boost confidence if aligns with history
        currentAnalysis.confidence = Math.min(
          currentAnalysis.confidence + 0.15, 
          0.85
        );
      } else {
        // Use history sentiment with cautious confidence
        return {
          ...currentAnalysis,
          sentiment: dominantSentiment,
          confidence: 0.6,
          contextAdjusted: true
        };
      }
    }
  }
  
  return currentAnalysis;
}

/**
 * Gets emoji representation of sentiment
 * 
 * @param {string} sentiment - Sentiment value
 * @param {Object} emotions - Emotion scores
 * @returns {string} - Emoji representing sentiment
 */
export function getSentimentEmoji(sentiment, emotions = {}) {
  if (!sentiment) return '';
  
  // Basic sentiment emojis
  const basicEmojis = {
    positive: '😊',
    negative: '😟',
    neutral: '😐'
  };
  
  // If we have emotion data, use more specific emojis
  if (Object.keys(emotions).length > 0) {
    // Find strongest emotion
    const strongestEmotion = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (strongestEmotion[1] > 0.5) {
      const emotionEmojis = {
        fear: '😨',
        confusion: '😕',
        satisfaction: '😌',
        excitement: '😃',
        frustration: '😤',
        trust: '🤝'
      };
      
      return emotionEmojis[strongestEmotion[0]] || basicEmojis[sentiment];
    }
  }
  
  return basicEmojis[sentiment];
}

// Export the API for use in the application
export default {
  analyzeSentiment,
  getSentimentEmoji
};