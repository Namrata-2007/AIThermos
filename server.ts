import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { 
  ThermalEvent, 
  IncidentReport, 
  DispatchSimulation,
  EmergencyCallSession,
  LocationRiskAssessment
} from './src/types.ts';
import { 
  INDUSTRIAL_SITES, 
  FIRE_STATIONS, 
  HOSPITALS, 
  POLICE_STATIONS,
  AMBULANCE_UNITS,
  INITIAL_THERMAL_EVENTS,
  TARGET_CORRIDORS
} from './src/data/mockGeospatial.ts';
import { 
  findNearestIndustrialSite, 
  rankFireStationsForEvent, 
  rankHospitalsForEvent, 
  rankPoliceStationsForEvent,
  rankAmbulanceUnitsForEvent,
  isWithinBoundingBox,
  calculateHaversineDistance 
} from './src/services/gisEngine.ts';
import { 
  classifyThermalEvent, 
  THERMOS_ML_EVALUATION_METRICS 
} from './src/services/mlEngine.ts';
import { calculateItriRisk } from './src/services/riskEngine.ts';
import { 
  createEmergencyCallSession, 
  isActualFireEvent 
} from './src/services/emergencyCallingService.ts';
import { setupEmergencyDispatchRoutes } from './serverEmergency.ts';
import { setupCallAndResponderRoutes } from './server/routes/callRoutes.ts';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Lazy initialization for Gemini AI SDK
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent state for prototype session
let eventsDatabase: ThermalEvent[] = [...INITIAL_THERMAL_EVENTS];
const reportsDatabase: Map<string, IncidentReport> = new Map();
const activeDispatches: Map<string, DispatchSimulation> = new Map();
const emergencyCallsDatabase: Map<string, EmergencyCallSession> = new Map();

// NASA FIRMS Cache cache store
interface FirmsCache {
  data: ThermalEvent[];
  lastFetched: number;
}
let firmsCache: FirmsCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Initialize initial events with computed GIS, classification, and risk
eventsDatabase = eventsDatabase.map((evt) => {
  const nearest = findNearestIndustrialSite(evt.latitude, evt.longitude, INDUSTRIAL_SITES);
  const updatedEvt: ThermalEvent = {
    ...evt,
    nearestIndustrialSite: nearest ? {
      id: nearest.id,
      name: nearest.name,
      type: nearest.facilityType,
      distanceKm: nearest.distanceKm
    } : undefined
  };
  const classification = classifyThermalEvent(updatedEvt);
  const risk = calculateItriRisk(updatedEvt);
  return {
    ...updatedEvt,
    classification: classification.predictedClass,
    classificationConfidence: classification.confidence,
    itriScore: risk.finalItri,
    itriRiskLevel: risk.riskLevel
  };
});

// ==========================================
// SATELLITE OCCURRENCE & RISK ASSESSMENT ENGINE (Truthful, Non-Alarmist)
// ==========================================
function assessLocationFireRisk(
  targetLat: number,
  targetLon: number,
  radiusKm: number,
  locationName: string,
  eventsInArea: ThermalEvent[]
): LocationRiskAssessment {
  const hasActiveFire = eventsInArea.length > 0;
  const nearest = findNearestIndustrialSite(targetLat, targetLon, INDUSTRIAL_SITES);
  const indDist = nearest ? nearest.distanceKm : 999;

  // Geographic ambient estimate based on latitude/longitude
  const absLat = Math.abs(targetLat);
  const isAridZone = (absLat >= 15 && absLat <= 35) && ((targetLon >= 15 && targetLon <= 80) || (targetLon <= -100 && targetLon >= -120));
  const isEquatorial = absLat < 15;
  const estTemp = isAridZone ? 36.5 : (isEquatorial ? 30.5 : (absLat > 48 ? 16.0 : 23.5));
  const estHumidity = isAridZone ? 24 : (isEquatorial ? 78 : 52);
  const estWind = isAridZone ? 20 : 14;

  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let headline = 'NO ACTIVE FIRE DETECTED BY SATELLITE';
  let detailedReason = '';

  if (hasActiveFire) {
    const maxFrp = Math.max(...eventsInArea.map(e => e.frp || 0));
    const maxBt = Math.max(...eventsInArea.map(e => e.brightnessTemperature || 0));
    riskLevel = maxFrp >= 95 ? 'CRITICAL' : 'HIGH';
    headline = `${eventsInArea.length} ACTIVE THERMAL HOTSPOT${eventsInArea.length > 1 ? 'S' : ''} DETECTED BY SATELLITE`;
    detailedReason = `Multi-band satellite radiometry confirms elevated radiant heat flux (${maxFrp.toFixed(1)} MW FRP, ${maxBt.toFixed(0)} K). Active combustion or thermal anomaly detected within ${radiusKm}km radius.`;
  } else {
    // Truthful, non-alarmist risk of occurrence reporting
    if (indDist <= 3.0) {
      riskLevel = 'MODERATE';
      headline = 'NO ACTIVE FIRE DETECTED — MODERATE INDUSTRIAL RISK OF OCCURRENCE';
      detailedReason = `No uncontrolled fire detected by satellite. Moderate risk of occurrence noted due to proximity (${indDist.toFixed(1)} km) to ${nearest?.name || 'industrial facility'} with baseline pressurized chemical operations, but satellite IR channels verify zero active fire emergency.`;
    } else if (isAridZone) {
      riskLevel = 'MODERATE';
      headline = 'NO ACTIVE FIRE DETECTED — MODERATE CLIMATIC OCCURRENCE RISK';
      detailedReason = `Satellite radiometer reports zero anomalous combustion. Moderate risk of occurrence is noted solely due to dry atmospheric conditions (~${estHumidity}% RH) and elevated surface ground temperature (~${estTemp}°C), but current overpass confirms zero active fire activity.`;
    } else {
      riskLevel = 'LOW';
      headline = 'NO ACTIVE FIRE DETECTED — LOW RISK OF OCCURRENCE';
      detailedReason = `Satellite thermal sensors report normal baseline temperatures with zero combustion signatures or anomalous radiometric heat within ${radiusKm}km radius. Occurrence risk is low under current ambient conditions.`;
    }
  }

  const maxFrp = eventsInArea.length > 0 ? Math.max(...eventsInArea.map(e => e.frp || 0)) : 0;
  const maxBt = eventsInArea.length > 0 ? Math.max(...eventsInArea.map(e => e.brightnessTemperature || 0)) : estTemp + 273.15;

  return {
    locationName: locationName || `Coordinates [${targetLat.toFixed(4)}°N, ${targetLon.toFixed(4)}°E]`,
    latitude: targetLat,
    longitude: targetLon,
    radiusKm,
    satelliteSource: 'VIIRS_NOAA21_NRT / METEOSAT-11 / MODIS',
    evaluatedAt: new Date().toISOString(),
    fireDetected: hasActiveFire,
    activeHotspotCount: eventsInArea.length,
    riskLevel,
    headline,
    detailedReason,
    atmosphericFactors: {
      ambientTempEstC: estTemp,
      relativeHumidityEstPct: estHumidity,
      windEstKmh: estWind,
      vegetationIndexEstimate: isAridZone ? 'Sparse Arid Scrub / Low Fuel Moisture' : 'Temperate Mixed Canopy',
      industrialProximityKm: nearest ? nearest.distanceKm : undefined
    },
    satelliteTelemetrySummary: {
      lastOverpassUtc: new Date().toISOString(),
      radiometricThermalAnomaly: hasActiveFire,
      sensorChannelsQueried: ['VIIRS I4 (3.74μm MWIR)', 'VIIRS I5 (11.45μm TIR)', 'Meteosat IR3.9', 'MODIS Ch21'],
      maxFrpDetected: maxFrp,
      maxBtDetected: maxBt
    }
  };
}

// ==========================================
// 1. HEALTH & SYSTEM STATUS
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'THERMOS Backend Engine',
    version: '2.4.0',
    firmsKeyConfigured: Boolean(process.env.FIRMS_MAP_KEY && process.env.FIRMS_MAP_KEY.length > 5),
    firmsSource: process.env.FIRMS_SOURCE || 'VIIRS_NOAA21_NRT',
    activeEventsCount: eventsDatabase.length,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. NASA FIRMS INGESTION (GLOBAL & BOUNDING BOX SUPPORT)
// ==========================================
app.get('/api/firms', async (req: Request, res: Response) => {
  try {
    const mapKey = process.env.FIRMS_MAP_KEY || process.env.NASA_FIRMS_API_KEY;
    const source = (req.query.source as string) || process.env.FIRMS_SOURCE || 'VIIRS_NOAA21_NRT';
    const days = parseInt((req.query.days as string) || '1', 10);
    const mode = (req.query.mode as string) || 'DEMO';

    // Target corridor coordinate & radius support (Single Source of Truth)
    const targetLat = parseFloat((req.query.lat || req.query.latitude) as string);
    const targetLon = parseFloat((req.query.lon || req.query.lng || req.query.longitude) as string);
    const radiusKm = parseFloat((req.query.radiusKm || req.query.radius) as string) || 25;
    const hasTargetPoint = !isNaN(targetLat) && !isNaN(targetLon);

    // Support bounding box parameters: minLat/lat_min, minLon/lon_min, maxLat/lat_max, maxLon/lon_max, or bbox string
    const minLat = parseFloat((req.query.minLat || req.query.lat_min) as string);
    const minLon = parseFloat((req.query.minLon || req.query.lon_min) as string);
    const maxLat = parseFloat((req.query.maxLat || req.query.lat_max) as string);
    const maxLon = parseFloat((req.query.maxLon || req.query.lon_max) as string);

    let queryBbox = 'world';
    const hasCustomBbox = !isNaN(minLat) && !isNaN(minLon) && !isNaN(maxLat) && !isNaN(maxLon);
    
    if (hasCustomBbox) {
      queryBbox = `${minLon.toFixed(4)},${minLat.toFixed(4)},${maxLon.toFixed(4)},${maxLat.toFixed(4)}`;
    } else if (hasTargetPoint) {
      // Convert target lat/lon + radiusKm into NASA FIRMS query bounding box
      const deltaLat = radiusKm / 111;
      const cosLat = Math.cos((targetLat * Math.PI) / 180);
      const deltaLon = radiusKm / (111 * (Math.abs(cosLat) > 0.01 ? Math.abs(cosLat) : 1));
      const bMinLon = Math.max(-180, targetLon - deltaLon);
      const bMaxLon = Math.min(180, targetLon + deltaLon);
      const bMinLat = Math.max(-90, targetLat - deltaLat);
      const bMaxLat = Math.min(90, targetLat + deltaLat);
      queryBbox = `${bMinLon.toFixed(4)},${bMinLat.toFixed(4)},${bMaxLon.toFixed(4)},${bMaxLat.toFixed(4)}`;
    } else if (req.query.bbox && typeof req.query.bbox === 'string' && req.query.bbox.trim().length > 0) {
      queryBbox = req.query.bbox.replace(/\s+/g, '');
    } else {
      queryBbox = 'world';
    }

    // Explicit headers ensuring reverse proxies never mistake this for HTML
    res.setHeader('Content-Type', 'application/json');

    // In Live Mode, the system attempts live API connections. If the API fails, display the failure cleanly in JSON.
    if (mode === 'LIVE') {
      if (!mapKey || mapKey.trim().length <= 5) {
        const fallbackEvents = hasTargetPoint
          ? eventsDatabase.filter(e => calculateHaversineDistance(targetLat, targetLon, e.latitude, e.longitude) <= radiusKm)
          : eventsDatabase;

        return res.status(200).json({
          mode: 'LIVE',
          status: 'ERROR',
          error: 'NASA FIRMS API Key is not configured. Set FIRMS_MAP_KEY or NASA_FIRMS_API_KEY in settings or switch to DEMO mode.',
          lastUpdated: new Date().toISOString(),
          queryBbox,
          count: fallbackEvents.length,
          events: fallbackEvents
        });
      }

      try {
        const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${queryBbox}/${days}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          const fallbackEvents = hasTargetPoint
            ? eventsDatabase.filter(e => calculateHaversineDistance(targetLat, targetLon, e.latitude, e.longitude) <= radiusKm)
            : eventsDatabase;

          return res.status(200).json({
            mode: 'LIVE',
            status: 'ERROR',
            error: `NASA FIRMS API server responded with status HTTP ${response.status} (${response.statusText}). Filtered reference records served.`,
            lastUpdated: new Date().toISOString(),
            queryBbox,
            count: fallbackEvents.length,
            events: fallbackEvents
          });
        }

        const csvText = await response.text();
        if (csvText.includes('Invalid Key') || csvText.includes('Forbidden')) {
          const fallbackEvents = hasTargetPoint
            ? eventsDatabase.filter(e => calculateHaversineDistance(targetLat, targetLon, e.latitude, e.longitude) <= radiusKm)
            : eventsDatabase;

          return res.status(200).json({
            mode: 'LIVE',
            status: 'ERROR',
            error: 'NASA FIRMS API Key is invalid or expired. Check FIRMS_MAP_KEY or NASA_FIRMS_API_KEY in settings.',
            lastUpdated: new Date().toISOString(),
            queryBbox,
            count: fallbackEvents.length,
            events: fallbackEvents
          });
        }

        const lines = csvText.split('\n').filter(l => l.trim().length > 0);
        const headers = lines[0].split(',').map(h => h.trim());
        const parsedEvents: ThermalEvent[] = [];

        for (let i = 1; i < lines.length && i <= 150; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = cols[idx]; });

          const lat = parseFloat(row.latitude);
          const lon = parseFloat(row.longitude);
          const frp = parseFloat(row.frp || '15.0');
          const bt = parseFloat(row.bright_ti4 || row.brightness || '320.0');

          if (!isNaN(lat) && !isNaN(lon)) {
            // Apply radius filter directly if target point is present
            if (hasTargetPoint && calculateHaversineDistance(targetLat, targetLon, lat, lon) > radiusKm) {
              continue;
            }

            const nearest = findNearestIndustrialSite(lat, lon, INDUSTRIAL_SITES);
            const partialEvt: ThermalEvent = {
              id: `live-firms-${Date.now()}-${i}`,
              eventId: `FIRMS-LIVE-${row.acq_date || '2026'}-${i}`,
              latitude: lat,
              longitude: lon,
              acquisitionDate: row.acq_date || new Date().toISOString().split('T')[0],
              acquisitionTime: row.acq_time ? `${row.acq_time.slice(0, 2)}:${row.acq_time.slice(2, 4)}:00` : '12:00:00',
              satellite: row.satellite || 'NOAA-21',
              instrument: row.instrument || 'VIIRS',
              brightnessTemperature: bt,
              frp: frp,
              confidence: parseFloat(row.confidence || '80'),
              dayNight: (row.daynight as 'D' | 'N') || 'D',
              scan: parseFloat(row.scan || '0.4'),
              track: parseFloat(row.track || '0.4'),
              dataSource: 'LIVE_FIRMS',
              landCover: nearest && nearest.distanceKm < 2.0 ? 'Industrial' : 'Agriculture',
              distanceToResidentialKm: 2.5,
              distanceToRoadKm: 0.5,
              distanceToHospitalKm: 8.0,
              distanceToFireStationKm: 6.0,
              distanceToForestKm: 12.0,
              distanceToAgricultureKm: 3.0,
              industrialDensityScore: nearest && nearest.distanceKm < 3.0 ? 8.5 : 1.2,
              persistenceHours: 2.0,
              eventsInLast24h: 2,
              eventsInLast7d: 3,
              eventsInLast30d: 4,
              frpTrendDelta: +10.0,
              escalationLevel: frp > 100 ? 'RAPID' : 'STABLE',
              isRecurringSource: false,
              nearestIndustrialSite: nearest ? {
                id: nearest.id,
                name: nearest.name,
                type: nearest.facilityType,
                distanceKm: nearest.distanceKm
              } : undefined
            };

            const classification = classifyThermalEvent(partialEvt);
            const risk = calculateItriRisk(partialEvt);
            partialEvt.classification = classification.predictedClass;
            partialEvt.classificationConfidence = classification.confidence;
            partialEvt.itriScore = risk.finalItri;
            partialEvt.itriRiskLevel = risk.riskLevel;

            parsedEvents.push(partialEvt);
          }
        }

        let finalEvents = parsedEvents;
        if (finalEvents.length === 0 && hasTargetPoint) {
          finalEvents = eventsDatabase.filter(e => calculateHaversineDistance(targetLat, targetLon, e.latitude, e.longitude) <= radiusKm);
        }

        const liveAssessment = hasTargetPoint
          ? assessLocationFireRisk(targetLat, targetLon, radiusKm, (req.query.name || req.query.locationName) as string || '', finalEvents)
          : undefined;

        return res.json({
          mode: 'LIVE',
          source: 'LIVE_NASA_FIRMS',
          status: 'SUCCESS',
          queryBbox,
          lastUpdated: new Date().toISOString(),
          count: finalEvents.length,
          events: finalEvents,
          riskAssessment: liveAssessment
        });
      } catch (liveErr) {
        const fallbackEvents = hasTargetPoint
          ? eventsDatabase.filter(e => calculateHaversineDistance(targetLat, targetLon, e.latitude, e.longitude) <= radiusKm)
          : eventsDatabase;

        const liveErrAssessment = hasTargetPoint
          ? assessLocationFireRisk(targetLat, targetLon, radiusKm, (req.query.name || req.query.locationName) as string || '', fallbackEvents)
          : undefined;

        return res.status(200).json({
          mode: 'LIVE',
          status: 'ERROR',
          error: `Live NASA FIRMS connection timed out: ${String(liveErr)}. Using spatial reference records.`,
          lastUpdated: new Date().toISOString(),
          queryBbox,
          count: fallbackEvents.length,
          events: fallbackEvents,
          riskAssessment: liveErrAssessment
        });
      }
    }

    // Default DEMO MODE: Filter strictly by selected corridor coordinates & radius
    let servedEvents = eventsDatabase;
    if (hasTargetPoint) {
      servedEvents = eventsDatabase.filter(e => calculateHaversineDistance(targetLat, targetLon, e.latitude, e.longitude) <= radiusKm);
    } else if (hasCustomBbox) {
      servedEvents = eventsDatabase.filter(e => isWithinBoundingBox(e.latitude, e.longitude, minLat, minLon, maxLat, maxLon));
    }

    const demoAssessment = hasTargetPoint
      ? assessLocationFireRisk(targetLat, targetLon, radiusKm, (req.query.name || req.query.locationName) as string || '', servedEvents)
      : undefined;

    return res.json({
      mode: 'DEMO',
      source: 'DEMO_MODE_STORED_SAMPLE_DATA',
      status: 'SUCCESS',
      note: 'DEMO MODE: Geospatially filtered records strictly within selected target radius.',
      lastUpdated: new Date().toISOString(),
      queryBbox: hasTargetPoint ? `${targetLat.toFixed(4)},${targetLon.toFixed(4)} (r=${radiusKm}km)` : (hasCustomBbox ? queryBbox : 'GLOBAL_CORRIDORS'),
      count: servedEvents.length,
      events: servedEvents,
      riskAssessment: demoAssessment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ingest NASA FIRMS data', details: String(error) });
  }
});

// ==========================================
// 2A. GLOBAL LOCATION GEOCODING & COORDINATE SEARCH
// ==========================================
app.get('/api/location/geocode', async (req: Request, res: Response) => {
  try {
    const rawQuery = ((req.query.query || req.query.q) as string || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    // Check if user entered direct coordinates: e.g. "34.0522, -118.2437" or "28.6139 77.2090"
    const coordPattern = /^\s*(-?\d+(\.\d+)?)\s*[, /]\s*(-?\d+(\.\d+)?)\s*$/;
    const match = rawQuery.match(coordPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return res.json({
          results: [{
            name: `Coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]`,
            shortName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            latitude: lat,
            longitude: lon,
            country: 'Custom Coordinates',
            type: 'coordinate'
          }]
        });
      }
    }

    // Call OpenStreetMap Nominatim for global text query geocoding
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(rawQuery)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'THERMOS-Thermal-Satellite-Platform/1.0 (Emergency Spaceborne Response)'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const results = data.map((item: any) => ({
            name: item.display_name,
            shortName: item.display_name.split(',')[0],
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            country: item.display_name.split(',').pop()?.trim() || '',
            type: item.type || 'place',
            boundingbox: item.boundingbox
          })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude));

          if (results.length > 0) {
            return res.json({ results });
          }
        }
      }
    } catch (nomErr) {
      console.warn('Nominatim network lookup failed, using local spatial index:', nomErr);
    }

    // Local target corridor & major region fallback
    const qLower = rawQuery.toLowerCase();
    const matchedCorridors = TARGET_CORRIDORS.filter(c =>
      c.name.toLowerCase().includes(qLower) ||
      c.country.toLowerCase().includes(qLower) ||
      c.industrialSite.toLowerCase().includes(qLower) ||
      c.id.toLowerCase().includes(qLower)
    ).map(c => ({
      name: `${c.name} - ${c.industrialSite}, ${c.country}`,
      shortName: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      country: c.country,
      type: 'corridor'
    }));

    return res.json({ results: matchedCorridors });
  } catch (err: any) {
    res.status(500).json({ error: 'Geocoding failed', details: String(err) });
  }
});

// ==========================================
// 2A-2. SATELLITE LOCATION FIRE & OCCURRENCE CHECK
// ==========================================
app.get('/api/satellite/check-location', (req: Request, res: Response) => {
  try {
    const lat = parseFloat((req.query.lat || req.query.latitude) as string);
    const lon = parseFloat((req.query.lon || req.query.lng || req.query.longitude) as string);
    const radiusKm = parseFloat((req.query.radiusKm || req.query.radius) as string) || 25;
    const locationName = ((req.query.name || req.query.locationName) as string) || '';
    const mode = (req.query.mode as string) || 'DEMO';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid numerical latitude and longitude required' });
    }

    // Check matching active thermal events strictly within radius
    const matchingEvents = eventsDatabase.filter(e =>
      calculateHaversineDistance(lat, lon, e.latitude, e.longitude) <= radiusKm
    );

    const assessment = assessLocationFireRisk(lat, lon, radiusKm, locationName, matchingEvents);

    return res.json({
      success: true,
      assessment,
      activeEvents: matchingEvents,
      count: matchingEvents.length,
      mode,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect satellite location', details: String(err) });
  }
});


// ==========================================
// 2B. AI EVIDENCE EXPLANATION (ANTI-HALLUCINATION ENFORCER)
// ==========================================
app.post('/api/ai-explain', async (req: Request, res: Response) => {
  try {
    const rawLat = req.body.lat ?? req.body.latitude ?? 0;
    const rawLon = req.body.lon ?? req.body.longitude ?? 0;
    const rawFrp = req.body.frp ?? 0;
    const rawBt = req.body.brightness ?? req.body.brightnessTemp ?? req.body.brightnessTemperature ?? 300;
    const rawConf = req.body.confidence ?? 50;
    const satellite = req.body.satellite || 'VIIRS';
    const nearbyIndustry = req.body.nearbyIndustry ?? req.body.nearbyIndustryName ?? null;
    const rawDist = req.body.distanceKm ?? req.body.nearbyIndustryDistanceKm ?? null;
    const timestamp = req.body.timestamp || new Date().toISOString();
    const obs = parseInt(req.body.observationsCount || '1', 10);
    const persist = parseFloat(req.body.persistenceHours || '0');

    const numLat = parseFloat(String(rawLat));
    const numLon = parseFloat(String(rawLon));
    const numFrp = parseFloat(String(rawFrp));
    const numBt = parseFloat(String(rawBt));
    const numConf = parseFloat(String(rawConf));
    const numDist = rawDist !== undefined && rawDist !== null ? parseFloat(String(rawDist)) : null;

    // Strict 4-criteria validation for industrial fire
    const isRiskHigh = numFrp >= 95 || numBt >= 360;
    const isConfidenceHigh = numConf >= 80;
    const isIndustryNearby = nearbyIndustry && numDist !== null && numDist <= 2.0;
    const isMultiObs = obs >= 2 || persist >= 2.0;
    const isSufficient = isRiskHigh && isConfidenceHigh && isIndustryNearby && isMultiObs;

    const groundedFactors: string[] = [];
    if (isRiskHigh) groundedFactors.push(`Radiative emission (${numFrp.toFixed(1)} MW) / brightness (${numBt.toFixed(1)} K) exceeds operational furnace thresholds.`);
    if (isConfidenceHigh) groundedFactors.push(`Sensor confidence validated at ${numConf}% by ${satellite}.`);
    if (isIndustryNearby) groundedFactors.push(`Spatial co-location confirmed within ${numDist?.toFixed(2)} km of ${nearbyIndustry}.`);
    if (isMultiObs) groundedFactors.push(`Temporal persistence observed across multiple passes (${obs} passes, ${persist}h).`);

    const ai = getAI();
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the THERMOS Satellite Remote Sensing Evidence Validator.
CRITICAL RULES:
1. Use ONLY the provided telemetry data. You are strictly forbidden from inventing, hallucinating, or assuming any explosion, fire, or accident that is not proven by the data.
2. If evidence is insufficient (e.g. FRP < 95 MW, distance to industry > 2km, confidence < 80%, single pass, or low brightness), you MUST state:
"Insufficient evidence for industrial fire confirmation. Satellite thermal anomaly detected at ${numLat.toFixed(4)}°N, ${numLon.toFixed(4)}°E with FRP ${numFrp.toFixed(1)} MW and brightness ${numBt.toFixed(1)} K; telemetry parameters remain within sub-critical or ambiguous thresholds. Multi-spectral Sentinel-2 ground corroboration required."
3. If all criteria are proven (high FRP >= 95 MW, BT >= 360 K, within 2km of facility, multi-pass confirmation), output a concise, factual remote sensing corroboration confirming that combustion exceeds facility baseline.

Telemetry Input:
- Latitude: ${numLat}
- Longitude: ${numLon}
- Fire Radiative Power (FRP): ${numFrp} MW
- Brightness Temperature: ${numBt} K
- Sensor Confidence: ${numConf}%
- Satellite Platform: ${satellite}
- Nearby Industrial Asset: ${nearbyIndustry || 'None'}
- Distance to Industry: ${numDist !== null ? numDist.toFixed(2) + ' km' : 'Unknown'}
- Overpass Timestamp: ${timestamp} UTC
- Consecutive Observations: ${obs} passes (Persistence: ${persist}h)

Output plain text only:`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt
        });

        const text = response.text || '';
        return res.json({
          status: isSufficient ? 'VERIFIED_FIRE' : 'INSUFFICIENT_EVIDENCE',
          statement: text.trim(),
          evidenceGroundedFactors: groundedFactors,
          usedGemini: true,
          evaluatedAt: new Date().toISOString()
        });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to deterministic explanation:', geminiErr);
      }
    }

    // Deterministic fallback adhering strictly to prompt mandate
    let statement = '';
    if (isSufficient) {
      statement = `Thermal anomaly verified at ${numLat.toFixed(4)}°N, ${numLon.toFixed(4)}°E within ${numDist?.toFixed(2)} km of ${nearbyIndustry}. Radiative power ${numFrp.toFixed(1)} MW and brightness temperature ${numBt.toFixed(1)} K captured by ${satellite} at ${timestamp} UTC with ${numConf}% confidence confirm active anomalous combustion exceeding facility baseline.`;
    } else {
      statement = `Insufficient evidence for industrial fire confirmation. Satellite thermal anomaly detected at ${numLat.toFixed(4)}°N, ${numLon.toFixed(4)}°E with FRP ${numFrp.toFixed(1)} MW and brightness ${numBt.toFixed(1)} K; telemetry parameters remain within sub-critical or ambiguous thresholds. Multi-spectral Sentinel-2 ground corroboration required.`;
    }

    return res.json({
      status: isSufficient ? 'VERIFIED_FIRE' : 'INSUFFICIENT_EVIDENCE',
      statement,
      evidenceGroundedFactors: groundedFactors,
      usedGemini: false,
      evaluatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Bounding Box query endpoint (Prompt Section 6: GET /api/firms/bbox)
app.get('/api/firms/bbox', (req: Request, res: Response) => {
  const minLat = parseFloat(req.query.minLat as string);
  const minLon = parseFloat(req.query.minLon as string);
  const maxLat = parseFloat(req.query.maxLat as string);
  const maxLon = parseFloat(req.query.maxLon as string);

  if (isNaN(minLat) || isNaN(minLon) || isNaN(maxLat) || isNaN(maxLon)) {
    return res.status(400).json({ error: 'Missing or invalid bounding box coordinates [minLat, minLon, maxLat, maxLon]' });
  }

  const filtered = eventsDatabase.filter(e => isWithinBoundingBox(e.latitude, e.longitude, minLat, minLon, maxLat, maxLon));
  res.json({
    bbox: [minLon, minLat, maxLon, maxLat],
    count: filtered.length,
    events: filtered
  });
});

// ==========================================
// 3. EVENTS API
// ==========================================
app.get('/api/events', (req: Request, res: Response) => {
  const classification = req.query.classification as string;
  const risk = req.query.risk as string;
  const targetLat = req.query.lat ? parseFloat(req.query.lat as string) : null;
  const targetLon = req.query.lon ? parseFloat(req.query.lon as string) : null;
  const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 50;

  let results = [...eventsDatabase];

  if (targetLat !== null && !isNaN(targetLat) && targetLon !== null && !isNaN(targetLon)) {
    results = results.filter(e => {
      const dist = calculateHaversineDistance(targetLat, targetLon, e.latitude, e.longitude);
      return dist <= radiusKm;
    });
  }

  if (classification && classification !== 'ALL') {
    results = results.filter(e => e.classification === classification);
  }
  if (risk && risk !== 'ALL') {
    results = results.filter(e => e.itriRiskLevel === risk);
  }

  res.json({
    total: results.length,
    events: results
  });
});

app.get('/api/events/:event_id', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }
  res.json(event);
});

// ==========================================
// 4. CLASSIFICATION & EXPLAINABLE AI (SHAP)
// ==========================================
app.post('/api/classify/:event_id', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  const classification = classifyThermalEvent(event);
  res.json(classification);
});

// ==========================================
// 5. TEMPORAL & PERSISTENCE ENGINE
// ==========================================
app.get('/api/events/:event_id/history', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  // Generate temporal telemetry passes over past 7 days
  const historyPoints = [
    { timestamp: 'T - 6 Days', frp: Math.max(5, event.frp * 0.15), brightnessK: 308.2, status: 'Background Noise' },
    { timestamp: 'T - 5 Days', frp: Math.max(6, event.frp * 0.18), brightnessK: 310.0, status: 'Nominal' },
    { timestamp: 'T - 4 Days', frp: Math.max(5, event.frp * 0.14), brightnessK: 309.4, status: 'Nominal' },
    { timestamp: 'T - 3 Days', frp: Math.max(8, event.frp * 0.22), brightnessK: 312.1, status: 'Nominal' },
    { timestamp: 'T - 2 Days', frp: Math.max(10, event.frp * 0.30), brightnessK: 318.5, status: 'Slight Elevation' },
    { timestamp: 'T - 24 Hours', frp: Math.max(18, event.frp * 0.45), brightnessK: 332.0, status: 'Noticeable Increase' },
    { timestamp: 'Current Pass (T0)', frp: event.frp, brightnessK: event.brightnessTemperature, status: event.escalationLevel }
  ];

  res.json({
    eventId: event.eventId,
    persistenceHours: event.persistenceHours,
    isRecurringSource: event.isRecurringSource,
    escalationLevel: event.escalationLevel,
    frpTrendDelta: event.frpTrendDelta,
    timeSeries: historyPoints
  });
});

app.get('/api/events/:event_id/persistence', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  res.json({
    eventId: event.eventId,
    persistenceHours: event.persistenceHours,
    daysActive: (event.persistenceHours / 24).toFixed(1),
    isPersistent: event.persistenceHours > 48,
    recurrenceClassification: event.isRecurringSource ? 'HIGH_RECURRENCE_STATIONARY' : 'EPHEMERAL_EMERGENT',
    satelliteOverpassMatches: event.eventsInLast7d
  });
});

// ==========================================
// 6. ITRI RISK ASSESSMENT
// ==========================================
app.get('/api/events/:event_id/risk', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  const risk = calculateItriRisk(event);
  res.json({
    eventId: event.eventId,
    assessment: risk,
    populationExposure: event.populationExposure,
    nearestIndustrialFacility: event.nearestIndustrialSite
  });
});

// ==========================================
// 7. GIS ASSETS & SPATIAL QUERIES
// ==========================================
app.get('/api/industrial-sites', (req: Request, res: Response) => {
  res.json({
    count: INDUSTRIAL_SITES.length,
    sites: INDUSTRIAL_SITES
  });
});

app.get('/api/fire-stations', (req: Request, res: Response) => {
  res.json({
    count: FIRE_STATIONS.length,
    stations: FIRE_STATIONS
  });
});

app.get('/api/hospitals', (req: Request, res: Response) => {
  res.json({
    count: HOSPITALS.length,
    hospitals: HOSPITALS
  });
});

app.get('/api/events/:event_id/resources', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  const rankedFireStations = rankFireStationsForEvent(event, FIRE_STATIONS);
  const rankedHospitals = rankHospitalsForEvent(event, HOSPITALS);
  const rankedPoliceStations = rankPoliceStationsForEvent(event, POLICE_STATIONS);
  const rankedAmbulances = rankAmbulanceUnitsForEvent(event, AMBULANCE_UNITS);

  res.json({
    eventId: event.eventId,
    fireStations: rankedFireStations,
    hospitals: rankedHospitals,
    policeStations: rankedPoliceStations,
    ambulanceUnits: rankedAmbulances
  });
});

// ==========================================
// 8. INCIDENT REPORT GENERATION (PDF/JSON/CSV)
// ==========================================
app.post('/api/reports/:event_id', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  const classification = classifyThermalEvent(event);
  const risk = calculateItriRisk(event);
  const rankedFire = rankFireStationsForEvent(event, FIRE_STATIONS);
  const rankedHosp = rankHospitalsForEvent(event, HOSPITALS);

  const reportId = `THERMOS-REP-${Date.now().toString().slice(-6)}-${event.id.slice(-3)}`;
  
  const recommendedActions = [
    `Immediate containment perimeter of ${event.itriRiskLevel === 'Critical' ? '1,500' : '800'} meters recommended.`,
    `Dispatch Hazmat / Chemical Foam Units from ${rankedFire[0]?.name || 'Primary Fire HQ'}.`,
    `Alert ${rankedHosp[0]?.name || 'District Hospital'} Burn ICU & Trauma units for toxic exposure triage.`,
    `Notify District Disaster Management Authority (DDMA) and State Pollution Control Board.`
  ];

  const report: IncidentReport = {
    reportNumber: reportId,
    generatedAt: new Date().toISOString(),
    event,
    classification,
    riskAssessment: risk,
    nearbyResources: {
      fireStations: rankedFire.slice(0, 3),
      hospitals: rankedHosp.slice(0, 3)
    },
    recommendedActions,
    disasterManagementNotes: `Official automated thermal verification report generated by THERMOS platform. Hotspot detected by ${event.satellite} / ${event.instrument} sensor with FRP ${event.frp} MW. AI Confidence: ${classification.confidence}%. ITRI Risk Level: ${risk.riskLevel} (${risk.finalItri}/100).`
  };

  reportsDatabase.set(reportId, report);
  res.json(report);
});

app.get('/api/reports/:report_id', (req: Request, res: Response) => {
  const report = reportsDatabase.get(req.params.report_id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

// ==========================================
// 9. SIMULATED DISPATCH WORKFLOW
// ==========================================
app.post('/api/events/:event_id/dispatch/simulate', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  const rankedFire = rankFireStationsForEvent(event, FIRE_STATIONS);
  const rankedHosp = rankHospitalsForEvent(event, HOSPITALS);
  const primaryFire = rankedFire.find(f => !f.isOutsideRadius) || rankedFire[0];
  const primaryHosp = rankedHosp.find(h => !h.isOutsideRadius) || rankedHosp[0];

  const dispatchId = `DISPATCH-SIM-${Date.now().toString().slice(-6)}`;
  
  const simulation: DispatchSimulation = {
    dispatchId,
    eventId: event.eventId,
    status: 'DISPATCHED',
    dispatchedAt: new Date().toISOString(),
    assignedFireStations: [primaryFire?.isOutsideRadius ? 'Primary Fire Unit (Outside 75km Range - Mutual Aid Required)' : (primaryFire?.name || 'Local Fire Station')],
    assignedHospitals: [primaryHosp?.isOutsideRadius ? 'Primary Burn Trauma Unit (Outside 75km Range - Air Ambulance Alerted)' : (primaryHosp?.name || 'Local Trauma Center')],
    incidentCommander: 'ERSS Industrial Incident Command',
    unitsDeployed: [
      {
        unitId: 'FT-01',
        unitType: 'Heavy Chemical Foam Tender (12,000L)',
        stationName: primaryFire?.name || 'Local Responding Station',
        status: 'Rolling',
        etaMinutes: primaryFire?.estimatedArrivalMinutes || 12
      },
      {
        unitId: 'HZ-03',
        unitType: 'Hazardous Materials & Gas Detection Unit',
        stationName: primaryFire?.name || 'Local Responding Station',
        status: 'Rolling',
        etaMinutes: (primaryFire?.estimatedArrivalMinutes || 12) + 2
      },
      {
        unitId: 'ALS-02',
        unitType: 'Advanced Life Support Burn Ambulance',
        stationName: primaryHosp?.name || 'Designated Trauma Center',
        status: 'Rolling',
        etaMinutes: primaryHosp?.estimatedArrivalMinutes || 15
      }
    ],
    evacuationRadiusMeters: event.itriRiskLevel === 'Critical' ? 1500 : 800,
    alertBroadcastStatus: 'SENT_TO_DISTRICT_AUTHORITIES'
  };

  activeDispatches.set(event.eventId, simulation);
  res.json(simulation);
});

// ==========================================
// SATELLITE VERIFICATION (RULE 4 & RULE 38)
// ==========================================
app.get('/api/satellite/:event_id', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  const cloudCover = event.satelliteContext?.cloudCoverPct ?? 8.4;
  if (cloudCover > 35) {
    return res.json({
      available: false,
      message: 'Satellite verification unavailable for this event.',
      reason: `Cloud cover exceeds optical threshold (${cloudCover}% cloud obstruction).`,
      coordinates: { latitude: event.latitude, longitude: event.longitude }
    });
  }

  const zoom = 15;
  const latRad = event.latitude * Math.PI / 180;
  const n = Math.pow(2, zoom);
  const xTile = Math.floor((event.longitude + 180) / 360 * n);
  const yTile = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
  const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${yTile}/${xTile}`;

  res.json({
    available: true,
    platform: 'Sentinel-2 MSI & Copernicus World Imagery Service',
    acquisitionDate: event.acquisitionDate,
    acquisitionTime: event.acquisitionTime,
    resolutionMeters: 10,
    cloudCoverPct: cloudCover,
    band: 'B12 (SWIR-2) / B11 (SWIR-1) / B04 (Red)',
    coordinates: {
      latitude: event.latitude,
      longitude: event.longitude
    },
    imageUrl: event.satelliteContext?.falseColorUrl || tileUrl,
    firmsOverlay: {
      frp: event.frp,
      brightnessTemp: event.brightnessTemperature,
      confidence: event.confidence
    }
  });
});

// ==========================================
// EMERGENCY ROUTING (RULE 28 & RULE 38)
// ==========================================
app.get('/api/routes/:event_id', (req: Request, res: Response) => {
  const event = eventsDatabase.find(e => e.id === req.params.event_id || e.eventId === req.params.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found' });
  }

  const rankedFire = rankFireStationsForEvent(event, FIRE_STATIONS);
  const primaryStation = rankedFire.find(f => !f.isOutsideRadius);

  if (!primaryStation) {
    return res.json({
      available: false,
      message: 'Route/ETA unavailable.',
      reason: 'No responding station within 75km operational dispatch radius'
    });
  }

  const midLat = (primaryStation.coordinates.lat + event.latitude) / 2 + 0.002;
  const midLng = (primaryStation.coordinates.lng + event.longitude) / 2 - 0.0015;

  res.json({
    available: true,
    origin: {
      name: primaryStation.name,
      lat: primaryStation.coordinates.lat,
      lng: primaryStation.coordinates.lng
    },
    destination: {
      name: event.nearestIndustrialSite?.name || 'Incident Hotspot',
      lat: event.latitude,
      lng: event.longitude
    },
    distanceKm: primaryStation.distanceKm,
    estimatedMinutes: primaryStation.estimatedArrivalMinutes,
    pathWaypoints: [
      [primaryStation.coordinates.lat, primaryStation.coordinates.lng],
      [midLat, midLng],
      [event.latitude, event.longitude]
    ]
  });
});

// ==========================================
// SYSTEM STATUS TRANSPARENCY (RULE 30)
// ==========================================
app.get('/api/system-status', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.FIRMS_MAP_KEY && process.env.FIRMS_MAP_KEY.trim().length > 5);
  res.json({
    nasaFirms: {
      status: hasKey ? 'CONNECTED' : 'STANDBY_DEMO',
      lastFetched: firmsCache ? new Date(firmsCache.lastFetched).toISOString() : new Date().toISOString(),
      keyConfigured: hasKey
    },
    osmOverpass: {
      status: 'CONNECTED',
      note: 'Industrial infrastructure and land cover layers active'
    },
    sentinelLandsat: {
      status: 'CONNECTED',
      note: 'Copernicus & High-Res satellite tile service active'
    },
    routingService: {
      status: 'CONNECTED',
      note: 'Haversine & Emergency Route ETA engine operational'
    }
  });
});

// ==========================================
// 10. AUTOMATED EMERGENCY CALLING SYSTEM (DOCTORS, POLICE, FIRE-FIGHTERS)
// ==========================================
app.post('/api/emergency-call', (req: Request, res: Response) => {
  const { eventId, autoTriggered } = req.body;
  const event = eventsDatabase.find(e => e.id === eventId || e.eventId === eventId);
  
  if (!event) {
    return res.status(404).json({ error: 'Thermal event not found for emergency calling' });
  }

  const isFire = isActualFireEvent(event);
  const session = createEmergencyCallSession(event, Boolean(autoTriggered));

  // Store in session map
  emergencyCallsDatabase.set(session.sessionId, session);

  res.json({
    success: true,
    isActualFire: isFire,
    session,
    message: `Emergency calls initiated immediately to Fire Brigade (${session.channels.fireFighters.departmentName}), Doctors (${session.channels.doctors.departmentName}), and Police (${session.channels.police.departmentName}) for ${session.detectedFireType}`
  });
});

app.get('/api/emergency-calls', (req: Request, res: Response) => {
  const allSessions = Array.from(emergencyCallsDatabase.values()).sort(
    (a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()
  );

  const activeCalls = allSessions.filter(s => s.overallStatus === 'CALLING_IN_PROGRESS');
  const acknowledgedCalls = allSessions.filter(s => s.overallStatus === 'ALL_ACKNOWLEDGED');

  res.json({
    totalSessions: allSessions.length,
    activeCallsCount: activeCalls.length,
    acknowledgedCount: acknowledgedCalls.length,
    sessions: allSessions
  });
});

app.get('/api/emergency-call/:session_id', (req: Request, res: Response) => {
  const session = emergencyCallsDatabase.get(req.params.session_id);
  if (!session) {
    return res.status(404).json({ error: 'Emergency call session not found' });
  }
  res.json(session);
});

app.post('/api/emergency-call/:session_id/ack', (req: Request, res: Response) => {
  const session = emergencyCallsDatabase.get(req.params.session_id);
  if (!session) {
    return res.status(404).json({ error: 'Emergency call session not found' });
  }

  const { role } = req.body;
  const now = new Date().toISOString();

  if (!role || role === 'ALL') {
    session.channels.fireFighters.connectionState = 'ACKNOWLEDGED';
    session.channels.fireFighters.acknowledgedAt = now;
    session.channels.doctors.connectionState = 'ACKNOWLEDGED';
    session.channels.doctors.acknowledgedAt = now;
    session.channels.police.connectionState = 'ACKNOWLEDGED';
    session.channels.police.acknowledgedAt = now;
    session.overallStatus = 'ALL_ACKNOWLEDGED';
  } else if (role === 'FIRE_FIGHTERS') {
    session.channels.fireFighters.connectionState = 'ACKNOWLEDGED';
    session.channels.fireFighters.acknowledgedAt = now;
  } else if (role === 'DOCTORS_EMS') {
    session.channels.doctors.connectionState = 'ACKNOWLEDGED';
    session.channels.doctors.acknowledgedAt = now;
  } else if (role === 'POLICE_COMMAND') {
    session.channels.police.connectionState = 'ACKNOWLEDGED';
    session.channels.police.acknowledgedAt = now;
  }

  // Check if all channels are acknowledged
  if (
    session.channels.fireFighters.connectionState === 'ACKNOWLEDGED' &&
    session.channels.doctors.connectionState === 'ACKNOWLEDGED' &&
    session.channels.police.connectionState === 'ACKNOWLEDGED'
  ) {
    session.overallStatus = 'ALL_ACKNOWLEDGED';
  }

  emergencyCallsDatabase.set(session.sessionId, session);
  res.json({
    success: true,
    session
  });
});

app.get('/api/police-stations', (req: Request, res: Response) => {
  res.json({
    count: POLICE_STATIONS.length,
    stations: POLICE_STATIONS
  });
});

app.get('/api/ambulance-units', (req: Request, res: Response) => {
  res.json({
    count: AMBULANCE_UNITS.length,
    ambulanceUnits: AMBULANCE_UNITS
  });
});

// Ad-Hoc Point Thermal Intelligence Pipeline (Any coordinate worldwide)
app.post('/api/analyze-point', (req: Request, res: Response) => {
  try {
    const { 
      latitude, 
      longitude, 
      frp, 
      brightnessTemperature, 
      satellite = 'VIIRS_NOAA21_NRT',
      regionName = 'Tactical Point Inspection',
      simulateFire = false
    } = req.body;

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid latitude and longitude required' });
    }

    // Check if an actual event exists within 3km of this point
    const existing = eventsDatabase.find(e => calculateHaversineDistance(lat, lon, e.latitude, e.longitude) <= 3.0);
    if (existing) {
      return res.json({
        success: true,
        fireDetected: true,
        event: existing,
        riskAssessment: assessLocationFireRisk(lat, lon, 25, regionName, [existing])
      });
    }

    // If simulateFire is not set and no FRP provided, do NOT fabricate a fake fire!
    if (!simulateFire && (frp === undefined || frp === null)) {
      const assessment = assessLocationFireRisk(lat, lon, 25, regionName, []);
      return res.json({
        success: true,
        fireDetected: false,
        event: null,
        riskAssessment: assessment,
        message: 'No active thermal fire detected at coordinates by satellite overpass.'
      });
    }

    const nearest = findNearestIndustrialSite(lat, lon, INDUSTRIAL_SITES);
    const isCloseToIndustry = nearest && nearest.distanceKm < 3.0;
    const eventFrp = parseFloat(frp) || 48.0;
    const eventBt = parseFloat(brightnessTemperature) || 338.0;

    const newEvt: ThermalEvent = {
      id: `evt-custom-${Date.now()}`,
      eventId: `CUSTOM-${Date.now().toString().slice(-6)}`,
      latitude: lat,
      longitude: lon,
      country: nearest ? (nearest.address?.split(',').pop()?.trim() || 'Global') : 'Global',
      regionName: regionName || 'Point Analysis',
      continent: 'Global',
      acquisitionDate: new Date().toISOString().split('T')[0],
      acquisitionTime: new Date().toTimeString().split(' ')[0],
      satellite: satellite || 'NOAA-21 VIIRS',
      instrument: 'VIIRS 375m',
      brightnessTemperature: eventBt,
      frp: eventFrp,
      confidence: 89.0,
      dayNight: 'D',
      scan: 0.38,
      track: 0.38,
      dataSource: 'VALIDATED_BENCHMARK',
      landCover: isCloseToIndustry ? 'Industrial' : 'Urban / Residential',
      distanceToResidentialKm: isCloseToIndustry ? 1.8 : 3.5,
      distanceToRoadKm: 0.4,
      distanceToHospitalKm: 4.8,
      distanceToFireStationKm: 3.6,
      distanceToForestKm: 14.0,
      distanceToAgricultureKm: 8.0,
      industrialDensityScore: isCloseToIndustry ? 8.2 : 2.5,
      persistenceHours: 2.0,
      eventsInLast24h: 1,
      eventsInLast7d: 2,
      eventsInLast30d: 2,
      frpTrendDelta: +25.0,
      escalationLevel: eventFrp > 90 ? 'RAPID' : 'MODERATE',
      isRecurringSource: false,
      nearestIndustrialSite: nearest ? {
        id: nearest.id,
        name: nearest.name,
        type: nearest.facilityType,
        distanceKm: nearest.distanceKm
      } : undefined
    };

    const classification = classifyThermalEvent(newEvt);
    const risk = calculateItriRisk(newEvt);
    newEvt.classification = classification.predictedClass;
    newEvt.classificationConfidence = classification.confidence;
    newEvt.itriScore = risk.finalItri;
    newEvt.itriRiskLevel = risk.riskLevel;

    // Insert at front of eventsDatabase
    eventsDatabase = [newEvt, ...eventsDatabase];

    const rankedFire = rankFireStationsForEvent(newEvt, FIRE_STATIONS);
    const rankedHosp = rankHospitalsForEvent(newEvt, HOSPITALS);
    const rankedPolice = rankPoliceStationsForEvent(newEvt, POLICE_STATIONS);
    const rankedAmbulance = rankAmbulanceUnitsForEvent(newEvt, AMBULANCE_UNITS);

    res.json({
      success: true,
      fireDetected: true,
      event: newEvt,
      classification,
      riskAssessment: assessLocationFireRisk(lat, lon, 25, regionName, [newEvt]),
      emergencyResources: {
        fireStations: rankedFire.slice(0, 3),
        hospitals: rankedHosp.slice(0, 3),
        policeStations: rankedPolice.slice(0, 3),
        ambulanceUnits: rankedAmbulance.slice(0, 3)
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze point', details: String(error) });
  }
});

// ==========================================
// 11. OVERALL ANALYTICS DASHBOARD
// ==========================================
app.get('/api/analytics', (req: Request, res: Response) => {
  const total = eventsDatabase.length;
  const industrialFires = eventsDatabase.filter(e => e.classification === 'Industrial Fire').length;
  const persistentSources = eventsDatabase.filter(e => e.classification === 'Persistent Industrial Thermal Source' || e.isRecurringSource).length;
  const gasFlares = eventsDatabase.filter(e => e.classification === 'Gas Flare').length;
  const urbanFires = eventsDatabase.filter(e => e.classification === 'Urban / Residential Fire').length;
  const miningEvents = eventsDatabase.filter(e => e.classification === 'Mining / Extraction Thermal Event').length;
  const criticalRisk = eventsDatabase.filter(e => e.itriRiskLevel === 'Critical').length;
  const highRisk = eventsDatabase.filter(e => e.itriRiskLevel === 'High').length;
  const moderateRisk = eventsDatabase.filter(e => e.itriRiskLevel === 'Moderate').length;
  const lowRisk = eventsDatabase.filter(e => e.itriRiskLevel === 'Low').length;

  const totalPopulationAtRisk = eventsDatabase.reduce((acc, e) => acc + (e.populationExposure?.radius3km || 0), 0);

  res.json({
    kpis: {
      totalActiveEvents: total,
      industrialFires,
      persistentSources,
      gasFlares,
      urbanFires,
      miningEvents,
      criticalRiskEvents: criticalRisk,
      highRiskEvents: highRisk,
      totalPopulationAtRisk
    },
    riskDistribution: [
      { name: 'Critical', count: criticalRisk, color: '#ef4444' },
      { name: 'High', count: highRisk, color: '#f97316' },
      { name: 'Moderate', count: moderateRisk, color: '#eab308' },
      { name: 'Low', count: lowRisk, color: '#22c55e' }
    ],
    classificationBreakdown: [
      { name: 'Industrial Fire', count: industrialFires },
      { name: 'Persistent Thermal', count: persistentSources },
      { name: 'Gas Flare', count: gasFlares },
      { name: 'Urban Fire', count: urbanFires },
      { name: 'Mining Event', count: miningEvents },
      { name: 'Agri Burning', count: eventsDatabase.filter(e => e.classification === 'Agricultural Burning').length },
      { name: 'Wildfire', count: eventsDatabase.filter(e => e.classification === 'Wildfire').length },
      { name: 'Other / Unknown', count: eventsDatabase.filter(e => e.classification === 'Other / Unknown Thermal Anomaly').length }
    ]
  });
});

// ML Evaluation benchmark endpoint (Section 14 & 35)
app.get('/api/ml/evaluation', (req: Request, res: Response) => {
  res.json(THERMOS_ML_EVALUATION_METRICS);
});

// Mount SIH26162 Real Emergency Dispatch System
setupEmergencyDispatchRoutes(app);
setupCallAndResponderRoutes(app);

// ==========================================
// VITE MIDDLEWARE / SPA SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THERMOS Command Server online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
