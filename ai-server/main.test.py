from fastapi.testclient import TestClient
from main import app, ai_chat_selector, financial_advisor, investment_advisor, get_db_connection
from unittest.mock import patch, MagicMock
import os
from pydantic import BaseModel
from fastapi import HTTPException
import pytest
from core.database import init_db
client = TestClient(app)

class OpenAIRequest(BaseModel):
    user_id: int
    question: str
    context: dict

@patch('api.decision_tree.process_decision_tree')
@patch.object(investment_advisor, 'process_advisory_request')
@patch.object(financial_advisor, 'process_advisory_request')
async def test_enhanced_decision_tree_with_ai_integration(mock_financial_advisor, mock_investment_advisor, mock_process_decision_tree):
    mock_process_decision_tree.return_value = {
        "recommendations": [{"title": "Invest in stocks"}]
    }
    mock_financial_advisor.return_value = AdvisoryResponse(answer="Detailed financial advice")
    mock_investment_advisor.return_value = AdvisoryResponse(answer="Detailed investment advice")

    request_data = {
        "user_id": 1,
        "current_node_id": "node1",
        "answer": "Yes",
        "context": {"advisor_type": "financial"}
    }

    response = await enhanced_decision_tree(request_data)

    assert "recommendations" in response
    assert "ai_insights" in response
    assert response["ai_insights"] == "Detailed financial advice"
    mock_financial_advisor.assert_called_once()
    mock_investment_advisor.assert_not_called()

@patch('main.get_db_connection')
def test_get_chat_history(mock_get_db_connection):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db_connection.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = [
        ("Question 1", "Reply 1", "financial", "2023-01-01 12:00:00"),
        ("Question 2", "Reply 2", "investment", "2023-01-02 13:00:00")
    ]

    response = client.get("/api/chat-history/1")
    assert response.status_code == 200
    history = response.json()["history"]
    assert len(history) == 2
    assert history[0] == {
        "question": "Question 1",
        "reply": "Reply 1",
        "advisor_type": "financial",
        "timestamp": "2023-01-01T12:00:00"
    }
    assert history[1] == {
        "question": "Question 2",
        "reply": "Reply 2",
        "advisor_type": "investment",
        "timestamp": "2023-01-02T13:00:00"
    }

    mock_cursor.execute.assert_called_once_with(
        """
        SELECT question, reply, advisor_type, timestamp 
        FROM chat_interactions 
        WHERE user_id = %s 
        ORDER BY timestamp ASC
        """,
        (1,)
    )

@patch.dict(os.environ, {}, clear=True)
@patch('main.get_db_connection')
def test_ask_openai_question_missing_api_key(mock_db_connection):
    mock_db_connection.return_value = MagicMock()
    request = OpenAIRequest(user_id=1, question="Test question", context={})
    with pytest.raises(HTTPException) as exc_info:
        client.post("/api/openai-question", json=request.dict())
    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Brak konfiguracji API OpenAI"

@patch('main.ai_chat_selector.handle_message')
@patch('main.save_interaction_to_database')
async def test_financial_chat_processing_and_saving(mock_save_interaction, mock_handle_message):
    mock_handle_message.return_value = "AI response"
    
    request = FinancialChatRequest(
        user_id=1,
        question="How to invest?",
        context={"key": "value"},
        advisory_type="financial",
        language="pl"
    )
    
    response = await financial_chat(request)
    
    assert response.reply == "AI response"
    assert response.result == "AI response"
    
    mock_handle_message.assert_called_once_with(
        message="How to invest?",
        user_id=1,
        context={"key": "value"}
    )
    
    mock_save_interaction.assert_called_once_with(
        user_id=1,
        question="How to invest?",
        reply="AI response",
        advisor_type="financial",
        context={"key": "value"}
    )

def test_transition_from_form_to_chat():
    with patch('ai.ai_chat_selector.AIChatSelector') as MockAIChatSelector:
        mock_selector = MockAIChatSelector.return_value
        mock_selector.user_forms = {1: MagicMock()}
        mock_selector.user_forms[1].is_form_complete.return_value = True
        mock_selector.user_forms[1].get_profile_data.return_value = {"recommended_advisor": "financial"}
        mock_selector.start_conversation_after_form.return_value = "Welcome to chat!"

        request = ChatRequest(user_id=1, messages=[ChatMessage(role="user", content="Last form answer")])
        response = client.post("/api/chat", json=request.dict())

        assert response.status_code == 200
        assert response.json() == {
            "reply": "Welcome to chat!",
            "result": "Welcome to chat!",
            "form_completed": True
        }
        mock_selector.start_conversation_after_form.assert_called_once()

def test_new_user_starting_profile_form():
    with patch('ai.ai_chat_selector.AIChatSelector') as MockAIChatSelector:
        mock_ai_selector = MockAIChatSelector.return_value
        mock_ai_selector.handle_message.return_value = "What is your age?"
        mock_ai_selector.user_forms = {1: MagicMock()}
        mock_ai_selector.user_forms[1].is_form_complete.return_value = False

        request = FormRequest(user_id=1, answer="Start", context={})
        response = client.post("/api/profile-form", json=request.dict())

        assert response.status_code == 200
        assert response.json() == {
            "next_question": "What is your age?",
            "is_complete": False,
            "profile_data": None
        }
        mock_ai_selector.handle_message.assert_called_once_with("Start", 1, {})
