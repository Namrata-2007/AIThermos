"""
AI Fire One - Unit Tests: Historical Thermal Baseline
"""

import pytest
from backend.baseline import HistoricalBaselineEngine


def test_baseline_evaluation_and_anomaly():
    engine = HistoricalBaselineEngine()
    lat, lon = 19.9450, 73.7380

    # Register multiple baseline observations with modest FRP (10-20 MW)
    for _ in range(8):
        engine.register_observation(lat, lon, frp=15.0, brightness_temp=318.0)

    # Acute spike to 95.0 MW should trigger anomaly detection
    eval_res = engine.evaluate_baseline(lat, lon, current_frp=95.0, current_brightness_temp=350.0)
    assert eval_res.baseline_available is True
    assert eval_res.historical_observations == 8
    assert eval_res.anomaly_detected is True
    assert eval_res.mean_frp == 15.0
    assert eval_res.current_frp == 95.0


def test_baseline_normal_condition():
    engine = HistoricalBaselineEngine()
    lat, lon = 19.0142, 72.8987

    for _ in range(10):
        engine.register_observation(lat, lon, frp=20.0, brightness_temp=320.0)

    # Current FRP consistent with mean should NOT trigger anomaly
    eval_res = engine.evaluate_baseline(lat, lon, current_frp=21.0, current_brightness_temp=321.0)
    assert eval_res.anomaly_detected is False
