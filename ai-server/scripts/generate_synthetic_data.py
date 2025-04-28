import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

num_samples = 50

# Definicje przykładowych wartości
currencies = ["USD", "EUR", "PLN"]
investment_types = ["Stock", "Bond", "ETF", "Mutual Fund"]
account_types = ["Checking", "Savings"]
loan_statuses = ["Active", "Closed"]
goal_names = ["Wakacje", "Emerytura", "Kupno mieszkania", "Nowy samochód"]

data = []

for i in range(1, num_samples + 1):
    user_id = i
    goal_name = random.choice(goal_names)
    target_amount = round(random.uniform(10000, 100000), 2)
    current_amount = round(random.uniform(0, target_amount), 2)
    due_date = (datetime.now() + timedelta(days=random.randint(30, 365))).date()
    
    investment_name = f"Investment_{i}"
    investment_type = random.choice(investment_types)
    amount_invested = round(random.uniform(5000, 50000), 2)
    current_value = round(amount_invested * random.uniform(0.8, 1.5), 2)
    currency = random.choice(currencies)
    start_date = (datetime.now() - timedelta(days=random.randint(30, 365))).date()
    maturity_date = (datetime.now() + timedelta(days=random.randint(365, 1825))).date()
    status = random.choice(["Active", "Inactive"])
    broker = f"Broker_{random.randint(1, 5)}"
    portfolio = f"Portfolio_{random.randint(1, 3)}"
    
    account_id = f"ACC_{i}"
    
    loan_amount = round(random.uniform(0, 30000), 2)
    interest_rate = round(random.uniform(1, 10), 2)
    duration_months = random.randint(12, 60)
    monthly_payment = round(loan_amount / duration_months if duration_months > 0 else 0, 2)
    status_loan = random.choice(loan_statuses)
    
    account_name = f"Account_{i}"
    account_type = random.choice(account_types)
    balance = round(random.uniform(1000, 100000), 2)
    currency_acc = random.choice(currencies)
    status_acc = random.choice(["Active", "Inactive"])
    
    goal_gap = round(target_amount - current_amount, 2)
    
    data.append({
        "user_id": user_id,
        "goal_name": goal_name,
        "target_amount": target_amount,
        "current_amount": current_amount,
        "due_date": due_date,
        "investment_name": investment_name,
        "investment_type": investment_type,
        "amount_invested": amount_invested,
        "current_value": current_value,
        "currency": currency,
        "start_date": start_date,
        "maturity_date": maturity_date,
        "status": status,
        "broker": broker,
        "portfolio": portfolio,
        "account_id": account_id,
        "loan_amount": loan_amount,
        "interest_rate": interest_rate,
        "duration_months": duration_months,
        "monthly_payment": monthly_payment,
        "status_loan": status_loan,
        "account_name": account_name,
        "account_type": account_type,
        "balance": balance,
        "currency_acc": currency_acc,
        "status_acc": status_acc,
        "goal_gap": goal_gap
    })

df = pd.DataFrame(data)
df.to_csv("synthetic_financial_situations.csv", index=False)
print("Synthetic data with 50 financial situations generated!")
