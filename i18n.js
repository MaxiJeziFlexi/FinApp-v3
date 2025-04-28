// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pl: {
    translation: {
      welcome: "Witamy w naszej aplikacji",
      searchPlaceholder: "Szukaj transakcji, kont lub narzędzi...",
      search: "Szukaj",
      profile: "Profil",
      settings: "Ustawienia",
      logout: "Wyloguj się"
    },
  },
  en: {
    translation: {
      welcome: "Welcome to our application",
      searchPlaceholder: "Search for transactions, accounts, or tools...",
      search: "Search",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout"
    },
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "pl",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
