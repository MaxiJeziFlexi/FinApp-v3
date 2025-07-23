/**
 * Localization Service - utils/localization.js
 * 
 * This module provides comprehensive localization capabilities:
 * - Multi-language support with Polish as primary locale
 * - Dynamic loading of language resources
 * - Interpolation and pluralization
 * - Date, number, and currency formatting
 * - Financial term translations
 * - Fallback chains for missing translations
 */

import { format as formatDate, formatDistance, formatRelative } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

// Default locale
let currentLocale = 'pl';

// Date-fns locale mapping
const DATE_LOCALES = {
  'pl': pl,
  'en': enUS
};

// Loaded translation resources
let translations = {
  pl: {}, // Polish translations
  en: {}  // English translations (fallback)
};

// Load initial translations for Polish
translations.pl = {
  // General UI elements
  'ui.loading': 'Ładowanie...',
  'ui.error': 'Błąd',
  'ui.success': 'Sukces',
  'ui.warning': 'Ostrzeżenie',
  'ui.cancel': 'Anuluj',
  'ui.save': 'Zapisz',
  'ui.confirm': 'Potwierdź',
  'ui.back': 'Wróć',
  'ui.next': 'Dalej',
  'ui.close': 'Zamknij',
  
  // Chat interface
  'chat.placeholder': 'Napisz wiadomość...',
  'chat.send': 'Wyślij',
  'chat.thinking': 'Doradca pisze...',
  'chat.welcome': 'Witaj! Jak mogę Ci pomóc?',
  'chat.error': 'Przepraszam, wystąpił problem. Spróbuj ponownie.',
  'chat.reconnecting': 'Próba ponownego połączenia...',
  
  // Financial goals
  'goal.emergency_fund': 'Fundusz awaryjny',
  'goal.debt_reduction': 'Redukcja zadłużenia',
  'goal.home_purchase': 'Zakup nieruchomości',
  'goal.retirement': 'Zabezpieczenie emerytalne',
  'goal.education': 'Finansowanie edukacji',
  'goal.vacation': 'Wakacje i podróże',
  
  // Financial terms
  'finance.interest_rate': 'Stopa procentowa',
  'finance.principal': 'Kapitał',
  'finance.installment': 'Rata',
  'finance.loan': 'Kredyt',
  'finance.deposit': 'Depozyt',
  'finance.investment': 'Inwestycja',
  'finance.return': 'Zwrot',
  'finance.risk': 'Ryzyko',
  'finance.liquidity': 'Płynność',
  'finance.term': 'Termin',
  'finance.maturity': 'Zapadalność',
  'finance.yield': 'Rentowność',
  'finance.amortization': 'Amortyzacja',
  'finance.inflation': 'Inflacja',
  'finance.tax': 'Podatek',
  'finance.fee': 'Opłata',
  'finance.commission': 'Prowizja',
  
  // Error messages
  'error.general': 'Wystąpił błąd. Prosimy spróbować ponownie.',
  'error.connection': 'Problem z połączeniem. Sprawdź swoje połączenie internetowe.',
  'error.timeout': 'Upłynął limit czasu połączenia.',
  'error.not_found': 'Nie znaleziono zasobu.',
  'error.validation': 'Błąd walidacji formularza.',
  'error.authentication': 'Błąd uwierzytelniania.',
  'error.authorization': 'Nie masz uprawnień do tej operacji.',
  'error.server': 'Błąd serwera. Prosimy spróbować później.',
  'error.try_again': 'Wystąpił błąd, spróbuj ponownie',
  'error.invalid_advisor': 'Nieprawidłowy doradca',
  'error.invalid_step': 'Nieprawidłowy krok',
  'error.invalid_path': 'Nieprawidłowa ścieżka decyzyjna',
  'error.unknown_error': 'Nieznany błąd',
  
  // Fallback messages
  'fallback.error_occurred': 'Wystąpił problem. Co chcesz zrobić?',
  'fallback.restart': 'Rozpocznij od nowa',
  'fallback.continue': 'Kontynuuj mimo to',
  'fallback.return_to_start': 'Wróć do początku',
  
  // Recommendation report
  'report.summary': 'Podsumowanie',
  'report.next_steps': 'Następne kroki',
  'report.timeline': 'Harmonogram',
  'report.risk_assessment': 'Ocena ryzyka',
  'report.generated_on': 'Wygenerowano dnia',
  'report.disclaimer': 'To podsumowanie ma charakter informacyjny i nie stanowi porady inwestycyjnej.',
  'report.confidence': 'Pewność rekomendacji',
  
  // Financial metrics
  'metrics.low': 'Niski',
  'metrics.medium': 'Średni',
  'metrics.high': 'Wysoki',
  'metrics.very_high': 'Bardzo wysoki',
  
  // Time periods
  'time.days': 'dni',
  'time.weeks': 'tygodni',
  'time.months': 'miesięcy',
  'time.years': 'lat',
  'time.short_term': 'krótki okres',
  'time.medium_term': 'średni okres',
  'time.long_term': 'długi okres',
  
  // GDPR compliance
  'gdpr.consent': 'Zgoda na przetwarzanie danych',
  'gdpr.data_processing': 'Przetwarzanie danych osobowych',
  'gdpr.data_access': 'Dostęp do danych',
  'gdpr.data_deletion': 'Usunięcie danych',
  'gdpr.privacy_policy': 'Polityka prywatności',
  'gdpr.consent_text': 'Wyrażam zgodę na przetwarzanie moich danych osobowych w celu otrzymania spersonalizowanych porad finansowych.',
  'gdpr.more_info': 'Więcej informacji',
  
  // Report fallback messages
  'error.report_fallback_summary': 'Wystąpił błąd podczas generowania raportu. Oto ogólne rekomendacje finansowe.',
  'error.report_fallback_step1': 'Stwórz budżet miesięczny i monitoruj wydatki.',
  'error.report_fallback_step2': 'Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków.',
  'error.report_fallback_step3': 'Spłać zadłużenia o wysokim oprocentowaniu.',
  'error.report_fallback_step4': 'Regularnie odkładaj na długoterminowe cele.'
};

// Load initial translations for English (fallback)
translations.en = {
  // General UI elements
  'ui.loading': 'Loading...',
  'ui.error': 'Error',
  'ui.success': 'Success',
  'ui.warning': 'Warning',
  'ui.cancel': 'Cancel',
  'ui.save': 'Save',
  'ui.confirm': 'Confirm',
  'ui.back': 'Back',
  'ui.next': 'Next',
  'ui.close': 'Close',
  
  // Chat interface
  'chat.placeholder': 'Type a message...',
  'chat.send': 'Send',
  'chat.thinking': 'Advisor is typing...',
  'chat.welcome': 'Welcome! How can I help you?',
  'chat.error': 'Sorry, something went wrong. Please try again.',
  'chat.reconnecting': 'Trying to reconnect...',
  
  // Financial goals
  'goal.emergency_fund': 'Emergency Fund',
  'goal.debt_reduction': 'Debt Reduction',
  'goal.home_purchase': 'Home Purchase',
  'goal.retirement': 'Retirement',
  'goal.education': 'Education Funding',
  'goal.vacation': 'Vacation & Travel',
  
  // Financial terms
  'finance.interest_rate': 'Interest Rate',
  'finance.principal': 'Principal',
  'finance.installment': 'Installment',
  'finance.loan': 'Loan',
  'finance.deposit': 'Deposit',
  'finance.investment': 'Investment',
  'finance.return': 'Return',
  'finance.risk': 'Risk',
  'finance.liquidity': 'Liquidity',
  'finance.term': 'Term',
  'finance.maturity': 'Maturity',
  'finance.yield': 'Yield',
  'finance.amortization': 'Amortization',
  'finance.inflation': 'Inflation',
  'finance.tax': 'Tax',
  'finance.fee': 'Fee',
  'finance.commission': 'Commission',
  
  // Error messages
  'error.general': 'An error occurred. Please try again.',
  'error.connection': 'Connection problem. Check your internet connection.',
  'error.timeout': 'Connection timeout.',
  'error.not_found': 'Resource not found.',
  'error.validation': 'Form validation error.',
  'error.authentication': 'Authentication error.',
  'error.authorization': 'You don\'t have permission for this operation.',
  'error.server': 'Server error. Please try again later.',
  'error.try_again': 'An error occurred, please try again',
  
  // Fallback messages
  'fallback.error_occurred': 'A problem occurred. What would you like to do?',
  'fallback.restart': 'Start over',
  'fallback.continue': 'Continue anyway',
  'fallback.return_to_start': 'Return to start',
  
  // Recommendation report
  'report.summary': 'Summary',
  'report.next_steps': 'Next Steps',
  'report.timeline': 'Timeline',
  'report.risk_assessment': 'Risk Assessment',
  'report.generated_on': 'Generated on',
  'report.disclaimer': 'This summary is for informational purposes and does not constitute investment advice.',
  'report.confidence': 'Recommendation confidence'
};

/**
 * Sets the current locale for the application
 * 
 * @param {string} locale - Locale code ('pl', 'en')
 */
export const setLocale = (locale) => {
  if (translations[locale]) {
    currentLocale = locale;
  } else {
    console.warn(`Locale ${locale} not available, using ${currentLocale}`);
  }
};

/**
 * Gets the current locale
 * 
 * @returns {string} - Current locale code
 */
export const getLocale = () => currentLocale;

/**
 * Gets a localized text string with optional parameter interpolation
 * 
 * @param {string} key - Translation key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} - Localized text
 */
export const getLocalizedText = (key, params = {}) => {
  // Get translation from current locale or fallback
  let text = translations[currentLocale][key];
  
  // If not found in current locale, try fallback
  if (!text && currentLocale !== 'en') {
    text = translations.en[key];
  }
  
  // If still not found, return the key itself
  if (!text) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  // Replace parameters if any
  if (params && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), value);
    });
  }
  
  return text;
};

/**
 * Formats a number according to the current locale
 * 
 * @param {number} value - Number to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted number
 */
export const formatNumber = (value, options = {}) => {
  const { 
    decimals = 2,
    thousandsSeparator = ' ', // Space is used in Polish formatting
    decimalSeparator = ','    // Comma is used in Polish formatting
  } = options;
  
  try {
    // Base formatting
    const parts = value.toFixed(decimals).split('.');
    
    // Add thousands separator
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    // Join with correct decimal separator
    return parts.join(decimalSeparator);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(value);
  }
};

/**
 * Formats a currency value according to the current locale
 * 
 * @param {number} value - Currency value to format
 * @param {string} currency - Currency code (PLN, EUR, USD)
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted currency
 */
export const formatCurrency = (value, currency = 'PLN', options = {}) => {
  try {
    const formattedNumber = formatNumber(value, options);
    
    // Currency symbol and position depends on locale and currency
    switch (currency) {
      case 'PLN':
        return `${formattedNumber} zł`;
      case 'EUR':
        return `${formattedNumber} €`;
      case 'USD':
        return `${formattedNumber} $`;
      default:
        return `${formattedNumber} ${currency}`;
    }
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${value} ${currency}`;
  }
};

/**
 * Formats a date according to the current locale
 * 
 * @param {Date|string|number} date - Date to format
 * @param {string} formatString - Date format string
 * @param {Object} options - Additional formatting options
 * @returns {string} - Formatted date
 */
export const formatDateString = (date, formatString = 'dd.MM.yyyy', options = {}) => {
  try {
    const dateObject = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    return formatDate(dateObject, formatString, {
      locale: DATE_LOCALES[currentLocale] || DATE_LOCALES.pl,
      ...options
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Formats a relative time (e.g., "5 days ago")
 * 
 * @param {Date|string|number} date - Date to format relatively
 * @param {Date} baseDate - Base date to compare against
 * @returns {string} - Formatted relative time
 */
export const formatRelativeTime = (date, baseDate = new Date()) => {
  try {
    const dateObject = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    return formatDistance(dateObject, baseDate, {
      addSuffix: true,
      locale: DATE_LOCALES[currentLocale] || DATE_LOCALES.pl
    });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return String(date);
  }
};

/**
 * Retrieves localized financial terms
 * 
 * @param {string} termKey - Key for the financial term
 * @returns {string} - Localized financial term
 */
export const getFinancialTerm = (termKey) => {
  return getLocalizedText(`finance.${termKey}`);
};

/**
 * Gets the localized display name for a financial goal
 * 
 * @param {string} goalType - Goal type identifier
 * @returns {string} - Localized goal name
 */
export const getGoalDisplayName = (goalType) => {
  return getLocalizedText(`goal.${goalType}`) || goalType;
};

/**
 * Adds new translations to the system
 * 
 * @param {string} locale - Locale code
 * @param {Object} newTranslations - Translations to add
 */
export const addTranslations = (locale, newTranslations) => {
  if (!translations[locale]) {
    translations[locale] = {};
  }
  
  translations[locale] = {
    ...translations[locale],
    ...newTranslations
  };
};

/**
 * Loads translations from a remote source
 * 
 * @param {string} locale - Locale to load
 * @returns {Promise<boolean>} - Success status
 */
export const loadRemoteTranslations = async (locale) => {
  try {
    const response = await fetch(`/api/localization/${locale}`);
    if (!response.ok) throw new Error('Failed to load translations');
    
    const data = await response.json();
    addTranslations(locale, data);
    return true;
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
    return false;
  }
};

// Export the API for use in the application
export default {
  setLocale,
  getLocale,
  getLocalizedText,
  formatNumber,
  formatCurrency,
  formatDateString,
  formatRelativeTime,
  getFinancialTerm,
  getGoalDisplayName,
  addTranslations,
  loadRemoteTranslations
};