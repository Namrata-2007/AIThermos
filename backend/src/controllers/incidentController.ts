import { Request, Response } from 'express';
import { INITIAL_THERMAL_EVENTS, INDUSTRIAL_SITES } from '../data/mockGeospatial.ts';
import { findNearestIndustrialSite } from '../services/gis/gisEngine.ts';
import { calculateItriRisk } from '../services/gis/riskEngine.ts';

export function getIncidents(req: Request, res: Response) {
  const incidents = INITIAL_THERMAL_EVENTS.map(evt => {
    const nearest = findNearestIndustrialSite(evt.latitude, evt.longitude, INDUSTRIAL_SITES);
    const risk = calculateItriRisk(evt);

    return {
      incidentId: `INC-${evt.id}`,
      hotspotId: evt.id,
      latitude: evt.latitude,
      longitude: evt.longitude,
      locationName: nearest ? `${nearest.name} Sector` : 'Industrial Zone Alpha',
      country: 'IN',
      region: 'Western Corridor',
      industrialSite: nearest?.name,
      fireRisk: risk.finalItri,
      confidence: evt.confidence,
      FRP: evt.frp,
      brightnessTemperature: evt.brightnessTemperature,
      satellite: evt.satellite,
      observationTime: evt.timestamp,
      status: evt.frp > 80 ? 'CRITICAL' : 'EVALUATED',
      evidenceValid: true,
      distanceToIndustryKm: nearest?.distanceKm
    };
  });

  res.json({
    success: true,
    count: incidents.length,
    incidents
  });
}

export function getThermalEvents(req: Request, res: Response) {
  res.json(INITIAL_THERMAL_EVENTS);
}

export function getIndustrialSites(req: Request, res: Response) {
  res.json(INDUSTRIAL_SITES);
}
