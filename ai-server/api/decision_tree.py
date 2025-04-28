# api/decision_tree_api.py
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
from ai.ai_chat_selector import AIChatSelector
from core.database import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)

# Inicjalizacja modelu drzewa decyzyjnego
decision_tree = FinancialDecisionTree()

@router.post("/decision-tree", response_model=Dict[str, Any])
async def process_decision_tree(request_data: Dict[str, Any] = Body(...)):
    """
    Przetwarza krok w drzewie decyzyjnym specjalisty i zwraca następny krok lub rekomendacje.
    
    Args:
        request_data: Dane zapytania z frontendu
        
    Returns:
        Dane dla następnego kroku drzewa decyzyjnego lub rekomendacje
    """
    try:
        logger.info(f"Przetwarzanie kroku drzewa decyzyjnego: {request_data}")
        
        # Pobierz dane z zapytania
        user_id = request_data.get("user_id", 1)
        current_node_id = request_data.get("current_node_id")
        answer = request_data.get("answer")
        context = request_data.get("context", {})
        
        # Określ typ doradcy, jeśli nie został podany
        if "advisor_type" not in context:
            advisor_type = "financial"  # domyślny typ
            if current_node_id and "_" in current_node_id:
                advisor_type = current_node_id.split("_")[0]
            context["advisor_type"] = advisor_type
        
        # Utwórz obiekt żądania dla modelu drzewa decyzyjnego
        tree_request = DecisionTreeRequest(
            user_id=user_id,
            current_node_id=current_node_id,
            answer=answer,
            context=context
        )
        
        # Przetwórz krok drzewa decyzyjnego
        response = decision_tree.process_step(tree_request)
        
        # Zapisz krok w dzienniku (opcjonalne)
        try:
            _log_decision_tree_step(tree_request)
        except Exception as e:
            logger.error(f"Błąd logowania kroku drzewa decyzyjnego: {e}")
            # Kontynuuj, nawet jeśli logowanie nie powiedzie się
        
        # Zwróć odpowiedź w formacie wymaganym przez frontend
        return response.dict()
    
    except Exception as e:
        logger.error(f"Błąd przetwarzania kroku drzewa decyzyjnego: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Błąd przetwarzania kroku drzewa decyzyjnego: {str(e)}"
        )

@router.post("/decision-tree/report", response_model=Dict[str, Any])
async def generate_report(request_data: Dict[str, Any] = Body(...)):
    """
    Generuje raport na podstawie ścieżki decyzyjnej użytkownika.
    
    Args:
        request_data: Dane ścieżki decyzyjnej
        
    Returns:
        Wygenerowany raport
    """
    try:
        logger.info(f"Generowanie raportu dla ścieżki decyzyjnej: {request_data}")
        
        user_id = request_data.get("user_id", 1)
        advisor_type = request_data.get("advisor_type", "financial")
        decision_path = request_data.get("decision_path", [])
        
        # Utwórz kontekst na podstawie ścieżki decyzyjnej
        context = {
            "advisor_type": advisor_type,
            "journey": decision_path,
            "analysis_complete": True
        }
        
        # Generuj rekomendacje na podstawie ścieżki decyzyjnej
        recommendations = _generate_recommendations_for_path(advisor_type, decision_path)
        
        # Utwórz raport
        report = {
            "summary": _generate_summary(advisor_type, decision_path),
            "analysis": _generate_analysis(advisor_type, decision_path),
            "recommendations": [rec.get("description", "") for rec in recommendations],
            "detail_recommendations": recommendations,
            "advisor_type": advisor_type,
            "generated_at": datetime.now().isoformat()
        }
        
        # Opcjonalnie zapisz raport w bazie danych
        try:
            _save_report_to_database(user_id, report)
        except Exception as e:
            logger.error(f"Błąd zapisywania raportu do bazy danych: {e}")
            # Kontynuuj, nawet jeśli zapisywanie nie powiedzie się
        
        return report
    
    except Exception as e:
        logger.error(f"Błąd generowania raportu: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Błąd generowania raportu: {str(e)}"
        )

@router.get("/decision-tree/recommendations/{user_id}", response_model=Dict[str, Any])
async def get_user_recommendations(user_id: int):
    """
    Pobiera zapisane rekomendacje dla użytkownika.
    
    Args:
        user_id: ID użytkownika
        
    Returns:
        Lista rekomendacji
    """
    try:
        logger.info(f"Pobieranie rekomendacji dla użytkownika {user_id}")
        
        # Pobierz rekomendacje z drzewa decyzyjnego
        recommendations = decision_tree.get_user_recommendations(user_id)
        
        if not recommendations:
            return {"recommendations": [], "message": "Nie znaleziono rekomendacji dla tego użytkownika."}
        
        # Przetwórz rekomendacje na format wymagany przez frontend
        formatted_recommendations = [
            {
                "id": rec.id,
                "title": rec.title,
                "description": rec.description,
                "advisor_type": rec.advisor_type,
                "impact": rec.impact,
                "action_items": rec.action_items
            }
            for rec in recommendations
        ]
        
        return {"recommendations": formatted_recommendations, "count": len(formatted_recommendations)}
    
    except Exception as e:
        logger.error(f"Błąd pobierania rekomendacji: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Błąd pobierania rekomendacji: {str(e)}"
        )

def _log_decision_tree_step(request: DecisionTreeRequest):
    """
    Zapisuje krok drzewa decyzyjnego do bazy danych.
    
    Args:
        request: Żądanie drzewa decyzyjnego
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Konwertuj kontekst na JSON
        context_json = json.dumps(request.context) if request.context else None
        
        # Zapisz krok do bazy danych
        cursor.execute(
            """
            INSERT INTO decision_tree_logs 
            (user_id, node_id, answer, context, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            """,
            (
                request.user_id,
                request.current_node_id,
                request.answer,
                context_json
            )
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Zapisano krok drzewa decyzyjnego dla użytkownika {request.user_id}")
    except Exception as e:
        logger.error(f"Błąd zapisywania kroku drzewa decyzyjnego: {e}")
        # Rzuć wyjątek, aby został obsłużony przez wywołującą funkcję
        raise

def _save_report_to_database(user_id: int, report: Dict[str, Any]):
    """
    Zapisuje raport do bazy danych.
    
    Args:
        user_id: ID użytkownika
        report: Raport do zapisania
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Konwertuj raport na JSON
        report_json = json.dumps(report)
        
        # Zapisz raport do bazy danych
        cursor.execute(
            """
            INSERT INTO user_reports 
            (user_id, report_data, advisor_type, created_at)
            VALUES (%s, %s, %s, NOW())
            """,
            (
                user_id,
                report_json,
                report.get("advisor_type", "financial")
            )
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Zapisano raport dla użytkownika {user_id}")
    except Exception as e:
        logger.error(f"Błąd zapisywania raportu: {e}")
        # Rzuć wyjątek, aby został obsłużony przez wywołującą funkcję
        raise

def _generate_recommendations_for_path(advisor_type: str, decision_path: List[str]) -> List[Dict[str, str]]:
    """
    Generuje rekomendacje na podstawie ścieżki decyzyjnej.
    
    Args:
        advisor_type: Typ doradcy
        decision_path: Ścieżka decyzyjna
        
    Returns:
        Lista rekomendacji
    """
    # Ta funkcja powinna być zastąpiona rzeczywistą implementacją bazującą na modelu
    if advisor_type == "financial":
        return [
            {
                "title": "Automatyzacja oszczędzania",
                "description": "Ustaw automatyczne przelewy na konto oszczędnościowe dzień po otrzymaniu wynagrodzenia",
                "impact": "high",
                "action_items": ["Skonfiguruj zlecenie stałe w bankowości internetowej", "Zacznij od 10% dochodu"]
            },
            {
                "title": "Budżet awaryjny",
                "description": "Utwórz fundusz awaryjny pokrywający 3-6 miesięcy wydatków",
                "impact": "high",
                "action_items": ["Określ swoje miesięczne niezbędne wydatki", "Zacznij odkładać nawet małe kwoty"]
            },
            {
                "title": "Kategoryzacja wydatków",
                "description": "Podziel swoje wydatki na kategorie i ustal limity dla każdej z nich",
                "impact": "medium",
                "action_items": ["Przeanalizuj historię transakcji z ostatnich 3 miesięcy", "Zidentyfikuj obszary do optymalizacji"]
            }
        ]
    elif advisor_type == "investment":
        return [
            {
                "title": "Dywersyfikacja portfela",
                "description": "Rozłóż inwestycje między różne klasy aktywów, aby zminimalizować ryzyko",
                "impact": "high",
                "action_items": ["Określ swoją tolerancję na ryzyko", "Zbuduj portfel z różnych klas aktywów"]
            },
            {
                "title": "Strategia uśredniania ceny",
                "description": "Regularnie inwestuj stałą kwotę, niezależnie od aktualnych cen na rynku",
                "impact": "medium",
                "action_items": ["Ustal kwotę miesięcznej inwestycji", "Wybierz platformę inwestycyjną z niskimi prowizjami"]
            },
            {
                "title": "Inwestycje długoterminowe",
                "description": "Skup się na długoterminowym wzroście, ignorując krótkoterminowe wahania rynku",
                "impact": "high",
                "action_items": ["Ustal swój horyzont inwestycyjny", "Rozważ pasywne fundusze indeksowe"]
            }
        ]
    elif advisor_type == "tax":
        return [
            {
                "title": "Pełne wykorzystanie ulg podatkowych",
                "description": "Sprawdź czy wykorzystujesz wszystkie przysługujące Ci ulgi podatkowe",
                "impact": "high",
                "action_items": ["Sporządź listę możliwych odliczeń", "Skonsultuj się z doradcą podatkowym"]
            },
            {
                "title": "Optymalizacja struktury dochodów",
                "description": "Dostosuj strukturę swoich dochodów dla optymalnych rozliczeń podatkowych",
                "impact": "medium",
                "action_items": ["Przeanalizuj swoje źródła dochodu", "Rozważ różne formy zatrudnienia/działalności"]
            },
            {
                "title": "Planowanie podatkowe",
                "description": "Zaplanuj z wyprzedzeniem swoje działania finansowe z uwzględnieniem aspektów podatkowych",
                "impact": "medium",
                "action_items": ["Twórz roczny plan finansowy", "Planuj większe transakcje z uwzględnieniem podatków"]
            }
        ]
    elif advisor_type == "legal":
        return [
            {
                "title": "Przegląd umów i dokumentów",
                "description": "Regularnie przeglądaj swoje dokumenty prawne i umowy pod kątem aktualności",
                "impact": "medium",
                "action_items": ["Zorganizuj swoje dokumenty prawne", "Zaplanuj coroczny przegląd"]
            },
            {
                "title": "Zabezpieczenie prawne majątku",
                "description": "Wdrożenie odpowiednich zabezpieczeń prawnych dla posiadanego majątku",
                "impact": "high",
                "action_items": ["Sporządź testament", "Rozważ ustanowienie pełnomocnictwa"]
            },
            {
                "title": "Dokumentacja ważnych decyzji",
                "description": "Dokumentuj ważne decyzje finansowe i prawne w formie pisemnej",
                "impact": "medium",
                "action_items": ["Stwórz system przechowywania dokumentacji", "Ustal standardy dokumentacji"]
            }
        ]
    else:
        # Domyślne rekomendacje
        return [
            {
                "title": "Konsultacja z doradcą",
                "description": "Rozważ konsultację z profesjonalnym doradcą finansowym",
                "impact": "medium",
                "action_items": ["Przygotuj listę pytań", "Zbierz wszystkie dokumenty finansowe"]
            },
            {
                "title": "Edukacja finansowa",
                "description": "Inwestuj w swoją wiedzę finansową poprzez kursy i literaturę",
                "impact": "medium",
                "action_items": ["Wybierz jeden obszar do zgłębienia", "Zaplanuj regularne sesje nauki"]
            }
        ]

def _generate_summary(advisor_type: str, decision_path: List[str]) -> str:
    """
    Generuje podsumowanie na podstawie ścieżki decyzyjnej.
    
    Args:
        advisor_type: Typ doradcy
        decision_path: Ścieżka decyzyjna
        
    Returns:
        Podsumowanie
    """
    # Ta funkcja powinna być zastąpiona rzeczywistą implementacją bazującą na modelu
    if advisor_type == "financial":
        return "Na podstawie Twoich odpowiedzi, zidentyfikowaliśmy kluczowe obszary do optymalizacji w zarządzaniu budżetem. Twój profil wskazuje na potrzebę strukturyzacji finansów osobistych z naciskiem na automatyzację oszczędzania i budowę funduszu awaryjnego."
    elif advisor_type == "investment":
        return "Twój profil inwestycyjny wskazuje na umiarkowaną tolerancję ryzyka z preferencją dla długoterminowego wzrostu. Rekomendujemy strategię zrównoważoną z naciskiem na dywersyfikację i regularne inwestowanie."
    elif advisor_type == "tax":
        return "Na podstawie Twoich odpowiedzi, zidentyfikowaliśmy możliwości optymalizacji podatkowej w ramach obowiązującego prawa. Twój profil wskazuje na potrzebę lepszego wykorzystania dostępnych ulg i planowania podatkowego."
    elif advisor_type == "legal":
        return "Twoje podejście do kwestii prawnych wskazuje na potrzebę lepszej strukturyzacji dokumentacji i zabezpieczeń prawnych. Rekomendujemy przegląd obecnych umów i wdrożenie systematycznego zarządzania dokumentacją."
    else:
        return "Na podstawie analizy Twoich odpowiedzi, przygotowaliśmy rekomendacje dostosowane do Twojej sytuacji. Proponujemy konsultację z doradcą specjalizującym się w tym obszarze dla uzyskania bardziej szczegółowych informacji."

def _generate_analysis(advisor_type: str, decision_path: List[str]) -> str:
    """
    Generuje szczegółową analizę na podstawie ścieżki decyzyjnej.
    
    Args:
        advisor_type: Typ doradcy
        decision_path: Ścieżka decyzyjna
        
    Returns:
        Analiza
    """
    # Ta funkcja powinna być zastąpiona rzeczywistą implementacją bazującą na modelu
    
    # Analizujemy ścieżkę decyzyjną, aby dostarczyć spersonalizowaną analizę
    path_summary = ", ".join(decision_path[:3]) if decision_path else "brak danych"
    
    if advisor_type == "financial":
        return f"Analiza Twoich wyborów ({path_summary}) wskazuje na potrzebę ustrukturyzowanego podejścia do zarządzania finansami osobistymi. Szczególnie istotne wydają się kwestie automatyzacji oszczędzania oraz budowy poduszki finansowej jako zabezpieczenia przed nieprzewidzianymi wydatkami. Regularny przegląd budżetu i kategoryzacja wydatków pozwolą na identyfikację obszarów do optymalizacji, co przełoży się na zwiększenie stopy oszczędności."
    elif advisor_type == "investment":
        return f"Analiza Twoich wyborów ({path_summary}) wskazuje na preferencję dla zrównoważonego podejścia do inwestycji, łączącego elementy wzrostu i bezpieczeństwa. Rekomendujemy portfel zawierający zarówno instrumenty o stałym dochodzie (obligacje), jak i instrumenty udziałowe (akcje), w proporcjach dostosowanych do Twojej tolerancji ryzyka. Strategia regularnego inwestowania (Dollar Cost Averaging) pozwoli zminimalizować wpływ krótkoterminowych wahań rynku."
    elif advisor_type == "tax":
        return f"Analiza Twoich wyborów ({path_summary}) wskazuje na potencjał do bardziej efektywnego zarządzania obciążeniami podatkowymi. Zidentyfikowaliśmy możliwości pełniejszego wykorzystania dostępnych ulg podatkowych oraz optymalizacji struktury dochodów. Zalecamy konsultację z doradcą podatkowym w celu opracowania indywidualnej strategii podatkowej, zgodnej z aktualnymi przepisami."
    elif advisor_type == "legal":
        return f"Analiza Twoich wyborów ({path_summary}) wskazuje na potrzebę bardziej systematycznego podejścia do kwestii prawnych. Rekomendujemy przeprowadzenie audytu istniejących umów i dokumentów, a następnie wdrożenie regularnych przeglądów. Szczególną uwagę należy zwrócić na zabezpieczenie prawne majątku, w tym ewentualne planowanie spadkowe."
    else:
        return f"Szczegółowa analiza Twoich wyborów ({path_summary}) pozwala na sformułowanie rekomendacji dostosowanych do Twojej indywidualnej sytuacji. Ze względu na złożoność tematu, zalecamy konsultację z profesjonalnym doradcą, który pomoże w implementacji zaproponowanych rozwiązań."