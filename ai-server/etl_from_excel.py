import pandas as pd
from sqlalchemy import create_engine
import os

# Ustal ścieżkę do folderu z plikami XLSX
# Jeśli uruchamiasz skrypt z folderu ai-server, a pliki są w katalogu nadrzędnym:
data_folder = os.path.join(os.getcwd(), "public", "data")

engine = create_engine("postgresql+psycopg2://postgres:haslo@localhost/finapp")

def load_excel_to_sql(filename, table_name):
    file_path = os.path.join(data_folder, filename)
    print("Loading file:", file_path)
    df = pd.read_excel(file_path)
    # Dla tabeli 'users' użyj append, dla pozostałych replace
    const_mode = "append" if table_name == "users" else "replace"
    df.to_sql(table_name, engine, if_exists=const_mode, index=False)
    print(f"Data from {filename} loaded into table {table_name}")

# Przykładowe ładowanie
load_excel_to_sql("users.xlsx", "users")
load_excel_to_sql("transactions.xlsx", "transactions")
load_excel_to_sql("profile.xlsx", "profile")
load_excel_to_sql("investments.xlsx", "investments")
load_excel_to_sql("credit-loans.xlsx", "credit_loans")
load_excel_to_sql("account-balances.xlsx", "account_balances")
load_excel_to_sql("Analiza Investycji.xlsx", "analiza_inwestycji")
