"""
API routes for financial and investment advisory services.
This module provides FastAPI endpoints for financial, legal, tax, and investment advisory.
"""

import logging
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Import your database connection
from core.database import get_db

# Import models
from core.financial_models import (
    FinancialSituation, LegalContext, LegalJurisdiction, TaxSystem,
    Investment, InvestmentPortfolio, InvestmentType, RiskLevel,
    LegalAdvice, TaxAdvice, InvestmentAdvice, AdvisoryRequest, AdvisoryResponse
)

# Import advisory modules
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/advisory",
    tags=["advisory"],
    responses={404: {"description": "Not found"}},
)

# Initialize advisors
financial_advisor = FinancialLegalAdvisor()
investment_advisor = InvestmentAdvisor()


@router.post("/financial", response_model=AdvisoryResponse)
async def get_financial_advice(
    request: AdvisoryRequest,
    db: Session = Depends(get_db)
):
    """
    Get financial advice based on user's financial situation.
    
    Args:
        request: Advisory request with financial context
        db: Database session
        
    Returns:
        AdvisoryResponse with financial advice
    """
    try:
        logger.info(f"Processing financial advisory request for user {request.user_id}")
        response = financial_advisor.process_advisory_request(request)
        return response
    except Exception as e:
        logger.error(f"Error processing financial advisory request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing financial advisory request"
        )


@router.post("/legal", response_model=LegalAdvice)
async def get_legal_advice(
    topic: str,
    jurisdiction: LegalJurisdiction,
    db: Session = Depends(get_db)
):
    """
    Get legal advice on a specific topic.
    
    Args:
        topic: Legal topic
        jurisdiction: Legal jurisdiction
        db: Database session
        
    Returns:
        LegalAdvice object
    """
    try:
        logger.info(f"Processing legal advice request for topic: {topic}")
        advice = financial_advisor.generate_legal_advice(topic, jurisdiction)
        return advice
    except Exception as e:
        logger.error(f"Error generating legal advice: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating legal advice"
        )


@router.post("/tax", response_model=TaxAdvice)
async def get_tax_advice(
    situation: FinancialSituation,
    db: Session = Depends(get_db)
):
    """
    Get tax advice based on user's financial situation.
    
    Args:
        situation: User's financial situation
        db: Database session
        
    Returns:
        TaxAdvice object
    """
    try:
        logger.info(f"Processing tax advice request for user {situation.user_id}")
        advice = financial_advisor.generate_tax_advice(situation)
        return advice
    except Exception as e:
        logger.error(f"Error generating tax advice: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating tax advice"
        )


@router.post("/portfolio-analysis", response_model=str)
async def analyze_portfolio(
    portfolio: InvestmentPortfolio,
    db: Session = Depends(get_db)
):
    """
    Analyze investment portfolio and provide insights.
    
    Args:
        portfolio: User's investment portfolio
        db: Database session
        
    Returns:
        Portfolio analysis text
    """
    try:
        logger.info(f"Processing portfolio analysis request for user {portfolio.user_id}")
        analysis = investment_advisor.generate_portfolio_analysis(portfolio)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing portfolio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing portfolio"
        )


@router.post("/investment-recommendation", response_model=InvestmentAdvice)
async def get_investment_recommendation(
    portfolio: InvestmentPortfolio,
    db: Session = Depends(get_db)
):
    """
    Get personalized investment recommendation.
    
    Args:
        portfolio: User's investment portfolio
        db: Database session
        
    Returns:
        InvestmentAdvice object
    """
    try:
        logger.info(f"Processing investment recommendation request for user {portfolio.user_id}")
        recommendation = investment_advisor.generate_investment_recommendation(portfolio)
        return recommendation
    except Exception as e:
        logger.error(f"Error generating investment recommendation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating investment recommendation"
        )


@router.post("/chat", response_model=AdvisoryResponse)
async def chat_with_advisor(
    request: AdvisoryRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with AI financial advisor.
    
    Args:
        request: Advisory request with question and context
        db: Database session
        
    Returns:
        AdvisoryResponse with answer
    """
    try:
        logger.info(f"Processing chat request for user {request.user_id}")
        
        # Route to appropriate advisor based on advisory type
        if request.advisory_type in ["financial", "legal", "tax"]:
            response = financial_advisor.process_advisory_request(request)
        elif request.advisory_type in ["investment", "portfolio"]:
            response = investment_advisor.process_advisory_request(request)
        else:
            # Default to financial advisor for general questions
            response = financial_advisor.process_advisory_request(request)
        
        return response
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing chat request"
        )
