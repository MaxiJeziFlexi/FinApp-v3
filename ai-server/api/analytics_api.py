"""
API endpoints for analytics data using PostgreSQL
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime, date
import json
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()  # Nie dodajemy prefiksu "/api" tutaj – on zostanie dodany globalnie

# Database connection function
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "Maks5367"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

# Pydantic models for request/response
class UserProfile(BaseModel):
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    country: Optional[str] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    financial_goal: Optional[str] = None
    risk_tolerance: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class FinancialAnalytic(BaseModel):
    id: Optional[int] = None
    user_id: int
    income: float
    expenses: float
    assets_value: float
    trend: str
    liquidity: float
    savings_progress: float
    suggestion: str
    created_at: Optional[datetime] = None

class Investment(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    type: str
    current_value: float
    initial_value: float
    acquisition_date: date
    risk_level: str
    expected_return: float
    actual_return: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class FinancialGoal(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    target_amount: float
    current_amount: float = 0
    target_date: date
    priority: int = 1
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Transaction(BaseModel):
    id: Optional[int] = None
    user_id: int
    amount: float
    description: str
    category: Optional[str] = None
    transaction_date: date
    type: str
    created_at: Optional[datetime] = None

class ChatMessage(BaseModel):
    user_id: int
    question: str
    answer: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class AnalyticsData(BaseModel):
    user_profile: Optional[UserProfile] = None
    financial_analytics: List[FinancialAnalytic] = []
    investments: List[Investment] = []
    financial_goals: List[FinancialGoal] = []
    transactions: List[Transaction] = []
    chat_history: List[Dict[str, Any]] = []

# Helper function to convert psycopg2 row to dict
def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

# Helper function to create default user profile
def create_default_user_profile(user_id: int) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "name": f"User {user_id}",
        "email": f"user{user_id}@example.com",
        "age": 30,
        "country": "US",
        "monthly_income": 5000.0,
        "monthly_expenses": 3000.0,
        "financial_goal": "savings",
        "risk_tolerance": "medium",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

# API Endpoints

@router.get("/analytics/{user_id}", response_model=AnalyticsData)
async def get_analytics_data(user_id: int):
    """
    Get all analytics data for a user.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get user profile
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = %s", (user_id,))
        user_profile = row_to_dict(cursor.fetchone())
        
        # Create default profile if none exists
        if not user_profile:
            default_profile = create_default_user_profile(user_id)
            try:
                cursor.execute("""
                    INSERT INTO user_profiles 
                    (user_id, name, email, age, country, monthly_income, monthly_expenses, financial_goal, risk_tolerance, created_at, updated_at)
                    VALUES (%(user_id)s, %(name)s, %(email)s, %(age)s, %(country)s, %(monthly_income)s, %(monthly_expenses)s, %(financial_goal)s, %(risk_tolerance)s, %(created_at)s, %(updated_at)s)
                    RETURNING *
                """, default_profile)
                user_profile = row_to_dict(cursor.fetchone())
                conn.commit()
            except Exception as e:
                logger.warning(f"Could not create default profile: {e}")
                user_profile = default_profile
        
        # Get financial analytics (last 10)
        cursor.execute("""
            SELECT * FROM financial_analytics 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 10
            """, (user_id,))
        financial_analytics = [row_to_dict(row) for row in cursor.fetchall()]
        
        # Get investments
        cursor.execute("SELECT * FROM investments WHERE user_id = %s", (user_id,))
        investments = [row_to_dict(row) for row in cursor.fetchall()]
        
        # Get financial goals
        cursor.execute("SELECT * FROM financial_goals WHERE user_id = %s", (user_id,))
        financial_goals = [row_to_dict(row) for row in cursor.fetchall()]
        
        # Get transactions (last 20)
        cursor.execute("""
            SELECT * FROM transactions 
            WHERE user_id = %s 
            ORDER BY transaction_date DESC 
            LIMIT 20
            """, (user_id,))
        transactions = [row_to_dict(row) for row in cursor.fetchall()]
        
        # Get chat history (last 10)
        cursor.execute("""
            SELECT * FROM ai_chat_history 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 10
            """, (user_id,))
        chat_history = [row_to_dict(row) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return AnalyticsData(
            user_profile=user_profile,
            financial_analytics=financial_analytics,
            investments=investments,
            financial_goals=financial_goals,
            transactions=transactions,
            chat_history=chat_history
        )
    except Exception as e:
        logger.error(f"Error in get_analytics_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching analytics data: {str(e)}")

@router.get("/user-profile/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: int):
    """
    Get a user profile by user_id. Creates a default profile if none exists.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = %s", (user_id,))
        user_profile = cursor.fetchone()
        
        if not user_profile:
            # Create default user profile
            default_profile = create_default_user_profile(user_id)
            
            try:
                cursor.execute("""
                    INSERT INTO user_profiles 
                    (user_id, name, email, age, country, monthly_income, monthly_expenses, financial_goal, risk_tolerance, created_at, updated_at)
                    VALUES (%(user_id)s, %(name)s, %(email)s, %(age)s, %(country)s, %(monthly_income)s, %(monthly_expenses)s, %(financial_goal)s, %(risk_tolerance)s, %(created_at)s, %(updated_at)s)
                    RETURNING *
                """, default_profile)
                
                user_profile = cursor.fetchone()
                conn.commit()
                logger.info(f"Created default profile for user {user_id}")
            except Exception as e:
                logger.warning(f"Could not create default profile in database: {e}")
                # Return default profile even if database insert fails
                cursor.close()
                conn.close()
                return UserProfile(**default_profile)
        
        cursor.close()
        conn.close()
        
        return UserProfile(**row_to_dict(user_profile))
        
    except Exception as e:
        logger.error(f"Error in get_user_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

@router.post("/user-profile", response_model=UserProfile)
async def create_or_update_user_profile(profile: UserProfile):
    """
    Create or update a user profile.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if profile exists
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = %s", (profile.user_id,))
        existing_profile = cursor.fetchone()
        
        current_time = datetime.now()
        
        if existing_profile:
            # Update existing profile
            cursor.execute("""
                UPDATE user_profiles 
                SET name = %s, email = %s, age = %s, country = %s, monthly_income = %s, 
                    monthly_expenses = %s, financial_goal = %s, risk_tolerance = %s, updated_at = %s
                WHERE user_id = %s
                RETURNING *
                """,
                (
                    profile.name,
                    profile.email,
                    profile.age,
                    profile.country,
                    profile.monthly_income,
                    profile.monthly_expenses,
                    profile.financial_goal,
                    profile.risk_tolerance,
                    current_time,
                    profile.user_id
                )
            )
        else:
            # Create new profile
            cursor.execute("""
                INSERT INTO user_profiles 
                (user_id, name, email, age, country, monthly_income, monthly_expenses, financial_goal, risk_tolerance, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    profile.user_id,
                    profile.name,
                    profile.email,
                    profile.age,
                    profile.country,
                    profile.monthly_income,
                    profile.monthly_expenses,
                    profile.financial_goal,
                    profile.risk_tolerance,
                    current_time,
                    current_time
                )
            )
        
        result = row_to_dict(cursor.fetchone())
        conn.commit()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        logger.error(f"Error in create_or_update_user_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving user profile: {str(e)}")

@router.post("/financial-goals", response_model=FinancialGoal)
async def create_financial_goal(goal: FinancialGoal):
    """
    Create a new financial goal.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            INSERT INTO financial_goals 
            (user_id, name, target_amount, current_amount, target_date, priority, notes) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                goal.user_id,
                goal.name,
                goal.target_amount,
                goal.current_amount,
                goal.target_date,
                goal.priority,
                goal.notes
            )
        )
        result = row_to_dict(cursor.fetchone())
        conn.commit()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        logger.error(f"Error in create_financial_goal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating financial goal: {str(e)}")

@router.post("/transactions", response_model=List[Transaction])
async def save_transactions(transactions: List[Transaction]):
    """
    Save multiple transactions.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        results = []
        for transaction in transactions:
            cursor.execute("""
                INSERT INTO transactions 
                (user_id, amount, description, category, transaction_date, type) 
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    transaction.user_id,
                    transaction.amount,
                    transaction.description,
                    transaction.category,
                    transaction.transaction_date,
                    transaction.type
                )
            )
            results.append(row_to_dict(cursor.fetchone()))
        conn.commit()
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        logger.error(f"Error in save_transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving transactions: {str(e)}")

@router.post("/chat-history", response_model=Dict[str, Any])
async def save_chat_message(message: ChatMessage):
    """
    Save a chat message and response.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        context_json = json.dumps(message.context) if message.context else None
        cursor.execute("""
            INSERT INTO ai_chat_history 
            (user_id, question, answer, context) 
            VALUES (%s, %s, %s, %s)
            RETURNING *
            """,
            (
                message.user_id,
                message.question,
                message.answer,
                context_json
            )
        )
        result = row_to_dict(cursor.fetchone())
        conn.commit()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        logger.error(f"Error in save_chat_message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving chat message: {str(e)}")

@router.get("/financial-summary/{user_id}")
async def get_financial_summary(user_id: int):
    """
    Get a summary of financial data for dashboard display.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT * FROM financial_analytics 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 1
            """, (user_id,))
        latest_analytics = row_to_dict(cursor.fetchone())
        cursor.execute("""
            SELECT 
                COALESCE(SUM(current_value), 0) as total_value,
                COALESCE(AVG(expected_return), 0) as avg_expected_return,
                COUNT(*) as total_investments
            FROM investments
            WHERE user_id = %s
            """, (user_id,))
        investment_summary = row_to_dict(cursor.fetchone())
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
                COUNT(*) as transaction_count
            FROM transactions
            WHERE user_id = %s AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
            """, (user_id,))
        transaction_summary = row_to_dict(cursor.fetchone())
        cursor.execute("""
            SELECT 
                COALESCE(SUM(current_amount), 0) as total_saved,
                COALESCE(SUM(target_amount), 0) as total_targets,
                COUNT(*) as goal_count
            FROM financial_goals
            WHERE user_id = %s
            """, (user_id,))
        goal_summary = row_to_dict(cursor.fetchone())
        cursor.close()
        conn.close()
        total_value = investment_summary.get("total_value", 0) or 0
        total_expenses = transaction_summary.get("total_expenses", 0) or 0
        savings_progress = latest_analytics.get("savings_progress", 0) if latest_analytics else 0
        return {
            "latest_analytics": latest_analytics,
            "investment_summary": investment_summary,
            "transaction_summary": transaction_summary,
            "goal_summary": goal_summary,
            "net_worth": total_value - total_expenses,
            "savings_rate": savings_progress
        }
    except Exception as e:
        logger.error(f"Error in get_financial_summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching financial summary: {str(e)}")
