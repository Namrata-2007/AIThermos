import { 
  ThermalEvent, 
  IncidentRecord, 
  DispatchRecord, 
  EmergencyServiceType, 
  DispatchMode, 
  EmergencyHealthStatus, 
  DispatchAuditEvent,
  DispatchTestRunResult 
} from '../types.ts';

/**
 * Deterministic rules to check if an event is dispatch eligible
 * AI does NOT choose thresholds or trigger dispatch.
 */
export function evaluateDispatchEligibility(event: ThermalEvent): {
  eligible: boolean;
  riskScore: number;
  evidenceValid: boolean;
  distanceToIndustryKm: number;
  reason: string;
} {
  const riskScore = event.itriScore ?? Math.min(100, Math.round((event.frp / 2.5) + (event.confidence * 0.3)));
  const distanceToIndustryKm = event.nearestIndustrialSite?.distanceKm ?? 999;
  
  // Strict 4-criteria confirmation logic
  const isHighThermal = (event.frp >= 95 || (event.brightnessTemperature ?? 300) >= 360);
  const isHighConfidence = (event.confidence >= 80);
  const isIndustryNearby = distanceToIndustryKm <= 2.0;
  const isMultiPass = ((event.historicalObservations?.length ?? 1) >= 2 || event.persistenceHours >= 2.0);

  const evidenceValid = isHighThermal && isHighConfidence && isIndustryNearby && isMultiPass;
  const eligible = riskScore >= 75 && distanceToIndustryKm <= 5.0;

  let reason = '';
  if (!eligible) {
    if (distanceToIndustryKm > 5.0) {
      reason = `Facility distance (${distanceToIndustryKm.toFixed(1)}km) exceeds primary hazard radius (5.0km).`;
    } else {
      reason = `Risk score (${riskScore}/100) below critical dispatch threshold (75/100).`;
    }
  } else {
    reason = evidenceValid 
      ? `Full multi-spectral evidence validated within ${distanceToIndustryKm.toFixed(1)}km of ${event.nearestIndustrialSite?.name || 'facility'}.`
      : `High thermal risk (${riskScore}/100) detected; eligible for precautionary dispatch.`;
  }

  return {
    eligible,
    riskScore,
    evidenceValid,
    distanceToIndustryKm,
    reason
  };
}

/**
 * Check if an incident's coordinates match the current selected hotspot
 * Location consistency validator to prevent stale dispatch
 */
export function isIncidentMatchingCurrentHotspot(
  incident: IncidentRecord | null,
  hotspot: ThermalEvent | null
): { matches: boolean; diffKm: number; message: string } {
  if (!incident || !hotspot) {
    return { matches: false, diffKm: 999, message: 'Missing incident or hotspot reference.' };
  }

  const latDiff = Math.abs(incident.latitude - hotspot.latitude);
  const lonDiff = Math.abs(incident.longitude - hotspot.longitude);

  // Approximately 0.001 deg is ~110m
  const isCoordSame = latDiff < 0.001 && lonDiff < 0.001;

  if (!isCoordSame) {
    // calculate approx haversine distance
    const R = 6371;
    const dLat = (hotspot.latitude - incident.latitude) * Math.PI / 180;
    const dLon = (hotspot.longitude - incident.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(incident.latitude * Math.PI / 180) * Math.cos(hotspot.latitude * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;

    return {
      matches: false,
      diffKm: distKm,
      message: `Dispatch blocked: incident coordinates (${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}) do not match selected hotspot (${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}) [Delta: ${distKm.toFixed(1)}km].`
    };
  }

  return {
    matches: true,
    diffKm: 0,
    message: 'Coordinates match active hotspot.'
  };
}

/**
 * Fetch or create an incident on the backend
 */
export async function createOrFetchIncident(event: ThermalEvent): Promise<IncidentRecord> {
  const payload = {
    hotspotId: event.id || event.eventId,
    latitude: event.latitude,
    longitude: event.longitude,
    locationName: event.nearestIndustrialSite?.name || `${event.country || 'Region'} Industrial Zone`,
    country: event.country || 'India',
    region: event.regionName || 'Industrial Corridor',
    industrialSite: event.nearestIndustrialSite?.name || 'Critical Facility',
    fireRisk: event.itriScore || 80,
    confidence: event.confidence || 90,
    FRP: event.frp || 120,
    brightnessTemperature: event.brightnessTemperature || 350,
    satellite: event.satellite || 'VIIRS_NOAA20',
    observationTime: `${event.acquisitionDate} ${event.acquisitionTime}`
  };

  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create incident' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.incident;
}

/**
 * Submit Emergency Dispatch request
 */
export async function requestEmergencyDispatch(params: {
  incidentId: string;
  services: EmergencyServiceType[];
  mode: DispatchMode;
  priority?: 'ROUTINE' | 'HIGH' | 'CRITICAL';
  currentHotspot: {
    id: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
  };
}): Promise<{
  success: boolean;
  dispatch: DispatchRecord;
  message: string;
  status: string;
}> {
  const res = await fetch('/api/emergency/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incidentId: params.incidentId,
      services: params.services,
      mode: params.mode,
      priority: params.priority || 'CRITICAL',
      currentHotspot: params.currentHotspot
    })
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Dispatch request failed with HTTP ${res.status}`;
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    (error as any).response = data;
    throw error;
  }

  return data;
}

/**
 * Retry failed dispatch services
 */
export async function retryEmergencyDispatch(dispatchId: string): Promise<DispatchRecord> {
  const res = await fetch(`/api/emergency/dispatch/${dispatchId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Retry failed with HTTP ${res.status}`);
  }

  return data.dispatch;
}

/**
 * Cancel a dispatch
 */
export async function cancelEmergencyDispatch(dispatchId: string, reason: string = 'User cancellation'): Promise<DispatchRecord> {
  const res = await fetch(`/api/emergency/dispatch/${dispatchId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Cancellation failed with HTTP ${res.status}`);
  }

  return data.dispatch;
}

/**
 * Fetch all dispatches
 */
export async function fetchAllDispatches(filters?: {
  mode?: string;
  status?: string;
  incidentId?: string;
}): Promise<{ dispatches: DispatchRecord[]; totalCount: number }> {
  const query = new URLSearchParams();
  if (filters?.mode && filters.mode !== 'ALL') query.set('mode', filters.mode);
  if (filters?.status && filters.status !== 'ALL') query.set('status', filters.status);
  if (filters?.incidentId) query.set('incidentId', filters.incidentId);

  const res = await fetch(`/api/emergency/dispatch?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load dispatches: HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Fetch specific dispatch with its audit events
 */
export async function fetchDispatchDetails(dispatchId: string): Promise<{
  dispatch: DispatchRecord;
  auditEvents: DispatchAuditEvent[];
}> {
  const res = await fetch(`/api/emergency/dispatch/${dispatchId}`);
  if (!res.ok) {
    throw new Error(`Failed to load dispatch ${dispatchId}: HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Fetch Emergency System Health
 */
export async function fetchEmergencyHealth(): Promise<EmergencyHealthStatus> {
  const res = await fetch('/api/emergency/health');
  if (!res.ok) {
    return {
      mode: 'TEST',
      provider: 'MOCK',
      available: false,
      liveDispatchEnabled: false,
      statusText: 'Health check failed'
    };
  }

  return await res.json();
}

/**
 * Run automated 10-point test runner
 */
export async function runAutomatedDispatchTests(): Promise<{
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  results: DispatchTestRunResult[];
}> {
  const res = await fetch('/api/emergency/test-runner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Test runner failed: HTTP ${res.status}`);
  }

  return await res.json();
}
