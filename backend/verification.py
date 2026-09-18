"""
AI Fire One - Module 7: Anti-Hallucination / Safety Gate
Deterministic Verification Gateway
Core Principle: AI does not independently decide that an emergency exists.
"""

import logging
from datetime import datetime
from typing import List, Optional
from backend.config import settings
from backend.schemas import VerificationGateResult

logger = logging.getLogger("aifireone.verification_gate")


def evaluate_safety_gateway(
    lat: float,
    lon: float,
    ml_confidence: float,
    historical_corroborated: bool,
    satellite_confirmed: bool,
    camera_confirmed: bool,
    osm_proximity_confirmed: bool,
    min_confidence_threshold: Optional[float] = None
) -> VerificationGateResult:
    """
    Deterministic Safety Gateway.
    Evaluates 4 critical validation criteria:
      1. Valid Geographic Coordinates (-90 <= lat <= 90 and -180 <= lon <= 180)
      2. ML Confidence Threshold (> 85.0%)
      3. Historical Thermal Corroboration (Baseline Anomaly or Verified Persistence)
      4. Multi-Source Independent Corroboration (At least 2 independent supporting sources)
    """
    threshold = min_confidence_threshold if min_confidence_threshold is not None else settings.min_ml_confidence
    reason_codes: List[str] = []

    # 1. Geographic Coordinate Validity
    valid_coords = (-90.0 <= lat <= 90.0) and (-180.0 <= lon <= 180.0)
    if not valid_coords:
        reason_codes.append("INVALID_GEOGRAPHIC_COORDINATES")

    # 2. ML Confidence Gate
    ml_passed = ml_confidence >= threshold
    if not ml_passed:
        reason_codes.append(f"LOW_MODEL_CONFIDENCE (Obtained: {ml_confidence:.1f}%, Required: >={threshold:.1f}%)")

    # 3. Historical Baseline Corroboration
    if not historical_corroborated:
        reason_codes.append("INSUFFICIENT_HISTORICAL_CORROBORATION")

    # 4. Multi-Source Independent Supporting Evidence
    # Sources: Satellite Thermal, Camera Stream Optical, OSM Proximity
    independent_sources_count = sum([
        1 if satellite_confirmed else 0,
        1 if camera_confirmed else 0,
        1 if osm_proximity_confirmed else 0
    ])

    if independent_sources_count < 2:
        reason_codes.append("NO_INDEPENDENT_SUPPORTING_EVIDENCE (Requires >= 2 independent sensor/spatial channels)")

    # Final Deterministic Gate
    verified = valid_coords and ml_passed and historical_corroborated and (independent_sources_count >= 2)

    if verified:
        status = "VERIFIED"
    elif not valid_coords or ml_confidence < 50.0:
        status = "REJECTED"
    else:
        status = "PENDING_VERIFICATION"

    logger.info("Safety Gate evaluated for (%.4f, %.4f): status=%s, verified=%s", lat, lon, status, verified)

    return VerificationGateResult(
        verified=verified,
        status=status,
        confidence=round(ml_confidence, 2),
        reason_codes=reason_codes,
        satellite_confirmed=satellite_confirmed,
        historical_confirmed=historical_corroborated,
        camera_confirmed=camera_confirmed,
        osm_proximity_confirmed=osm_proximity_confirmed,
        evaluated_at=datetime.utcnow().isoformat()
    )
