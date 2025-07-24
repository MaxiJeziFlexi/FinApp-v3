import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Start from '../components/Start';
import '../i18n'; // Import konfiguracji i18next

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Jeśli użytkownik jest zalogowany, przekieruj go na analytics (główny dashboard z AI chat)
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        router.replace('/analytics');
      }
      // Niezalogowany użytkownik zobaczy komponent Start (ekran powitalny)
    }
  }, [router]);

  // Niezalogowany użytkownik zobaczy komponent Start (ekran powitalny)
  return <Start />;
}