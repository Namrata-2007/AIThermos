import { SatelliteDataProvider } from './types.ts';
import { MockSatelliteProvider } from './MockSatelliteProvider.ts';
import { EumetsatMeteosatProvider } from './EumetsatMeteosatProvider.ts';

class SatelliteManager {
  private mockProvider = new MockSatelliteProvider();
  private liveProvider = new EumetsatMeteosatProvider();

  public getProvider(requestedMode?: string): SatelliteDataProvider {
    const mode = (requestedMode || process.env.SATELLITE_MODE || 'DEMO').toUpperCase();
    if (mode === 'LIVE') {
      return this.liveProvider;
    }
    return this.mockProvider;
  }

  public getStatus() {
    const configuredMode = (process.env.SATELLITE_MODE || 'DEMO').toUpperCase();
    const activeProvider = this.getProvider(configuredMode);
    return {
      activeMode: configuredMode,
      activeProvider: activeProvider.name,
      mockStatus: this.mockProvider.getStatus(),
      liveStatus: this.liveProvider.getStatus()
    };
  }
}

export const satelliteManager = new SatelliteManager();
export * from './types.ts';
