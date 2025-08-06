import time
import logging
import sys
import os
import json
import uuid
from fastapi import APIRouter, HTTPException, FastAPI, Body, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import contextmanager
from openai import OpenAI
from textblob import TextBlob
import spacy
from utils.logger import logger
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# Import ONLY from core.database - don't mix with db_manager
from core.database import (
    init_db_pool,
    get_db,
    get_db_cursor,
    init_db
)

from core.financial_models import AdvisoryRequest, AdvisoryResponse
from ai.tree_model import TreeModel
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor
from ai.ai_chat_selector import AIChatSelector
from api.chat import chat_router
from api.auth import auth_router
from api.decision_tree import router as decision_tree_router
from api.invitations import router as invitations_router
from api.analytics_api import router as analytics_router
from api.specialized_advice import router as specialized_advice_router

# Ładowanie zmiennych środowiskowych
load_dotenv()

# Konfiguracja OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

# Dostępne modele z walidacją
AVAILABLE_MODELS = [
    "gpt-3.5-turbo",
    "gpt-4",
    "gpt-4o"
]

# Inicjalizacja klienta OpenAI
openai_client = None
if OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")

# Inicjalizacja FastAPI
app = FastAPI(
    title="FinApp AI Chat API",
    description="AI-driven financial advisory application with OpenAI integration",
    version="2.0.0"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ładowanie modelu spaCy
nlp = None
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("Model spaCy załadowany poprawnie!")
except OSError:
    logger.warning("Nie można załadować modelu spaCy. Instaluj: python -m spacy download en_core_web_sm")

# Initialize database pool ONCE at startup
db_initialized = False
try:
    # Initialize the connection pool
    init_db_pool()
    db_initialized = True
    logger.info("Database pool initialized successfully")
    
    # Verify tables exist (don't create them since they already exist in your DB)
    with get_db() as conn:
        with conn.cursor() as cur:
            # Just check if tables exist
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cur.fetchall()]
            logger.info(f"Found existing tables: {tables}")
            
            # Ensure user_profiles has the right structure (update if needed)
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'user_profiles'
            """)
            columns = [row[0] for row in cur.fetchall()]
            
            # Add missing columns if necessary
            if 'name' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR")
            if 'financial_goal' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS financial_goal VARCHAR")
            if 'timeframe' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timeframe VARCHAR")
            if 'current_savings' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_savings VARCHAR")
            if 'monthly_income' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS monthly_income VARCHAR")
            if 'target_amount' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_amount VARCHAR")
            if 'onboarding_complete' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE")
            if 'is_premium' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE")
            if 'progress' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0")
            if 'achievements' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb")
            if 'consents' not in columns:
                cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS consents JSONB DEFAULT '{}'::jsonb")
            
            conn.commit()
            logger.info("Database tables verified successfully")
            
except Exception as e:
    logger.error(f"Failed to initialize database: {str(e)}")
    # Don't raise - try to continue without DB

# Inicjalizacja doradców i selektora AI
financial_advisor = FinancialLegalAdvisor()
investment_advisor = InvestmentAdvisor()
tree_model = TreeModel()
ai_chat_selector = AIChatSelector(financial_advisor, investment_advisor, tree_model)

# Dołączanie routerów
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
app.include_router(invitations_router, prefix="/api", tags=["Invitations"])
app.include_router(specialized_advice_router, prefix="/api", tags=["Specialized Advice"])
app.include_router(decision_tree_router, prefix="/api", tags=["Decision Tree"])

# Modele danych z walidacją
class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str = Field(..., example="Tell me about investments")

class ChatRequest(BaseModel):
    user_id: str
    messages: List[ChatMessage]
    advisor_id: Optional[str] = "general"
    session_id: Optional[str] = None

    @validator("advisor_id")
    def validate_advisor_id(cls, v):
        valid_advisors = ["general", "retirement", "investment", "savings", "debt", "financial"]
        if v not in valid_advisors:
            raise ValueError(f"Invalid advisor_id. Must be one of: {', '.join(valid_advisors)}")
        return v

class ChatResponse(BaseModel):
    reply: str
    sentiment: Optional[str] = None
    confidence: Optional[float] = None
    advisor_used: Optional[str] = None
    response_time_ms: Optional[int] = None
    result: Optional[str] = None

class OpenAIChatRequest(BaseModel):
    message: str
    advisor_id: str = "financial"
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    user_profile: Optional[Dict[str, Any]] = None
    decision_path: List[Dict[str, Any]] = Field(default_factory=list)
    model: Optional[str] = "gpt-3.5-turbo"

    @validator("model")
    def validate_model(cls, v):
        if v not in AVAILABLE_MODELS:
            raise ValueError(f"Model {v} not supported. Available models: {AVAILABLE_MODELS}")
        return v

    @validator("advisor_id")
    def validate_advisor_id(cls, v):
        valid_advisors = ["retirement", "investment", "savings", "debt", "financial"]
        if v not in valid_advisors:
            raise ValueError(f"Invalid advisor_id. Must be one of: {', '.join(valid_advisors)}")
        return v

class EnhancedResponseRequest(BaseModel):
    message: str
    advisor_id: str = "financial"
    user_id: Optional[str] = None
    use_chatgpt: bool = True
    model: str = "gpt-3.5-turbo"

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

class UserProfile(BaseModel):
    id: str
    name: str
    financialGoal: Optional[str] = None
    timeframe: Optional[str] = None
    currentSavings: Optional[str] = None
    monthlyIncome: Optional[str] = None
    targetAmount: Optional[str] = None
    onboardingComplete: bool = False
    is_premium: bool = False
    progress: int = 0
    achievements: List[str] = Field(default_factory=list)
    consents: Optional[Dict[str, Any]] = None
    financialData: List[Dict[str, Any]] = Field(default_factory=list)

class DecisionTreeStatus(BaseModel):
    completed: bool
    progress: int = 0
    decision_path: List[Dict[str, Any]] = Field(default_factory=list)

class DecisionTreeSaveRequest(BaseModel):
    user_id: str
    advisor_id: str
    decision_path: List[Dict[str, Any]]
    completed: bool = False

# Helper function to get database connection safely
def get_db_connection_safe():
    """Wrapper for get_db to ensure compatibility"""
    return get_db()

def analyze_sentiment(text: str) -> tuple[float, str]:
    """Analyze sentiment of text using TextBlob."""
    try:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        label = "positive" if polarity > 0.1 else "negative" if polarity < -0.1 else "neutral"
        return polarity, label
    except Exception as e:
        logger.warning(f"Sentiment analysis failed: {str(e)}")
        return 0.0, "neutral"

def get_advisor_system_prompt(advisor_id: str) -> str:
    """Get system prompt for specific advisor type."""
    prompts = {
        "retirement": """Jesteś Doradcą Emerytalnym w aplikacji FinApp. Pomagasz użytkownikom planować przyszłość emerytalną, 
        obliczać potrzebne oszczędności, wybierać odpowiednie konta emerytalne i strategie inwestycyjne. 
        Odpowiadaj konkretnie, używaj przykładów i zawsze bądź pomocny.""",
        "investment": """Jesteś Doradcą Inwestycyjnym w aplikacji FinApp. Specjalizujesz się w strategiach inwestycyjnych, 
        analizie ryzyka, dywersyfikacji portfela i doborze instrumentów finansowych. 
        Edukuj o inwestowaniu, ale nie udzielaj bezpośrednich porad inwestycyjnych.""",
        "savings": """Jesteś Doradcą Oszczędnościowym w aplikacji FinApp. Pomagasz użytkownikom oszczędzać pieniądze, 
        tworzyć budżety, znajdować sposoby na redukcję wydatków i budować fundusze awaryjne. 
        Bądź praktyczny i motywujący.""",
        "debt": """Jesteś Doradcą ds. Długów w aplikacji FinApp. Pomagasz użytkownikom zarządzać długami, 
        tworzyć plany spłat, konsolidować zadłużenie i poprawiać zdolność kredytową. 
        Bądź empatyczny i nie oceniający.""",
        "financial": """Jesteś Doradcą Finansowym w aplikacji FinApp. Oferujesz kompleksowe porady finansowe, 
        pomagasz w planowaniu finansowym, budżetowaniu, inwestowaniu i osiąganiu celów finansowych. 
        Bądź profesjonalny, ale przystępny."""
    }
    return prompts.get(advisor_id, prompts["financial"])

def save_interaction_to_database(user_id: str, question: str = None, reply: str = None, 
                                advisor_type: str = None, sentiment_score: float = None, 
                                sentiment_label: str = None, session_id: str = None, 
                                response_time_ms: int = None, context: Dict[str, Any] = None):
    """Save interaction to database with proper error handling."""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO chat_interactions (
                    user_id, question, reply, advisor_type, sentiment_score, sentiment_label, 
                    session_id, response_time_ms, context, timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id, timestamp) DO NOTHING
            """, (
                str(user_id), question, reply, advisor_type, sentiment_score, sentiment_label, 
                session_id, response_time_ms, Json(context) if context else None
            ))
            logger.info(f"Interakcja zapisana: user={user_id}, advisor={advisor_type}")
    except Exception as e:
        logger.error(f"Błąd zapisywania interakcji: {str(e)}")

def get_chat_history(user_id: str, advisor_id: str, limit: int = 10) -> List[Dict]:
    """Get chat history for a user and advisor."""
    try:
        with get_db_cursor(commit=False) as cursor:
            cursor.execute("""
                SELECT question, reply, timestamp
                FROM chat_interactions 
                WHERE user_id = %s AND advisor_type = %s
                ORDER BY timestamp DESC
                LIMIT %s
            """, (str(user_id), advisor_id, limit))
            results = cursor.fetchall()
            
            history = []
            for row in reversed(results) if results else []:
                if row[0]:  # question
                    history.append({"role": "user", "content": row[0]})
                if row[1]:  # reply
                    history.append({"role": "assistant", "content": row[1]})
            return history
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        return []

def generate_openai_response(message: str, advisor_id: str, user_id: str, 
                                 user_profile: Dict = None, chat_history: List = None, 
                                 model: str = "gpt-3.5-turbo") -> str:
    """Generate response using OpenAI API."""
    if not openai_client:
        logger.error("OpenAI client not initialized")
        return generate_fallback_response(message, advisor_id)

    try:
        system_prompt = get_advisor_system_prompt(advisor_id)
        if user_profile:
            profile_context = (
                f"\nKontekst użytkownika: Imię: {user_profile.get('name', 'N/A')}, "
                f"Cel finansowy: {user_profile.get('financialGoal', 'N/A')}, "
                f"Miesięczny dochód: {user_profile.get('monthlyIncome', 'N/A')}, "
                f"Obecne oszczędności: {user_profile.get('currentSavings', 'N/A')}"
            )
            system_prompt += profile_context

        messages = [{"role": "system", "content": system_prompt}]
        if chat_history:
            messages.extend(chat_history[-6:])
        messages.append({"role": "user", "content": message})

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

def generate_fallback_response(message: str, advisor_id: str) -> str:
    """Generate fallback response when OpenAI is unavailable."""
    try:
        tokens = nlp(message.lower()).text.split() if nlp else message.lower().split()
        financial_keywords = ["finanse", "pieniądze", "budżet", "oszczędności", "wydatki", "dochody"]
        investment_keywords = ["inwestycje", "portfel", "akcje", "obligacje", "etf", "fundusz", "giełda"]
        legal_keywords = ["prawo", "podatki", "przepisy", "ustawa", "regulacje", "pit", "vat", "cit"]

        advisory_request = AdvisoryRequest(
            user_id="1", question=message, context={}, language="pl"
        )

        if any(kw in tokens for kw in financial_keywords + legal_keywords):
            advisory_request.advisory_type = "financial"
            return financial_advisor.process_advisory_request(advisory_request).answer
        elif any(kw in tokens for kw in investment_keywords):
            advisory_request.advisory_type = "investment"
            return investment_advisor.process_advisory_request(advisory_request).answer
        else:
            return tree_model.predict_response(message)
    except Exception as e:
        logger.error(f"Błąd fallback response: {str(e)}")
        return "Przepraszam, wystąpił problem. Spróbuj ponownie."

def get_user_profile_from_db(user_id: str) -> Optional[Dict]:
    """Get user profile from database."""
    try:
        with get_db_cursor(commit=False) as cursor:
            # First check what columns exist
            cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'user_profiles'
            """)
            existing_columns = [row[0] for row in cursor.fetchall()]
            
            # Build query based on existing columns
            select_columns = []
            column_mapping = {
                'id': 'id', 'user_id': 'id',
                'name': 'name',
                'financial_goal': 'financial_goal',
                'timeframe': 'timeframe', 
                'current_savings': 'current_savings',
                'monthly_income': 'monthly_income',
                'target_amount': 'target_amount',
                'onboarding_complete': 'onboarding_complete',
                'is_premium': 'is_premium',
                'progress': 'progress',
                'achievements': 'achievements',
                'consents': 'consents',
                'financial_data': 'financial_data'
            }
            
            for col, alias in column_mapping.items():
                if col in existing_columns:
                    select_columns.append(col)
            
            if not select_columns:
                return None
                
            query = f"SELECT {', '.join(select_columns)} FROM user_profiles WHERE "
            
            # Check if 'id' column exists and is varchar, otherwise use user_id
            if 'id' in existing_columns:
                query += "id = %s"
            elif 'user_id' in existing_columns:
                query += "user_id = %s::integer"
            else:
                return None
                
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            
            if result:
                profile = {"id": str(user_id)}
                for i, col in enumerate(select_columns):
                    if col == 'id' or col == 'user_id':
                        profile['id'] = str(result[i])
                    elif col in ['achievements', 'consents', 'financial_data']:
                        profile[col.replace('_', '')] = result[i] if result[i] else ([] if col == 'achievements' or col == 'financial_data' else {})
                    else:
                        key = ''.join([w.capitalize() if i > 0 else w for i, w in enumerate(col.split('_'))])
                        profile[key] = result[i]
                
                # Set defaults for missing fields
                profile.setdefault('name', '')
                profile.setdefault('financialGoal', None)
                profile.setdefault('timeframe', None)
                profile.setdefault('currentSavings', None)
                profile.setdefault('monthlyIncome', None)
                profile.setdefault('targetAmount', None)
                profile.setdefault('onboardingComplete', False)
                profile.setdefault('is_premium', False)
                profile.setdefault('progress', 0)
                profile.setdefault('achievements', [])
                profile.setdefault('consents', {})
                profile.setdefault('financialData', [])
                
                return profile
        return None
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        return None

def save_user_profile_to_db(user_id: str, profile_data: Dict) -> bool:
    """Save user profile to database."""
    try:
        with get_db_cursor() as cursor:
            # Check existing columns
            cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'user_profiles'
            """)
            existing_columns = [row[0] for row in cursor.fetchall()]
            
            # Prepare data based on existing columns
            columns = []
            values = []
            update_parts = []
            
            column_mapping = {
                'id': (user_id, 'id'),
                'user_id': (int(user_id) if user_id.isdigit() else 1, 'user_id'),
                'name': (profile_data.get('name', ''), 'name'),
                'financial_goal': (profile_data.get('financialGoal'), 'financial_goal'),
                'timeframe': (profile_data.get('timeframe'), 'timeframe'),
                'current_savings': (profile_data.get('currentSavings'), 'current_savings'),
                'monthly_income': (profile_data.get('monthlyIncome'), 'monthly_income'),
                'target_amount': (profile_data.get('targetAmount'), 'target_amount'),
                'onboarding_complete': (profile_data.get('onboardingComplete', False), 'onboarding_complete'),
                'is_premium': (profile_data.get('is_premium', False), 'is_premium'),
                'progress': (profile_data.get('progress', 0), 'progress'),
                'achievements': (Json(profile_data.get('achievements', [])), 'achievements'),
                'consents': (Json(profile_data.get('consents', {})), 'consents'),
                'financial_data': (Json(profile_data.get('financialData', [])), 'financial_data')
            }
            
            for col, (value, db_col) in column_mapping.items():
                if col in existing_columns:
                    columns.append(col)
                    values.append(value)
                    if col not in ['id', 'user_id']:
                        update_parts.append(f"{col} = EXCLUDED.{col}")
            
            if not columns:
                return False
            
            # Add updated_at if it exists
            if 'updated_at' in existing_columns:
                update_parts.append("updated_at = NOW()")
            
            placeholders = ', '.join(['%s'] * len(values))
            columns_str = ', '.join(columns)
            update_str = ', '.join(update_parts) if update_parts else "id = EXCLUDED.id"
            
            # Determine conflict column
            conflict_col = 'id' if 'id' in existing_columns else 'user_id'
            
            query = f"""
                INSERT INTO user_profiles ({columns_str}) 
                VALUES ({placeholders})
                ON CONFLICT ({conflict_col}) DO UPDATE SET {update_str}
            """
            
            cursor.execute(query, values)
            logger.info(f"User profile saved successfully for user_id: {user_id}")
            return True
    except Exception as e:
        logger.error(f"Error saving user profile: {str(e)}")
        return False

def get_decision_tree_status(user_id: str, advisor_id: str) -> Dict:
    """Get decision tree status from database."""
    try:
        with get_db_cursor(commit=False) as cursor:
            cursor.execute("""
                SELECT completed, progress, decision_path
                FROM decision_tree_progress 
                WHERE user_id = %s AND advisor_id = %s
            """, (str(user_id), advisor_id))
            result = cursor.fetchone()
            
            if result:
                return {
                    "completed": result[0] if result[0] is not None else False,
                    "progress": result[1] if result[1] is not None else 0,
                    "decision_path": result[2] if result[2] else []
                }
            else:
                return {"completed": False, "progress": 0, "decision_path": []}
    except Exception as e:
        logger.error(f"Error fetching decision tree status: {str(e)}")
        return {"completed": False, "progress": 0, "decision_path": []}

def save_decision_tree_progress(user_id: str, advisor_id: str, decision_path: List[Dict], completed: bool = False) -> bool:
    """Save decision tree progress to database."""
    try:
        progress = 100 if completed else min(90, len(decision_path) * 30)
        
        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO decision_tree_progress (
                    user_id, advisor_id, decision_path, completed, progress, updated_at
                ) VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id, advisor_id) DO UPDATE SET
                    decision_path = EXCLUDED.decision_path,
                    completed = EXCLUDED.completed,
                    progress = EXCLUDED.progress,
                    updated_at = NOW()
            """, (str(user_id), advisor_id, Json(decision_path), completed, progress))
            logger.info(f"Decision tree progress saved for user_id: {user_id}, advisor_id: {advisor_id}")
            return True
    except Exception as e:
        logger.error(f"Error saving decision tree progress: {str(e)}")
        return False

def reset_decision_tree(user_id: str, advisor_id: str) -> bool:
    """Reset decision tree progress."""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                DELETE FROM decision_tree_progress 
                WHERE user_id = %s AND advisor_id = %s
            """, (str(user_id), advisor_id))
            return True
    except Exception as e:
        logger.error(f"Error resetting decision tree: {str(e)}")
        return False

# API Endpoints
@app.post("/api/chat/send", tags=["OpenAI Chat"])
async def openai_chat_send(request: OpenAIChatRequest):
    """Main OpenAI chat endpoint."""
    start_time = time.time()
    try:
        user_id = request.user_id or str(uuid.uuid4())
        session_id = request.session_id or str(uuid.uuid4())
        advisor_id = request.advisor_id or "financial"

        user_profile = get_user_profile_from_db(user_id) or {}
        chat_history = get_chat_history(user_id, advisor_id, limit=10)

        user_sentiment_score, user_sentiment_label = analyze_sentiment(request.message)

        ai_response = generate_openai_response(
            request.message, advisor_id, user_id, user_profile, chat_history, request.model
        )
        ai_sentiment_score, ai_sentiment_label = analyze_sentiment(ai_response)
        response_time_ms = int((time.time() - start_time) * 1000)

        save_interaction_to_database(
            user_id=user_id,
            question=request.message,
            reply=ai_response,
            advisor_type=advisor_id,
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
            "advisorUsed": advisor_id,
            "timestamp": datetime.now().isoformat(),
            "ui": {
                "animation": "fade-in",
                "style": "glassmorphism",
                "card": {
                    "borderRadius": "12px",
                    "background": "rgba(255, 255, 255, 0.8)",
                    "backdropFilter": "blur(10px)"
                }
            }
        }
    except Exception as e:
        logger.error(f"Błąd w OpenAI chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/profile/{user_id}", tags=["User Profile"])
async def get_user_profile(user_id: str):
    """Get user profile with UI metadata."""
    try:
        profile = get_user_profile_from_db(user_id)
        if not profile:
            profile = {
                "id": user_id,
                "name": "",
                "financialGoal": None,
                "timeframe": None,
                "currentSavings": None,
                "monthlyIncome": None,
                "targetAmount": None,
                "onboardingComplete": False,
                "is_premium": False,
                "progress": 0,
                "achievements": [],
                "consents": {},
                "financialData": [
                    {"date": "2023-01", "amount": 2000},
                    {"date": "2023-02", "amount": 2500},
                    {"date": "2023-03", "amount": 3000},
                    {"date": "2023-04", "amount": 3200},
                    {"date": "2023-05", "amount": 3800},
                    {"date": "2023-06", "amount": 4200},
                    {"date": "2023-07", "amount": 4500},
                    {"date": "2023-08", "amount": 5000}
                ]
            }
        profile["ui"] = {
            "cardStyle": "glassmorphism",
            "borderRadius": "12px",
            "animation": "slide-up",
            "colors": {
                "primary": "#00B4D8",
                "accent": "#FF6F61",
                "background": "#F5F7FA"
            }
        }
        return profile
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/user/profile/{user_id}", tags=["User Profile"])
async def update_user_profile(user_id: str, profile: UserProfile):
    """Update user profile."""
    try:
        if user_id != profile.id:
            raise HTTPException(status_code=400, detail="User ID in path does not match profile ID")
        
        success = save_user_profile_to_db(user_id, profile.dict())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update user profile")
        
        updated_profile = get_user_profile_from_db(user_id)
        if not updated_profile:
            raise HTTPException(status_code=404, detail="User profile not found after update")
        
        updated_profile["ui"] = {
            "cardStyle": "glassmorphism",
            "borderRadius": "12px",
            "animation": "slide-up",
            "colors": {
                "primary": "#00B4D8",
                "accent": "#FF6F61",
                "background": "#F5F7FA"
            }
        }
        return updated_profile
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/models", tags=["Chat Models"])
async def get_available_models():
    """Get available AI models."""
    try:
        return {
            "models": AVAILABLE_MODELS,
            "default": OPENAI_MODEL,
            "openai_available": openai_client is not None
        }
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/enhanced-response", tags=["Enhanced Chat"])
async def get_enhanced_response(request: EnhancedResponseRequest):
    """Get enhanced response with fallback logic."""
    try:
        start_time = time.time()
        
        if request.use_chatgpt and openai_client:
            response_text = generate_openai_response(
                request.message, request.advisor_id, request.user_id or "1", model=request.model
            )
            model_used = request.model
        else:
            response_text = generate_fallback_response(request.message, request.advisor_id)
            model_used = "local"
        
        response_time_ms = int((time.time() - start_time) * 1000)
        
        return {
            "response": response_text,
            "model_used": model_used,
            "response_time_ms": response_time_ms
        }
    except Exception as e:
        logger.error(f"Error in enhanced response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history/{advisor_id}", tags=["Chat History"])
async def get_chat_history_endpoint(advisor_id: str, user_id: str = Query(...)):
    """Get chat history for specific advisor and user."""
    try:
        if not user_id or user_id == "undefined":
            return {"messages": []}
            
        if not advisor_id or advisor_id == "undefined":
            advisor_id = "financial"
            
        with get_db_cursor(commit=False) as cursor:
            cursor.execute("""
                SELECT question, reply, timestamp, sentiment_label, response_time_ms
                FROM chat_interactions 
                WHERE user_id = %s AND (advisor_type = %s OR advisor_type IS NULL)
                ORDER BY timestamp ASC
            """, (str(user_id), advisor_id))
            results = cursor.fetchall()
        
        formatted_messages = []
        for row in results:
            if row[0]:  # question
                formatted_messages.append({
                    "id": f"user_{int(row[2].timestamp())}",
                    "content": row[0],
                    "role": "user", 
                    "timestamp": row[2].isoformat(),
                    "advisorId": advisor_id
                })
            if row[1]:  # reply
                formatted_messages.append({
                    "id": f"assistant_{int(row[2].timestamp())}",
                    "content": row[1],
                    "role": "assistant",
                    "timestamp": row[2].isoformat(),
                    "advisorId": advisor_id,
                    "sentiment": row[3],
                    "responseTime": row[4]
                })
                
        return {"messages": formatted_messages}
        
    except Exception as e:
        logger.error(f"Błąd pobierania historii: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/decision-tree/status/{user_id}/{advisor_id}", tags=["Decision Tree"])
async def get_decision_tree_status_endpoint(user_id: str, advisor_id: str):
    """Get decision tree status."""
    try:
        status = get_decision_tree_status(user_id, advisor_id)
        return status
    except Exception as e:
        logger.error(f"Error getting decision tree status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/decision-tree/reset/{user_id}/{advisor_id}", tags=["Decision Tree"])
async def reset_decision_tree_endpoint(user_id: str, advisor_id: str):
    """Reset decision tree progress."""
    try:
        success = reset_decision_tree(user_id, advisor_id)
        if success:
            return {"status": "success", "message": "Decision tree reset successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to reset decision tree")
    except Exception as e:
        logger.error(f"Error resetting decision tree: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/decision-tree/save", tags=["Decision Tree"])
async def save_decision_tree_endpoint(request: DecisionTreeSaveRequest):
    """Save decision tree progress."""
    try:
        success = save_decision_tree_progress(
            request.user_id, 
            request.advisor_id, 
            request.decision_path, 
            request.completed
        )
        if success:
            return {"status": "success", "message": "Progress saved successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save progress")
    except Exception as e:
        logger.error(f"Error saving decision tree progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", tags=["Chat"])
async def chat_with_assistant(request: ChatRequest):
    """Legacy chat endpoint with AI selector."""
    try:
        if not request.messages or not isinstance(request.messages, list):
            return {
                "reply": "Nieprawidłowy format wiadomości.", 
                "result": "Nieprawidłowy format wiadomości."
            }
            
        user_id = str(request.user_id)
        user_message = next(
            (msg.content for msg in request.messages if msg.role.lower() == "user"), 
            ""
        )
        
        if (user_id in ai_chat_selector.user_forms and 
            not ai_chat_selector.user_forms[user_id].is_form_complete()):
            
            response = ai_chat_selector.handle_message(user_message, user_id, {})
            is_complete = ai_chat_selector.user_forms[user_id].is_form_complete()
            
            if is_complete:
                profile_data = ai_chat_selector.user_forms[user_id].get_profile_data()
                welcome_message = ai_chat_selector.start_conversation_after_form(
                    user_id, profile_data
                )
                return {
                    "reply": welcome_message, 
                    "result": welcome_message, 
                    "form_completed": True
                }
                
            return {
                "reply": response, 
                "result": response, 
                "form_in_progress": True
            }
        
        tree_transition = ai_chat_selector.check_decision_tree_readiness(
            user_message, user_id, {}
        )
        if tree_transition.get("ready_for_tree", False):
            return {
                "reply": tree_transition.get("message"), 
                "result": tree_transition.get("message"),
                "suggest_tree": True, 
                "advisor_type": tree_transition.get("advisor_type", "financial")
            }
        
        reply = ai_chat_selector.handle_message(user_message, user_id, {})
        save_interaction_to_database(
            user_id=user_id, 
            question=user_message, 
            reply=reply, 
            advisor_type=request.advisor_id
        )
        
        return {"reply": reply, "result": reply}
        
    except Exception as e:
        logger.error(f"Błąd w endpointcie chat: {str(e)}")
        return {
            "reply": f"Przepraszam, wystąpił błąd: {str(e)}", 
            "result": f"Przepraszam, wystąpił błąd: {str(e)}"
        }

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "FinApp AI Chat API with OpenAI integration",
        "version": "2.0.0",
        "openai_configured": bool(OPENAI_API_KEY),
        "openai_client_ready": openai_client is not None,
        "ui": {
            "theme": "futuristic-cloud",
            "style": "glassmorphism",
            "primaryColor": "#00B4D8"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db_healthy = False
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                db_healthy = True
    except:
        db_healthy = False
    
    return {
        "status": "healthy" if db_healthy else "degraded",
        "openai": bool(OPENAI_API_KEY),
        "openai_client": openai_client is not None,
        "chatgpt_available": openai_client is not None,
        "spacy": nlp is not None,
        "database": db_healthy,
        "database_pool_initialized": db_initialized
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)