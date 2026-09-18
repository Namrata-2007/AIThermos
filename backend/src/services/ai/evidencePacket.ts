import { SatelliteObservation } from '../satellite/types.ts';
import { findNearestIndustrialSite, rankFireStationsForEvent, rankHospitalsForEvent } from '../gis/gisEngine.ts';
import { INDUSTRIAL_SITES, FIRE_STATIONS, HOSPITALS } from '../../data/mockGeospatial.ts';

export interface VerifiedTelemetryEvidence {
  satellite: string;
  instrument: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  frpMw: number;
  brightnessTemperatureK: number;
  confidenceScore: number;
  sourceProvider: string;
  sourceProductId?: string;
  isDemoObservation: boolean;
}

export interface VerifiedGisContext {
  nearestIndustrialFacility?: {
    name: string;
    facilityType: string;
    distanceKm: number;
  };
  nearestFireCommand?: {
    name: string;
    distanceKm: number;
    estimatedEtaMinutes: number;
  };
  nearestHospitalICU?: {
    name: string;
    distanceKm: number;
  };
}

export interface EvidencePacket {
  packetId: string;
  createdAt: string;
  verifiedTelemetry: VerifiedTelemetryEvidence;
  gisContext: VerifiedGisContext;
  preliminaryClassification: 'THERMAL_ANOMALY' | 'FIRE_CANDIDATE' | 'HIGH_CONFIDENCE_CANDIDATE' | 'CONFIRMED_BY_EXTERNAL_EVIDENCE';
}

export function buildEvidencePacket(obs: SatelliteObservation): EvidencePacket {
  const nearestSite = findNearestIndustrialSite(obs.latitude, obs.longitude, INDUSTRIAL_SITES);
  
  const dummyEvent: any = {
    id: obs.observationId,
    latitude: obs.latitude,
    longitude: obs.longitude,
    frp: obs.frp,
    brightnessTemperature: obs.brightnessTemperature,
    confidence: obs.confidence
  };

  const rankedFire = rankFireStationsForEvent(dummyEvent, FIRE_STATIONS);
  const rankedHosp = rankHospitalsForEvent(dummyEvent, HOSPITALS);

  let prelimClass: EvidencePacket['preliminaryClassification'] = 'THERMAL_ANOMALY';
  if (obs.frp > 80 && obs.brightnessTemperature > 360 && obs.confidence > 90) {
    prelimClass = 'HIGH_CONFIDENCE_CANDIDATE';
  } else if (obs.frp > 40 && obs.confidence > 75) {
    prelimClass = 'FIRE_CANDIDATE';
  }

  return {
    packetId: `EVD-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    verifiedTelemetry: {
      satellite: obs.satellite,
      instrument: obs.instrument,
      timestamp: obs.timestamp,
      latitude: obs.latitude,
      longitude: obs.longitude,
      frpMw: obs.frp,
      brightnessTemperatureK: obs.brightnessTemperature,
      confidenceScore: obs.confidence,
      sourceProvider: obs.source,
      sourceProductId: obs.sourceProductId,
      isDemoObservation: obs.isDemo
    },
    gisContext: {
      nearestIndustrialFacility: nearestSite ? {
        name: nearestSite.name,
        facilityType: nearestSite.facilityType,
        distanceKm: nearestSite.distanceKm
      } : undefined,
      nearestFireCommand: rankedFire[0] ? {
        name: rankedFire[0].station.name,
        distanceKm: rankedFire[0].distanceKm,
        estimatedEtaMinutes: rankedFire[0].estimatedTravelTimeMinutes
      } : undefined,
      nearestHospitalICU: rankedHosp[0] ? {
        name: rankedHosp[0].hospital.name,
        distanceKm: rankedHosp[0].distanceKm
      } : undefined
    },
    preliminaryClassification: prelimClass
  };
}
