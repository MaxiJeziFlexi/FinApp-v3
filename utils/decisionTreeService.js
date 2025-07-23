/**
 * Enhanced Decision Tree Service - utils/decisionTreeService.js
 * 
 * This service provides a robust framework for financial decision trees with:
 * - Dynamic branching based on user context and profile
 * - Comprehensive error handling and fallbacks
 * - Data validation and sanitization
 * - Support for multiple recommendation algorithms
 * - GDPR compliance with data minimization
 */

import axios from 'axios';
import { getLocalizedText } from './localization';
import { logUserActivity, logError } from './securityLogger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Map advisor ID to appropriate financial goal
 * 
 * @param {string} advisorId - ID of the advisor
 * @returns {string} - Corresponding financial goal
 */
const mapAdvisorToGoal = (advisorId) => {
  const advisorToGoalMap = {
    "budget_planner": "emergency_fund",
    "savings_strategist": "home_purchase",
    "execution_expert": "debt_reduction",
    "optimization_advisor": "retirement"
  };
  
  return advisorToGoalMap[advisorId] || "emergency_fund";
};

/**
 * Validates the decision path for completeness and consistency
 * 
 * @param {string} goalType - The type of financial goal
 * @param {Array} decisionPath - Path of decisions taken
 * @returns {boolean} - Whether the path is valid and complete
 */
const validateDecisionPath = (goalType, decisionPath) => {
  if (!decisionPath || decisionPath.length === 0) return false;
  
  // Required steps for each goal type
  const requiredSteps = {
    'emergency_fund': 3,
    'debt_reduction': 3,
    'home_purchase': 3,
    'retirement': 3,
    'default': 3
  };
  
  const requiredStepCount = requiredSteps[goalType] || requiredSteps.default;
  
  // Check if we have the minimum required steps
  if (decisionPath.length < requiredStepCount) return false;
  
  // Check for null or undefined selections
  const hasInvalidSelection = decisionPath.some(decision => 
    !decision.selection || decision.selection === 'error' || decision.selection === ''
  );
  
  return !hasInvalidSelection;
};

/**
 * Serwis do komunikacji z backendem obsługującym drzewo decyzyjne
 * z rozszerzoną funkcjonalnością i lepszą obsługą błędów
 */
const decisionTreeService = {
  /**
   * Przetwarza krok w drzewie decyzyjnym z rozszerzoną obsługą błędów
   * i dynamicznym branching'iem
   * 
   * @param {string} advisorId - ID doradcy prowadzącego proces
   * @param {number} step - Aktualny krok w drzewie decyzyjnym
   * @param {Array} decisionPath - Poprzednie decyzje użytkownika
   * @param {Object} userContext - Dodatkowy kontekst użytkownika dla personalizacji
   * @returns {Promise<Array>} - Opcje dla następnego kroku decyzyjnego
   * @throws {Error} - Strukturyzowane błędy z diagnostyką
   */
  async processDecisionStep(advisorId, step, decisionPath, userContext = {}) {
    try {
      // Walidacja danych wejściowych
      if (!advisorId) throw new Error('INVALID_ADVISOR: Brak identyfikatora doradcy');
      if (step < 0) throw new Error('INVALID_STEP: Krok musi być nieujemną liczbą całkowitą');
      if (!Array.isArray(decisionPath)) throw new Error('INVALID_PATH: Ścieżka decyzyjna musi być tablicą');
      
      // Mapowanie identyfikatora doradcy na odpowiedni cel finansowy
      const financialGoal = mapAdvisorToGoal(advisorId);
      
      // Rejestrujemy zdarzenie w celach audytu (GDPR-compliant)
      await logUserActivity({
        action: 'DECISION_STEP_REQUESTED',
        advisorId,
        step,
        goal: financialGoal,
        // Zapisujemy tylko identyfikatory wyborów, nie pełne dane
        decisionPathIds: decisionPath.map(d => d.selection)
      });
      
      // Sprawdzenie niespójności ścieżki decyzyjnej
      if (step > 0 && decisionPath.length < step) {
        console.warn(`Niespójność ścieżki decyzyjnej: Oczekiwano co najmniej ${step} decyzji, znaleziono ${decisionPath.length}`);
        // Wracamy do poprzedniego kroku lub stosujemy fallback
        return this.generateFallbackOptions(financialGoal, Math.max(0, step - 1));
      }

      try {
        // Próbujemy pobrać dane z backendu
        const response = await axios.post(`${API_URL}/decision-tree`, {
          user_id: localStorage.getItem('userId') || 1,
          advisor_id: advisorId,
          goal_type: financialGoal,
          step: step,
          decision_path: decisionPath.map(d => ({
            step: d.step,
            selection: d.selection,
            value: d.value
          })),
          context: userContext
        }, {
          timeout: 5000 // 5 sekund timeout
        });
        
        // Przetwarzamy odpowiedź z API
        if (response.data && response.data.options) {
          return response.data.options;
        }
        
        // Jeśli backend nie zwrócił opcji, używamy lokalnego fallbacku
        console.warn("Backend nie zwrócił opcji, używam lokalnego fallbacku");
        return this.getLocalOptions(financialGoal, step, decisionPath, userContext);
        
      } catch (apiError) {
        // Obsługa błędów komunikacji z API
        console.error("Błąd komunikacji z API drzewa decyzyjnego:", apiError);
        logError({
          component: 'decisionTreeService',
          method: 'processDecisionStep',
          error: apiError.message,
          details: { advisorId, step, goalType: financialGoal }
        });
        
        // Używamy lokalnego fallbacku w przypadku błędu API
        return this.getLocalOptions(financialGoal, step, decisionPath, userContext);
      }
    } catch (error) {
      console.error('Błąd w processDecisionStep:', error);
      // Rejestracja zdarzenia błędu
      logError({
        component: 'decisionTreeService',
        method: 'processDecisionStep',
        error: error.message,
        details: { advisorId: advisorId || 'unknown', step: step || 0 }
      });
      
      // Dostarczamy przyjazny komunikat o błędzie dla użytkownika
      const errorCode = error.message.split(':')[0] || 'UNKNOWN_ERROR';
      
      // Zwracamy opcje przyjazne dla użytkownika w przypadku błędu
      return [
        {
          id: "error",
          text: getLocalizedText('error.try_again') || "Wystąpił błąd, spróbuj ponownie",
          value: "error",
          question: getLocalizedText(`error.${errorCode.toLowerCase()}`) || 
                    "Przepraszamy, wystąpił błąd. Czy chcesz spróbować ponownie?"
        }
      ];
    }
  },
  
  /**
   * Generuje raport na podstawie ścieżki decyzyjnej z rozszerzoną obsługą błędów
   * i dynamicznym branching'iem
   * 
   * @param {string} advisorId - ID doradcy prowadzącego proces
   * @param {Array} decisionPath - Poprzednie decyzje użytkownika
   * @param {Object} userProfile - Profil i preferencje użytkownika
   * @param {Object} options - Dodatkowe opcje dla generowania raportu
   * @returns {Promise<Object>} - Spersonalizowana rekomendacja finansowa
   * @throws {Error} - Strukturyzowane błędy z diagnostyką
   */
  async generateReport(advisorId, decisionPath, userProfile, options = {}) {
    try {
      // Walidacja danych wejściowych
      if (!advisorId) throw new Error('INVALID_ADVISOR: Brak identyfikatora doradcy');
      if (!Array.isArray(decisionPath)) throw new Error('INVALID_PATH: Ścieżka decyzyjna musi być tablicą');
      
      // Mapowanie identyfikatora doradcy na odpowiedni cel finansowy
      const financialGoal = mapAdvisorToGoal(advisorId);
      
      // Rejestrujemy zdarzenie generowania raportu
      await logUserActivity({
        action: 'REPORT_GENERATION_STARTED',
        advisorId,
        goal: financialGoal,
        decisionPathLength: decisionPath.length
      });
      
      // Sprawdzamy, czy ścieżka decyzyjna jest kompletna
      const isPathComplete = validateDecisionPath(financialGoal, decisionPath);
      if (!isPathComplete) {
        console.warn('Wykryto niekompletną ścieżkę decyzyjną, używamy dostępnych danych do raportu');
      }
      
      try {
        // Wywołujemy endpoint API do generowania raportu
        const response = await axios.post(`${API_URL}/decision-tree/report`, {
          user_id: localStorage.getItem('userId') || 1,
          advisor_id: advisorId,
          goal_type: financialGoal,
          decision_path: decisionPath.map(d => ({
            step: d.step,
            selection: d.selection,
            value: d.value
          })),
          user_profile: this.sanitizeUserProfile(userProfile) // Usuwamy wrażliwe dane
        }, {
          timeout: 10000 // 10 sekund timeout
        });
        
        // Rejestrujemy pomyślne wygenerowanie raportu
        await logUserActivity({
          action: 'REPORT_GENERATION_COMPLETED',
          advisorId,
          goal: financialGoal,
          reportId: new Date().toISOString()
        });
        
        // Zwracamy raport z API z dodatkowymi metadanymi
        return {
          ...response.data,
          generatedAt: new Date().toISOString(),
          advisorId: advisorId,
          goal: financialGoal,
          confidenceScore: this.calculateConfidenceScore(decisionPath, userProfile),
          timeEstimate: this.estimateImplementationTime(response.data, userProfile),
          riskLevel: this.assessRecommendationRisk(response.data, userProfile)
        };
        
      } catch (apiError) {
        // Obsługa błędów komunikacji z API
        console.error("Błąd komunikacji z API raportu:", apiError);
        logError({
          component: 'decisionTreeService',
          method: 'generateReport',
          error: apiError.message,
          details: { advisorId, goalType: financialGoal }
        });
        
        // Używamy lokalnego fallbacku w przypadku błędu API
        return this.generateLocalReport(financialGoal, decisionPath, userProfile, options);
      }
      
    } catch (error) {
      console.error('Błąd w generateReport:', error);
      // Rejestracja zdarzenia błędu
      logError({
        component: 'decisionTreeService',
        method: 'generateReport',
        error: error.message,
        details: { advisorId: advisorId || 'unknown' }
      });
      
      // Dostarczamy rekomendację fallback w przypadku błędów
      return {
        summary: getLocalizedText('error.report_fallback_summary') || 
                "Wystąpił błąd podczas generowania raportu. Oto ogólne rekomendacje finansowe.",
        steps: [
          getLocalizedText('error.report_fallback_step1') || "Stwórz budżet miesięczny i monitoruj wydatki",
          getLocalizedText('error.report_fallback_step2') || "Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków",
          getLocalizedText('error.report_fallback_step3') || "Spłać zadłużenia o wysokim oprocentowaniu",
          getLocalizedText('error.report_fallback_step4') || "Regularnie odkładaj na długoterminowe cele"
        ],
        generatedAt: new Date().toISOString(),
        isErrorFallback: true,
        errorCode: error.message.split(':')[0] || 'UNKNOWN_ERROR'
      };
    }
  },
  
  /**
   * Resetuje drzewo decyzyjne dla użytkownika z dodatkowym logowaniem
   * 
   * @returns {Promise<Object>} - Odpowiedź z API
   */
  async resetDecisionTree() {
    try {
      const userId = localStorage.getItem('userId') || 1;
      
      // Rejestrujemy zdarzenie resetowania
      await logUserActivity({
        action: 'DECISION_TREE_RESET_REQUESTED',
        userId
      });
      
      const response = await axios.post(`${API_URL}/decision-tree/reset`, {
        user_id: userId
      }, {
        timeout: 5000 // 5 sekund timeout
      });
      
      // Rejestrujemy pomyślne resetowanie
      await logUserActivity({
        action: 'DECISION_TREE_RESET_COMPLETED',
        userId
      });
      
      return response.data;
    } catch (error) {
      console.error("Błąd podczas resetowania drzewa decyzyjnego:", error);
      
      // Rejestracja błędu
      logError({
        component: 'decisionTreeService',
        method: 'resetDecisionTree',
        error: error.message
      });
      
      throw new Error("Nie udało się zresetować drzewa decyzyjnego");
    }
  },
  
  /**
   * Pobiera zapisane rekomendacje dla użytkownika z obsługą błędów
   * 
   * @returns {Promise<Array>} - Lista rekomendacji
   */
  async getUserRecommendations() {
    try {
      const userId = localStorage.getItem('userId') || 1;
      
      const response = await axios.get(`${API_URL}/decision-tree/recommendations/${userId}`, {
        timeout: 5000 // 5 sekund timeout
      });
      
      return response.data.recommendations || [];
    } catch (error) {
      console.error("Błąd podczas pobierania rekomendacji:", error);
      
      // Rejestracja błędu
      logError({
        component: 'decisionTreeService',
        method: 'getUserRecommendations',
        error: error.message
      });
      
      return [];
    }
  },
  
  /**
   * Zapisuje postęp użytkownika w drzewie decyzyjnym
   * 
   * @param {string} advisorId - ID doradcy
   * @param {Array} decisionPath - Ścieżka decyzyjna użytkownika
   * @returns {Promise<boolean>} - Czy zapis się powiódł
   */
  async saveProgress(advisorId, decisionPath) {
    try {
      const userId = localStorage.getItem('userId') || 1;
      
      await axios.post(`${API_URL}/decision-tree/progress`, {
        user_id: userId,
        advisor_id: advisorId,
        decision_path: decisionPath.map(d => ({
          step: d.step,
          selection: d.selection
        }))
      }, {
        timeout: 5000
      });
      
      return true;
    } catch (error) {
      console.error("Błąd podczas zapisywania postępu:", error);
      
      // Rejestracja błędu
      logError({
        component: 'decisionTreeService',
        method: 'saveProgress',
        error: error.message,
        details: { advisorId }
      });
      
      // Zapisujemy lokalnie jako fallback
      this.saveProgressLocally(advisorId, decisionPath);
      
      return false;
    }
  },
  
  /**
   * Zapisuje postęp lokalnie jako fallback w przypadku błędu API
   * 
   * @param {string} advisorId - ID doradcy
   * @param {Array} decisionPath - Ścieżka decyzyjna użytkownika
   */
  saveProgressLocally(advisorId, decisionPath) {
    try {
      // Bezpieczna implementacja zapisu lokalnego
      const progressKey = `dt_progress_${advisorId}`;
      const progressData = {
        timestamp: new Date().toISOString(),
        path: decisionPath.map(d => ({
          step: d.step,
          selection: d.selection
        }))
      };
      
      localStorage.setItem(progressKey, JSON.stringify(progressData));
    } catch (error) {
      console.error("Nie udało się zapisać postępu lokalnie:", error);
    }
  },
  
  /**
   * Pobiera lokalnie zapisany postęp
   * 
   * @param {string} advisorId - ID doradcy
   * @returns {Array|null} - Ścieżka decyzyjna lub null
   */
  getLocalProgress(advisorId) {
    try {
      const progressKey = `dt_progress_${advisorId}`;
      const progressData = localStorage.getItem(progressKey);
      
      if (progressData) {
        const parsed = JSON.parse(progressData);
        return parsed.path || null;
      }
      
      return null;
    } catch (error) {
      console.error("Nie udało się odczytać lokalnego postępu:", error);
      return null;
    }
  },
  
  /**
   * Generuje opcje fallback gdy normalny przepływ jest przerwany
   * 
   * @param {string} goalType - Typ celu finansowego
   * @param {number} step - Aktualny krok w drzewie
   * @returns {Array} - Opcje fallback
   */
  generateFallbackOptions(goalType, step) {
    // Dostarczamy znaczące opcje odzyskiwania
    return [
      {
        id: "restart",
        text: getLocalizedText('fallback.restart') || "Rozpocznij od nowa",
        value: "restart",
        question: getLocalizedText('fallback.error_occurred') || 
                  "Wystąpił problem. Co chcesz zrobić?"
      },
      {
        id: "continue",
        text: getLocalizedText('fallback.continue') || "Kontynuuj mimo to",
        value: "continue",
        question: getLocalizedText('fallback.error_occurred') || 
                  "Wystąpił problem. Co chcesz zrobić?"
      }
    ];
  },
  
  /**
   * Pobiera lokalne opcje decyzyjne gdy API jest niedostępne
   * 
   * @param {string} goalType - Typ celu finansowego
   * @param {number} step - Aktualny krok w drzewie
   * @param {Array} decisionPath - Poprzednie decyzje
   * @param {Object} userContext - Kontekst użytkownika
   * @returns {Array} - Opcje decyzyjne
   */
  getLocalOptions(goalType, step, decisionPath, userContext) {
    // Wybieramy odpowiednie opcje na podstawie celu finansowego
    switch (goalType) {
      case 'emergency_fund':
        return this.getEmergencyFundOptions(step, decisionPath, userContext);
      case 'debt_reduction':
        return this.getDebtReductionOptions(step, decisionPath, userContext);
      case 'home_purchase':
        return this.getHomePurchaseOptions(step, decisionPath, userContext);
      case 'retirement':
        return this.getRetirementOptions(step, decisionPath, userContext);
      default:
        return this.getGenericOptions(step, decisionPath, userContext);
    }
  },
  
  /**
   * Generuje lokalny raport gdy API jest niedostępne
   * 
   * @param {string} goalType - Typ celu finansowego
   * @param {Array} decisionPath - Ścieżka decyzyjna
   * @param {Object} userProfile - Profil użytkownika
   * @param {Object} options - Dodatkowe opcje
   * @returns {Object} - Raport z rekomendacjami
   */
  generateLocalReport(goalType, decisionPath, userProfile, options) {
    // Wybieramy odpowiedni generator raportu na podstawie celu finansowego
    switch (goalType) {
      case 'emergency_fund':
        return this.generateEmergencyFundReport(decisionPath, userProfile);
      case 'debt_reduction':
        return this.generateDebtReductionReport(decisionPath, userProfile);
      case 'home_purchase':
        return this.generateHomePurchaseReport(decisionPath, userProfile);
      case 'retirement':
        return this.generateRetirementReport(decisionPath, userProfile);
      default:
        return this.generateGenericReport(decisionPath, userProfile);
    }
  },
  
  /**
   * Sanityzuje profil użytkownika przed wysłaniem do API,
   * usuwając wszelkie wrażliwe dane (GDPR compliance)
   * 
   * @param {Object} userProfile - Pełny profil użytkownika
   * @returns {Object} - Oczyszczony profil
   */
  sanitizeUserProfile(userProfile) {
    if (!userProfile) return {};
    
    // Tworzymy kopię, aby nie modyfikować oryginału
    const sanitized = { ...userProfile };
    
    // Usuwamy potencjalnie wrażliwe dane
    delete sanitized.email;
    delete sanitized.phoneNumber;
    delete sanitized.address;
    delete sanitized.pesel;
    delete sanitized.documentId;
    delete sanitized.dateOfBirth;
    
    // Zwracamy tylko niezbędne dane finansowe
    return {
      monthlyIncome: sanitized.monthlyIncome,
      financialGoal: sanitized.financialGoal,
      timeframe: sanitized.timeframe,
      currentSavings: sanitized.currentSavings,
      targetAmount: sanitized.targetAmount,
      progress: sanitized.progress,
      riskTolerance: sanitized.riskTolerance
    };
  },
  
  /**
   * Oblicza ocenę wiarygodności dla wygenerowanej rekomendacji
   * 
   * @param {Array} decisionPath - Ścieżka decyzyjna
   * @param {Object} userProfile - Profil użytkownika
   * @returns {number} - Ocena wiarygodności (0-1)
   */
  calculateConfidenceScore(decisionPath, userProfile) {
    // Bazujemy na kompletności ścieżki decyzyjnej i bogactwie profilu użytkownika
    
    let score = 0.5; // Zaczynamy od średniej pewności
    
    // Dodajemy pewność za każdą podjętą decyzję
    if (decisionPath && decisionPath.length > 0) {
      score += Math.min(0.3, decisionPath.length * 0.1);
    }
    
    // Dodajemy pewność za kompletność profilu użytkownika
    if (userProfile) {
      const profileFields = [
        'name', 'financialGoal', 'timeframe', 
        'currentSavings', 'monthlyIncome', 'targetAmount'
      ];
      
      const filledFieldsCount = profileFields.filter(field => 
        userProfile[field] !== undefined && userProfile[field] !== ''
      ).length;
      
      score += Math.min(0.2, filledFieldsCount * 0.03);
    }
    
    return Math.min(1, Math.round(score * 10) / 10);
  },

  /**
   * Szacuje czas potrzebny na wdrożenie rekomendacji
   * 
   * @param {Object} recommendation - Wygenerowana rekomendacja
   * @param {Object} userProfile - Profil użytkownika
   * @returns {Object} - Oszacowanie czasu z jednostką i wartością
   */
  estimateImplementationTime(recommendation, userProfile) {
    // W prawdziwej implementacji tu byłaby logika biznesowa do szacowania czasu
    
    // Proste oszacowania na podstawie celu finansowego
    if (userProfile && userProfile.financialGoal) {
      switch (userProfile.financialGoal) {
        case 'emergency_fund':
          return { value: 6, unit: 'months', confidence: 'medium' };
        case 'debt_reduction':
          return { value: 12, unit: 'months', confidence: 'medium' };
        case 'home_purchase':
          return { value: 24, unit: 'months', confidence: 'medium' };
        case 'retirement':
          return { value: 5, unit: 'years', confidence: 'low' };
        default:
          return { value: 12, unit: 'months', confidence: 'low' };
      }
    }
    
    return { value: 12, unit: 'months', confidence: 'low' };
  },

  /**
   * Ocenia poziom ryzyka rekomendacji
   * 
   * @param {Object} recommendation - Wygenerowana rekomendacja
   * @param {Object} userProfile - Profil użytkownika
   * @returns {string} - Poziom ryzyka (low, medium, high)
   */
  assessRecommendationRisk(recommendation, userProfile) {
    // Tu powinna być implementacja logiki biznesowej do oceny ryzyka
    // na podstawie typu rekomendacji i sytuacji finansowej użytkownika
    
    // Prosta implementacja
    if (userProfile && userProfile.financialGoal === 'retirement' && 
        userProfile.riskTolerance === 'low') {
      return 'low';
    } else if (userProfile && userProfile.financialGoal === 'home_purchase') {
      return 'medium';
    }
    
    return 'medium';
  },
  
  // Implementacje generatorów opcji dla różnych celów finansowych
  
  /**
   * Pobiera opcje funduszu awaryjnego dla danego kroku
   * 
   * @param {number} step - Bieżący krok decyzyjny
   * @param {Array} decisionPath - Poprzednie decyzje
   * @param {Object} userContext - Kontekst użytkownika do personalizacji
   * @returns {Array} - Opcje decyzyjne
   */
  getEmergencyFundOptions(step, decisionPath, userContext) {
    const options = [
      // Krok 0: Okres czasu
      [
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
      ],
      // Krok 1: Wielkość funduszu
      [
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
      ],
      // Krok 2: Metoda oszczędzania
      [
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
      ]
    ];
    
    // Dla personalizacji (przykład)
    if (userContext && userContext.monthlyIncome) {
      if (userContext.monthlyIncome === 'below_2000' && step === 0) {
        // Dodajemy łatwiejszą opcję dla niższych dochodów
        options[0].unshift({
          id: "very_long",
          text: "W ciągu 2-3 lat (mniejsze obciążenie miesięczne)",
          value: "very_long",
          question: "W jakim czasie chcesz zgromadzić fundusz awaryjny?"
        });
      }
    }
    
    return options[step] || [];
  },
  
  /**
   * Generuje raport dla funduszu awaryjnego
   */
  generateEmergencyFundReport(decisionPath, userProfile) {
    // Wydobywamy decyzje
    const timeframeDecision = decisionPath.find(d => ["short", "medium", "long", "very_long"].includes(d.selection));
    const amountDecision = decisionPath.find(d => ["three", "six", "twelve"].includes(d.selection));
    const methodDecision = decisionPath.find(d => ["automatic", "percentage", "surplus"].includes(d.selection));
    
    const timeframe = timeframeDecision ? timeframeDecision.selection : "medium";
    const amount = amountDecision ? amountDecision.selection : "six";
    const method = methodDecision ? methodDecision.selection : "automatic";
    
    // Mapowanie wyborów na czytelny tekst
    const timeframeMap = {
      "short": "6 miesięcy",
      "medium": "roku",
      "long": "1-2 lat",
      "very_long": "2-3 lat"
    };
    
    const amountMap = {
      "three": "3 miesiące",
      "six": "6 miesięcy",
      "twelve": "12 miesięcy"
    };
    
    const methodMap = {
      "automatic": "automatycznego odkładania stałej kwoty",
      "percentage": "odkładania procentu dochodów",
      "surplus": "odkładania nadwyżek z budżetu"
    };
    
    // Generujemy podsumowanie rekomendacji
    const summary = `Na podstawie Twoich odpowiedzi rekomendujemy strategię budowy funduszu awaryjnego pokrywającego ${amountMap[amount]} wydatków w ciągu ${timeframeMap[timeframe]} poprzez wykorzystanie ${methodMap[method]}.`;
    
    // Generujemy kroki rekomendacji
    const steps = [
      `Określ swoje miesięczne wydatki i pomnóż je przez ${amountMap[amount].split(" ")[0]}, aby ustalić docelową kwotę funduszu`,
      "Wybierz bezpieczne, płynne instrumenty finansowe (np. konto oszczędnościowe, lokaty krótkoterminowe)",
      "Skorzystaj z funkcji automatycznych przelewów w swoim banku",
      "Korzystaj z funduszu tylko w prawdziwych sytuacjach awaryjnych"
    ];
    
    return {
      summary,
      steps,
      generatedAt: new Date().toISOString(),
      financialGoal: "emergency_fund",
      isLocalFallback: true
    };
  },
  
  // Podobne metody dla pozostałych typów celów finansowych...
  getDebtReductionOptions(step, decisionPath, userContext) {
    // Implementacja opcji dla redukcji zadłużenia
    // ...
    return [];
  },
  
  generateDebtReductionReport(decisionPath, userProfile) {
    // Implementacja raportu dla redukcji zadłużenia
    // ...
    return {
      summary: "Rekomendujemy strategię redukcji zadłużenia metodą lawiny (spłata zobowiązań z najwyższym oprocentowaniem w pierwszej kolejności).",
      steps: [
        "Stwórz pełną listę wszystkich zobowiązań z kwotami, oprocentowaniem i terminami",
        "Przygotuj budżet, który pozwoli przeznaczyć maksymalną kwotę na spłatę zadłużenia",
        "Dodatkowe środki kieruj na zobowiązanie z najwyższym oprocentowaniem",
        "Unikaj zaciągania nowych długów w trakcie realizacji planu spłaty"
      ],
      generatedAt: new Date().toISOString(),
      financialGoal: "debt_reduction",
      isLocalFallback: true
    };
  },
  
  getHomePurchaseOptions(step, decisionPath, userContext) {
    // Implementacja opcji dla zakupu nieruchomości
    // ...
    return [];
  },
  
  generateHomePurchaseReport(decisionPath, userProfile) {
    // Implementacja raportu dla zakupu nieruchomości
    // ...
    return {
      summary: "Rekomendujemy strategię oszczędzania na zakup nieruchomości z wkładem własnym 20% w okresie 3-5 lat.",
      steps: [
        "Utwórz dedykowane konto oszczędnościowe na wkład własny",
        "Ustaw automatyczne przelewy na to konto w dniu wypłaty",
        "Ustaw plan systematycznego oszczędzania 20-25% miesięcznych dochodów",
        "Monitoruj rynek nieruchomości i trendy cenowe w interesujących Cię lokalizacjach"
      ],
      generatedAt: new Date().toISOString(),
      financialGoal: "home_purchase",
      isLocalFallback: true
    };
  },
  
  getRetirementOptions(step, decisionPath, userContext) {
    // Implementacja opcji dla planowania emerytalnego
    // ...
    return [];
  },
  
  generateRetirementReport(decisionPath, userProfile) {
    // Implementacja raportu dla planowania emerytalnego
    // ...
    return {
      summary: "Rekomendujemy strategię budowania zabezpieczenia emerytalnego poprzez zróżnicowany portfel inwestycyjny.",
      steps: [
        "Określ swoje potrzeby finansowe na emeryturze",
        "Zwiększ kwotę oszczędności do 15-20% dochodów", 
        "Stwórz zdywersyfikowany portfel dostosowany do Twojego horyzontu emerytalnego",
        "Systematycznie weryfikuj i dostosowuj strategię do zmieniających się warunków"
      ],
      generatedAt: new Date().toISOString(),
      financialGoal: "retirement",
      isLocalFallback: true
    };
  },
  
  getGenericOptions(step, decisionPath, userContext) {
    // Implementacja ogólnych opcji finansowych
    // ...
    return [];
  },
  
  generateGenericReport(decisionPath, userProfile) {
    // Implementacja ogólnego raportu finansowego
    return {
      summary: "Na podstawie Twoich odpowiedzi przygotowaliśmy ogólne rekomendacje finansowe.",
      steps: [
        "Stwórz budżet miesięczny i monitoruj wydatki",
        "Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków",
        "Spłać zadłużenia o wysokim oprocentowaniu",
        "Regularnie odkładaj na długoterminowe cele"
      ],
      generatedAt: new Date().toISOString(),
      isGeneric: true,
      isLocalFallback: true
    };
  }
};

export default decisionTreeService;