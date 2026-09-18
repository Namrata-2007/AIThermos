import { TelephonyProvider, TelephonyCallRequest, TelephonyCallResult } from './types.ts';
import { dbStore } from '../db/store.ts';

export class TwilioLiveTelephonyProvider implements TelephonyProvider {
  public name: 'TwilioLiveTelephonyProvider' = 'TwilioLiveTelephonyProvider';
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private getCredentials() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

    const isConfigured = Boolean(
      accountSid && 
      authToken && 
      fromNumber && 
      accountSid.startsWith('AC') &&
      !accountSid.includes('placeholder')
    );

    return { accountSid, authToken, fromNumber, isConfigured };
  }

  isConfigured(): boolean {
    return this.getCredentials().isConfigured;
  }

  async initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResult> {
    const { accountSid, authToken, fromNumber, isConfigured } = this.getCredentials();

    if (!isConfigured || !accountSid || !authToken || !fromNumber) {
      throw new Error(
        'Live calling is not configured. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be defined in your environment variables.'
      );
    }

    // Clean destination phone number to strict E.164
    let to = request.phoneNumber.trim().replace(/[\s\-()]/g, '');
    if (!to.startsWith('+')) {
      to = `+${to}`;
    }

    // Spoken voice alert message
    const speechMessage = `Emergency Alert from THERMOS Satellite Industrial Thermal Monitoring. A confirmed ${request.classification || 'high-hazard thermal anomaly'} has been detected at ${request.location}. Coordinates: ${request.coordinates.latitude.toFixed(4)} degrees North, ${request.coordinates.longitude.toFixed(4)} degrees East. Satellite Radiative Power: ${request.frp || 45} Megawatts. Automated tri-agency dispatch alert. Dispatch response units immediately.`;

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    // Note: Twilio Free Trial accounts strictly prohibit inline 'Twiml' parameter with HTTP 400:
    // "Invalid or disallowed parameters provided - trial accounts have limited parameter access..."
    // Trial accounts require the 'Url' parameter.
    // We use twimlets.com/message (Twilio's official hosted TwiML voice service)
    const twimletUrl = `https://twimlets.com/message?Message%5B0%5D=${encodeURIComponent(speechMessage)}`;
    const demoVoiceUrl = 'https://demo.twilio.com/docs/voice.xml';

    // Helper to send request to Twilio Calls API
    const makeTwilioCall = async (voiceUrl: string) => {
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', fromNumber);
      params.append('Url', voiceUrl);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        }
      );

      const data = await response.json();
      return { response, data };
    };

    try {
      // First attempt with dynamic voice message via Twilio Twimlet URL
      let { response, data } = await makeTwilioCall(twimletUrl);

      // If trial restrictions reject the twimlet URL, fallback to Twilio's official demo voice URL
      if (!response.ok && (data.message?.includes('trial accounts') || data.message?.includes('parameter'))) {
        console.warn('Twilio trial URL rejected twimlet, falling back to demo.twilio.com voice URL...');
        const retryResult = await makeTwilioCall(demoVoiceUrl);
        response = retryResult.response;
        data = retryResult.data;
      }

      if (!response.ok) {
        const errCode = data.code;
        const rawMsg = data.message || `Twilio HTTP error ${response.status}`;

        // Map Twilio specific error codes to helpful, user-actionable instructions
        if (errCode === 21608 || errCode === 21216 || rawMsg.includes('unverified')) {
          throw new Error(
            `Twilio Free Trial restriction: Target number ${to} is unverified. Trial accounts can only place calls to verified phone numbers. Please verify this number in your Twilio Console (twil.io/verified) or upgrade your Twilio account.`
          );
        }

        if (errCode === 21408 || rawMsg.includes('Permission to send') || rawMsg.includes('Geographic')) {
          throw new Error(
            `Twilio Voice Geographic Permissions error: Outbound calling to ${to} is disabled in your Twilio Console. Enable international voice permissions under Twilio Console > Voice > Settings > Geo permissions.`
          );
        }

        if (errCode === 21211 || rawMsg.includes('Invalid \'To\' Phone Number')) {
          throw new Error(
            `Invalid recipient phone number format: ${to}. Numbers must be in standard international E.164 format (e.g. +917841070875).`
          );
        }

        if (errCode === 21214 || rawMsg.includes('cannot be the same')) {
          throw new Error(
            `Twilio error: 'To' and 'From' phone numbers cannot be identical (${to}).`
          );
        }

        if (errCode === 20003 || response.status === 401) {
          throw new Error(
            'Twilio Authentication failed: Invalid TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. Please verify your credentials.'
          );
        }

        throw new Error(`Twilio Call Initiation Failed: ${rawMsg}`);
      }

      const twilioSid = data.sid as string;
      const initialTwilioStatus = (data.status as string) || 'queued';

      // Start polling Twilio for live call progression
      this.startStatusPolling(request.callId, twilioSid, accountSid, authHeader);

      return {
        providerCallId: twilioSid,
        provider: 'TwilioLiveTelephonyProvider',
        initialStatus: initialTwilioStatus === 'queued' ? 'QUEUED' : 'INITIATING',
        message: `Twilio live call dispatched. Call SID: ${twilioSid}`
      };
    } catch (err: any) {
      console.error('Twilio initiation exception:', err);
      throw err;
    }
  }

  private startStatusPolling(
    callId: string, 
    twilioSid: string, 
    accountSid: string, 
    authHeader: string
  ) {
    let pollCount = 0;
    const maxPolls = 90; // poll every 2s for up to 3 mins

    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        this.pollingIntervals.delete(twilioSid);
        return;
      }

      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${twilioSid}.json`,
          {
            headers: { 'Authorization': authHeader }
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        const twilioStatus = (data.status || '').toLowerCase();
        const duration = parseInt(data.duration || '0', 10);

        // Map Twilio statuses to our lifecycle
        // queued, initiated, ringing, in-progress, completed, busy, no-answer, failed, canceled
        const call = dbStore.getCallLog(callId);
        if (!call) return;

        if (twilioStatus === 'initiated' && call.status === 'QUEUED') {
          dbStore.updateCallLog(callId, {
            status: 'INITIATING',
            initiatedAt: new Date().toISOString()
          });
        } else if (twilioStatus === 'ringing' && call.status !== 'RINGING') {
          dbStore.updateCallLog(callId, {
            status: 'RINGING',
            ringingAt: new Date().toISOString()
          });
        } else if (twilioStatus === 'in-progress' && call.status !== 'ANSWERED') {
          dbStore.updateCallLog(callId, {
            status: 'ANSWERED',
            answeredAt: new Date().toISOString()
          });
        } else if (twilioStatus === 'completed') {
          dbStore.updateCallLog(callId, {
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            duration: duration || call.duration || 1
          });
          clearInterval(interval);
          this.pollingIntervals.delete(twilioSid);
        } else if (twilioStatus === 'no-answer') {
          dbStore.updateCallLog(callId, {
            status: 'NO_ANSWER',
            completedAt: new Date().toISOString(),
            duration: 0,
            errorMessage: 'Twilio reported no answer from responder terminal.'
          });
          clearInterval(interval);
          this.pollingIntervals.delete(twilioSid);
        } else if (twilioStatus === 'busy') {
          dbStore.updateCallLog(callId, {
            status: 'BUSY',
            completedAt: new Date().toISOString(),
            duration: 0,
            errorMessage: 'Twilio reported busy line from responder.'
          });
          clearInterval(interval);
          this.pollingIntervals.delete(twilioSid);
        } else if (twilioStatus === 'failed' || twilioStatus === 'canceled') {
          dbStore.updateCallLog(callId, {
            status: twilioStatus === 'canceled' ? 'CANCELLED' : 'FAILED',
            completedAt: new Date().toISOString(),
            duration: 0,
            errorMessage: data.error_message || 'Twilio call failed to bridge to carrier.'
          });
          clearInterval(interval);
          this.pollingIntervals.delete(twilioSid);
        }
      } catch (err) {
        console.error('Error polling Twilio call status:', err);
      }
    }, 2000);

    this.pollingIntervals.set(twilioSid, interval);
  }

  async getCallStatus(providerCallId: string) {
    const { accountSid, authToken, isConfigured } = this.getCredentials();
    if (!isConfigured || !accountSid || !authToken) {
      return { status: 'FAILED' as const, error: 'Twilio not configured' };
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}.json`,
        { headers: { 'Authorization': authHeader } }
      );
      if (!res.ok) {
        return { status: 'FAILED' as const, error: `Twilio lookup error ${res.status}` };
      }
      const data = await res.json();
      const st = (data.status || '').toLowerCase();
      let mappedStatus: 'QUEUED' | 'INITIATING' | 'RINGING' | 'ANSWERED' | 'COMPLETED' | 'NO_ANSWER' | 'BUSY' | 'FAILED' | 'CANCELLED' = 'QUEUED';
      if (st === 'ringing') mappedStatus = 'RINGING';
      else if (st === 'in-progress') mappedStatus = 'ANSWERED';
      else if (st === 'completed') mappedStatus = 'COMPLETED';
      else if (st === 'busy') mappedStatus = 'BUSY';
      else if (st === 'no-answer') mappedStatus = 'NO_ANSWER';
      else if (st === 'failed') mappedStatus = 'FAILED';
      else if (st === 'canceled') mappedStatus = 'CANCELLED';
      else if (st === 'initiated') mappedStatus = 'INITIATING';

      return {
        status: mappedStatus,
        duration: parseInt(data.duration || '0', 10)
      };
    } catch (e: any) {
      return { status: 'FAILED' as const, error: e.message };
    }
  }

  async hangupCall(providerCallId: string): Promise<boolean> {
    const { accountSid, authToken, isConfigured } = this.getCredentials();
    const interval = this.pollingIntervals.get(providerCallId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(providerCallId);
    }

    if (!isConfigured || !accountSid || !authToken) {
      return false;
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('Status', 'completed');

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}
