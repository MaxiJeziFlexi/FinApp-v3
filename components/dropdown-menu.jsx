import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

const ExampleComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
};

const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    // Usuń stan logowania z localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');

    // Przekieruj na stronę logowania
    router.push('/login');
  };

  return (
    <div className="relative">
      {/* Ikona profilu */}
      <button
        onClick={toggleDropdown}
        className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center focus:outline-none"
      >
        <img
          src="/profile-icon.jpg" // Ścieżka do ikony profilu
          alt={t('profile')}
          className="rounded-full w-10 h-10"
        />
      </button>

      {/* Rozwijane menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
          <ul className="py-1">
            <li className="hover:bg-gray-100">
              <button
                onClick={() => router.push('/profile')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700"
              >
                {t('profile')}
              </button>
            </li>
            <li className="hover:bg-gray-100">
              <button
                onClick={() => router.push('/settings')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700"
              >
                {t('settings')}
              </button>
            </li>
            <li className="mt-2">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                {t('logout')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
