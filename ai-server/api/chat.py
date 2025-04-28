import time
import logging
import sys
import os
from fastapi import APIRouter, HTTPException, FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from ai.tree_model import TreeModel
from api.analysis import get_latest_data
import spacy
from utils.logger import logger
import psycopg2

# Import modułów doradztwa finansowego
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor
from core.financial_models import AdvisoryRequest, AdvisoryResponse

# Załaduj model językowy spaCy
nlp = spacy.load("en_core_web_sm")
print("Model spaCy załadowany poprawnie!")
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
router = APIRouter()
logger = logging.getLogger("chat")

# Inicjalizacja doradców finansowych
financial_advisor = FinancialLegalAdvisor()
investment_advisor = InvestmentAdvisor()

# Schematy danych czatu
class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str = Field(..., example="Tell me about investments")

class ChatRequest(BaseModel):
    user_id: int
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str

class FinancialChatRequest(BaseModel):
    user_id: int
    question: str
    context: Dict[str, any] = Field(default_factory=dict)
    advisory_type: str = Field(default="financial", example="financial")
    language: str = Field(default="pl", example="pl")

# Inicjalizacja instancji modeli i historii rozmowy
tree_model = TreeModel()
conversation_history = []  # Globalna historia rozmowy

def get_db_connection():
    """
    Tworzy połączenie z bazą danych PostgreSQL.
    """
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        return conn
    except Exception as e:
        logger.error(f"Błąd połączenia z bazą danych: {str(e)}")
        raise

def save_interaction_to_database(user_id: int, question: str, reply: str, advisor_type: str = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Sprawdź, czy tabela ma kolumnę advisor_type
        if advisor_type is not None:
            cur.execute("""
                INSERT INTO chat_interactions (user_id, question, reply, advisor_type, timestamp)
                VALUES (%s, %s, %s, %s, NOW())
            """, (user_id, question, reply, advisor_type))
        else:
            cur.execute("""
                INSERT INTO chat_interactions (user_id, question, reply, timestamp)
                VALUES (%s, %s, %s, NOW())
            """, (user_id, question, reply))
            
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Interakcja została zapisana do bazy danych.")
    except Exception as e:
        logger.error(f"Błąd zapisywania interakcji do bazy danych: {str(e)}")
        # Tutaj możesz rozważyć podanie szczegółów błędu zamiast tylko logowania
        raise HTTPException(status_code=500, detail=f"Błąd zapisywania danych: {str(e)}")

def generate_chat_reply(messages: List[ChatMessage], user_id: Optional[int] = None) -> str:
    """
    Generuje odpowiedź na podstawie wiadomości użytkownika i zapisuje interakcję.
    """
    logger.info(f"Otrzymane wiadomości: {messages}")
    # Pobierz ostatnią wiadomość od użytkownika
    user_msgs = [msg.content for msg in messages if msg.role.lower() == "user"]
    if not user_msgs:
        return "Proszę, napisz coś, abym mógł Ci odpowiedzieć."
    latest_message = user_msgs[-1]

    # Symulacja "myślenia" czatu – opóźnienie dla realizmu
    time.sleep(1)

    # Tokenizacja za pomocą spaCy
    doc = nlp(latest_message.lower())
    tokens = [token.text for token in doc]

    # Sprawdź, czy pytanie dotyczy finansów, inwestycji lub prawa
    financial_keywords = ["finanse", "pieniądze", "budżet", "oszczędności", "wydatki", "dochody"]
    investment_keywords = ["inwestycje", "portfel", "akcje", "obligacje", "etf", "fundusz", "giełda"]
    legal_keywords = ["prawo", "podatki", "przepisy", "ustawa", "regulacje", "pit", "vat", "cit"]

    # Sprawdź, czy pytanie dotyczy doradztwa finansowego, inwestycyjnego lub prawnego
    if any(keyword in tokens for keyword in financial_keywords + legal_keywords):
        try:
            # Utwórz żądanie doradztwa finansowego/prawnego
            advisory_request = AdvisoryRequest(
                user_id=user_id or 1,
                question=latest_message,
                context={},
                advisory_type="financial",
                language="pl"
            )
            # Uzyskaj odpowiedź od doradcy finansowego
            response = financial_advisor.process_advisory_request(advisory_request)
            reply = response.answer
        except Exception as e:
            logger.error(f"Błąd generowania porady finansowej/prawnej: {str(e)}")
            reply = "Przepraszam, wystąpił problem przy generowaniu porady finansowej. Spróbuj ponownie później."
    
    elif any(keyword in tokens for keyword in investment_keywords):
        try:
            # Utwórz żądanie doradztwa inwestycyjnego
            advisory_request = AdvisoryRequest(
                user_id=user_id or 1,
                question=latest_message,
                context={},
                advisory_type="investment",
                language="pl"
            )
            # Uzyskaj odpowiedź od doradcy inwestycyjnego
            response = investment_advisor.process_advisory_request(advisory_request)
            reply = response.answer
        except Exception as e:
            logger.error(f"Błąd generowania porady inwestycyjnej: {str(e)}")
            reply = "Przepraszam, wystąpił problem przy generowaniu porady inwestycyjnej. Spróbuj ponownie później."
    
    # Analiza intencji na podstawie tokenów - istniejąca logika
    elif "dochody" in tokens or "kredyt" in tokens or "auto" in tokens:
        try:
            # Analiza finansowa na podstawie danych użytkownika
            income = next((float(token) for token in tokens if token.isdigit()), None)
            if income:
                reply = (
                    f"Twoje dochody wynoszą {income} zł. "
                    "Jeśli masz kredyt na 30 tysięcy zł i planujesz zakup auta, "
                    "rozważ oszczędzanie na wkład własny oraz zmniejszenie zadłużenia przed inwestowaniem."
                )
            else:
                reply = "Proszę podać swoje dochody w liczbach, abym mógł lepiej doradzić."
        except Exception as e:
            logger.error("Błąd analizy danych finansowych: " + str(e))
            reply = "Wystąpił problem przy analizie Twoich danych finansowych."
    elif "dane" in tokens or "analiza" in tokens:
        try:
            # Pobieramy najnowsze dane analityczne za pomocą funkcji get_latest_data
            data = get_latest_data(user_id) if user_id else "Brak ID użytkownika."
            reply = f"Na podstawie analizy, oto najnowsze dane: {data}"
        except Exception as e:
            logger.error("Błąd pobierania danych analitycznych: " + str(e))
            reply = "Wystąpił problem przy pobieraniu danych analitycznych."
    else:
        try:
            # Generujemy odpowiedź za pomocą logiki drzewa decyzyjnego
            reply = tree_model.predict_response(latest_message)
        except Exception as e:
            logger.error("Błąd generowania odpowiedzi przez model drzewa: " + str(e))
            reply = f"Przepraszam, wystąpił błąd: {str(e)}"

    # Zapisz interakcję do bazy danych
    if user_id:
        save_interaction_to_database(user_id, latest_message, reply)

    logger.info(f"Wygenerowana odpowiedź: {reply}")
    return reply

@router.post("/chat", tags=["Chat"])
async def chat_with_assistant(request: ChatRequest):
    try:
        logger.info(f"Otrzymano żądanie: {request}")
        # Walidacja danych wejściowych
        if not request.messages or not isinstance(request.messages, list):
            return {"result": "Nieprawidłowy format wiadomości."}
        
        reply = generate_chat_reply(request.messages, user_id=request.user_id)
        logger.info(f"Zwracana odpowiedź: {reply}")
        
        # Zwróć odpowiedź tylko z polem result, bez pola reply
        return {"result": reply}
    except Exception as e:
        logger.error("Błąd w endpointcie chat: " + str(e))
        return {"result": f"Przepraszam, wystąpił błąd: {str(e)}"}

@router.post("/financial-chat", response_model=ChatResponse, tags=["Financial Chat"])
async def financial_chat(request: FinancialChatRequest):
    """
    Endpoint do obsługi rozmowy z doradcą finansowym.
    """
    try:
        logger.info(f"Otrzymano żądanie doradztwa finansowego: {request}")
        
        # Utwórz żądanie doradztwa
        advisory_request = AdvisoryRequest(
            user_id=request.user_id,
            question=request.question,
            context=request.context,
            advisory_type=request.advisory_type,
            language=request.language
        )
        
        # Wybierz odpowiedniego doradcę na podstawie typu doradztwa
        if request.advisory_type in ["financial", "legal", "tax"]:
            response = financial_advisor.process_advisory_request(advisory_request)
        elif request.advisory_type in ["investment", "portfolio"]:
            response = investment_advisor.process_advisory_request(advisory_request)
        else:
            # Domyślnie użyj doradcy finansowego
            response = financial_advisor.process_advisory_request(advisory_request)
        
        # Zapisz interakcję do bazy danych
        save_interaction_to_database(request.user_id, request.question, response.answer)
        
        logger.info(f"Zwracana odpowiedź doradztwa: {response.answer}")
        return ChatResponse(reply=response.answer)
    except Exception as e:
        logger.error(f"Błąd w endpointcie financial-chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))