import pandas as pd
from sqlalchemy import create_engine
import os

engine = create_engine("postgresql+psycopg2://postgres:twoje_haslo@localhost/finapp")
df = pd.read_csv("synthetic_financial_situations.csv")
df.to_sql("merged_financial_data", engine, if_exists="replace", index=False)
print("Synthetic data loaded into merged_financial_data!")