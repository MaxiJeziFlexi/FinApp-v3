import axios from 'axios';

export async function getUserProfile(userId) {
  const response = await axios.get(`/api/user-profile/${userId}`);
  return response.data;
}

export async function getChatHistory(userId) {
  // Zakładamy, że endpoint /api/analytics/[userId].js zwraca obiekt AnalyticsData zawierający chat_history
  const response = await axios.get(`/api/analytics/${userId}`);
  return response.data.chat_history || [];
}

// utils/analytics.js - update the saveChatHistory function
export async function saveChatHistory({ user_id, question, answer, advisor_type }) {
  try {
    const response = await axios.post('/api/chat-history', {
      user_id,
      question,
      answer,
      advisor_type
    });
    return response.data;
  } catch (error) {
    console.error("Chat History API Error:", error);
    return null; // Return null instead of throwing to prevent application crashes
  }
}

export default { getUserProfile, getChatHistory, saveChatHistory };
