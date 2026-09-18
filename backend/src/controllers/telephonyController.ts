import { Request, Response } from 'express';
import { unifiedStore } from '../services/store.ts';
import { telephonyManager } from '../services/telephony/index.ts';
import { logger } from '../utils/logger.ts';

export async function dispatchCalls(req: Request, res: Response) {
  try {
    const {
      incidentId,
      hotspotId,
      responderIds,
      locationName,
      latitude,
      longitude,
      frp,
      severity,
      classification,
      mode: reqMode
    } = req.body;

    const mode: 'TEST' | 'LIVE' = reqMode === 'LIVE' ? 'LIVE' : 'TEST';
    const provider = telephonyManager.getProvider(mode);

    if (mode === 'LIVE' && !provider.isConfigured()) {
      return res.status(400).json({
        error: 'Live calling is not configured on the backend. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be provided in backend environment variables.'
      });
    }

    if (!Array.isArray(responderIds) || responderIds.length === 0) {
      return res.status(400).json({ error: 'responderIds array is required.' });
    }

    const allResponders = await unifiedStore.getResponders();
    const selectedResponders = allResponders.filter(r => responderIds.includes(r.id));

    if (selectedResponders.length === 0) {
      return res.status(400).json({ error: 'No matching responders found for the given IDs.' });
    }

    const dispatchId = `DSP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const callsCreated: any[] = [];

    for (let i = 0; i < selectedResponders.length; i++) {
      const resp = selectedResponders[i];
      const callId = `CALL-${Date.now().toString().slice(-6)}-${i + 1}`;

      const callLog: any = {
        callId,
        dispatchId,
        incidentId: incidentId || `INC-${Date.now().toString().slice(-4)}`,
        hotspotId: hotspotId || 'HS-MANUAL',
        responderId: resp.id,
        responderName: resp.name,
        role: resp.role,
        phoneNumber: resp.phoneNumber,
        mode,
        provider: provider.name,
        status: 'QUEUED',
        queuedAt: now,
        duration: 0,
        timeline: [{
          status: 'QUEUED',
          timestamp: now,
          note: mode === 'TEST' 
            ? `TEST CALL / NO REAL PHONE CALL: Emergency call session #${i + 1} queued for ${resp.roleLabel} (${resp.organization})`
            : `Live carrier call session #${i + 1} queued for ${resp.roleLabel} via Twilio.`
        }],
        location: locationName || 'Monitored Industrial Site',
        coordinates: {
          latitude: Number(latitude) || 18.5204,
          longitude: Number(longitude) || 73.8567
        },
        frp: Number(frp) || 45,
        severity: severity || 'CRITICAL',
        classification: classification || 'Thermal / Fire Candidate',
        createdAt: now,
        updatedAt: now
      };

      await unifiedStore.saveCallLog(callLog);

      try {
        const result = await provider.initiateCall({
          callId,
          phoneNumber: resp.phoneNumber,
          responderName: resp.name,
          role: resp.roleLabel,
          incidentId: callLog.incidentId,
          location: callLog.location,
          coordinates: callLog.coordinates,
          frp: callLog.frp,
          severity: callLog.severity,
          classification: callLog.classification,
          isTest: mode === 'TEST'
        });

        const updatedCall = await unifiedStore.updateCallLog(callId, {
          providerCallId: result.providerCallId,
          status: result.initialStatus as any,
          initiatedAt: new Date().toISOString()
        });

        callsCreated.push(updatedCall || callLog);
      } catch (callErr: any) {
        logger.error(`Error initiating call to ${resp.name}:`, callErr.message);
        const failedCall = await unifiedStore.updateCallLog(callId, {
          status: 'FAILED',
          errorMessage: callErr.message
        });
        callsCreated.push(failedCall || callLog);
      }
    }

    const audit = {
      dispatchId,
      incidentId: incidentId || `INC-${Date.now().toString().slice(-4)}`,
      hotspotId,
      location: locationName || 'Monitored Sector',
      coordinates: {
        latitude: Number(latitude) || 18.5204,
        longitude: Number(longitude) || 73.8567
      },
      initiatedAt: now,
      initiatedBy: 'Tactical Operator Console',
      mode,
      selectedResponderIds: selectedResponders.map(r => r.id),
      responders: selectedResponders.map((r, idx) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        phoneNumber: r.phoneNumber,
        callId: callsCreated[idx]?.callId || `CALL-${idx}`,
        status: callsCreated[idx]?.status || 'QUEUED'
      })),
      finalResults: `${callsCreated.length} calls initiated (${mode} MODE)`
    };

    await unifiedStore.saveDispatchAudit(audit);

    res.json({
      success: true,
      dispatchId,
      calls: callsCreated,
      audit,
      message: mode === 'TEST'
        ? `Successfully initiated ${callsCreated.length} emergency calls (TEST MODE - NO REAL PHONE CALL).`
        : `Successfully initiated ${callsCreated.length} live emergency calls via Twilio carrier.`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to execute dispatch', details: err.message });
  }
}

export async function getCalls(req: Request, res: Response) {
  try {
    const calls = await unifiedStore.getCallLogs();
    res.json({
      success: true,
      count: calls.length,
      calls
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve call logs', details: err.message });
  }
}

export async function getCallById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const call = await unifiedStore.getCallLogById(id);
    if (!call) {
      return res.status(404).json({ error: `Call ${id} not found` });
    }
    res.json({ success: true, call });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve call', details: err.message });
  }
}

export async function getCallsByIncidentId(req: Request, res: Response) {
  try {
    const { incidentId } = req.params;
    const calls = await unifiedStore.getCallLogsByIncidentId(incidentId);
    res.json({ success: true, count: calls.length, calls });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve incident calls', details: err.message });
  }
}

export async function retryCall(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await unifiedStore.getCallLogById(id);
    if (!existing) {
      return res.status(404).json({ error: `Call ${id} not found` });
    }

    const provider = telephonyManager.getProvider(existing.mode);
    const result = await provider.initiateCall({
      callId: existing.callId,
      phoneNumber: existing.phoneNumber,
      responderName: existing.responderName,
      role: existing.role,
      incidentId: existing.incidentId,
      location: existing.location || 'Monitored Sector',
      coordinates: existing.coordinates || { latitude: 18.5204, longitude: 73.8567 },
      frp: existing.frp,
      severity: existing.severity,
      classification: existing.classification,
      isTest: existing.mode === 'TEST'
    });

    const updated = await unifiedStore.updateCallLog(id, {
      status: 'QUEUED',
      providerCallId: result.providerCallId,
      initiatedAt: new Date().toISOString(),
      errorMessage: undefined,
      timeline: [
        ...(existing.timeline || []),
        {
          status: 'QUEUED',
          timestamp: new Date().toISOString(),
          note: `Manual retry dispatched by operator (${existing.mode} MODE).`
        }
      ]
    });

    res.json({ success: true, call: updated, message: 'Call retry successfully queued.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retry call', details: err.message });
  }
}

export async function hangupCall(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await unifiedStore.getCallLogById(id);
    if (!existing) {
      return res.status(404).json({ error: `Call ${id} not found` });
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      return res.json({ success: true, message: 'Call already concluded.' });
    }

    const provider = telephonyManager.getProvider(existing.mode);
    if (provider.hangupCall && existing.providerCallId) {
      await provider.hangupCall(existing.providerCallId);
    }

    const updated = await unifiedStore.updateCallLog(id, {
      status: 'CANCELLED',
      completedAt: new Date().toISOString(),
      timeline: [
        ...(existing.timeline || []),
        {
          status: 'CANCELLED',
          timestamp: new Date().toISOString(),
          note: 'Call hung up by command console operator.'
        }
      ]
    });

    res.json({ success: true, call: updated, message: 'Call successfully terminated.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to hang up call', details: err.message });
  }
}

export function getProvidersStatus(req: Request, res: Response) {
  res.json(telephonyManager.getStatus());
}

export async function getDispatchAudits(req: Request, res: Response) {
  try {
    const audits = await unifiedStore.getDispatchAudits();
    res.json({ success: true, count: audits.length, audits });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audits', details: err.message });
  }
}
