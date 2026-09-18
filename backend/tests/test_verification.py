"""
AI Fire One - Unit Tests: Deterministic Safety Gateway
"""

import pytest
from backend.verification import evaluate_safety_gateway


def test_safety_gate_passes_verified_event():
    # Valid coordinates, high ML confidence (92%), historical corroboration, multi-source (sat + camera + OSM)
    res = evaluate_safety_gateway(
        lat=19.9450,
        lon=73.7380,
        ml_confidence=92.5,
        historical_corroborated=True,
        satellite_confirmed=True,
        camera_confirmed=True,
        osm_proximity_confirmed=True
    )
    assert res.verified is True
    assert res.status == "VERIFIED"
    assert len(res.reason_codes) == 0


def test_safety_gate_rejects_low_confidence():
    # Low ML confidence (< 85%)
    res = evaluate_safety_gateway(
        lat=19.9450,
        lon=73.7380,
        ml_confidence=72.0,
        historical_corroborated=True,
        satellite_confirmed=True,
        camera_confirmed=False,
        osm_proximity_confirmed=True
    )
    assert res.verified is False
    assert res.status == "PENDING_VERIFICATION"
    assert any("LOW_MODEL_CONFIDENCE" in code for code in res.reason_codes)


def test_safety_gate_rejects_invalid_coordinates():
    # Latitude out of range (> 90)
    res = evaluate_safety_gateway(
        lat=95.0,
        lon=73.7380,
        ml_confidence=95.0,
        historical_corroborated=True,
        satellite_confirmed=True,
        camera_confirmed=True,
        osm_proximity_confirmed=True
    )
    assert res.verified is False
    assert res.status == "REJECTED"
    assert "INVALID_GEOGRAPHIC_COORDINATES" in res.reason_codes


def test_safety_gate_rejects_single_unvalidated_source():
    # Only satellite confirmed, no camera, no OSM proximity -> < 2 independent sources
    res = evaluate_safety_gateway(
        lat=19.9450,
        lon=73.7380,
        ml_confidence=90.0,
        historical_corroborated=True,
        satellite_confirmed=True,
        camera_confirmed=False,
        osm_proximity_confirmed=False
    )
    assert res.verified is False
    assert any("NO_INDEPENDENT_SUPPORTING_EVIDENCE" in code for code in res.reason_codes)
