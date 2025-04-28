from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from ..core import services
from ..core.schemas import FinanceInput, AnalysisResponse, ModelInfoResponse
from ..core.models import FinancialModel
import logging

router = APIRouter(prefix="/analyze", tags=["Financial Analysis"])
logger = logging.getLogger(__name__)

# Inicjalizacja modelu
model = FinancialModel.load_model()

@router.post("/", response_model=AnalysisResponse)
async def analyze_finances(data: FinanceInput):
    """Endpoint do analizy sytuacji finansowej"""
    try:
        logger.info(f"Rozpoczęto analizę dla danych: {data}")
        result = services.perform_analysis(data, model)
        logger.info(f"Wynik analizy: {result}")
        services.save_analysis_result(data, result)
        return result
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Zwraca informacje o modelu AI"""
    try:
        return {
            "model_architecture": str(model),
            "model_path": "models/financial_model_v2.pth",
            "model_exists": True,
            "input_size": model.fc1.in_features,
            "output_size": model.fc3.out_features
        }
    except Exception as e:
        logger.error(f"Model info error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{user_id}")
async def get_history(user_id: int, limit: Optional[int] = 5):
    """Pobiera historię analiz użytkownika"""
    try:
        return services.get_user_history(user_id, limit)
    except Exception as e:
        logger.error(f"History error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
