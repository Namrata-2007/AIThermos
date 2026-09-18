"""
AI Fire One - Configuration Module
Smart India Hackathon 2026 - Problem Statement 162 (NTRO)
Manages environment variables, API keys, and operational modes.
"""

import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class AppConfig(BaseModel):
    # NASA FIRMS API Credentials
    nasa_firms_api_key: str = Field(
        default_factory=lambda: os.getenv("NASA_FIRMS_API_KEY", "")
    )

    # Global Camera / Webcam API Credentials
    global_webcam_api_key: str = Field(
        default_factory=lambda: os.getenv("GLOBAL_WEBCAM_API_KEY", "")
    )

    # Twilio Emergency Voice & SMS Credentials
    twilio_account_sid: str = Field(
        default_factory=lambda: os.getenv("TWILIO_ACCOUNT_SID", "")
    )
    twilio_auth_token: str = Field(
        default_factory=lambda: os.getenv("TWILIO_AUTH_TOKEN", "")
    )
    twilio_phone_number: str = Field(
        default_factory=lambda: os.getenv("TWILIO_PHONE_NUMBER", "")
    )

    # Database Configuration (PostgreSQL + PostGIS)
    database_url: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aifireone"
        )
    )

    # OSM Overpass Public API Endpoint
    overpass_url: str = Field(
        default_factory=lambda: os.getenv(
            "OVERPASS_URL", "https://overpass-api.de/api/interpreter"
        )
    )

    # Operational Demonstration Toggles
    demo_mode: bool = Field(
        default_factory=lambda: os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    )
    simulated_dispatch_registry: bool = Field(
        default_factory=lambda: os.getenv("SIMULATED_DISPATCH_REGISTRY", "true").lower() in ("true", "1", "yes")
    )

    # Safety Gate Parameters (Deterministic Anti-Hallucination)
    min_ml_confidence: float = 85.0
    min_frp_mw: float = 5.0
    operational_dispatch_radius_km: float = 75.0
    camera_fire_pixel_threshold: float = 0.15


settings = AppConfig()
