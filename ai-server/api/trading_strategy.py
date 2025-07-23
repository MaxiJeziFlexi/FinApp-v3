from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
from ai.trading_strategy_generator import TradingStrategyGenerator
from core.financial_models import AdvisoryRequest, AdvisoryResponse

router = APIRouter()
strategy_generator = TradingStrategyGenerator()

class TradingStrategyRequest(BaseModel):
    user_id: int
    question: str = Field(..., example="Best day trading strategy?")
    context: Dict[str, Any] = Field(default_factory=dict)
    language: str = Field("pl", example="pl")

@router.post("/trading-strategy", response_model=AdvisoryResponse, tags=["Trading Strategy"])
async def generate_trading_strategy(data: TradingStrategyRequest):
    try:
        request = AdvisoryRequest(
            user_id=data.user_id,
            question=data.question,
            context=data.context,
            advisory_type="trading_strategy",
            language=data.language,
        )
        return strategy_generator.generate_strategy(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))