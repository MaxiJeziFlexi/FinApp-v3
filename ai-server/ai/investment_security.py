from typing import Dict, List
import numpy as np
from sklearn.ensemble import IsolationForest
from ..utils.logger import logger
class InvestmentSecurityAnalyzer:
    def __init__(self):
        self.anomaly_detector = IsolationForest(contamination=0.1)
        
    def analyze_investment_risk(self, investment_data: Dict) -> Dict:
        try:
            risk_score = self._calculate_risk_score(investment_data)
            anomalies = self._detect_anomalies(investment_data)
            
            return {
                "risk_score": risk_score,
                "anomalies": anomalies,
                "recommendations": self._generate_recommendations(risk_score, anomalies)
            }
        except Exception as e:
            logger.error(f"Error in investment security analysis: {str(e)}")
            return {"error": str(e)}

    def _calculate_risk_score(self, data: Dict) -> float:
        # Basic risk calculation based on volatility and investment type
        volatility = data.get('volatility', 0.5)
        investment_type_risk = {
            'Stock': 0.8,
            'Bond': 0.3,
            'ETF': 0.5,
            'Mutual Fund': 0.4,
            'Real Estate': 0.6,
            'Cryptocurrency': 0.9
        }
        base_risk = investment_type_risk.get(data.get('type'), 0.5)
        return (base_risk + volatility) / 2

    def _detect_anomalies(self, data: Dict) -> List[str]:
        try:
            # Przykładowe dane do analizy anomalii
            features = np.array(data.get('features', [])).reshape(-1, 1)
            if len(features) == 0:
                return ["Brak danych do analizy anomalii"]

            # Dopasowanie modelu i wykrycie anomalii
            self.anomaly_detector.fit(features)
            predictions = self.anomaly_detector.predict(features)

            # Zwróć listę anomalii
            anomalies = [f"Anomalia w indeksie {i}" for i, pred in enumerate(predictions) if pred == -1]
            return anomalies
        except Exception as e:
            logger.error(f"Error in anomaly detection: {str(e)}")
            return [f"Błąd wykrywania anomalii: {str(e)}"]

    def _generate_recommendations(self, risk_score: float, anomalies: List[str]) -> List[str]:
        recommendations = []
        if risk_score > 0.7:
            recommendations.append("Wysokie ryzyko - rozważ dywersyfikację portfela")
        elif risk_score > 0.4:
            recommendations.append("Umiarkowane ryzyko - monitoruj regularnie")
        return recommendations
