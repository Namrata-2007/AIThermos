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
  isTest?: boolean;
  desiredOutcome?: 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED';
}

export interface TelephonyCallResult {
  success: boolean;
  providerCallId: string;
  initialStatus: string;
  message?: string;
  isSimulated: boolean;
}

export interface TelephonyProvider {
  readonly name: string;
  isConfigured(): boolean;
  initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResult>;
  hangupCall?(providerCallId: string): Promise<boolean>;
}
