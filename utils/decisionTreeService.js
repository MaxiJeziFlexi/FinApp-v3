// utils/decisionTreeService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Serwis do komunikacji z backendem obsługującym drzewo decyzyjne
 */
const decisionTreeService = {
  /**
   * Przetwarza krok w drzewie decyzyjnym
   * 
   * @param {Object} data - Dane zapytania
   * @param {string} data.advisorType - Typ doradcy (financial, investment, tax, legal)
   * @param {number} data.step - Aktualny krok w drzewie decyzyjnym
   * @param {Array} data.previousChoices - Poprzednie wybory użytkownika
   * @param {string} data.question - Pytanie użytkownika (opcjonalne)
   * @returns {Promise<Object>} - Odpowiedź z API
   */
  async processDecisionStep(data) {
    try {
      const response = await axios.post(`${API_URL}/decision-tree`, {
        user_id: localStorage.getItem('userId') || 1,
        current_node_id: data.step > 0 ? `${data.advisorType}_step_${data.step}` : null,
        answer: data.previousChoices.length > 0 ? data.previousChoices[data.previousChoices.length - 1] : null,
        context: {
          advisor_type: data.advisorType,
          journey: data.previousChoices,
          question: data.question || ""
        }
      });

      // Przetwarzamy odpowiedź z API na format wymagany przez frontend
      const apiResponse = response.data;
      
      // Sprawdzamy, czy mamy rekomendacje, czy dalsze pytania
      if (apiResponse.node.type === "recommendation") {
        return {
          isComplete: true,
          options: [],
          recommendations: apiResponse.recommendations.map(rec => ({
            title: rec.title,
            description: rec.description,
            impact: rec.impact,
            actionItems: rec.action_items
          })),
          explanation: apiResponse.node.recommendation.description || "Oto rekomendacje oparte na Twoich odpowiedziach."
        };
      } else {
        // Zwracamy pytanie i opcje
        return {
          isComplete: false,
          options: apiResponse.node.options.map(opt => opt.label),
          question: apiResponse.node.question,
          explanation: "Wybierz jedną z opcji, aby kontynuować."
        };
      }
    } catch (error) {
      console.error("Błąd podczas przetwarzania kroku decyzyjnego:", error);
      throw new Error("Nie udało się przetworzyć zapytania. Spróbuj ponownie.");
    }
  },
  
  /**
   * Generuje raport na podstawie ścieżki decyzyjnej
   * 
   * @param {Object} data - Dane zapytania
   * @param {string} data.advisorType - Typ doradcy
   * @param {Array} data.decisionPath - Ścieżka decyzyjna (wybory użytkownika)
   * @returns {Promise<Object>} - Wygenerowany raport
   */
  async generateReport(data) {
    try {
      // Wywołujemy endpoint API do generowania raportu
      const response = await axios.post(`${API_URL}/decision-tree/report`, {
        user_id: localStorage.getItem('userId') || 1,
        advisor_type: data.advisorType,
        decision_path: data.decisionPath
      });
      
      return {
        summary: response.data.summary || "Podsumowanie analizy",
        analysis: response.data.analysis || "Szczegółowa analiza na podstawie Twoich odpowiedzi",
        recommendations: response.data.recommendations || [
          "Pierwsza rekomendacja",
          "Druga rekomendacja",
          "Trzecia rekomendacja"
        ]
      };
    } catch (error) {
      console.error("Błąd podczas generowania raportu:", error);
      
      // Zwracamy podstawowy raport w przypadku błędu
      return {
        summary: "Nie udało się wygenerować szczegółowego raportu",
        analysis: "Z powodu problemów technicznych, przedstawiamy podstawową analizę. " +
                 "Zalecamy kontakt z doradcą, aby uzyskać pełny raport.",
        recommendations: [
          "Rozważ konsultację z doradcą specjalizującym się w tym obszarze",
          "Przygotuj listę konkretnych pytań przed spotkaniem z doradcą",
          "Zbierz wszystkie istotne dokumenty związane z Twoją sytuacją"
        ]
      };
    }
  },
  
  /**
   * Resetuje drzewo decyzyjne dla użytkownika
   * 
   * @returns {Promise<Object>} - Odpowiedź z API
   */
  async resetDecisionTree() {
    try {
      const userId = localStorage.getItem('userId') || 1;
      const response = await axios.post(`${API_URL}/decision-tree/reset`, {
        user_id: userId
      });
      
      return response.data;
    } catch (error) {
      console.error("Błąd podczas resetowania drzewa decyzyjnego:", error);
      throw new Error("Nie udało się zresetować drzewa decyzyjnego");
    }
  },
  
  /**
   * Pobiera zapisane rekomendacje dla użytkownika
   * 
   * @returns {Promise<Array>} - Lista rekomendacji
   */
  async getUserRecommendations() {
    try {
      const userId = localStorage.getItem('userId') || 1;
      const response = await axios.get(`${API_URL}/decision-tree/recommendations/${userId}`);
      
      return response.data.recommendations || [];
    } catch (error) {
      console.error("Błąd podczas pobierania rekomendacji:", error);
      return [];
    }
  }
};

export default decisionTreeService;