"""
Endpoint API dla drzewa decyzyjnego - łączy frontend z modelem drzewa decyzyjnego
i routerami FastAPI.
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Dict, Any, List
from datetime import datetime
import logging
import json

from ai.tree_model import (
    FinancialDecisionTree, 
    DecisionTreeRequest, 
    DecisionTreeResponse,
    FinancialRecommendation
)
# from ai.ai_chat_selector import AIChatSelector  # Commented out to avoid import issues
from core.database import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)

# Inicjalizacja modelu drzewa decyzyjnego
decision_tree = FinancialDecisionTree()

@router.post("/decision-tree", response_model=Dict[str, Any])
async def process_decision_tree(request_data: Dict[str, Any] = Body(...)):
    """
    Przetwarza krok w drzewie decyzyjnym specjalisty i zwraca następny krok lub rekomendacje.
    Obsługuje zapytania z frontend decision tree service i wykorzystuje tree_model.py.
    """
    try:
        logger.info(f"Przetwarzanie kroku drzewa decyzyjnego: {request_data}")
        
        # Pobierz dane z zapytania - obsługa różnych formatów z frontendu
        user_id = request_data.get("user_id", 1)
        advisor_id = request_data.get("advisor_id")
        goal_type = request_data.get("goal_type")
        step = request_data.get("step", 0)
        decision_path = request_data.get("decision_path", [])
        context = request_data.get("context", {})
        current_node_id = request_data.get("current_node_id")
        answer = request_data.get("answer")
        
        # Określ typ doradcy na podstawie goal_type lub advisor_id
        if goal_type:
            context["advisor_type"] = _map_goal_to_advisor_type(goal_type)
        elif advisor_id:
            context["advisor_type"] = _map_advisor_id_to_type(advisor_id)
        else:
            context["advisor_type"] = "financial"
        
        # Jeśli nie ma current_node_id, rozpocznij od root
        if not current_node_id:
            current_node_id = "root"
        
        # Utwórz obiekt żądania dla modelu drzewa decyzyjnego
        tree_request = DecisionTreeRequest(
            user_id=user_id,
            current_node_id=current_node_id,
            answer=answer,
            context=context
        )
        
        # Przetwórz krok drzewa decyzyjnego używając tree_model
        response = decision_tree.process_step(tree_request)
        
        # Zapisz krok w dzienniku
        try:
            _log_decision_tree_step(tree_request)
        except Exception as e:
            logger.error(f"Błąd logowania kroku drzewa decyzyjnego: {e}")
        
        # Konwertuj odpowiedź z tree_model na format oczekiwany przez frontend
        result = {
            "node": response.node.dict(),
            "progress": response.progress,
            "step": step,
            "advisor_type": context.get("advisor_type", "financial"),
            "goal_type": goal_type
        }
        
        # Jeśli mamy rekomendacje, dodaj je do odpowiedzi
        if response.recommendations:
            result["recommendations"] = [rec.dict() for rec in response.recommendations]
            result["completed"] = True
        else:
            result["completed"] = False
        
        # Dodaj wiadomości jeśli są
        if response.messages:
            result["messages"] = response.messages
        
        return result
    
    except Exception as e:
        logger.error(f"Błąd przetwarzania kroku drzewa decyzyjnego: {e}")
        # Zwróć opcje fallback zamiast błędu
        return {
            "node": {
                "id": "error",
                "type": "question",
                "question": "Przepraszamy, wystąpił błąd. Czy chcesz spróbować ponownie?",
                "options": [
                    {"id": "retry", "label": "Spróbuj ponownie"},
                    {"id": "restart", "label": "Zacznij od nowa"}
                ]
            },
            "progress": 0.0,
            "step": 0,
            "advisor_type": "financial",
            "error": str(e),
            "completed": False
        }

@router.post("/decision-tree/report", response_model=Dict[str, Any])
async def generate_report(request_data: Dict[str, Any] = Body(...)):
    """
    Generuje raport na podstawie ścieżki decyzyjnej użytkownika.
    """
    try:
        logger.info(f"Generowanie raportu dla ścieżki decyzyjnej: {request_data}")
        
        user_id = request_data.get("user_id", 1)
        advisor_id = request_data.get("advisor_id")
        goal_type = request_data.get("goal_type")
        decision_path = request_data.get("decision_path", [])
        user_profile = request_data.get("user_profile", {})
        advisor_type = request_data.get("advisor_type") or goal_type or _map_advisor_id_to_type(advisor_id) or "financial"
        
        # Generuj rekomendacje na podstawie ścieżki decyzyjnej
        recommendations = _generate_recommendations_for_path(advisor_type, decision_path)
        
        # Utwórz raport
        report = {
            "summary": _generate_summary(advisor_type, decision_path),
            "analysis": _generate_analysis(advisor_type, decision_path),
            "recommendations": [rec.get("description", "") for rec in recommendations],
            "detail_recommendations": recommendations,
            "steps": [rec.get("description", "") for rec in recommendations],
            "advisor_type": advisor_type,
            "advisorId": advisor_id,
            "goal": goal_type,
            "generatedAt": datetime.now().isoformat(),
            "confidenceScore": _calculate_confidence_score(decision_path, user_profile),
            "timeEstimate": _estimate_implementation_time(recommendations, user_profile),
            "riskLevel": _assess_recommendation_risk(recommendations, user_profile)
        }
        
        # Opcjonalnie zapisz raport w bazie danych
        try:
            _save_report_to_database(user_id, report)
        except Exception as e:
            logger.error(f"Błąd zapisywania raportu do bazy danych: {e}")
        
        return report
    
    except Exception as e:
        logger.error(f"Błąd generowania raportu: {e}")
        # Zwróć raport fallback
        return {
            "summary": "Wystąpił błąd podczas generowania raportu. Oto ogólne rekomendacje finansowe.",
            "steps": [
                "Stwórz budżet miesięczny i monitoruj wydatki",
                "Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków",
                "Spłać zadłużenia o wysokim oprocentowaniu",
                "Regularnie odkładaj na długoterminowe cele"
            ],
            "generatedAt": datetime.now().isoformat(),
            "isErrorFallback": True,
            "errorCode": "REPORT_GENERATION_ERROR"
        }

@router.post("/decision-tree/reset", response_model=Dict[str, Any])
async def reset_decision_tree(request_data: Dict[str, Any] = Body(...)):
    """
    Resetuje drzewo decyzyjne dla użytkownika.
    """
    try:
        user_id = request_data.get("user_id", 1)
        
        logger.info(f"Resetowanie drzewa decyzyjnego dla użytkownika {user_id}")
        
        return {
            "status": "success",
            "message": "Drzewo decyzyjne zostało zresetowane",
            "user_id": user_id,
            "reset_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Błąd resetowania drzewa decyzyjnego: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Błąd resetowania drzewa decyzyjnego: {str(e)}"
        )

@router.post("/decision-tree/question", response_model=Dict[str, Any])
async def get_next_question(request_data: Dict[str, Any] = Body(...)):
    """
    Pobiera następne pytanie w drzewie decyzyjnym na podstawie tree_model.py.
    Endpoint dedykowany do obsługi pytań z tree_model.
    """
    try:
        logger.info(f"Pobieranie następnego pytania: {request_data}")
        
        user_id = request_data.get("user_id", 1)
        current_node_id = request_data.get("current_node_id", "root")
        answer = request_data.get("answer")
        context = request_data.get("context", {})
        
        # Utwórz żądanie dla tree_model
        tree_request = DecisionTreeRequest(
            user_id=user_id,
            current_node_id=current_node_id,
            answer=answer,
            context=context
        )
        
        # Przetwórz krok używając tree_model
        response = decision_tree.process_step(tree_request)
        
        # Loguj krok
        try:
            _log_decision_tree_step(tree_request)
        except Exception as e:
            logger.error(f"B��ąd logowania kroku: {e}")
        
        # Zwróć odpowiedź w formacie oczekiwanym przez frontend
        result = {
            "question": response.node.question,
            "options": response.node.options,
            "node_id": response.node.id,
            "node_type": response.node.type,
            "progress": response.progress,
            "context": context
        }
        
        # Jeśli to węzeł rekomendacji, dodaj rekomendacje
        if response.node.type == "recommendation" and response.recommendations:
            result["recommendations"] = [rec.dict() for rec in response.recommendations]
            result["completed"] = True
        else:
            result["completed"] = False
        
        # Dodaj wiadomości
        if response.messages:
            result["messages"] = response.messages
        
        return result
        
    except Exception as e:
        logger.error(f"Błąd pobierania następnego pytania: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Błąd pobierania następnego pytania: {str(e)}"
        )

@router.get("/decision-tree/recommendations/{user_id}", response_model=Dict[str, Any])
async def get_user_recommendations(user_id: int):
    """
    Pobiera zapisane rekomendacje dla użytkownika.
    """
    try:
        logger.info(f"Pobieranie rekomendacji dla użytkownika {user_id}")
        
        # Na razie zwracamy przykładowe rekomendacje
        recommendations = [
            {
                "id": "rec_1",
                "title": "Automatyzacja oszczędzania",
                "description": "Ustaw automatyczne przelewy na konto oszczędnościowe",
                "advisor_type": "financial",
                "impact": "high",
                "action_items": ["Skonfiguruj zlecenie stałe", "Zacznij od 10% dochodu"]
            }
        ]
        
        return {"recommendations": recommendations, "count": len(recommendations)}
    
    except Exception as e:
        logger.error(f"Błąd pobierania rekomendacji: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Błąd pobierania rekomendacji: {str(e)}"
        )

async def get_initial_questions(advisor_id: str):
    """
    GET endpoint do inicjalizacji decision tree dla advisor
    Zwraca początkowe pytania dla danego doradcy
    """
    try:
        logger.info(f"Getting initial questions for advisor: {advisor_id}")
        
        # Mapowanie advisor_id na goal_type
        goal_type = _map_advisor_id_to_type(advisor_id)
        
        # Utwórz żądanie dla tree_model z początkowym węzłem
        tree_request = DecisionTreeRequest(
            user_id=1,  # Domyślny user_id dla inicjalizacji
            current_node_id="root",
            answer=None,
            context={"advisor_type": goal_type, "advisor_id": advisor_id}
        )
        
        # Przetwórz początkowy krok używając tree_model
        response = decision_tree.process_step(tree_request)
        
        # Zwróć opcje w formacie oczekiwanym przez frontend
        if response and response.node and response.node.options:
            return {
                "questions": response.node.options,
                "node_id": response.node.id,
                "question_text": response.node.question,
                "advisor_type": goal_type,
                "advisor_id": advisor_id
            }
        else:
            # Fallback options jeśli tree_model nie zwrócił opcji
            fallback_options = _generate_fallback_initial_options(advisor_id, goal_type)
            return {
                "questions": fallback_options,
                "node_id": "root",
                "question_text": "Jak możemy Ci pomóc w osiągnięciu Twojego celu finansowego?",
                "advisor_type": goal_type,
                "advisor_id": advisor_id,
                "is_fallback": True
            }
            
    except Exception as e:
        logger.error(f"Error getting initial questions for advisor {advisor_id}: {e}")
        
        # Zwróć podstawowe opcje fallback
        goal_type = _map_advisor_id_to_type(advisor_id)
        fallback_options = _generate_fallback_initial_options(advisor_id, goal_type)
        
        return {
            "questions": fallback_options,
            "node_id": "root",
            "question_text": "Jak możemy Ci pomóc w osiągnięciu Twojego celu finansowego?",
            "advisor_type": goal_type,
            "advisor_id": advisor_id,
            "is_fallback": True,
            "error": str(e)
        }

def _generate_fallback_initial_options(advisor_id: str, goal_type: str) -> List[Dict[str, Any]]:
    """Generuje opcje fallback dla inicjalizacji decision tree"""
    
    # Opcje bazowe dla różnych typów doradców
    if goal_type == "financial" or advisor_id == "budget_planner":
        return [
            {
                "id": "timeframe_short",
                "text": "W ciągu 6 miesięcy",
                "value": "short",
                "question": "W jakim czasie chcesz osiągnąć swój cel finansowy?"
            },
            {
                "id": "timeframe_medium", 
                "text": "W ciągu roku",
                "value": "medium",
                "question": "W jakim czasie chcesz osiągnąć swój cel finansowy?"
            },
            {
                "id": "timeframe_long",
                "text": "W ciągu 1-2 lat",
                "value": "long", 
                "question": "W jakim czasie chcesz osiągnąć swój cel finansowy?"
            }
        ]
    elif goal_type == "investment" or advisor_id == "optimization_advisor":
        return [
            {
                "id": "risk_low",
                "text": "Niskie ryzyko, stabilne zyski",
                "value": "low_risk",
                "question": "Jaki poziom ryzyka inwestycyjnego preferujesz?"
            },
            {
                "id": "risk_medium",
                "text": "Średnie ryzyko, zrównoważony portfel",
                "value": "medium_risk",
                "question": "Jaki poziom ryzyka inwestycyjnego preferujesz?"
            },
            {
                "id": "risk_high",
                "text": "Wysokie ryzyko, potencjalnie wysokie zyski",
                "value": "high_risk",
                "question": "Jaki poziom ryzyka inwestycyjnego preferujesz?"
            }
        ]
    elif advisor_id == "savings_strategist":
        return [
            {
                "id": "goal_emergency",
                "text": "Fundusz awaryjny",
                "value": "emergency_fund",
                "question": "Jaki jest Twój główny cel oszczędnościowy?"
            },
            {
                "id": "goal_home",
                "text": "Zakup nieruchomości",
                "value": "home_purchase",
                "question": "Jaki jest Twój główny cel oszczędnościowy?"
            },
            {
                "id": "goal_vacation",
                "text": "Wakacje lub podróże",
                "value": "vacation",
                "question": "Jaki jest Twój główny cel oszczędnościowy?"
            }
        ]
    elif advisor_id == "execution_expert":
        return [
            {
                "id": "debt_credit_card",
                "text": "Karty kredytowe i chwilówki",
                "value": "credit_card",
                "question": "Jaki rodzaj zadłużenia chcesz spłacić?"
            },
            {
                "id": "debt_consumer",
                "text": "Kredyty konsumpcyjne",
                "value": "consumer_loan",
                "question": "Jaki rodzaj zadłużenia chcesz spłacić?"
            },
            {
                "id": "debt_mortgage",
                "text": "Kredyt hipoteczny",
                "value": "mortgage",
                "question": "Jaki rodzaj zadłużenia chcesz spłacić?"
            }
        ]
    else:
        # Domyślne opcje
        return [
            {
                "id": "option_conservative",
                "text": "Podejście konserwatywne",
                "value": "conservative",
                "question": "Jakie podejście do zarządzania finansami preferujesz?"
            },
            {
                "id": "option_balanced",
                "text": "Podejście zrównoważone",
                "value": "balanced",
                "question": "Jakie podejście do zarządzania finansami preferujesz?"
            },
            {
                "id": "option_aggressive",
                "text": "Podejście agresywne",
                "value": "aggressive",
                "question": "Jakie podejście do zarządzania finansami preferujesz?"
            }
        ]

# Helper functions
def _map_goal_to_advisor_type(goal_type: str) -> str:
    """Mapuje typ celu na typ doradcy."""
    mapping = {
        "emergency_fund": "financial",
        "debt_reduction": "financial", 
        "home_purchase": "financial",
        "retirement": "investment",
        "education": "financial",
        "vacation": "financial",
        "investment": "investment",
        "tax_optimization": "tax",
        "legal_planning": "legal"
    }
    return mapping.get(goal_type, "financial")

def _map_advisor_id_to_type(advisor_id: str) -> str:
    """Mapuje ID doradcy na typ doradcy."""
    if not advisor_id:
        return "financial"
    
    if "investment" in advisor_id.lower():
        return "investment"
    elif "tax" in advisor_id.lower():
        return "tax"
    elif "legal" in advisor_id.lower():
        return "legal"
    else:
        return "financial"

def _generate_step_options(advisor_type: str, step: int, decision_path: List[str], context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generuje opcje dla następnego kroku w drzewie decyzyjnym."""
    
    # Opcje bazowe dla różnych typów doradców
    financial_options = {
        0: [
            {
                "id": "current_situation",
                "text": "Ocena obecnej sytuacji finansowej",
                "value": "assess_current",
                "question": "Jak oceniasz swoją obecną sytuację finansową?"
            },
            {
                "id": "set_goals",
                "text": "Ustalenie celów finansowych",
                "value": "set_goals",
                "question": "Jakie są Twoje główne cele finansowe?"
            }
        ],
        1: [
            {
                "id": "budget_planning",
                "text": "Planowanie budżetu",
                "value": "budget",
                "question": "Czy masz ustalony miesięczny budżet?"
            },
            {
                "id": "emergency_fund",
                "text": "Fundusz awaryjny",
                "value": "emergency",
                "question": "Czy posiadasz fundusz awaryjny?"
            }
        ]
    }
    
    investment_options = {
        0: [
            {
                "id": "risk_tolerance",
                "text": "Tolerancja ryzyka",
                "value": "risk_assessment",
                "question": "Jaka jest Twoja tolerancja na ryzyko inwestycyjne?"
            },
            {
                "id": "investment_horizon",
                "text": "Horyzont inwestycyjny",
                "value": "time_horizon",
                "question": "Na jak długo planujesz inwestować?"
            }
        ],
        1: [
            {
                "id": "portfolio_diversification",
                "text": "Dywersyfikacja portfela",
                "value": "diversification",
                "question": "Czy Twój portfel jest odpowiednio zdywersyfikowany?"
            },
            {
                "id": "investment_amount",
                "text": "Kwota inwestycji",
                "value": "amount",
                "question": "Jaką kwotę planujesz zainwestować?"
            }
        ]
    }
    
    tax_options = {
        0: [
            {
                "id": "tax_situation",
                "text": "Sytuacja podatkowa",
                "value": "tax_assessment",
                "question": "Jaka jest Twoja obecna sytuacja podatkowa?"
            },
            {
                "id": "deductions",
                "text": "Ulgi podatkowe",
                "value": "tax_deductions",
                "question": "Czy korzystasz ze wszystkich dostępnych ulg podatkowych?"
            }
        ],
        1: [
            {
                "id": "tax_optimization",
                "text": "Optymalizacja podatkowa",
                "value": "optimization",
                "question": "Czy szukasz sposobów na optymalizację podatków?"
            }
        ]
    }
    
    legal_options = {
        0: [
            {
                "id": "legal_structure",
                "text": "Struktura prawna",
                "value": "legal_assessment",
                "question": "Jaka jest Twoja obecna struktura prawna?"
            },
            {
                "id": "estate_planning",
                "text": "Planowanie spadkowe",
                "value": "estate",
                "question": "Czy masz ustalone planowanie spadkowe?"
            }
        ]
    }
    
    # Wybierz odpowiednie opcje na podstawie typu doradcy
    if advisor_type == "investment":
        options_map = investment_options
    elif advisor_type == "tax":
        options_map = tax_options
    elif advisor_type == "legal":
        options_map = legal_options
    else:
        options_map = financial_options
    
    # Pobierz opcje dla danego kroku
    options = options_map.get(step, [])
    
    # Jeśli nie ma opcji dla danego kroku, zwróć opcje finalizujące
    if not options:
        return [
            {
                "id": "finalize",
                "text": "Zakończ i wygeneruj rekomendacje",
                "value": "complete",
                "question": "Czy chcesz wygenerować rekomendacje na podstawie podanych informacji?"
            }
        ]
    
    # Dodaj kontekst do każdej opcji
    for option in options:
        option["step"] = step
        option["advisor_type"] = advisor_type
        option["context"] = context
    
    return options

def _generate_recommendations_for_path(advisor_type: str, decision_path: List[str]) -> List[Dict[str, Any]]:
    """Generuje rekomendacje na podstawie ścieżki decyzyjnej."""
    recommendations = []
    
    # Podstawowe rekomendacje na podstawie typu doradcy
    if advisor_type == "financial":
        recommendations.extend([
            {
                "id": "budget_planning",
                "title": "Planowanie budżetu",
                "description": "Stwórz szczegółowy budżet miesięczny i monitoruj wydatki",
                "impact": "high",
                "action_items": ["Przeanalizuj wydatki z ostatnich 3 miesięcy", "Ustaw limity dla każdej kategorii wydatków"]
            },
            {
                "id": "emergency_fund",
                "title": "Fundusz awaryjny",
                "description": "Zbuduj fundusz awaryjny pokrywający 3-6 miesięcy wydatków",
                "impact": "high",
                "action_items": ["Określ miesięczne wydatki", "Ustaw automatyczne przelewy na konto oszczędnościowe"]
            }
        ])
    elif advisor_type == "investment":
        recommendations.extend([
            {
                "id": "portfolio_diversification",
                "title": "Dywersyfikacja portfela",
                "description": "Zdywersyfikuj swój portfel inwestycyjny",
                "impact": "high",
                "action_items": ["Przeanalizuj obecną alokację aktywów", "Rozważ inwestycje w różne klasy aktywów"]
            },
            {
                "id": "risk_assessment",
                "title": "Ocena ryzyka",
                "description": "Dostosuj profil ryzyka do swoich celów",
                "impact": "medium",
                "action_items": ["Określ tolerancję na ryzyko", "Dostosuj portfel do horyzontu inwestycyjnego"]
            }
        ])
    elif advisor_type == "tax":
        recommendations.extend([
            {
                "id": "tax_optimization",
                "title": "Optymalizacja podatkowa",
                "description": "Wykorzystaj dostępne ulgi podatkowe",
                "impact": "medium",
                "action_items": ["Przeanalizuj dostępne ulgi", "Rozważ IKE/IKZE"]
            }
        ])
    
    return recommendations

def _generate_summary(advisor_type: str, decision_path: List[str]) -> str:
    """Generuje podsumowanie na podstawie ścieżki decyzyjnej."""
    if not decision_path:
        return "Brak wystarczających danych do wygenerowania podsumowania."
    
    summaries = {
        "financial": "Na podstawie Twoich odpowiedzi przygotowaliśmy spersonalizowane rekomendacje finansowe.",
        "investment": "Analiza Twojego profilu inwestycyjnego wskazuje na konkretne możliwości optymalizacji portfela.",
        "tax": "Zidentyfikowaliśmy możliwości optymalizacji podatkowej dostosowane do Twojej sytuacji.",
        "legal": "Przeanalizowaliśmy Twoją sytuację prawną i przygotowaliśmy odpowiednie rekomendacje."
    }
    
    base_summary = summaries.get(advisor_type, "Przygotowaliśmy rekomendacje dostosowane do Twojej sytuacji.")
    
    # Dodaj informacje o liczbie kroków
    steps_info = f" Proces składał się z {len(decision_path)} kroków decyzyjnych."
    
    return base_summary + steps_info

def _generate_analysis(advisor_type: str, decision_path: List[str]) -> str:
    """Generuje analizę na podstawie ścieżki decyzyjnej."""
    if not decision_path:
        return "Brak wystarczających danych do przeprowadzenia analizy."
    
    analyses = {
        "financial": "Twoja sytuacja finansowa wymaga systematycznego podejścia do budżetowania i oszczędzania.",
        "investment": "Twój profil inwestycyjny wskazuje na potrzebę dywersyfikacji i długoterminowego planowania.",
        "tax": "Analiza podatkowa pokazuje możliwości optymalizacji poprzez wykorzystanie dostępnych ulg.",
        "legal": "Sytuacja prawna wymaga uporządkowania dokumentacji i planowania struktury prawnej."
    }
    
    return analyses.get(advisor_type, "Analiza wskazuje na potrzebę systematycznego podejścia do zarządzania finansami.")

def _calculate_confidence_score(decision_path: List[str], user_profile: Dict[str, Any]) -> float:
    """Oblicza wskaźnik pewności rekomendacji."""
    base_score = 0.7
    
    # Zwiększ pewność na podstawie liczby kroków
    if len(decision_path) >= 3:
        base_score += 0.2
    elif len(decision_path) >= 2:
        base_score += 0.1
    
    # Zwiększ pewność jeśli mamy profil użytkownika
    if user_profile:
        base_score += 0.1
    
    return min(1.0, base_score)

def _estimate_implementation_time(recommendations: List[Dict[str, Any]], user_profile: Dict[str, Any]) -> str:
    """Szacuje czas implementacji rekomendacji."""
    if not recommendations:
        return "Nie określono"
    
    if len(recommendations) <= 2:
        return "1-2 tygodnie"
    elif len(recommendations) <= 4:
        return "1-2 miesiące"
    else:
        return "2-6 miesięcy"

def _assess_recommendation_risk(recommendations: List[Dict[str, Any]], user_profile: Dict[str, Any]) -> str:
    """Ocenia poziom ryzyka rekomendacji."""
    if not recommendations:
        return "Niskie"
    
    # Sprawdź czy są rekomendacje wysokiego ryzyka
    high_risk_count = sum(1 for rec in recommendations if rec.get("impact") == "high")
    
    if high_risk_count >= 3:
        return "Wysokie"
    elif high_risk_count >= 1:
        return "Średnie"
    else:
        return "Niskie"

def _log_decision_tree_step(request: DecisionTreeRequest) -> None:
    """Loguje krok drzewa decyzyjnego do bazy danych."""
    try:
        # W rzeczywistej implementacji zapisywałoby to do bazy danych
        logger.info(f"Logged decision tree step for user {request.user_id}: {request.current_node_id} -> {request.answer}")
    except Exception as e:
        logger.error(f"Error logging decision tree step: {e}")

def _log_decision_tree_step_simple(user_id: int, current_node_id: str, step: int, decision_path: List[str]) -> None:
    """Loguje uproszczony krok drzewa decyzyjnego."""
    try:
        logger.info(f"Logged simple decision tree step for user {user_id}: step {step}, path length {len(decision_path)}")
    except Exception as e:
        logger.error(f"Error logging simple decision tree step: {e}")

def _save_report_to_database(user_id: int, report: Dict[str, Any]) -> None:
    """Zapisuje raport do bazy danych."""
    try:
        # W rzeczywistej implementacji zapisywałoby to do bazy danych
        logger.info(f"Saved report to database for user {user_id}")
    except Exception as e:
        logger.error(f"Error saving report to database: {e}")