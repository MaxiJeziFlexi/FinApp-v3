import pandas as pd
from sqlalchemy import create_engine
import os

# Upewnij się, że masz ustawione zmienne środowiskowe lub podaj je bezpośrednio
DATABASE_URL = "postgresql+psycopg2://postgres:twoje_haslo@localhost/finapp"
engine = create_engine(DATABASE_URL)

# Ścieżka do pliku CSV zawierającego dane
# Upewnij się, że plik CSV ma kolumny: user_id, goal_name, target_amount, current_amount, due_date,
# investment_name, investment_type, amount_invested, current_value, currency, start_date,
# maturity_date, status, broker, portfolio, account_id, loan_amount, interest_rate,
# duration_months, monthly_payment, status_1, account_name, account_type, balance, currency_2, status_2, goal_gap
file_path = "path/to/your/merged_financial_data.csv"  # zmień na rzeczywistą ścieżkę

# Wczytanie danych z CSV
try:
    df = pd.read_csv(file_path)
    print("Columns in CSV:", df.columns.tolist())
except Exception as e:
    print(f"Error reading CSV file: {e}")
    exit()

# Opcjonalnie: dokonaj konwersji typów, jeśli to potrzebne
# Przykładowo, upewnij się, że kolumny numeryczne są odpowiednio skonwertowane:
numeric_columns = [
    "target_amount", "current_amount", "amount_invested", "current_value",
    "loan_amount", "interest_rate", "duration_months", "monthly_payment",
    "balance", "goal_gap"
]
for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

# Import danych do bazy - używamy opcji "append", aby dodać dane do istniejącej tabeli
try:
    df.to_sql("merged_financial_data", engine, if_exists="append", index=False)
    print("Data imported successfully into merged_financial_data.")
except Exception as e:
    print(f"Error importing data into database: {e}")
