from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_trading_strategy_endpoint():
    payload = {
        "user_id": 1,
        "question": "Strategia na dzienny trading akcji?",
        "context": {},
        "language": "pl"
    }
    response = client.post("/api/trading-strategy", json=payload)
    assert response.status_code == 200
    assert "answer" in response.json()