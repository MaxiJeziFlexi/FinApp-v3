from fastapi import APIRouter, BackgroundTasks, HTTPException
from core.database import get_db_connection
from utils.logger import logger
import pandas as pd
import os
from datetime import datetime

router = APIRouter()

def retrain_model_from_interactions():
    """
    Funkcja pobierająca dane z bazy i trenująca model na nowo.
    """
    try:
        # Połączenie z bazą danych
        conn = get_db_connection()
        cur = conn.cursor()

        # Pobierz dane treningowe z tabeli chat_interactions
        cur.execute("""
            SELECT user_id, question, reply, timestamp 
            FROM chat_interactions 
            ORDER BY timestamp DESC
        """)
        
        interactions = cur.fetchall()
        
        if not interactions:
            logger.warning("Brak danych do trenowania")
            return False

        # Konwersja do DataFrame
        df = pd.DataFrame(interactions, columns=['user_id', 'question', 'reply', 'timestamp'])
        
        # Zapisz dane treningowe do pliku
        training_data_path = os.path.join(os.path.dirname(__file__), "../data/training_data.csv")
        os.makedirs(os.path.dirname(training_data_path), exist_ok=True)
        df.to_csv(training_data_path, index=False)
        
        logger.info(f"Zapisano {len(df)} przykładów treningowych")
        
        # Zamknij połączenie z bazą
        cur.close()
        conn.close()
        
        return True

    except Exception as e:
        logger.error(f"Błąd podczas pobierania danych treningowych: {str(e)}")
        raise

def run_retrain():
    """
    Główna funkcja procesu trenowania.
    """
    try:
        logger.info("Rozpoczęcie procesu trenowania")
        
        # Pobierz dane i przygotuj do trenowania
        if not retrain_model_from_interactions():
            raise Exception("Nie udało się pobrać danych treningowych")

        # Tutaj dodaj właściwy kod trenowania modelu
        # Na przykład:
        # model.train(training_data_path)
        
        logger.info("Zakończono proces trenowania")
        return True

    except Exception as e:
        logger.error(f"Błąd podczas trenowania: {str(e)}")
        return False

@router.post("/retrain", tags=["Retraining"])
async def retrain(background_tasks: BackgroundTasks):
    """
    Endpoint API inicjujący proces trenowania w tle.
    """
    try:
        background_tasks.add_task(run_retrain)
        return {
            "status": "success",
            "message": "Rozpoczęto proces trenowania w tle",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Błąd podczas inicjowania trenowania: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
