# risk_assessment.py
import logging
from typing import Dict, Any, List, Optional
from enum import Enum
import json
from core.db_manager import get_db_cursor
from core.financial_models import RiskLevel

logger = logging.getLogger(__name__)

class RiskFactor(str, Enum):
    """Risk factors used in risk assessment."""
    INCOME_STABILITY = "income_stability"
    DEBT_RATIO = "debt_ratio"
    EMERGENCY_FUND = "emergency_fund"
    INVESTMENT_HORIZON = "investment_horizon"
    AGE = "age"
    DEPENDENTS = "dependents"
    MARKET_CONDITIONS = "market_conditions"
    INVESTMENT_EXPERIENCE = "investment_experience"
    INCOME_LEVEL = "income_level"
    NET_WORTH = "net_worth"

class RiskAssessmentService:
    """Centralized service for risk assessment across all modules."""
    
    def __init__(self):
        """Initialize the risk assessment service."""
        self.risk_factors = {
            RiskFactor.INCOME_STABILITY: 0.15,
            RiskFactor.DEBT_RATIO: 0.15,
            RiskFactor.EMERGENCY_FUND: 0.15,
            RiskFactor.INVESTMENT_HORIZON: 0.15,
            RiskFactor.AGE: 0.10,
            RiskFactor.DEPENDENTS: 0.05,
            RiskFactor.MARKET_CONDITIONS: 0.10,
            RiskFactor.INVESTMENT_EXPERIENCE: 0.05,
            RiskFactor.INCOME_LEVEL: 0.05,
            RiskFactor.NET_WORTH: 0.05
        }
    
    def calculate_risk_score(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate unified risk score from 0 (very conservative) to 100 (very aggressive).
        
        Args:
            user_data: Dictionary containing user financial and personal data
            
        Returns:
            Dictionary with risk score, risk level, and factor contributions
        """
        score = 0
        factor_scores = {}
        
        # Income stability (higher is better)
        if "income_history" in user_data:
            stability = self._calculate_income_stability(user_data["income_history"])
            factor_score = stability * 100  # Convert to 0-100 scale
            score += factor_score * self.risk_factors[RiskFactor.INCOME_STABILITY]
            factor_scores[RiskFactor.INCOME_STABILITY] = factor_score
        else:
            # Default to medium stability if no history
            factor_score = 50
            score += factor_score * self.risk_factors[RiskFactor.INCOME_STABILITY]
            factor_scores[RiskFactor.INCOME_STABILITY] = factor_score
        
        # Debt ratio (lower is better)
        if "total_debt" in user_data and "annual_income" in user_data and user_data["annual_income"] > 0:
            debt_ratio = user_data["total_debt"] / user_data["annual_income"]
            factor_score = max(0, 100 - (debt_ratio * 100))  # Convert to 0-100 scale (inverse)
            score += factor_score * self.risk_factors[RiskFactor.DEBT_RATIO]
            factor_scores[RiskFactor.DEBT_RATIO] = factor_score
        else:
            # Default to medium debt ratio if missing data
            factor_score = 50
            score += factor_score * self.risk_factors[RiskFactor.DEBT_RATIO]
            factor_scores[RiskFactor.DEBT_RATIO] = factor_score
        
        # Emergency fund (higher is better)
        if "current_savings" in user_data and "monthly_expenses" in user_data and user_data["monthly_expenses"] > 0:
            # Calculate months of expenses covered by savings
            months_covered = user_data["current_savings"] / user_data["monthly_expenses"]
            # 6+ months is ideal (100), 0 months is poor (0)
            factor_score = min(100, (months_covered / 6) * 100)
            score += factor_score * self.risk_factors[RiskFactor.EMERGENCY_FUND]
            factor_scores[RiskFactor.EMERGENCY_FUND] = factor_score
        else:
            # Default to medium emergency fund if missing data
            factor_score = 50
            score += factor_score * self.risk_factors[RiskFactor.EMERGENCY_FUND]
            factor_scores[RiskFactor.EMERGENCY_FUND] = factor_score
        
        # Investment horizon (longer is higher risk tolerance)
        if "investment_horizon" in user_data:
            # Convert years to score: 0-1 year (0), 20+ years (100)
            years = user_data["investment_horizon"]
            factor_score = min(100, (years / 20) * 100)
            score += factor_score * self.risk_factors[RiskFactor.INVESTMENT_HORIZON]
            factor_scores[RiskFactor.INVESTMENT_HORIZON] = factor_score
        else:
            # Default to medium investment horizon if missing data
            factor_score = 50
            score += factor_score * self.risk_factors[RiskFactor.INVESTMENT_HORIZON]
            factor_scores[RiskFactor.INVESTMENT_HORIZON] = factor_score
        
        # Age (younger is higher risk tolerance)
        if "age" in user_data:
            # Convert age to score: 18 (100), 80+ (0)
            age = user_data["age"]
            if age < 18:
                factor_score = 0  # Special case for minors
            else:
                factor_score = max(0, 100 - ((age - 18) / 62) * 100)
            score += factor_score * self.risk_factors[RiskFactor.AGE]
            factor_scores[RiskFactor.AGE] = factor_score
        else:
            # Default to medium age if missing data
            factor_score = 50
            score += factor_score * self.risk_factors[RiskFactor.AGE]
            factor_scores[RiskFactor.AGE] = factor_score
        
        # Calculate remaining factors...
        # (Similar calculations for dependents, market conditions, etc.)
        
        # Map score to risk level
        risk_level = self.map_to_risk_level(score)
        
        # Save risk assessment to database
        if "user_id" in user_data:
            self.save_risk_assessment(user_data["user_id"], score, risk_level.value, factor_scores)
        
        return {
            "risk_score": score,
            "risk_level": risk_level.value,
            "factor_scores": factor_scores,
            "factor_weights": self.risk_factors
        }
    
    def _calculate_income_stability(self, income_history: List[float]) -> float:
        """
        Calculate income stability from income history.
        
        Args:
            income_history: List of monthly or annual incomes
            
        Returns:
            Stability score between 0 and 1
        """
        if not income_history or len(income_history) < 2:
            return 0.5  # Default to medium stability
        
        # Calculate coefficient of variation (lower is more stable)
        mean = sum(income_history) / len(income_history)
        variance = sum((x - mean) ** 2 for x in income_history) / len(income_history)
        std_dev = variance ** 0.5
        cv = std_dev / mean if mean > 0 else float('inf')
        
        # Convert to stability score (0-1)
        # CV of 0 means perfect stability (1.0)
        # CV of 0.5+ means high instability (0.0)
        stability = max(0, 1 - (cv * 2))
        
        return stability
    
    def map_to_risk_level(self, score: float) -> RiskLevel:
        """
        Map numerical score to risk level.
        
        Args:
            score: Risk score between 0 and 100
            
        Returns:
            RiskLevel enum value
        """
        if score < 20:
            return RiskLevel.VERY_LOW
        elif score < 40:
            return RiskLevel.LOW
        elif score < 60:
            return RiskLevel.MEDIUM
        elif score < 80:
            return RiskLevel.HIGH
        else:
            return RiskLevel.VERY_HIGH
    
    def save_risk_assessment(self, user_id: int, risk_score: float, risk_level: str, factor_scores: Dict[str, float]):
        """
        Save risk assessment to database.
        
        Args:
            user_id: User ID
            risk_score: Overall risk score
            risk_level: Risk level string
            factor_scores: Dictionary of factor scores
        """
        try:
            with get_db_cursor() as cursor:
                # Check if user profile exists
                cursor.execute(
                    "SELECT id FROM user_profiles WHERE user_id = %s",
                    (user_id,)
                )
                result = cursor.fetchone()
                
                risk_data = {
                    "score": risk_score,
                    "level": risk_level,
                    "factor_scores": factor_scores,
                    "updated_at": "NOW()"
                }
                
                if result:
                    # Update existing profile
                    cursor.execute(
                        """
                        UPDATE user_profiles 
                        SET risk_profile = %s, updated_at = NOW()
                        WHERE user_id = %s
                        """,
                        (json.dumps(risk_data), user_id)
                    )
                else:
                    # Create new profile
                    cursor.execute(
                        """
                        INSERT INTO user_profiles (user_id, risk_profile, updated_at)
                        VALUES (%s, %s, NOW())
                        """,
                        (user_id, json.dumps(risk_data))
                    )
                
                logger.info(f"Risk assessment saved for user {user_id}")
        except Exception as e:
            logger.error(f"Error saving risk assessment: {str(e)}")
    
    def get_user_risk_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get user's risk profile from database.
        
        Args:
            user_id: User ID
            
        Returns:
            Risk profile dictionary or None if not found
        """
        try:
            with get_db_cursor(commit=False) as cursor:
                cursor.execute(
                    "SELECT risk_profile FROM user_profiles WHERE user_id = %s",
                    (user_id,)
                )
                result = cursor.fetchone()
                
                if result and result[0]:
                    return result[0]
                return None
        except Exception as e:
            logger.error(f"Error retrieving risk profile: {str(e)}")
            return None
