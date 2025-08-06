import { useState, useEffect } from 'react';
import TopNav from '../components/top-nav';

const Settings = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    financialGoal: '',
    timeframe: '',
    currentSavings: '',
    monthlyIncome: '',
    targetAmount: '',
    darkMode: false,
    notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId") || "1";
    fetch(`http://localhost:8000/api/user/profile/${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          financialGoal: data.financialGoal || '',
          timeframe: data.timeframe || '',
          currentSavings: data.currentSavings || '',
          monthlyIncome: data.monthlyIncome || '',
          targetAmount: data.targetAmount || '',
          darkMode: data.darkMode || false,
          notifications: data.notifications || true,
        });
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching profile data:", error.message);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const toggleDarkMode = () => {
    setProfile(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const toggleNotifications = () => {
    setProfile(prev => ({ ...prev, notifications: !prev.notifications }));
  };

  const handleSave = () => {
    const userId = localStorage.getItem("userId") || "1";
    fetch(`http://localhost:8000/api/user/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to save profile data. HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        alert("Settings saved successfully!");
      })
      .catch(error => {
        console.error("Error saving settings:", error.message);
        alert("Failed to save settings.");
      });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error: {error}</p>;
  }

  return (
    <div className="h-full p-6">
      <TopNav />
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Settings</h1>

      <div className="bg-white dark:bg-night-blue shadow-md rounded-lg p-6 space-y-6">
        {/* Profile Settings */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Profile Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Financial Goal</label>
              <input
                type="text"
                name="financialGoal"
                value={profile.financialGoal}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Timeframe</label>
              <input
                type="text"
                name="timeframe"
                value={profile.timeframe}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Current Savings</label>
              <input
                type="text"
                name="currentSavings"
                value={profile.currentSavings}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Monthly Income</label>
              <input
                type="text"
                name="monthlyIncome"
                value={profile.monthlyIncome}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Target Amount</label>
              <input
                type="text"
                name="targetAmount"
                value={profile.targetAmount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-600 dark:bg-night-blue dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">Dark Mode</p>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${
                profile.darkMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-slate-800'
              }`}
            >
              {profile.darkMode ? 'Enabled' : 'Disabled'}
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
                profile.notifications ? 'bg-blue-600 text-white' : 'bg-gray-200 text-slate-800'
              }`}
            >
              {profile.notifications ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-6"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;