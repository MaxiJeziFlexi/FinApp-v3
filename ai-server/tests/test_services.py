import pytest
from core.services import normalize_features, generate_suggestion

def test_normalize_features():
    features = [100000, 20000, 50000, 250000]
    normalized = normalize_features(features)
    assert normalized == [1.0, 1.0, 0.5, 0.5]

def test_generate_suggestion():
    suggestion = generate_suggestion("Bull", 5000, 0.9)
    assert "korzystna" in suggestion

    suggestion = generate_suggestion("Bear", -1000, 0.8)
    assert "krytyczna" in suggestion.lower()
