// Constants for AI Chat Section

// Advisor definitions
export const ADVISORS = [
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

// Achievement definitions
export const ACHIEVEMENTS = [
  { id: 'first_goal', title: 'Pierwszy krok', description: 'Ustawiłeś cel', icon: '🚀' },
  { id: 'savings_1000', title: 'Oszczędzający', description: 'Zaoszczędziłeś 1000 zł', icon: '💰' },
  { id: 'budget_3_months', title: 'Mistrz budżetu', description: '3 miesiące budżetu', icon: '📊' },
  { id: 'emergency_fund', title: 'Fundusz', description: 'Utworzyłeś fundusz awaryjny', icon: '���️' }
];

// Color palette
export const COLOR_PALETTES = {
  main: {
    primary: '#0F3057',
    secondary: '#00A896',
    success: '#4CAF50',
    lightText: '#666',
    text: '#111',
    background: '#f7f9fc',
    lightBackground: '#ffffff'
  }
};

// Form options
export const INCOME_OPTIONS = [
  { value: 'below_2000', label: 'Poniżej 2000 zł' },
  { value: '2000_4000', label: '2000 - 4000 zł' },
  { value: '4000_6000', label: '4000 - 6000 zł' },
  { value: '6000_8000', label: '6000 - 8000 zł' },
  { value: 'above_8000', label: 'Powyżej 8000 zł' }
];

export const SAVINGS_OPTIONS = [
  { value: '0_1000', label: '0 - 1000 zł' },
  { value: '1000_5000', label: '1000 - 5000 zł' },
  { value: '5000_10000', label: '5000 - 10 000 zł' },
  { value: '10000_20000', label: '10 000 - 20 000 zł' },
  { value: 'above_20000', label: 'Powyżej 20 000 zł' }
];

// Helper functions
export const getGoalName = (goalType) => {
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

export const getFirstStepForGoal = (goalType) => {
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

export const getSecondStepForGoal = (goalType) => {
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

export const getThirdStepForGoal = (goalType) => {
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
export const mapGoalToName = (goal) => {
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