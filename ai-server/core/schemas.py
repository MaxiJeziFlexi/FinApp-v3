from pydantic import BaseModel, Field
from typing import List, Optional

class FinanceInput(BaseModel):
    """Schemat danych wejściowych do analizy"""
    user_id: int = Field(..., example=123)
    income: float = Field(..., gt=0, example=7500.0)
    expenses: float = Field(..., ge=0, example=5200.0)
    assets_value: float = Field(..., ge=0, example=30000.0)
    current_savings: float = Field(..., ge=0, example=25000.0)
    savings_goal: float = Field(..., ge=0, example=100000.0)

class AnalysisResponse(BaseModel):
    """Schemat odpowiedzi z analizy"""
    trend: str = Field(..., example="Bull")
    liquidity_status: float = Field(..., example=2300.0)
    savings_progress: str = Field(..., example="25.00%")
    suggestion: str = Field(..., example="Twoja sytuacja finansowa jest korzystna...")
    country_tax: dict = Field(..., example={"vat": 0.23, "income_tax": 0.17})
    input_features: List[float] = Field(..., example=[30000.0, 5200.0, 25000.0, 75000.0])
    confidence: float = Field(..., ge=0, le=1, example=0.85)

class ModelInfoResponse(BaseModel):
    """Informacje o modelu"""
    model_architecture: str
    model_path: str
    model_exists: bool
    input_size: int
    output_size: int