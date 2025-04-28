// pages/api/goals.js
import axios from 'axios';

/**
 * Get all financial goals for a user
 * @param {number} userId - User ID
 * @returns {Promise} - Promise resolving to the goals data
 */
export async function getGoals(userId) {
  try {
    const response = await axios.get(`/api/goals/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
}

/**
 * Create a new financial goal
 * @param {Object} goalData - Goal data
 * @param {number} goalData.user_id - User ID
 * @param {string} goalData.goal_name - Goal name
 * @param {number} goalData.target_amount - Target amount
 * @param {number} goalData.current_amount - Current amount (default: 0)
 * @param {string} goalData.deadline - Deadline date (YYYY-MM-DD)
 * @param {string} goalData.description - Goal description
 * @returns {Promise} - Promise resolving to the created goal
 */
export async function createGoal(goalData) {
  try {
    const response = await axios.post('/api/goals', goalData);
    return response.data;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
}

/**
 * Update an existing financial goal
 * @param {number} goalId - Goal ID
 * @param {Object} updateData - Data to update
 * @returns {Promise} - Promise resolving to the updated goal
 */
export async function updateGoal(goalId, updateData) {
  try {
    const response = await axios.put(`/api/goals/${goalId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
}

/**
 * Delete a financial goal
 * @param {number} goalId - Goal ID
 * @returns {Promise} - Promise resolving to the deletion confirmation
 */
export async function deleteGoal(goalId) {
  try {
    const response = await axios.delete(`/api/goals/${goalId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

export default {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
