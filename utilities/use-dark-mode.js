import { useEffect, useState } from 'react';

const UseDarkMode = () => {
  // Initialize theme based on localStorage or default to "dark"
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove the current theme class and add the new one
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);

    // Save the current theme in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Return the opposite of the current theme for toggling
  const colorTheme = theme === "dark" ? "light" : "dark";

  return [colorTheme, setTheme];
};

export default UseDarkMode;
