import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sklearn.preprocessing import StandardScaler

# Konfiguracja połączenia z bazą PostgreSQL (zmień parametry wg swoich ustawień)
db_url = "postgresql+psycopg2://postgres:twoje_haslo@localhost/finapp"
engine = create_engine(db_url)

# Pobierz dane z istniejących tabel
df_financial = pd.read_sql("SELECT income, expenses, assets_value, trend FROM financial_analyses", engine)
df_demo = pd.read_sql("SELECT country_code, gender, age_group, average_income, average_expenses FROM demographics", engine)

# Przykładowa transformacja: oblicz wskaźnik oszczędności
df_financial["savings_ratio"] = df_financial["income"] / df_financial["expenses"]

# Normalizacja wartości liczbowych w df_financial
scaler = StandardScaler()
cols_to_normalize = ["income", "expenses", "assets_value", "savings_ratio"]
df_financial[cols_to_normalize] = scaler.fit_transform(df_financial[cols_to_normalize])

# Jeśli chcesz połączyć z danymi demograficznymi, musisz ustalić wspólny klucz lub po prostu dołączyć dane
# (przykładowo, możemy założyć, że wszystkie rekordy dotyczą tej samej grupy, lub zrobić cross join dla testów)
df_merged = df_financial.copy()
# Dodajemy przykładowe kolumny demograficzne, np. średni dochód i wydatki
# (w praktyce łączysz tabele po odpowiednich kluczach)
df_merged["avg_income_demo"] = df_demo["average_income"].mean()
df_merged["avg_expenses_demo"] = df_demo["average_expenses"].mean()

# Zapisz znormalizowane dane do nowej tabeli w bazie danych
df_merged.to_sql("merged_financial_data", engine, if_exists="replace", index=False)

print("Znormalizowane dane zapisane do tabeli 'merged_financial_data'.")
    