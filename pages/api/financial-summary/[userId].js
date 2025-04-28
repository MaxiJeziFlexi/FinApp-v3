// pages/api/financial-summary/[userId].js
import axios from "axios";

export default async function handler(req, res) {
  const { userId } = req.query;
  // Ustaw adres URL Twojego backendu (FastAPI)
  const API_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

  if (req.method === "GET") {
    try {
      // Przekierowujemy zapytanie do backendu FastAPI
      const response = await axios.get(`${API_URL}/api/financial-summary/${userId}`);
      return res.status(200).json(response.data);
    } catch (error) {
      console.error("Błąd w /api/financial-summary/[userId].js:", error.message);
      return res.status(error.response?.status || 500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
