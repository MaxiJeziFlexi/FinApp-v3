import { createContext } from 'react';

// Default context values can be adjusted as needed
export const ThemeContext = createContext({
  theme: 'light', // Default theme is set to light.
  toggleTheme: () => {}, // Placeholder function for toggling the theme.
});