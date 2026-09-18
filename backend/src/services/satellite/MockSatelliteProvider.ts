import { SatelliteDataProvider, SatelliteMetadata, SatelliteObservation, SatelliteQueryOptions } from './types.ts';
import { calculateHaversineDistance } from '../gis/gisEngine.ts';

export class MockSatelliteProvider implements SatelliteDataProvider {
  public readonly name = 'MockSatelliteProvider';
  public readonly mode = 'DEMO' as const;

  private satellites: SatelliteMetadata[] = [
    {
      id: 'METEOSAT-11',
      name: 'Meteosat-11 (SEVIRI)',
      agency: 'EUMETSAT',
      sensor: 'Spinning Enhanced Visible and InfraRed Imager',
      resolution: '3.0 km (Thermal IR 3.9µm)',
      revisitFrequency: 'Every 15 minutes',
      status: 'ACTIVE',
      spectralBands: ['IR3.9 (MWIR)', 'IR10.8 (TIR)', 'WV6.2', 'HRV']
    },
    {
      id: 'NOAA-21-VIIRS',
      name: 'NOAA-21 / Suomi-NPP (VIIRS)',
      agency: 'NASA / NOAA',
      sensor: 'Visible Infrared Imaging Radiometer Suite',
      resolution: '375m (I-Bands)',
      revisitFrequency: 'Every 12 hours (Sun-synchronous)',
      status: 'ACTIVE',
      spectralBands: ['I4 (3.74µm)', 'I5 (11.45µm)', 'M13 (4.05µm)']
    },
    {
      id: 'SENTINEL-3B-SLSTR',
      name: 'Sentinel-3B (SLSTR)',
      agency: 'ESA / Copernicus',
      sensor: 'Sea and Land Surface Temperature Radiometer',
      resolution: '1.0 km (FRP Channel)',
      revisitFrequency: 'Every 24 hours',
      status: 'ACTIVE',
      spectralBands: ['F1 (3.7µm dedicated fire channel)', 'S7 (3.74µm)', 'S8 (10.8µm)']
    }
  ];

  // Verified, realistic demo observations tied to designated industrial locations
  private demoObservations: SatelliteObservation[] = [
    {
      observationId: 'OBS-DEMO-001',
      satellite: 'METEOSAT-11',
      instrument: 'SEVIRI',
      timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      latitude: 18.7523,
      longitude: 73.4112,
      frp: 86.4,
      brightnessTemperature: 374.8,
      confidence: 94,
      source: 'DEMO_MOCK_METEOSAT',
      sourceProductId: 'MSG-FRP-DEMO-20260918-0815',
      isDemo: true,
      notes: 'DEMO ONLY: High-intensity thermal flare signature near Petrochem Tank Farm Sector B.'
    },
    {
      observationId: 'OBS-DEMO-002',
      satellite: 'NOAA-21-VIIRS',
      instrument: 'VIIRS',
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      latitude: 19.1124,
      longitude: 73.0125,
      frp: 48.2,
      brightnessTemperature: 342.1,
      confidence: 88,
      source: 'DEMO_MOCK_VIIRS',
      sourceProductId: 'VNP14IMGTDL_NRT-20260918',
      isDemo: true,
      notes: 'DEMO ONLY: Moderate thermal emission consistent with industrial process flare.'
    },
    {
      observationId: 'OBS-DEMO-003',
      satellite: 'SENTINEL-3B-SLSTR',
      instrument: 'SLSTR',
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      latitude: 18.6219,
      longitude: 73.7845,
      frp: 112.5,
      brightnessTemperature: 388.4,
      confidence: 97,
      source: 'DEMO_MOCK_SLSTR',
      sourceProductId: 'S3B_SL_2_FRP____20260918',
      isDemo: true,
      notes: 'DEMO ONLY: Critical radiant heat flux anomaly detected adjacent to Chemical Complex 4.'
    },
    {
      observationId: 'OBS-DEMO-004',
      satellite: 'METEOSAT-11',
      instrument: 'SEVIRI',
      timestamp: new Date(Date.now() - 78 * 60 * 1000).toISOString(),
      latitude: 20.0152,
      longitude: 73.7841,
      frp: 35.8,
      brightnessTemperature: 331.6,
      confidence: 82,
      source: 'DEMO_MOCK_METEOSAT',
      sourceProductId: 'MSG-FRP-DEMO-20260918-0700',
      isDemo: true,
      notes: 'DEMO ONLY: Thermal anomaly near refinery distillation unit.'
    },
    {
      observationId: 'OBS-DEMO-005',
      satellite: 'NOAA-21-VIIRS',
      instrument: 'VIIRS',
      timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      latitude: 19.8241,
      longitude: 75.3129,
      frp: 64.1,
      brightnessTemperature: 358.9,
      confidence: 91,
      source: 'DEMO_MOCK_VIIRS',
      sourceProductId: 'VNP14IMGTDL_NRT-20260918-0630',
      isDemo: true,
      notes: 'DEMO ONLY: Secondary anomalous hotspot detected in dry industrial estate corridor.'
    }
  ];

  public isConfigured(): boolean {
    return true;
  }

  public async getSatellites(): Promise<SatelliteMetadata[]> {
    return this.satellites;
  }

  public async getObservations(options?: SatelliteQueryOptions): Promise<SatelliteObservation[]> {
    let results = [...this.demoObservations];

    if (options?.latitude !== undefined && options?.longitude !== undefined) {
      const lat = options.latitude;
      const lon = options.longitude;
      const radius = options.radiusKm || 50;

      results = results.filter(obs => {
        const dist = calculateHaversineDistance(lat, lon, obs.latitude, obs.longitude);
        return dist <= radius;
      });

      // If no points within radius, synthesize a realistic localized demo observation if specifically requested
      if (results.length === 0 && radius >= 100) {
        results = [
          {
            observationId: `OBS-SYNTH-${Math.round(lat * 100)}-${Math.round(lon * 100)}`,
            satellite: 'METEOSAT-11',
            instrument: 'SEVIRI',
            timestamp: new Date().toISOString(),
            latitude: lat + (Math.random() * 0.04 - 0.02),
            longitude: lon + (Math.random() * 0.04 - 0.02),
            frp: 42.5,
            brightnessTemperature: 338.2,
            confidence: 85,
            source: 'DEMO_MOCK_METEOSAT',
            sourceProductId: `SYNTH-DEMO-${Date.now()}`,
            isDemo: true,
            notes: `DEMO ONLY: Synthesized simulation observation near requested coordinates.`
          }
        ];
      }
    }

    return results;
  }

  public getStatus() {
    return {
      mode: this.mode,
      provider: this.name,
      configured: true,
      activeSatellites: this.satellites.length,
      lastObservationTime: this.demoObservations[0].timestamp
    };
  }
}
