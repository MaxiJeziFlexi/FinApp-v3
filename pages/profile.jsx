import { useEffect, useState } from "react";
import TopNav from "../components/top-nav";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId") || "1"; // Default to "1" for testing
    console.log("Fetching profile for userId:", userId);

    fetch(`http://localhost:8000/api/user/profile/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched profile data:", data);
        setProfile(data);
        setFormData({
          id: data.id,
          name: data.name || "",
          financialGoal: data.financialGoal || "",
          timeframe: data.timeframe || "",
          currentSavings: data.currentSavings || "",
          monthlyIncome: data.monthlyIncome || "",
          targetAmount: data.targetAmount || "",
          onboardingComplete: data.onboardingComplete || false,
          is_premium: data.is_premium || false,
          progress: data.progress || 0,
          achievements: data.achievements || [],
          consents: data.consents || {},
          financialData: data.financialData || []
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching profile data:", error.message);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setLoading(true);
    const userId = formData.id;
    fetch(`http://localhost:8000/api/user/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to save profile data. HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((updatedProfile) => {
        setProfile(updatedProfile);
        alert("Profile updated successfully!");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error saving profile data:", error.message);
        alert("Failed to update profile.");
        setLoading(false);
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
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">User Profile</h1>

      <div className="bg-white dark:bg-night-blue shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Financial Goal
          </label>
          <input
            type="text"
            name="financialGoal"
            value={formData.financialGoal}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter financial goal"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Timeframe
          </label>
          <input
            type="text"
            name="timeframe"
            value={formData.timeframe}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter timeframe"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Current Savings
          </label>
          <input
            type="text"
            name="currentSavings"
            value={formData.currentSavings}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter current savings"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Monthly Income
          </label>
          <input
            type="text"
            name="monthlyIncome"
            value={formData.monthlyIncome}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter monthly income"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Target Amount
          </label>
          <input
            type="text"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter target amount"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default Profile;