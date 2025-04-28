import React from 'react';
import { useEffect, useState } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { RiSunFill } from 'react-icons/ri';

const DarkModeToggler = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentTheme = localStorage.getItem('theme') || 'light';
      setTheme(currentTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  if (typeof window === 'undefined') {
    return null; // Avoid rendering on the server
  }

  return (
    <button onClick={toggleTheme} aria-label="Toggle Dark Mode">
      {theme === 'dark' ? <BsMoonStarsFill /> : <RiSunFill />}
    </button>
  );
};

export default DarkModeToggler;
