import numpy as np
import torch
import torch.nn.functional as F
from .database import save_analysis, get_user_history
from .schemas import FinanceInput, AnalysisResponse
from typing import Dict, List
import logging
logger = logging.getLogger(__name__)

def normalize_features(features: List[float]) -> List[float]:
    """Normalizacja cech finansowych"""
    scales = [100000.0, 20000.0, 100000.0, 500000.0]  # Zakresy normalizacji
    return [f/s for f, s in zip(features, scales)]

def generate_suggestion(trend: str, liquidity: float, confidence: float) -> str:
    """Generuje rekomendację na podstawie wyników"""
    base_suggestions = {
        "Bull": "Twoja sytuacja finansowa jest korzystna – rozważ dalsze inwestycje.",
        "Neutral": "Obecny stan finansowy jest umiarkowany – warto monitorować sytuację.",
        "Bear": "Sytuacja jest niekorzystna – rozważ korektę budżetu i ograniczenie ryzyka."
    }
    
    suggestion = base_suggestions.get(trend, "Nieznany trend finansowy")
    
    if liquidity < 0:
        return "Krytyczna sytuacja - wydatki przekraczają dochody. Natychmiast zmniejsz koszty."
    
    if confidence < 0.6:
        return f"Wynik niepewny. {suggestion}"
    
    return suggestion

def perform_analysis(data: FinanceInput, model) -> Dict:
    """Główna funkcja analizy finansowej"""
    try:
        # Przygotowanie cech
        features = [
            data.assets_value,
            data.expenses,
            data.current_savings,
            max(0, data.savings_goal - data.current_savings)
        ]
        
        # Normalizacja i predykcja
        normalized = normalize_features(features)
        with torch.no_grad():
            x = torch.tensor([normalized], dtype=torch.float32)
            output = model(x).numpy()[0]
            probabilities = F.softmax(torch.tensor(output), dim=0).numpy()
            trend_idx = np.argmax(probabilities)
            trend = ["Bear", "Neutral", "Bull"][trend_idx]
            confidence = float(probabilities[trend_idx])
        
        # Obliczenia finansowe
        liquidity = data.income - data.expenses
        savings_rate = data.current_savings / data.savings_goal if data.savings_goal else 0
        
        return {
            "trend": trend,
            "liquidity_status": liquidity,
            "savings_progress": f"{savings_rate:.2%}",
            "suggestion": generate_suggestion(trend, liquidity, confidence),
            "country_tax": get_tax_info(data.country_code),
            "input_features": features,
            "confidence": confidence,
            "user_id": data.user_id,
            "income": data.income,
            "expenses": data.expenses,
            "assets_value": data.assets_value
        }
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise

def get_tax_info(country_code: str) -> Dict:
    """Zwraca informacje podatkowe dla kraju"""
    tax_rates = {
        "PL": {"vat": 0.23, "income_tax": 0.17},
        "DE": {"vat": 0.19, "income_tax": 0.20},
        "US": {"vat": 0.07, "income_tax": 0.12}
    }
    return tax_rates.get(country_code, tax_rates["PL"])

def save_analysis_result(data: FinanceInput, result: Dict) -> bool:
    """Zapisuje wynik analizy do bazy danych"""
    return save_analysis({
        "user_id": data.user_id,
        "income": data.income,
        "expenses": data.expenses,
        "assets_value": data.assets_value,
        "trend": result["trend"],
        "liquidity": result["liquidity_status"],
        "savings_progress": float(result["savings_progress"].rstrip('%'))/100,
        "suggestion": result["suggestion"]
    })

def get_user_history(user_id: int, limit: int = 5) -> List[Dict]:
    """Pobiera historię analiz użytkownika"""
    return get_user_history(user_id, limit)