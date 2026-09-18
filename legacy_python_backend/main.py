"""
AI Fire One - Module 15: FastAPI Application Server
Smart India Hackathon 2026 - Problem Statement 162 (NTRO)
Evidence-Driven Disaster Management & Emergency Response Pipeline
"""

import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db, engine, Base
from backend.models import ActiveFire, FirePrediction, ResponderRegistry, DispatchLog
from backend.schemas import (
    Coordinates,
    SatelliteFirePoint,
    FireClassificationOutput,
    VerificationGateResult,
    FireSpreadRequest,
    FireSpreadGeoJSON,
    ResponderInfo,
    DispatchTriggerRequest,
    DispatchTriggerResponse,
    CameraFeedInfo,
    CameraStreamProcessRequest,
    CameraStreamProcessResponse
)
from backend.ingestion import fetch_satellite_fire_points
from backend.global_camera_processor import fetch_global_cameras_near_coords
from backend.camera_processor import initialize_camera_stream
from backend.osm_service import query_osm_overpass_infrastructure
from backend.classifier import classifier_instance
from backend.baseline import baseline_engine
from backend.fire_spread import predict_60min_fire_spread
from backend.routing import discover_and_rank_responders
from backend.dispatch import trigger_emergency_voice_call
from backend.verification import evaluate_safety_gateway

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("aifireone.main")

# Initialize database schema if possible
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning("Database schema auto-creation skipped or deferred: %s", str(e))

app = FastAPI(
    title="AI Fire One API - SIH 2026 (NTRO Problem Statement 162)",
    description=(
        "Geospatial Early-Warning and Emergency-Response Prototype. "
        "Pipeline: Satellite/Camera Data -> Multi-Source Verification -> "
        "AI Classification -> Historical Baseline -> Safety Gate -> "
        "Fire Spread Prediction -> Responder Discovery -> Dynamic Dispatch."
    ),
    version="1.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store for immediate prototype demo speed
in_memory_fires: Dict[str, Dict[str, Any]] = {}


# ==========================================
# 1. HEALTH AND DIAGNOSTICS
# ==========================================
@app.get("/health", tags=["System"])
def health_check():
    """System health check and environmental capability disclosure."""
    return {
        "status": "HEALTHY",
        "service": "AI Fire One Disaster Response Pipeline",
        "version": "1.0.0",
        "sih_problem_statement": "SIH-162-NTRO",
        "demo_mode": settings.demo_mode,
        "firms_key_configured": bool(settings.nasa_firms_api_key),
        "webcam_key_configured": bool(settings.global_webcam_api_key),
        "twilio_configured": bool(settings.twilio_account_sid and settings.twilio_phone_number),
        "timestamp": datetime.utcnow().isoformat()
    }


# ==========================================
# 2. SATELLITE FIRE DATA INGESTION
# ==========================================
@app.post("/fires/ingest", response_model=List[Dict[str, Any]], tags=["Ingestion & Pipeline"])
def ingest_fire_points(
    source: str = Query("VIIRS_NOAA21_NRT", description="FIRMS sensor product"),
    bbox: Optional[str] = Query(None, description="Optional bounding box 'minLon,minLat,maxLon,maxLat'"),
    days: int = Query(1, ge=1, le=10)
):
    """
    Ingests near-real-time satellite thermal anomaly points from NASA FIRMS.
    Normalizes coordinates, runs multi-source corroboration, AI classification,
    and applies the deterministic safety gate.
    """
    raw_points = fetch_satellite_fire_points(source=source, area_bbox=bbox, days=days)
    results = []

    for pt in raw_points:
        fire_id = f"FIRE-{uuid.uuid4().hex[:8].upper()}"

        # 1. OSM Infrastructure context
        osm_context = query_osm_overpass_infrastructure(pt.latitude, pt.longitude, radius_meters=4000)
        nearest_ind_km = osm_context.get("nearest_industrial_distance_km") or 15.0

        # 2. Historical Baseline Evaluation
        baseline_res = baseline_engine.evaluate_baseline(
            pt.latitude, pt.longitude, pt.frp, pt.brightness_temperature
        )

        # 3. Camera optical corroboration
        cameras = fetch_global_cameras_near_coords(pt.latitude, pt.longitude, radius_km=5.0)
        camera_detected = any(c.fire_detected for c in cameras)

        # 4. AI Fire Classification
        classification = classifier_instance.predict_fire_class(
            fire_id=fire_id,
            confidence=pt.confidence,
            brightness_temp=pt.brightness_temperature,
            frp=pt.frp,
            industrial_dist_km=nearest_ind_km,
            historical_persistence=baseline_res.persistence_score,
            land_cover_class="Industrial" if nearest_ind_km < 2.0 else "Forest",
            camera_fire_evidence=camera_detected
        )

        # 5. Deterministic Safety Gate (Module 7)
        gate_result = evaluate_safety_gateway(
            lat=pt.latitude,
            lon=pt.longitude,
            ml_confidence=classification.confidence,
            historical_corroborated=baseline_res.anomaly_detected or baseline_res.persistence_score > 0.6,
            satellite_confirmed=(pt.confidence >= 50 and pt.frp >= settings.min_frp_mw),
            camera_confirmed=camera_detected,
            osm_proximity_confirmed=(nearest_ind_km < 3.5)
        )

        fire_record = {
            "fire_id": fire_id,
            "latitude": pt.latitude,
            "longitude": pt.longitude,
            "acquisition_date": pt.acquisition_date,
            "acquisition_time": pt.acquisition_time,
            "satellite": pt.satellite,
            "instrument": pt.instrument,
            "confidence": pt.confidence,
            "brightness_temperature": pt.brightness_temperature,
            "frp": pt.frp,
            "source": pt.source,
            "classification": classification.dict(),
            "baseline": baseline_res.dict(),
            "verification_gateway": gate_result.dict(),
            "status": gate_result.status,
            "nearest_industrial_distance_km": nearest_ind_km,
            "cameras_count": len(cameras),
            "camera_confirmed": camera_detected,
            "created_at": datetime.utcnow().isoformat()
        }

        in_memory_fires[fire_id] = fire_record
        results.append(fire_record)

    return results


# ==========================================
# 3. FIRE RETRIEVAL & VERIFICATION
# ==========================================
@app.get("/fires", tags=["Fires"])
def list_active_fires(status_filter: Optional[str] = None):
    """Retrieves all active fire incidents with applied verification statuses."""
    all_fires = list(in_memory_fires.values())
    if not all_fires:
        # Auto-ingest benchmark data if store is empty
        all_fires = ingest_fire_points()
    if status_filter:
        return [f for f in all_fires if f["status"] == status_filter.upper()]
    return all_fires


@app.get("/fires/{fire_id}", tags=["Fires"])
def get_fire_by_id(fire_id: str):
    """Retrieves detailed fire record including full auditability evidence trace."""
    if fire_id not in in_memory_fires:
        raise HTTPException(status_code=404, detail="Fire event not found")
    return in_memory_fires[fire_id]


@app.post("/fires/verify", response_model=VerificationGateResult, tags=["Verification & Safety Gate"])
def manual_verify_fire(
    latitude: float,
    longitude: float,
    ml_confidence: float,
    historical_corroborated: bool = True,
    camera_confirmed: bool = False,
    osm_proximity_confirmed: bool = True
):
    """Directly tests the deterministic safety verification gateway."""
    return evaluate_safety_gateway(
        lat=latitude,
        lon=longitude,
        ml_confidence=ml_confidence,
        historical_corroborated=historical_corroborated,
        satellite_confirmed=True,
        camera_confirmed=camera_confirmed,
        osm_proximity_confirmed=osm_proximity_confirmed
    )


# ==========================================
# 4. FIRE SPREAD PREDICTION
# ==========================================
@app.post("/fires/{fire_id}/predict-spread", response_model=Dict[str, Any], tags=["Predictive Simulation"])
def predict_fire_spread_for_incident(
    fire_id: str,
    params: FireSpreadRequest
):
    """
    Generates a 60-minute danger-zone polygon based on environmental parameters
    and wind vectors using the elliptical forward propagation model.
    """
    result = predict_60min_fire_spread(
        lat=params.initial_latitude,
        lon=params.initial_longitude,
        wind_velocity_kmh=params.wind_velocity_kmh,
        wind_direction_degrees=params.wind_direction_degrees,
        ambient_temperature=params.ambient_temperature,
        relative_humidity=params.relative_humidity,
        frp=params.frp
    )
    return result


# ==========================================
# 5. RESPONDERS & ROUTING
# ==========================================
@app.get("/responders/nearby", response_model=List[ResponderInfo], tags=["Emergency Responders"])
def get_nearby_responders(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(25.0, ge=1.0, le=100.0)
):
    """
    Discovers nearby emergency responders (fire stations, hospitals, police)
    using OSM infrastructure queries and calculates multi-factor suitability scores.
    """
    return discover_and_rank_responders(latitude, longitude, radius_km=radius_km)


# ==========================================
# 6. AUTOMATED TWILIO DISPATCH
# ==========================================
@app.post("/dispatch/test", response_model=DispatchTriggerResponse, tags=["Dispatch"])
def trigger_dispatch_test(request: DispatchTriggerRequest):
    """
    Executes an emergency dispatch broadcast payload using the Twilio voice integration
    or simulated registry, producing TwiML voice scripts.
    """
    return trigger_emergency_voice_call(
        responder_phone=request.responder_phone,
        fire_type=request.fire_type,
        coordinates=request.coordinates,
        simulated=request.simulated
    )


# ==========================================
# 7. CAMERAS & STREAM PROCESSOR
# ==========================================
@app.get("/cameras/nearby", response_model=List[CameraFeedInfo], tags=["Camera Validation"])
def get_cameras_near_point(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(5.0)
):
    """Discovers nearby surveillance or public cameras for optical corroboration."""
    return fetch_global_cameras_near_coords(latitude, longitude, radius_km=radius_km)


@app.post("/camera/process-stream", response_model=Dict[str, Any], tags=["Camera Validation"])
def process_camera_stream_endpoint(payload: CameraStreamProcessRequest):
    """Processes an RTSP/video stream using downsampled frames and HSV fire pixel detection."""
    return initialize_camera_stream(
        stream_url=payload.stream_url,
        target_fps=1.0,
        max_duration_seconds=payload.sample_duration_seconds
    )


# ==========================================
# 8. ANALYTICS SUMMARY
# ==========================================
@app.get("/analytics/summary", tags=["Analytics"])
def get_analytics_summary():
    """Returns real-time KPIs and distribution metrics across ingested events."""
    fires = list(in_memory_fires.values())
    if not fires:
        fires = ingest_fire_points()

    total = len(fires)
    verified = sum(1 for f in fires if f["status"] == "VERIFIED")
    pending = sum(1 for f in fires if f["status"] == "UNDER_VERIFICATION" or f["status"] == "DETECTED")
    rejected = sum(1 for f in fires if f["status"] == "REJECTED")

    classes_count: Dict[str, int] = {}
    for f in fires:
        cls_name = f.get("classification", {}).get("predicted_class", "Other")
        classes_count[cls_name] = classes_count.get(cls_name, 0) + 1

    return {
        "kpis": {
            "total_events": total,
            "verified_fires": verified,
            "pending_verification": pending,
            "rejected_alarms": rejected,
            "operational_mode": "DEMO_SIMULATION" if settings.demo_mode else "LIVE_CONNECTED"
        },
        "classification_breakdown": classes_count,
        "verification_rate_pct": round((verified / total * 100.0), 1) if total > 0 else 0.0,
        "generated_at": datetime.utcnow().isoformat()
    }
