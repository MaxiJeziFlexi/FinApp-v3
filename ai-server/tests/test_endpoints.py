from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Witaj w Finapp AI Server!"}

def test_analyze_endpoint():
    payload = {
        "user_id": 1,
        "income": 10000,
        "expenses": 5000,
        "assets_value": 20000,
        "current_savings": 5000,
        "savings_goal": 100000
    }
    response = client.post("/analyze/", json=payload)
    assert response.status_code == 200
    assert "trend" in response.json()
