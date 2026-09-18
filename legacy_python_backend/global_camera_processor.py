"""
AI Fire One - Module 2: Global Camera / CCTV Validation
Secondary Visual-Validation Layer
"""

import os
import math
import logging
from typing import List, Optional
import requests
from backend.config import settings
from backend.schemas import CameraFeedInfo

logger = logging.getLogger("aifireone.camera_discovery")


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance in kilometers between two coordinate pairs."""
    r = 6371.0  # Earth mean radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def fetch_global_cameras_near_coords(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0
) -> List[CameraFeedInfo]:
    """
    Queries configured global camera provider/aggregator within radius_km.
    If GLOBAL_WEBCAM_API_KEY is configured and live endpoint is reachable, queries the provider.
    Otherwise, provides clearly labeled simulation mode with test camera metadata.
    """
    api_key = settings.global_webcam_api_key

    if api_key and len(api_key.strip()) > 5:
        # Example legitimate integration for Windy Webcams or EarthCam API
        try:
            url = f"https://api.windy.com/api/webcams/v2/list/nearby={latitude},{longitude},{radius_km}"
            headers = {"x-windy-key": api_key}
            resp = requests.get(url, headers=headers, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                webcams = data.get("result", {}).get("webcams", [])
                cameras = []
                for w in webcams:
                    loc = w.get("location", {})
                    cam_lat = loc.get("latitude", latitude)
                    cam_lon = loc.get("longitude", longitude)
                    cameras.append(
                        CameraFeedInfo(
                            camera_id=str(w.get("id")),
                            name=w.get("title", "Regional Traffic/Public Camera"),
                            latitude=cam_lat,
                            longitude=cam_lon,
                            live_stream_url=w.get("player", {}).get("day", {}).get("embed", "https://player.windy.com/live"),
                            source="LIVE_WINDY_WEBCAM_API",
                            is_simulated=False,
                            fire_pixel_density=0.0,
                            fire_detected=False
                        )
                    )
                if cameras:
                    logger.info("Retrieved %d live cameras from external camera aggregator", len(cameras))
                    return cameras
        except Exception as err:
            logger.warning("External camera provider query failed: %s. Reverting to demonstration registry.", str(err))

    # Clearly labeled simulation mode using realistic localized surveillance feeds
    logger.info("Using simulated camera registry for coordinates (%.4f, %.4f)", latitude, longitude)
    return _generate_simulated_camera_metadata(latitude, longitude, radius_km)


def _generate_simulated_camera_metadata(
    lat: float,
    lon: float,
    radius_km: float
) -> List[CameraFeedInfo]:
    """Returns clearly labeled simulated camera feeds surrounding the specified point."""
    cams = [
        CameraFeedInfo(
            camera_id="CAM-SIM-01-PERIMETER",
            name="Industrial Corridor Perimeter Mast #1",
            latitude=lat + 0.0035,
            longitude=lon - 0.0028,
            live_stream_url="rtsp://simulated-cctv.local/stream/perim_01.sdp",
            source="SIMULATED_TEST_CAMERA_FEED",
            is_simulated=True,
            fire_pixel_density=0.184,
            fire_detected=True
        ),
        CameraFeedInfo(
            camera_id="CAM-SIM-02-FLARESTACK",
            name="Flare Stack & Processing Unit Optical Tracker",
            latitude=lat - 0.0022,
            longitude=lon + 0.0031,
            live_stream_url="rtsp://simulated-cctv.local/stream/flare_02.sdp",
            source="SIMULATED_TEST_CAMERA_FEED",
            is_simulated=True,
            fire_pixel_density=0.092,
            fire_detected=False
        ),
        CameraFeedInfo(
            camera_id="CAM-SIM-03-HIGHWAY",
            name="State Highway Approaching Sector Junction",
            latitude=lat + 0.0080,
            longitude=lon + 0.0065,
            live_stream_url="rtsp://simulated-cctv.local/stream/highway_03.sdp",
            source="SIMULATED_TEST_CAMERA_FEED",
            is_simulated=True,
            fire_pixel_density=0.004,
            fire_detected=False
        )
    ]
    # Filter by radius_km
    return [c for c in cams if calculate_haversine_distance(lat, lon, c.latitude, c.longitude) <= radius_km]
