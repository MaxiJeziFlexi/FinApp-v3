from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

# Importujemy zależności związane z bazą danych oraz modele finansowe
from core.database import get_db
from core.financial_models import AdvisoryRequest  # Upewnij się, że masz odpowiedni model
# Import doradców – zakładamy, że są już zaimplementowani
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor
from utils.logger import logger

router = APIRouter()

# Modele Pydantic dla specjalistycznej porady

class Recommendation(BaseModel):
    type: str
    allocation: float
    description: str

class SpecializedAdviceRequest(BaseModel):
    user_id: int
    question: str
    context: Dict[str, Any] = Field(default_factory=dict)
    advisory_type: str  # np. "investment", "legal", "tax"

class SpecializedAdviceResponse(BaseModel):
    answer: str
    recommendations: Optional[List[Recommendation]] = None

# Inicjalizacja doradców
financial_advisor = FinancialLegalAdvisor()
investment_advisor = InvestmentAdvisor()

@router.post("/specialized-advice", response_model=SpecializedAdviceResponse, tags=["Specialized Advice"])
async def get_specialized_advice(data: SpecializedAdviceRequest, db: Session = Depends(get_db)):
    try:
        advisory_request = AdvisoryRequest(
            user_id=data.user_id,
            question=data.question,
            context=data.context,
            advisory_type=data.advisory_type,
            language="pl"
        )
        
        if data.advisory_type in ["investment", "portfolio"]:
            response = investment_advisor.process_advisory_request(advisory_request)
        elif data.advisory_type == "legal":
            response = financial_advisor.generate_legal_advice(
                data.question, jurisdiction=data.context.get("jurisdiction", "default")
            )
        elif data.advisory_type == "tax":
            response = financial_advisor.generate_tax_advice(advisory_request)
        else:
            response = financial_advisor.process_advisory_request(advisory_request)
        
        # Używamy getattr, aby sprawdzić, czy recommendations istnieje; jeśli nie – ustawiamy None
        return SpecializedAdviceResponse(
            answer=response.answer,
            recommendations=getattr(response, "recommendations", None)
        )
    except Exception as e:
        logger.error(f"Błąd generowania wyspecjalizowanej porady: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Błąd generowania wyspecjalizowanej porady"
        )
