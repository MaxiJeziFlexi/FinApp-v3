from typing import List, Dict
from database import get_db_connection

def format_db_response(cursor) -> List[dict]:
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

def get_trend_history(user_id: int) -> List[str]:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT trend FROM financial_analyses
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 5
            """, (user_id,))
            return [row[0] for row in cur.fetchall()]

def log_ai_interaction(user_id: int, trend: str, liquidity: float, savings_rate: float, suggestion: str):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO ai_logs (user_id, trend, liquidity, savings_progress, suggestion)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, trend, liquidity, f"{savings_rate:.2%}", suggestion))
                conn.commit()
    except Exception as e:
        print("Błąd logowania interakcji AI:", e)