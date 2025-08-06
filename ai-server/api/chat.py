import logging
import os
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from ai.tree_model import TreeModel
from api.analysis import get_latest_data
import spacy
from utils.logger import logger
import psycopg2
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor
from core.financial_models import AdvisoryRequest, AdvisoryResponse
from openai import OpenAI  # Updated import
from datetime import datetime
import time
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from core.db_manager import get_db_connection, get_db_cursor
# Inicjalizacja routera
chat_router = APIRouter(tags=["Chat"])

# Załaduj model językowy spaCy
try:
    nlp = spacy.load("en_core_web_sm")
    print("Model spaCy załadowany poprawnie!")
except OSError:
    print("Nie można załadować modelu spaCy. Instaluj: python -m spacy download en_core_web_sm")
    nlp = None

# Initialize OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

# Initialize OpenAI client
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    logger.info("OpenAI client initialized successfully")
else:
    logger.warning("OPENAI_API_KEY not found in environment variables. ChatGPT functionality will be disabled.")

# Inicjalizacja doradców finansowych
financial_advisor = FinancialLegalAdvisor()
investment_advisor = InvestmentAdvisor()

# Inicjalizacja instancji modelu drzewa decyzyjnego
tree_model = TreeModel()

# Database connection manager
@contextmanager
def get_db_connection_safe():
    """Context manager for safe database connections."""
    conn = None
    try:
        # If get_db_connection returns a context manager, use it directly
        if hasattr(get_db_connection(), '__enter__'):
            with get_db_connection() as conn:
                yield conn
        else:
            # If it returns a direct connection
            conn = get_db_connection()
            yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        if conn and not hasattr(get_db_connection(), '__enter__'):
            conn.close()

# Enhanced Schemas for chat functionality
class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str = Field(..., example="Tell me about investments")
    timestamp: Optional[datetime] = Field(default=None)

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    user_id: int
    messages: List[ChatMessage]
    use_chatgpt: Optional[bool] = Field(default=False, description="Whether to use ChatGPT for response")
    model: Optional[str] = Field(default="gpt-3.5-turbo", description="ChatGPT model to use")
    advisor_id: Optional[str] = Field(default="general", description="Advisor type")
    session_id: Optional[str] = Field(default=None, description="Session identifier")

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    reply: str
    model_used: Optional[str] = Field(default=None, description="Which model generated the response")
    response_time: Optional[float] = Field(default=None, description="Response time in seconds")
    sentiment: Optional[str] = Field(default=None, description="Sentiment analysis result")
    confidence: Optional[float] = Field(default=None, description="Confidence score")
    advisor_used: Optional[str] = Field(default=None, description="Advisor type used")

    class Config:
        from_attributes = True

class FinancialChatRequest(BaseModel):
    user_id: int
    question: str
    context: Dict[str, Any] = Field(default_factory=dict)
    advisory_type: str = Field(default="financial", example="financial")
    language: str = Field(default="pl", example="pl")
    use_chatgpt: Optional[bool] = Field(default=False, description="Whether to use ChatGPT for enhanced responses")
    model: Optional[str] = Field(default="gpt-3.5-turbo", description="ChatGPT model to use")
    advisor_id: Optional[str] = Field(default="financial", description="Advisor identifier")
    session_id: Optional[str] = Field(default=None, description="Session identifier")

    class Config:
        arbitrary_types_allowed = True
        from_attributes = True

class ChatGPTRequest(BaseModel):
    user_id: int
    message: str
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list)
    model: Optional[str] = Field(default="gpt-3.5-turbo", description="ChatGPT model to use")
    max_tokens: Optional[int] = Field(default=500, description="Maximum tokens in response")
    temperature: Optional[float] = Field(default=0.7, description="Response creativity (0.0-1.0)")
    system_prompt: Optional[str] = Field(default=None, description="System prompt for ChatGPT")
    advisor_id: Optional[str] = Field(default="financial", description="Advisor type")

    class Config:
        from_attributes = True

class OpenAIChatRequest(BaseModel):
    message: str
    advisorId: str
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    userProfile: Optional[Dict[str, Any]] = None
    decisionPath: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    model: Optional[str] = Field(default="gpt-3.5-turbo")
    temperature: Optional[float] = Field(default=0.7)

class EnhancedResponseRequest(BaseModel):
    message: str = Field(..., description="User message")
    advisor_id: str = Field(default="financial", description="Advisor type")
    user_id: Optional[str] = Field(default=None, description="User ID")
    use_chatgpt: bool = Field(default=True, description="Whether to use ChatGPT")
    model: str = Field(default="gpt-3.5-turbo", description="ChatGPT model to use")

def save_interaction_to_database(user_id: str, question: str = None, reply: str = None, 
                                advisor_type: str = None, model_used: str = None,
                                sentiment_score: float = None, sentiment_label: str = None, 
                                session_id: str = None, response_time_ms: int = None, 
                                context: Dict[str, Any] = None):
    """
    Zapisuje interakcję do bazy danych - FIXED VERSION.
    """
    try:
        with get_db_connection_safe() as conn:
            with conn.cursor() as cur:
                # Sprawdź, czy tabela ma wszystkie kolumny
                cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='chat_interactions'")
                columns = [row[0] for row in cur.fetchall()]
                
                context_json = json.dumps(context) if context else None
                
                # Dopasuj do istniejącej struktury tabeli
                if all(col in columns for col in ['user_id', 'question', 'reply', 'advisor_type', 'sentiment_score', 'sentiment_label', 'session_id', 'response_time_ms', 'context']):
                    cur.execute("""
                        INSERT INTO chat_interactions (
                            user_id, question, reply, advisor_type, sentiment_score, sentiment_label, 
                            session_id, response_time_ms, context, timestamp
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """, (user_id, question, reply, advisor_type, sentiment_score, sentiment_label, 
                          session_id, response_time_ms, context_json))
                elif 'advisor_type' in columns and 'model_used' in columns:
                    cur.execute("""
                        INSERT INTO chat_interactions (user_id, question, reply, advisor_type, model_used, timestamp)
                        VALUES (%s, %s, %s, %s, %s, NOW())
                    """, (user_id, question, reply, advisor_type, model_used))
                elif 'advisor_type' in columns:
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
            
        logger.info(f"Interakcja została zapisana do bazy danych - user: {user_id}, advisor: {advisor_type}")
    except Exception as e:
        logger.error(f"Błąd zapisywania interakcji do bazy danych: {str(e)}")

def get_advisor_system_prompt(advisor_id: str) -> str:
    """
    Zwraca system prompt dla różnych typów doradców - kompatybilne z main.py.
    """
    prompts = {
        "retirement": """Jesteś Doradcą Emerytalnym w aplikacji DisiNow. Specjalizujesz się w planowaniu zabezpieczenia emerytalnego i długoterminowych inwestycji. 
        Udzielaj praktycznych porad dotyczących oszczędzania na emeryturę, funduszy emerytalnych, III filaru, IKE, IKZE i planowania długoterminowego. 
        Odpowiadaj w języku polskim, bądź pomocny, profesjonalny i skupiaj się na praktycznych rozwiązaniach dostępnych w Polsce.""",
        
        "investment": """Jesteś Doradcą Inwestycyjnym w aplikacji DisiNow. Specjalizujesz się w budowaniu portfeli inwestycyjnych, analizie rynków finansowych i strategiach inwestycyjnych.
        Pomagaj użytkownikom w wyborze odpowiednich instrumentów inwestycyjnych dostępnych w Polsce (akcje, obligacje, ETF, fundusze), zarządzaniu ryzykiem i optymalizacji zwrotów.
        Odpowiadaj w języku polskim i uwzględniaj polskie realia podatkowe.""",
        
        "savings": """Jesteś Doradcą Oszczędnościowym w aplikacji DisiNow. Specjalizujesz się w budżetowaniu, oszczędzaniu i planowaniu finansowym.
        Pomagaj użytkownikom w tworzeniu planów oszczędnościowych, optymalizacji wydatków, budowaniu funduszu awaryjnego i wyborze najlepszych kont oszczędnościowych w Polsce.
        Odpowiadaj w języku polskim i dawaj praktyczne porady.""",
        
        "debt": """Jesteś Doradcą ds. Długów w aplikacji DisiNow. Specjalizujesz się w spłacie zobowiązań, konsolidacji długów i poprawie sytuacji finansowej.
        Pomagaj użytkownikom w strategiach spłaty długów, negocjacjach z bankami, konsolidacji kredytów i odbudowie zdolności kredytowej zgodnie z polskim prawem.
        Odpowiadaj w języku polskim i uwzględniaj polskie przepisy finansowe.""",
        
        "financial": """Jesteś Doradcą Finansowym w aplikacji DisiNow. Pomagasz użytkownikom w sprawach finansowych, prawnych i podatkowych.
        Udzielasz porad dotyczących budżetowania, inwestycji, podatków, przepisów finansowych i planowania finansowego.
        Odpowiadaj w języku polskim, bądź pomocny i profesjonalny.""",
        
        "general": """Jesteś asystentem finansowym w aplikacji DisiNow. Pomagasz użytkownikom w podstawowych sprawach finansowych.
        Odpowiadaj w języku polskim, bądź pomocny i profesjonalny."""
    }
    return prompts.get(advisor_id, prompts["financial"])

async def call_chatgpt_api(messages: List[Dict[str, str]], model: str = "gpt-3.5-turbo", 
                          max_tokens: int = 500, temperature: float = 0.7) -> str:
    """
    Wywołuje API ChatGPT - FIXED VERSION using new OpenAI client.
    """
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI client is not configured")
    
    try:
        response = openai_client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        logger.error(f"Error calling ChatGPT API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calling ChatGPT API: {str(e)}")

def prepare_chatgpt_messages(conversation_history: List[ChatMessage], current_message: str, 
                           system_prompt: Optional[str] = None, user_profile: Dict = None) -> List[Dict[str, str]]:
    """
    Przygotowuje wiadomości w formacie wymaganym przez API ChatGPT.
    """
    messages = []
    
    # Dodaj system prompt
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    else:
        messages.append({
            "role": "system", 
            "content": "Jesteś pomocnym asystentem finansowym w aplikacji DisiNow. Odpowiadasz w języku polskim i udzielasz praktycznych porad finansowych."
        })
    
    # Dodaj kontekst użytkownika jeśli dostępny
    if user_profile:
        profile_context = f"\nKontekst użytkownika: Imię: {user_profile.get('name', 'N/A')}, " \
                         f"Cel finansowy: {user_profile.get('financialGoal', 'N/A')}, " \
                         f"Miesięczny dochód: {user_profile.get('monthlyIncome', 'N/A')}, " \
                         f"Obecne oszczędności: {user_profile.get('currentSavings', 'N/A')}"
        messages[0]["content"] += profile_context
    
    # Dodaj historię konwersacji (maksymalnie ostatnie 6 wiadomości)
    recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
    for msg in recent_history:
        messages.append({"role": msg.role, "content": msg.content})
    
    # Dodaj aktualną wiadomość
    if current_message:
        messages.append({"role": "user", "content": current_message})
    
    return messages

def generate_fallback_response(message: str, advisor_id: str = "financial") -> str:
    """
    Generuje odpowiedź lokalnie gdy ChatGPT nie jest dostępny - FIXED VERSION.
    """
    try:
        # Fix spaCy token extraction
        if nlp:
            doc = nlp(message.lower())
            tokens = [token.text for token in doc]
        else:
            tokens = message.lower().split()

        # Sprawdź kategorie
        financial_keywords = ["finanse", "pieniądze", "budżet", "oszczędności", "wydatki", "dochody"]
        investment_keywords = ["inwestycje", "portfel", "akcje", "obligacje", "etf", "fundusz", "giełda"]
        legal_keywords = ["prawo", "podatki", "przepisy", "ustawa", "regulacje", "pit", "vat", "cit"]

        # Utwórz żądanie doradztwa
        advisory_request = AdvisoryRequest(
            user_id=1,
            question=message,
            context={},
            advisory_type="financial",
            language="pl"
        )

        if any(keyword in tokens for keyword in financial_keywords + legal_keywords):
            advisory_request.advisory_type = "financial"
            response = financial_advisor.process_advisory_request(advisory_request)
            return response.answer
        elif any(keyword in tokens for keyword in investment_keywords):
            advisory_request.advisory_type = "investment"
            response = investment_advisor.process_advisory_request(advisory_request)
            return response.answer
        else:
            return tree_model.predict_response(message)
            
    except Exception as e:
        logger.error(f"Błąd w fallback response: {str(e)}")
        return "Przepraszam, wystąpił problem z uzyskaniem odpowiedzi. Czy możesz powtórzyć swoje pytanie?"

def analyze_sentiment(text: str) -> tuple[float, str]:
    """
    Analiza sentymentu tekstu - kompatybilna z main.py.
    """
    try:
        from textblob import TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        label = "positive" if polarity > 0.1 else "negative" if polarity < -0.1 else "neutral"
        return polarity, label
    except Exception as e:
        logger.warning(f"Sentiment analysis failed: {str(e)}")
        return 0.0, "neutral"

def get_chat_history(user_id: str, advisor_id: str, limit: int = 10) -> List[Dict]:
    """
    Pobiera historię czatu z bazy danych - FIXED VERSION.
    """
    try:
        # Handle undefined values
        if not user_id or user_id == "undefined":
            return []
        if not advisor_id or advisor_id == "undefined":
            advisor_id = "financial"
            
        with get_db_connection_safe() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT question, reply, timestamp, sentiment_label
                    FROM chat_interactions 
                    WHERE user_id = %s AND advisor_type = %s
                    ORDER BY timestamp DESC 
                    LIMIT %s
                """, (user_id, advisor_id, limit))
                
                results = cur.fetchall()
        
        # Format for ChatGPT
        history = []
        for question, reply, timestamp, sentiment in reversed(results):
            if question:
                history.append({"role": "user", "content": question})
            if reply:
                history.append({"role": "assistant", "content": reply})
        
        return history
        
    except Exception as e:
        logger.error(f"Błąd pobierania historii: {str(e)}")
        return []

async def generate_openai_response(message: str, advisor_id: str, user_id: str, 
                                 user_profile: Dict = None, chat_history: List = None,
                                 model: str = "gpt-3.5-turbo") -> str:
    """
    Generuje odpowiedź z OpenAI - FIXED VERSION.
    """
    try:
        if not openai_client:
            raise Exception("OpenAI client not initialized")
            
        system_prompt = get_advisor_system_prompt(advisor_id)
        
        # Przygotuj wiadomości
        messages = [{"role": "system", "content": system_prompt}]
        
        # Dodaj profil użytkownika do kontekstu
        if user_profile:
            profile_context = f"\nKontekst użytkownika: Imię: {user_profile.get('name', 'N/A')}, " \
                            f"Cel finansowy: {user_profile.get('financialGoal', 'N/A')}, " \
                            f"Miesięczny dochód: {user_profile.get('monthlyIncome', 'N/A')}, " \
                            f"Obecne oszczędności: {user_profile.get('currentSavings', 'N/A')}"
            messages[0]["content"] += profile_context
        
        # Dodaj historię
        if chat_history:
            messages.extend(chat_history[-6:])  # Last 6 messages
        
        # Dodaj aktualne pytanie
        messages.append({"role": "user", "content": message})
        
        # Wywołaj OpenAI
        response = openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        logger.error(f"Błąd OpenAI: {str(e)}")
        return generate_fallback_response(message, advisor_id)

# ENDPOINTY API - kompatybilne z istniejącą strukturą

@chat_router.post("/send")
async def openai_chat_send(request: OpenAIChatRequest):
    """
    Główny endpoint dla czatu z OpenAI - FIXED VERSION.
    """
    start_time = time.time()
    try:
        user_id = request.userId or str(int(time.time()))
        session_id = request.sessionId or str(int(time.time()))
        
        # Handle undefined advisor
        advisor_id = request.advisorId
        if not advisor_id or advisor_id == "undefined":
            advisor_id = "financial"
        
        # Analiza sentymentu
        user_sentiment_score, user_sentiment_label = analyze_sentiment(request.message)
        
        # Pobierz historię
        chat_history = get_chat_history(user_id, advisor_id)
        
        # Generuj odpowiedź AI
        ai_response = await generate_openai_response(
            request.message, 
            advisor_id, 
            user_id, 
            request.userProfile, 
            chat_history,
            request.model
        )
        
        # Analiza sentymentu odpowiedzi
        ai_sentiment_score, ai_sentiment_label = analyze_sentiment(ai_response)
        
        # Oblicz czas odpowiedzi
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Zapisz do bazy
        save_interaction_to_database(
            user_id=user_id,
            question=request.message,
            reply=ai_response,
            advisor_type=advisor_id,
            model_used=request.model,
            sentiment_score=ai_sentiment_score,
            sentiment_label=ai_sentiment_label,
            session_id=session_id,
            response_time_ms=response_time_ms
        )
        
        return {
            "response": ai_response,
            "sentiment": ai_sentiment_label,
            "userSentiment": user_sentiment_label,
            "confidence": abs(ai_sentiment_score),
            "responseTime": response_time_ms,
            "advisorUsed": advisor_id
        }
        
    except Exception as e:
        logger.error(f"Błąd w OpenAI chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@chat_router.post("/")
async def chat_with_assistant(request: ChatRequest):
    """
    Endpoint do obsługi rozmowy z asystentem - FIXED VERSION.
    """
    start_time = time.time()
    try:
        if not request.messages or not isinstance(request.messages, list):
            raise HTTPException(status_code=422, detail="Nieprawidłowy format wiadomości.")
        
        # Pobierz ostatnią wiadomość użytkownika
        user_msgs = [msg.content for msg in request.messages if msg.role.lower() == "user"]
        if not user_msgs:
            return ChatResponse(reply="Proszę, napisz coś, abym mógł Ci odpowiedzieć.", model_used="local")
        
        latest_message = user_msgs[-1]
        user_id = str(request.user_id)
        model_used = "local"
        
        # Handle undefined advisor_id
        advisor_id = request.advisor_id
        if not advisor_id or advisor_id == "undefined":
            advisor_id = "financial"
        
        # Jeśli włączono ChatGPT, użyj go
        if request.use_chatgpt and openai_client:
            try:
                system_prompt = get_advisor_system_prompt(advisor_id)
                chatgpt_messages = prepare_chatgpt_messages(
                    request.messages[:-1], 
                    latest_message, 
                    system_prompt
                )
                
                reply = await call_chatgpt_api(chatgpt_messages, request.model)
                model_used = request.model
                
                # Analiza sentymentu
                sentiment_score, sentiment_label = analyze_sentiment(reply)
                
                # Zapisz interakcję
                response_time = (time.time() - start_time) * 1000
                save_interaction_to_database(
                    user_id, latest_message, reply, advisor_id, 
                    model_used, sentiment_score, sentiment_label, 
                    request.session_id, int(response_time)
                )
                
                return ChatResponse(
                    reply=reply, 
                    model_used=model_used, 
                    response_time=time.time() - start_time,
                    sentiment=sentiment_label,
                    confidence=abs(sentiment_score),
                    advisor_used=advisor_id
                )
                
            except Exception as e:
                logger.error(f"Error using ChatGPT, falling back to local model: {str(e)}")
        
        # Lokalna logika (fallback)
        reply = generate_fallback_response(latest_message, advisor_id)
        sentiment_score, sentiment_label = analyze_sentiment(reply)
        
        # Zapisz interakcję
        response_time = (time.time() - start_time) * 1000
        save_interaction_to_database(
            user_id, latest_message, reply, advisor_id, 
            model_used, sentiment_score, sentiment_label, 
            request.session_id, int(response_time)
        )
        
        return ChatResponse(
            reply=reply, 
            model_used=model_used, 
            response_time=time.time() - start_time,
            sentiment=sentiment_label,
            confidence=abs(sentiment_score),
            advisor_used=advisor_id
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Błąd w endpointcie chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wystąpił błąd: {str(e)}")

@chat_router.post("/financial")
async def financial_chat(request: FinancialChatRequest):
    """
    Endpoint do obsługi rozmowy z doradcą finansowym - FIXED VERSION.
    """
    start_time = time.time()
    try:
        user_id = str(request.user_id)
        
        # Jeśli włączono ChatGPT, użyj go do wzbogacenia odpowiedzi
        if request.use_chatgpt and openai_client:
            try:
                chat_history = get_chat_history(user_id, request.advisor_id or request.advisory_type)
                ai_response = await generate_openai_response(
                    request.question, 
                    request.advisor_id or request.advisory_type, 
                    user_id, 
                    chat_history=chat_history,
                    model=request.model
                )
                model_used = f"openai_{request.model}"
            except Exception as e:
                logger.warning(f"ChatGPT failed, using local advisor: {str(e)}")
                # Fallback do lokalnego doradcy
                advisory_request = AdvisoryRequest(
                    user_id=request.user_id,
                    question=request.question,
                    context=request.context,
                    advisory_type=request.advisory_type,
                    language=request.language
                )
                
                if request.advisory_type in ["financial", "legal", "tax"]:
                    response = financial_advisor.process_advisory_request(advisory_request)
                elif request.advisory_type in ["investment", "portfolio"]:
                    response = investment_advisor.process_advisory_request(advisory_request)
                else:
                    response = financial_advisor.process_advisory_request(advisory_request)
                
                ai_response = response.answer
                model_used = f"local_{request.advisory_type}"
        else:
            # Użyj lokalnego doradcy
            advisory_request = AdvisoryRequest(
                user_id=request.user_id,
                question=request.question,
                context=request.context,
                advisory_type=request.advisory_type,
                language=request.language
            )
            
            if request.advisory_type in ["financial", "legal", "tax"]:
                response = financial_advisor.process_advisory_request(advisory_request)
            elif request.advisory_type in ["investment", "portfolio"]:
                response = investment_advisor.process_advisory_request(advisory_request)
            else:
                response = financial_advisor.process_advisory_request(advisory_request)
            
            ai_response = response.answer
            model_used = f"local_{request.advisory_type}"
        
        # Analiza sentymentu
        sentiment_score, sentiment_label = analyze_sentiment(ai_response)
        response_time = (time.time() - start_time) * 1000
        
        # Zapisz interakcję
        save_interaction_to_database(
            user_id=user_id,
            question=request.question,
            reply=ai_response,
            advisor_type=request.advisory_type,
            model_used=model_used,
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label,
            session_id=request.session_id,
            response_time_ms=int(response_time),
            context=request.context
        )
        
        return ChatResponse(
            reply=ai_response,
            model_used=model_used,
            response_time=time.time() - start_time,
            sentiment=sentiment_label,
            confidence=abs(sentiment_score),
            advisor_used=request.advisory_type
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Błąd w endpointcie financial-chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wystąpił błąd: {str(e)}")

@chat_router.post("/chatgpt-direct")
async def chatgpt_direct(request: ChatGPTRequest):
    """
    Bezpośredni endpoint do komunikacji z ChatGPT - FIXED VERSION.
    """
    try:
        if not openai_client:
            raise HTTPException(status_code=500, detail="OpenAI client is not configured")
        
        start_time = time.time()
        user_id = str(request.user_id)
        
        # Przygotuj wiadomości dla ChatGPT
        system_prompt = request.system_prompt or get_advisor_system_prompt(request.advisor_id)
        chatgpt_messages = prepare_chatgpt_messages(
            request.conversation_history, 
            request.message, 
            system_prompt
        )
        
        # Wywołaj ChatGPT API
        reply = await call_chatgpt_api(
            chatgpt_messages, 
            request.model, 
            request.max_tokens, 
            request.temperature
        )
        
        # Analiza sentymentu
        sentiment_score, sentiment_label = analyze_sentiment(reply)
        response_time = (time.time() - start_time) * 1000
        
        # Zapisz interakcję do bazy danych
        save_interaction_to_database(
            user_id, request.message, reply, request.advisor_id, 
            request.model, sentiment_score, sentiment_label, 
            None, int(response_time)
        )
        
        return ChatResponse(
            reply=reply, 
            model_used=request.model, 
            response_time=time.time() - start_time,
            sentiment=sentiment_label,
            confidence=abs(sentiment_score),
            advisor_used=request.advisor_id
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Błąd w endpointcie chatgpt-direct: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wystąpił błąd: {str(e)}")

@chat_router.get("/history/{advisor_id}")
async def get_chat_history_endpoint(advisor_id: str, user_id: str):
    """
    Endpoint pobierający historię czatu - FIXED VERSION.
    """
    try:
        if not user_id or user_id == "undefined":
            return {"messages": []}
        
        if not advisor_id or advisor_id == "undefined":
            advisor_id = "financial"
        
        with get_db_connection_safe() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT question, reply, timestamp, sentiment_label, response_time_ms
                    FROM chat_interactions 
                    WHERE user_id = %s AND advisor_type = %s
                    ORDER BY timestamp ASC
                """, (user_id, advisor_id))
                
                results = cur.fetchall()
        
        # Format messages for frontend
        formatted_messages = []
        for question, reply, timestamp, sentiment, response_time in results:
            if question:
                formatted_messages.append({
                    "id": f"user_{int(timestamp.timestamp())}",
                    "content": question,
                    "role": "user",
                    "timestamp": timestamp.isoformat(),
                    "advisorId": advisor_id
                })
            if reply:
                formatted_messages.append({
                    "id": f"assistant_{int(timestamp.timestamp())}",
                    "content": reply,
                    "role": "assistant",
                    "timestamp": timestamp.isoformat(),
                    "advisorId": advisor_id,
                    "sentiment": sentiment,
                    "responseTime": response_time
                })
        
        return {"messages": formatted_messages}
        
    except Exception as e:
        logger.error(f"Błąd pobierania historii: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@chat_router.get("/models")
async def get_available_models():
    """
    Endpoint zwracający dostępne modele ChatGPT - FIXED VERSION.
    """
    try:
        if not openai_client:
            return {
                "models": ["gpt-3.5-turbo", "gpt-4"], 
                "error": "OpenAI client not configured"
            }
        
        models = openai_client.models.list()
        
        # Filtruj tylko modele chat
        chat_models = [
            model.id for model in models.data 
            if 'gpt' in model.id.lower() and any(x in model.id for x in ['3.5', '4'])
        ]
        
        return {"models": sorted(chat_models)}
        
    except Exception as e:
        logger.error(f"Błąd pobierania modeli: {str(e)}")
        return {
            "models": ["gpt-3.5-turbo", "gpt-4"], 
            "error": "Using default models due to API error"
        }

@chat_router.get("/health")
async def health_check():
    """
    Endpoint sprawdzający stan usługi chat - FIXED VERSION.
    """
    return {
        "status": "healthy",
        "chatgpt_available": bool(OPENAI_API_KEY),
        "openai_client_ready": openai_client is not None,
        "spacy_available": bool(nlp),
        "database_available": True,
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }

@chat_router.get("/advisors")
async def get_available_advisors():
    """
    Endpoint zwracający dostępnych doradców.
    """
    advisors = [
        {
            "id": "financial",
            "name": "Doradca Finansowy",
            "description": "Specjalista od budżetowania, oszczędności i planowania finansowego",
            "icon": "💰"
        },
        {
            "id": "investment", 
            "name": "Doradca Inwestycyjny",
            "description": "Ekspert od portfeli inwestycyjnych i strategii inwestycyjnych",
            "icon": "📈"
        },
        {
            "id": "retirement",
            "name": "Doradca Emerytalny", 
            "description": "Specjalista od planowania zabezpieczenia emerytalnego",
            "icon": "🏦"
        },
        {
            "id": "debt",
            "name": "Doradca ds. Długów",
            "description": "Ekspert od spłaty zobowiązań i konsolidacji długów", 
            "icon": "🎯"
        },
        {
            "id": "savings",
            "name": "Doradca Oszczędnościowy",
            "description": "Specjalista od budżetowania i oszczędzania",
            "icon": "💡"
        }
    ]
    
    return {"advisors": advisors}

@chat_router.post("/analyze-sentiment")
async def analyze_message_sentiment(message: str):
    """
    Endpoint do analizy sentymentu wiadomości.
    """
    try:
        sentiment_score, sentiment_label = analyze_sentiment(message)
        return {
            "message": message,
            "sentiment": sentiment_label,
            "score": sentiment_score,
            "confidence": abs(sentiment_score)
        }
    except Exception as e:
        logger.error(f"Błąd analizy sentymentu: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced response endpoint with proper request model
@chat_router.post("/enhanced-response")
async def get_enhanced_response(request: EnhancedResponseRequest):
    """
    Endpoint do uzyskiwania wzmocnionych odpowiedzi (lokalny + ChatGPT) - FIXED VERSION.
    """
    try:
        start_time = time.time()
        user_id = request.user_id or str(int(time.time()))
        
        # Najpierw uzyskaj odpowiedź lokalnego doradcy
        local_response = generate_fallback_response(request.message, request.advisor_id)
        
        if request.use_chatgpt and openai_client:
            try:
                # Użyj ChatGPT do wzbogacenia odpowiedzi
                enhanced_prompt = f"""
                Jako ekspert finansowy, zoptymalizuj i wzbogać następującą odpowiedź:
                
                Oryginalna odpowiedź: {local_response}
                
                Pytanie użytkownika: {request.message}
                
                Proszę o udoskonalenie odpowiedzi, zachowując wszystkie istotne informacje 
                i dodając praktyczne wskazówki. Odpowiadaj w języku polskim.
                """
                
                chatgpt_messages = [
                    {"role": "system", "content": get_advisor_system_prompt(request.advisor_id)},
                    {"role": "user", "content": enhanced_prompt}
                ]
                
                enhanced_response = await call_chatgpt_api(chatgpt_messages, request.model)
                final_response = enhanced_response
                model_used = f"hybrid_{request.model}"
                
            except Exception as e:
                logger.warning(f"ChatGPT enhancement failed: {str(e)}")
                final_response = local_response
                model_used = "local_only"
        else:
            final_response = local_response
            model_used = "local_only"
        
        # Analiza sentymentu
        sentiment_score, sentiment_label = analyze_sentiment(final_response)
        response_time = (time.time() - start_time) * 1000
        
        # Zapisz do bazy
        save_interaction_to_database(
            user_id, request.message, final_response, request.advisor_id,
            model_used, sentiment_score, sentiment_label,
            None, int(response_time)
        )
        
        return {
            "response": final_response,
            "model_used": model_used,
            "response_time_ms": int(response_time),
            "sentiment": sentiment_label,
            "confidence": abs(sentiment_score),
            "enhanced": request.use_chatgpt and openai_client is not None
        }
        
    except Exception as e:
        logger.error(f"Błąd w enhanced-response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@chat_router.get("/stats/{user_id}")
async def get_user_chat_stats(user_id: str):
    """
    Endpoint zwracający statystyki czatu użytkownika - FIXED VERSION.
    """
    try:
        with get_db_connection_safe() as conn:
            with conn.cursor() as cur:
                # Podstawowe statystyki
                cur.execute("""
                    SELECT 
                        COUNT(*) as total_messages,
                        COUNT(DISTINCT advisor_type) as advisors_used,
                        AVG(response_time_ms) as avg_response_time,
                        COUNT(CASE WHEN sentiment_label = 'positive' THEN 1 END) as positive_interactions,
                        COUNT(CASE WHEN sentiment_label = 'negative' THEN 1 END) as negative_interactions,
                        COUNT(CASE WHEN sentiment_label = 'neutral' THEN 1 END) as neutral_interactions
                    FROM chat_interactions 
                    WHERE user_id = %s
                """, (user_id,))
                
                stats = cur.fetchone()
                
                # Statystyki per doradca
                cur.execute("""
                    SELECT advisor_type, COUNT(*) as message_count
                    FROM chat_interactions 
                    WHERE user_id = %s AND advisor_type IS NOT NULL
                    GROUP BY advisor_type
                    ORDER BY message_count DESC
                """, (user_id,))
                
                advisor_stats = cur.fetchall()
        
        return {
            "user_id": user_id,
            "total_messages": stats[0] or 0,
            "advisors_used": stats[1] or 0,
            "avg_response_time_ms": round(stats[2], 2) if stats[2] else 0,
            "sentiment_breakdown": {
                "positive": stats[3] or 0,
                "negative": stats[4] or 0,
                "neutral": stats[5] or 0
            },
            "advisor_usage": [
                {"advisor": advisor, "messages": count} 
                for advisor, count in advisor_stats
            ]
        }
        
    except Exception as e:
        logger.error(f"Błąd pobierania statystyk: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))