// pages/api/financial-chat.js
import axios from "axios";

export default async function handler(req, res) {
  const API_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
  
  if (req.method === "POST") {
    try {
      // Przekazujemy zapytanie POST do backendu FastAPI
      const response = await axios.post(
        `${API_URL}/api/financial-chat`,
        req.body,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Error in /api/financial-chat.js:", error.message);
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.detail || error.message,
      });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
