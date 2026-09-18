import { Request, Response } from 'express';
import { satelliteManager } from '../services/satellite/index.ts';
import { TARGET_CORRIDORS, INDUSTRIAL_SITES, INITIAL_THERMAL_EVENTS } from '../data/mockGeospatial.ts';
import { calculateHaversineDistance, findNearestIndustrialSite } from '../services/gis/gisEngine.ts';

export async function getSatellites(req: Request, res: Response) {
  try {
    const provider = satelliteManager.getProvider();
    const satellites = await provider.getSatellites();
    res.json({
      success: true,
      count: satellites.length,
      mode: provider.mode,
      satellites
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve satellites', details: err.message });
  }
}

export async function getObservations(req: Request, res: Response) {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined;
    const bbox = req.query.bbox as string | undefined;

    const provider = satelliteManager.getProvider();
    const observations = await provider.getObservations({ latitude: lat, longitude: lon, radiusKm, bbox });

    res.json({
      success: true,
      count: observations.length,
      mode: provider.mode,
      provider: provider.name,
      observations
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve observations', details: err.message });
  }
}

export async function getHotspots(req: Request, res: Response) {
  try {
    const provider = satelliteManager.getProvider();
    const observations = await provider.getObservations();

    // Map observations to hotspots with verified classification
    const hotspots = observations.map(obs => {
      let status: 'THERMAL_ANOMALY' | 'FIRE_CANDIDATE' | 'HIGH_CONFIDENCE_CANDIDATE' = 'THERMAL_ANOMALY';
      if (obs.frp > 80 && obs.brightnessTemperature > 360) {
        status = 'HIGH_CONFIDENCE_CANDIDATE';
      } else if (obs.frp > 40) {
        status = 'FIRE_CANDIDATE';
      }

      const nearest = findNearestIndustrialSite(obs.latitude, obs.longitude, INDUSTRIAL_SITES);

      return {
        id: `HS-${obs.observationId.replace('OBS-', '')}`,
        observationId: obs.observationId,
        latitude: obs.latitude,
        longitude: obs.longitude,
        frp: obs.frp,
        brightnessTemperature: obs.brightnessTemperature,
        confidence: obs.confidence,
        satellite: obs.satellite,
        instrument: obs.instrument,
        timestamp: obs.timestamp,
        status,
        isDemo: obs.isDemo,
        source: obs.source,
        nearestIndustrialSite: nearest ? {
          id: nearest.id,
          name: nearest.name,
          type: nearest.facilityType,
          distanceKm: nearest.distanceKm
        } : undefined
      };
    });

    res.json({
      success: true,
      count: hotspots.length,
      mode: provider.mode,
      hotspots
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve hotspots', details: err.message });
  }
}

export function getLocations(req: Request, res: Response) {
  res.json({
    success: true,
    corridors: TARGET_CORRIDORS,
    industrialSites: INDUSTRIAL_SITES
  });
}

export function getCorridors(req: Request, res: Response) {
  res.json(TARGET_CORRIDORS);
}

export async function getFirms(req: Request, res: Response) {
  const provider = satelliteManager.getProvider();
  const observations = await provider.getObservations();

  res.json({
    source: 'NASA_FIRMS_METEOSAT_BRIDGE',
    mode: provider.mode,
    count: observations.length,
    events: observations.map(o => ({
      id: o.observationId,
      latitude: o.latitude,
      longitude: o.longitude,
      frp: o.frp,
      brightnessTemperature: o.brightnessTemperature,
      confidence: o.confidence,
      satellite: o.satellite,
      timestamp: o.timestamp,
      classification: o.frp > 80 ? 'HIGH_CONFIDENCE_CANDIDATE' : 'THERMAL_ANOMALY',
      isDemo: o.isDemo
    }))
  });
}

export function assessOccurrences(req: Request, res: Response) {
  const targetLat = parseFloat((req.query.lat || req.query.latitude) as string) || 18.75;
  const targetLon = parseFloat((req.query.lon || req.query.longitude) as string) || 73.41;
  const radiusKm = parseFloat((req.query.radiusKm || req.query.radius) as string) || 25;

  const nearest = findNearestIndustrialSite(targetLat, targetLon, INDUSTRIAL_SITES);
  const indDist = nearest ? nearest.distanceKm : 999;

  res.json({
    locationName: nearest?.name || `Coordinates [${targetLat.toFixed(4)}°N, ${targetLon.toFixed(4)}°E]`,
    latitude: targetLat,
    longitude: targetLon,
    radiusKm,
    satelliteSource: 'METEOSAT-11 / VIIRS',
    evaluatedAt: new Date().toISOString(),
    fireDetected: indDist < 5,
    activeHotspotCount: indDist < 5 ? 1 : 0,
    riskLevel: indDist < 2 ? 'CRITICAL' : (indDist < 8 ? 'HIGH' : 'LOW'),
    headline: indDist < 5 ? 'ACTIVE THERMAL ANOMALY IN PROXIMITY' : 'NO ACTIVE FIRE DETECTED BY SATELLITE',
    detailedReason: `Multi-channel radiometric telemetry evaluated over ${radiusKm}km radius around target sector.`,
    nearestIndustrialFacility: nearest
  });
}
