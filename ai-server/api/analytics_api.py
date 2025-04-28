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

router = APIRouter()  # Nie dodajemy prefiksu "/api" tutaj – on zostanie dodany globalnie

# Database connection function
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "finapp"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

# Pydantic models for request/response
class UserProfile(BaseModel):
    user_id: int
    age: Optional[int] = None
    country: Optional[str] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    financial_goal: Optional[str] = None
    risk_tolerance: Optional[str] = None

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
        print(f"Error in get_analytics_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching analytics data: {str(e)}")

@router.get("/user-profile/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: int):
    """
    Get a user profile by user_id.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = %s", (user_id,))
        user_profile = row_to_dict(cursor.fetchone())
        cursor.close()
        conn.close()
        if not user_profile:
            raise HTTPException(status_code=404, detail=f"User profile not found for user_id: {user_id}")
        return user_profile
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

@router.post("/user-profile", response_model=UserProfile)
async def create_or_update_user_profile(profile: UserProfile):
    """
    Create or update a user profile.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = %s", (profile.user_id,))
        existing_profile = cursor.fetchone()
        if existing_profile:
            cursor.execute("""
                UPDATE user_profiles 
                SET age = %s, country = %s, monthly_income = %s, 
                    monthly_expenses = %s, financial_goal = %s, risk_tolerance = %s 
                WHERE user_id = %s
                RETURNING *
                """,
                (
                    profile.age,
                    profile.country,
                    profile.monthly_income,
                    profile.monthly_expenses,
                    profile.financial_goal,
                    profile.risk_tolerance,
                    profile.user_id
                )
            )
        else:
            cursor.execute("""
                INSERT INTO user_profiles 
                (user_id, age, country, monthly_income, monthly_expenses, financial_goal, risk_tolerance) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    profile.user_id,
                    profile.age,
                    profile.country,
                    profile.monthly_income,
                    profile.monthly_expenses,
                    profile.financial_goal,
                    profile.risk_tolerance
                )
            )
        result = row_to_dict(cursor.fetchone())
        conn.commit()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Error in create_or_update_user_profile: {str(e)}")
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
        print(f"Error in create_financial_goal: {str(e)}")
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
        print(f"Error in save_transactions: {str(e)}")
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
        print(f"Error in save_chat_message: {str(e)}")
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
        print(f"Error in get_financial_summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching financial summary: {str(e)}")
