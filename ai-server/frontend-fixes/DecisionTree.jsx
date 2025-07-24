// components/DecisionTree.jsx
// COMPLETE DECISION TREE COMPONENT

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../config/api';

const DecisionTree = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { userId, advisorType, initialData, advisor } = location.state || {};
  
  const [currentNode, setCurrentNode] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({ advisor_type: advisorType });
  const [journey, setJourney] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setCurrentNode(initialData.node);
      setProgress(initialData.progress || 0);
      setContext(initialData.context || { advisor_type: advisorType });
    } else if (userId && advisorType) {
      // Start fresh decision tree
      startDecisionTree();
    } else {
      // No proper state, redirect back
      console.error('Missing required state for decision tree');
      navigate('/advisors');
    }
  }, []);

  const startDecisionTree = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.startDecisionTree(userId, advisorType);
      
      setCurrentNode(response.data.node);
      setProgress(response.data.progress || 0);
      setContext(response.data.context || { advisor_type: advisorType });
      
    } catch (error) {
      console.error('Error starting decision tree:', error);
      setError('Failed to start decision tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📝 Processing answer: ${answer} for node: ${currentNode.id}`);
      
      const response = await api.processDecisionStep(
        userId,
        currentNode.id,
        answer,
        context
      );
      
      const data = response.data;
      
      // Update journey
      const newJourneyStep = { 
        nodeId: currentNode.id, 
        answer, 
        question: currentNode.question 
      };
      const updatedJourney = [...journey, newJourneyStep];
      setJourney(updatedJourney);
      
      // Update state
      setCurrentNode(data.node);
      setProgress(data.progress || 0);
      setContext(data.context || context);
      
      // Check if we have recommendations (end of tree)
      if (data.recommendations && data.recommendations.length > 0) {
        console.log('🎉 Decision tree completed, navigating to recommendations');
        navigate('/recommendations', {
          state: {
            userId,
            advisorType,
            advisor,
            recommendations: data.recommendations,
            journey: updatedJourney,
            context: data.context
          }
        });
      }
      
    } catch (error) {
      console.error('Error processing decision step:', error);
      setError('Failed to process your answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (journey.length > 0) {
      // Go back one step in the decision tree
      const previousStep = journey[journey.length - 1];
      // Implementation for going back would require backend support
      console.log('Going back to previous step:', previousStep);
    } else {
      // Go back to advisor selection
      navigate('/advisors');
    }
  };

  if (error) {
    return (
      <div className="decision-tree-error">
        <div className="error-content">
          <h2>⚠️ Something went wrong</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={startDecisionTree} className="retry-button">
              Try Again
            </button>
            <button onClick={() => navigate('/advisors')} className="back-button">
              Back to Advisors
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !currentNode) {
    return (
      <div className="decision-tree-loading">
        <div className="loading-content">
          <div className="spinner-large"></div>
          <h2>Preparing your {advisorType} consultation...</h2>
          <p>Setting up personalized questions based on your profile.</p>
        </div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="decision-tree-error">
        <div className="error-content">
          <h2>Unable to load questions</h2>
          <p>There was a problem loading the decision tree.</p>
          <button onClick={() => navigate('/advisors')} className="back-button">
            Back to Advisors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="decision-tree">
      {/* Header */}
      <div className="decision-tree-header">
        <div className="advisor-info">
          <span className="advisor-icon" style={{ color: advisor?.color }}>
            {advisor?.icon}
          </span>
          <div>
            <h1>{advisor?.name || `${advisorType} Advisor`}</h1>
            <p>{advisor?.description}</p>
          </div>
        </div>
        
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress * 100}%`,
                backgroundColor: advisor?.color || '#4F46E5'
              }}
            ></div>
          </div>
          <span className="progress-text">
            {Math.round(progress * 100)}% Complete
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="decision-tree-content">
        <div className="question-section">
          <div className="question-number">
            Question {journey.length + 1}
          </div>
          
          <h2 className="question-text">{currentNode.question}</h2>
          
          <div className="options-container">
            {currentNode.options?.map((option, index) => (
              <button
                key={option.id}
                className="option-button"
                onClick={() => handleAnswer(option.id)}
                disabled={loading}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <span className="option-label">{option.label}</span>
                <span className="option-arrow">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Journey Progress */}
        {journey.length > 0 && (
          <div className="journey-progress">
            <h3>Your Journey</h3>
            <div className="journey-steps">
              {journey.map((step, index) => (
                <div key={index} className="journey-step">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <div className="step-question">{step.question}</div>
                    <div className="step-answer">{step.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="decision-tree-footer">
        <button 
          className="back-button"
          onClick={handleBack}
          disabled={loading}
        >
          ← {journey.length > 0 ? 'Previous Question' : 'Back to Advisors'}
        </button>
        
        <div className="footer-info">
          <span>Powered by AI Financial Advisory</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

// CSS Styles (add to your CSS file)
const styles = `
.decision-tree {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.decision-tree-header {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.advisor-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.advisor-icon {
  font-size: 3rem;
}

.advisor-info h1 {
  font-size: 2rem;
  color: #1F2937;
  margin: 0;
}

.advisor-info p {
  color: #6B7280;
  margin: 0.5rem 0 0 0;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 4px;
}

.progress-text {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
}

.decision-tree-content {
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.question-section {
  text-align: center;
  margin-bottom: 3rem;
}

.question-number {
  display: inline-block;
  background: #F3F4F6;
  color: #6B7280;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.question-text {
  font-size: 2rem;
  color: #1F2937;
  margin-bottom: 3rem;
  line-height: 1.4;
}

.options-container {
  display: grid;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.option-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 1rem;
  padding: 1.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: slideInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

.option-button:hover {
  border-color: #4F46E5;
  background: #F8FAFC;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.15);
}

.option-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-label {
  text-align: left;
  flex: 1;
  color: #374151;
}

.option-arrow {
  color: #4F46E5;
  font-weight: bold;
  font-size: 1.2rem;
}

.journey-progress {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #E5E7EB;
}

.journey-progress h3 {
  color: #374151;
  margin-bottom: 1rem;
}

.journey-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.journey-step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #F9FAFB;
  border-radius: 0.5rem;
}

.step-number {
  background: #4F46E5;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-question {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.step-answer {
  color: #6B7280;
  font-size: 0.9rem;
}

.decision-tree-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.back-button {
  background: #6B7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.back-button:hover {
  background: #4B5563;
}

.back-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.footer-info {
  color: #6B7280;
  font-size: 0.9rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
}

.decision-tree-loading,
.decision-tree-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-content,
.error-content {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
}

.retry-button {
  background: #4F46E5;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4F46E5;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

.spinner-large {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4F46E5;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}
`;

export default DecisionTree;