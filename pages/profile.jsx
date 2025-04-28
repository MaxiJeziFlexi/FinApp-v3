import { useEffect, useState } from "react";
import TopNav from "../components/top-nav";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const username = localStorage.getItem("username") || "admin";
    console.log("Logged-in username:", username);

    fetch("http://localhost:4001/profile")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched profile data:", data);

        const loggedUser = data.find((user) => user.Username === username);

        if (!loggedUser) {
          throw new Error("User not found.");
        }

        setProfile(loggedUser);
        setFormData({
          ID: loggedUser.ID,
          FirstName: loggedUser.FirstName || "N/A",
          LastName: loggedUser.LastName || "N/A",
          PhoneNumber: loggedUser.PhoneNumber || "",
          Address: loggedUser.Address || "",
          Preferences: loggedUser.Preferences || "",
          img: loggedUser.img || "/images/default-avatar.png", // Placeholder image
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setLoading(true);
    fetch(`http://localhost:4001/profile/${formData.ID}`, {
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
      .then(() => {
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
            First Name
          </label>
          <input
            type="text"
            name="FirstName"
            value={formData.FirstName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter first name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Last Name
          </label>
          <input
            type="text"
            name="LastName"
            value={formData.LastName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter last name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Phone Number
          </label>
          <input
            type="text"
            name="PhoneNumber"
            value={formData.PhoneNumber}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter phone number"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Address
          </label>
          <input
            type="text"
            name="Address"
            value={formData.Address}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter address"
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Preferences
          </label>
          <input
            type="text"
            name="Preferences"
            value={formData.Preferences}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter preferences"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Profile;
