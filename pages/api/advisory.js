// pages/api/advisory.js
import axios from 'axios';

/**
 * Get financial advice from the advisory API
 * @param {Object} data - Request data
 * @param {number} data.user_id - User ID
 * @param {string} data.question - User's question
 * @param {Object} data.context - Financial context
 * @param {string} data.advisory_type - Type of advice (financial, investment, legal, tax)
 * @param {string} data.language - Language for the response
 * @returns {Promise} - Promise resolving to the advisory response
 */
export async function getFinancialAdvice(data) {
  try {
    const response = await axios.post('/api/advisory/financial', data);
    return response.data;
  } catch (error) {
    console.error('Error getting financial advice:', error);
    throw error;
  }
}

/**
 * Get investment advice from the advisory API
 * @param {Object} data - Request data
 * @param {number} data.user_id - User ID
 * @param {Object} data.portfolio - Investment portfolio
 * @returns {Promise} - Promise resolving to the investment advice
 */
export async function getInvestmentAdvice(data) {
  try {
    const response = await axios.post('/api/advisory/investment-recommendation', data);
    return response.data;
  } catch (error) {
    console.error('Error getting investment advice:', error);
    throw error;
  }
}

/**
 * Analyze investment portfolio
 * @param {Object} portfolio - Investment portfolio
 * @returns {Promise} - Promise resolving to the portfolio analysis
 */
export async function analyzePortfolio(portfolio) {
  try {
    const response = await axios.post('/api/advisory/portfolio-analysis', portfolio);
    return response.data;
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    throw error;
  }
}

/**
 * Chat with AI financial advisor
 * @param {Object} data - Request data
 * @param {number} data.user_id - User ID
 * @param {string} data.question - User's question
 * @param {Object} data.context - Financial context
 * @param {string} data.advisory_type - Type of advice (financial, investment, legal, tax)
 * @param {string} data.language - Language for the response
 * @returns {Promise} - Promise resolving to the chat response
 */
export async function chatWithAdvisor(data) {
  try {
    const response = await axios.post('/api/advisory/chat', data);
    return response.data;
  } catch (error) {
    console.error('Error chatting with advisor:', error);
    throw error;
  }
}

export default {
  getFinancialAdvice,
  getInvestmentAdvice,
  analyzePortfolio,
  chatWithAdvisor
};
