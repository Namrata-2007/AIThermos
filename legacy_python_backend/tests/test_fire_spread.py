"""
AI Fire One - Unit Tests: Fire Spread Prediction
"""

import pytest
from backend.fire_spread import predict_60min_fire_spread
from shapely.geometry import shape


def test_predict_60min_fire_spread_geometry():
    lat, lon = 19.9450, 73.7380
    result = predict_60min_fire_spread(
        lat=lat,
        lon=lon,
        wind_velocity_kmh=30.0,
        wind_direction_degrees=90.0,  # Eastward
        ambient_temperature=35.0,
        relative_humidity=25.0,
        frp=60.0
    )

    assert result["type"] == "Feature"
    assert result["geometry"]["type"] == "Polygon"
    assert len(result["geometry"]["coordinates"][0]) >= 20

    # Validate with Shapely
    poly = shape(result["geometry"])
    assert poly.is_valid is True
    assert not poly.is_empty
    assert poly.area > 0.0

    props = result["properties"]
    assert props["prediction_horizon_minutes"] == 60
    assert props["forward_reach_km"] > 0.0
    assert props["area_sq_km"] > 0.0
