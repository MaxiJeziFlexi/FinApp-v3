// utils/decisionTreeService.js
// Service for handling decision tree logic and flow

class DecisionTreeService {
  constructor() {
    this.decisionTrees = {
      budget_planner: [
        {
          step: 0,
          question: "Jaki jest Twój priorytet w budowaniu funduszu awaryjnego?",
          description: "Wybierz strategię, która najlepiej pasuje do Twojej sytuacji finansowej.",
          options: [
            {
              id: "three_months",
              value: "three",
              title: "3 miesiące wydatków",
              description: "Podstawowy fundusz awaryjny na najważniejsze sytuacje",
              icon: "🛡️",
              recommended: "Dla osób z stabilnym dochodem"
            },
            {
              id: "six_months",
              value: "six",
              title: "6 miesięcy wydatków",
              description: "Średni fundusz awaryjny zapewniający większe bezpieczeństwo",
              icon: "🏦",
              recommended: "Dla większości osób"
            },
            {
              id: "twelve_months",
              value: "twelve",
              title: "12 miesięcy wydatków",
              description: "Rozszerzony fundusz na przypadek długotrwałych problemów",
              icon: "💎",
              recommended: "Dla osób z niestabilnym dochodem"
            }
          ]
        },
        {
          step: 1,
          question: "Jak chcesz oszczędzać na fundusz awaryjny?",
          description: "Wybierz metodę oszczędzania, która będzie dla Ciebie najlepsza.",
          options: [
            {
              id: "automatic_transfer",
              value: "automatic",
              title: "Automatyczne przelewy",
              description: "Ustaw stały przelew na konto oszczędnościowe",
              icon: "🔄",
              recommended: "Najskuteczniejsza metoda"
            },
            {
              id: "percentage_based",
              value: "percentage",
              title: "Procent od dochodu",
              description: "Odkładaj stały procent każdego dochodu",
              icon: "📊",
              recommended: "Dla zmiennych dochodów"
            },
            {
              id: "manual_savings",
              value: "manual",
              title: "Manualne oszczędzanie",
              description: "Sam decydujesz kiedy i ile oszczędzać",
              icon: "✋",
              recommended: "Wymaga dyscypliny"
            }
          ]
        },
        {
          step: 2,
          question: "Gdzie chcesz trzymać swój fundusz awaryjny?",
          description: "Wybierz najlepsze miejsce przechowywania Twoich oszczędności.",
          options: [
            {
              id: "savings_account",
              value: "savings",
              title: "Konto oszczędnościowe",
              description: "Bezpieczne, z oprocentowaniem, łatwy dostęp",
              icon: "🏦",
              recommended: "Najlepszy wybór"
            },
            {
              id: "money_market",
              value: "market",
              title: "Fundusz rynku pieniężnego",
              description: "Wyższe oprocentowanie, nieco mniejsza płynność",
              icon: "📈",
              recommended: "Dla większych kwot"
            },
            {
              id: "mixed_approach",
              value: "mixed",
              title: "Podejście mieszane",
              description: "Część na koncie, część w funduszach",
              icon: "⚖️",
              recommended: "Dla zaawansowanych"
            }
          ]
        }
      ],
      savings_strategist: [
        {
          step: 0,
          question: "Jaki jest Twój horyzont czasowy dla zakupu nieruchomości?",
          description: "Określ kiedy planujesz zakup, aby dobrać odpowiednią strategię.",
          options: [
            {
              id: "short_term",
              value: "short",
              title: "1-2 lata",
              description: "Krótkoterminowy plan zakupu",
              icon: "⚡",
              recommended: "Konserwatywna strategia"
            },
            {
              id: "medium_term",
              value: "medium",
              title: "3-5 lat",
              description: "Średnioterminowy plan inwestycyjny",
              icon: "🎯",
              recommended: "Najbardziej popularne"
            },
            {
              id: "long_term",
              value: "long",
              title: "5+ lat",
              description: "Długoterminowa strategia budowania kapitału",
              icon: "🌱",
              recommended: "Maksymalizacja zysków"
            }
          ]
        },
        {
          step: 1,
          question: "Jaka jest Twoja tolerancja ryzyka inwestycyjnego?",
          description: "Określ jak bardzo ryzykowne inwestycje możesz zaakceptować.",
          options: [
            {
              id: "low_risk",
              value: "conservative",
              title: "Niska - lokaty i obligacje",
              description: "Bezpieczne instrumenty z gwarantowanym zyskiem",
              icon: "🛡️",
              recommended: "Dla krótkich terminów"
            },
            {
              id: "medium_risk",
              value: "moderate",
              title: "Średnia - fundusze mieszane",
              description: "Połączenie bezpieczeństwa i wzrostu",
              icon: "⚖️",
              recommended: "Optymalne rozwiązanie"
            },
            {
              id: "high_risk",
              value: "aggressive",
              title: "Wysoka - akcje i ETF",
              description: "Maksymalizacja potencjalnego zysku",
              icon: "🚀",
              recommended: "Dla długich terminów"
            }
          ]
        },
        {
          step: 2,
          question: "Jaką kwotę możesz miesięcznie przeznaczyć na oszczędności?",
          description: "Ustal realną kwotę, którą będziesz w stanie systematycznie odkładać.",
          options: [
            {
              id: "small_amount",
              value: "small",
              title: "500-1000 zł",
              description: "Początkujący oszczędzający",
              icon: "🌱",
              recommended: "Dobry start"
            },
            {
              id: "medium_amount",
              value: "medium",
              title: "1000-3000 zł",
              description: "Średnie możliwości oszczędnościowe",
              icon: "💪",
              recommended: "Solidna podstawa"
            },
            {
              id: "large_amount",
              value: "large",
              title: "3000+ zł",
              description: "Wysokie możliwości oszczędnościowe",
              icon: "💎",
              recommended: "Szybki cel"
            }
          ]
        }
      ],
      execution_expert: [
        {
          step: 0,
          question: "Jaka jest Twoja strategia spłaty długów?",
          description: "Wybierz metodę, która będzie psychologicznie i finansowo najlepsza dla Ciebie.",
          options: [
            {
              id: "debt_avalanche",
              value: "avalanche",
              title: "Metoda lawiny",
              description: "Spłacaj najpierw długi o najwyższym oprocentowaniu",
              icon: "🏔️",
              recommended: "Matematycznie optymalna"
            },
            {
              id: "debt_snowball",
              value: "snowball",
              title: "Metoda kuli śnieżnej",
              description: "Spłacaj najpierw najmniejsze długi",
              icon: "⚪",
              recommended: "Psychologicznie motywująca"
            },
            {
              id: "debt_consolidation",
              value: "consolidation",
              title: "Konsolidacja długów",
              description: "Połącz wszystkie długi w jeden kredyt",
              icon: "🔗",
              recommended: "Dla wielu zadłużeń"
            }
          ]
        },
        {
          step: 1,
          question: "Jak dużo możesz przeznaczyć miesięcznie na spłatę długów?",
          description: "Określ realną kwotę ponad minimalne raty.",
          options: [
            {
              id: "minimal_extra",
              value: "minimal",
              title: "200-500 zł dodatkowo",
              description: "Minimalna nadpłata",
              icon: "🐌",
              recommended: "Stabilne tempo"
            },
            {
              id: "moderate_extra",
              value: "moderate",
              title: "500-1500 zł dodatkowo",
              description: "Umiarkowana nadpłata",
              icon: "🚶",
              recommended: "Dobry balans"
            },
            {
              id: "aggressive_extra",
              value: "aggressive",
              title: "1500+ zł dodatkowo",
              description: "Agresywna spłata",
              icon: "🏃",
              recommended: "Szybkie wyjście z długów"
            }
          ]
        },
        {
          step: 2,
          question: "Czy masz możliwość zwiększenia dochodów?",
          description: "Dodatkowe źródła dochodu mogą znacznie przyspieszyć spłatę.",
          options: [
            {
              id: "no_extra_income",
              value: "current",
              title: "Tylko obecny dochód",
              description: "Skupię się na optymalizacji wydatków",
              icon: "💼",
              recommended: "Plan cięć kosztów"
            },
            {
              id: "side_hustle",
              value: "side",
              title: "Dodatkowa praca/zlecenia",
              description: "Mogę podjąć dodatkową działalność",
              icon: "💪",
              recommended: "Dodatkowe źródło"
            },
            {
              id: "asset_sale",
              value: "assets",
              title: "Sprzedaż niepotrzebnych rzeczy",
              description: "Mogę sprzedać część majątku",
              icon: "🏷️",
              recommended: "Jednorazowy zastrzyk"
            }
          ]
        }
      ],
      optimization_advisor: [
        {
          step: 0,
          question: "W jakim wieku planujesz przejść na emeryturę?",
          description: "Określ docelowy wiek emerytalny, aby zaplanować strategię.",
          options: [
            {
              id: "early_retirement",
              value: "early",
              title: "Przed 60. rokiem życia",
              description: "Wczesna emerytura wymaga agresywnych oszczędności",
              icon: "🌅",
              recommended: "Wysokie wymagania"
            },
            {
              id: "standard_retirement",
              value: "standard",
              title: "60-67 lat",
              description: "Standardowy wiek emerytalny",
              icon: "⏰",
              recommended: "Typowy plan"
            },
            {
              id: "late_retirement",
              value: "late",
              title: "Po 67. roku życia",
              description: "Dłuższa praca, mniejsze wymagania oszczędnościowe",
              icon: "🌇",
              recommended: "Mniejsze ryzyko"
            }
          ]
        },
        {
          step: 1,
          question: "Jaką część obecnego dochodu chcesz zachować na emeryturze?",
          description: "Określ docelowy poziom życia na emeryturze.",
          options: [
            {
              id: "basic_needs",
              value: "basic",
              title: "50-60% obecnego dochodu",
              description: "Podstawowe potrzeby życiowe",
              icon: "🏠",
              recommended: "Minimalne wymagania"
            },
            {
              id: "comfortable_life",
              value: "comfortable",
              title: "70-80% obecnego dochodu",
              description: "Komfortowe życie na emeryturze",
              icon: "🌞",
              recommended: "Optymalny cel"
            },
            {
              id: "luxury_life",
              value: "luxury",
              title: "90-100% obecnego dochodu",
              description: "Utrzymanie pełnego standardu życia",
              icon: "💎",
              recommended: "Wysokie ambicje"
            }
          ]
        },
        {
          step: 2,
          question: "Jakie instrumenty emerytalne preferujesz?",
          description: "Wybierz najlepsze narzędzia do budowania kapitału emerytalnego.",
          options: [
            {
              id: "conservative_approach",
              value: "conservative",
              title: "IKE + obligacje",
              description: "Bezpieczne, gwarantowane instrumenty",
              icon: "🛡️",
              recommended: "Dla unikających ryzyka"
            },
            {
              id: "balanced_approach",
              value: "balanced",
              title: "IKZE + fundusze mieszane",
              description: "Połączenie bezpieczeństwa i wzrostu",
              icon: "⚖️",
              recommended: "Optymalny wybór"
            },
            {
              id: "growth_approach",
              value: "growth",
              title: "PPK + ETF akcyjne",
              description: "Maksymalizacja długoterminowego wzrostu",
              icon: "📈",
              recommended: "Dla młodszych osób"
            }
          ]
        }
      ]
    };
  }

  async processDecisionStep(advisorId, step, decisionPath) {
    try {
      // Get decision tree for advisor
      const tree = this.decisionTrees[advisorId];
      if (!tree || !tree[step]) {
        return null;
      }

      // Return current step options
      return tree[step].options;
    } catch (error) {
      console.error('Error processing decision step:', error);
      throw error;
    }
  }

  async generateReport(advisorId, decisionPath, userProfile) {
    try {
      const recommendations = this.generateRecommendations(advisorId, decisionPath, userProfile);
      const actionPlan = this.generateActionPlan(advisorId, decisionPath, userProfile);
      const timeline = this.generateTimeline(advisorId, decisionPath, userProfile);

      return {
        id: `report_${Date.now()}`,
        advisorId,
        userId: userProfile?.id,
        generatedAt: new Date().toISOString(),
        recommendations,
        actionPlan,
        timeline,
        decisionPath,
        summary: this.generateSummary(advisorId, decisionPath, userProfile)
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  generateRecommendations(advisorId, decisionPath, userProfile) {
    const baseRecommendations = {
      budget_planner: [
        {
          title: "Fundusz awaryjny",
          description: "Zbuduj fundusz na nieprzewidziane wydatki",
          priority: "high",
          timeframe: "3-6 miesięcy",
          action: "Ustaw automatyczny przelew na konto oszczędnościowe"
        },
        {
          title: "Budżet 50/30/20",
          description: "50% na potrzeby, 30% na chęci, 20% na oszczędności",
          priority: "medium",
          timeframe: "1 miesiąc",
          action: "Przeanalizuj swoje wydatki i dopasuj do tej reguły"
        }
      ],
      savings_strategist: [
        {
          title: "Plan oszczędnościowy",
          description: "Systematyczne odkładanie na cel długoterminowy",
          priority: "high",
          timeframe: "Cały okres",
          action: "Ustaw automatyczne przelewy zgodnie z planem"
        },
        {
          title: "Dywersyfikacja inwestycji",
          description: "Rozłóż ryzyko na różne instrumenty finansowe",
          priority: "medium",
          timeframe: "6 miesięcy",
          action: "Otwórz konta inwestycyjne i rozdziel środki"
        }
      ],
      execution_expert: [
        {
          title: "Strategia spłaty długów",
          description: "Systematyczna redukcja zadłużenia",
          priority: "high",
          timeframe: "2-5 lat",
          action: "Rozpocznij od wybranej metody spłaty"
        },
        {
          title: "Konsolidacja długów",
          description: "Połącz długi w jeden o niższym oprocentowaniu",
          priority: "medium",
          timeframe: "1-3 miesiące",
          action: "Porównaj oferty banków na konsolidację"
        }
      ],
      optimization_advisor: [
        {
          title: "IKE/IKZE",
          description: "Wykorzystaj ulgi podatkowe na emeryturę",
          priority: "high",
          timeframe: "Natychmiast",
          action: "Otwórz konta emerytalne i maksymalizuj składki"
        },
        {
          title: "PPK",
          description: "Skorzystaj z programu pracowniczych planów kapitałowych",
          priority: "medium",
          timeframe: "1 miesiąc",
          action: "Sprawdź czy Twój pracodawca oferuje PPK"
        }
      ]
    };

    return baseRecommendations[advisorId] || [];
  }

  generateActionPlan(advisorId, decisionPath, userProfile) {
    const plans = {
      budget_planner: [
        "Przeanalizuj swoje miesięczne wydatki",
        "Ustaw cel funduszu awaryjnego",
        "Otwórz konto oszczędnościowe",
        "Ustaw automatyczny przelew",
        "Monitoruj postępy co miesiąc"
      ],
      savings_strategist: [
        "Określ dokładny cel finansowy",
        "Wybierz instrumenty inwestycyjne",
        "Ustaw automatyczne oszczędzanie",
        "Regularnie sprawdzaj portfel",
        "Dostosowuj strategię do sytuacji"
      ],
      execution_expert: [
        "Spisz wszystkie długi",
        "Wybierz strategię spłaty",
        "Negocjuj warunki z wierzycielami",
        "Rozpocznij systematyczne nadpłaty",
        "Śledź postęp w redukcji zadłużenia"
      ],
      optimization_advisor: [
        "Oblicz potrzeby emerytalne",
        "Otwórz konta emerytalne",
        "Ustaw automatyczne składki",
        "Dywersyfikuj inwestycje",
        "Regularnie przeglądaj portfel"
      ]
    };

    return plans[advisorId] || [];
  }

  generateTimeline(advisorId, decisionPath, userProfile) {
    const timelines = {
      budget_planner: [
        { period: "Tydzień 1", task: "Analiza wydatków" },
        { period: "Tydzień 2", task: "Otwarcie konta oszczędnościowego" },
        { period: "Miesiąc 1", task: "Pierwszy przelew na fundusz" },
        { period: "Miesiąc 3", task: "Ocena postępów" },
        { period: "Miesiąc 6", task: "Osiągnięcie celu funduszu" }
      ],
      savings_strategist: [
        { period: "Tydzień 1", task: "Określenie celu i strategii" },
        { period: "Miesiąc 1", task: "Otwarcie kont inwestycyjnych" },
        { period: "Miesiąc 2", task: "Pierwsze inwestycje" },
        { period: "Kwartalnie", task: "Przegląd portfela" },
        { period: "Rocznie", task: "Rebalancing portfela" }
      ],
      execution_expert: [
        { period: "Tydzień 1", task: "Inwentaryzacja długów" },
        { period: "Tydzień 2", task: "Wybór strategii spłaty" },
        { period: "Miesiąc 1", task: "Początek nadpłat" },
        { period: "Kwartalnie", task: "Ocena postępów" },
        { period: "Rocznie", task: "Optymalizacja strategii" }
      ],
      optimization_advisor: [
        { period: "Tydzień 1", task: "Kalkulacja potrzeb emerytalnych" },
        { period: "Miesiąc 1", task: "Otwarcie IKE/IKZE" },
        { period: "Miesiąc 2", task: "Pierwsze składki" },
        { period: "Rocznie", task: "Maksymalizacja składek" },
        { period: "Co 5 lat", task: "Przegląd strategii emerytalnej" }
      ]
    };

    return timelines[advisorId] || [];
  }

  generateSummary(advisorId, decisionPath, userProfile) {
    const summaries = {
      budget_planner: "Plan budżetowy skoncentrowany na budowie funduszu awaryjnego i efektywnym zarządzaniu finansami osobistymi.",
      savings_strategist: "Strategia oszczędnościowa dostosowana do długoterminowych celów finansowych z uwzględnieniem tolerancji ryzyka.",
      execution_expert: "Plan systematycznej redukcji zadłużenia z wykorzystaniem optymalnej strategii spłaty.",
      optimization_advisor: "Kompleksowa strategia emerytalna maksymalizująca korzyści podatkowe i długoterminowy wzrost kapitału."
    };

    return summaries[advisorId] || "Spersonalizowany plan finansowy dostosowany do Twoich potrzeb.";
  }

  // Method to get question for current step
  getQuestion(advisorId, step) {
    const tree = this.decisionTrees[advisorId];
    if (!tree || !tree[step]) {
      return null;
    }
    return {
      question: tree[step].question,
      description: tree[step].description
    };
  }

  // Method to validate decision path
  validateDecisionPath(advisorId, decisionPath) {
    const tree = this.decisionTrees[advisorId];
    if (!tree) return false;

    for (let i = 0; i < decisionPath.length; i++) {
      const decision = decisionPath[i];
      const step = tree[decision.step];
      
      if (!step) return false;
      
      const validOption = step.options.find(opt => opt.id === decision.selection);
      if (!validOption) return false;
    }

    return true;
  }

  // Method to get progress percentage
  getProgressPercentage(advisorId, currentStep) {
    const tree = this.decisionTrees[advisorId];
    if (!tree) return 0;
    
    return Math.round((currentStep / tree.length) * 100);
  }

  // Method to check if decision tree is complete
  isDecisionTreeComplete(advisorId, decisionPath) {
    const tree = this.decisionTrees[advisorId];
    if (!tree) return false;
    
    return decisionPath.length >= tree.length;
  }
}

export default new DecisionTreeService();