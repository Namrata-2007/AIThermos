export interface SatelliteObservation {
  observationId: string;
  satellite: string;
  instrument: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  frp: number; // Fire Radiative Power in MW
  brightnessTemperature: number; // in Kelvin
  confidence: number; // 0 - 100
  source: string;
  sourceProductId?: string;
  isDemo: boolean;
  notes?: string;
}

export interface SatelliteQueryOptions {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  bbox?: string; // minLon,minLat,maxLon,maxLat
  days?: number;
}

export interface SatelliteMetadata {
  id: string;
  name: string;
  agency: string;
  sensor: string;
  resolution: string;
  revisitFrequency: string;
  status: 'ACTIVE' | 'CALIBRATION' | 'OFFLINE';
  spectralBands: string[];
}

export interface SatelliteDataProvider {
  readonly name: string;
  readonly mode: 'DEMO' | 'LIVE';
  isConfigured(): boolean;
  getSatellites(): Promise<SatelliteMetadata[]>;
  getObservations(options?: SatelliteQueryOptions): Promise<SatelliteObservation[]>;
  getStatus(): {
    mode: 'DEMO' | 'LIVE';
    provider: string;
    configured: boolean;
    activeSatellites: number;
    lastObservationTime?: string;
  };
}
