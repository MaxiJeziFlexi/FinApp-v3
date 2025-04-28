# main.py - poprawiona wersja
import time
import logging
import sys
import os
import json
from fastapi import APIRouter, HTTPException, FastAPI, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from ai.tree_model import TreeModel
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor
from ai.ai_chat_selector import AIChatSelector
from api.analysis import get_latest_data
import spacy
from utils.logger import logger
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from core.database import get_db_connection
from dotenv import load_dotenv
from api.decision_tree import router as decision_tree_router
from core.financial_models import AdvisoryRequest, AdvisoryResponse
import openai

# Ładujemy zmienne środowiskowe
load_dotenv()

# Import zewnętrznych routerów
from api.invitations import router as invitations_router
from api.analytics_api import router as analytics_router
from api.specialized_advice import router as specialized_advice_router

# Tworzenie instancji FastAPI
app = FastAPI(
    title="FinApp API",
    description="AI-driven financial advisory application",
    version="1.0.0"
)

# Dołączanie zewnętrznych routerów
app.include_router(analytics_router, prefix="/api")
app.include_router(invitations_router, prefix="/api")
app.include_router(specialized_advice_router, prefix="/api")
app.include_router(decision_tree_router, prefix="/api", tags=["Decision Tree"])

# Ustawienie middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Załaduj model spaCy
nlp = spacy.load("en_core_web_sm")
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Utworzenie lokalnego routera dla endpointów czatu
local_router = APIRouter()
logger = logging.getLogger("chat")

# Inicjalizacja doradców finansowych
financial_advisor = FinancialLegalAdvisor()
investment_advisor = InvestmentAdvisor()
tree_model = TreeModel()

# Inicjalizacja selektora AI - centralne miejsce koordynacji
ai_chat_selector = AIChatSelector(financial_advisor, investment_advisor, tree_model)

# Schematy danych czatu
class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str = Field(..., example="Tell me about investments")

class ChatRequest(BaseModel):
    user_id: int
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str
    result: Optional[str] = None

class FinancialChatRequest(BaseModel):
    user_id: int
    question: str
    context: Dict[str, Any] = Field(default_factory=dict)
    advisory_type: str = Field(default="financial", example="financial")
    language: str = Field(default="pl", example="pl")

# Modele dla nowych endpointów
class FormRequest(BaseModel):
    user_id: int
    answer: str
    context: Dict[str, Any] = Field(default_factory=dict)

class FormResponse(BaseModel):
    next_question: str
    is_complete: bool = False
    profile_data: Optional[Dict[str, Any]] = None

class DecisionTreeTransitionRequest(BaseModel):
    user_id: int
    message: str
    context: Dict[str, Any] = Field(default_factory=dict)

class OpenAIRequest(BaseModel):
    user_id: int
    question: str
    context: Dict[str, Any] = Field(default_factory=dict)

# Funkcja zapisująca interakcje do bazy danych
def save_interaction_to_database(user_id: int, question: str = None, reply: str = None, 
                                advisor_type: str = None, context: Dict[str, Any] = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Przygotowanie contextJSON
        context_json = json.dumps(context) if context else None
        
        # Wstawianie interakcji
        cur.execute("""
            INSERT INTO chat_interactions 
            (user_id, question, reply, advisor_type, context, timestamp)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (user_id, question, reply, advisor_type, context_json))
            
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Interakcja została zapisana do bazy danych.")
    except Exception as e:
        logger.error(f"Błąd zapisywania interakcji do bazy danych: {str(e)}")

# Nowy endpoint obsługujący zapytania OpenAI
@local_router.post("/openai-question", tags=["OpenAI"])
async def ask_openai_question(request: OpenAIRequest):
    """
    Bezpośrednie zapytanie do OpenAI API z użyciem klucza w zmiennych środowiskowych.
    """
    try:
        user_id = request.user_id
        question = request.question
        context = request.context
        
        if not question:
            raise HTTPException(status_code=422, detail="Brak pytania w żądaniu")
        
        # Pobierz klucz API z zmiennych środowiskowych
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            logger.error("Brak klucza OPENAI_API_KEY w zmiennych środowiskowych")
            raise HTTPException(status_code=500, detail="Brak konfiguracji API OpenAI")
        
        # Ustawienie klucza API
        openai.api_key = api_key
        
        # Przygotuj kontekst dla OpenAI
        system_message = """
        Jesteś zaawansowanym doradcą finansowym w aplikacji DisiNow. 
        Twoja rola polega na udzielaniu jasnych, konkretnych i pomocnych odpowiedzi 
        na pytania związane z finansami osobistymi, inwestycjami i planowaniem finansowym.
        """
        
        # Dodaj kontekst z profilu użytkownika
        if context.get("profile_data"):
            profile = context["profile_data"]
            system_message += "\n\nInformacje o użytkowniku:\n"
            
            if "financial_data" in profile:
                financial_data = profile["financial_data"]
                system_message += f"Wiek: {financial_data.get('age', 'brak danych')}\n"
                system_message += f"Dochód miesięczny: {financial_data.get('income', 'brak danych')} PLN\n"
                system_message += f"Wydatki miesięczne: {financial_data.get('expenses', 'brak danych')} PLN\n"
                system_message += f"Oszczędności: {financial_data.get('savings', 'brak danych')} PLN\n"
            
            if "behavioral_profile" in profile:
                behavioral_profile = profile["behavioral_profile"]
                system_message += f"\nTolerancja ryzyka: {behavioral_profile.get('risk_tolerance', 'brak danych')}\n"
                system_message += f"Cel finansowy: {behavioral_profile.get('financial_goal', 'brak danych')}\n"
        
        # Wywołaj OpenAI API
        try:
            # Używamy formatu zgodnego z najnowszą wersją API OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": question}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Pobierz odpowiedź
            answer = response.choices[0].message["content"].strip()
            
            # Zapisz interakcję do bazy danych
            save_interaction_to_database(
                user_id=user_id,
                question=question,
                reply=answer,
                advisor_type="openai",
                context={"source": "openai_api", "profile": context.get("profile_data")}
            )
            
            return {"reply": answer, "source": "openai"}
            
        except Exception as e:
            logger.error(f"Błąd wywołania OpenAI API: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Błąd wywołania OpenAI API: {str(e)}")
            
    except Exception as e:
        logger.error(f"Błąd w endpointcie openai-question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint obsługujący formularz profilowy
@local_router.post("/profile-form", response_model=FormResponse, tags=["User Profile"])
async def process_profile_form(request: FormRequest):
    """
    Obsługuje interakcję z formularzem profilowym użytkownika.
    Formularz prowadzi użytkownika przez serię pytań, a następnie buduje profil finansowy.
    """
    try:
        user_id = request.user_id
        answer = request.answer
        context = request.context
        
        # Przetwórz odpowiedź za pomocą AIChatSelector
        next_question = ai_chat_selector.handle_message(answer, user_id, context)
        
        # Sprawdź, czy formularz jest wypełniony
        is_complete = False
        profile_data = None
        
        if user_id in ai_chat_selector.user_forms and ai_chat_selector.user_forms[user_id].is_form_complete():
            is_complete = True
            profile_data = ai_chat_selector.user_forms[user_id].get_profile_data()
        
        # Zapisz interakcję
        save_interaction_to_database(
            user_id=user_id,
            question=answer,
            reply=next_question,
            context=context
        )
        
        return FormResponse(
            next_question=next_question,
            is_complete=is_complete,
            profile_data=profile_data
        )
    except Exception as e:
        logger.error(f"Błąd w obsłudze formularza: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wystąpił błąd: {str(e)}")

# Endpoint inicjalizujący czat po wypełnieniu formularza
@local_router.post("/start-chat-after-form", tags=["Chat Flow"])
async def start_chat_after_form(request: Dict[str, Any] = Body(...)):
    """
    Inicjuje czat po wypełnieniu formularza profilowego. 
    Tworzy personalizowane powitanie na podstawie danych z profilu.
    """
    try:
        user_id = request.get("user_id")
        profile_data = request.get("profile_data")
        
        if not user_id or not profile_data:
            raise HTTPException(status_code=422, detail="Brak wymaganych danych")
        
        # Użyj AIChatSelector do personalizowanego rozpoczęcia czatu
        initial_message = ai_chat_selector.start_conversation_after_form(user_id, profile_data)
        
        return {
            "status": "success",
            "message": initial_message,
            "advisor_type": profile_data.get("recommended_advisor", "financial")
        }
    except Exception as e:
        logger.error(f"Błąd przy inicjalizacji czatu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wystąpił błąd: {str(e)}")

# Endpoint sprawdzający przejście do drzewa decyzyjnego
@local_router.post("/check-tree-transition", tags=["Decision Tree"])
async def check_tree_transition(request: DecisionTreeTransitionRequest):
    """
    Sprawdza, czy na podstawie wiadomości użytkownika powinniśmy przejść do drzewa decyzyjnego.
    """
    try:
        user_id = request.user_id
        message = request.message
        context = request.context
        
        # Sprawdź, czy przejść do drzewa decyzyjnego
        transition_info = ai_chat_selector.transition_to_decision_tree(user_id, message, context)
        
        # Zapisz interakcję
        save_interaction_to_database(
            user_id=user_id,
            question=message,
            context=context
        )
        
        return transition_info
    except Exception as e:
        logger.error(f"Błąd przy sprawdzaniu przejścia do drzewa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wystąpił błąd: {str(e)}")

# Modyfikacja istniejącego endpointu chat
@local_router.post("/chat", tags=["Chat"])
async def chat_with_assistant(request: ChatRequest):
    try:
        logger.info(f"Otrzymano żądanie: {request}")
        
        if not request.messages or not isinstance(request.messages, list):
            return {"reply": "Nieprawidłowy format wiadomości.", "result": "Nieprawidłowy format wiadomości."}
        
        user_id = request.user_id
        messages = request.messages
        user_message = next((msg.content for msg in messages if msg.role.lower() == "user"), "")
        
        # Sprawdź, czy użytkownik ma formularz do wypełnienia
        if user_id in ai_chat_selector.user_forms and not ai_chat_selector.user_forms[user_id].is_form_complete():
            # Użytkownik wypełnia formularz
            response = ai_chat_selector.handle_message(user_message, user_id, {})
            
            # Sprawdź, czy formularz został wypełniony w tej iteracji
            is_complete = ai_chat_selector.user_forms[user_id].is_form_complete()
            
            if is_complete:
                # Formularz został wypełniony, przejdź do czatu
                profile_data = ai_chat_selector.user_forms[user_id].get_profile_data()
                welcome_message = ai_chat_selector.start_conversation_after_form(user_id, profile_data)
                return {"reply": welcome_message, "result": welcome_message, "form_completed": True}
            else:
                # Kontynuuj wypełnianie formularza
                return {"reply": response, "result": response, "form_in_progress": True}
        
        # Sprawdź, czy należy przejść do drzewa decyzyjnego
        tree_transition = ai_chat_selector.check_decision_tree_readiness(user_message, user_id, {})
        
        if tree_transition.get("ready_for_tree", False):
            # Sugeruj przejście do drzewa decyzyjnego
            return {
                "reply": tree_transition.get("message"),
                "result": tree_transition.get("message"),
                "suggest_tree": True,
                "advisor_type": tree_transition.get("advisor_type", "financial")
            }
        
        # Standardowa obsługa czatu przez ai_chat_selector
        reply = ai_chat_selector.handle_message(user_message, user_id, {})
        
        # Zapisz interakcję
        save_interaction_to_database(user_id=user_id, question=user_message, reply=reply)
        
        logger.info(f"Zwracana odpowiedź: {reply}")
        return {"reply": reply, "result": reply}
        
    except Exception as e:
        logger.error("Błąd w endpointcie chat: " + str(e))
        return {"reply": f"Przepraszam, wystąpił błąd: {str(e)}", "result": f"Przepraszam, wystąpił błąd: {str(e)}"}

# Modyfikacja endpointu financial-chat
@local_router.post("/financial-chat", response_model=ChatResponse, tags=["Financial Chat"])
async def financial_chat(request: FinancialChatRequest):
    try:
        logger.info(f"Otrzymano żądanie doradztwa finansowego: {request}")
        
        # Użyj bezpośrednio ai_chat_selector
        response = ai_chat_selector.handle_message(
            message=request.question,
            user_id=request.user_id,
            context=request.context
        )
        
        # Zapisz interakcję
        save_interaction_to_database(
            user_id=request.user_id,
            question=request.question,
            reply=response,
            advisor_type=request.advisory_type,
            context=request.context
        )
        
        logger.info(f"Zwracana odpowiedź doradztwa: {response}")
        return ChatResponse(reply=response, result=response)
        
    except Exception as e:
        logger.error(f"Błąd w endpointcie financial-chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint do pobierania historii czatu
@local_router.get("/chat-history/{user_id}", tags=["Chat History"])
async def get_chat_history(user_id: int):
    """Pobiera historię czatu dla danego użytkownika."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT question, reply, advisor_type, timestamp 
            FROM chat_interactions 
            WHERE user_id = %s 
            ORDER BY timestamp ASC
            """,
            (user_id,)
        )
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "question": row[0],
                "reply": row[1],
                "advisor_type": row[2],
                "timestamp": row[3].isoformat() if row[3] else None
            })
        
        cursor.close()
        conn.close()
        
        return {"history": history}
    except Exception as e:
        logger.error(f"Błąd pobierania historii czatu: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint dla integracji drzewa decyzyjnego z AI
@local_router.post("/enhanced-decision-tree", tags=["Decision Tree"])
async def enhanced_decision_tree(request: Dict[str, Any] = Body(...)):
    """
    Rozszerzony endpoint drzewa decyzyjnego integrujący wyniki z AI.
    Przekazuje wyniki drzewa do odpowiedniego doradcy AI w celu wzbogacenia rekomendacji.
    """
    try:
        user_id = request.get("user_id")
        node_id = request.get("current_node_id")
        answer = request.get("answer")
        context = request.get("context", {})
        
        if not user_id:
            raise HTTPException(status_code=422, detail="Brak wymaganych danych")
        
        # Wywołaj standardowy endpoint drzewa decyzyjnego
        from api.decision_tree import process_decision_tree
        
        # Przygotuj obiekt żądania zgodny z API drzewa decyzyjnego
        tree_request = {
            "user_id": user_id,
            "current_node_id": node_id,
            "answer": answer,
            "context": context
        }
        
        # Wywołaj przetwarzanie drzewa decyzyjnego
        tree_response = await process_decision_tree(tree_request)
        
        # Jeśli drzewo zwróciło rekomendacje, wzbogać je danymi z AI
        if "recommendations" in tree_response and tree_response["recommendations"]:
            # Określ typ doradcy na podstawie kontekstu
            advisor_type = context.get("advisor_type", "financial")
            
            # Stwórz zapytanie dla doradcy AI
            advisory_question = "Na podstawie profilu użytkownika i wyborów w drzewie decyzyjnym, " \
                               "przedstaw szczegółowe rekomendacje dotyczące: "
            
            for rec in tree_response["recommendations"]:
                advisory_question += rec.get("title", "") + ", "
            
            # Utwórz żądanie doradztwa
            advisory_request = AdvisoryRequest(
                user_id=user_id,
                question=advisory_question,
                context=context,
                advisory_type=advisor_type,
                language="pl"
            )
            
            # Uzyskaj rekomendacje od odpowiedniego doradcy
            if advisor_type == "investment":
                advisory_response = investment_advisor.process_advisory_request(advisory_request)
            else:
                advisory_response = financial_advisor.process_advisory_request(advisory_request)
            
            # Dodaj wglądy AI do rekomendacji
            tree_response["ai_insights"] = advisory_response.answer
            
            # Zapisz interakcję
            save_interaction_to_database(
                user_id=user_id,
                question=advisory_question,
                reply=advisory_response.answer,
                advisor_type=advisor_type,
                context=context
            )
        
        return tree_response
        
    except Exception as e:
        logger.error(f"Błąd w enhanced-decision-tree: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Dołączenie lokalnego routera do aplikacji FastAPI
app.include_router(local_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to FinApp API. Use /api/chat or /api/financial-chat endpoints."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)