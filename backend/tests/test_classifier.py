"""
AI Fire One - Unit Tests: Random Forest Classifier
"""

import pytest
from backend.classifier import classifier_instance, CLASS_NAMES


def test_classifier_initialization():
    assert classifier_instance.is_trained is True
    assert classifier_instance.model is not None


def test_predict_industrial_fire():
    # Strong industrial fire signature: close to plant, high brightness, high persistence, camera confirmed
    res = classifier_instance.predict_fire_class(
        fire_id="TEST-01",
        confidence=94.0,
        brightness_temp=350.0,
        frp=85.0,
        industrial_dist_km=0.2,
        historical_persistence=0.8,
        land_cover_class="Industrial",
        camera_fire_evidence=True
    )
    assert res.fire_id == "TEST-01"
    assert res.predicted_class == "Industrial / Structure Fire"
    assert res.class_code == 2
    assert res.confidence > 50.0
    assert "Industrial / Structure Fire" in res.class_probabilities


def test_predict_wildfire():
    # Strong wildfire signature: far from industrial, forest land cover, high FRP
    res = classifier_instance.predict_fire_class(
        fire_id="TEST-02",
        confidence=92.0,
        brightness_temp=345.0,
        frp=90.0,
        industrial_dist_km=18.0,
        historical_persistence=0.3,
        land_cover_class="Forest",
        camera_fire_evidence=True
    )
    assert res.predicted_class == "Forest / Wildfire"
    assert res.class_code == 1
