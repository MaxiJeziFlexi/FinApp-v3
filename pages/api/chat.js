// pages/api/chat.js
import axios from "axios";

export default async function handler(req, res) {
  const API_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
  
  if (req.method === "POST") {
    try {
      // Forward the request to your FastAPI backend
      const response = await axios.post(
        `${API_URL}/api/chat`,
        req.body,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Error in /api/chat:", error.message);
      
      // During development, if the FastAPI endpoint is not available,
      // return mock data to allow frontend development to continue
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        // Extract the last user message
        const lastUserMessage = req.body.messages?.filter(m => m.role === "user").pop()?.content || "";
        
        // Return mock response
        return res.status(200).json({
          result: `To jest symulowana odpowiedź na pytanie: "${lastUserMessage.substring(0, 50)}...".`,
          status: "success"
        });
      }
      
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.detail || error.message,
      });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}