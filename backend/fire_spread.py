"""
AI Fire One - Module 9: Fire Spread Prediction
Mathematical Elliptical Danger-Zone Forward Simulation (60-Minute Horizon)
Note: This is a prototype expansion model based on Rothermel wind-vector formulations.
It must be validated with operational fire-behavior data before real emergency deployment.
"""

import math
import logging
from typing import Dict, Any, List
import numpy as np
from shapely.geometry import Polygon, mapping
from backend.schemas import FireSpreadGeoJSON, GeoJSONGeometry

logger = logging.getLogger("aifireone.fire_spread")


def predict_60min_fire_spread(
    lat: float,
    lon: float,
    wind_velocity_kmh: float = 24.0,
    wind_direction_degrees: float = 45.0,
    ambient_temperature: float = 33.0,
    relative_humidity: float = 35.0,
    frp: float = 35.0
) -> Dict[str, Any]:
    """
    Computes a 60-minute forward fire propagation danger zone polygon using an elliptical
    expansion model governed by wind vector, ambient temperature, and humidity.
    """
    # Environmental dryness factor (higher temp & lower humidity increase rate of spread)
    temp_factor = 1.0 + max(0.0, (ambient_temperature - 20.0) * 0.02)
    humidity_factor = 1.0 + max(0.0, (50.0 - relative_humidity) * 0.015)
    intensity_factor = min(2.5, max(0.8, 1.0 + (frp / 100.0)))

    env_multiplier = temp_factor * humidity_factor * intensity_factor

    # Forward rate of spread in kilometers over 60 minutes
    forward_reach_km = max(0.4, wind_velocity_kmh * 0.065 * env_multiplier)
    # Backing spread against the wind vector
    backing_reach_km = max(0.12, forward_reach_km * 0.18)
    # Flank / lateral crosswind spread
    flank_reach_km = max(0.22, forward_reach_km * 0.42)

    # Convert km distances to spatial coordinates
    lat_deg_per_km = 1.0 / 111.32
    lon_deg_per_km = 1.0 / (111.32 * math.cos(math.radians(lat)))

    # Wind direction radians (direction fire spreads towards)
    theta = math.radians(wind_direction_degrees)

    num_vertices = 32
    coords: List[List[float]] = []

    for i in range(num_vertices):
        angle = (i * 2.0 * math.pi) / num_vertices
        x_local = flank_reach_km * math.cos(angle)
        # Forward elongation in downwind direction
        y_local = forward_reach_km * math.sin(angle) if math.sin(angle) >= 0 else backing_reach_km * math.sin(angle)

        # Rotate by wind direction
        x_rot = x_local * math.cos(theta) - y_local * math.sin(theta)
        y_rot = x_local * math.sin(theta) + y_local * math.cos(theta)

        pt_lat = lat + (y_rot * lat_deg_per_km)
        pt_lon = lon + (x_rot * lon_deg_per_km)
        coords.append([round(pt_lon, 6), round(pt_lat, 6)])

    # Close polygon ring
    coords.append(coords[0])

    poly = Polygon(coords)
    area_sq_km = math.pi * forward_reach_km * flank_reach_km * 0.75

    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [coords]
        },
        "properties": {
            "prediction_horizon_minutes": 60,
            "area_sq_km": round(area_sq_km, 2),
            "forward_reach_km": round(forward_reach_km, 2),
            "flank_reach_km": round(flank_reach_km, 2),
            "wind_velocity_kmh": wind_velocity_kmh,
            "wind_direction_degrees": wind_direction_degrees,
            "ambient_temperature_c": ambient_temperature,
            "relative_humidity_pct": relative_humidity,
            "model_type": "PROTOTYPE_ELLIPTICAL_ROTHERMEL",
            "disclaimer": "Prototype expansion model for decision support. Not a guaranteed operational boundary."
        }
    }
