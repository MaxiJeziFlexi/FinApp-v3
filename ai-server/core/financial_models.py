"""
Financial models for AI Financial Advisor.
Contains data models for financial, legal, and investment advisory.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union, Any
from datetime import datetime
from enum import Enum


class FinancialSituation(BaseModel):
    """User's financial situation model."""
    user_id: int
    income: float = Field(..., description="Monthly income")
    expenses: float = Field(..., description="Monthly expenses")
    assets_value: float = Field(..., description="Total value of assets")
    current_savings: float = Field(..., description="Current savings amount")
    savings_goal: Optional[float] = Field(None, description="Savings goal amount")
    interest_rate: Optional[float] = Field(0.0, description="Interest rate for savings")
    inflation_rate: Optional[float] = Field(0.0, description="Current inflation rate")
    market_index: Optional[float] = Field(0.0, description="Market index value")
    country_code: Optional[str] = Field("PL", description="Country code (ISO)")
    transaction_descriptions: Optional[List[str]] = Field([], description="Recent transaction descriptions")
    recurring_expenses: Optional[float] = Field(0.0, description="Monthly recurring expenses")
    one_time_expenses: Optional[float] = Field(0.0, description="One-time expenses")
    tax_bracket: Optional[float] = Field(0.0, description="Tax bracket percentage")
    age: Optional[int] = Field(0, description="User's age")
    financial_goal: Optional[str] = Field("", description="Financial goal description")
    
    @validator('country_code')
    def validate_country_code(cls, v):
        """Validate country code."""
        if v and len(v) != 2:
            raise ValueError('Country code must be a 2-letter ISO code')
        return v.upper() if v else "PL"


class LegalJurisdiction(str, Enum):
    """Legal jurisdiction enum."""
    POLAND = "PL"
    EUROPEAN_UNION = "EU"
    UNITED_STATES = "US"
    UNITED_KINGDOM = "UK"
    GERMANY = "DE"
    FRANCE = "FR"
    OTHER = "OTHER"


class TaxSystem(str, Enum):
    """Tax system enum."""
    PROGRESSIVE = "progressive"
    FLAT = "flat"
    MIXED = "mixed"


class LegalContext(BaseModel):
    """Legal context model for advisory."""
    jurisdiction: LegalJurisdiction = Field(..., description="Legal jurisdiction")
    tax_system: TaxSystem = Field(..., description="Tax system type")
    vat_rate: float = Field(..., description="VAT rate percentage")
    income_tax_rate: float = Field(..., description="Income tax rate percentage")
    capital_gains_tax_rate: float = Field(..., description="Capital gains tax rate percentage")
    tax_year: int = Field(..., description="Current tax year")
    tax_allowances: Dict[str, float] = Field(default_factory=dict, description="Available tax allowances")
    tax_deductions: Dict[str, float] = Field(default_factory=dict, description="Available tax deductions")
    special_regulations: Optional[Dict[str, str]] = Field(None, description="Special tax/legal regulations")


class InvestmentType(str, Enum):
    """Investment type enum."""
    STOCKS = "stocks"
    BONDS = "bonds"
    REAL_ESTATE = "real_estate"
    CRYPTO = "crypto"
    MUTUAL_FUNDS = "mutual_funds"
    ETF = "etf"
    SAVINGS = "savings"
    PENSION = "pension"
    OTHER = "other"


class RiskLevel(str, Enum):
    """Investment risk level enum."""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class Investment(BaseModel):
    """Investment model."""
    name: str = Field(..., description="Investment name")
    type: InvestmentType = Field(..., description="Investment type")
    current_value: float = Field(..., description="Current investment value")
    initial_value: float = Field(..., description="Initial investment value")
    acquisition_date: datetime = Field(..., description="Acquisition date")
    risk_level: RiskLevel = Field(..., description="Risk level")
    expected_return: float = Field(..., description="Expected annual return percentage")
    actual_return: Optional[float] = Field(None, description="Actual return percentage")
    currency: str = Field("PLN", description="Currency code")
    notes: Optional[str] = Field(None, description="Additional notes")


class InvestmentPortfolio(BaseModel):
    """Investment portfolio model."""
    user_id: int
    investments: List[Investment] = Field(default_factory=list, description="List of investments")
    total_value: float = Field(..., description="Total portfolio value")
    risk_profile: RiskLevel = Field(..., description="Overall risk profile")
    diversification_score: float = Field(..., description="Portfolio diversification score (0-100)")
    performance_ytd: float = Field(..., description="Year-to-date performance percentage")
    performance_1y: Optional[float] = Field(None, description="1-year performance percentage")
    performance_3y: Optional[float] = Field(None, description="3-year performance percentage")
    performance_5y: Optional[float] = Field(None, description="5-year performance percentage")


class FinancialGoal(BaseModel):
    """Financial goal model."""
    id: Optional[str] = None
    name: str = Field(..., description="Goal name")
    target: float = Field(..., description="Target amount")
    current: float = Field(0, description="Current amount")
    date: str = Field(..., description="Target date (YYYY-MM-DD)")
    priority: int = Field(1, description="Priority (1-5, 5 being highest)")
    notes: Optional[str] = Field(None, description="Additional notes")


class FinancialAnalysisResult(BaseModel):
    """Financial analysis result model."""
    trend: str = Field(..., description="Financial trend (Bull, Bear, Neutral)")
    liquidity_status: float = Field(..., description="Liquidity status amount")
    savings_progress: str = Field(..., description="Savings progress percentage")
    suggestion: str = Field(..., description="Financial suggestion")
    country_tax: Dict[str, float] = Field(..., description="Country tax information")
    input_features: List[float] = Field(..., description="Input features for the model")
    trend_history: List[str] = Field(..., description="Historical trend data")


class LegalAdvice(BaseModel):
    """Legal advice model."""
    topic: str = Field(..., description="Legal topic")
    jurisdiction: LegalJurisdiction = Field(..., description="Legal jurisdiction")
    advice: str = Field(..., description="Legal advice text")
    references: List[str] = Field(default_factory=list, description="Legal references")
    disclaimer: str = Field(..., description="Legal disclaimer")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")


class TaxAdvice(BaseModel):
    """Tax advice model."""
    topic: str = Field(..., description="Tax topic")
    jurisdiction: LegalJurisdiction = Field(..., description="Tax jurisdiction")
    tax_year: int = Field(..., description="Tax year")
    advice: str = Field(..., description="Tax advice text")
    potential_savings: Optional[float] = Field(None, description="Potential tax savings")
    references: List[str] = Field(default_factory=list, description="Tax references")
    disclaimer: str = Field(..., description="Tax disclaimer")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")


class InvestmentAdvice(BaseModel):
    """Investment advice model."""
    portfolio_id: int = Field(..., description="Investment portfolio ID")
    advice_type: str = Field(..., description="Type of investment advice")
    recommendation: str = Field(..., description="Investment recommendation")
    risk_assessment: str = Field(..., description="Risk assessment")
    expected_outcome: str = Field(..., description="Expected outcome")
    timeframe: str = Field(..., description="Recommended timeframe")
    disclaimer: str = Field(..., description="Investment disclaimer")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")


class AdvisoryRequest(BaseModel):
    """Advisory request model."""
    user_id: int
    question: str = Field(..., description="User's question")
    context: Dict[str, Any] = Field(default_factory=dict, description="Context information")
    advisory_type: str = Field(..., description="Type of advisory (financial, legal, tax, investment)")
    language: str = Field("pl", description="Preferred language")


class AdvisoryResponse(BaseModel):
    """Advisory response model."""
    user_id: int
    question: str = Field(..., description="Original question")
    answer: str = Field(..., description="Advisory answer")
    advisory_type: str = Field(..., description="Type of advisory provided")
    confidence_score: float = Field(..., description="Confidence score (0-1)")
    sources: List[str] = Field(default_factory=list, description="Information sources")
    disclaimer: str = Field(..., description="Advisory disclaimer")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    additional_resources: Optional[Dict[str, str]] = Field(None, description="Additional resources")
