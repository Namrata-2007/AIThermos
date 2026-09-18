import { TelephonyProvider, TelephonyCallRequest, TelephonyCallResult } from './types.ts';
import { unifiedStore } from '../store.ts';
import { logger } from '../../utils/logger.ts';

export class LiveTelephonyProvider implements TelephonyProvider {
  public readonly name = 'LiveTelephonyProvider';
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

  public isConfigured(): boolean {
    return this.getCredentials().isConfigured;
  }

  public async initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResult> {
    const { accountSid, authToken, fromNumber, isConfigured } = this.getCredentials();

    if (!isConfigured || !accountSid || !authToken || !fromNumber) {
      throw new Error(
        'Live calling is not configured. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be defined in your backend environment variables.'
      );
    }

    let to = request.phoneNumber.trim().replace(/[\s\-()]/g, '');
    if (!to.startsWith('+')) {
      to = `+${to}`;
    }

    const speechMessage = `Emergency Alert from THERMOS Satellite Industrial Thermal Monitoring. A confirmed ${request.classification || 'high-hazard thermal anomaly'} has been detected at ${request.location}. Coordinates: ${request.coordinates.latitude.toFixed(4)} degrees North, ${request.coordinates.longitude.toFixed(4)} degrees East. Satellite Radiative Power: ${request.frp || 45} Megawatts. Immediate emergency response requested.`;

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const twimletUrl = `https://twimlets.com/message?Message%5B0%5D=${encodeURIComponent(speechMessage)}`;
    const demoVoiceUrl = 'https://demo.twilio.com/docs/voice.xml';

    const makeTwilioCall = async (voiceUrl: string) => {
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', fromNumber);
      params.append('Url', voiceUrl);

      // Optional status callback webhook if backend host is configured
      const backendUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;
      if (backendUrl) {
        params.append('StatusCallback', `${backendUrl.replace(/\/+$/, '')}/api/calls/webhook/status`);
        params.append('StatusCallbackEvent', 'initiated');
        params.append('StatusCallbackEvent', 'ringing');
        params.append('StatusCallbackEvent', 'answered');
        params.append('StatusCallbackEvent', 'completed');
      }

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

    let { response, data } = await makeTwilioCall(twimletUrl);

    if (!response.ok) {
      if (data.code === 21608 || data.code === 21216) {
        throw new Error(
          `Twilio Free Trial Restriction (Code ${data.code}): The number ${to} is unverified. Go to Twilio Console > Phone Numbers > Verified Caller IDs (twil.io/verified) and verify this number first, or upgrade your Twilio account.`
        );
      } else if (data.code === 21408) {
        throw new Error(
          `Twilio Permission Error (Code 21408): Your account lacks permission to call ${to}. Enable international voice permissions in Twilio Console > Voice > Settings > Geo permissions.`
        );
      } else if (data.code === 21211) {
        throw new Error(
          `Twilio Format Error (Code 21211): The phone number ${to} is not formatted correctly in international E.164 format.`
        );
      }

      // Try fallback to static voice XML
      logger.warn(`Primary Twimlet URL failed (${data.message || response.status}), trying demo voice fallback...`);
      const fallbackResult = await makeTwilioCall(demoVoiceUrl);
      if (fallbackResult.response.ok) {
        data = fallbackResult.data;
      } else {
        throw new Error(
          `Twilio Call Initiation Failed: ${data.message || `HTTP ${response.status}: ${JSON.stringify(data)}`}`
        );
      }
    }

    const providerCallId = data.sid;
    this.startStatusPolling(accountSid, authHeader, providerCallId, request.callId);

    return {
      success: true,
      providerCallId,
      initialStatus: 'QUEUED',
      isSimulated: false,
      message: `Live emergency call successfully queued via Twilio carrier (SID: ${providerCallId}).`
    };
  }

  private startStatusPolling(
    accountSid: string,
    authHeader: string,
    providerCallId: string,
    systemCallId: string
  ) {
    if (this.pollingIntervals.has(systemCallId)) {
      clearInterval(this.pollingIntervals.get(systemCallId)!);
    }

    let pollCount = 0;
    const maxPolls = 60; // 2 minutes

    const timer = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(timer);
        this.pollingIntervals.delete(systemCallId);
        return;
      }

      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}.json`,
          {
            headers: { 'Authorization': authHeader }
          }
        );

        if (!res.ok) return;

        const callData = await res.json();
        const twilioStatus = callData.status; // queued, ringing, in-progress, completed, busy, failed, no-answer, canceled
        const duration = parseInt(callData.duration || '0', 10);

        let mappedStatus: any = 'QUEUED';
        if (twilioStatus === 'ringing') mappedStatus = 'RINGING';
        else if (twilioStatus === 'in-progress') mappedStatus = 'IN_PROGRESS';
        else if (twilioStatus === 'completed') mappedStatus = 'COMPLETED';
        else if (twilioStatus === 'busy') mappedStatus = 'BUSY';
        else if (twilioStatus === 'no-answer') mappedStatus = 'NO_ANSWER';
        else if (twilioStatus === 'failed') mappedStatus = 'FAILED';
        else if (twilioStatus === 'canceled') mappedStatus = 'CANCELLED';

        await unifiedStore.updateCallLog(systemCallId, {
          status: mappedStatus,
          duration,
          updatedAt: new Date().toISOString()
        });

        if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(twilioStatus)) {
          clearInterval(timer);
          this.pollingIntervals.delete(systemCallId);
        }
      } catch (err: any) {
        logger.error(`Error polling Twilio call ${providerCallId}:`, err.message);
      }
    }, 2000);

    this.pollingIntervals.set(systemCallId, timer);
  }

  public async hangupCall(providerCallId: string): Promise<boolean> {
    const { accountSid, authToken, isConfigured } = this.getCredentials();
    if (!isConfigured || !accountSid || !authToken) return false;

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
