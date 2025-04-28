import pandas as pd
from sqlalchemy import create_engine
import logging
from datetime import datetime

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def load_and_process_data():
    try:
        logger.info("Rozpoczęcie przetwarzania danych")
        
        # Ścieżka do folderu z danymi (dostosuj do swojej struktury!)
        data_dir = "/Users/maksbraziewicz/Desktop/Implement SI/logistics-dashboard/ai-server/data"
        
        # 1. Wczytanie wszystkich plików CSV z pełnymi ścieżkami
        expert_df = pd.read_csv(f"{data_dir}/Users/maksbraziewicz/Desktop/Implement SI/logistics-dashboard/ai-server/data/synthetic_expert_analyses.csv")
        demo_df = pd.read_csv(f"{data_dir}synthetic_demographics.csv")
        market_df = pd.read_csv(f"{data_dir}synthetic_market_data.csv")
        legal_df = pd.read_csv(f"{data_dir}synthetic_legal_settings.csv")
        
        logger.info("Dane wczytane pomyślnie")
        
        # 2. Przetworzenie danych eksperckich
        expert_df = expert_df.drop_duplicates()
        expert_df['publication_date'] = pd.to_datetime(expert_df['publication_date'])
        
        # 3. Przetworzenie danych demograficznych
        demo_df['savings'] = demo_df['average_income'] - demo_df['average_expenses']
        country_stats = demo_df.groupby('country_code').agg({
            'average_income': 'mean',
            'average_expenses': 'mean',
            'savings': 'mean',
            'sample_size': 'sum'
        }).reset_index()
        
        # 4. Przetworzenie danych rynkowych
        market_df['last_updated'] = pd.to_datetime(market_df['last_updated'])
        latest_prices = market_df.sort_values('last_updated').groupby('instrument').last().reset_index()
        
        # 5. Przetworzenie ustawień prawnych
        legal_df = legal_df.drop_duplicates()
        
        logger.info("Dane przetworzone pomyślnie")
        
        return {
            'expert_analyses': expert_df,
            'demographics': demo_df,
            'country_stats': country_stats,
            'market_data': latest_prices,
            'legal_settings': legal_df
        }
        
    except Exception as e:
        logger.error(f"Błąd przetwarzania danych: {str(e)}")
        raise

def save_to_database(data_dict):
    try:
        engine = create_engine("postgresql+psycopg2://postgres:twoje_haslo@localhost/finapp")
        
        for table_name, df in data_dict.items():
            df.to_sql(
                table_name,
                engine,
                if_exists='replace',
                index=False
            )
            logger.info(f"Zapisano tabelę {table_name} do bazy danych")
            
    except Exception as e:
        logger.error(f"Błąd zapisu do bazy danych: {str(e)}")
        raise

def generate_report(data_dict):
    try:
        report = []
        
        # 1. Analiza danych demograficznych
        demo_stats = data_dict['demographics'].groupby(['country_code', 'age_group']).agg({
            'average_income': 'mean',
            'average_expenses': 'mean',
            'savings': 'mean'
        })
        report.append("=== Analiza demograficzna ===")
        report.append(demo_stats.to_string())
        
        # 2. Najpopularniejsze tematy analiz
        top_topics = data_dict['expert_analyses']['title'].value_counts().head(5)
        report.append("\n=== Najpopularniejsze tematy analiz ===")
        report.append(top_topics.to_string())
        
        # 3. Średnie ceny instrumentów
        avg_prices = data_dict['market_data'].groupby('category')['current_price'].mean()
        report.append("\n=== Średnie ceny instrumentów ===")
        report.append(avg_prices.to_string())
        
        # Zapisz raport do pliku
        with open('financial_analysis_report.txt', 'w') as f:
            f.write('\n'.join(report))
            
        logger.info("Raport wygenerowany pomyślnie")
        
    except Exception as e:
        logger.error(f"Błąd generowania raportu: {str(e)}")
        raise

def main():
    try:
        start_time = datetime.now()
        
        # 1. Przetwórz dane
        processed_data = load_and_process_data()
        
        # 2. Zapisz do bazy danych (opcjonalne)
        # save_to_database(processed_data)
        
        # 3. Wygeneruj raport
        generate_report(processed_data)
        
        logger.info(f"Proces zakończony sukcesem. Czas wykonania: {datetime.now() - start_time}")
        
    except Exception as e:
        logger.error(f"Proces zakończony niepowodzeniem: {str(e)}")

if __name__ == "__main__":
    main()