# ai/enhanced_model.py
import numpy as np
import pandas as pd
import joblib
import os
import logging
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from typing import Dict, List, Tuple, Any, Optional

logger = logging.getLogger(__name__)

class EnhancedFinancialModel:
    """Enhanced financial prediction model using ensemble methods."""
    
    def __init__(self, model_path: str = "models/financial_model.joblib"):
        """Initialize the enhanced financial model."""
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            "income", "expenses", "assets_value", "current_savings", 
            "debt_to_income", "savings_rate", "expense_to_income"
        ]
        
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Load or train model
        if os.path.exists(model_path):
            self.load_model()
        else:
            self.train_model_with_synthetic_data()
    
    def preprocess_data(self, data: Dict[str, float]) -> np.ndarray:
        """Preprocess financial data and engineer features."""
        # Extract base features
        features = {
            "income": data.get("income", 0.0),
            "expenses": data.get("expenses", 0.0),
            "assets_value": data.get("assets_value", 0.0),
            "current_savings": data.get("current_savings", 0.0)
        }
        
        # Engineer additional features
        if features["income"] > 0:
            features["debt_to_income"] = data.get("total_debt", 0.0) / features["income"]
            features["expense_to_income"] = features["expenses"] / features["income"]
        else:
            features["debt_to_income"] = 0.0
            features["expense_to_income"] = 0.0
            
        if data.get("savings_goal", 0.0) > 0:
            features["savings_rate"] = features["current_savings"] / data.get("savings_goal")
        else:
            features["savings_rate"] = 0.0
        
        # Convert to numpy array in correct order
        X = np.array([[features[name] for name in self.feature_names]])
        return X
    
    def generate_synthetic_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic financial data for model training."""
        np.random.seed(42)
        
        # Generate random financial data
        incomes = np.random.lognormal(mean=8.5, sigma=0.4, size=n_samples)  # Mean around 5000
        expense_ratios = np.random.beta(5, 15, size=n_samples)  # Most people spend 20-40% of income
        expenses = incomes * expense_ratios
        assets = np.random.lognormal(mean=10, sigma=1, size=n_samples)  # Mean around 22000
        savings = np.random.lognormal(mean=7, sigma=1, size=n_samples)  # Mean around 1100
        debts = np.random.lognormal(mean=8, sigma=1.2, size=n_samples)  # Mean around 3000
        
        # Calculate derived features
        debt_to_income = debts / incomes
        savings_rate = savings / (incomes * 12)  # Annual savings rate
        expense_to_income = expenses / incomes
        
        # Create feature matrix
        X = np.column_stack([
            incomes, expenses, assets, savings, 
            debt_to_income, savings_rate, expense_to_income
        ])
        
        # Generate labels based on financial health rules
        y = []
        for i in range(n_samples):
            if debt_to_income[i] > 0.5 or expense_to_income[i] > 0.8:
                y.append("unstable")  # High debt or expenses relative to income
            elif savings_rate[i] > 0.2 and expense_to_income[i] < 0.5:
                y.append("good")  # Good savings and low expenses
            else:
                y.append("stable")  # Default case
        
        return X, np.array(y)
    
    def train_model_with_synthetic_data(self):
        """Train the model using synthetic financial data."""
        logger.info("Generating synthetic data for model training")
        X, y = self.generate_synthetic_data(n_samples=5000)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        self.scaler.fit(X_train)
        X_train_scaled = self.scaler.transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Define model pipeline with hyperparameter tuning
        logger.info("Training Random Forest model with hyperparameter tuning")
        param_grid = {
            'n_estimators': [50, 100, 200],
            'max_depth': [None, 10, 20, 30],
            'min_samples_split': [2, 5, 10]
        }
        
        rf = RandomForestClassifier(random_state=42)
        grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='accuracy')
        grid_search.fit(X_train_scaled, y_train)
        
        # Get best model
        self.model = grid_search.best_estimator_
        
        # Evaluate model
        accuracy = self.model.score(X_test_scaled, y_test)
        logger.info(f"Model trained with accuracy: {accuracy:.4f}")
        
        # Save model
        self.save_model()
    
    def predict_financial_status(self, data: Dict[str, float]) -> Dict[str, Any]:
        """Predict financial status based on user data."""
        if self.model is None:
            self.load_model()
            
        # Preprocess data
        X = self.preprocess_data(data)
        X_scaled = self.scaler.transform(X)
        
        # Make prediction
        status = self.model.predict(X_scaled)[0]
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba(X_scaled)[0]
        class_indices = {class_name: i for i, class_name in enumerate(self.model.classes_)}
        confidence = probabilities[class_indices[status]]
        
        # Calculate feature importances for this prediction
        importances = {}
        if hasattr(self.model, 'feature_importances_'):
            for i, feature in enumerate(self.feature_names):
                importances[feature] = self.model.feature_importances_[i]
        
        return {
            "status": status,
            "confidence": confidence,
            "probabilities": {class_name: probabilities[i] for i, class_name in enumerate(self.model.classes_)},
            "feature_importances": importances
        }
    
    def save_model(self):
        """Save the trained model to disk."""
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "classes": self.model.classes_ if self.model else None
        }
        joblib.dump(model_data, self.model_path)
        logger.info(f"Model saved to {self.model_path}")
    
    def load_model(self):
        """Load the trained model from disk."""
        try:
            model_data = joblib.load(self.model_path)
            self.model = model_data["model"]
            self.scaler = model_data["scaler"]
            self.feature_names = model_data["feature_names"]
            logger.info(f"Model loaded from {self.model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            logger.info("Training new model with synthetic data")
            self.train_model_with_synthetic_data()
