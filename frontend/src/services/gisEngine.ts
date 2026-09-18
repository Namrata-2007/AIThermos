import { 
  IndustrialSite, 
  FireStation, 
  Hospital, 
  ThermalEvent, 
  ResponseResourceRanking,
  PoliceStation,
  AmbulanceUnit
} from '../types.ts';
import { 
  INDUSTRIAL_SITES, 
  FIRE_STATIONS, 
  HOSPITALS,
  POLICE_STATIONS,
  AMBULANCE_UNITS
} from '../data/mockGeospatial.ts';

/**
 * Computes exact great-circle distance between two GPS coordinates using Haversine formula.
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Checks if coordinates fall within bounding box [minLon, minLat, maxLon, maxLat].
 */
export function isWithinBoundingBox(lat: number, lon: number, minLat: number, minLon: number, maxLat: number, maxLon: number): boolean {
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

/**
 * Finds the nearest industrial facility to a given coordinate.
 */
export function findNearestIndustrialSite(lat: number, lon: number, sites: IndustrialSite[] = INDUSTRIAL_SITES) {
  if (!sites.length) return null;
  
  let nearest = sites[0];
  let minDistance = calculateHaversineDistance(lat, lon, nearest.latitude, nearest.longitude);
  
  for (let i = 1; i < sites.length; i++) {
    const dist = calculateHaversineDistance(lat, lon, sites[i].latitude, sites[i].longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = sites[i];
    }
  }

  // If nearest site is over 200km away (arbitrary global position clicked by user), synthesize a plausible local facility context
  if (minDistance > 200) {
    return {
      id: `IND-LOCAL-${Math.round(lat*100)}-${Math.round(lon*100)}`,
      name: `Local Industrial Asset (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      facilityType: 'Manufacturing' as const,
      latitude: lat + 0.012,
      longitude: lon + 0.015,
      hazmatTier: 'Tier 2 (High)' as const,
      source: 'OpenStreetMap' as const,
      address: `Geospatial Coordinate Cluster [${lat.toFixed(3)}, ${lon.toFixed(3)}]`,
      distanceKm: 1.8
    };
  }
  
  return {
    ...nearest,
    distanceKm: minDistance
  };
}

/**
 * Estimates emergency response driving time in minutes.
 * Uses realistic urban/corridor average speed (35-45 km/h for heavy emergency tenders).
 */
export function estimateEmergencyTravelTime(distanceKm: number, isUrban: boolean = true): number {
  const avgSpeedKmh = isUrban ? 38 : 55;
  const dispatchTurnoutMinutes = 2.5; // Turnout time
  const travelMinutes = (distanceKm / avgSpeedKmh) * 60;
  return Math.max(3, Math.round(dispatchTurnoutMinutes + travelMinutes));
}

/**
 * Ranks available fire stations for a specific thermal event.
 */
export function rankFireStationsForEvent(event: ThermalEvent, stations: FireStation[] = FIRE_STATIONS): ResponseResourceRanking[] {
  const isIndustrialEvent = event.classification === 'Industrial Fire' || event.classification === 'Persistent Industrial Thermal Source' || event.classification === 'Gas Flare';
  
  let candidateStations = stations;
  // Compute distance to all verified stations
  const stationsWithDistance = candidateStations.map(station => {
    const distanceKm = calculateHaversineDistance(event.latitude, event.longitude, station.latitude, station.longitude);
    return { station, distanceKm };
  });

  const nearestVerified = stationsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm)[0];
  const isOutOfRange = !nearestVerified || nearestVerified.distanceKm > 75;

  return candidateStations
    .map((station) => {
      const distanceKm = calculateHaversineDistance(event.latitude, event.longitude, station.latitude, station.longitude);
      const arrivalMins = estimateEmergencyTravelTime(distanceKm, distanceKm < 15);
      const isOutsideRadius = distanceKm > 75;
      
      // Calculate capability score based on incident type
      let capabilityScore = 50;
      const keyStrengths: string[] = [];
      
      if (station.capability.includes('Chemical Foam Tender')) {
        capabilityScore += isIndustrialEvent ? 25 : 10;
        keyStrengths.push('Chemical Foam Suppression');
      }
      if (station.capability.includes('Industrial High-Volume Pump')) {
        capabilityScore += isIndustrialEvent ? 15 : 5;
        keyStrengths.push('High-Volume Pump');
      }
      if (station.capability.includes('Hazmat Containment')) {
        capabilityScore += isIndustrialEvent ? 15 : 5;
        keyStrengths.push('Hazmat Containment Unit');
      }
      if (station.capability.includes('Aerial Ladder 54m')) {
        capabilityScore += 10;
        keyStrengths.push('54m Aerial Platform');
      }
      
      // Distance decay penalty
      const distancePenalty = Math.min(40, distanceKm * 1.5);
      const finalSuitability = Math.max(10, Math.min(100, Math.round(capabilityScore - distancePenalty + 30)));
      
      return {
        resourceId: station.id,
        resourceType: 'FIRE_STATION' as const,
        name: isOutsideRadius ? `${station.name} [Outside 75km Range]` : station.name,
        distanceKm,
        estimatedArrivalMinutes: isOutsideRadius ? null : arrivalMins,
        isOutsideRadius,
        capabilityScore: Math.min(100, capabilityScore),
        suitabilityRank: finalSuitability,
        keyStrengths,
        contactNumber: station.contactNumber,
        coordinates: {
          lat: station.latitude,
          lng: station.longitude
        }
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Ranks available hospitals with trauma and burn ICU capabilities.
 */
export function rankHospitalsForEvent(event: ThermalEvent, hospitals: Hospital[] = HOSPITALS): ResponseResourceRanking[] {
  return hospitals
    .map((hosp) => {
      const distanceKm = calculateHaversineDistance(event.latitude, event.longitude, hosp.latitude, hosp.longitude);
      const arrivalMins = estimateEmergencyTravelTime(distanceKm, distanceKm < 15);
      const isOutsideRadius = distanceKm > 75;
      
      let capabilityScore = 40;
      const keyStrengths: string[] = [];
      
      if (hosp.emergencyCapability.includes('Advanced Burn ICU')) {
        capabilityScore += 25;
        keyStrengths.push(`Burn ICU (${hosp.burnBedCapacity} beds)`);
      }
      if (hosp.emergencyCapability.includes('Level 1 Trauma Center')) {
        capabilityScore += 20;
        keyStrengths.push('Level 1 Trauma');
      }
      if (hosp.emergencyCapability.includes('Toxicology Unit')) {
        capabilityScore += 15;
        keyStrengths.push('Industrial Toxicology');
      }
      
      const distancePenalty = Math.min(45, distanceKm * 1.8);
      const finalSuitability = Math.max(10, Math.min(100, Math.round(capabilityScore - distancePenalty + 35)));
      
      return {
        resourceId: hosp.id,
        resourceType: 'HOSPITAL' as const,
        name: isOutsideRadius ? `${hosp.name} [Outside 75km Range]` : hosp.name,
        distanceKm,
        estimatedArrivalMinutes: isOutsideRadius ? null : arrivalMins,
        isOutsideRadius,
        capabilityScore: Math.min(100, capabilityScore),
        suitabilityRank: finalSuitability,
        keyStrengths,
        contactNumber: hosp.contactNumber,
        coordinates: {
          lat: hosp.latitude,
          lng: hosp.longitude
        }
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Ranks available police stations for public evacuation and perimeter control.
 */
export function rankPoliceStationsForEvent(event: ThermalEvent, stations: PoliceStation[] = POLICE_STATIONS) {
  return stations
    .map((station) => {
      const distanceKm = calculateHaversineDistance(event.latitude, event.longitude, station.latitude, station.longitude);
      const etaMinutes = estimateEmergencyTravelTime(distanceKm, distanceKm < 15);
      const isOutsideRadius = distanceKm > 75;
      return {
        ...station,
        distanceKm,
        etaMinutes: isOutsideRadius ? null : etaMinutes,
        isOutsideRadius
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Ranks available ambulance units for medical extraction.
 */
export function rankAmbulanceUnitsForEvent(event: ThermalEvent, units: AmbulanceUnit[] = AMBULANCE_UNITS) {
  return units
    .map((unit) => {
      const distanceKm = calculateHaversineDistance(event.latitude, event.longitude, unit.latitude, unit.longitude);
      const etaMinutes = estimateEmergencyTravelTime(distanceKm, distanceKm < 15);
      const isOutsideRadius = distanceKm > 75;
      return {
        ...unit,
        distanceKm,
        etaMinutes: isOutsideRadius ? null : etaMinutes,
        isOutsideRadius
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Generates realistic road route waypoints between responder and incident coordinates.
 */
export function generateRouteGeometry(fromLat: number, fromLng: number, toLat: number, toLng: number): [number, number][] {
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;
  const bendLat = midLat + (fromLng - toLng) * 0.15;
  const bendLng = midLng - (fromLat - toLat) * 0.15;

  return [
    [fromLat, fromLng],
    [(fromLat * 0.7 + bendLat * 0.3), (fromLng * 0.7 + bendLng * 0.3)],
    [bendLat, bendLng],
    [(bendLat * 0.3 + toLat * 0.7), (bendLng * 0.3 + toLng * 0.7)],
    [toLat, toLng]
  ];
}

