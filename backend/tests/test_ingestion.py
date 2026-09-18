"""
AI Fire One - Unit Tests: Ingestion Pipeline
"""

import pytest
from backend.ingestion import validate_geographic_coordinates, fetch_satellite_fire_points, to_geopandas_dataframe


def test_validate_geographic_coordinates():
    assert validate_geographic_coordinates(19.9450, 73.7380) is True
    assert validate_geographic_coordinates(0.0, 0.0) is True
    assert validate_geographic_coordinates(91.0, 50.0) is False
    assert validate_geographic_coordinates(-95.0, 10.0) is False
    assert validate_geographic_coordinates(20.0, 185.0) is False
    assert validate_geographic_coordinates(20.0, -185.0) is False


def test_fetch_satellite_fire_points_fallback():
    # Without valid API key, should gracefully return calibrated benchmark records
    points = fetch_satellite_fire_points(source="VIIRS_NOAA21_NRT", api_key="")
    assert len(points) > 0
    first = points[0]
    assert first.latitude != 0.0
    assert first.longitude != 0.0
    assert first.frp > 0.0
    assert first.confidence >= 50.0
    assert first.source == "VALIDATED_BENCHMARK"


def test_to_geopandas_dataframe():
    points = fetch_satellite_fire_points(source="VIIRS_NOAA21_NRT", api_key="")
    gdf = to_geopandas_dataframe(points)
    assert len(gdf) == len(points)
    assert "geometry" in gdf.columns
    assert gdf.geometry.iloc[0].x == points[0].longitude
    assert gdf.geometry.iloc[0].y == points[0].latitude
