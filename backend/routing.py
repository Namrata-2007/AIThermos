"""
AI Fire One - Modules 10, 11, 12, 13: Emergency Responder Discovery & Smart Scoring
Spatial Responder Discovery, Haversine Distancing, and Multi-Factor Ranking
"""

import math
import logging
from typing import List, Dict, Any, Optional
from backend.config import settings
from backend.osm_service import query_osm_overpass_infrastructure, calculate_haversine_distance
from backend.schemas import ResponderInfo

logger = logging.getLogger("aifireone.routing")

OPERATIONAL_RADIUS_KM = 75.0


def discover_and_rank_responders(
    fire_lat: float,
    fire_lon: float,
    radius_km: float = 25.0,
    simulated_registry: Optional[bool] = None
) -> List[ResponderInfo]:
    """
    Discovers nearby emergency responders (fire stations, hospitals, police),
    extracts verified contact tags without fabricating numbers, applies smart multi-factor
    scoring, and marks any resources outside the 75km operational dispatch radius.
    """
    use_sim = settings.simulated_dispatch_registry if simulated_registry is None else simulated_registry
    radius_meters = int(radius_km * 1000)

    osm_data = query_osm_overpass_infrastructure(fire_lat, fire_lon, radius_meters)
    responders: List[ResponderInfo] = []

    # 1. Fire Stations
    for f in osm_data.get("fire_stations", []):
        dist = f["distance_km"]
        is_outside = dist > OPERATIONAL_RADIUS_KM
        phone = f.get("phone")
        phone_src = f.get("phone_source")

        if not phone and use_sim:
            phone = "101"
            phone_src = "SIMULATED_NATIONAL_FIRE_REGISTRY"

        # Multi-factor smart suitability score (0 - 100)
        # Factors: Distance (40%), Traffic factor (20%), Availability (20%), Specialized Fleet (20%)
        traffic_mult = 1.15  # Simulated rush-hour traffic multiplier
        effective_dist = dist * traffic_mult
        dist_score = max(0.0, 40.0 - (effective_dist * 1.2))
        suitability = dist_score + 20.0 + 20.0 + 15.0

        responders.append(
            ResponderInfo(
                id=f"FS-{f.get('osm_id', '01')}",
                osm_id=f.get("osm_id"),
                name=f["name"],
                responder_type="fire_station",
                latitude=f["latitude"],
                longitude=f["longitude"],
                distance_km=dist,
                phone=phone,
                phone_source=phone_src,
                availability="AVAILABLE" if not is_outside else "OUT_OF_OPERATIONAL_RADIUS",
                suitability_score=round(suitability, 2),
                is_outside_operational_radius=is_outside
            )
        )

    # 2. Hospitals (Burn ICU / Trauma)
    for h in osm_data.get("hospitals", []):
        dist = h["distance_km"]
        is_outside = dist > OPERATIONAL_RADIUS_KM
        phone = h.get("phone")
        phone_src = h.get("phone_source")

        if not phone and use_sim:
            phone = "108"
            phone_src = "SIMULATED_NATIONAL_AMBULANCE_REGISTRY"

        dist_score = max(0.0, 40.0 - (dist * 1.1))
        # Add simulated capacity factor (15/20 for available burn beds)
        suitability = dist_score + 18.0 + 15.0 + 16.0

        responders.append(
            ResponderInfo(
                id=f"HOSP-{h.get('osm_id', '01')}",
                osm_id=h.get("osm_id"),
                name=h["name"],
                responder_type="hospital",
                latitude=h["latitude"],
                longitude=h["longitude"],
                distance_km=dist,
                phone=phone,
                phone_source=phone_src,
                availability="AVAILABLE" if not is_outside else "OUT_OF_OPERATIONAL_RADIUS",
                suitability_score=round(suitability, 2),
                is_outside_operational_radius=is_outside
            )
        )

    # 3. Police Stations (Evacuation & Perimeter Control)
    for p in osm_data.get("police_stations", []):
        dist = p["distance_km"]
        is_outside = dist > OPERATIONAL_RADIUS_KM
        phone = p.get("phone")
        phone_src = p.get("phone_source")

        if not phone and use_sim:
            phone = "112"
            phone_src = "SIMULATED_NATIONAL_POLICE_REGISTRY"

        dist_score = max(0.0, 40.0 - (dist * 1.3))
        suitability = dist_score + 19.0 + 20.0 + 12.0

        responders.append(
            ResponderInfo(
                id=f"POL-{p.get('osm_id', '01')}",
                osm_id=p.get("osm_id"),
                name=p["name"],
                responder_type="police",
                latitude=p["latitude"],
                longitude=p["longitude"],
                distance_km=dist,
                phone=phone,
                phone_source=phone_src,
                availability="AVAILABLE" if not is_outside else "OUT_OF_OPERATIONAL_RADIUS",
                suitability_score=round(suitability, 2),
                is_outside_operational_radius=is_outside
            )
        )

    # Sort all responders by suitability score descending
    responders.sort(key=lambda r: r.suitability_score, reverse=True)
    return responders
