// pages/api/user-profile/[userId].js
import axios from "axios";

export default async function handler(req, res) {
  const { userId } = req.query;
  const API_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

  if (req.method === "GET") {
    try {
      // Wywołanie backendu FastAPI dla profilu użytkownika
      const response = await axios.get(`${API_URL}/api/user-profile/${userId}`);
      return res.status(200).json(response.data);
    } catch (error) {
      console.error("Błąd w /api/user-profile/[userId].js:", error.message);
      return res
        .status(error.response?.status || 500)
        .json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
