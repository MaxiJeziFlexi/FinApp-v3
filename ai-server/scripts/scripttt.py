# Run this script to inspect your current database schema
import psycopg2
import os

# Debugging: Print database connection parameters
print("Database connection parameters:")
print(f"DB_NAME: {os.getenv('DB_NAME')}")
print(f"DB_USER: {os.getenv('DB_USER')}")
print(f"DB_PASSWORD: {os.getenv('DB_PASSWORD')}")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_PORT: {os.getenv('DB_PORT')}")

# Connect to the database
try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    print("Connection successful!")
except Exception as e:
    print(f"Failed to connect to the database: {e}")
    exit()

try:
    cursor = conn.cursor()

    # List all tables
    cursor.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    """)
    tables = cursor.fetchall()

    if not tables:
        print("No tables found in the database.")
    else:
        print("Existing tables:")
        for table in tables:
            print(f"- {table[0]}")

            # Show table schema
            cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns
            WHERE table_name = %s
            """, (table[0],))
            
            columns = cursor.fetchall()
            for column in columns:
                print(f"  - {column[0]}: {column[1]}")

except Exception as e:
    print(f"Error while fetching tables or columns: {e}")
finally:
    cursor.close()
    conn.close()
    print("Connection closed.")