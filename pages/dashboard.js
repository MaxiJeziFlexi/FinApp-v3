import React, { useState, useEffect } from 'react';
import FinancialMap from '../components/FinancialMap';
import FinancialProfileVisualization from '../components/FinancialProfileVisualizat';

const Dashboard = () => {
  // State for financial data
  const [financialData, setFinancialData] = useState({
    transactions: []
  });
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState('financial');
  const [advisorInsights, setAdvisorInsights] = useState({
    financial: {
      traits: ['planner'],
      latestInsight: 'Twój profil wskazuje na dobrą kontrolę finansów osobistych.',
      profile: 'Planujący'
    },
    investment: {
      latestInsight: 'Twój profil inwestycyjny wskazuje na zrównoważone podejście do ryzyka.',
      profile: 'Zrównoważony'
    },
    legal: {
      latestInsight: 'Preferujesz pragmatyczne podejście do kwestii prawnych.',
      profile: 'Pragmatyczny'
    },
    tax: {
      latestInsight: 'Dążysz do optymalizacji podatkowej w granicach prawa.',
      profile: 'Optymalizujący'
    }
  });

  // Fetch financial data on component mount
  useEffect(() => {
    // Simulate data fetching
    const fetchData = async () => {
      // In a real app, this would be a fetch call to your API
      // For now, using mock data
      const mockTransactions = [
        { Type: 'income', Amount: 5000 },
        { Type: 'income', Amount: 1200 },
        { Type: 'expense', Amount: 1500 },
        { Type: 'expense', Amount: 800 },
        { Type: 'expense', Amount: 450 }
      ];

      const mockNetWorthHistory = [
        { value: 25000 },
        { value: 27500 },
        { value: 26800 },
        { value: 29000 },
        { value: 32000 }
      ];

      setFinancialData({ transactions: mockTransactions });
      setNetWorthHistory(mockNetWorthHistory);
    };

    fetchData();
  }, []);

  // Function to generate reports
  const generateReport = () => {
    console.log(`Generating report for ${selectedAdvisor} advisor`);
    // In a real app, this would trigger a report generation
    alert(`Raport dla doradcy ${selectedAdvisor} zostanie wygenerowany.`);
  };

  // Handle advisor selection
  const handleAdvisorSelect = (advisor) => {
    setSelectedAdvisor(advisor);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Panel Finansowy
      </h1>
      
      {/* Financial Map Component */}
      <FinancialMap 
        data={financialData} 
        netWorthHistory={netWorthHistory} 
      />
      
      {/* Advisor Selection */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          Doradcy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['financial', 'investment', 'legal', 'tax'].map((advisor) => (
            <button
              key={advisor}
              onClick={() => handleAdvisorSelect(advisor)}
              className={`p-3 rounded-lg transition-all ${
                selectedAdvisor === advisor
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {advisor === 'financial' && 'Finansowy'}
              {advisor === 'investment' && 'Inwestycyjny'}
              {advisor === 'legal' && 'Prawny'}
              {advisor === 'tax' && 'Podatkowy'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Financial Profile Visualization */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <FinancialProfileVisualization 
          advisorInsights={advisorInsights}
          selectedAdvisor={selectedAdvisor}
          generateReport={generateReport}
        />
      </div>
    </div>
  );
};

export default Dashboard;