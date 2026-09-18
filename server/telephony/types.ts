export interface TelephonyCallRequest {
  callId: string;
  phoneNumber: string;
  responderName: string;
  role: string;
  incidentId: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  frp?: number;
  severity?: string;
  classification?: string;
  isTest: boolean;
  desiredOutcome?: 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED';
}

export interface TelephonyCallResult {
  providerCallId: string;
  provider: 'MockTelephonyProvider' | 'TwilioLiveTelephonyProvider';
  initialStatus: 'QUEUED' | 'INITIATING' | 'FAILED';
  message?: string;
}

export interface TelephonyProvider {
  name: 'MockTelephonyProvider' | 'TwilioLiveTelephonyProvider';
  isConfigured(): boolean;
  initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResult>;
  getCallStatus(providerCallId: string): Promise<{
    status: 'QUEUED' | 'INITIATING' | 'RINGING' | 'ANSWERED' | 'COMPLETED' | 'NO_ANSWER' | 'BUSY' | 'FAILED' | 'CANCELLED';
    duration?: number;
    error?: string;
  }>;
  hangupCall(providerCallId: string): Promise<boolean>;
}
