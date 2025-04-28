import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { DataContext } from "../utilities/DataContext";
import dynamic from 'next/dynamic';
import SideNav from "./side-nav";
import AccountModal from "./account-modal";
import { BsBell } from "react-icons/bs";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import i18n from "../i18n"; // Import konfiguracji i18next

const DarkModeToggler = dynamic(() => import('./dark-mode-toggler'), { ssr: false });

const Layout = ({ children }) => {
  const context = useContext(DataContext);
  if (!context) {
    console.error("DataContext is not provided. Ensure that DataContext.Provider wraps the Layout component.");
    return null; // Zwróć null, jeśli DataContext nie jest dostępny
  }

  const { navIsOpen } = context;
  const router = useRouter();

  // Stan do przechowywania wybranego języka – domyślnie "pl"
  const [language, setLanguage] = useState("pl");
  // Stan do kontrolowania widoczności menu wyboru języka
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const languageFlags = {
    pl: "🇵🇱",
    en: "🇬🇧",
    es: "🇪🇸",
    de: "🇩🇪",
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setShowLangDropdown(false);
    i18n.changeLanguage(lang); // Zmiana języka w i18next – tłumaczenia w całej aplikacji zostaną zaktualizowane
    console.log("Wybrany język:", lang);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/");
  };

  return (
    <>
      <div
        className={`min-h-screen flex bg-slate-200 dark:bg-midnight-blue ${
          navIsOpen ? "relative" : ""
        }`}
      >
        {/* Sidebar */}
        <div
          className={`${
            navIsOpen
              ? "absolute z-10 w-80 h-full shadow-xl shadow-slate-600 left-0 duration-500 ease-in-out"
              : "z-10 absolute -left-full lg:left-0 lg:relative duration-300 ease-in-out"
          } transition delay-75 lg:block lg:w-1/5 container mx-auto p-6 bg-white dark:bg-night-blue`}
        >
          <SideNav />
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-4/5 px-6 md:px-8 lg:px-12 py-6">
          <main className="container mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white dark:bg-evening-blue p-4 rounded-lg shadow-md mb-6 transition-all duration-300">
              {/* Search Bar */}
              <div className="flex items-center flex-1 mb-4 md:mb-0 md:mr-4">
                <input
                  type="text"
                  placeholder="Search for transactions, accounts, or tools..."
                  className="flex-1 px-4 py-2 rounded-l-lg border border-slate-300 dark:border-evening-blue focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-300"
                />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-r-lg transition-colors duration-300">
                  Search
                </button>
              </div>

              {/* Language Selector */}
              <div className="relative mr-4">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-2 p-2 border rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <span className="text-xl">{languageFlags[language]}</span>
                  <span className="font-bold uppercase">{language}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
                    {Object.keys(languageFlags).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageSelect(lang)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <span className="text-xl">{languageFlags[lang]}</span>
                        <span className="font-bold uppercase">{lang}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications and Profile */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="h-10 w-10 bg-slate-300 dark:bg-evening-blue rounded-full flex justify-center items-center cursor-pointer transition-colors duration-300">
                    <BsBell className="text-xl text-slate-800 dark:text-white" />
                  </div>
                  <span className="absolute top-0 right-0 h-3 w-3 bg-red-600 rounded-full"></span>
                </div>
                <div className="relative group">
                  <div className="h-10 w-10 bg-slate-300 dark:bg-evening-blue rounded-full flex justify-center items-center cursor-pointer transition-colors duration-300">
                    <FiUser className="text-xl text-slate-800 dark:text-white" />
                  </div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-night-blue rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                    <button
                      onClick={() => router.push("/profile")}
                      className="flex items-center px-4 py-2 w-full text-sm text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-evening-blue"
                    >
                      <FiUser className="mr-2" /> Profile
                    </button>
                    <button
                      onClick={() => router.push("/settings")}
                      className="flex items-center px-4 py-2 w-full text-sm text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-evening-blue"
                    >
                      <FiSettings className="mr-2" /> Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 w-full text-sm text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-evening-blue"
                    >
                      <FiLogOut className="mr-2" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>

      <DarkModeToggler />
      <AccountModal />
    </>
  );
};

export default Layout;
