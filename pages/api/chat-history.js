// pages/api/chat-history.js

// In-memory storage for chat history (in production, use a database)
let chatHistoryStorage = {};

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { userId, advisorId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const userKey = `${userId}_${advisorId || 'general'}`;
      const history = chatHistoryStorage[userKey] || [];
      
      return res.status(200).json({
        chatHistory: history,
        count: history.length
      });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return res.status(500).json({ 
        error: "Failed to fetch chat history",
        details: error.message 
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { 
        user_id, 
        question, 
        answer, 
        advisor_type = 'general',
        metadata = {} 
      } = req.body;

      if (!user_id || !question || !answer) {
        return res.status(400).json({ 
          error: "user_id, question, and answer are required" 
        });
      }

      const userKey = `${user_id}_${advisor_type}`;
      
      // Initialize chat history for user if it doesn't exist
      if (!chatHistoryStorage[userKey]) {
        chatHistoryStorage[userKey] = [];
      }

      // Create chat entry
      const chatEntry = {
        id: Date.now().toString(),
        user_id: parseInt(user_id),
        question,
        answer,
        advisor_type,
        metadata,
        timestamp: new Date().toISOString(),
        session_id: metadata.session_id || `session_${Date.now()}`
      };

      // Add to storage
      chatHistoryStorage[userKey].push(chatEntry);

      // Keep only last 50 messages per user/advisor combination
      if (chatHistoryStorage[userKey].length > 50) {
        chatHistoryStorage[userKey] = chatHistoryStorage[userKey].slice(-50);
      }

      return res.status(201).json({
        success: true,
        chatEntry,
        message: "Chat history saved successfully"
      });

    } catch (error) {
      console.error("Error saving chat history:", error);
      return res.status(500).json({ 
        error: "Failed to save chat history",
        details: error.message 
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { userId, advisorId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const userKey = `${userId}_${advisorId || 'general'}`;
      
      if (chatHistoryStorage[userKey]) {
        delete chatHistoryStorage[userKey];
      }

      return res.status(200).json({
        success: true,
        message: "Chat history cleared successfully"
      });

    } catch (error) {
      console.error("Error clearing chat history:", error);
      return res.status(500).json({ 
        error: "Failed to clear chat history",
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}