import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  FaSearch, 
  FaBell, 
  FaUser, 
  FaChevronDown, 
  FaArrowLeft,
  FaCrown,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaQuestionCircle
} from 'react-icons/fa';
import { MdLanguage } from 'react-icons/md';
import Image from 'next/image';

const TopNav = ({ 
  title = "DisiNow", 
  showBackButton = false,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  showLanguage = true
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [currentLanguage, setCurrentLanguage] = useState('PL');
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    avatar: null
  });

  const profileDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);

  // Check premium status and user data
  useEffect(() => {
    const premiumState = localStorage.getItem("isPremiumUser");
    const storedUserData = localStorage.getItem("userData");
    
    setIsPremiumUser(premiumState === "true");
    
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle language change
  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    setShowLanguageDropdown(false);
    localStorage.setItem('selectedLanguage', lang);
    // Here you would typically trigger a language change in your i18n system
  };

  // Profile dropdown menu items
  const profileMenuItems = [
    {
      icon: <FaUserCircle />,
      label: 'My Profile',
      action: () => router.push('/profile')
    },
    {
      icon: <FaCog />,
      label: 'Settings',
      action: () => router.push('/settings')
    },
    {
      icon: <FaQuestionCircle />,
      label: 'Help & Support',
      action: () => router.push('/support')
    },
    ...(isPremiumUser ? [] : [{
      icon: <FaCrown />,
      label: 'Upgrade to Premium',
      action: () => router.push('/premium-upgrade'),
      special: true
    }]),
    {
      icon: <FaSignOutAlt />,
      label: 'Sign Out',
      action: () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        router.push('/login');
      },
      danger: true
    }
  ];

  const languages = [
    { code: 'PL', name: 'Polski', flag: '/images/flags/pl.png' },
    { code: 'EN', name: 'English', flag: '/images/flags/en.png' },
    { code: 'DE', name: 'Deutsch', flag: '/images/flags/de.png' },
    { code: 'FR', name: 'Français', flag: '/images/flags/fr.png' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-full">
        
        {/* Left Section - Back Button & Title */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {showBackButton && (
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FaArrowLeft />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-xl text-slate-900 dark:text-white">
              {title}
            </h1>
            {isPremiumUser && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                <FaCrown className="text-xs" />
                <span className="hidden sm:inline">Premium</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Search Bar */}
        {showSearch && (
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for transactions, accounts, or tools..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Right Section - Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* Mobile Search Button */}
          {showSearch && (
            <button className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <FaSearch />
            </button>
          )}

          {/* Language Selector */}
          {showLanguage && (
            <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <div className="w-6 h-4 bg-slate-300 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold">{currentLanguage}</span>
                </div>
                <FaChevronDown className="text-xs" />
              </button>

              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        currentLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="w-6 h-4 bg-slate-300 dark:bg-slate-600 rounded-sm flex items-center justify-center">
                        <span className="text-xs font-bold">{lang.code}</span>
                      </div>
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {showNotifications && (
            <button 
              onClick={() => router.push('/notifications')}
              className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FaBell />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>
          )}

          {/* User Profile Dropdown */}
          {showProfile && (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <div className="relative">
                  {userData.avatar ? (
                    <Image
                      src={userData.avatar}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-slate-600 dark:bg-slate-400 rounded-full flex items-center justify-center text-white dark:text-slate-900 font-semibold text-sm">
                      {userData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isPremiumUser && (
                    <FaCrown className="absolute -top-1 -right-1 text-amber-500 text-xs bg-white dark:bg-slate-900 rounded-full p-0.5" />
                  )}
                </div>
                <FaChevronDown className="text-xs hidden sm:block" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {userData.avatar ? (
                          <Image
                            src={userData.avatar}
                            alt="User Avatar"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-600 dark:bg-slate-400 rounded-full flex items-center justify-center text-white dark:text-slate-900 font-semibold">
                            {userData.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isPremiumUser && (
                          <FaCrown className="absolute -top-1 -right-1 text-amber-500 bg-white dark:bg-slate-900 rounded-full p-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {userData.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {userData.email}
                        </p>
                        {isPremiumUser && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold mt-1">
                            <FaCrown className="text-xs" />
                            Premium User
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {profileMenuItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setShowProfileDropdown(false);
                          item.action();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                          item.danger ? 'text-red-600 dark:text-red-400' : 
                          item.special ? 'text-amber-600 dark:text-amber-400' : 
                          'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;