import { TelephonyProvider } from './types.ts';
import { MockTelephonyProvider } from './MockTelephonyProvider.ts';
import { LiveTelephonyProvider } from './LiveTelephonyProvider.ts';

class TelephonyManager {
  private mockProvider = new MockTelephonyProvider();
  private liveProvider = new LiveTelephonyProvider();

  public getProvider(requestedMode?: string): TelephonyProvider {
    const mode = (requestedMode || process.env.TELEPHONY_MODE || 'TEST').toUpperCase();
    if (mode === 'LIVE') {
      return this.liveProvider;
    }
    return this.mockProvider;
  }

  public getStatus() {
    const configuredMode = (process.env.TELEPHONY_MODE || 'TEST').toUpperCase();
    const liveConfigured = this.liveProvider.isConfigured();

    return {
      activeMode: configuredMode,
      twilioConfigured: liveConfigured,
      twilioPhoneNumber: liveConfigured ? process.env.TWILIO_PHONE_NUMBER : undefined,
      providers: {
        mock: { name: this.mockProvider.name, ready: true },
        live: { name: this.liveProvider.name, ready: liveConfigured }
      }
    };
  }
}

export const telephonyManager = new TelephonyManager();
export * from './types.ts';
