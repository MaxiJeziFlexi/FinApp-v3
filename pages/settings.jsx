import { useState } from 'react';
import TopNav from '../components/top-nav';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
  };
  const Settings = () => {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Settings</h1>
        <p>Settings page under construction.</p>
      </div>
    );
  };
  

  return (
    <div className="h-full p-6">
      <TopNav />
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Settings</h1>

      <div className="bg-white dark:bg-night-blue shadow-md rounded-lg p-6 space-y-6">
        {/* Account Settings */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Username</label>
              <input
                type="text"
                value="Peter"
                readOnly
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value="peter@example.com"
                readOnly
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">Dark Mode</p>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${
                darkMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-slate-800'
              }`}
            >
              {darkMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Notifications</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">Email Notifications</p>
            <button
              onClick={toggleNotifications}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${
                notifications ? 'bg-blue-600 text-white' : 'bg-gray-200 text-slate-800'
              }`}
            >
              {notifications ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
