# ai/user_profile_form.py
from typing import Dict, Any, List, Optional
import logging
import json

logger = logging.getLogger(__name__)

class UserProfileForm:
    """Form to collect and store user financial and behavioral profile information."""
    
    def __init__(self):
        # Podstawowe dane finansowe
        self.financial_fields = {
            "age": {"value": None, "question": "Ile masz lat?", "required": True, "type": "number"},
            "country": {"value": None, "question": "W jakim kraju mieszkasz?", "required": True},
            "region": {"value": None, "question": "W jakim województwie/kantonie/stanie mieszkasz?", "required": False},
            "income": {"value": None, "question": "Jakie są Twoje miesięczne dochody (w PLN)?", "required": True, "type": "number"},
            "expenses": {"value": None, "question": "Jakie są Twoje miesięczne obowiązkowe wydatki (w PLN)?", "required": True, "type": "number"},
            "savings": {"value": None, "question": "Ile wynoszą Twoje oszczędności (w PLN)?", "required": True, "type": "number"},
            "debt": {"value": None, "question": "Jakie masz zadłużenia (w PLN)?", "required": False, "type": "number"},
            "investments": {"value": None, "question": "W jakie firmy/aktywa obecnie inwestujesz?", "required": False},
            "investment_horizon": {"value": None, "question": "Na jaki okres planujesz inwestycje (w latach)?", "required": False, "type": "number"}
        }
        
        # Profilowanie behawioralne
        self.behavioral_fields = {
            "risk_tolerance": {
                "value": None, 
                "question": "Jak reagujesz na straty finansowe?\n(a) Unikam ich za wszelką cenę\n(b) Akceptuję małe straty\n(c) Akceptuję większe ryzyko dla potencjalnie większych zysków", 
                "required": True,
                "options": ["a", "b", "c"],
                "mapping": {"a": "conservative", "b": "moderate", "c": "aggressive"}
            },
            "decision_style": {
                "value": None, 
                "question": "Jak podejmujesz ważne decyzje finansowe?\n(a) Analizuję wszystkie dane\n(b) Kieruję się intuicją\n(c) Konsultuję się z innymi\n(d) Szybko podejmuję decyzje", 
                "required": True,
                "options": ["a", "b", "c", "d"],
                "mapping": {"a": "analytical", "b": "intuitive", "c": "consultative", "d": "directive"}
            },
            "financial_discipline": {
                "value": None, 
                "question": "Jak oceniasz swoją dyscyplinę w zarządzaniu budżetem?\n(a) Ściśle trzymam się planu\n(b) Zazwyczaj trzymam się planu z pewnymi wyjątkami\n(c) Często wydaję impulsywnie", 
                "required": True,
                "options": ["a", "b", "c"],
                "mapping": {"a": "strict", "b": "flexible", "c": "impulsive"}
            },
            "time_preference": {
                "value": None, 
                "question": "Na jaki okres zwykle planujesz swoje finanse?\n(a) Krótkoterminowo (do roku)\n(b) Średnioterminowo (1-5 lat)\n(c) Długoterminowo (powyżej 5 lat)", 
                "required": True,
                "options": ["a", "b", "c"],
                "mapping": {"a": "short_term", "b": "medium_term", "c": "long_term"}
            },
            "financial_goal": {
                "value": None, 
                "question": "Jaki jest Twój główny cel finansowy?", 
                "required": True
            }
        }
        
        # Kolejność pytań - najpierw dane finansowe, potem behawioralne
        self.all_fields = {**self.financial_fields, **self.behavioral_fields}
        self.field_order = list(self.financial_fields.keys()) + list(self.behavioral_fields.keys())
        
        self.current_field_index = 0
        self.is_complete = False
    
    def get_next_question(self) -> str:
        """Get the next question to ask the user."""
        if self.is_complete:
            return "Formularz został wypełniony. Teraz możemy przejść do spersonalizowanego doradztwa."
        
        if self.current_field_index >= len(self.field_order):
            self.is_complete = True
            return self.generate_summary()
        
        field_name = self.field_order[self.current_field_index]
        field_data = self.all_fields[field_name]
        
        # Jeśli pole nie jest wymagane i już zapytaliśmy o wszystkie wymagane pola, możemy je pominąć
        if not field_data["required"] and self.all_required_fields_filled():
            self.current_field_index += 1
            if self.current_field_index >= len(self.field_order):
                self.is_complete = True
                return self.generate_summary()
            return self.get_next_question()
        
        return field_data["question"]
    
    def all_required_fields_filled(self) -> bool:
        """Check if all required fields are filled."""
        for field_name, field_data in self.all_fields.items():
            if field_data["required"] and field_data["value"] is None:
                return False
        return True
    
    def process_answer(self, answer: str) -> str:
        """Process user's answer to the current question."""
        if self.is_complete:
            return "Formularz jest już wypełniony. W czym mogę Ci pomóc?"
        
        if self.current_field_index >= len(self.field_order):
            self.is_complete = True
            return self.generate_summary()
        
        current_field = self.field_order[self.current_field_index]
        field_data = self.all_fields[current_field]
        
        # Walidacja odpowiedzi
        is_valid = True
        validation_message = ""
        
        # Sprawdź, czy to pole z opcjami
        if "options" in field_data:
            if answer.lower() not in field_data["options"]:
                is_valid = False
                validation_message = f"Proszę wybrać jedną z dostępnych opcji: {', '.join(field_data['options'])}."
        
        # Sprawdź, czy to pole liczbowe
        elif field_data.get("type") == "number":
            try:
                # Usuń znaki waluty i spacje, zamień przecinki na kropki
                clean_answer = answer.replace("zł", "").replace("PLN", "").replace(" ", "").replace(",", ".")
                float_value = float(clean_answer)
                # Aktualizuj odpowiedź na liczbę
                answer = float_value
            except ValueError:
                is_valid = False
                validation_message = "Proszę podać wartość liczbową."
        
        # Jeśli odpowiedź jest nieprawidłowa, ponów pytanie
        if not is_valid:
            return validation_message + "\n" + field_data["question"]
        
        # Zapisz odpowiedź
        if "mapping" in field_data and answer.lower() in field_data["mapping"]:
            # Mapuj odpowiedź na wartość z mapping (np. a -> conservative)
            self.all_fields[current_field]["value"] = field_data["mapping"][answer.lower()]
        else:
            self.all_fields[current_field]["value"] = answer
        
        # Przejdź do następnego pytania
        self.current_field_index += 1
        
        # Zwróć następne pytanie
        return self.get_next_question()
    
    def generate_summary(self) -> str:
        """Generate a summary of the collected information and transition to chat."""
        summary = "Dziękuję za podanie informacji. Oto podsumowanie Twojego profilu finansowego:\n\n"
        
        # Finansowe informacje
        summary += "Dane finansowe:\n"
        for field_name, field_data in self.financial_fields.items():
            if field_data["value"] is not None:
                field_label = field_name.replace("_", " ").capitalize()
                if field_name in ["income", "expenses", "savings", "debt"]:
                    summary += f"- {field_label}: {field_data['value']} PLN\n"
                else:
                    summary += f"- {field_label}: {field_data['value']}\n"
        
        # Profil behawioralny
        summary += "\nProfil behawioralny:\n"
        for field_name, field_data in self.behavioral_fields.items():
            if field_data["value"] is not None:
                field_label = field_name.replace("_", " ").capitalize()
                summary += f"- {field_label}: {field_data['value']}\n"
        
        # Informacja o doradcy
        recommended_advisor = self._recommend_advisor()
        summary += f"\nNa podstawie Twojego profilu, przypisujemy Ci doradcę: {self._get_advisor_name(recommended_advisor)}\n"
        
        # Przejście do chatu
        summary += "\nTeraz możemy rozpocząć interaktywną rozmowę, aby lepiej zrozumieć Twoje potrzeby. Co chciałbyś osiągnąć w swoich finansach? (Możesz opisać swoje cele, obawy lub zadać konkretne pytania)."
        return summary
    
    def _recommend_advisor(self) -> str:
        """Rekomenduje odpowiedniego doradcę na podstawie profilu."""
        if not self.all_required_fields_filled():
            return "financial"  # Domyślny doradca
        
        # Pobierz elementy profilu behawioralnego
        risk_tolerance = self.behavioral_fields["risk_tolerance"]["value"]
        decision_style = self.behavioral_fields["decision_style"]["value"]
        financial_discipline = self.behavioral_fields["financial_discipline"]["value"]
        time_preference = self.behavioral_fields["time_preference"]["value"]
        financial_goal = str(self.behavioral_fields["financial_goal"]["value"]).lower()
        
        # Prosta logika rekomendacji
        # Jeśli cel zawiera konkretne słowa kluczowe, przypisz odpowiedniego doradcę
        if any(word in financial_goal for word in ["podatek", "podatki", "pit", "vat", "cit"]):
            return "tax"
        elif any(word in financial_goal for word in ["prawo", "umowa", "przepisy", "regulacje"]):
            return "legal"
        elif any(word in financial_goal for word in ["inwestycja", "inwestowanie", "giełda", "akcje", "obligacje"]):
            return "investment"
        
        # W przeciwnym razie, użyj profilu behawioralnego
        if risk_tolerance == "aggressive" and time_preference == "long_term":
            return "investment"
        elif risk_tolerance == "conservative" and financial_discipline == "strict":
            return "financial"
        
        # Domyślny przypadek
        return "financial"
    
    def _get_advisor_name(self, advisor_type: str) -> str:
        """Zwraca przyjazną nazwę doradcy."""
        advisor_names = {
            "financial": "Doradca Finansowy",
            "investment": "Doradca Inwestycyjny",
            "tax": "Doradca Podatkowy",
            "legal": "Doradca Prawny"
        }
        return advisor_names.get(advisor_type, "Doradca Finansowy")
    
    def get_profile_data(self) -> Dict[str, Any]:
        """Get the collected profile data as a dictionary."""
        profile = {
            "financial_data": {field: self.financial_fields[field]["value"] 
                             for field in self.financial_fields 
                             if self.financial_fields[field]["value"] is not None},
            "behavioral_profile": {field: self.behavioral_fields[field]["value"] 
                                 for field in self.behavioral_fields 
                                 if self.behavioral_fields[field]["value"] is not None}
        }
        
        # Dodaj rekomendowanego doradcę
        profile["recommended_advisor"] = self._recommend_advisor()
        
        return profile
    
    def is_form_complete(self) -> bool:
        """Check if all required fields are filled."""
        return self.is_complete
        
    def transition_to_chat(self) -> Dict[str, Any]:
        """Prepare data for transition to interactive chat."""
        if not self.is_complete:
            return {"status": "error", "message": "Formularz nie został jeszcze wypełniony."}
        
        profile_data = self.get_profile_data()
        name = profile_data.get("financial_data", {}).get("name", "")
        
        return {
            "status": "success",
            "profile": profile_data,
            "recommended_advisor": profile_data["recommended_advisor"],
            "initial_message": f"Cześć{' ' + name if name else ''}! Na podstawie Twojego profilu, jestem gotów pomóc Ci w osiągnięciu Twoich celów finansowych. W czym konkretnie mogę Ci pomóc?"
        }