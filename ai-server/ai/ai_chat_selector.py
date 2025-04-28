# ai/ai_chat_selector.py
import time
import logging
import json
from typing import Dict, Any, List, Optional
from ai.tree_model import TreeModel
from ai.financial_advisor import FinancialLegalAdvisor
from ai.investment_advisor import InvestmentAdvisor
from ai.user_profile_form import UserProfileForm
from core.financial_models import AdvisoryRequest, AdvisoryResponse
import psycopg2
from core.database import get_db_connection

logger = logging.getLogger(__name__)

class AIChatSelector:
    """Class to select appropriate AI models for handling different types of queries."""
    
    def __init__(self, financial_advisor, investment_advisor, tree_model):
        """Initialize the AI chat selector with advisors."""
        self.financial_advisor = financial_advisor
        self.investment_advisor = investment_advisor
        self.tree_model = tree_model
        self.user_forms = {}  # Dictionary to store user forms by user_id
        
        logger.info("AIChatSelector initialized")
    
    def handle_message(self, message: str, user_id: Optional[int] = None, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Process user message and route to appropriate advisor based on profile.
        
        Args:
            message: User message text
            user_id: User ID for context tracking
            context: Additional context information
            
        Returns:
            Response message from the appropriate advisor
        """
        try:
            if context is None:
                context = {}
            
            # Initialize user form if it doesn't exist
            if user_id is not None and user_id not in self.user_forms:
                self.user_forms[user_id] = UserProfileForm()
                
                # Try to load existing profile from database
                db_profile = self._load_profile_from_database(user_id)
                if db_profile:
                    logger.info(f"Loaded existing profile for user {user_id}")
                    self.user_forms[user_id].is_complete = True
                    context.update(db_profile)
            
            # Handle form filling process
            if user_id is not None and not self.user_forms[user_id].is_form_complete():
                # Handle administrative commands
                if "pomiń formularz" in message.lower() or "pomin formularz" in message.lower():
                    self.user_forms[user_id].is_complete = True
                    return "Formularz pominięty. W czym mogę Ci pomóc?"
                
                # Process the answer and get the next question
                response = self.user_forms[user_id].process_answer(message)
                
                # If form is now complete, update context with profile data
                if self.user_forms[user_id].is_form_complete():
                    profile_data = self.user_forms[user_id].get_profile_data()
                    context.update(profile_data)
                    
                    # Save profile to database
                    self._save_profile_to_database(user_id, profile_data)
                
                return response
            
            # Handle form restart/start
            if "wypełnij formularz" in message.lower() or "wypelnij formularz" in message.lower() or "start formularz" in message.lower():
                if user_id is not None:
                    self.user_forms[user_id] = UserProfileForm()
                    return self.user_forms[user_id].get_next_question()
                else:
                    return "Nie mogę rozpocząć formularza bez identyfikatora użytkownika."
            
            # Check if the message indicates readiness for decision tree
            tree_transition = self.check_decision_tree_readiness(message, user_id, context)
            if tree_transition.get("ready_for_tree", False):
                return tree_transition.get("message", "Przejdźmy do bardziej strukturyzowanego podejścia z drzewem decyzyjnym. Jakiego rodzaju doradztwa potrzebujesz?")
            
            # Check for an assigned advisor in the context
            advisor_type = None
            if "recommended_advisor" in context:
                advisor_type = context["recommended_advisor"]
            elif "behavioral_profile" in context and "recommended_advisor" in context["behavioral_profile"]:
                advisor_type = context["behavioral_profile"]["recommended_advisor"]
            
            # If no assigned advisor, determine from the message
            if not advisor_type:
                advisor_type = self._determine_advisor_from_message(message)
                
                # Add determined advisor to context
                if "behavioral_profile" not in context:
                    context["behavioral_profile"] = {}
                context["behavioral_profile"]["recommended_advisor"] = advisor_type
            
            # Enhance context with behavioral profile information
            self._enhance_context_with_behavioral_profile(context)
            
            # Save determined advisor to database if user exists
            if user_id is not None:
                self._update_user_advisor(user_id, advisor_type)
            
            # Create advisory request
            request = AdvisoryRequest(
                user_id=user_id or 1,
                question=message,
                context=context,
                advisory_type=advisor_type,
                language="pl"
            )
            
            # Route to appropriate advisor
            if advisor_type == "investment":
                return self.investment_advisor.process_advisory_request(request).answer
            elif advisor_type == "tax":
                request.advisory_type = "tax"
                return self.financial_advisor.process_advisory_request(request).answer
            elif advisor_type == "legal":
                request.advisory_type = "legal"
                return self.financial_advisor.process_advisory_request(request).answer
            else:  # financial or undefined
                request.advisory_type = "financial"
                return self.financial_advisor.process_advisory_request(request).answer
        
        except Exception as e:
            logger.error(f"Error in handle_message: {str(e)}")
            return f"Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości. Spróbuj ponownie lub skontaktuj się z pomocą techniczną."
    
    def _determine_advisor_from_message(self, message: str) -> str:
        """
        Determine advisor type based on message content.
        
        Args:
            message: User message text
            
        Returns:
            Advisor type (tax, legal, investment, or financial)
        """
        message = message.lower()
        
        # Keywords for each advisor type
        tax_keywords = ["podatek", "podatki", "pit", "vat", "cit", "zeznanie", "zwrot", "urząd skarbowy", "odliczenie"]
        legal_keywords = ["prawo", "prawne", "umowa", "przepisy", "regulacje", "ustawa", "kodeks", "kontrakt"]
        investment_keywords = ["inwestycja", "inwestowanie", "giełda", "akcje", "obligacje", "fundusz", "portfel", "etf", "dywidenda"]
        financial_keywords = ["budżet", "oszczędności", "wydatki", "dochody", "kredyt", "pożyczka", "planowanie", "emerytura", "ubezpieczenie"]
        
        # Check for keywords
        if any(keyword in message for keyword in tax_keywords):
            return "tax"
        elif any(keyword in message for keyword in legal_keywords):
            return "legal"
        elif any(keyword in message for keyword in investment_keywords):
            return "investment"
        elif any(keyword in message for keyword in financial_keywords):
            return "financial"
        
        # Default to financial advisor
        return "financial"
    
    def _enhance_context_with_behavioral_profile(self, context: Dict[str, Any]) -> None:
        """
        Enhance context with behavioral profile information.
        
        Args:
            context: Context dictionary to enhance
        """
        if "behavioral_profile" not in context:
            return
        
        profile = context["behavioral_profile"]
        
        # Add communication style preferences
        if "decision_style" in profile:
            decision_style = profile["decision_style"]
            if decision_style == "analytical":
                context["communication_style"] = "Preferencja dla danych, liczb i szczegółowych analiz."
            elif decision_style == "intuitive":
                context["communication_style"] = "Preferencja dla szerszego obrazu, metafor i przykładów."
            elif decision_style == "consultative":
                context["communication_style"] = "Preferencja dla różnych perspektyw i opinii ekspertów."
            elif decision_style == "directive":
                context["communication_style"] = "Preferencja dla konkretnych, bezpośrednich wskazówek."
        
        # Add risk tolerance information
        if "risk_tolerance" in profile:
            risk_tolerance = profile["risk_tolerance"]
            if risk_tolerance == "conservative":
                context["investment_style"] = "Bezpieczeństwo i stabilność są priorytetem."
            elif risk_tolerance == "moderate":
                context["investment_style"] = "Zrównoważone podejście do ryzyka i zysku."
            elif risk_tolerance == "aggressive":
                context["investment_style"] = "Akceptacja wyższego ryzyka dla wyższych potencjalnych zysków."
        
        # Add time preference
        if "time_preference" in profile:
            time_preference = profile["time_preference"]
            if time_preference == "short_term":
                context["planning_horizon"] = "Krótkoterminowe planowanie (do 1 roku)."
            elif time_preference == "medium_term":
                context["planning_horizon"] = "Średnioterminowe planowanie (1-5 lat)."
            elif time_preference == "long_term":
                context["planning_horizon"] = "Długoterminowe planowanie (powyżej 5 lat)."
    
    def _save_profile_to_database(self, user_id: int, profile_data: Dict[str, Any]) -> None:
        """
        Save user profile to database.
        
        Args:
            user_id: User ID
            profile_data: Profile data dictionary
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if user profile exists
            cursor.execute("SELECT id FROM user_profiles WHERE user_id = %s", (user_id,))
            result = cursor.fetchone()
            
            # Prepare data for database
            financial_data = json.dumps(profile_data.get("financial_data", {}))
            behavioral_profile = json.dumps(profile_data.get("behavioral_profile", {}))
            recommended_advisor = profile_data.get("recommended_advisor", "financial")
            
            if result:
                # Update existing profile
                cursor.execute(
                    """
                    UPDATE user_profiles 
                    SET financial_data = %s, behavioral_profile = %s, recommended_advisor = %s, updated_at = NOW()
                    WHERE user_id = %s
                    """,
                    (financial_data, behavioral_profile, recommended_advisor, user_id)
                )
            else:
                # Create new profile
                cursor.execute(
                    """
                    INSERT INTO user_profiles (user_id, financial_data, behavioral_profile, recommended_advisor, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                    """,
                    (user_id, financial_data, behavioral_profile, recommended_advisor)
                )
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info(f"Profile for user {user_id} saved successfully")
        except Exception as e:
            logger.error(f"Error saving profile to database: {str(e)}")
    
    def _load_profile_from_database(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Load user profile from database.
        
        Args:
            user_id: User ID
            
        Returns:
            Profile data dictionary or None if not found
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get user profile
            cursor.execute(
                "SELECT financial_data, behavioral_profile, recommended_advisor FROM user_profiles WHERE user_id = %s",
                (user_id,)
            )
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if result:
                financial_data = json.loads(result[0]) if result[0] else {}
                behavioral_profile = json.loads(result[1]) if result[1] else {}
                recommended_advisor = result[2]
                
                return {
                    "financial_data": financial_data,
                    "behavioral_profile": behavioral_profile,
                    "recommended_advisor": recommended_advisor
                }
            
            return None
        except Exception as e:
            logger.error(f"Error loading profile from database: {str(e)}")
            return None
    
    def _update_user_advisor(self, user_id: int, advisor_type: str) -> None:
        """
        Update user's recommended advisor in database.
        
        Args:
            user_id: User ID
            advisor_type: Recommended advisor type
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if user profile exists
            cursor.execute("SELECT id FROM user_profiles WHERE user_id = %s", (user_id,))
            result = cursor.fetchone()
            
            if result:
                # Update advisor
                cursor.execute(
                    """
                    UPDATE user_profiles 
                    SET recommended_advisor = %s, updated_at = NOW()
                    WHERE user_id = %s
                    """,
                    (advisor_type, user_id)
                )
                conn.commit()
            
            cursor.close()
            conn.close()
        except Exception as e:
            logger.error(f"Error updating user advisor: {str(e)}")
    
    def check_decision_tree_readiness(self, message: str, user_id: Optional[int], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if user is ready for the decision tree.
        
        Args:
            message: User message
            user_id: User ID
            context: Context information
            
        Returns:
            Dictionary with decision tree readiness information
        """
        # Decision tree triggers
        tree_triggers = [
            "pokaż opcje", "drzewo decyzyjne", "pomóż mi krok po kroku", 
            "potrzebuję wskazówek", "jakie mam możliwości", "pokaz opcje",
            "co proponujesz", "jakie są opcje", "co mogę zrobić", "pokaż możliwości"
        ]
        
        message_lower = message.lower()
        
        # Check if message contains any triggers
        if any(trigger in message_lower for trigger in tree_triggers):
            # Determine appropriate starting node
            advisor_type = context.get("recommended_advisor", self._determine_advisor_from_message(message))
            
            # Prepare response
            return {
                "ready_for_tree": True,
                "advisor_type": advisor_type,
                "message": "Przejdźmy do bardziej strukturyzowanego podejścia. Zaraz przedstawię Ci kilka opcji, które pomogą mi lepiej zrozumieć Twoją sytuację i dostarczyć konkretne rekomendacje."
            }
        
        # Check message content for implicit requests for guidance
        guidance_indicators = [
            "nie wiem co robić", "doradź mi", "co powinienem", "co powinnam",
            "najlepsze opcje", "co byś radził", "powiedz mi co", "pomóż mi zdecydować"
        ]
        
        if any(indicator in message_lower for indicator in guidance_indicators):
            return {
                "ready_for_tree": True,
                "message": "Widzę, że szukasz konkretnych wskazówek. Najlepiej będzie, jeśli przeprowadzę Cię przez serię pytań, które pomogą mi lepiej zrozumieć Twoją sytuację. Czy chcesz przejść do takiego ustrukturyzowanego podejścia?"
            }
        
        # Not ready for decision tree
        return {"ready_for_tree": False}
    
    def start_conversation_after_form(self, user_id: int, profile_data: Dict[str, Any]) -> str:
        """
        Start a conversation with the user after form completion.
        
        Args:
            user_id: User ID
            profile_data: User profile data from form
            
        Returns:
            Initial AI message to start the conversation
        """
        try:
            # Store user profile if not already in user_forms
            if user_id not in self.user_forms:
                self.user_forms[user_id] = UserProfileForm()
                self.user_forms[user_id].is_complete = True
            
            # Save profile to database
            self._save_profile_to_database(user_id, profile_data)
            
            # Determine best advisor based on profile
            advisor_type = profile_data.get("recommended_advisor", "financial")
            
            # Create context for the conversation
            context = {
                "profile_data": profile_data,
                "recommended_advisor": advisor_type,
                "conversation_phase": "initial"
            }
            
            # Generate personalized greeting based on profile
            financial_data = profile_data.get("financial_data", {})
            behavioral_profile = profile_data.get("behavioral_profile", {})
            
            name = financial_data.get("name", "")
            financial_goal = behavioral_profile.get("financial_goal", "")
            risk_tolerance = behavioral_profile.get("risk_tolerance", "")
            
            greeting = f"Witaj{' ' + name if name else ''}! "
            greeting += "Dziękuję za wypełnienie formularza. "
            
            if financial_goal:
                greeting += f"Widzę, że Twoim głównym celem finansowym jest: {financial_goal}. "
            
            if risk_tolerance:
                tolerance_descriptions = {
                    "conservative": "ostrożne podejście do ryzyka",
                    "moderate": "zrównoważone podejście do ryzyka",
                    "aggressive": "otwartość na wyższe ryzyko dla potencjalnie wyższych zysków"
                }
                tolerance_desc = tolerance_descriptions.get(risk_tolerance, "")
                if tolerance_desc:
                    greeting += f"Zauważyłem, że preferujesz {tolerance_desc}. "
            
            greeting += "W jaki sposób mogę Ci pomóc w osiągnięciu Twoich celów finansowych? Możemy omówić konkretne strategie, przejść przez drzewo decyzyjne, lub odpowiem na Twoje pytania."
            
            # Save this initial interaction
            initial_message = {
                "user_id": user_id,
                "question": "Rozpoczęcie rozmowy po formularzu",
                "answer": greeting,
                "advisory_type": advisor_type,
                "context": context
            }
            
            # Store in database or session storage
            self._save_initial_interaction(initial_message)
            
            return greeting
            
        except Exception as e:
            logger.error(f"Error starting conversation after form: {str(e)}")
            return "Witaj! Dziękuję za wypełnienie formularza. W czym mogę Ci pomóc?"
    
    def _save_initial_interaction(self, interaction_data: Dict[str, Any]) -> None:
        """Save initial interaction to database."""
        try:
            # Implementation depends on your database structure
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                """
                INSERT INTO chat_interactions 
                (user_id, question, reply, advisor_type, context, timestamp)
                VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (
                    interaction_data["user_id"],
                    interaction_data["question"],
                    interaction_data["answer"],
                    interaction_data["advisory_type"],
                    json.dumps(interaction_data["context"]) if "context" in interaction_data else None
                )
            )
            
            conn.commit()
            cursor.close()
            conn.close()
            logger.info(f"Initial interaction saved for user {interaction_data['user_id']}")
        except Exception as e:
            logger.error(f"Error saving initial interaction: {str(e)}")
    
    def transition_to_decision_tree(self, user_id: int, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determine if user should be transitioned to decision tree and prepare initial node.
        
        Args:
            user_id: User ID
            message: User message
            context: Conversation context
            
        Returns:
            Dict with decision tree information or None if not ready for transition
        """
        # Check if ready for decision tree
        readiness_check = self.check_decision_tree_readiness(message, user_id, context)
        if not readiness_check.get("ready_for_tree", False):
            return {"transition_to_tree": False}
        
        # Prepare context for decision tree
        profile = context.get("profile_data", {})
        advisor_type = readiness_check.get("advisor_type", context.get("recommended_advisor", "financial"))
        
        # Map to appropriate root node based on advisor and user profile
        if advisor_type == "investment":
            root_node_id = "investment_risk"
        elif advisor_type == "tax":
            root_node_id = "tax_situation"
        elif "debt" in message.lower() or profile.get("financial_data", {}).get("debt", 0) > 0:
            root_node_id = "debt_type"
        else:
            root_node_id = "root"  # Default starting point in the decision tree
        
        # Prepare response
        tree_request = {
            "user_id": user_id,
            "current_node_id": root_node_id,
            "answer": None,  # First request to the tree doesn't have an answer
            "context": {
                "user_profile": profile,
                "conversation_history": context.get("conversation_history", []),
                "advisor_type": advisor_type
            }
        }
        
        return {
            "transition_to_tree": True,
            "tree_request": tree_request,
            "message": readiness_check.get("message", "Przejdźmy do bardziej strukturyzowanego podejścia, aby lepiej zrozumieć Twoje potrzeby i dostarczyć konkretne rekomendacje.")
        }
    
    def save_chat_and_decision_data(self, user_id: int, message_type: str, content: Any, context: Optional[Dict[str, Any]] = None) -> None:
        """
        Save chat messages and decision tree interactions to database.
        
        Args:
            user_id: User ID
            message_type: Type of message ("user_message", "ai_response", "decision")
            content: Message content or decision data
            context: Additional context
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check what type of data we're saving
            if message_type == "user_message":
                cursor.execute(
                    """
                    INSERT INTO chat_interactions 
                    (user_id, question, context, timestamp)
                    VALUES (%s, %s, %s, NOW())
                    """, 
                    (user_id, content, json.dumps(context) if context else None)
                )
            elif message_type == "ai_response":
                cursor.execute(
                    """
                    INSERT INTO chat_interactions 
                    (user_id, reply, context, timestamp)
                    VALUES (%s, %s, %s, NOW())
                    """, 
                    (user_id, content, json.dumps(context) if context else None)
                )
            elif message_type == "decision":
                cursor.execute(
                    """
                    INSERT INTO decision_interactions 
                    (user_id, node_id, selection, context, timestamp)
                    VALUES (%s, %s, %s, %s, NOW())
                    """, 
                    (user_id, content.get("node_id"), content.get("selection"), 
                    json.dumps(context) if context else None)
                )
                
            conn.commit()
            cursor.close()
            conn.close()
            logger.info(f"Saved {message_type} data for user {user_id}")
        except Exception as e:
            logger.error(f"Error saving data to database: {str(e)}")