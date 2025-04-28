from typing import List, Dict, Optional
import logging
import os
from contextlib import contextmanager
from psycopg2.pool import SimpleConnectionPool
import psycopg2

# Print environment variables with labels for debugging
print("DB_HOST:", os.getenv('DB_HOST'))
print("DB_NAME:", os.getenv('DB_NAME'))
print("DB_USER:", os.getenv('DB_USER'))
print("DB_PASSWORD:", os.getenv('DB_PASSWORD'))
print("DB_PORT:", os.getenv('DB_PORT', '5432'))

logger = logging.getLogger(__name__)

# Global connection pool variable
db_pool = None
@contextmanager
def get_db():
    """Retrieve a connection from the pool and yield it."""
    connection = None
    try:
        connection = db_pool.getconn()
        yield connection
    except Exception as e:
        logger.error(f"Error with database connection: {e}")
        raise Exception(f"Error with database connection: {e}")
    finally:
        if connection:
            db_pool.putconn(connection)

# Add the alias here
get_db_connection = get_db  # Alias for compatibility with existing import statements

@contextmanager
def get_db_cursor(commit: bool = True):
    """Provide a cursor from a connection in the pool with automatic commit/rollback."""
    # ...rest of the function...
    
def init_db_pool():
    """Initialize the database connection pool."""
    global db_pool
    try:
        db_pool = SimpleConnectionPool(
            1, 10,  # min and max connections
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', '5432')
        )
        logger.info("Database connection pool initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing the database pool: {e}")
        raise Exception(f"Error initializing the database pool: {e}")

@contextmanager
def get_db():
    """Retrieve a connection from the pool and yield it."""
    connection = None
    try:
        connection = db_pool.getconn()
        yield connection
    except Exception as e:
        logger.error(f"Error with database connection: {e}")
        raise Exception(f"Error with database connection: {e}")
    finally:
        if connection:
            db_pool.putconn(connection)

@contextmanager
def get_db_cursor(commit: bool = True):
    """Provide a cursor from a connection in the pool with automatic commit/rollback."""
    with get_db() as connection:
        cursor = connection.cursor()
        try:
            yield cursor
            if commit:
                connection.commit()
        except Exception as e:
            connection.rollback()
            logger.error(f"Database query error: {e}")
            raise
        finally:
            cursor.close()

def init_db():
    """Initialize the database and create tables if they don't exist."""
    # Initialize connection pool first
    init_db_pool()
    
    with get_db_cursor() as cursor:
        try:
            # Create financial_analyses table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS financial_analyses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                income REAL NOT NULL,
                expenses REAL NOT NULL,
                assets_value REAL NOT NULL,
                trend TEXT NOT NULL,
                liquidity REAL NOT NULL,
                savings_progress REAL NOT NULL,
                suggestion TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            # Create chat_interactions table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_interactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                question TEXT NOT NULL,
                reply TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            # Create user_profiles table for unified user data
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                financial_data JSONB NOT NULL DEFAULT '{}',
                investment_data JSONB NOT NULL DEFAULT '{}',
                risk_profile JSONB NOT NULL DEFAULT '{}',
                goals JSONB NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            logger.info("Database tables initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization error: {str(e)}")
            raise  # Re-raise to allow higher-level handling

def save_analysis(data: Dict) -> bool:
    """Save financial analysis results to the database."""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
            INSERT INTO financial_analyses 
            (user_id, income, expenses, assets_value, trend, liquidity, savings_progress, suggestion)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """, (
                data["user_id"],
                data["income"],
                data["expenses"],
                data["assets_value"],
                data["trend"],
                data["liquidity"],
                data["savings_progress"],
                data["suggestion"]
            ))
            result = cursor.fetchone()
            logger.info(f"Analysis saved with ID: {result[0]}")
        return True
    except Exception as e:
        logger.error(f"Database save error: {str(e)}")
        return False

def get_user_history(user_id: int, limit: int = 5) -> List[Dict]:
    """Get user's financial analysis history."""
    try:
        with get_db_cursor(commit=False) as cursor:
            cursor.execute("""
            SELECT id, user_id, income, expenses, assets_value, trend, 
                   liquidity, savings_progress, suggestion, created_at
            FROM financial_analyses 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT %s
            """, (user_id, limit))
            
            columns = [desc[0] for desc in cursor.description]
            history = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return history
    except Exception as e:
        logger.error(f"Database query error: {str(e)}")
        return []
