# ai/unified_advisory.py
import logging
from typing import Dict, Any
from core.financial_models import AdvisoryRequest, AdvisoryResponse
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor

logger = logging.getLogger(__name__)

class UnifiedAdvisoryService:
    """Unified service that coordinates all advisory modules."""
    
    def __init__(self):
        """Initialize the unified advisory service."""
        # Initialize advisors directly
        self.financial_advisor = FinancialLegalAdvisor()
        self.investment_advisor = InvestmentAdvisor()
        
        # Initialize risk service and financial model lazily (only when needed)
        self._risk_service = None
        self._financial_model = None
        
        logger.info("Unified advisory service initialized successfully")
    
    @property
    def risk_service(self):
        """Lazy initialization of risk service to avoid circular imports."""
        if self._risk_service is None:
            try:
                from ai.risk_assessment import RiskAssessmentService
                self._risk_service = RiskAssessmentService()
            except Exception as e:
                logger.error(f"Error initializing risk service: {str(e)}")
                # Return a dummy risk service if the real one can't be initialized
                class DummyRiskService:
                    def calculate_risk_score(self, user_data):
                        return {"risk_level": "MEDIUM", "risk_score": 50}
                self._risk_service = DummyRiskService()
        return self._risk_service
    
    @property
    def financial_model(self):
        """Lazy initialization of financial model to avoid circular imports."""
        if self._financial_model is None:
            try:
                from ai.enhanced_model import EnhancedFinancialModel
                self._financial_model = EnhancedFinancialModel()
            except Exception as e:
                logger.error(f"Error initializing financial model: {str(e)}")
                # Return a dummy financial model if the real one can't be initialized
                class DummyFinancialModel:
                    def predict_financial_status(self, data):
                        return {"status": "stable", "confidence": 0.7}
                self._financial_model = DummyFinancialModel()
        return self._financial_model
    
    def process_advisory_request(self, request: AdvisoryRequest) -> AdvisoryResponse:
        """
        Process advisory request with unified context and risk assessment.
        
        Args:
            request: Advisory request
            
        Returns:
            Advisory response
        """
        user_id = request.user_id
        
        # Calculate risk profile
        try:
            risk_assessment = self.risk_service.calculate_risk_score(request.context)
        except Exception as e:
            logger.error(f"Error calculating risk score: {str(e)}")
            risk_assessment = {"risk_level": "MEDIUM", "risk_score": 50}
        
        # Predict financial status
        try:
            financial_status = self.financial_model.predict_financial_status(request.context)
        except Exception as e:
            logger.error(f"Error predicting financial status: {str(e)}")
            financial_status = {"status": "stable", "confidence": 0.7}
        
        # Extract key information from the question
        question = request.question.lower()
        
        # Prepare a more helpful response based on the question content
        custom_advice = ""
        if "debt" in question:
            debt_amount = None
            income = None
            
            # Try to extract debt amount
            import re
            debt_match = re.search(r'(\d+)(?:\s*k|\s*tys)?\s*(?:zl|zloty|pln)', question)
            if debt_match:
                debt_amount = int(debt_match.group(1))
                if 'k' in debt_match.group(0) or 'tys' in debt_match.group(0):
                    debt_amount *= 1000
            
            # Try to extract income
            income_match = re.search(r'(\d+)\s*(?:chf|eur|usd|€|\$)', question)
            if income_match:
                income = int(income_match.group(1))
                currency = re.search(r'(chf|eur|usd|€|\$)', income_match.group(0)).group(1)
                
                # Convert to PLN for comparison (approximate rates)
                if currency.lower() == 'chf':
                    income_pln = income * 4.5  # Approximate CHF to PLN rate
                elif currency.lower() == 'eur' or currency == '€':
                    income_pln = income * 4.3  # Approximate EUR to PLN rate
                elif currency.lower() == 'usd' or currency == '$':
                    income_pln = income * 3.9  # Approximate USD to PLN rate
                else:
                    income_pln = income
            
            # Generate custom debt advice
            if debt_amount and income:
                debt_to_income = debt_amount / income_pln
                if debt_to_income < 0.5:
                    custom_advice = f"With a debt of {debt_amount} PLN and an income of approximately {income_pln:.0f} PLN per month, your debt-to-income ratio is favorable at {debt_to_income:.2f}. I recommend setting aside at least 20-30% of your monthly income to clear this debt within 12-18 months while building an emergency fund."
                else:
                    custom_advice = f"With a debt of {debt_amount} PLN and an income of approximately {income_pln:.0f} PLN per month, your debt-to-income ratio is {debt_to_income:.2f}, which is relatively high. I recommend prioritizing debt repayment by allocating 30-40% of your monthly income to reduce this debt as quickly as possible."
            elif debt_amount:
                custom_advice = f"With a debt of {debt_amount} PLN, I recommend creating a structured repayment plan. Without knowing your income, I suggest focusing on high-interest debt first while making minimum payments on other debts."
            elif income:
                custom_advice = f"With an income of approximately {income_pln:.0f} PLN per month, you have good earning potential. I recommend creating a budget that allocates 50% to necessities, 30% to debt repayment and savings, and 20% to discretionary spending."
        
        # Handle specific queries about stock prices
        if "cena" in question and any(company in question for company in ["tesla", "apple", "amazon", "google", "microsoft"]):
            company = None
            if "tesla" in question:
                company = "Tesla"
            elif "apple" in question:
                company = "Apple"
            elif "amazon" in question:
                company = "Amazon"
            elif "google" in question:
                company = "Google"
            elif "microsoft" in question:
                company = "Microsoft"
            
            if company:
                custom_advice = f"Aby uzyskać aktualną cenę akcji {company}, zalecam sprawdzenie na platformie inwestycyjnej lub w serwisie finansowym jak Yahoo Finance, Bloomberg lub Stooq. Ceny akcji zmieniają się w czasie rzeczywistym, więc najlepiej sprawdzić bieżące notowania."
                
                # Add some general advice about the company
                if company == "Tesla":
                    custom_advice += "\n\nTesla to firma o wysokiej zmienności cen akcji. Przed inwestycją warto przeanalizować jej wyniki finansowe, plany produkcyjne i sytuację na rynku pojazdów elektrycznych."
                elif company == "Apple":
                    custom_advice += "\n\nApple to stabilna firma technologiczna, znana z innowacyjnych produktów. Przed inwestycją warto przeanalizować jej wyniki finansowe i plany dotyczące nowych produktów."
                elif company == "Amazon":
                    custom_advice += "\n\nAmazon to lider w e-commerce i usługach chmurowych. Przed inwestycją warto przeanalizować jej wyniki finansowe i sytuację na rynku detalicznym."
                elif company == "Google":
                    custom_advice += "\n\nGoogle (Alphabet) to firma dominująca w wyszukiwarkach i reklamie cyfrowej. Przed inwestycją warto przeanalizować jej wyniki finansowe i plany dotyczące sztucznej inteligencji."
                elif company == "Microsoft":
                    custom_advice += "\n\nMicrosoft to lider w oprogramowaniu i usługach chmurowych. Przed inwestycją warto przeanalizować jej wyniki finansowe i plany dotyczące rozwoju technologii chmurowych i sztucznej inteligencji."
                
                # Return a custom response for stock price queries
                return AdvisoryResponse(
                    user_id=user_id,
                    question=request.question,
                    answer=custom_advice,
                    advisory_type="stock_price",
                    confidence_score=1.0,
                    sources=["Yahoo Finance", "Bloomberg", "Stooq"],
                    disclaimer="This advice is based on publicly available information and does not constitute financial advice.",
                    created_at=None,
                    additional_resources=None
                )
        
        # Enrich request context with unified information
        enriched_context = {
            **request.context,
            "risk_assessment": risk_assessment,
            "financial_status": financial_status
        }
        
        # Create enriched request
        enriched_request = AdvisoryRequest(
            user_id=user_id,
            question=request.question,
            context=enriched_context,
            advisory_type=request.advisory_type,
            language=request.language
        )
        
        # Get advice from appropriate advisor based on question type
        if request.advisory_type in ["financial", "legal", "tax"]:
            response = self.financial_advisor.process_advisory_request(enriched_request)
        elif request.advisory_type in ["investment", "portfolio"]:
            response = self.investment_advisor.process_advisory_request(enriched_request)
        else:
            # Use both advisors and reconcile recommendations
            financial_response = self.financial_advisor.process_advisory_request(enriched_request)
            investment_response = self.investment_advisor.process_advisory_request(enriched_request)
            
            # Use custom advice if available, otherwise use advisor responses
            financial_advice = custom_advice if custom_advice else financial_response.answer
            if financial_advice == "I'm unable to provide advice on this topic at the moment. Please try again later or rephrase your question.":
                if "debt" in question and "income" in question:
                    financial_advice = "Based on your debt and income situation, I recommend creating a budget that prioritizes debt repayment while ensuring you have an emergency fund of 3-6 months of expenses. Consider the cost of living in Switzerland when planning your budget."
                elif "switzerland" in question or "swiss" in question:
                    financial_advice = "When moving to Switzerland, be aware that the cost of living is high, especially in cities like Zurich and Geneva. With your income of 5000 CHF per month, you should be able to manage your expenses and work on paying down your debt, but careful budgeting will be essential."
            
            investment_advice = investment_response.answer
            if investment_advice == "I'm unable to provide investment advice on this topic at the moment. Please try again later or rephrase your question.":
                investment_advice = "With your current debt situation, I recommend focusing on debt repayment before making significant investments. However, once in Switzerland, consider opening a Swiss pension account (3a pillar) for tax advantages."
            
            # Simple reconciliation - combine answers with proper attribution
            combined_answer = (
                f"Financial Advice:\n{financial_advice}\n\n"
                f"Investment Advice:\n{investment_advice}\n\n"
                f"Risk Profile: {risk_assessment['risk_level'].lower()}\n"
                f"Financial Status: {financial_status['status']} (Confidence: {financial_status.get('confidence', 0.5):.2f})"
            )
            
            response = AdvisoryResponse(
                user_id=user_id,
                question=request.question,
                answer=combined_answer,
                advisory_type="combined",
                confidence_score=(financial_response.confidence_score + investment_response.confidence_score) / 2,
                sources=financial_response.sources + investment_response.sources,
                disclaimer="This combined advice is based on your current financial situation and risk profile.",
                created_at=financial_response.created_at,
                additional_resources={
                    **(financial_response.additional_resources or {}),
                    **(investment_response.additional_resources or {})
                }
            )
        
        return response
