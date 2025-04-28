from fastapi import APIRouter, HTTPException
from core.database import get_db_connection
from typing import List

router = APIRouter()

def format_db_response(cursor) -> List[dict]:
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

@router.get("/analyses", tags=["Logs"])
async def get_analyses():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, income, expenses, assets_value, trend, liquidity, savings_progress, suggestion, created_at
            FROM financial_analyses
            ORDER BY created_at DESC
            LIMIT 20
        """)
        result = format_db_response(cur)
        cur.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

@router.get("/ai-logs", tags=["Logs"])
async def get_ai_logs():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT 50")
        result = format_db_response(cur)
        cur.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")
