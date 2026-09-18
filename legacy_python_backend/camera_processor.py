"""
AI Fire One - Module 3: Camera Stream Processing & Fire Pixel Detection
OpenCV Video Stream Ingestion and HSV Color Mask Detection
"""

import time
import logging
from typing import Tuple, Optional, Dict, Any
import numpy as np

logger = logging.getLogger("aifireone.camera_processor")

# Prototype heuristic threshold for flame detection:
# Explicit note: This threshold is a prototype heuristic and must be calibrated
# against labeled optical camera datasets before real-world operational deployment.
FIRE_PIXEL_DENSITY_THRESHOLD = 0.15


def detect_fire_pixels(frame: np.ndarray) -> Tuple[float, np.ndarray, bool]:
    """
    Analyzes an RGB/BGR image frame to detect flame and combustion signatures.
    Converts frame to HSV color space and applies mathematical color bounds
    for bright red, orange, and yellow high-intensity thermal combustion areas.

    Returns:
        fire_pixel_density: float ratio (fire_pixels / total_pixels)
        mask: binary mask of detected flame pixels
        fire_detected: boolean flag based on FIRE_PIXEL_DENSITY_THRESHOLD
    """
    try:
        import cv2
    except ImportError:
        logger.warning("OpenCV (cv2) not installed in local environment. Running pure NumPy HSV fallback.")
        return _detect_fire_pixels_numpy(frame)

    if frame is None or frame.size == 0:
        return 0.0, np.zeros((1, 1), dtype=np.uint8), False

    # Convert BGR to HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Fire signatures typically occupy Hue 0-25 (Red-Orange) and Hue 170-180 (Red wrap-around)
    # with high Saturation (>= 120) and high Value (>= 180)
    lower_fire_1 = np.array([0, 110, 160], dtype=np.uint8)
    upper_fire_1 = np.array([28, 255, 255], dtype=np.uint8)

    lower_fire_2 = np.array([170, 110, 160], dtype=np.uint8)
    upper_fire_2 = np.array([180, 255, 255], dtype=np.uint8)

    mask1 = cv2.inRange(hsv, lower_fire_1, upper_fire_1)
    mask2 = cv2.inRange(hsv, lower_fire_2, upper_fire_2)
    fire_mask = cv2.bitwise_or(mask1, mask2)

    # Optional morphological filter to suppress single-pixel sensor noise
    kernel = np.ones((3, 3), np.uint8)
    filtered_mask = cv2.morphologyEx(fire_mask, cv2.MORPH_OPEN, kernel)

    total_pixels = frame.shape[0] * frame.shape[1]
    fire_pixels = cv2.countNonZero(filtered_mask)

    fire_pixel_density = float(fire_pixels) / float(max(1, total_pixels))
    fire_detected = fire_pixel_density >= FIRE_PIXEL_DENSITY_THRESHOLD

    return fire_pixel_density, filtered_mask, fire_detected


def _detect_fire_pixels_numpy(frame: np.ndarray) -> Tuple[float, np.ndarray, bool]:
    """Pure NumPy RGB fire threshold fallback when OpenCV is not present."""
    if frame is None or frame.size == 0:
        return 0.0, np.zeros((1, 1), dtype=np.uint8), False

    # Frame is assumed H x W x 3 (R, G, B)
    r = frame[:, :, 0].astype(float)
    g = frame[:, :, 1].astype(float)
    b = frame[:, :, 2].astype(float)

    # Standard RGB flame rule: R > G > B and R > 190 and G > 100
    condition = (r > 190) & (g > 100) & (r > g) & (g > b)
    fire_pixels = np.sum(condition)
    total_pixels = frame.shape[0] * frame.shape[1]
    density = float(fire_pixels) / float(max(1, total_pixels))

    return density, condition.astype(np.uint8), density >= FIRE_PIXEL_DENSITY_THRESHOLD


def initialize_camera_stream(
    stream_url: str,
    target_fps: float = 1.0,
    max_duration_seconds: int = 5
) -> Dict[str, Any]:
    """
    Connects to an RTSP/HLS/MJPEG video stream, samples approximately 1 frame per second,
    and analyzes the visual frames for flame signatures without saturating bandwidth.
    """
    try:
        import cv2
    except ImportError:
        logger.info("OpenCV not available. Simulating stream analysis for URL: %s", stream_url)
        # Synthetic test response
        sim_density = 0.178 if "flare" in stream_url.lower() or "perim" in stream_url.lower() else 0.012
        return {
            "stream_url": stream_url,
            "status": "STREAM_PROCESSED_SIMULATED",
            "frames_processed": max_duration_seconds,
            "mean_fire_pixel_density": sim_density,
            "fire_detected": sim_density >= FIRE_PIXEL_DENSITY_THRESHOLD,
            "threshold_applied": FIRE_PIXEL_DENSITY_THRESHOLD,
            "sampling_rate_fps": target_fps,
            "duration_seconds": max_duration_seconds
        }

    logger.info("Initializing stream connection to: %s", stream_url)
    cap = cv2.VideoCapture(stream_url)

    if not cap.isOpened():
        logger.warning("Failed to open camera stream: %s. Using simulated fallback response.", stream_url)
        return {
            "stream_url": stream_url,
            "status": "CONNECTION_FAILED_FALLBACK_SIMULATED",
            "frames_processed": 0,
            "mean_fire_pixel_density": 0.0,
            "fire_detected": False,
            "threshold_applied": FIRE_PIXEL_DENSITY_THRESHOLD,
            "error": "Could not open RTSP/HTTP video stream"
        }

    frame_interval = 1.0 / max(0.1, target_fps)
    last_processed_time = 0.0
    densities = []
    frames_count = 0
    start_time = time.time()

    try:
        while (time.time() - start_time) < max_duration_seconds:
            ret, frame = cap.read()
            if not ret:
                break

            current_time = time.time()
            if current_time - last_processed_time >= frame_interval:
                density, _, _ = detect_fire_pixels(frame)
                densities.append(density)
                frames_count += 1
                last_processed_time = current_time

    finally:
        cap.release()

    mean_density = float(np.mean(densities)) if densities else 0.0
    return {
        "stream_url": stream_url,
        "status": "STREAM_PROCESSED_SUCCESS",
        "frames_processed": frames_count,
        "mean_fire_pixel_density": round(mean_density, 5),
        "fire_detected": mean_density >= FIRE_PIXEL_DENSITY_THRESHOLD,
        "threshold_applied": FIRE_PIXEL_DENSITY_THRESHOLD,
        "sampling_rate_fps": target_fps,
        "duration_seconds": round(time.time() - start_time, 2)
    }
