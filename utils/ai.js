// utils/ai.js
import axios from "axios";

/**
 * Wysyła zapytanie do endpointu czatu AI.
 * @param {Object} data - Dane zapytania, np. model, wiadomości, temperaturę, max_tokens.
 * @returns {Promise} - Promise z odpowiedzią API.
 */
export async function sendAIMessage(payload) {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error("API Error:", errorData);
      return { 
        result: `Przepraszam, wystąpił problem z komunikacją z API (${res.status}). Proszę spróbować ponownie za chwilę.`
      };
    }
    
    try {
      // Spróbuj przetworzyć odpowiedź jako JSON
      const jsonData = await res.json();
      console.log("Odpowiedź z API:", jsonData);
      
      // Obsługa zarówno odpowiedzi z 'result' jak i 'reply'
      if (!jsonData) {
        console.error("Nieprawidłowa struktura odpowiedzi API: pusta odpowiedź");
        return { 
          result: "Przepraszam, otrzymano nieprawidłowy format odpowiedzi. Proszę spróbować ponownie."
        };
      }
      
      // Jeśli jest tylko pole reply, ale nie ma result, przekształć odpowiedź
      if (jsonData.reply && typeof jsonData.result === 'undefined') {
        console.log("Przekształcanie odpowiedzi z 'reply' na 'result'");
        return { result: jsonData.reply };
      }
      
      // Jeśli jest pole result, użyj go bezpośrednio
      if (typeof jsonData.result !== 'undefined') {
        return jsonData;
      }
      
      // Jeśli nie ma ani 'result' ani 'reply', zwróć błąd
      console.error("Nieprawidłowa struktura odpowiedzi API: brak pola 'result' lub 'reply'", jsonData);
      return { 
        result: "Przepraszam, otrzymano nieprawidłowy format odpowiedzi. Proszę spróbować ponownie."
      };
      
    } catch (parseError) {
      console.error("Błąd parsowania JSON:", parseError);
      return { 
        result: "Przepraszam, wystąpił problem z przetworzeniem odpowiedzi. Proszę spróbować ponownie."
      };
    }
  } catch (error) {
    console.error("Błąd podczas wysyłania wiadomości:", error);
    // Zwróć obiekt z domyślną odpowiedzią, aby zapobiec błędom null
    return { 
      result: "Przepraszam, wystąpił problem z komunikacją z serwisem. Proszę spróbować ponownie."
    };
  }
}

/**
 * Wysyła zapytanie do endpointu finansowego czatu.
 * @param {Object} data - Dane zapytania: user_id, question, context, advisory_type, language.
 * @returns {Promise} - Promise z odpowiedzią API.
 */
export async function sendFinancialChatMessage(data) {
  try {
    const response = await axios.post("/api/financial-chat", data, {
      timeout: 60000
    });
    return response.data;
  } catch (error) {
    console.error("Financial Chat API Error:", error);
    // Zwróć obiekt z domyślną odpowiedzią
    return {
      answer: "Przepraszam, wystąpił problem z komunikacją z serwisem finansowym."
    };
  }
}

/**
 * Pobiera dodatkowe, wyspecjalizowane porady.
 * @param {Object} data - Dane zapytania: user_id, question, context, advisory_type.
 * @returns {Promise} - Promise z odpowiedzią API.
 */
export async function getSpecializedAdvice(data) {
  try {
    // Dodaj obsługę błędów sieciowych i timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await axios.post("/api/specialized-advice", data, {
      timeout: 10000, // Zmniejszony timeout dla szybszej reakcji na błędy
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.data;
  } catch (error) {
    // Szczegółowa obsługa błędów
    console.error(`Specialized Advice API Error (${data.advisory_type}):`, error);
    
    // Sprawdź, czy to błąd HTTP 500
    const statusCode = error.response?.status;
    if (statusCode === 500) {
      console.warn(`Serwer zwrócił błąd 500 dla doradcy ${data.advisory_type}`);
    }
    
    // Generuj sensowną odpowiedź zastępczą na podstawie typu doradcy
    let fallbackAdvice = "Nie udało się uzyskać szczegółowej porady.";
    
    switch(data.advisory_type) {
      case "financial":
        fallbackAdvice = "Doradca finansowy: Analiza Twojego podejścia do budżetowania zostanie przeprowadzona przy kolejnym zapytaniu.";
        break;
      case "investment":
        fallbackAdvice = "Doradca inwestycyjny: Ocena Twojego podejścia do inwestycji zostanie przeprowadzona przy kolejnym zapytaniu.";
        break;
      case "legal":
        fallbackAdvice = "Doradca prawny: Analiza Twojego stosunku do formalizacji zostanie przeprowadzona przy kolejnym zapytaniu.";
        break;
      case "tax":
        fallbackAdvice = "Doradca podatkowy: Ocena Twojej strategii podatkowej zostanie przeprowadzona przy kolejnym zapytaniu.";
        break;
      default:
        fallbackAdvice = "Specjalistyczna porada zostanie dostarczona przy kolejnym zapytaniu.";
    }
    
    // Zwróć obiekt w oczekiwanym formacie z odpowiedzią zastępczą
    return {
      answer: fallbackAdvice,
      status: "error", 
      advisor_type: data.advisory_type
    };
  }
}

export default {
  sendAIMessage,
  sendFinancialChatMessage,
  getSpecializedAdvice
};