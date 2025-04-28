from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import torch
import torch.nn as nn
import numpy as np
from core.db_manager import get_db_connection
router = APIRouter()

class FinanceInput(BaseModel):
    user_id: int
    income: float
    expenses: float
    assets_value: float
    current_savings: float
    savings_goal: float
    interest_rate: Optional[float] = 0.0
    inflation_rate: Optional[float] = 0.0
    market_index: Optional[float] = 0.0
    country_code: Optional[str] = "PL"
    transaction_descriptions: Optional[List[str]] = []
    recurring_expenses: Optional[float] = 0.0
    one_time_expenses: Optional[float] = 0.0
    tax_bracket: Optional[float] = 0.0
    age: Optional[int] = 0
    financial_goal: Optional[str] = ""

class AnalysisResponse(BaseModel):
    trend: str = Field(..., example="Bull")
    liquidity_status: float = Field(..., example=2300.0)
    savings_progress: str = Field(..., example="25.00%")
    suggestion: str = Field(..., example="Twoja sytuacja finansowa jest korzystna...")
    country_tax: dict = Field(..., example={"vat": 0.23, "income_tax": 0.17})
    input_features: List[float] = Field(..., example=[30000.0, 5200.0, 25000.0, 75000.0])
    trend_history: List[str] = Field(..., example=["Bull", "Neutral"])

# Ładowanie modelu
class FinancialModel(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(FinancialModel, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

model = FinancialModel(input_size=4, hidden_size=64, output_size=3)
try:
    model.load_state_dict(torch.load("financial_model_v2.pth", map_location=torch.device("cpu")))
    model.eval()
except Exception as e:
    raise HTTPException(status_code=500, detail="Model cannot be loaded: " + str(e))

# Konfiguracje systemowe
COUNTRY_RULES = {
    "PL": {"vat": 0.23, "income_tax": 0.17},
    "DE": {"vat": 0.19, "income_tax": 0.2},
    "US": {"vat": 0.07, "income_tax": 0.12},
}
FINANCIAL_GOALS = {
    "house": 250000,
    "retirement": 500000,
}

def generate_suggestion(trend: str, liquidity: float) -> str:
    if liquidity < 0:
        return "Zwiększ dochody lub zredukuj wydatki."
    return {
        "Bull": "Twoja sytuacja finansowa jest korzystna – rozważ dalsze inwestycje.",
        "Neutral": "Obecny stan finansowy jest umiarkowany – warto monitorować sytuację.",
        "Bear": "Sytuacja jest niekorzystna – rozważ korektę budżetu i ograniczenie ryzyka."
    }[trend]

def get_trend_history(cur, user_id: int) -> List[str]:
    cur.execute("""
        SELECT trend FROM financial_analyses
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 5
    """, (user_id,))
    return [row[0] for row in cur.fetchall()]

def update_suggestion_based_on_history(history: List[str], current_suggestion: str) -> str:
    if history.count("Bear") >= 3:
        return "Twoja sytuacja pogarsza się – rozważ konsultację z doradcą."
    if history.count("Bull") >= 3:
        return "Kontynuuj obecną strategię, wygląda obiecująco."
    if "Bull" in history and "Bear" in history:
        return "Twoja sytuacja jest zmienna – warto dokładniej monitorować finanse."
    return current_suggestion

def log_ai_interaction(user_id: int, trend: str, liquidity: float, savings_rate: float, suggestion: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO ai_logs (user_id, trend, liquidity, savings_progress, suggestion)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, trend, liquidity, f"{savings_rate:.2%}", suggestion))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("Błąd logowania interakcji AI:", e)

# Nowa funkcja get_latest_data
def get_latest_data(user_id: int) -> str:
    """Zwraca najnowsze dane analityczne dla użytkownika w formacie tekstowym."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT income, expenses, assets_value, trend, liquidity, savings_progress, suggestion
            FROM financial_analyses
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            income, expenses, assets_value, trend, liquidity, savings_progress, suggestion = result
            return (
                f"Najnowsze dane: Dochód: {income}, Wydatki: {expenses}, Wartość aktywów: {assets_value}, "
                f"Trend: {trend}, Płynność: {liquidity}, Postęp w oszczędzaniu: {savings_progress}, "
                f"Sugestia: {suggestion}"
            )
        return "Brak danych analitycznych dla tego użytkownika."
    except Exception as e:
        print("Błąd w get_latest_data:", e)
        return "Wystąpił błąd podczas pobierania danych."

@router.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze(data: FinanceInput):
    try:
        rule = COUNTRY_RULES.get(data.country_code, COUNTRY_RULES["US"])
        history = []
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT balance, loan_amount, current_value, goal_gap FROM merged_financial_data WHERE user_id = %s LIMIT 1",
                (data.user_id,)
            )
            result = cur.fetchone()
            cur.close()
            conn.close()
        except Exception as e:
            print("Błąd pobierania danych kontekstowych:", e)
            result = None

        context_balance = data.assets_value if not result else result[0]
        context_loan = data.expenses * 0.2 if not result else result[1]
        context_current_value = data.assets_value if not result else result[2]
        context_goal_gap = (data.savings_goal - data.current_savings) if not result else result[3]

        features = [
            (data.assets_value + context_balance) / 2,
            (data.expenses + context_loan) / 2,
            (data.assets_value + context_current_value) / 2,
            ((data.savings_goal - data.current_savings) + context_goal_gap) / 2
        ]
        
        x = torch.tensor([features], dtype=torch.float32)
        output = model(x).detach().numpy()[0]
        trend = ["Bear", "Neutral", "Bull"][int(np.argmax(output))]
        savings_rate = data.current_savings / data.savings_goal if data.savings_goal else 0
        liquidity = data.income - data.expenses

        suggestion = generate_suggestion(trend, liquidity)
        
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO financial_analyses 
                (user_id, income, expenses, assets_value, trend, liquidity, savings_progress, suggestion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data.user_id,
                data.income,
                data.expenses,
                data.assets_value,
                trend,
                liquidity,
                savings_rate,
                suggestion
            ))
            conn.commit()

            history = get_trend_history(cur, data.user_id)
            suggestion = update_suggestion_based_on_history(history, suggestion)
            
            log_ai_interaction(data.user_id, trend, liquidity, savings_rate, suggestion)
            
            cur.close()
            conn.close()
        except Exception as e:
            print("DB error:", e)

        return {
            "trend": trend,
            "liquidity_status": liquidity,
            "savings_progress": f"{savings_rate:.2%}",
            "suggestion": suggestion,
            "country_tax": rule,
            "input_features": features,
            "trend_history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))