import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Start from '../components/Start';
import '../i18n'; // Import konfiguracji i18next

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Jeśli użytkownik jest zalogowany, przekieruj go na dashboard
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        router.replace('/analytics');
      }
      // Nie przekierowujemy na login jeśli użytkownik nie jest zalogowany
      // Po prostu pokazujemy komponent Start
    }
  }, [router]);

  // Niezalogowany użytkownik zobaczy komponent Start (ekran powitalny)
  return <Start />;
}