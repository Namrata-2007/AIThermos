import { TelephonyProvider, TelephonyCallRequest } from './types.ts';
import { MockTelephonyProvider } from './mockProvider.ts';
import { TwilioLiveTelephonyProvider } from './twilioProvider.ts';
import { dbStore } from '../db/store.ts';
import { CallLog, DispatchAuditRecord, Responder, StandardResponderRole } from '../../src/types.ts';

export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string; formatted?: string } {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required.' };
  }
  const clean = phone.trim();
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Invalid phone number. Number must be between 8 and 15 digits.' };
  }
  // Require country code (+ or standard 10-12 digits)
  if (!clean.startsWith('+') && digitsOnly.length < 10) {
    return { isValid: false, error: 'Invalid phone number. Must include valid country code (e.g. +91XXXXXXXXXX).' };
  }
  return { isValid: true, formatted: clean };
}

class TelephonyManager {
  private mockProvider = new MockTelephonyProvider();
  private twilioProvider = new TwilioLiveTelephonyProvider();

  getProvider(mode: 'TEST' | 'LIVE'): TelephonyProvider {
    if (mode === 'LIVE') {
      return this.twilioProvider;
    }
    return this.mockProvider;
  }

  getProviderStatus(requestedMode: 'TEST' | 'LIVE' = 'TEST') {
    const twilioConfigured = this.twilioProvider.isConfigured();
    const effectiveMode = requestedMode;
    const provider = this.getProvider(effectiveMode);

    return {
      mode: effectiveMode,
      providerName: provider.name,
      isConfigured: provider.isConfigured(),
      twilioConfigured,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || undefined,
      hasAccountSid: Boolean(process.env.TWILIO_ACCOUNT_SID?.startsWith('AC'))
    };
  }

  async dispatchThreeResponders(params: {
    incidentId: string;
    hotspotId: string;
    responderIds: string[];
    locationName: string;
    latitude: number;
    longitude: number;
    risk?: string;
    severity?: string;
    classification?: string;
    frp?: number;
    mode: 'TEST' | 'LIVE';
    desiredOutcomes?: Record<string, 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED'>;
  }): Promise<{ dispatchId: string; calls: CallLog[]; audit: DispatchAuditRecord }> {
    const { 
      incidentId, 
      hotspotId, 
      responderIds, 
      locationName, 
      latitude, 
      longitude, 
      risk, 
      severity, 
      classification, 
      frp, 
      mode,
      desiredOutcomes = {}
    } = params;

    // Strict requirement 1: Exactly 3 responders
    if (!Array.isArray(responderIds) || responderIds.length !== 3) {
      throw new Error('Please select exactly 3 responders.');
    }

    // Verify all 3 responders exist and have valid phone numbers
    const selectedResponders: Responder[] = [];
    for (const rId of responderIds) {
      const resp = dbStore.getResponderById(rId);
      if (!resp) {
        throw new Error(`Responder with ID "${rId}" not found.`);
      }
      const val = validatePhoneNumber(resp.phoneNumber);
      if (!val.isValid) {
        throw new Error(`Responder "${resp.roleLabel}" has an invalid phone number: ${val.error}`);
      }
      selectedResponders.push(resp);
    }

    // Check duplicate active calls for this incident
    const existingCalls = dbStore.getCallLogsForIncident(incidentId);
    const activeCalls = existingCalls.filter(c => 
      c.status === 'QUEUED' || 
      c.status === 'INITIATING' || 
      c.status === 'RINGING' || 
      c.status === 'ANSWERED'
    );
    if (activeCalls.length > 0) {
      const err: any = new Error('Active emergency calls already exist for this incident.');
      err.activeCalls = activeCalls;
      err.code = 'ACTIVE_CALLS_EXIST';
      throw err;
    }

    const provider = this.getProvider(mode);
    if (mode === 'LIVE' && !provider.isConfigured()) {
      throw new Error('Live calling is not configured. Telephony credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) must be configured in environment variables.');
    }

    const dispatchId = `DSP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const createdCalls: CallLog[] = [];

    // Initiate the THREE calls independently (if one fails, others continue!)
    for (let index = 0; index < selectedResponders.length; index++) {
      const resp = selectedResponders[index];
      const callId = `CALL-${Date.now().toString().slice(-6)}-${index + 1}`;

      // Default demo outcomes for test mode to demonstrate realistic variety
      let outcome = desiredOutcomes[resp.id];
      if (!outcome && mode === 'TEST') {
        // E.g. Responder 0 & 1 -> ANSWERED, Responder 2 -> ANSWERED or realistic response
        outcome = 'ANSWERED';
      }

      const initialLog: CallLog = {
        callId,
        dispatchId,
        incidentId,
        hotspotId,
        responderId: resp.id,
        responderName: resp.name,
        role: resp.role,
        phoneNumber: resp.phoneNumber,
        mode,
        provider: provider.name,
        providerCallId: 'pending',
        status: 'QUEUED',
        queuedAt: now,
        duration: 0,
        timeline: [
          {
            status: 'QUEUED',
            timestamp: now,
            note: `Emergency call session #${index + 1} queued for ${resp.roleLabel} (${resp.organization})`
          }
        ],
        location: locationName,
        coordinates: { latitude, longitude },
        frp,
        severity: severity || risk || 'CRITICAL',
        classification: classification || 'Thermal Anomaly',
        createdAt: now,
        updatedAt: now
      };

      dbStore.saveCallLog(initialLog);

      try {
        const result = await provider.initiateCall({
          callId,
          phoneNumber: resp.phoneNumber,
          responderName: resp.name,
          role: resp.roleLabel,
          incidentId,
          location: locationName,
          coordinates: { latitude, longitude },
          frp,
          severity,
          classification,
          isTest: mode === 'TEST',
          desiredOutcome: outcome
        });

        const updated = dbStore.updateCallLog(callId, {
          providerCallId: result.providerCallId,
          status: result.initialStatus,
          initiatedAt: new Date().toISOString()
        }) || initialLog;

        createdCalls.push(updated);
      } catch (err: any) {
        console.error(`Error initiating call to ${resp.roleLabel}:`, err);
        const failed = dbStore.updateCallLog(callId, {
          status: 'FAILED',
          errorMessage: err.message || 'Call initiation failed'
        }) || initialLog;
        createdCalls.push(failed);
      }
    }

    // Create Audit Record
    const auditRecord: DispatchAuditRecord = {
      dispatchId,
      incidentId,
      hotspotId,
      location: locationName,
      coordinates: { latitude, longitude },
      initiatedAt: now,
      initiatedBy: 'Tactical Operator Console (AI Fire One / THERMOS)',
      mode,
      selectedResponderIds: selectedResponders.map(r => r.id),
      responders: createdCalls.map(c => ({
        id: c.responderId,
        name: c.responderName,
        role: c.role,
        phoneNumber: c.phoneNumber,
        callId: c.callId,
        status: c.status
      })),
      finalResults: `${createdCalls.length} calls initiated (${mode} MODE)`
    };

    dbStore.addAudit(auditRecord);

    return {
      dispatchId,
      calls: createdCalls,
      audit: auditRecord
    };
  }

  async retryCall(callId: string, desiredOutcome?: 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED'): Promise<CallLog> {
    const existing = dbStore.getCallLog(callId);
    if (!existing) {
      throw new Error(`Call with ID "${callId}" not found.`);
    }

    if (existing.status === 'RINGING' || existing.status === 'ANSWERED' || existing.status === 'INITIATING') {
      throw new Error(`Cannot retry an active call in status: ${existing.status}`);
    }

    const provider = this.getProvider(existing.mode);
    const now = new Date().toISOString();

    const updated = dbStore.updateCallLog(callId, {
      status: 'QUEUED',
      queuedAt: now,
      initiatedAt: undefined,
      ringingAt: undefined,
      answeredAt: undefined,
      completedAt: undefined,
      duration: 0,
      errorMessage: undefined,
      timeline: [
        ...existing.timeline,
        {
          status: 'QUEUED',
          timestamp: now,
          note: `Call retry manually initiated by operator`
        }
      ]
    });

    try {
      const result = await provider.initiateCall({
        callId,
        phoneNumber: existing.phoneNumber,
        responderName: existing.responderName,
        role: existing.role,
        incidentId: existing.incidentId,
        location: existing.location,
        coordinates: existing.coordinates,
        frp: existing.frp,
        severity: existing.severity,
        classification: existing.classification,
        isTest: existing.mode === 'TEST',
        desiredOutcome: desiredOutcome || 'ANSWERED'
      });

      return dbStore.updateCallLog(callId, {
        providerCallId: result.providerCallId,
        status: result.initialStatus,
        initiatedAt: new Date().toISOString()
      }) || updated!;
    } catch (err: any) {
      return dbStore.updateCallLog(callId, {
        status: 'FAILED',
        errorMessage: err.message
      }) || updated!;
    }
  }

  async hangupCall(callId: string): Promise<boolean> {
    const call = dbStore.getCallLog(callId);
    if (!call) return false;
    const provider = this.getProvider(call.mode);
    return await provider.hangupCall(call.providerCallId);
  }
}

export const telephonyManager = new TelephonyManager();
