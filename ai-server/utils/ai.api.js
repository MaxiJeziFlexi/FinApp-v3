// api.ai.js - AI API endpoint handler

import axios from 'axios';

/**
 * Sends a request to the AI assistant
 * @param {Object} data - The request data
 * @param {string} data.model - The AI model to use (e.g., "gpt-4")
 * @param {Array} data.messages - The conversation messages
 * @param {number} data.temperature - The temperature parameter for response generation
 * @param {number} data.max_tokens - Maximum tokens in the response
 * @returns {Promise} - Promise resolving to the AI response
 */
export async function sendAIRequest(data) {
  try {
    const response = await axios.post('/api/ai', data, {
      timeout: 30000 // 30 seconds timeout
    });
    return response.data;
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
}

/**
 * Handles AI chat interactions
 * @param {string} message - User message
 * @param {Object} context - Financial context data
 * @returns {Promise} - Promise resolving to the AI response
 */
export async function handleAIChat(message, context) {
  try {
    const data = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor analyzing user's financial data. Please respond in Polish."
        },
        {
          role: "user",
          content: `Financial context: ${JSON.stringify(context)}. Question: ${message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    };
    
    return await sendAIRequest(data);
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw error;
  }
}

/**
 * Saves chat history to the database
 * @param {number} userId - User ID
 * @param {string} question - User question
 * @param {string} answer - AI answer
 * @param {Object} context - Conversation context
 * @returns {Promise} - Promise resolving to the saved chat history entry
 */
export async function saveChatHistory(userId, question, answer, context) {
  try {
    const response = await axios.post('/api/chat-history', {
      user_id: userId,
      question,
      answer,
      context
    });
    return response.data;
  } catch (error) {
    console.error('Save Chat History Error:', error);
    throw error;
  }
}

export default {
  sendAIRequest,
  handleAIChat,
  saveChatHistory
};
