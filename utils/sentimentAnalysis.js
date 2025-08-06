// utils/sentimentAnalysis.js
// Client-side sentiment analysis utility

class SentimentAnalyzer {
  constructor() {
    // Positive and negative word dictionaries for Polish
    this.positiveWords = [
      'dobry', 'dobrze', 'świetny', 'fantastyczny', 'wspaniały', 'excellent', 'amazing',
      'pozytywny', 'zadowolony', 'szczęśliwy', 'rad', 'cieszy', 'podoba', 'lubię',
      'kocham', 'wspaniały', 'genialny', 'perfekcyjny', 'idealny', 'najlepszy',
      'sukces', 'zysk', 'korzyść', 'możliwość', 'szansa', 'nadzieja', 'optimistic',
      'confident', 'excited', 'happy', 'pleased', 'satisfied', 'grateful', 'thankful',
      'helpful', 'useful', 'effective', 'successful', 'profitable', 'beneficial'
    ];

    this.negativeWords = [
      'zły', 'źle', 'okropny', 'terrible', 'awful', 'horrible', 'bad', 'worst',
      'negatywny', 'smutny', 'zmartwiony', 'zaniepokojony', 'problem', 'kłopot',
      'trudność', 'błąd', 'porażka', 'strata', 'szkoda', 'niestety', 'unfortunately',
      'worried', 'concerned', 'anxious', 'frustrated', 'disappointed', 'upset',
      'angry', 'sad', 'depressed', 'stressed', 'difficult', 'challenging',
      'expensive', 'costly', 'loss', 'debt', 'broke', 'poor', 'struggle'
    ];

    this.neutralWords = [
      'może', 'prawdopodobnie', 'myślę', 'uważam', 'wydaje', 'się', 'chyba',
      'probably', 'maybe', 'perhaps', 'think', 'believe', 'consider', 'neutral',
      'ok', 'okay', 'fine', 'normal', 'average', 'standard', 'typical', 'usual'
    ];

    // Financial context words that modify sentiment
    this.financialContextWords = {
      positive: [
        'oszczędności', 'inwestycja', 'zysk', 'dochód', 'wzrost', 'sukces',
        'savings', 'investment', 'profit', 'income', 'growth', 'return',
        'dividend', 'interest', 'gain', 'appreciation', 'portfolio', 'wealth'
      ],
      negative: [
        'długi', 'strata', 'zadłużenie', 'kredyt', 'rata', 'spłata', 'inflacja',
        'debt', 'loss', 'loan', 'payment', 'installment', 'inflation', 'risk',
        'recession', 'crisis', 'bankruptcy', 'deficit', 'expense', 'cost'
      ]
    };
  }

  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return {
        sentiment: 'neutral',
        confidence: 0.0,
        score: 0.0,
        details: {
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          financialContext: false
        }
      };
    }

    // Normalize text
    const normalizedText = text.toLowerCase()
      .replace(/[.,!?;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = normalizedText.split(' ');
    
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let financialContext = false;

    // Check for financial context
    financialContext = this.hasFinancialContext(words);

    // Count sentiment words
    words.forEach(word => {
      if (this.positiveWords.includes(word)) {
        positiveCount++;
      } else if (this.negativeWords.includes(word)) {
        negativeCount++;
      } else if (this.neutralWords.includes(word)) {
        neutralCount++;
      }
    });

    // Apply financial context weighting
    if (financialContext) {
      words.forEach(word => {
        if (this.financialContextWords.positive.includes(word)) {
          positiveCount += 0.5;
        } else if (this.financialContextWords.negative.includes(word)) {
          negativeCount += 0.5;
        }
      });
    }

    // Calculate sentiment score (-1 to 1)
    const totalSentimentWords = positiveCount + negativeCount;
    let score = 0;
    let sentiment = 'neutral';
    let confidence = 0;

    if (totalSentimentWords > 0) {
      score = (positiveCount - negativeCount) / totalSentimentWords;
      
      // Determine sentiment category
      if (score > 0.1) {
        sentiment = 'positive';
      } else if (score < -0.1) {
        sentiment = 'negative';
      } else {
        sentiment = 'neutral';
      }

      // Calculate confidence based on word count and text length
      const textLength = words.length;
      const sentimentDensity = totalSentimentWords / Math.max(textLength, 1);
      confidence = Math.min(Math.abs(score) + sentimentDensity * 0.5, 1.0);
    }

    // Adjust confidence for very short texts
    if (words.length < 3) {
      confidence *= 0.5;
    }

    return {
      sentiment,
      confidence: Math.round(confidence * 100) / 100,
      score: Math.round(score * 100) / 100,
      details: {
        positiveCount,
        negativeCount,
        neutralCount,
        financialContext,
        wordCount: words.length,
        sentimentWords: totalSentimentWords
      }
    };
  }

  hasFinancialContext(words) {
    const allFinancialWords = [
      ...this.financialContextWords.positive,
      ...this.financialContextWords.negative
    ];
    
    return words.some(word => allFinancialWords.includes(word));
  }

  // Analyze sentiment with emotion detection
  analyzeWithEmotions(text) {
    const basicAnalysis = this.analyzeText(text);
    
    // Emotion keywords
    const emotions = {
      joy: ['szczęśliwy', 'radość', 'wesoły', 'happy', 'joy', 'cheerful', 'delighted'],
      fear: ['strach', 'obawa', 'lęk', 'fear', 'afraid', 'worried', 'anxious', 'scared'],
      anger: ['złość', 'gniew', 'wkurzony', 'angry', 'mad', 'furious', 'irritated'],
      sadness: ['smutek', 'smutny', 'depresja', 'sad', 'depressed', 'melancholy'],
      trust: ['zaufanie', 'pewność', 'trust', 'confidence', 'reliable', 'secure'],
      anticipation: ['oczekiwanie', 'nadzieja', 'expectation', 'hope', 'anticipation']
    };

    const normalizedText = text.toLowerCase();
    const detectedEmotions = {};

    Object.keys(emotions).forEach(emotion => {
      const count = emotions[emotion].reduce((acc, keyword) => {
        return acc + (normalizedText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (count > 0) {
        detectedEmotions[emotion] = count;
      }
    });

    return {
      ...basicAnalysis,
      emotions: detectedEmotions,
      dominantEmotion: this.getDominantEmotion(detectedEmotions)
    };
  }

  getDominantEmotion(emotions) {
    if (Object.keys(emotions).length === 0) return null;
    
    return Object.keys(emotions).reduce((a, b) => 
      emotions[a] > emotions[b] ? a : b
    );
  }

  // Get sentiment color for UI
  getSentimentColor(sentiment) {
    const colors = {
      positive: '#4CAF50',
      negative: '#f44336',
      neutral: '#757575'
    };
    return colors[sentiment] || colors.neutral;
  }

  // Get sentiment emoji
  getSentimentEmoji(sentiment) {
    const emojis = {
      positive: '😊',
      negative: '😔',
      neutral: '😐'
    };
    return emojis[sentiment] || emojis.neutral;
  }

  // Batch analyze multiple texts
  analyzeBatch(texts) {
    return texts.map(text => this.analyzeText(text));
  }

  // Get overall sentiment trend
  getSentimentTrend(sentimentHistory) {
    if (!sentimentHistory || sentimentHistory.length === 0) return 'stable';
    
    const recentSentiments = sentimentHistory.slice(-5); // Last 5 interactions
    const scores = recentSentiments.map(s => s.score || 0);
    
    if (scores.length < 2) return 'stable';
    
    const trend = scores[scores.length - 1] - scores[0];
    
    if (trend > 0.2) return 'improving';
    if (trend < -0.2) return 'declining';
    return 'stable';
  }

  // Financial-specific sentiment analysis
  analyzeFinancialSentiment(text) {
    const analysis = this.analyzeText(text);
    
    // Financial stress indicators
    const stressIndicators = [
      'nie stać', 'za drogie', 'brak pieniędzy', 'problemy finansowe',
      "can't afford", 'too expensive', 'broke', 'financial problems',
      'debt', 'loan', 'payment due', 'overdue'
    ];
    
    // Financial confidence indicators
    const confidenceIndicators = [
      'mogę sobie pozwolić', 'mam oszczędności', 'stabilna sytuacja',
      'can afford', 'have savings', 'stable income', 'good investment',
      'profitable', 'growing portfolio'
    ];
    
    const normalizedText = text.toLowerCase();
    
    const stressLevel = stressIndicators.reduce((acc, indicator) => {
      return acc + (normalizedText.includes(indicator) ? 1 : 0);
    }, 0);
    
    const confidenceLevel = confidenceIndicators.reduce((acc, indicator) => {
      return acc + (normalizedText.includes(indicator) ? 1 : 0);
    }, 0);
    
    return {
      ...analysis,
      financialStress: stressLevel > 0 ? 'high' : 'low',
      financialConfidence: confidenceLevel > 0 ? 'high' : 'medium',
      riskTolerance: this.assessRiskTolerance(text)
    };
  }

  assessRiskTolerance(text) {
    const riskAverse = ['bezpiecznie', 'gwarancja', 'pewność', 'safe', 'guarantee', 'certain', 'secure'];
    const riskSeeking = ['ryzyko', 'spekulacja', 'agresywny', 'risk', 'speculation', 'aggressive', 'venture'];
    
    const normalizedText = text.toLowerCase();
    
    const averseness = riskAverse.reduce((acc, word) => acc + (normalizedText.includes(word) ? 1 : 0), 0);
    const seeking = riskSeeking.reduce((acc, word) => acc + (normalizedText.includes(word) ? 1 : 0), 0);
    
    if (seeking > averseness) return 'high';
    if (averseness > seeking) return 'low';
    return 'medium';
  }
}

// Export as singleton
const sentimentAnalyzer = new SentimentAnalyzer();

export const analyzeSentiment = (text) => {
  return sentimentAnalyzer.analyzeText(text);
};

export const analyzeFinancialSentiment = (text) => {
  return sentimentAnalyzer.analyzeFinancialSentiment(text);
};

export const analyzeSentimentWithEmotions = (text) => {
  return sentimentAnalyzer.analyzeWithEmotions(text);
};

export const getSentimentColor = (sentiment) => {
  return sentimentAnalyzer.getSentimentColor(sentiment);
};

export const getSentimentEmoji = (sentiment) => {
  return sentimentAnalyzer.getSentimentEmoji(sentiment);
};

export const getSentimentTrend = (sentimentHistory) => {
  return sentimentAnalyzer.getSentimentTrend(sentimentHistory);
};

export default sentimentAnalyzer;