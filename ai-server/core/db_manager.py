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
        if db_pool is None:
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
        return db_pool
    except Exception as e:
        logger.error(f"Error initializing PostgreSQL connection pool: {str(e)}")
        raise

def ensure_pool_initialized():
    """Ensure the database pool is initialized."""
    global db_pool
    if db_pool is None:
        init_db_pool()
    return db_pool

@contextmanager
def get_db_connection():
    """Get a database connection from the pool."""
    ensure_pool_initialized()  # Make sure pool is ready
    connection = None
    try:
        if db_pool is None:
            raise Exception("Database pool is not initialized")
        connection = db_pool.getconn()
        if connection is None:
            raise Exception("Failed to get connection from pool")
        yield connection
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    finally:
        if connection and db_pool:
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