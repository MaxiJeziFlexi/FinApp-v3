import os
import logging
import openai
from datetime import datetime
from typing import Dict, Any
from core.financial_models import AdvisoryRequest, AdvisoryResponse

logger = logging.getLogger(__name__)

# Set OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

class TradingStrategyGenerator:
    """Generate trading strategies using OpenAI models."""

    def __init__(self):
        logger.info("TradingStrategyGenerator initialized")

    def generate_strategy(self, request: AdvisoryRequest) -> AdvisoryResponse:
        """Generate a trading strategy based on the request."""
        user_id = request.user_id
        question = request.question
        context = request.context or {}
        language = request.language or "en"

        # Prepare system prompt
        if language == "pl":
            prompt = (
                "Jesteś asystentem inwestycyjnym specjalizującym się w tworzeniu"
                " strategii tradingowych. Odpowiadaj konkretnie i podawaj kroki"
                " do wykonania."
            )
        else:
            prompt = (
                "You are an investment assistant specializing in building"
                " trading strategies. Provide concise steps and clear logic."
            )

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": question}
        ]

        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            answer = response.choices[0].message["content"].strip()
        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            answer = "Unable to generate strategy at this time."

        return AdvisoryResponse(
            user_id=user_id,
            question=question,
            answer=answer,
            advisory_type="trading_strategy",
            confidence_score=0.0,
            sources=[],
            disclaimer="For educational purposes only.",
            created_at=datetime.now(),
            additional_resources=None,
        )