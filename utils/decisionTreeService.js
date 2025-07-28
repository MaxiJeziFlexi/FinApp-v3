import axios from 'axios';
import { getLocalizedText } from './localization';
import { logUserActivity, logError } from './securityLogger';

class DecisionTreeService {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000';
        console.log('🔧 DecisionTreeService initialized with baseURL:', this.baseURL);
    }

    /** 
     * Mapuje identyfikator doradcy na cel finansowy
     * @param {string} advisorId - ID doradcy
     * @returns {string} - Cel finansowy
     */
    static mapAdvisorToGoal(advisorId) {
        const advisorToGoalMap = {
            "budget_planner": "emergency_fund",
            "savings_strategist": "home_purchase",
            "execution_expert": "debt_reduction",
            "optimization_advisor": "retirement"
        };
        return advisorToGoalMap[advisorId] || "emergency_fund";
    }

    /**
     * Waliduje ścieżkę decyzyjną pod kątem kompletności i spójności
     * @param {string} goalType - Typ celu finansowego
     * @param {Array} decisionPath - Ścieżka decyzji
     * @returns {boolean} - Czy ścieżka jest poprawna
     */
    static validateDecisionPath(goalType, decisionPath) {
        if (!decisionPath || decisionPath.length === 0) return false;
        const requiredSteps = {
            'emergency_fund': 3,
            'debt_reduction': 3,
            'home_purchase': 3,
            'retirement': 3,
            'default': 3
        };
        const requiredStepCount = requiredSteps[goalType] || requiredSteps.default;
        if (decisionPath.length < requiredStepCount) return false;
        const hasInvalidSelection = decisionPath.some(decision => 
            !decision.selection || decision.selection === 'error' || decision.selection === ''
        );
        return !hasInvalidSelection;
    }

    /**
     * Przetwarza krok w drzewie decyzyjnym
     * @param {string} advisorId - ID doradcy
     * @param {number} currentStep - Aktualny krok
     * @param {Array} decisionPath - Ścieżka decyzji
     * @param {Object} userContext - Kontekst użytkownika
     * @returns {Promise<Array>} - Opcje dla następnego kroku
     */
    async processDecisionStep(advisorId, currentStep, decisionPath, userContext = {}) {
        try {
            if (!advisorId) throw new Error('INVALID_ADVISOR: Brak identyfikatora doradcy');
            if (typeof currentStep !== 'number' || currentStep < 0) throw new Error('INVALID_STEP: Krok musi być nieujemną liczbą całkowitą');
            if (!Array.isArray(decisionPath)) throw new Error('INVALID_PATH: Ścieżka decyzyjna musi być tablicą');

            const financialGoal = DecisionTreeService.mapAdvisorToGoal(advisorId);

            await logUserActivity({
                action: 'DECISION_STEP_REQUESTED',
                advisorId,
                step: currentStep,
                goal: financialGoal,
                decisionPathIds: decisionPath.map(d => d.selection)
            });

            if (currentStep > 0 && decisionPath.length < currentStep) {
                console.warn(`Niespójność ścieżki: Oczekiwano ${currentStep} decyzji, znaleziono ${decisionPath.length}`);
                return this.getFallbackOptions(advisorId, Math.max(0, currentStep - 1));
            }

            const url = `${this.baseURL}/api/decision-tree`;
            const requestData = {
                advisor_id: advisorId,
                user_id: localStorage.getItem('userId') || 1,
                current_step: currentStep,
                decision_path: decisionPath,
                context: userContext
            };

            console.log('🌐 Request to AI server:', { url, requestData });

            try {
                const response = await axios.post(url, requestData, { timeout: 5000 });
                if (response.data?.options) {
                    console.log('✅ AI server options:', response.data.options);
                    return response.data.options;
                }
                console.warn('⚠️ No options from backend, using fallback');
                return this.getLocalOptions(financialGoal, currentStep, decisionPath, userContext);
            } catch (apiError) {
                console.error('❌ API error:', apiError);
                logError({
                    component: 'DecisionTreeService',
                    method: 'processDecisionStep',
                    error: apiError.message,
                    details: { advisorId, step: currentStep, goalType: financialGoal }
                });
                return this.getLocalOptions(financialGoal, currentStep, decisionPath, userContext);
            }
        } catch (error) {
            console.error('❌ Error in processDecisionStep:', error);
            logError({
                component: 'DecisionTreeService',
                method: 'processDecisionStep',
                error: error.message,
                details: { advisorId: advisorId || 'unknown', step: currentStep || 0 }
            });
            const errorCode = error.message.split(':')[0] || 'UNKNOWN_ERROR';
            return [{
                id: "error",
                text: getLocalizedText('error.try_again') || "Wystąpił błąd, spróbuj ponownie",
                value: "error",
                question: getLocalizedText(`error.${errorCode.toLowerCase()}`) || "Przepraszamy, wystąpił błąd. Czy chcesz spróbować ponownie?"
            }];
        }
    }

    /**
     * Generuje raport na podstawie ścieżki decyzyjnej
     * @param {string} advisorId - ID doradcy
     * @param {Array} decisionPath - Ścieżka decyzji
     * @param {Object} userProfile - Profil użytkownika
     * @returns {Promise<Object>} - Raport finansowy
     */
    async generateReport(advisorId, decisionPath, userProfile) {
        try {
            if (!advisorId) throw new Error('INVALID_ADVISOR: Brak identyfikatora doradcy');
            if (!Array.isArray(decisionPath)) throw new Error('INVALID_PATH: Ścieżka decyzyjna musi być tablicą');

            const financialGoal = DecisionTreeService.mapAdvisorToGoal(advisorId);

            await logUserActivity({
                action: 'REPORT_GENERATION_STARTED',
                advisorId,
                goal: financialGoal,
                decisionPathLength: decisionPath.length
            });

            const isPathComplete = DecisionTreeService.validateDecisionPath(financialGoal, decisionPath);
            if (!isPathComplete) {
                console.warn('Niekompletna ścieżka decyzyjna');
            }

            const url = `${this.baseURL}/api/decision-tree/report`;
            const requestData = {
                advisor_id: advisorId,
                user_id: userProfile?.id || 1,
                decision_path: decisionPath,
                user_profile: this.sanitizeUserProfile(userProfile)
            };

            console.log('📄 Generating report:', { url, requestData });

            try {
                const response = await axios.post(url, requestData, { timeout: 10000 });
                await logUserActivity({
                    action: 'REPORT_GENERATION_COMPLETED',
                    advisorId,
                    goal: financialGoal,
                    reportId: new Date().toISOString()
                });
                console.log('✅ Report generated:', response.data);
                return {
                    ...response.data,
                    generatedAt: new Date().toISOString(),
                    advisorId,
                    goal: financialGoal,
                    confidenceScore: this.calculateConfidenceScore(decisionPath, userProfile),
                    timeEstimate: this.estimateImplementationTime(response.data, userProfile),
                    riskLevel: this.assessRecommendationRisk(response.data, userProfile)
                };
            } catch (apiError) {
                console.error('❌ Report API error:', apiError);
                logError({
                    component: 'DecisionTreeService',
                    method: 'generateReport',
                    error: apiError.message,
                    details: { advisorId, goalType: financialGoal }
                });
                return this.generateLocalReport(financialGoal, decisionPath, userProfile);
            }
        } catch (error) {
            console.error('❌ Error in generateReport:', error);
            logError({
                component: 'DecisionTreeService',
                method: 'generateReport',
                error: error.message,
                details: { advisorId: advisorId || 'unknown' }
            });
            const errorCode = error.message.split(':')[0] || 'UNKNOWN_ERROR';
            return {
                summary: getLocalizedText('error.report_fallback_summary') || "Wystąpił błąd. Oto ogólne rekomendacje.",
                steps: [
                    "Stwórz budżet miesięczny i monitoruj wydatki",
                    "Zbuduj fundusz awaryjny (3-6 miesięcy wydatków)",
                    "Spłać zadłużenia o wysokim oprocentowaniu",
                    "Regularnie odkładaj na cele długoterminowe"
                ],
                generatedAt: new Date().toISOString(),
                isErrorFallback: true,
                errorCode
            };
        }
    }

    /**
     * Testuje połączenie z serwerem AI
     * @returns {Promise<boolean>} - Czy połączenie działa
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('✅ AI Server is running:', data);
                return true;
            }
            console.error('❌ Server error:', response.status);
            return false;
        } catch (error) {
            console.error('❌ Connection error:', error);
            return false;
        }
    }

    /**
     * Resetuje drzewo decyzyjne
     * @returns {Promise<Object>} - Odpowiedź z API
     */
    async resetDecisionTree() {
        try {
            const userId = localStorage.getItem('userId') || 1;
            await logUserActivity({ action: 'DECISION_TREE_RESET_REQUESTED', userId });
            const response = await axios.post(`${this.baseURL}/api/decision-tree/reset`, { user_id: userId }, { timeout: 5000 });
            await logUserActivity({ action: 'DECISION_TREE_RESET_COMPLETED', userId });
            return response.data;
        } catch (error) {
            console.error('❌ Reset error:', error);
            logError({
                component: 'DecisionTreeService',
                method: 'resetDecisionTree',
                error: error.message
            });
            throw new Error("Nie udało się zresetować drzewa decyzyjnego");
        }
    }

    /**
     * Pobiera rekomendacje użytkownika
     * @returns {Promise<Array>} - Lista rekomendacji
     */
    async getUserRecommendations() {
        try {
            const userId = localStorage.getItem('userId') || 1;
            const response = await axios.get(`${this.baseURL}/api/decision-tree/recommendations/${userId}`, { timeout: 5000 });
            return response.data.recommendations || [];
        } catch (error) {
            console.error('❌ Recommendations error:', error);
            logError({
                component: 'DecisionTreeService',
                method: 'getUserRecommendations',
                error: error.message
            });
            return [];
        }
    }

    /**
     * Zapisuje postęp użytkownika
     * @param {string} advisorId - ID doradcy
     * @param {Array} decisionPath - Ścieżka decyzji
     * @returns {Promise<boolean>} - Czy zapis się powiódł
     */
    async saveProgress(advisorId, decisionPath) {
        try {
            const userId = localStorage.getItem('userId') || 1;
            await axios.post(`${this.baseURL}/api/decision-tree/progress`, {
                user_id: userId,
                advisor_id: advisorId,
                decision_path: decisionPath.map(d => ({ step: d.step, selection: d.selection }))
            }, { timeout: 5000 });
            return true;
        } catch (error) {
            console.error('❌ Save progress error:', error);
            logError({
                component: 'DecisionTreeService',
                method: 'saveProgress',
                error: error.message,
                details: { advisorId }
            });
            this.saveProgressLocally(advisorId, decisionPath);
            return false;
        }
    }

    /**
     * Zapisuje postęp lokalnie
     * @param {string} advisorId - ID doradcy
     * @param {Array} decisionPath - Ścieżka decyzji
     */
    saveProgressLocally(advisorId, decisionPath) {
        try {
            const progressKey = `dt_progress_${advisorId}`;
            const progressData = {
                timestamp: new Date().toISOString(),
                path: decisionPath.map(d => ({ step: d.step, selection: d.selection }))
            };
            localStorage.setItem(progressKey, JSON.stringify(progressData));
        } catch (error) {
            console.error('❌ Local save error:', error);
        }
    }

    /**
     * Pobiera lokalny postęp
     * @param {string} advisorId - ID doradcy
     * @returns {Array|null} - Ścieżka decyzji lub null
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
            console.error('❌ Local progress error:', error);
            return null;
        }
    }

    /**
     * Zwraca informacje o doradcy
     * @param {string} advisorId - ID doradcy
     * @returns {Object} - Informacje o doradcy
     */
    getAdvisorInfo(advisorId) {
        const advisorMap = {
            "budget_planner": { goal: "emergency_fund", name: "Planista Budżetu" },
            "savings_strategist": { goal: "home_purchase", name: "Strateg Oszczędności" },
            "execution_expert": { goal: "debt_reduction", name: "Ekspert Realizacji" },
            "optimization_advisor": { goal: "retirement", name: "Doradca Optymalizacji" }
        };
        return advisorMap[advisorId] || { goal: "emergency_fund", name: "Doradca Finansowy" };
    }

    /**
     * Zwraca opcje fallback
     * @param {string} advisorId - ID doradcy
     * @param {number} step - Krok
     * @returns {Array} - Opcje fallback
     */
    getFallbackOptions(advisorId, step) {
        const advisor = this.getAdvisorInfo(advisorId);
        const goalType = advisor.goal;
        console.log('🔄 Fallback options for:', { advisorId, goalType, step });

        if (goalType === "emergency_fund") {
            if (step === 0) return [
                { id: "short", text: "W ciągu 6 miesięcy", value: "short", question: "W jakim czasie chcesz zgromadzić fundusz?" },
                { id: "medium", text: "W ciągu roku", value: "medium", question: "W jakim czasie chcesz zgromadzić fundusz?" },
                { id: "long", text: "W ciągu 1-2 lat", value: "long", question: "W jakim czasie chcesz zgromadzić fundusz?" }
            ];
            if (step === 1) return [
                { id: "three", text: "3 miesiące wydatków", value: "three", question: "Ile wydatków pokryć funduszem?" },
                { id: "six", text: "6 miesięcy wydatków", value: "six", question: "Ile wydatków pokryć funduszem?" },
                { id: "twelve", text: "12 miesięcy wydatków", value: "twelve", question: "Ile wydatków pokryć funduszem?" }
            ];
            if (step === 2) return [
                { id: "automatic", text: "Automatyczne odkładanie", value: "automatic", question: "Jaki sposób oszczędzania?" },
                { id: "percentage", text: "Procent dochodów", value: "percentage", question: "Jaki sposób oszczędzania?" },
                { id: "surplus", text: "Nadwyżki z budżetu", value: "surplus", question: "Jaki sposób oszczędzania?" }
            ];
        }
        // Dodaj inne cele finansowe podobnie jak w oryginalnym kodzie
        return [
            { id: "restart", text: "Rozpocznij od nowa", value: "restart", question: "Wystąpił problem. Co chcesz zrobić?" },
            { id: "continue", text: "Kontynuuj", value: "continue", question: "Wystąpił problem. Co chcesz zrobić?" }
        ];
    }

    /**
     * Pobiera lokalne opcje
     * @param {string} goalType - Typ celu
     * @param {number} step - Krok
     * @param {Array} decisionPath - Ścieżka decyzji
     * @param {Object} userContext - Kontekst użytkownika
     * @returns {Array} - Opcje lokalne
     */
    getLocalOptions(goalType, step, decisionPath, userContext) {
        if (goalType === 'emergency_fund') {
            const options = [
                [
                    { id: "short", text: "W ciągu 6 miesięcy", value: "short", question: "W jakim czasie chcesz zgromadzić fundusz?" },
                    { id: "medium", text: "W ciągu roku", value: "medium", question: "W jakim czasie chcesz zgromadzić fundusz?" },
                    { id: "long", text: "W ciągu 1-2 lat", value: "long", question: "W jakim czasie chcesz zgromadzić fundusz?" }
                ],
                [
                    { id: "three", text: "3 miesiące wydatków", value: "three", question: "Ile wydatków pokryć funduszem?" },
                    { id: "six", text: "6 miesięcy wydatków", value: "six", question: "Ile wydatków pokryć funduszem?" },
                    { id: "twelve", text: "12 miesięcy wydatków", value: "twelve", question: "Ile wydatków pokryć funduszem?" }
                ],
                [
                    { id: "automatic", text: "Automatyczne odkładanie", value: "automatic", question: "Jaki sposób oszczędzania?" },
                    { id: "percentage", text: "Procent dochodów", value: "percentage", question: "Jaki sposób oszczędzania?" },
                    { id: "surplus", text: "Nadwyżki z budżetu", value: "surplus", question: "Jaki sposób oszczędzania?" }
                ]
            ];
            if (userContext?.monthlyIncome === 'below_2000' && step === 0) {
                options[0].unshift({ id: "very_long", text: "W ciągu 2-3 lat", value: "very_long", question: "W jakim czasie chcesz zgromadzić fundusz?" });
            }
            return options[step] || [];
        }
        // Dodaj inne cele finansowe
        return [];
    }

    /**
     * Generuje lokalny raport
     * @param {string} goalType - Typ celu
     * @param {Array} decisionPath - Ścieżka decyzji
     * @param {Object} userProfile - Profil użytkownika
     * @returns {Object} - Lokalny raport
     */
    generateLocalReport(goalType, decisionPath, userProfile) {
        if (goalType === 'emergency_fund') {
            const timeframe = decisionPath.find(d => ["short", "medium", "long", "very_long"].includes(d.selection))?.selection || "medium";
            const amount = decisionPath.find(d => ["three", "six", "twelve"].includes(d.selection))?.selection || "six";
            const method = decisionPath.find(d => ["automatic", "percentage", "surplus"].includes(d.selection))?.selection || "automatic";
            const timeframeMap = { "short": "6 miesięcy", "medium": "roku", "long": "1-2 lat", "very_long": "2-3 lat" };
            const amountMap = { "three": "3 miesiące", "six": "6 miesięcy", "twelve": "12 miesięcy" };
            const methodMap = { "automatic": "automatycznego odkładania", "percentage": "procentu dochodów", "surplus": "nadwyżek z budżetu" };
            return {
                summary: `Rekomendujemy fundusz awaryjny na ${amountMap[amount]} wydatków w ${timeframeMap[timeframe]} poprzez ${methodMap[method]}.`,
                steps: [
                    `Oblicz wydatki i pomnóż przez ${amountMap[amount].split(" ")[0]}`,
                    "Wybierz konto oszczędnościowe lub lokaty",
                    "Ustaw automatyczne przelewy",
                    "Używaj funduszu tylko w nagłych przypadkach"
                ],
                generatedAt: new Date().toISOString(),
                financialGoal: "emergency_fund",
                isLocalFallback: true
            };
        }
        // Dodaj inne cele finansowe
        return {
            summary: "Ogólne rekomendacje finansowe.",
            steps: ["Stwórz budżet", "Zbuduj fundusz awaryjny", "Spłać długi", "Odkładaj na cele"],
            generatedAt: new Date().toISOString(),
            isLocalFallback: true
        };
    }

    /**
     * Usuwa wrażliwe dane z profilu użytkownika
     * @param {Object} userProfile - Profil użytkownika
     * @returns {Object} - Oczyszczony profil
     */
    sanitizeUserProfile(userProfile) {
        if (!userProfile) return {};
        const sanitized = { ...userProfile };
        delete sanitized.email;
        delete sanitized.phoneNumber;
        delete sanitized.address;
        delete sanitized.pesel;
        delete sanitized.documentId;
        delete sanitized.dateOfBirth;
        return {
            monthlyIncome: sanitized.monthlyIncome,
            financialGoal: sanitized.financialGoal,
            timeframe: sanitized.timeframe,
            currentSavings: sanitized.currentSavings,
            targetAmount: sanitized.targetAmount,
            progress: sanitized.progress,
            riskTolerance: sanitized.riskTolerance
        };
    }

    /**
     * Oblicza ocenę wiarygodności
     * @param {Array} decisionPath - Ścieżka decyzji
     * @param {Object} userProfile - Profil użytkownika
     * @returns {number} - Ocena (0-1)
     */
    calculateConfidenceScore(decisionPath, userProfile) {
        let score = 0.5;
        if (decisionPath?.length > 0) score += Math.min(0.3, decisionPath.length * 0.1);
        if (userProfile) {
            const fields = ['name', 'financialGoal', 'timeframe', 'currentSavings', 'monthlyIncome', 'targetAmount'];
            const filled = fields.filter(f => userProfile[f] !== undefined && userProfile[f] !== '').length;
            score += Math.min(0.2, filled * 0.03);
        }
        return Math.min(1, Math.round(score * 10) / 10);
    }

    /**
     * Szacuje czas wdrożenia
     * @param {Object} recommendation - Rekomendacja
     * @param {Object} userProfile - Profil użytkownika
     * @returns {Object} - Oszacowanie czasu
     */
    estimateImplementationTime(recommendation, userProfile) {
        if (userProfile?.financialGoal) {
            switch (userProfile.financialGoal) {
                case 'emergency_fund': return { value: 6, unit: 'months', confidence: 'medium' };
                case 'debt_reduction': return { value: 12, unit: 'months', confidence: 'medium' };
                case 'home_purchase': return { value: 24, unit: 'months', confidence: 'medium' };
                case 'retirement': return { value: 5, unit: 'years', confidence: 'low' };
                default: return { value: 12, unit: 'months', confidence: 'low' };
            }
        }
        return { value: 12, unit: 'months', confidence: 'low' };
    }

    /**
     * Ocenia ryzyko rekomendacji
     * @param {Object} recommendation - Rekomendacja
     * @param {Object} userProfile - Profil użytkownika
     * @returns {string} - Poziom ryzyka
     */
    assessRecommendationRisk(recommendation, userProfile) {
        if (userProfile?.financialGoal === 'retirement' && userProfile.riskTolerance === 'low') return 'low';
        if (userProfile?.financialGoal === 'home_purchase') return 'medium';
        return 'medium';
    }
}

export default new DecisionTreeService();