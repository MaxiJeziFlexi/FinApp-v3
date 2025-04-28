import os
import logging
import json
import openai
from datetime import datetime
from typing import Dict, Any, List, Optional
from core.financial_models import AdvisoryRequest, AdvisoryResponse

logger = logging.getLogger(__name__)

# Set OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

class FinancialLegalAdvisor:
    """
    Provides financial and legal advisory services using AI.
    """
    
    def __init__(self):
        """Initialize the financial and legal advisor."""
        logger.info("Financial and Legal Advisor initialized")
    
    def process_advisory_request(self, request: AdvisoryRequest) -> AdvisoryResponse:
        """
        Process a financial or legal advisory request.
        
        Args:
            request: Advisory request containing question and context
            
        Returns:
            Advisory response with answer and metadata
        """
        user_id = request.user_id
        question = request.question
        context = request.context
        language = request.language or "en"
        
        # Prepare system prompt based on context
        system_prompt = self._prepare_system_prompt(context, language)
        
        # Prepare messages for the AI
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]
        
        # Add context from previous interactions if available
        if context and "previous_interactions" in context:
            for interaction in context["previous_interactions"]:
                messages.append({"role": "user", "content": interaction["question"]})
                messages.append({"role": "assistant", "content": interaction["answer"]})
        
        try:
            # Call OpenAI API - CHANGED FROM GPT-4 TO GPT-3.5-TURBO
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # Changed from gpt-4 to gpt-3.5-turbo
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            )
            
            # Extract answer from response
            answer = response.choices[0].message["content"].strip()
            
            # Calculate confidence score (simplified)
            confidence_score = 0.85
            
            # Create advisory response
            advisory_response = AdvisoryResponse(
                user_id=user_id,
                question=question,
                answer=answer,
                advisory_type="financial_legal",
                confidence_score=confidence_score,
                sources=self._extract_sources(answer),
                disclaimer="This advice is for informational purposes only and should not be considered as professional financial or legal advice.",
                created_at=datetime.now(),
                additional_resources=self._get_additional_resources(question, language)
            )
            
            return advisory_response
        
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            
            # Return a fallback response
            return AdvisoryResponse(
                user_id=user_id,
                question=question,
                answer="I'm unable to provide advice on this topic at the moment. Please try again later or rephrase your question.",
                advisory_type="financial_legal",
                confidence_score=0.0,
                sources=[],
                disclaimer="This advice is for informational purposes only and should not be considered as professional financial or legal advice.",
                created_at=datetime.now(),
                additional_resources={}
            )
    
    def _prepare_system_prompt(self, context: Dict[str, Any], language: str) -> str:
        """
        Prepare system prompt based on context and language.
        
        Args:
            context: Request context
            language: Response language
            
        Returns:
            System prompt for the AI
        """
        # Base prompt
        if language == "pl":
            base_prompt = "Jesteś ekspertem w dziedzinie finansów i prawa, specjalizującym się w doradztwie finansowym, podatkowym i inwestycyjnym. Twoja rola polega na udzielaniu jasnych, dokładnych i pomocnych porad dotyczących finansów osobistych, planowania finansowego, inwestycji i zagadnień prawnych związanych z finansami."
        else:
            base_prompt = "You are an expert in finance and law, specializing in financial, tax, and investment advisory. Your role is to provide clear, accurate, and helpful advice on personal finance, financial planning, investments, and legal matters related to finance."
        
        # Add context-specific information if available
        if context:
            if "risk_profile" in context:
                risk_profile = context["risk_profile"]
                if language == "pl":
                    base_prompt += f"\n\nProfil ryzyka użytkownika: {risk_profile}."
                else:
                    base_prompt += f"\n\nUser risk profile: {risk_profile}."
            
            if "financial_status" in context:
                financial_status = context["financial_status"]
                if language == "pl":
                    base_prompt += f"\n\nStatus finansowy użytkownika: {financial_status}."
                else:
                    base_prompt += f"\n\nUser financial status: {financial_status}."
        
        # Add response guidelines
        if language == "pl":
            base_prompt += "\n\nTwoje odpowiedzi powinny być:"\
                          "\n1. Dokładne i oparte na faktach"\
                          "\n2. Jasne i zrozumiałe dla osób bez specjalistycznej wiedzy"\
                          "\n3. Uwzględniające kontekst i profil ryzyka użytkownika"\
                          "\n4. Zawierające zastrzeżenie, że są to informacje ogólne, a nie profesjonalne porady"\
                          "\n\nOdpowiadaj w języku polskim."
        else:
            base_prompt += "\n\nYour responses should be:"\
                          "\n1. Accurate and fact-based"\
                          "\n2. Clear and understandable for people without specialized knowledge"\
                          "\n3. Considerate of the user's context and risk profile"\
                          "\n4. Include a disclaimer that this is general information, not professional advice"\
                          "\n\nRespond in English."
        
        return base_prompt
    
    def _extract_sources(self, answer: str) -> List[str]:
        """
        Extract sources from the answer if available.
        
        Args:
            answer: AI-generated answer
            
        Returns:
            List of sources
        """
        # Simple implementation - look for sources section
        sources = []
        if "Sources:" in answer:
            sources_section = answer.split("Sources:")[1].strip()
            sources = [source.strip() for source in sources_section.split("\n") if source.strip()]
        elif "Źródła:" in answer:  # Added support for Polish sources
            sources_section = answer.split("Źródła:")[1].strip()
            sources = [source.strip() for source in sources_section.split("\n") if source.strip()]
        
        return sources
    
    def _get_additional_resources(self, question: str, language: str) -> Dict[str, str]:
        """
        Get additional resources based on the question.
        
        Args:
            question: User question
            language: Response language
            
        Returns:
            Dictionary of additional resources
        """
        # Simple implementation - return fixed resources
        if language == "pl":
            return {
                "Planowanie finansowe": "https://www.nbp.pl/edukacja/",
                "Inwestowanie": "https://www.gpw.pl/edukacja",
                "Podatki": "https://www.podatki.gov.pl/"
            }
        else:
            return {
                "Financial Planning": "https://www.investopedia.com/financial-planning-4427066",
                "Investing": "https://www.investor.gov/",
                "Taxes": "https://www.irs.gov/individuals"
            }
