    // pages/api/chat-history.js
import axios from "axios";

export default async function handler(req, res) {
  const API_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
  if (req.method === "GET") {
    const { user_id } = req.query;
    try {
      const response = await axios.get(`${API_URL}/api/chat-history/${user_id}`);
      return res.status(200).json(response.data);
    } catch (error) {
      console.error("Error in GET /api/chat-history:", error.message);
      return res.status(error.response?.status || 500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const response = await axios.post(`${API_URL}/api/chat-history`, req.body, {
        headers: { "Content-Type": "application/json" },
      });
      return res.status(200).json(response.data);
    } catch (error) {
      console.error("Error in POST /api/chat-history:", error.message);
      return res.status(error.response?.status || 500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
