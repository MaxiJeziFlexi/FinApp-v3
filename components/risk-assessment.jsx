import React from "react";

const RiskAssessment = ({ profile, onChange }) => {
  return (
    <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg mb-6">
      <h2 className="text-lg font-bold mb-2">🎯 Twój Profil Ryzyka</h2>
      <select
        value={profile}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded bg-white dark:bg-gray-600"
      >
        <option value="low">Niski</option>
        <option value="medium">Średni</option>
        <option value="high">Wysoki</option>
      </select>
    </div>
  );
};

export default RiskAssessment;