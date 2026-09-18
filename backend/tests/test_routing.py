"""
AI Fire One - Unit Tests: Responder Discovery & Routing
"""

import pytest
from backend.routing import discover_and_rank_responders, OPERATIONAL_RADIUS_KM
from backend.osm_service import calculate_haversine_distance


def test_haversine_distance_calculation():
    # Known distance between Mumbai (19.0760, 72.8777) and Pune (18.5204, 73.8567) is ~120 km
    dist = calculate_haversine_distance(19.0760, 72.8777, 18.5204, 73.8567)
    assert 110.0 <= dist <= 130.0


def test_discover_and_rank_responders():
    lat, lon = 19.9450, 73.7380
    responders = discover_and_rank_responders(lat, lon, radius_km=20.0, simulated_registry=True)
    assert len(responders) > 0

    # Ensure all returned responders within 20km are not marked outside operational radius
    for r in responders:
        assert r.distance_km <= OPERATIONAL_RADIUS_KM
        assert r.is_outside_operational_radius is False
        assert r.suitability_score > 0.0
        assert r.phone is not None
