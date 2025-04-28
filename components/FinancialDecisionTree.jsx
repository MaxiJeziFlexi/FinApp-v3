import React, { useState, useEffect } from 'react';
import { TbBrain, TbArrowRight, TbCheck, TbX, TbExclamationCircle, TbArrowLeft } from 'react-icons/tb';
import decisionTreeService from '../utils/decisionTreeService';

/**
 * Komponent drzewa decyzyjnego dla porad finansowych
 * 
 * @param {Object} props
 * @param {Object} props.userProfile - Profil użytkownika
 * @param {Object} props.advisorInsights - Analiza profilu użytkownika
 * @param {Function} props.onRecommendationSelect - Funkcja wywoływana przy wyborze rekomendacji
 * @param {Function} props.onAnalysisComplete - Funkcja wywoływana po zakończeniu analizy
 */
const FinancialDecisionTree = ({ 
  userProfile, 
  advisorInsights, 
  onRecommendationSelect,
  onAnalysisComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [analysisPath, setAnalysisPath] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [advisorType, setAdvisorType] = useState("financial");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    // Rozpocznij drzewo decyzyjne przy pierwszym renderowaniu
    startAnalysis();
  }, []);

  /**
   * Rozpoczyna analizę drzewa decyzyjnego
   */
  const startAnalysis = async (type = "financial") => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setAnalysisPath([]);
    setRecommendations([]);
    setAdvisorType(type);

    try {
      // Pobierz pierwsze pytanie i opcje z serwisu drzewa decyzyjnego
      const response = await decisionTreeService.processDecisionStep({
        advisorType: type,
        step: 0,
        previousChoices: [],
        question: ""
      });

      setCurrentQuestion(response.question || "Jak mogę Ci pomóc z Twoimi finansami?");
      setOptions(response.options || [
        "Chcę lepiej zarządzać budżetem",
        "Szukam sposobów na zwiększenie oszczędności",
        "Potrzebuję pomocy z planowaniem finansowym"
      ]);
      setExplanation(response.explanation || "Wybierz jedną z opcji, aby rozpocząć analizę.");
      setProgress(0.25);
    } catch (error) {
      console.error("Błąd rozpoczęcia analizy:", error);
      setError("Nie udało się rozpocząć analizy. Spróbuj ponownie za chwilę.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obsługuje wybór opcji przez użytkownika
   * 
   * @param {string} option - Wybrana opcja
   * @param {number} index - Indeks wybranej opcji
   */
  const handleOptionSelect = async (option, index) => {
    setSelectedOption(index);
    
    // Aktualizuj ścieżkę analizy
    const newPath = [...analysisPath, option];
    setAnalysisPath(newPath);
    
    setIsLoading(true);
    setError(null);

    try {
      // Pobierz następne pytanie lub rekomendacje
      const response = await decisionTreeService.processDecisionStep({
        advisorType: advisorType,
        step: analysisPath.length + 1,
        previousChoices: newPath,
        question: option
      });

      // Sprawdź, czy analiza jest zakończona
      if (response.isComplete) {
        // Ustaw rekomendacje
        setRecommendations(response.recommendations || []);
        setExplanation(response.explanation || "Oto rekomendacje na podstawie Twoich odpowiedzi.");
        
        // Powiadom rodzica o zakończeniu analizy
        if (onAnalysisComplete) {
          onAnalysisComplete(response.recommendations || []);
        }
        
        setProgress(1.0);
      } else {
        // Ustaw następne pytanie i opcje
        setCurrentQuestion(response.question || "Co jest dla Ciebie najważniejsze?");
        setOptions(response.options || []);
        setExplanation(response.explanation || "Wybierz jedną z opcji, aby kontynuować analizę.");
        
        // Zwiększ postęp analizy
        setProgress(Math.min(0.25 + (newPath.length * 0.25), 0.9));
        
        // Resetuj wybór opcji
        setSelectedOption(null);
      }
    } catch (error) {
      console.error("Błąd przetwarzania wyboru:", error);
      setError("Wystąpił problem z przetwarzaniem Twojego wyboru. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obsługuje wybór rekomendacji przez użytkownika
   * 
   * @param {Object} recommendation - Wybrana rekomendacja
   */
  const handleRecommendationSelect = (recommendation) => {
    if (onRecommendationSelect) {
      onRecommendationSelect(recommendation);
    }
  };

  /**
   * Restartuje analizę drzewa decyzyjnego
   */
  const restartAnalysis = () => {
    startAnalysis(advisorType);
  };

  /**
   * Renderuje opcje dla drzewa decyzyjnego
   * 
   * @returns {JSX.Element} Element React z opcjami
   */
  const renderOptions = () => {
    if (recommendations.length > 0) {
      return (
        <div className="space-y-3 mt-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Rekomendacje:</h3>
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md bg-white dark:bg-gray-700`}
              onClick={() => handleRecommendationSelect(rec)}
            >
              <div className="flex justify-between">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{rec.title}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    rec.impact === "high"
                      ? "bg-green-100 text-green-700"
                      : rec.impact === "medium"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {rec.impact === "high" ? "Wysoki wpływ" : rec.impact === "medium" ? "Średni wpływ" : "Niski wpływ"}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rec.description}</p>
            </div>
          ))}
          <button
            onClick={restartAnalysis}
            className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <TbArrowLeft className="mr-1" /> Rozpocznij nową analizę
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(option, index)}
            disabled={isLoading}
            className={`w-full p-3 text-left border rounded-lg transition-all ${
              selectedOption === index
                ? "bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:border-indigo-700"
                : "bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600 mr-3">
                {index + 1}
              </div>
              <span>{option}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="financial-decision-tree">
      {/* Pasek postępu */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>

      {/* Nagłówek */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{currentQuestion}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{explanation}</p>
      </div>

      {/* Wyświetlanie błędu */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
          <TbExclamationCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Wyświetlanie opcji lub rekomendacji */}
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <TbBrain size={32} className="text-indigo-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Analizuję odpowiedź...</p>
          </div>
        </div>
      ) : (
        renderOptions()
      )}

      {/* Ścieżka analizy */}
      {analysisPath.length > 0 && recommendations.length === 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Twoja ścieżka analizy:</p>
          <div className="flex flex-wrap gap-2">
            {analysisPath.map((step, index) => (
              <div
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-800 py-1 px-2 rounded-full text-gray-600 dark:text-gray-300 flex items-center"
              >
                <span className="mr-1">{index + 1}.</span>
                <span className="truncate max-w-[150px]">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDecisionTree;