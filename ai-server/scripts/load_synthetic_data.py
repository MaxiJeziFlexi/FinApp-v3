import pandas as pd
from sqlalchemy import create_engine

# Upewnij się, że DATABASE_URL jest poprawnie skonfigurowany (zmień "twoje_haslo" na właściwe hasło)
DATABASE_URL = "postgresql+psycopg2://postgres:twoje_haslo@localhost/finapp"
engine = create_engine(DATABASE_URL)

# Wczytaj dane z pliku CSV (upewnij się, że plik znajduje się w tym samym folderze co skrypt)
df = pd.read_csv("synthetic_financial_situations.csv")
print("Loaded synthetic data shape:", df.shape)

# Zapisz dane do tabeli merged_financial_data (nadpisując zawartość, jeśli istnieje)
df.to_sql("merged_financial_data", engine, if_exists="replace", index=False)
print("Synthetic data loaded into merged_financial_data!")
