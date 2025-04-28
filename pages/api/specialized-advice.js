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