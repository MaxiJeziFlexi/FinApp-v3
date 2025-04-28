import axios from "axios";

const API_KEY = "TWOJE_API_KLUCZ"; // Podmień na klucz z API finansowego
const API_URL = "https://financialdataapi.com"; // Przykładowe API

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Pobierz listę akcji użytkownika (może pochodzić z bazy danych)
    const userInvestments = ["AAPL", "AMZN", "MSFT", "GOOGL"]; // Przykładowe tickery

    const investmentData = await Promise.all(
      userInvestments.map(async (symbol) => {
        const response = await axios.get(`${API_URL}/stock/${symbol}`, {
          params: { apikey: API_KEY },
        });
        return { symbol, ...response.data };
      })
    );

    res.status(200).json(investmentData);
  } catch (error) {
    console.error("Błąd pobierania danych z API:", error);
    res.status(500).json({ error: "Błąd pobierania danych" });
  }
}
