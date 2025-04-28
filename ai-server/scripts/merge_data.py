import pandas as pd

def load_and_process_data():
    """
    Ładuje i przetwarza dane treningowe.
    """
    # Załaduj dane z pliku CSV
    df = pd.read_csv("data/training_data.csv")
    
    # Przetwarzanie danych
    df['goal_gap'] = df['savings_goal'] - df['current_savings']
    df = df.dropna()  # Usuń brakujące wartości
    return df

def prepare_training_data():
    """
    Przygotowuje dane do trenowania modelu.
    """
    df = load_and_process_data()
    X = df[["income", "expenses", "assets_value", "goal_gap"]].values
    y = df["trend"].values
    return X, y
