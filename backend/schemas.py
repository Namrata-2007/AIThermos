"""
AI Fire One - Data Schemas Module (Pydantic)
SIH Problem Statement 162 - NTRO
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")


class SatelliteFirePoint(BaseModel):
    latitude: float
    longitude: float
    acquisition_date: str
    acquisition_time: str
    satellite: str
    instrument: str
    confidence: float
    brightness_temperature: float
    frp: float
    day_night: str
    source: str


class CameraFeedInfo(BaseModel):
    camera_id: str
    name: str
    latitude: float
    longitude: float
    live_stream_url: str
    source: str
    is_simulated: bool
    fire_pixel_density: Optional[float] = None
    fire_detected: Optional[bool] = None


class CameraStreamProcessRequest(BaseModel):
    stream_url: str
    sample_duration_seconds: int = Field(default=5, ge=1, le=30)
    hsv_threshold: float = Field(default=0.15, ge=0.01, le=1.0)


class CameraStreamProcessResponse(BaseModel):
    stream_url: str
    frames_processed: int
    fire_pixel_density: float
    fire_detected: boolean = Field(default=False)
    threshold_applied: float
    status: str
    processed_at: str


class MultiSourceEvidence(BaseModel):
    latitude: float
    longitude: float
    satellite_evidence: bool
    camera_evidence: Optional[bool] = None
    historical_persistence: Optional[float] = None
    land_cover: Optional[str] = None
    industrial_distance_m: Optional[float] = None


class FireClassificationOutput(BaseModel):
    fire_id: str
    predicted_class: str
    class_code: int  # 0: False Alarm, 1: Wildfire, 2: Industrial Fire
    confidence: float
    class_probabilities: Dict[str, float]
    model_version: str


class VerificationGateResult(BaseModel):
    verified: bool
    status: str  # VERIFIED, UNDER_VERIFICATION, REJECTED
    confidence: float
    reason_codes: List[str]
    satellite_confirmed: bool
    historical_confirmed: bool
    camera_confirmed: bool
    osm_proximity_confirmed: bool
    evaluated_at: str


class FireSpreadRequest(BaseModel):
    initial_latitude: float
    initial_longitude: float
    wind_velocity_kmh: float = Field(default=24.0, ge=0.0, le=200.0)
    wind_direction_degrees: float = Field(default=45.0, ge=0.0, le=360.0)
    ambient_temperature: float = Field(default=33.0, ge=-20.0, le=60.0)
    relative_humidity: float = Field(default=35.0, ge=1.0, le=100.0)
    frp: float = Field(default=30.0, ge=0.1)


class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]


class FireSpreadGeoJSON(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]


class ResponderInfo(BaseModel):
    id: str
    osm_id: Optional[str] = None
    name: str
    responder_type: str  # fire_station, hospital, police
    latitude: float
    longitude: float
    distance_km: float
    phone: Optional[str] = None
    phone_source: Optional[str] = None
    availability: str
    suitability_score: float
    is_outside_operational_radius: bool


class DispatchTriggerRequest(BaseModel):
    fire_id: str
    responder_id: str
    responder_phone: str
    fire_type: str
    coordinates: Coordinates
    simulated: bool = True


class DispatchTriggerResponse(BaseModel):
    success: bool
    request_id: str
    responder_name: str
    contact_phone: str
    communication_method: str
    status: str
    timestamp: str
    twiml_preview: str
    message: str


class HistoricalBaselineResult(BaseModel):
    baseline_available: bool
    historical_observations: int
    persistence_score: float
    anomaly_detected: bool
    mean_frp: float
    current_frp: float
