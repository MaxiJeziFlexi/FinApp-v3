"""
AI API endpoint for FastAPI
"""

from fastapi import APIRouter, HTTPException, Request
import logging
import os
import json
import httpx
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# OpenAI API configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

@router.post("/api/ai")
async def ai_endpoint(request: Request):
    """
    AI endpoint that processes requests and returns AI-generated responses
    """
    try:
        # Parse request body
        body = await request.json()
        logger.info(f"Received AI request: {body}")
        
        # Extract parameters
        model = body.get("model", "gpt-4")
        messages = body.get("messages", [])
        temperature = body.get("temperature", 0.7)
        max_tokens = body.get("max_tokens", 500)
        
        # Validate required parameters
        if not messages:
            raise HTTPException(status_code=400, detail="Messages are required")
        
        # If OpenAI API key is available, forward request to OpenAI
        if OPENAI_API_KEY:
            logger.info(f"Forwarding request to OpenAI API using model: {model}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    OPENAI_API_URL,
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    ai_reply = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    logger.info(f"Received response from OpenAI API")
                    return {"reply": ai_reply, "success": True}
                else:
                    logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                    raise HTTPException(status_code=response.status_code, detail=f"OpenAI API error: {response.text}")
        
        # If no OpenAI API key, generate a mock response
        else:
            logger.warning("No OpenAI API key available, generating mock response")
            user_message = next((msg.get("content", "") for msg in messages if msg.get("role") == "user"), "")
            
            # Extract financial context if available
            financial_context = {}
            if "Financial context:" in user_message:
                try:
                    context_str = user_message.split("Financial context:")[1].split("Question:")[0].strip()
                    financial_context = json.loads(context_str)
                except Exception as e:
                    logger.error(f"Error parsing financial context: {str(e)}")
            
            # Generate mock response based on context
            if "income" in user_message.lower() or "dochód" in user_message.lower():
                mock_reply = "Twój miesięczny dochód wynosi {income} PLN. Zalecam oszczędzanie co najmniej 20% tej kwoty miesięcznie.".format(
                    income=financial_context.get("monthlyIncome", 5000)
                )
            elif "wydatki" in user_message.lower() or "expenses" in user_message.lower():
                mock_reply = "Twoje miesięczne wydatki wynoszą {expenses} PLN. To stanowi {percent}% Twojego dochodu.".format(
                    expenses=financial_context.get("monthlyExpenses", 3000),
                    percent=round(financial_context.get("monthlyExpenses", 3000) / financial_context.get("monthlyIncome", 5000) * 100)
                )
            elif "cel" in user_message.lower() or "goal" in user_message.lower():
                mock_reply = "Twój cel finansowy to: {goal}. Kontynuuj oszczędzanie, aby go osiągnąć.".format(
                    goal=financial_context.get("financialGoal", "oszczędności emerytalne")
                )
            else:
                mock_reply = "Jako Twój doradca finansowy, mogę pomóc Ci w analizie Twojej sytuacji finansowej, planowaniu budżetu i osiąganiu celów finansowych. Czy masz konkretne pytanie dotyczące Twoich finansów?"
            
            logger.info(f"Generated mock response: {mock_reply}")
            return {"reply": mock_reply, "success": True}
            
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing AI request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing AI request: {str(e)}")

@router.post("/api/chat-history")
async def save_chat_history(request: Request):
    """
    Save chat history to the database
    """
    try:
        # Parse request body
        body = await request.json()
        logger.info(f"Received chat history save request: {body}")
        
        user_id = body.get("user_id")
        question = body.get("question")
        answer = body.get("answer")
        context = body.get("context")
        
        # Validate required parameters
        if not user_id or not question:
            raise HTTPException(status_code=400, detail="user_id and question are required")
        
        # Convert context to JSON string if it's a dict
        context_json = json.dumps(context) if context else None
        
        # Import database connection here to avoid circular imports
        from api.analytics_api import get_db_connection, execute_query
        
        conn = get_db_connection()
        
        # Try to save to ai_chat_history table
        try:
            result = execute_query(
                conn,
                """
                INSERT INTO ai_chat_history 
                (user_id, question, answer, context) 
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (user_id, question, answer, context_json),
                fetch_one=True,
                commit=True
            )
        except Exception as e:
            logger.warning(f"Error saving to ai_chat_history: {str(e)}")
            
            # Try alternative table
            try:
                result = execute_query(
                    conn,
                    """
                    INSERT INTO chat_interactions 
                    (user_id, question, answer, context_data) 
                    VALUES (%s, %s, %s, %s)
                    RETURNING *
                    """,
                    (user_id, question, answer, context_json),
                    fetch_one=True,
                    commit=True
                )
            except Exception as e2:
                logger.warning(f"Error saving to chat_interactions: {str(e2)}")
                
                # Create ai_chat_history table if it doesn't exist
                try:
                    execute_query(
                        conn,
                        """
                        CREATE TABLE IF NOT EXISTS ai_chat_history (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL,
                            question TEXT NOT NULL,
                            answer TEXT,
                            context JSONB,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                        """,
                        commit=True
                    )
                    
                    result = execute_query(
                        conn,
                        """
                        INSERT INTO ai_chat_history 
                        (user_id, question, answer, context) 
                        VALUES (%s, %s, %s, %s)
                        RETURNING *
                        """,
                        (user_id, question, answer, context_json),
                        fetch_one=True,
                        commit=True
                    )
                except Exception as e3:
                    logger.error(f"Failed to create and save to ai_chat_history: {str(e3)}")
                    raise HTTPException(status_code=500, detail=f"Failed to save chat history: {str(e3)}")
        
        finally:
            if conn:
                conn.close()
        
        logger.info("Chat history saved successfully")
        return {"success": True, "id": result.get("id") if result else None}
        
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error saving chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving chat history: {str(e)}")
