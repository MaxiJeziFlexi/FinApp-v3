/**
 * Localization utility for multi-language support
 */

const translations = {
  pl: {
    'error.try_again': 'Wystąpił błąd, spróbuj ponownie',
    'error.report_fallback_summary': 'Wystąpił błąd podczas generowania raportu. Oto ogólne rekomendacje finansowe.',
    'error.report_fallback_step1': 'Stwórz budżet miesięczny i monitoruj wydatki',
    'error.report_fallback_step2': 'Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków',
    'error.report_fallback_step3': 'Spłać zadłużenia o wysokim oprocentowaniu',
    'error.report_fallback_step4': 'Regularnie odkładaj na długoterminowe cele',
    'fallback.restart': 'Rozpocznij od nowa',
    'fallback.continue': 'Kontynuuj mimo to',
    'fallback.error_occurred': 'Wystąpił problem. Co chcesz zrobić?'
  },
  en: {
    'error.try_again': 'An error occurred, please try again',
    'error.report_fallback_summary': 'An error occurred while generating the report. Here are general financial recommendations.',
    'error.report_fallback_step1': 'Create a monthly budget and monitor expenses',
    'error.report_fallback_step2': 'Build an emergency fund covering 3-6 months of expenses',
    'error.report_fallback_step3': 'Pay off high-interest debt',
    'error.report_fallback_step4': 'Regularly save for long-term goals',
    'fallback.restart': 'Start over',
    'fallback.continue': 'Continue anyway',
    'fallback.error_occurred': 'A problem occurred. What would you like to do?'
  }
};

/**
 * Get localized text for a given key
 * @param {string} key - Translation key
 * @param {string} locale - Locale (default: 'pl')
 * @returns {string} - Localized text or key if not found
 */
export const getLocalizedText = (key, locale = 'pl') => {
  const localeTranslations = translations[locale] || translations['pl'];
  return localeTranslations[key] || key;
};

export default { getLocalizedText };