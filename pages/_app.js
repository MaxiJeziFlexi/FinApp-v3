import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout';
import { DataContext } from '../utilities/DataContext';
import '../styles/globals.css';
import '../i18n'; // konfiguracja i18next

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [navIsOpen, setNavIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('dark-mode') === 'true';
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        return false;
      }
    }
    return false;
  });
  const [userData, setUserData] = useState([]);

  // Zapisuj zmianę trybu ciemnego w localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dark-mode', isDarkMode.toString());
      } catch (error) {
        console.error('Error writing dark-mode to localStorage:', error);
      }
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => !prevMode);
  }, []);

  // Sprawdź, czy to strona logowania, rejestracji lub start
  const isAuthPage = router.pathname === '/login' || router.pathname === '/registration' || router.pathname === '/';

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <DataContext.Provider value={{
        navIsOpen,
        setNavIsOpen,
        isDarkMode,
        toggleDarkMode,
        userData,
        setUserData
      }}>
        {isAuthPage ? (
          // Renderuj tylko komponent bez layoutu dla stron autoryzacji
          <Component {...pageProps} />
        ) : (
          // Renderuj komponent z layoutem dla pozostałych stron
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </DataContext.Provider>
    </div>
  );
}

export default MyApp;