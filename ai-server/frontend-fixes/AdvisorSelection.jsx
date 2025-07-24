// components/AdvisorSelection.jsx
// FIXED ADVISOR SELECTION COMPONENT

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const AdvisorSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);

  // Get user ID from localStorage or props
  const userId = localStorage.getItem('userId') || 1;

  const advisors = [
    {
      id: 'financial',
      name: 'Financial Advisor',
      description: 'Personal finance, budgeting, emergency funds, debt management',
      icon: '💰',
      color: '#4F46E5'
    },
    {
      id: 'investment',
      name: 'Investment Advisor', 
      description: 'Stocks, bonds, portfolio management, retirement planning',
      icon: '📈',
      color: '#059669'
    },
    {
      id: 'tax',
      name: 'Tax Advisor',
      description: 'Tax optimization, deductions, IKE/IKZE planning',
      icon: '📊',
      color: '#DC2626'
    },
    {
      id: 'legal',
      name: 'Legal Advisor',
      description: 'Legal planning, contracts, estate planning',
      icon: '⚖️',
      color: '#7C2D12'
    }
  ];

  const handleAdvisorClick = async (advisorType) => {
    try {
      setLoading(true);
      setSelectedAdvisor(advisorType);
      
      console.log(`🎯 Starting ${advisorType} advisor for user ${userId}`);
      
      // Start decision tree for selected advisor
      const response = await api.startDecisionTree(userId, advisorType);
      
      console.log('✅ Decision tree started:', response.data);
      
      // Navigate to decision tree with advisor context
      navigate('/decision-tree', {
        state: {
          userId: parseInt(userId),
          advisorType: advisorType,
          initialData: response.data,
          advisor: advisors.find(a => a.id === advisorType)
        }
      });
      
    } catch (error) {
      console.error('❌ Error starting advisor:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message.includes('fetch') 
        ? 'Unable to connect to the server. Please check your connection and try again.'
        : `Failed to start ${advisorType} advisor. Please try again.`;
      
      alert(errorMessage);
      
      setSelectedAdvisor(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advisor-selection-container">
      <div className="advisor-selection-header">
        <h1>Choose Your Financial Advisor</h1>
        <p>Select the type of financial guidance you need to get personalized recommendations.</p>
      </div>

      <div className="advisors-grid">
        {advisors.map((advisor) => (
          <div
            key={advisor.id}
            className={`advisor-card ${selectedAdvisor === advisor.id ? 'loading' : ''}`}
            onClick={() => !loading && handleAdvisorClick(advisor.id)}
            style={{ 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && selectedAdvisor !== advisor.id ? 0.5 : 1,
              borderColor: advisor.color
            }}
          >
            <div className="advisor-icon" style={{ color: advisor.color }}>
              {advisor.icon}
            </div>
            <h3>{advisor.name}</h3>
            <p>{advisor.description}</p>
            
            {loading && selectedAdvisor === advisor.id && (
              <div className="advisor-loading">
                <div className="spinner"></div>
                <span>Starting...</span>
              </div>
            )}
            
            <div className="advisor-arrow" style={{ color: advisor.color }}>
              →
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-message">
            <div className="spinner-large"></div>
            <h3>Preparing your {selectedAdvisor} advisor...</h3>
            <p>This may take a moment while we set up your personalized experience.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS Styles (add to your CSS file)
const styles = `
.advisor-selection-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.advisor-selection-header {
  text-align: center;
  margin-bottom: 3rem;
}

.advisor-selection-header h1 {
  font-size: 2.5rem;
  color: #1F2937;
  margin-bottom: 1rem;
}

.advisor-selection-header p {
  font-size: 1.2rem;
  color: #6B7280;
}

.advisors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.advisor-card {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.advisor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.advisor-card.loading {
  transform: scale(1.02);
}

.advisor-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.advisor-card h3 {
  font-size: 1.5rem;
  color: #1F2937;
  margin-bottom: 1rem;
}

.advisor-card p {
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.advisor-arrow {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1rem;
}

.advisor-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-message {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  text-align: center;
  max-width: 400px;
}

.spinner, .spinner-large {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner {
  width: 20px;
  height: 20px;
}

.spinner-large {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default AdvisorSelection;