# ai/financial_decision_tree.py
"""
Financial decision tree model for personalized financial recommendations.
This module implements a decision tree-based approach to provide structured
financial advice tailored to user profiles and specific financial goals.
"""

import logging
from typing import Dict, List, Any, Optional, Union
from enum import Enum
import json
from datetime import datetime
from pydantic import BaseModel, Field

# Setup logging
logger = logging.getLogger(__name__)

class FinancialGoal(str, Enum):
    """Financial goals for decision tree analysis."""
    EMERGENCY_FUND = "emergency_fund"
    DEBT_REDUCTION = "debt_reduction"
    HOME_PURCHASE = "home_purchase"
    RETIREMENT = "retirement"
    EDUCATION = "education"
    VACATION = "vacation"
    OTHER = "other"

class RiskTolerance(str, Enum):
    """Risk tolerance levels for financial decisions."""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class TimeHorizon(str, Enum):
    """Time horizons for financial goals."""
    SHORT = "short"  # < 1 year
    MEDIUM = "medium"  # 1-5 years
    LONG = "long"  # > 5 years

class DecisionStep(BaseModel):
    """Model for a decision tree step."""
    id: str
    question: str
    options: List[Dict[str, str]]
    context_dependent: bool = False

class DecisionNode(BaseModel):
    """Model for a node in the decision tree."""
    id: str
    type: str = "question"  # question, recommendation, analysis
    question: str = ""
    options: List[Dict[str, str]] = []
    next_steps: Dict[str, str] = {}
    context_dependent: bool = False
    recommendation: Optional[Dict[str, Any]] = None
    children: List[Dict[str, Any]] = []

class FinancialRecommendation(BaseModel):
    """Model for a financial recommendation."""
    id: str
    title: str
    description: str
    advisor_type: str
    impact: str
    action_items: List[str] = []
    resources: List[Dict[str, str]] = []

class DecisionTreeRequest(BaseModel):
    """Request model for decision tree traversal."""
    user_id: int
    current_node_id: Optional[str] = None
    answer: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)

class DecisionTreeResponse(BaseModel):
    """Response model for decision tree traversal."""
    node: DecisionNode
    progress: float = 0.0
    recommendations: List[FinancialRecommendation] = []
    messages: List[str] = []

class FinancialDecisionTree:
    """
    Financial decision tree for structured financial advice and recommendations.
    
    This class implements a decision tree that guides users through a series of
    financial questions to provide tailored recommendations based on their
    specific situation and goals.
    """
    
    def __init__(self):
        """Initialize the financial decision tree with decision nodes."""
        self.tree = self._initialize_tree()
        logger.info("Financial decision tree initialized")
    
    def _initialize_tree(self) -> Dict[str, DecisionNode]:
        """
        Initialize the decision tree structure with goal-oriented nodes.
        
        Returns:
            Dictionary of decision nodes indexed by node ID
        """
        tree = {}
        
        # Root node (starting point) - Ask about financial goal
        tree["root"] = DecisionNode(
            id="root",
            type="question",
            question="Jaki jest Twój główny cel finansowy?",
            options=[
                {"id": "emergency_fund", "label": "Fundusz awaryjny"},
                {"id": "debt_reduction", "label": "Spłata zadłużenia"},
                {"id": "home_purchase", "label": "Zakup nieruchomości"},
                {"id": "retirement", "label": "Oszczędzanie na emeryturę"},
                {"id": "education", "label": "Edukacja (studia, kursy)"},
                {"id": "vacation", "label": "Wakacje i podróże"},
                {"id": "other", "label": "Inny cel"}
            ],
            next_steps={
                "emergency_fund": "ef_timeframe",
                "debt_reduction": "debt_type",
                "home_purchase": "home_timeframe",
                "retirement": "retirement_age",
                "education": "education_timeframe",
                "vacation": "vacation_timeframe",
                "other": "other_goal_amount"
            }
        )
        
        # Emergency Fund Branch
        tree["ef_timeframe"] = DecisionNode(
            id="ef_timeframe",
            type="question",
            question="W jakim czasie chcesz zgromadzić fundusz awaryjny?",
            options=[
                {"id": "short", "label": "W ciągu 6 miesięcy"},
                {"id": "medium", "label": "W ciągu roku"},
                {"id": "long", "label": "W ciągu 1-2 lat"}
            ],
            next_steps={
                "short": "ef_amount",
                "medium": "ef_amount",
                "long": "ef_amount"
            }
        )
        
        tree["ef_amount"] = DecisionNode(
            id="ef_amount",
            type="question",
            question="Ile miesięcznych wydatków chcesz pokryć funduszem awaryjnym?",
            options=[
                {"id": "three", "label": "3 miesiące wydatków"},
                {"id": "six", "label": "6 miesięcy wydatków"},
                {"id": "twelve", "label": "12 miesięcy wydatków"}
            ],
            next_steps={
                "three": "ef_savings_method",
                "six": "ef_savings_method",
                "twelve": "ef_savings_method"
            }
        )
        
        tree["ef_savings_method"] = DecisionNode(
            id="ef_savings_method",
            type="question",
            question="Jaki sposób oszczędzania preferujesz?",
            options=[
                {"id": "automatic", "label": "Automatyczne odkładanie stałej kwoty"},
                {"id": "percentage", "label": "Odkładanie procentu dochodów"},
                {"id": "surplus", "label": "Odkładanie nadwyżek z budżetu"}
            ],
            next_steps={
                "automatic": "ef_recommendation",
                "percentage": "ef_recommendation",
                "surplus": "ef_recommendation"
            }
        )
        
        tree["ef_recommendation"] = DecisionNode(
            id="ef_recommendation",
            type="recommendation",
            recommendation={
                "title": "Plan budowy funduszu awaryjnego",
                "description": "Przygotowaliśmy strategię budowy Twojego funduszu awaryjnego.",
                "context_dependent": True
            }
        )
        
        # Debt Reduction Branch
        tree["debt_type"] = DecisionNode(
            id="debt_type",
            type="question",
            question="Jaki rodzaj zadłużenia chcesz spłacić w pierwszej kolejności?",
            options=[
                {"id": "credit_card", "label": "Karty kredytowe / Chwilówki (wysokie oprocentowanie)"},
                {"id": "consumer", "label": "Kredyty konsumpcyjne"},
                {"id": "mortgage", "label": "Kredyt hipoteczny"},
                {"id": "student", "label": "Kredyt studencki"},
                {"id": "multiple", "label": "Mam kilka różnych zobowiązań"}
            ],
            next_steps={
                "credit_card": "debt_total_amount",
                "consumer": "debt_total_amount",
                "mortgage": "debt_total_amount",
                "student": "debt_total_amount",
                "multiple": "debt_total_amount"
            }
        )
        
        tree["debt_total_amount"] = DecisionNode(
            id="debt_total_amount",
            type="question",
            question="Jaka jest łączna kwota Twojego zadłużenia?",
            options=[
                {"id": "small", "label": "Do 10,000 zł"},
                {"id": "medium", "label": "10,000 - 50,000 zł"},
                {"id": "large", "label": "50,000 - 200,000 zł"},
                {"id": "very_large", "label": "Powyżej 200,000 zł"}
            ],
            next_steps={
                "small": "debt_strategy",
                "medium": "debt_strategy",
                "large": "debt_strategy",
                "very_large": "debt_strategy"
            }
        )
        
        tree["debt_strategy"] = DecisionNode(
            id="debt_strategy",
            type="question",
            question="Jaką strategię spłaty zadłużenia preferujesz?",
            options=[
                {"id": "avalanche", "label": "Najpierw najwyżej oprocentowane (metoda lawiny)"},
                {"id": "snowball", "label": "Najpierw najmniejsze kwoty (metoda kuli śnieżnej)"},
                {"id": "consolidation", "label": "Konsolidacja zadłużenia"},
                {"id": "not_sure", "label": "Nie jestem pewien/pewna"}
            ],
            next_steps={
                "avalanche": "debt_recommendation",
                "snowball": "debt_recommendation",
                "consolidation": "debt_recommendation",
                "not_sure": "debt_recommendation"
            }
        )
        
        tree["debt_recommendation"] = DecisionNode(
            id="debt_recommendation",
            type="recommendation",
            recommendation={
                "title": "Plan redukcji zadłużenia",
                "description": "Przygotowaliśmy strategię redukcji Twojego zadłużenia.",
                "context_dependent": True
            }
        )
        
        # Home Purchase Branch
        tree["home_timeframe"] = DecisionNode(
            id="home_timeframe",
            type="question",
            question="W jakim czasie planujesz zakup nieruchomości?",
            options=[
                {"id": "short", "label": "W ciągu 1-2 lat"},
                {"id": "medium", "label": "W ciągu 3-5 lat"},
                {"id": "long", "label": "W ciągu 5-10 lat"}
            ],
            next_steps={
                "short": "home_down_payment",
                "medium": "home_down_payment",
                "long": "home_down_payment"
            }
        )
        
        tree["home_down_payment"] = DecisionNode(
            id="home_down_payment",
            type="question",
            question="Ile procent wartości nieruchomości planujesz zgromadzić jako wkład własny?",
            options=[
                {"id": "ten", "label": "10% (minimalne wymaganie)"},
                {"id": "twenty", "label": "20% (standard)"},
                {"id": "thirty_plus", "label": "30% lub więcej"},
                {"id": "full", "label": "100% (zakup bez kredytu)"}
            ],
            next_steps={
                "ten": "home_budget",
                "twenty": "home_budget",
                "thirty_plus": "home_budget",
                "full": "home_budget"
            }
        )
        
        tree["home_budget"] = DecisionNode(
            id="home_budget",
            type="question",
            question="Jaki jest Twój budżet na zakup nieruchomości?",
            options=[
                {"id": "small", "label": "Do 300,000 zł"},
                {"id": "medium", "label": "300,000 - 600,000 zł"},
                {"id": "large", "label": "600,000 - 1,000,000 zł"},
                {"id": "very_large", "label": "Powyżej 1,000,000 zł"}
            ],
            next_steps={
                "small": "home_recommendation",
                "medium": "home_recommendation",
                "large": "home_recommendation",
                "very_large": "home_recommendation"
            }
        )
        
        tree["home_recommendation"] = DecisionNode(
            id="home_recommendation",
            type="recommendation",
            recommendation={
                "title": "Plan zakupu nieruchomości",
                "description": "Przygotowaliśmy strategię oszczędzania na zakup nieruchomości.",
                "context_dependent": True
            }
        )
        
        # Retirement Branch
        tree["retirement_age"] = DecisionNode(
            id="retirement_age",
            type="question",
            question="W jakim wieku planujesz przejść na emeryturę?",
            options=[
                {"id": "early", "label": "Wcześniej niż wiek emerytalny (emerytura wcześniejsza)"},
                {"id": "standard", "label": "W standardowym wieku emerytalnym"},
                {"id": "late", "label": "Później niż wiek emerytalny"}
            ],
            next_steps={
                "early": "retirement_current_age",
                "standard": "retirement_current_age",
                "late": "retirement_current_age"
            }
        )
        
        tree["retirement_current_age"] = DecisionNode(
            id="retirement_current_age",
            type="question",
            question="Na jakim etapie życia zawodowego jesteś obecnie?",
            options=[
                {"id": "early", "label": "Początek kariery (20-35 lat)"},
                {"id": "mid", "label": "Środek kariery (36-50 lat)"},
                {"id": "late", "label": "Późny etap kariery (51+ lat)"}
            ],
            next_steps={
                "early": "retirement_vehicle",
                "mid": "retirement_vehicle",
                "late": "retirement_vehicle"
            }
        )
        
        tree["retirement_vehicle"] = DecisionNode(
            id="retirement_vehicle",
            type="question",
            question="Jakie formy oszczędzania na emeryturę rozważasz?",
            options=[
                {"id": "ike_ikze", "label": "IKE/IKZE (indywidualne konta emerytalne)"},
                {"id": "investment", "label": "Własne inwestycje długoterminowe"},
                {"id": "real_estate", "label": "Nieruchomości na wynajem"},
                {"id": "combined", "label": "Strategia łączona"}
            ],
            next_steps={
                "ike_ikze": "retirement_recommendation",
                "investment": "retirement_recommendation",
                "real_estate": "retirement_recommendation",
                "combined": "retirement_recommendation"
            }
        )
        
        tree["retirement_recommendation"] = DecisionNode(
            id="retirement_recommendation",
            type="recommendation",
            recommendation={
                "title": "Plan emerytalny",
                "description": "Przygotowaliśmy strategię oszczędzania na emeryturę.",
                "context_dependent": True
            }
        )
        
        # Education Branch
        tree["education_timeframe"] = DecisionNode(
            id="education_timeframe",
            type="question",
            question="Kiedy planujesz rozpocząć edukację?",
            options=[
                {"id": "short", "label": "W ciągu roku"},
                {"id": "medium", "label": "W ciągu 1-3 lat"},
                {"id": "long", "label": "W ciągu 3-5 lat"}
            ],
            next_steps={
                "short": "education_type",
                "medium": "education_type",
                "long": "education_type"
            }
        )
        
        tree["education_type"] = DecisionNode(
            id="education_type",
            type="question",
            question="Jaki rodzaj edukacji planujesz?",
            options=[
                {"id": "university", "label": "Studia wyższe"},
                {"id": "courses", "label": "Kursy specjalistyczne"},
                {"id": "certification", "label": "Certyfikaty zawodowe"},
                {"id": "child", "label": "Oszczędzam na edukację dziecka"}
            ],
            next_steps={
                "university": "education_cost",
                "courses": "education_cost",
                "certification": "education_cost",
                "child": "education_cost"
            }
        )
        
        tree["education_cost"] = DecisionNode(
            id="education_cost",
            type="question",
            question="Jaki jest szacowany koszt planowanej edukacji?",
            options=[
                {"id": "small", "label": "Do 10,000 zł"},
                {"id": "medium", "label": "10,000 - 30,000 zł"},
                {"id": "large", "label": "30,000 - 100,000 zł"},
                {"id": "very_large", "label": "Powyżej 100,000 zł"}
            ],
            next_steps={
                "small": "education_recommendation",
                "medium": "education_recommendation",
                "large": "education_recommendation",
                "very_large": "education_recommendation"
            }
        )
        
        tree["education_recommendation"] = DecisionNode(
            id="education_recommendation",
            type="recommendation",
            recommendation={
                "title": "Plan finansowania edukacji",
                "description": "Przygotowaliśmy strategię finansowania Twojej edukacji.",
                "context_dependent": True
            }
        )
        
        # Vacation Branch
        tree["vacation_timeframe"] = DecisionNode(
            id="vacation_timeframe",
            type="question",
            question="Kiedy planujesz wyjazd?",
            options=[
                {"id": "short", "label": "W ciągu 6 miesięcy"},
                {"id": "medium", "label": "W ciągu roku"},
                {"id": "long", "label": "W ciągu 1-2 lat"}
            ],
            next_steps={
                "short": "vacation_cost",
                "medium": "vacation_cost",
                "long": "vacation_cost"
            }
        )
        
        tree["vacation_cost"] = DecisionNode(
            id="vacation_cost",
            type="question",
            question="Jaki jest szacowany koszt wyjazdu?",
            options=[
                {"id": "small", "label": "Do 5,000 zł"},
                {"id": "medium", "label": "5,000 - 15,000 zł"},
                {"id": "large", "label": "15,000 - 30,000 zł"},
                {"id": "very_large", "label": "Powyżej 30,000 zł"}
            ],
            next_steps={
                "small": "vacation_savings_method",
                "medium": "vacation_savings_method",
                "large": "vacation_savings_method",
                "very_large": "vacation_savings_method"
            }
        )
        
        tree["vacation_savings_method"] = DecisionNode(
            id="vacation_savings_method",
            type="question",
            question="W jaki sposób planujesz sfinansować wyjazd?",
            options=[
                {"id": "savings", "label": "Z bieżących oszczędności"},
                {"id": "dedicated", "label": "Specjalne konto dedykowane na ten cel"},
                {"id": "combined", "label": "Częściowo oszczędności, częściowo inne źródła"},
                {"id": "credit", "label": "Rozważam kredyt/pożyczkę"}
            ],
            next_steps={
                "savings": "vacation_recommendation",
                "dedicated": "vacation_recommendation",
                "combined": "vacation_recommendation",
                "credit": "vacation_recommendation"
            }
        )
        
        tree["vacation_recommendation"] = DecisionNode(
            id="vacation_recommendation",
            type="recommendation",
            recommendation={
                "title": "Plan finansowania wakacji",
                "description": "Przygotowaliśmy strategię finansowania Twojego wyjazdu.",
                "context_dependent": True
            }
        )
        
        # Other Goal Branch
        tree["other_goal_amount"] = DecisionNode(
            id="other_goal_amount",
            type="question",
            question="Jaka kwota jest potrzebna do realizacji Twojego celu?",
            options=[
                {"id": "small", "label": "Do 5,000 zł"},
                {"id": "medium", "label": "5,000 - 20,000 zł"},
                {"id": "large", "label": "20,000 - 50,000 zł"},
                {"id": "very_large", "label": "Powyżej 50,000 zł"}
            ],
            next_steps={
                "small": "other_timeframe",
                "medium": "other_timeframe",
                "large": "other_timeframe",
                "very_large": "other_timeframe"
            }
        )
        
        tree["other_timeframe"] = DecisionNode(
            id="other_timeframe",
            type="question",
            question="W jakim czasie chcesz osiągnąć ten cel?",
            options=[
                {"id": "short", "label": "W ciągu 6 miesięcy"},
                {"id": "medium", "label": "W ciągu roku"},
                {"id": "long", "label": "W ciągu 1-3 lat"},
                {"id": "very_long", "label": "Powyżej 3 lat"}
            ],
            next_steps={
                "short": "other_priority",
                "medium": "other_priority",
                "long": "other_priority",
                "very_long": "other_priority"
            }
        )
        
        tree["other_priority"] = DecisionNode(
            id="other_priority",
            type="question",
            question="Jak wysoki priorytet ma dla Ciebie ten cel?",
            options=[
                {"id": "low", "label": "Niski - mogę go odłożyć w czasie"},
                {"id": "medium", "label": "Średni - chciałbym/chciałabym go osiągnąć, ale mogę być elastyczny/a"},
                {"id": "high", "label": "Wysoki - to dla mnie bardzo ważne"}
            ],
            next_steps={
                "low": "other_recommendation",
                "medium": "other_recommendation",
                "high": "other_recommendation"
            }
        )
        
        tree["other_recommendation"] = DecisionNode(
            id="other_recommendation",
            type="recommendation",
            recommendation={
                "title": "Plan realizacji celu",
                "description": "Przygotowaliśmy strategię osiągnięcia Twojego celu.",
                "context_dependent": True
            }
        )
        
        return tree
    
    def process_step(self, request: DecisionTreeRequest) -> DecisionTreeResponse:
        """
        Process a decision tree step and return the next node.
        
        Args:
            request: Decision tree request with user ID, current node ID, answer, and context
            
        Returns:
            Decision tree response with next node, progress, and possibly recommendations
        """
        user_id = request.user_id
        current_node_id = request.current_node_id
        answer = request.answer
        context = request.context
        
        # Store the user's journey and answers
        if "journey" not in context:
            context["journey"] = []
        
        if "answers" not in context:
            context["answers"] = {}
        
        # Update answers if an answer was provided
        if current_node_id and answer:
            context["answers"][current_node_id] = answer
        
        # Start at root if no current node
        if not current_node_id:
            current_node = self.tree["root"]
            context["journey"].append("root")
        else:
            current_node = self.tree[current_node_id]
            
            # If we received an answer, determine the next node
            if answer and current_node.type == "question":
                if answer in current_node.next_steps:
                    next_node_id = current_node.next_steps[answer]
                    current_node = self.tree[next_node_id]
                    context["journey"].append(next_node_id)
        
        # Get the financial goal from the first answer
        if "root" in context["answers"]:
            financial_goal = context["answers"]["root"]
            
            # Store the financial goal in the context
            context["financial_goal"] = financial_goal
            
            # Calculate max path length based on financial goal
            if financial_goal == "emergency_fund":
                max_steps = 4  # root → ef_timeframe → ef_amount → ef_savings_method → ef_recommendation
            elif financial_goal == "debt_reduction":
                max_steps = 4  # root → debt_type → debt_total_amount → debt_strategy → debt_recommendation
            elif financial_goal == "home_purchase":
                max_steps = 4  # root → home_timeframe → home_down_payment → home_budget → home_recommendation
            elif financial_goal == "retirement":
                max_steps = 4  # root → retirement_age → retirement_current_age → retirement_vehicle → retirement_recommendation
            elif financial_goal == "education":
                max_steps = 4  # root → education_timeframe → education_type → education_cost → education_recommendation
            elif financial_goal == "vacation":
                max_steps = 4  # root → vacation_timeframe → vacation_cost → vacation_savings_method → vacation_recommendation
            elif financial_goal == "other":
                max_steps = 4  # root → other_goal_amount → other_timeframe → other_priority → other_recommendation
            else:
                max_steps = 4  # Default
        else:
            max_steps = 4  # Default if no financial goal is set yet
        
        # Calculate progress (based on journey length and max path length)
        current_step = len(context["journey"])
        progress = min(1.0, current_step / max_steps)
        
        # Check if we've reached a recommendation node
        recommendations = []
        messages = []
        
        if current_node.type == "recommendation":
            recommendations = self._generate_recommendations(user_id, context)
            messages.append("Dziękujemy za odpowiedzi. Oto nasze rekomendacje.")
        
        return DecisionTreeResponse(
            node=current_node,
            progress=progress,
            recommendations=recommendations,
            messages=messages
        )
    
    def _generate_recommendations(self, user_id: int, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """
        Generate financial recommendations based on user journey and answers.
        
        Args:
            user_id: User ID
            context: Context dictionary with journey and answers
            
        Returns:
            List of financial recommendations
        """
        recommendations = []
        journey = context.get("journey", [])
        answers = context.get("answers", {})
        
        if not journey or not answers:
            return recommendations
        
        # Determine the financial goal
        if "root" in answers:
            financial_goal = answers["root"]
        else:
            return recommendations
        
        try:
            # Generate recommendations based on the financial goal
            if financial_goal == "emergency_fund":
                timeframe = answers.get("ef_timeframe", "medium")
                amount = answers.get("ef_amount", "six")
                savings_method = answers.get("ef_savings_method", "automatic")
                
                recommendations = self._generate_emergency_fund_recommendations(timeframe, amount, savings_method, context)
            
            elif financial_goal == "debt_reduction":
                debt_type = answers.get("debt_type", "credit_card")
                total_amount = answers.get("debt_total_amount", "medium")
                strategy = answers.get("debt_strategy", "avalanche")
                
                recommendations = self._generate_debt_reduction_recommendations(debt_type, total_amount, strategy, context)
            
            elif financial_goal == "home_purchase":
                timeframe = answers.get("home_timeframe", "medium")
                down_payment = answers.get("home_down_payment", "twenty")
                budget = answers.get("home_budget", "medium")
                
                recommendations = self._generate_home_purchase_recommendations(timeframe, down_payment, budget, context)
            
            elif financial_goal == "retirement":
                retirement_age = answers.get("retirement_age", "standard")
                current_age = answers.get("retirement_current_age", "mid")
                vehicle = answers.get("retirement_vehicle", "combined")
                
                recommendations = self._generate_retirement_recommendations(retirement_age, current_age, vehicle, context)
            
            elif financial_goal == "education":
                timeframe = answers.get("education_timeframe", "medium")
                education_type = answers.get("education_type", "university")
                cost = answers.get("education_cost", "medium")
                
                recommendations = self._generate_education_recommendations(timeframe, education_type, cost, context)
            
            elif financial_goal == "vacation":
                timeframe = answers.get("vacation_timeframe", "medium")
                cost = answers.get("vacation_cost", "medium")
                savings_method = answers.get("vacation_savings_method", "dedicated")
                
                recommendations = self._generate_vacation_recommendations(timeframe, cost, savings_method, context)
            
            elif financial_goal == "other":
                amount = answers.get("other_goal_amount", "medium")
                timeframe = answers.get("other_timeframe", "medium")
                priority = answers.get("other_priority", "medium")
                
                recommendations = self._generate_other_goal_recommendations(amount, timeframe, priority, context)
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            # Return a generic recommendation if something goes wrong
            recommendations = [
                FinancialRecommendation(
                    id="error_fallback",
                    title="Ogólne rekomendacje finansowe",
                    description="Napotkaliśmy problem przy generowaniu spersonalizowanych rekomendacji. Oto ogólne zalecenia finansowe.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Utrzymuj fundusz awaryjny wynoszący 3-6 miesięcznych wydatków",
                        "Regularnie oszczędzaj przynajmniej 20% swoich dochodów",
                        "Rozważ dywersyfikację inwestycji między różne klasy aktywów",
                        "Korzystaj z dostępnych ulg podatkowych"
                    ]
                )
            ]
        
        return recommendations
    
    def _generate_emergency_fund_recommendations(self, timeframe: str, amount: str, savings_method: str, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """Generate emergency fund recommendations."""
        recommendations = []
        
        # Base recommendation
        months_map = {"three": 3, "six": 6, "twelve": 12}
        months = months_map.get(amount, 6)
        
        savings_rate_map = {"short": "wysokim", "medium": "średnim", "long": "niskim"}
        savings_rate = savings_rate_map.get(timeframe, "średnim")
        
        method_description_map = {
            "automatic": "automatycznego odkładania stałej kwoty",
            "percentage": "odkładania stałego procentu dochodów",
            "surplus": "odkładania nadwyżek budżetowych"
        }
        method_description = method_description_map.get(savings_method, "automatycznego odkładania")
        
        recommendations.append(
            FinancialRecommendation(
                id="emergency_fund_base",
                title=f"Plan budowy funduszu awaryjnego na {months} miesięcy wydatków",
                description=f"Strategia budowy funduszu awaryjnego przy {savings_rate} tempie oszczędzania z wykorzystaniem {method_description}.",
                advisor_type="financial",
                impact="high",
                action_items=[
                    f"Określ swoje miesięczne wydatki i pomnóż je przez {months}, aby ustalić docelową kwotę funduszu",
                    "Wybierz bezpieczne, płynne instrumenty finansowe (np. konto oszczędnościowe, lokaty krótkoterminowe)",
                    "Skorzystaj z funkcji automatycznych przelewów w swoim banku",
                    "Korzystaj z funduszu tylko w prawdziwych sytuacjach awaryjnych"
                ]
            )
        )
        
        # Additional recommendations based on savings method
        if savings_method == "automatic":
            recommendations.append(
                FinancialRecommendation(
                    id="emergency_fund_automatic",
                    title="Automatyzacja oszczędzania",
                    description="Skuteczne strategie automatycznego oszczędzania na fundusz awaryjny.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Ustaw stałe zlecenie dzień po otrzymaniu wynagrodzenia",
                        "Zacznij od odkładania 10% dochodu i stopniowo zwiększaj tę kwotę",
                        "Rozważ korzystanie z aplikacji do automatycznego zaokrąglania transakcji",
                        "Regularnie przeglądaj i optymalizuj kwotę automatycznych przelewów"
                    ]
                )
            )
        elif savings_method == "percentage":
            recommendations.append(
                FinancialRecommendation(
                    id="emergency_fund_percentage",
                    title="Oszczędzanie procentu dochodów",
                    description="Strategie oszczędzania stałego procentu dochodów na fundusz awaryjny.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Zacznij od odkładania 15-20% miesięcznego dochodu",
                        "Przy dodatkowych dochodach (premie, nadgodziny), zachowaj tę samą zasadę procentową",
                        "Rozważ zwiększenie procentu oszczędności przy wzroście dochodów",
                        "Ustaw przypomnienia do przelewów jeśli nie możesz ich zautomatyzować"
                    ]
                )
            )
        else:  # savings_method == "surplus"
            recommendations.append(
                FinancialRecommendation(
                    id="emergency_fund_surplus",
                    title="Oszczędzanie nadwyżek budżetowych",
                    description="Strategie efektywnego odkładania nadwyżek budżetowych na fundusz awaryjny.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Stwórz szczegółowy budżet miesięczny z kategorią 'nadwyżka'",
                        "Przeznaczaj całą nadwyżkę na fundusz awaryjny do momentu osiągnięcia celu",
                        "Szukaj obszarów redukcji wydatków, aby zwiększyć nadwyżkę",
                        "Rozważ dodatkowe źródła dochodów, jeśli nadwyżka jest zbyt mała"
                    ]
                )
            )
        
        # Additional recommendation for everyone
        recommendations.append(
            FinancialRecommendation(
                id="emergency_fund_location",
                title="Gdzie trzymać fundusz awaryjny",
                description="Rekomendacje dotyczące optymalnego miejsca przechowywania funduszu awaryjnego.",
                advisor_type="financial",
                impact="medium",
                action_items=[
                    "Wybierz konto oszczędnościowe z natychmiastowym dostępem do środków",
                    "Rozważ częściowe wykorzystanie lokat krótkoterminowych dla lepszego oprocentowania",
                    "Unikaj instrumentów z opłatami za wcześniejsze wycofanie środków",
                    "Porównaj oprocentowanie w różnych bankach i wybierz najkorzystniejszą ofertę"
                ]
            )
        )
        
        return recommendations
    
    def _generate_debt_reduction_recommendations(self, debt_type: str, total_amount: str, strategy: str, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """Generate debt reduction recommendations."""
        recommendations = []
        
        # Base recommendation
        debt_description_map = {
            "credit_card": "wysoko oprocentowanych kart kredytowych i chwilówek",
            "consumer": "kredytów konsumpcyjnych",
            "mortgage": "kredytu hipotecznego",
            "student": "kredytu studenckiego",
            "multiple": "różnych zobowiązań"
        }
        debt_description = debt_description_map.get(debt_type, "zadłużenia")
        
        strategy_name_map = {
            "avalanche": "metodą lawiny (najwyższe oprocentowanie najpierw)",
            "snowball": "metodą kuli śnieżnej (najmniejsze kwoty najpierw)",
            "consolidation": "poprzez konsolidację zadłużenia",
            "not_sure": "strategią dopasowaną do Twojej sytuacji"
        }
        strategy_name = strategy_name_map.get(strategy, "optymalną strategią")
        
        recommendations.append(
            FinancialRecommendation(
                id="debt_reduction_base",
                title=f"Plan spłaty {debt_description}",
                description=f"Strategia spłaty zadłużenia {strategy_name}.",
                advisor_type="financial",
                impact="high",
                action_items=[
                    "Stwórz pełną listę wszystkich zobowiązań z kwotami, oprocentowaniem i terminami",
                    "Przygotuj budżet, który pozwoli przeznaczyć maksymalną kwotę na spłatę zadłużenia",
                    "Utrzymuj regularne, terminowe spłaty wszystkich zobowiązań",
                    "Unikaj zaciągania nowych długów w trakcie realizacji planu spłaty"
                ]
            )
        )
        
        # Strategy-specific recommendations
        if strategy == "avalanche":
            recommendations.append(
                FinancialRecommendation(
                    id="debt_avalanche",
                    title="Strategia lawiny (Debt Avalanche)",
                    description="Szczegółowe rekomendacje do wdrożenia metody lawiny w spłacie zadłużenia.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Uszereguj wszystkie długi według oprocentowania, od najwyższego do najniższego",
                        "Spłacaj minimalne kwoty wszystkich zobowiązań",
                        "Dodatkowe środki kieruj na zobowiązanie z najwyższym oprocentowaniem",
                        "Po spłacie zobowiązania z najwyższym oprocentowaniem, przenieś środki na kolejne"
                    ]
                )
            )
        elif strategy == "snowball":
            recommendations.append(
                FinancialRecommendation(
                    id="debt_snowball",
                    title="Strategia kuli śnieżnej (Debt Snowball)",
                    description="Szczegółowe rekomendacje do wdrożenia metody kuli śnieżnej w spłacie zadłużenia.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Uszereguj wszystkie długi według kwoty, od najmniejszej do największej",
                        "Spłacaj minimalne kwoty wszystkich zobowiązań",
                        "Dodatkowe środki kieruj na zobowiązanie z najmniejszą kwotą",
                        "Po spłacie najmniejszego zobowiązania, przenieś środki na kolejne"
                    ]
                )
            )
        elif strategy == "consolidation":
            recommendations.append(
                FinancialRecommendation(
                    id="debt_consolidation",
                    title="Konsolidacja zadłużenia",
                    description="Szczegółowe rekomendacje dotyczące konsolidacji zadłużenia.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Porównaj oferty kredytów konsolidacyjnych od różnych banków",
                        "Upewnij się, że efektywne oprocentowanie konsolidacji jest niższe niż obecne",
                        "Przygotuj wymagane dokumenty (zaświadczenia o dochodach, historia kredytowa)",
                        "Po konsolidacji, stwórz plan systematycznej spłaty nowego kredytu"
                    ]
                )
            )
        else:  # strategy == "not_sure"
            if debt_type == "credit_card" or debt_type == "multiple":
                recommendations.append(
                    FinancialRecommendation(
                        id="debt_high_interest_first",
                        title="Priorytetyzacja wysoko oprocentowanych długów",
                        description="Rekomendacje dotyczące priorytetyzacji spłaty wysoko oprocentowanych zobowiązań.",
                        advisor_type="financial",
                        impact="high",
                        action_items=[
                            "Zidentyfikuj zobowiązania z najwyższym oprocentowaniem (zwykle karty kredytowe)",
                            "Skup się na spłacie tych zobowiązań w pierwszej kolejności",
                            "Rozważ refinansowanie lub przeniesienie salda na kartę z okresem bez odsetek",
                            "Zrezygnuj z korzystania z kart kredytowych do czasu spłaty zadłużenia"
                        ]
                    )
                )
            elif debt_type == "mortgage":
                recommendations.append(
                    FinancialRecommendation(
                        id="debt_mortgage_optimization",
                        title="Optymalizacja kredytu hipotecznego",
                        description="Rekomendacje dotyczące optymalizacji spłaty kredytu hipotecznego.",
                        advisor_type="financial",
                        impact="high",
                        action_items=[
                            "Rozważ refinansowanie kredytu, jeśli dostępne są niższe stopy procentowe",
                            "Analizuj możliwość nadpłaty kredytu (sprawdź warunki w umowie)",
                            "Optymalizuj harmonogram spłat, aby zmniejszyć całkowity koszt kredytu",
                            "Monitoruj rynek i zmiany stóp procentowych"
                        ]
                    )
                )
            
        # Additional recommendation for everyone
        recommendations.append(
            FinancialRecommendation(
                id="debt_budget_discipline",
                title="Dyscyplina budżetowa podczas spłaty zadłużenia",
                description="Strategie utrzymania dyscypliny budżetowej podczas realizacji planu spłaty zadłużenia.",
                advisor_type="financial",
                impact="medium",
                action_items=[
                    "Stwórz szczegółowy budżet z kategorią 'spłata zadłużenia'",
                    "Zidentyfikuj obszary potencjalnych oszczędności i ogranicz zbędne wydatki",
                    "Rozważ dodatkowe źródła dochodu, aby przyspieszyć spłatę",
                    "Regularnie monitoruj postępy i dokonuj korekt w planie spłaty jeśli to konieczne"
                ]
            )
        )
        
        return recommendations
    
    def _generate_home_purchase_recommendations(self, timeframe: str, down_payment: str, budget: str, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """Generate home purchase recommendations."""
        recommendations = []
        
        # Base recommendation
        timeframe_desc_map = {
            "short": "krótkim (1-2 lata)",
            "medium": "średnim (3-5 lat)",
            "long": "długim (5-10 lat)"
        }
        timeframe_desc = timeframe_desc_map.get(timeframe, "planowanym")
        
        down_payment_percent_map = {
            "ten": "10%",
            "twenty": "20%",
            "thirty_plus": "30% lub więcej",
            "full": "100% (bez kredytu)"
        }
        down_payment_percent = down_payment_percent_map.get(down_payment, "wymaganym")
        
        budget_desc_map = {
            "small": "niższym budżecie (do 300 tys. zł)",
            "medium": "średnim budżecie (300-600 tys. zł)",
            "large": "wyższym budżecie (600 tys. - 1 mln zł)",
            "very_large": "wysokim budżecie (powyżej 1 mln zł)"
        }
        budget_desc = budget_desc_map.get(budget, "zaplanowanym budżecie")
        
        recommendations.append(
            FinancialRecommendation(
                id="home_purchase_base",
                title=f"Plan zakupu nieruchomości w {timeframe_desc} okresie",
                description=f"Strategia oszczędzania na zakup nieruchomości z wkładem własnym {down_payment_percent} przy {budget_desc}.",
                advisor_type="financial",
                impact="high",
                action_items=[
                    "Utwórz dedykowane konto oszczędnościowe na wkład własny",
                    "Ustaw automatyczne przelewy na to konto w dniu wypłaty",
                    "Monitoruj rynek nieruchomości i trendy cenowe w interesujących Cię lokalizacjach",
                    "Sprawdź swoją zdolność kredytową i możliwości jej poprawy"
                ]
            )
        )
        
        # Additional recommendations based on timeframe
        if timeframe == "short":
            recommendations.append(
                FinancialRecommendation(
                    id="home_purchase_short_term",
                    title="Oszczędzanie na wkład własny w krótkim okresie",
                    description="Strategie szybkiego zgromadzenia środków na wkład własny w ciągu 1-2 lat.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Maksymalizuj oszczędności - rozważ odkładanie 30-40% miesięcznych dochodów",
                        "Poszukaj dodatkowych źródeł dochodu (praca dodatkowa, sprzedaż niepotrzebnych rzeczy)",
                        "Ogranicz wszystkie zbędne wydatki i zoptymalizuj koszty stałe",
                        "Rozważ lokaty krótkoterminowe dla bezpiecznego pomnażania oszczędności"
                    ]
                )
            )
        elif timeframe == "medium":
            recommendations.append(
                FinancialRecommendation(
                    id="home_purchase_medium_term",
                    title="Oszczędzanie na wkład własny w średnim okresie",
                    description="Strategie zgromadzenia środków na wkład własny w ciągu 3-5 lat.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Ustaw plan systematycznego oszczędzania 20-25% miesięcznych dochodów",
                        "Rozważ bardziej zróżnicowane instrumenty oszczędnościowe (lokaty, obligacje)",
                        "Regularnie zwiększaj kwotę oszczędności wraz ze wzrostem dochodów",
                        "Bądź na bieżąco z programami wsparcia dla osób kupujących pierwsze mieszkanie"
                    ]
                )
            )
        else:  # timeframe == "long"
            recommendations.append(
                FinancialRecommendation(
                    id="home_purchase_long_term",
                    title="Oszczędzanie na wkład własny w długim okresie",
                    description="Strategie zgromadzenia środków na wkład własny w ciągu 5-10 lat.",
                    advisor_type="investment",
                    impact="high",
                    action_items=[
                        "Ustaw plan systematycznego oszczędzania 15-20% miesięcznych dochodów",
                        "Rozważ bardziej zróżnicowaną strategię inwestycyjną (fundusze, ETF-y)",
                        "Reinwestuj zyski z inwestycji, aby wykorzystać efekt procentu składanego",
                        "Regularnie monitoruj i rebalansuj portfel, dostosowując go do zmieniających się warunków rynkowych"
                    ]
                )
            )
        
        # Down payment specific recommendations
        if down_payment == "ten":
            recommendations.append(
                FinancialRecommendation(
                    id="home_purchase_min_down_payment",
                    title="Strategia minimalnego wkładu własnego",
                    description="Rekomendacje dla osób planujących zakup z minimalnym (10%) wkładem własnym.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Przygotuj się na wyższe koszty kredytu i potencjalny wymóg ubezpieczenia niskiego wkładu",
                        "Dokładnie porównaj oferty różnych banków - niektóre mają korzystniejsze warunki przy niskim wkładzie",
                        "Rozważ podniesienie zdolności kredytowej poprzez spłatę istniejących zobowiązań",
                        "Miej plan awaryjny w przypadku zmian na rynku kredytów hipotecznych"
                    ]
                )
            )
        elif down_payment == "full":
            recommendations.append(
                FinancialRecommendation(
                    id="home_purchase_cash",
                    title="Zakup nieruchomości za gotówkę",
                    description="Rekomendacje dla osób planujących zakup nieruchomości bez kredytu.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Rozważ bardziej agresywną strategię inwestycyjną dla części środków",
                        "Zaplanuj optymalny moment zakupu, obserwując trendy cenowe na rynku",
                        "Przygotuj rezerwę finansową na koszty transakcyjne i wykończeniowe",
                        "Rozważ czy pełny zakup gotówkowy jest optymalny - czasem lepiej zainwestować część środków"
                    ]
                )
            )
        
        # Additional recommendation for everyone
        recommendations.append(
            FinancialRecommendation(
                id="home_purchase_preparation",
                title="Przygotowanie do zakupu nieruchomości",
                description="Kompleksowe przygotowanie do procesu zakupu nieruchomości.",
                advisor_type="financial",
                impact="medium",
                action_items=[
                    "Zbadaj dokładnie rynek w interesujących Cię lokalizacjach",
                    "Przygotuj dodatkowe środki na koszty transakcyjne (prowizje, podatki, notariusz)",
                    "Zaplanuj budżet na remont i wyposażenie",
                    "Skonsultuj się z doradcą kredytowym na wczesnym etapie planowania"
                ]
            )
        )
        
        return recommendations
    
    def _generate_retirement_recommendations(self, retirement_age: str, current_age: str, vehicle: str, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """Generate retirement recommendations."""
        recommendations = []
        
        # Base recommendation
        retirement_age_desc_map = {
            "early": "wcześniejszej emerytury",
            "standard": "emerytury w standardowym wieku",
            "late": "późniejszej emerytury"
        }
        retirement_age_desc = retirement_age_desc_map.get(retirement_age, "emerytury")
        
        current_age_desc_map = {
            "early": "wczesnym etapie kariery",
            "mid": "środkowym etapie kariery",
            "late": "późnym etapie kariery"
        }
        current_age_desc = current_age_desc_map.get(current_age, "obecnym etapie kariery")
        
        vehicle_desc_map = {
            "ike_ikze": "IKE/IKZE",
            "investment": "własne inwestycje długoterminowe",
            "real_estate": "nieruchomości na wynajem",
            "combined": "strategię łączoną"
        }
        vehicle_desc = vehicle_desc_map.get(vehicle, "wybrane instrumenty")
        
        recommendations.append(
            FinancialRecommendation(
                id="retirement_base",
                title=f"Plan oszczędzania na {retirement_age_desc}",
                description=f"Strategia budowania zabezpieczenia emerytalnego na {current_age_desc} poprzez {vehicle_desc}.",
                advisor_type="financial",
                impact="high",
                action_items=[
                    "Określ swoje potrzeby finansowe na emeryturze",
                    "Ustal, ile musisz oszczędzać miesięcznie, aby osiągnąć cel",
                    "Rozpocznij regularne wpłaty na wybrane instrumenty emerytalne",
                    "Systematycznie weryfikuj i dostosowuj strategię do zmieniających się warunków"
                ]
            )
        )
        
        # Age-specific recommendations
        if current_age == "early":
            recommendations.append(
                FinancialRecommendation(
                    id="retirement_early_career",
                    title="Oszczędzanie na emeryturę na początku kariery",
                    description="Strategie budowania zabezpieczenia emerytalnego dla osób w wieku 20-35 lat.",
                    advisor_type="investment",
                    impact="high",
                    action_items=[
                        "Wykorzystaj długi horyzont inwestycyjny - rozważ wyższy udział akcji (70-80%)",
                        "Maksymalnie wykorzystaj siłę procentu składanego - rozpocznij oszczędzanie jak najwcześniej",
                        "Ustaw automatyczne, regularne wpłaty, nawet jeśli zaczynasz od małych kwot",
                        "Maksymalizuj wpłaty na IKE/IKZE dla korzyści podatkowych"
                    ]
                )
            )
        elif current_age == "mid":
            recommendations.append(
                FinancialRecommendation(
                    id="retirement_mid_career",
                    title="Oszczędzanie na emeryturę w środku kariery",
                    description="Strategie budowania zabezpieczenia emerytalnego dla osób w wieku 36-50 lat.",
                    advisor_type="investment",
                    impact="high",
                    action_items=[
                        "Zwiększ kwotę oszczędności do 15-20% dochodów",
                        "Dostosuj strategię inwestycyjną - zrównoważony portfel (50-60% akcji, 40-50% obligacji)",
                        "Maksymalizuj wpłaty na IKE/IKZE i inne dostępne programy emerytalne",
                        "Rozważ dodatkowe źródła dochodu pasywnego (nieruchomości, dywidendy)"
                    ]
                )
            )
        else:  # current_age == "late"
            recommendations.append(
                FinancialRecommendation(
                    id="retirement_late_career",
                    title="Oszczędzanie na emeryturę w późnym etapie kariery",
                    description="Strategie budowania zabezpieczenia emerytalnego dla osób w wieku 51+ lat.",
                    advisor_type="investment",
                    impact="high",
                    action_items=[
                        "Maksymalizuj oszczędności - rozważ odkładanie 25-30% dochodów",
                        "Dostosuj strategię inwestycyjną - bardziej konserwatywny portfel (30-40% akcji, 60-70% obligacji)",
                        "Wykorzystaj możliwości wyższych wpłat na IKE/IKZE dla osób 50+",
                        "Opracuj strategię wypłat środków po przejściu na emeryturę"
                    ]
                )
            )
        
        # Vehicle-specific recommendations
        if vehicle == "ike_ikze":
            recommendations.append(
                FinancialRecommendation(
                    id="retirement_ike_ikze",
                    title="Maksymalizacja korzyści z IKE i IKZE",
                    description="Strategie optymalnego wykorzystania indywidualnych kont emerytalnych.",
                    advisor_type="tax",
                    impact="high",
                    action_items=[
                        "Maksymalizuj roczne wpłaty do limitu (szczególnie na IKZE dla bieżących korzyści podatkowych)",
                        "Rozważ równoczesne wykorzystanie IKE i IKZE dla różnych korzyści podatkowych",
                        "Starannie wybierz instytucję prowadzącą konta, porównując opłaty i ofertę inwestycyjną",
                        "Dostosuj strategię inwestycyjną w ramach IKE/IKZE do swojego wieku i profilu ryzyka"
                    ]
                )
            )
        elif vehicle == "real_estate":
            recommendations.append(
                FinancialRecommendation(
                    id="retirement_real_estate",
                    title="Nieruchomości jako zabezpieczenie emerytalne",
                    description="Strategie wykorzystania nieruchomości w budowaniu zabezpieczenia emerytalnego.",
                    advisor_type="investment",
                    impact="high",
                    action_items=[
                        "Inwestuj w nieruchomości generujące stabilny przepływ gotówki (wynajem)",
                        "Dywersyfikuj portfel nieruchomości (lokalizacja, typ nieruchomości)",
                        "Planuj spłatę ewentualnych kredytów hipotecznych przed przejściem na emeryturę",
                        "Rozważ utworzenie funduszu na nieoczekiwane wydatki związane z nieruchomościami"
                    ]
                )
            )
        elif vehicle == "investment":
            recommendations.append(
                FinancialRecommendation(
                    id="retirement_own_investments",
                    title="Własny portfel inwestycyjny na emeryturę",
                    description="Strategie budowania własnego portfela inwestycyjnego z myślą o emeryturze.",
                    advisor_type="investment",
                    impact="high",
                    action_items=[
                        "Stwórz zdywersyfikowany portfel dostosowany do Twojego horyzontu emerytalnego",
                        "Systematycznie inwestuj niezależnie od warunków rynkowych (DCA)",
                        "Dostosuj alokację aktywów do wieku (np. reguła 100 minus wiek dla udziału akcji)",
                        "Reinwestuj otrzymane dywidendy i odsetki dla efektu procentu składanego"
                    ]
                )
            )
        
        # Additional recommendation for everyone
        recommendations.append(
            FinancialRecommendation(
                id="retirement_diversification",
                title="Dywersyfikacja źródeł dochodu emerytalnego",
                description="Strategie budowania wielu źródeł dochodu na emeryturze.",
                advisor_type="financial",
                impact="medium",
                action_items=[
                    "Nie polegaj wyłącznie na jednym źródle dochodu emerytalnego",
                    "Łącz różne instrumenty (państwowy system emerytalny, IKE/IKZE, własne inwestycje)",
                    "Buduj aktywa generujące pasywny dochód (nieruchomości, dywidendy, obligacje)",
                    "Regularnie weryfikuj i dostosowuj strategię do zmieniających się warunków"
                ]
            )
        )
        
        return recommendations
    
    def _generate_education_recommendations(self, timeframe: str, education_type: str, cost: str, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """Generate education recommendations."""
        recommendations = []
        
        # Base recommendation
        timeframe_desc_map = {
            "short": "krótkim czasie (w ciągu roku)",
            "medium": "średnim okresie (1-3 lata)",
            "long": "dłuższym okresie (3-5 lat)"
        }
        timeframe_desc = timeframe_desc_map.get(timeframe, "planowanym okresie")
        
        education_desc_map = {
            "university": "studiów wyższych",
            "courses": "kursów specjalistycznych",
            "certification": "certyfikatów zawodowych",
            "child": "edukacji dziecka"
        }
        education_desc = education_desc_map.get(education_type, "edukacji")
        
        cost_desc_map = {
            "small": "niższym koszcie (do 10 tys. zł)",
            "medium": "średnim koszcie (10-30 tys. zł)",
            "large": "wyższym koszcie (30-100 tys. zł)",
            "very_large": "wysokim koszcie (powyżej 100 tys. zł)"
        }
        cost_desc = cost_desc_map.get(cost, "szacowanym koszcie")
        
        recommendations.append(
            FinancialRecommendation(
                id="education_base",
                title=f"Plan finansowania {education_desc} w {timeframe_desc}",
                description=f"Strategia finansowania edukacji o {cost_desc}.",
                advisor_type="financial",
                impact="high",
                action_items=[
                    "Utwórz dedykowany fundusz edukacyjny z regularnym zasilaniem",
                    "Opracuj budżet uwzględniający wszystkie koszty edukacji (nie tylko czesne)",
                    "Wyszukaj dostępne stypendia, dofinansowania i ulgi podatkowe",
                    "Zaplanuj harmonogram wydatków i dostosuj strategię oszczędzania"
                ]
            )
        )
        
        # Education type specific recommendations
        if education_type == "university":
            recommendations.append(
                FinancialRecommendation(
                    id="education_university",
                    title="Finansowanie studiów wyższych",
                    description="Strategie finansowania studiów wyższych.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Sprawdź możliwości studiowania na uczelniach publicznych (bezpłatnie)",
                        "Poszukaj programów stypendialnych (naukowych, socjalnych, sportowych)",
                        "Rozważ kredyt studencki z preferencyjnymi warunkami",
                        "Zaplanuj pracę dorywczą w trakcie studiów dla pokrycia części kosztów"
                    ]
                )
            )
        elif education_type == "child":
            recommendations.append(
                FinancialRecommendation(
                    id="education_child",
                    title="Długoterminowe oszczędzanie na edukację dziecka",
                    description="Strategie budowania funduszu edukacyjnego dla dziecka.",
                    advisor_type="investment",
                    impact="high",
                    action_items=[
                        "Rozpocznij oszczędzanie jak najwcześniej - najlepiej od narodzin dziecka",
                        "Rozważ długoterminowe instrumenty inwestycyjne dostosowane do horyzontu czasowego",
                        "Ustaw regularne, automatyczne wpłaty na dedykowane konto",
                        "Dostosuj strategię inwestycyjną: bardziej agresywna na początku, konserwatywna gdy dziecko zbliża się do wieku edukacyjnego"
                    ]
                )
            )
        
        # Cost-specific recommendations
        if cost == "large" or cost == "very_large":
            recommendations.append(
                FinancialRecommendation(
                    id="education_high_cost",
                    title="Finansowanie kosztownej edukacji",
                    description="Strategie finansowania edukacji o wysokim koszcie.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Rozważ kombinację różnych źródeł finansowania (oszczędności, kredyt, stypendia)",
                        "Poszukaj możliwości rozłożenia płatności na raty bez dodatkowych kosztów",
                        "Porównaj programy edukacyjne pod kątem stosunku jakości do ceny",
                        "Zbadaj możliwości dofinansowania przez pracodawcę (szczególnie przy certyfikacjach zawodowych)"
                    ]
                )
            )
        
        # Timeframe-specific recommendations
        if timeframe == "short":
            recommendations.append(
                FinancialRecommendation(
                    id="education_short_term",
                    title="Szybkie gromadzenie funduszu edukacyjnego",
                    description="Strategie szybkiego zgromadzenia środków na edukację.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Maksymalizuj oszczędności - rozważ tymczasowe ograniczenie innych wydatków",
                        "Poszukaj dodatkowych źródeł dochodu",
                        "Wykorzystaj dostępne środki płynne (konta oszczędnościowe, lokaty)",
                        "Jeśli konieczne, rozważ kredyt edukacyjny z planem szybkiej spłaty"
                    ]
                )
            )
        elif timeframe == "long":
            recommendations.append(
                FinancialRecommendation(
                    id="education_long_term",
                    title="Długoterminowe oszczędzanie na edukację",
                    description="Strategie systematycznego budowania funduszu edukacyjnego.",
                    advisor_type="investment",
                    impact="medium",
                    action_items=[
                        "Wykorzystaj siłę procentu składanego - inwestuj regularnie od początku",
                        "Rozważ bardziej dynamiczne instrumenty inwestycyjne na początku okresu oszczędzania",
                        "Stopniowo zwiększaj udział bezpiecznych instrumentów w miarę zbliżania się terminu",
                        "Regularnie weryfikuj, czy zgromadzone środki są adekwatne do aktualnych kosztów edukacji"
                    ]
                )
            )
        
        return recommendations
    
    def _generate_vacation_recommendations(self, timeframe: str, cost: str, savings_method: str, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """Generate vacation recommendations."""
        recommendations = []
        
        # Base recommendation
        timeframe_desc_map = {
            "short": "krótkim czasie (w ciągu 6 miesięcy)",
            "medium": "średnim okresie (w ciągu roku)",
            "long": "dłuższym okresie (1-2 lata)"
        }
        timeframe_desc = timeframe_desc_map.get(timeframe, "planowanym okresie")
        
        cost_desc_map = {
            "small": "niższym koszcie (do 5 tys. zł)",
            "medium": "średnim koszcie (5-15 tys. zł)",
            "large": "wyższym koszcie (15-30 tys. zł)",
            "very_large": "wysokim koszcie (powyżej 30 tys. zł)"
        }
        cost_desc = cost_desc_map.get(cost, "szacowanym koszcie")
        
        method_desc_map = {
            "savings": "z bieżących oszczędności",
            "dedicated": "poprzez dedykowane konto wakacyjne",
            "combined": "z różnych źródeł",
            "credit": "z wsparciem kredytu"
        }
        method_desc = method_desc_map.get(savings_method, "wybranym sposobem")
        
        recommendations.append(
            FinancialRecommendation(
                id="vacation_base",
                title=f"Plan finansowania wyjazdu w {timeframe_desc}",
                description=f"Strategia finansowania wakacji o {cost_desc} {method_desc}.",
                advisor_type="financial",
                impact="medium",
                action_items=[
                    "Określ dokładny budżet wyjazdu uwzględniający wszystkie koszty",
                    "Ustal miesięczną kwotę oszczędności niezbędną do realizacji celu",
                    "Wyszukuj promocje i oferty first/last minute dla obniżenia kosztów",
                    "Zaplanuj rezerwę finansową na nieprzewidziane wydatki podczas wyjazdu"
                ]
            )
        )
        
        # Timeframe-specific recommendations
        if timeframe == "short":
            recommendations.append(
                FinancialRecommendation(
                    id="vacation_short_term",
                    title="Szybkie zgromadzenie funduszy na wakacje",
                    description="Strategie szybkiego zgromadzenia środków na wyjazd w ciągu 6 miesięcy.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Zidentyfikuj możliwości ograniczenia wydatków w krótkim terminie",
                        "Rozważ przeznaczenie premii lub nadgodzin na cel wakacyjny",
                        "Poszukaj okazji cenowych i wczesnych rezerwacji z zaliczką",
                        "Tymczasowo zwiększ oszczędności - odłóż na bok 15-20% miesięcznych dochodów"
                    ]
                )
            )
        
        # Cost-specific recommendations
        if cost == "large" or cost == "very_large":
            recommendations.append(
                FinancialRecommendation(
                    id="vacation_expensive",
                    title="Finansowanie kosztownych wakacji",
                    description="Strategie finansowania droższych wyjazdów wakacyjnych.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Zaplanuj wyjazd z dużym wyprzedzeniem dla lepszego rozłożenia kosztów",
                        "Poszukaj możliwości rezerwacji z zaliczką i płatnością ratalną",
                        "Rozważ podróż poza szczytem sezonu dla znaczących oszczędności",
                        "Dokładnie porównaj opcje zakwaterowania i transportu pod kątem stosunku jakości do ceny"
                    ]
                )
            )
        
        # Method-specific recommendations
        if savings_method == "dedicated":
            recommendations.append(
                FinancialRecommendation(
                    id="vacation_dedicated_account",
                    title="Dedykowane konto wakacyjne",
                    description="Strategie efektywnego wykorzystania dedykowanego konta do oszczędzania na wakacje.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Otwórz oddzielne konto oszczędnościowe wyłącznie na cel wakacyjny",
                        "Ustaw automatyczne przelewy na to konto bezpośrednio po otrzymaniu wynagrodzenia",
                        "Ustaw przypomnienia o odkładaniu dodatkowych środków (premie, nadgodziny)",
                        "Unikaj korzystania z tych środków na inne cele nawet w przypadku pokus"
                    ]
                )
            )
        elif savings_method == "credit":
            recommendations.append(
                FinancialRecommendation(
                    id="vacation_credit",
                    title="Odpowiedzialne finansowanie wakacji kredytem",
                    description="Strategie bezpiecznego wykorzystania kredytu do finansowania wakacji.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Rozważ kredyt tylko jeśli masz pewność spłaty w krótkim terminie (3-6 miesięcy)",
                        "Poszukaj kart kredytowych z programami podróżniczymi i okresem bez odsetek",
                        "Dokładnie porównaj koszty kredytu i ustal plan spłaty przed wyjazdem",
                        "Odłóż część środków przed wyjazdem, aby zminimalizować kwotę kredytu"
                    ]
                )
            )
        
        # Additional recommendation for everyone
        recommendations.append(
            FinancialRecommendation(
                id="vacation_budget_management",
                title="Zarządzanie budżetem wakacyjnym",
                description="Strategie efektywnego zarządzania budżetem podczas wyjazdu.",
                advisor_type="financial",
                impact="low",
                action_items=[
                    "Stwórz szczegółowy plan wydatków na każdy dzień wyjazdu",
                    "Monitoruj wydatki podczas podróży używając aplikacji budżetowej",
                    "Wymień walutę z wyprzedzeniem, śledząc kursy wymiany",
                    "Zaplanuj limity na różne kategorie wydatków (jedzenie, atrakcje, zakupy)"
                ]
            )
        )
        
        return recommendations
    
    def _generate_other_goal_recommendations(self, amount: str, timeframe: str, priority: str, context: Dict[str, Any]) -> List[FinancialRecommendation]:
        """Generate recommendations for other financial goals."""
        recommendations = []
        
        # Base recommendation
        amount_desc_map = {
            "small": "niższą kwotą (do 5 tys. zł)",
            "medium": "średnią kwotą (5-20 tys. zł)",
            "large": "wyższą kwotą (20-50 tys. zł)",
            "very_large": "wysoką kwotą (powyżej 50 tys. zł)"
        }
        amount_desc = amount_desc_map.get(amount, "wybraną kwotą")
        
        timeframe_desc_map = {
            "short": "krótkim czasie (w ciągu 6 miesięcy)",
            "medium": "średnim okresie (w ciągu roku)",
            "long": "dłuższym okresie (1-3 lata)",
            "very_long": "długim okresie (powyżej 3 lat)"
        }
        timeframe_desc = timeframe_desc_map.get(timeframe, "planowanym okresie")
        
        priority_desc_map = {
            "low": "niskim priorytetem",
            "medium": "średnim priorytetem",
            "high": "wysokim priorytetem"
        }
        priority_desc = priority_desc_map.get(priority, "określonym priorytetem")
        
        recommendations.append(
            FinancialRecommendation(
                id="other_goal_base",
                title=f"Plan realizacji celu finansowego z {amount_desc}",
                description=f"Strategia realizacji celu w {timeframe_desc} o {priority_desc}.",
                advisor_type="financial",
                impact="medium",
                action_items=[
                    "Określ dokładną kwotę potrzebną do realizacji celu",
                    "Ustal miesięczną kwotę oszczędności niezbędną do realizacji celu w założonym czasie",
                    "Utwórz dedykowane konto dla tego celu",
                    "Przygotuj plan awaryjny w przypadku nieoczekiwanych trudności"
                ]
            )
        )
        
        # Amount and timeframe specific recommendations
        if amount in ["large", "very_large"] and timeframe in ["short", "medium"]:
            recommendations.append(
                FinancialRecommendation(
                    id="other_goal_large_short",
                    title="Szybkie gromadzenie znacznych środków",
                    description="Strategie szybkiego zgromadzenia większej kwoty w krótkim czasie.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Zidentyfikuj możliwości znacznego ograniczenia wydatków w krótkim terminie",
                        "Rozważ dodatkowe źródła dochodów (praca dodatkowa, sprzedaż aktywów)",
                        "Przeanalizuj możliwość częściowego finansowania z innych źródeł",
                        "Ustaw agresywny plan oszczędnościowy z odkładaniem 30-40% dochodów"
                    ]
                )
            )
        elif amount in ["small", "medium"] and timeframe in ["long", "very_long"]:
            recommendations.append(
                FinancialRecommendation(
                    id="other_goal_small_long",
                    title="Systematyczne oszczędzanie małych kwot",
                    description="Strategie regularnego odkładania mniejszych kwot przez dłuższy czas.",
                    advisor_type="financial",
                    impact="medium",
                    action_items=[
                        "Ustaw niewielkie, ale regularne automatyczne przelewy na konto oszczędnościowe",
                        "Wykorzystaj aplikacje do mikro-oszczędzania (np. zaokrąglanie transakcji)",
                        "Rozważ odkładanie określonego procentu (np. 5%) każdego przychodu",
                        "Zwiększaj kwotę oszczędności przy każdej podwyżce dochodów"
                    ]
                )
            )
        
        # Priority-specific recommendations
        if priority == "high":
            recommendations.append(
                FinancialRecommendation(
                    id="other_goal_high_priority",
                    title="Realizacja celu o wysokim priorytecie",
                    description="Strategie realizacji finansowych celów o najwyższym priorytecie.",
                    advisor_type="financial",
                    impact="high",
                    action_items=[
                        "Ustaw ten cel jako priorytetowy w Twoim budżecie - przed wydatkami opcjonalnymi",
                        "Rozważ tymczasowe ograniczenie innych celów finansowych",
                        "Utwórz dedykowany, widoczny wskaźnik postępu w realizacji celu",
                        "Poszukaj optymalnego momentu realizacji celu pod kątem kosztów"
                    ]
                )
            )
        elif priority == "low":
            recommendations.append(
                FinancialRecommendation(
                    id="other_goal_low_priority",
                    title="Elastyczne podejście do celu o niższym priorytecie",
                    description="Strategie realizacji celów finansowych o niższym priorytecie.",
                    advisor_type="financial",
                    impact="low",
                    action_items=[
                        "Ustal niewielką, ale regularną kwotę oszczędności na ten cel",
                        "Wykorzystuj nieoczekiwane dodatkowe przychody",
                        "Bądź elastyczny co do terminu realizacji celu",
                        "Okresowo weryfikuj, czy ten cel nadal jest dla Ciebie istotny"
                    ]
                )
            )
        
        # Additional recommendation for everyone
        recommendations.append(
            FinancialRecommendation(
                id="other_goal_tracking",
                title="Monitorowanie postępów w realizacji celu",
                description="Strategie efektywnego śledzenia postępów w oszczędzaniu.",
                advisor_type="financial",
                impact="medium",
                action_items=[
                    "Ustaw miesięczne cele cząstkowe i regularnie monitoruj postępy",
                    "Wykorzystaj aplikacje finansowe do wizualizacji postępów",
                    "Świętuj osiągnięcie kamieni milowych (np. 25%, 50%, 75% celu)",
                    "Regularnie weryfikuj, czy przyjęta strategia oszczędzania jest optymalna"
                ]
            )
        )
        
        return recommendations
    
    def _save_recommendations(self, user_id: int, context: Dict[str, Any], recommendations: List[FinancialRecommendation]) -> None:
        """
        Save recommendations to database for future reference and analysis.
        
        Args:
            user_id: User ID
            context: Request context
            recommendations: Generated recommendations
        """
        try:
            import json
            # In real implementation, this would save to a database
            logger.info(f"Recommendations saved for user {user_id}")
        except Exception as e:
            logger.error(f"Error saving recommendations: {e}")
            # Continue even if there's an error saving to the database
            pass
    
    def get_user_recommendations(self, user_id: int) -> List[FinancialRecommendation]:
        """
        Get saved recommendations for a user from the database.
        
        Args:
            user_id: User ID
            
        Returns:
            List of financial recommendations
        """
        try:
            # In real implementation, this would load from a database
            return []
        except Exception as e:
            logger.error(f"Error retrieving recommendations: {e}")
            return []

class TreeModel:
    """
    Wrapper class for FinancialDecisionTree that provides backward compatibility
    with legacy code expecting a TreeModel class.
    """
    
    def __init__(self):
        """Initialize the TreeModel with a FinancialDecisionTree instance."""
        self.decision_tree = FinancialDecisionTree()
        logger.info("TreeModel initialized with FinancialDecisionTree")
    
    def predict_response(self, message: str, user_id: int = None, context: Dict[str, Any] = None) -> str:
        """
        Predict a response based on the input message.
        
        Args:
            message: User message
            user_id: User ID (optional)
            context: Additional context (optional)
            
        Returns:
            Generated response
        """
        if context is None:
            context = {}
            
        # Create a DecisionTreeRequest object
        request = DecisionTreeRequest(
            user_id=user_id or 1,
            current_node_id=None,  # Start from root
            answer=None,
            context=context
        )
        
        # Process the initial step to get to the root node
        response = self.decision_tree.process_step(request)
        
        # Simple keyword matching to determine the user's intent from the message
        message_lower = message.lower()
        
        # Map message keywords to decisions
        if "fundusz" in message_lower or "awaryjny" in message_lower:
            return "Aby pomóc z funduszem awaryjnym, odpowiedz na kilka pytań. W jakim czasie chcesz zgromadzić fundusz awaryjny? (w ciągu 6 miesięcy, w ciągu roku, w ciągu 1-2 lat)"
        elif "zadłużenie" in message_lower or "dług" in message_lower or "kredyt" in message_lower:
            return "Aby pomóc z redukcją zadłużenia, odpowiedz na kilka pytań. Jaki rodzaj zadłużenia chcesz spłacić w pierwszej kolejności? (karty kredytowe/chwilówki, kredyty konsumpcyjne, kredyt hipoteczny, kredyt studencki, różne zobowiązania)"
        elif "mieszkanie" in message_lower or "dom" in message_lower or "nieruchomość" in message_lower:
            return "Aby pomóc z zakupem nieruchomości, odpowiedz na kilka pytań. W jakim czasie planujesz zakup? (w ciągu 1-2 lat, w ciągu 3-5 lat, w ciągu 5-10 lat)"
        elif "emerytura" in message_lower or "emerytalny" in message_lower:
            return "Aby pomóc z planowaniem emerytalnym, odpowiedz na kilka pytań. W jakim wieku planujesz przejść na emeryturę? (wcześniej niż wiek emerytalny, w standardowym wieku emerytalnym, później niż wiek emerytalny)"
        elif "studia" in message_lower or "edukacja" in message_lower or "nauka" in message_lower:
            return "Aby pomóc z finansowaniem edukacji, odpowiedz na kilka pytań. Kiedy planujesz rozpocząć edukację? (w ciągu roku, w ciągu 1-3 lat, w ciągu 3-5 lat)"
        elif "wakacje" in message_lower or "podróż" in message_lower or "wyjazd" in message_lower:
            return "Aby pomóc z finansowaniem wakacji, odpowiedz na kilka pytań. Kiedy planujesz wyjazd? (w ciągu 6 miesięcy, w ciągu roku, w ciągu 1-2 lat)"
        else:
            return "Czym mogę Ci pomóc? Możemy porozmawiać o funduszu awaryjnym, redukcji zadłużenia, zakupie nieruchomości, emeryturze, edukacji, wakacjach lub innych celach finansowych."

    def process_decision_step(self, user_id: int, step: int, decision_path: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Process a step in the decision tree and return options.
        
        Args:
            user_id: User ID
            step: Current step index
            decision_path: Path of decisions taken so far
            
        Returns:
            List of options for the current step
        """
        try:
            # Map step to node ID based on decision path
            current_node_id = None
            answer = None
            
            # Start at root
            if step == 0:
                current_node_id = "root"
            # Otherwise determine node from decision path
            elif decision_path and len(decision_path) > 0:
                last_decision = decision_path[-1]
                last_step_node_id = last_decision.get('node_id', 'root')
                last_selection = last_decision.get('selection')
                
                # Get the node
                node = self.decision_tree.tree.get(last_step_node_id)
                if node and last_selection in node.next_steps:
                    current_node_id = node.next_steps[last_selection]
            
            if not current_node_id:
                current_node_id = "root"
            
            # Build context from decision path
            context = {"journey": [], "answers": {}}
            for decision in decision_path:
                node_id = decision.get('node_id')
                selection = decision.get('selection')
                if node_id and selection:
                    context["journey"].append(node_id)
                    context["answers"][node_id] = selection
            
            # Create request
            request = DecisionTreeRequest(
                user_id=user_id,
                current_node_id=current_node_id,
                answer=answer,
                context=context
            )
            
            # Process step
            response = self.decision_tree.process_step(request)
            
            # Convert node options to expected format
            options = []
            for option in response.node.options:
                options.append({
                    "id": option.get("id"),
                    "text": option.get("label"),
                    "value": option.get("id"),
                    "question": response.node.question
                })
            
            return options
        
        except Exception as e:
            logger.error(f"Error processing decision step: {e}")
            # Return a fallback option if something goes wrong
            return [
                {
                    "id": "fallback",
                    "text": "Kontynuuj",
                    "value": "fallback",
                    "question": "Przepraszamy, wystąpił problem. Czy chcesz kontynuować?"
                }
            ]
    
    def generate_report(self, user_id: int, decision_path: List[Dict[str, Any]], user_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a financial recommendation report based on the decision path.
        
        Args:
            user_id: User ID
            decision_path: Path of decisions taken
            user_profile: User profile information (optional)
            
        Returns:
            Report with summary and steps
        """
        try:
            # Build context from decision path
            context = {"journey": [], "answers": {}}
            for decision in decision_path:
                node_id = decision.get('node_id')
                selection = decision.get('selection')
                if node_id and selection:
                    context["journey"].append(node_id)
                    context["answers"][node_id] = selection
            
            # Add user profile to context if provided
            if user_profile:
                context["user_profile"] = user_profile
            
            # Determine the financial goal from the first answer (root node)
            financial_goal = None
            for decision in decision_path:
                if decision.get('node_id') == 'root':
                    financial_goal = decision.get('selection')
                    break
            
            # Generate recommendations based on financial goal
            recommendations = []
            if financial_goal == "emergency_fund":
                timeframe = self._get_answer_from_path(decision_path, 'ef_timeframe')
                amount = self._get_answer_from_path(decision_path, 'ef_amount')
                savings_method = self._get_answer_from_path(decision_path, 'ef_savings_method')
                recommendations = self.decision_tree._generate_emergency_fund_recommendations(timeframe, amount, savings_method, context)
            elif financial_goal == "debt_reduction":
                debt_type = self._get_answer_from_path(decision_path, 'debt_type')
                total_amount = self._get_answer_from_path(decision_path, 'debt_total_amount')
                strategy = self._get_answer_from_path(decision_path, 'debt_strategy')
                recommendations = self.decision_tree._generate_debt_reduction_recommendations(debt_type, total_amount, strategy, context)
            # Add other goal types as needed
            
            # Fallback to a generic recommendation if no specific recommendations found
            if not recommendations:
                recommendations = [
                    FinancialRecommendation(
                        id="generic_recommendation",
                        title="Ogólne rekomendacje finansowe",
                        description="Na podstawie Twoich odpowiedzi, przygotowaliśmy ogólne rekomendacje.",
                        advisor_type="financial",
                        impact="medium",
                        action_items=[
                            "Utrzymuj fundusz awaryjny wynoszący 3-6 miesięcznych wydatków",
                            "Regularnie oszczędzaj przynajmniej 20% swoich dochodów",
                            "Rozważ dywersyfikację inwestycji między różne klasy aktywów",
                            "Korzystaj z dostępnych ulg podatkowych"
                        ]
                    )
                ]
            
            # Convert recommendations to report format
            summary = recommendations[0].description if recommendations else "Przygotowaliśmy rekomendacje dla Twojej sytuacji finansowej."
            steps = []
            
            for recommendation in recommendations:
                for action in recommendation.action_items:
                    steps.append(action)
            
            return {
                "summary": summary,
                "steps": steps[:4]  # Limit to top 4 steps for clarity
            }
        
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            # Return a fallback report if something goes wrong
            return {
                "summary": "Przygotowaliśmy podstawowe rekomendacje dla Twojej sytuacji finansowej.",
                "steps": [
                    "Stwórz budżet miesięczny i monitoruj wydatki",
                    "Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków",
                    "Spłać zadłużenia o wysokim oprocentowaniu",
                    "Regularnie odkładaj na długoterminowe cele"
                ]
            }
    
    def _get_answer_from_path(self, decision_path: List[Dict[str, Any]], node_id: str) -> str:
        """Helper method to extract an answer for a specific node from the decision path."""
        for decision in decision_path:
            if decision.get('node_id') == node_id:
                return decision.get('selection')
        return None