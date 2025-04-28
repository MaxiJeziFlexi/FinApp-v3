# filepath: /Users/maksbraziewicz/Desktop/Implement SI/logistics-dashboard/ai-server/core/db_utils.py
import psycopg2
import os
from utils.logger import logger

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