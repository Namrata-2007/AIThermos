"""
AI Fire One - Database ORM Models
PostgreSQL + PostGIS Schema (Module 16)
"""

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey
)
from sqlalchemy.sql import func
from backend.database import Base


class ActiveFire(Base):
    __tablename__ = "active_fires"

    id = Column(String(64), primary_key=True, index=True)
    source = Column(String(32), nullable=False)  # VIIRS_NOAA21, MODIS, SATELLITE_LIVE
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    detected_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    fire_class = Column(String(64), nullable=True)  # Industrial, Wildfire, False Alarm
    confidence = Column(Float, nullable=False)
    frp = Column(Float, nullable=False)  # Fire Radiative Power (MW)
    brightness_temperature = Column(Float, nullable=True)  # Kelvin
    historical_persistence = Column(Float, nullable=True)  # Score 0.0 - 1.0
    verification_status = Column(String(32), nullable=False, default="DETECTED")  # DETECTED, VERIFIED, REJECTED, DISPATCHED
    industrial_distance_m = Column(Float, nullable=True)
    country = Column(String(64), nullable=True)
    region = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FirePrediction(Base):
    __tablename__ = "fire_predictions"

    id = Column(String(64), primary_key=True, index=True)
    fire_id = Column(String(64), ForeignKey("active_fires.id"), nullable=False, index=True)
    predicted_polygon_geojson = Column(Text, nullable=False)
    horizon_minutes = Column(Integer, default=60)
    wind_velocity_kmh = Column(Float, nullable=False)
    wind_direction_degrees = Column(Float, nullable=False)
    ambient_temperature = Column(Float, nullable=False)
    relative_humidity = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ResponderRegistry(Base):
    __tablename__ = "responder_registry"

    id = Column(String(64), primary_key=True, index=True)
    osm_id = Column(String(64), nullable=True)
    responder_type = Column(String(32), nullable=False)  # fire_station, hospital, police
    name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    phone = Column(String(32), nullable=True)
    phone_source = Column(String(32), nullable=True)  # OSM_TAG, SIMULATED_REGISTRY, OFFICIAL_DIRECTORY
    availability = Column(String(32), default="AVAILABLE")
    country = Column(String(64), nullable=True)
    region = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DispatchLog(Base):
    __tablename__ = "dispatch_logs"

    id = Column(String(64), primary_key=True, index=True)
    fire_id = Column(String(64), ForeignKey("active_fires.id"), nullable=False, index=True)
    responder_id = Column(String(64), nullable=False)
    communication_method = Column(String(32), nullable=False)  # TWILIO_VOICE, TWILIO_SMS, WEBHOOK
    twilio_request_id = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False)  # INITIATED, DELIVERED, FAILED, ACKNOWLEDGED
    twiml_payload = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    error = Column(Text, nullable=True)
