import { 
  ThermalEvent, 
  VerificationGateway, 
  VerificationStatus, 
  FireSpreadPolygon, 
  CameraFeed, 
  CountryEmergencyRouting 
} from '../types.ts';

// Configurable country-aware emergency routing table
export const COUNTRY_EMERGENCY_ROUTING: Record<string, CountryEmergencyRouting> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    fireNumber: '101',
    ambulanceNumber: '108',
    policeNumber: '112',
    unifiedEmergency: '112',
    disasterControlName: 'NDRF / State Emergency Operations Centre (SEOC)'
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    fireNumber: '911',
    ambulanceNumber: '911',
    policeNumber: '911',
    unifiedEmergency: '911',
    disasterControlName: 'FEMA / County Emergency Operations Center'
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    fireNumber: '999',
    ambulanceNumber: '999',
    policeNumber: '999',
    unifiedEmergency: '999',
    disasterControlName: 'HM Coastguard / Joint Emergency Services Interoperability'
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    fireNumber: '119',
    ambulanceNumber: '119',
    policeNumber: '110',
    unifiedEmergency: '119',
    disasterControlName: 'FDMA Disaster Management Command'
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    fireNumber: '000',
    ambulanceNumber: '000',
    policeNumber: '000',
    unifiedEmergency: '000',
    disasterControlName: 'State Emergency Service (SES) / RFS'
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    fireNumber: '112',
    ambulanceNumber: '112',
    policeNumber: '110',
    unifiedEmergency: '112',
    disasterControlName: 'Bundesamt für Bevölkerungsschutz und Katastrophenhilfe'
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    fireNumber: '193',
    ambulanceNumber: '192',
    policeNumber: '190',
    unifiedEmergency: '190',
    disasterControlName: 'Defesa Civil Nacional'
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    fireNumber: '997',
    ambulanceNumber: '998',
    policeNumber: '999',
    unifiedEmergency: '999',
    disasterControlName: 'National Emergency Crisis and Disaster Management (NCEMA)'
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    fireNumber: '995',
    ambulanceNumber: '995',
    policeNumber: '999',
    unifiedEmergency: '995',
    disasterControlName: 'Singapore Civil Defence Force (SCDF) Operations'
  }
};

export function getCountryRouting(countryCode?: string, countryName?: string): CountryEmergencyRouting {
  if (countryCode && COUNTRY_EMERGENCY_ROUTING[countryCode]) {
    return COUNTRY_EMERGENCY_ROUTING[countryCode];
  }
  if (countryName) {
    const found = Object.values(COUNTRY_EMERGENCY_ROUTING).find(
      c => c.countryName.toLowerCase() === countryName.toLowerCase()
    );
    if (found) return found;
  }
  // Default to universal international standard
  return {
    countryCode: 'INTL',
    countryName: 'International Regional Registry',
    fireNumber: '112',
    ambulanceNumber: '112',
    policeNumber: '112',
    unifiedEmergency: '112',
    disasterControlName: 'Designated Regional Emergency Command'
  };
}

/**
 * MODULE 7: ANTI-HALLUCINATION / SAFETY GATEWAY
 * An emergency alert can NEVER be generated purely on ML prediction.
 * Requires:
 * 1. Valid coordinates
 * 2. ML Confidence > 85%
 * 3. Historical thermal corroboration
 * 4. At least one independent corroborating evidence source (Camera or OSM proximity or Multi-satellite)
 */
export function evaluateVerificationGateway(
  event: Partial<ThermalEvent>,
  cameraDetected: boolean = false,
  mlConfidenceOverride?: number
): VerificationGateway {
  const reasonCodes: string[] = [];

  // 1. Coordinate Validation
  const validCoordinates = 
    typeof event.latitude === 'number' && 
    typeof event.longitude === 'number' &&
    !isNaN(event.latitude) && 
    !isNaN(event.longitude) &&
    event.latitude >= -90 && event.latitude <= 90 &&
    event.longitude >= -180 && event.longitude <= 180;

  if (!validCoordinates) {
    reasonCodes.push('INVALID_GEOGRAPHIC_COORDINATES');
  }

  // 2. ML Confidence Threshold (> 85.0%)
  const confidence = mlConfidenceOverride ?? event.classificationConfidence ?? 82.0;
  const mlConfidencePassed = confidence >= 85.0;
  if (!mlConfidencePassed) {
    reasonCodes.push('LOW_MODEL_CONFIDENCE (threshold > 85.0%)');
  }

  // 3. Historical Baseline Corroboration
  // If FRP is abnormal compared to baseline or persistent pattern exists
  const hasHistoricalBaseline = (event.historicalObservations && event.historicalObservations.length > 0) ||
    event.persistenceHours !== undefined;
  const frpEscalation = (event.frpTrendDelta ?? 0) > 15 || (event.frp ?? 0) > 40;
  const historicalCorroboration = Boolean(hasHistoricalBaseline && (frpEscalation || event.isRecurringSource));
  
  if (!historicalCorroboration) {
    reasonCodes.push('INSUFFICIENT_HISTORICAL_CORROBORATION');
  }

  // 4. Multi-Source Independent Evidence Sources
  const satelliteConfirmed = (event.confidence ?? 0) >= 50 && (event.frp ?? 0) > 5;
  const osmProximityConfirmed = (event.nearestIndustrialSite?.distanceKm ?? 999) <= 3.5 || 
    (event.distanceToRoadKm ?? 999) <= 1.0;
  const cameraConfirmed = cameraDetected || Boolean(event.nearbyCameras?.some(c => c.fireDetected));

  let independentEvidenceCount = 0;
  if (satelliteConfirmed) independentEvidenceCount++;
  if (osmProximityConfirmed) independentEvidenceCount++;
  if (cameraConfirmed) independentEvidenceCount++;

  if (independentEvidenceCount < 2) {
    reasonCodes.push('NO_INDEPENDENT_SUPPORTING_EVIDENCE (requires >= 2 corroborating channels)');
  }

  const verified = validCoordinates && mlConfidencePassed && historicalCorroboration && (independentEvidenceCount >= 2);
  
  let status: VerificationStatus = 'UNDER_VERIFICATION';
  if (verified) {
    status = 'VERIFIED';
  } else if (!validCoordinates || confidence < 60) {
    status = 'REJECTED';
  } else {
    status = 'UNDER_VERIFICATION';
  }

  return {
    verified,
    status,
    mlConfidence: confidence,
    mlConfidencePassed,
    historicalCorroboration,
    validCoordinates,
    independentEvidenceCount,
    satelliteConfirmed,
    historicalConfirmed: historicalCorroboration,
    cameraConfirmed,
    osmProximityConfirmed,
    reasonCodes,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * MODULE 9: MATHEMATICAL 60-MINUTE FIRE SPREAD PREDICTION MODEL
 * Elliptical wind-vector expansion model based on:
 * - wind velocity (km/h)
 * - wind direction (degrees, 0 = North, 90 = East)
 * - ambient temperature (°C)
 * - relative humidity (%)
 * 
 * Returns a valid GeoJSON Feature with a 60-minute danger zone Polygon
 */
export function calculateFireSpreadPolygon(
  lat: number,
  lon: number,
  params: {
    windSpeedKmh?: number;
    windDirectionDeg?: number;
    ambientTempC?: number;
    relativeHumidityPct?: number;
    frp?: number;
  } = {}
): FireSpreadPolygon {
  const windSpeed = params.windSpeedKmh ?? 24.0; // default 24 km/h
  const windDir = params.windDirectionDeg ?? 45.0; // blowing towards northeast
  const temp = params.ambientTempC ?? 33.5;
  const humidity = params.relativeHumidityPct ?? 32.0;
  const frp = params.frp ?? 35.0;

  // Environmental fire propagation acceleration factor
  // Lower humidity and higher temperature increase rate of spread (Rothermel formulation)
  const envMultiplier = (1 + (temp - 25) * 0.02) * (1 + (50 - humidity) * 0.015);
  const intensityFactor = Math.min(2.5, Math.max(0.8, 1 + (frp / 100)));

  // 60-minute forward reach in km
  // Base forward spread: wind speed * forward rate factor * environmental factors
  const forwardReachKm = Math.max(0.4, (windSpeed * 0.065 * envMultiplier * intensityFactor));
  // Backing reach against wind (much slower)
  const backingReachKm = Math.max(0.1, forwardReachKm * 0.18);
  // Crosswind lateral spread
  const flankReachKm = Math.max(0.2, forwardReachKm * 0.42);

  // Conversion: 1 degree latitude ~ 111.32 km
  // 1 degree longitude ~ 111.32 * cos(lat)
  const latKm = 111.32;
  const lonKm = 111.32 * Math.cos((lat * Math.PI) / 180);

  // Wind direction in radians (direction fire heads towards)
  const theta = (windDir * Math.PI) / 180;

  // Compute 24-point smooth ellipse oriented along wind vector
  const numPoints = 24;
  const coords: number[][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    // Standard ellipse coordinates: x = flank * cos(a), y = forward/backing * sin(a)
    const localX = flankReachKm * Math.cos(angle);
    // Asymmetric along y axis: forward reach in positive, backing in negative
    const localY = Math.sin(angle) >= 0 
      ? forwardReachKm * Math.sin(angle) 
      : backingReachKm * Math.sin(angle);

    // Rotate by wind direction
    const rotX = localX * Math.cos(theta) - localY * Math.sin(theta);
    const rotY = localX * Math.sin(theta) + localY * Math.cos(theta);

    // Convert km offsets to degrees
    const ptLat = lat + rotY / latKm;
    const ptLon = lon + rotX / lonKm;

    coords.push([ptLon, ptLat]); // GeoJSON standard: [longitude, latitude]
  }

  // Ensure closed ring
  coords[coords.length - 1] = coords[0];

  const approxAreaSqKm = Math.PI * forwardReachKm * flankReachKm * 0.75;

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    },
    properties: {
      prediction_horizon_minutes: 60,
      wind_velocity_kmh: windSpeed,
      wind_direction_degrees: windDir,
      ambient_temp_c: temp,
      relative_humidity_pct: humidity,
      area_sq_km: Number(approxAreaSqKm.toFixed(2)),
      downwind_reach_km: Number(forwardReachKm.toFixed(2)),
      crosswind_spread_km: Number(flankReachKm.toFixed(2)),
      generated_at: new Date().toISOString(),
      model_type: 'Elliptical Wind-Vector Spread (Prototype)'
    }
  };
}

/**
 * MODULE 2 & 3: CAMERA STREAM & HSV FIRE PIXEL PROCESSOR
 * Detects visual fire signatures (HSV color mask for bright orange/yellow/red)
 */
export function simulateCameraStreamProcess(
  lat: number,
  lon: number,
  locationName: string,
  isFireActive: boolean = true
): CameraFeed {
  // Prototype HSV mask result calculation:
  // In live OpenCV Python backend, cv2.inRange(hsv, lower_fire, upper_fire)
  // Calculates fire_pixel_density = fire_pixels / total_frame_pixels
  const fireDensity = isFireActive ? 0.18 + Math.random() * 0.12 : 0.01 + Math.random() * 0.03;
  const threshold = 0.15;
  const fireDetected = fireDensity >= threshold;

  return {
    cameraId: `CAM-OSM-${Math.floor(1000 + Math.random() * 9000)}`,
    name: `${locationName} Peripheral CCTV Unit`,
    latitude: lat + (Math.random() - 0.5) * 0.006,
    longitude: lon + (Math.random() - 0.5) * 0.006,
    streamUrl: `rtsp://simulated-cctv.local/live/ch_${Math.floor(100 + Math.random() * 900)}.stream`,
    isSimulated: true,
    source: 'Demonstration CCTV Feed (OpenCV Stream Processor)',
    firePixelDensity: Number(fireDensity.toFixed(4)),
    fireDetected,
    hsvThreshold: threshold,
    lastProcessedFrameTime: new Date().toISOString(),
    resolution: '1920x1080 @ 1 FPS (Downsampled)'
  };
}
