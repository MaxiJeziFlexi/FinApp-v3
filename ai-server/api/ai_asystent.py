from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai.tree_model import predict_liquidity
from core.database import get_db_connection

router = APIRouter()

class AIQuestion(BaseModel):
    question: str
    income: float
    expenses: float

@router.post("/ai-assistant", tags=["AI Assistant"])
async def ai_assistant(data: AIQuestion):
    answer = predict_liquidity(data.income, data.expenses)
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO ai_questions (question, result) VALUES (%s, %s)",
            (data.question, answer)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")
    return {"answer": f"Based on your finances, your liquidity is classified as '{answer}'."}
