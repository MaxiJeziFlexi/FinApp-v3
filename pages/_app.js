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
    return false; // Fallback dla SSR
  });
  const [userData, setUserData] = useState(null); // Zmiana na obiekt zamiast tablicy

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

  // Pobierz dane użytkownika po zalogowaniu (np. po sprawdzeniu userId)
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('userId'); // Zakładam, że userId jest zapisywany po logowaniu
      if (userId && typeof window !== 'undefined') {
        try {
          const response = await fetch(`/api/user-profile/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          } else {
            console.error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [router.pathname]); // Ponowne pobieranie przy zmianie trasy

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prevMode) => !prevMode);
  }, []);

  // Sprawdź, czy to strona logowania, rejestracji lub start
  const isAuthPage = router.pathname === '/login' || router.pathname === '/registration' || router.pathname === '/';

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <DataContext.Provider
        value={{
          navIsOpen,
          setNavIsOpen,
          isDarkMode,
          toggleDarkMode,
          userData,
          setUserData,
        }}
      >
        {isAuthPage ? (
          // Renderuj tylko komponent bez layoutu dla stron autoryzacji
          <Component {...pageProps} />
        ) : (
          // Renderuj komponent z layoutem dla pozostałych stron
          <Layout>
            <Component {...pageProps} userData={userData} /> {/* Przekazanie userData do komponentów */}
          </Layout>
        )}
      </DataContext.Provider>
    </div>
  );
}

export default MyApp;