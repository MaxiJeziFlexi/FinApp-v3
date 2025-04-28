# db_manager.py
import os
import logging
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Connection pool configuration
DB_POOL_MIN = 1
DB_POOL_MAX = 10
db_pool = None

def init_db_pool():
    """Initialize the database connection pool."""
    global db_pool
    try:
        db_pool = SimpleConnectionPool(
            DB_POOL_MIN,
            DB_POOL_MAX,
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', '5432')
        )
        logger.info("PostgreSQL connection pool initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing PostgreSQL connection pool: {str(e)}")
        raise

@contextmanager
def get_db_connection():
    """Get a database connection from the pool."""
    connection = None
    try:
        connection = db_pool.getconn()
        yield connection
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    finally:
        if connection:
            db_pool.putconn(connection)

@contextmanager
def get_db_cursor(commit=True):
    """Get a database cursor from a connection in the pool."""
    with get_db_connection() as connection:
        cursor = connection.cursor()
        try:
            yield cursor
            if commit:
                connection.commit()
        except Exception as e:
            connection.rollback()
            logger.error(f"Database query error: {str(e)}")
            raise
        finally:
            cursor.close()
