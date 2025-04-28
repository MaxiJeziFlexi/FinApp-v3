// utilities/DataContext.js
import { createContext } from 'react';

export const DataContext = createContext({
  userData: null,  // Upewnij się, że to pole istnieje
  setUserData: () => {},
  navIsOpen: false,
  setNavIsOpen: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const DataProvider = ({ children }) => {
  // implementacja providera...
};