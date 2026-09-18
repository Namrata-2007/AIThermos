import { Express, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { telephonyManager, validatePhoneNumber } from '../telephony/manager.ts';
import { Responder } from '../../src/types.ts';

export function setupCallAndResponderRoutes(app: Express) {
  // 1. GET /api/responders
  app.get('/api/responders', (req: Request, res: Response) => {
    try {
      const responders = dbStore.getResponders();
      res.json({ success: true, count: responders.length, responders });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch responders', details: err.message });
    }
  });

  // 2. POST /api/responders - Create or save responder
  app.post('/api/responders', (req: Request, res: Response) => {
    try {
      const { id, name, role, organization, phoneNumber, location, active, notes } = req.body;
      
      const val = validatePhoneNumber(phoneNumber);
      if (!val.isValid) {
        return res.status(400).json({ error: val.error });
      }

      const newResponder: Responder = {
        id: id || `resp-${Date.now().toString().slice(-6)}`,
        name: name || 'Emergency Responder Unit',
        role: role || 'FIRE_RESCUE',
        roleLabel: role === 'FIRE_RESCUE' ? 'Fire & Rescue' :
                   role === 'POLICE' ? 'Police' :
                   role === 'HOSPITAL_MEDICAL' ? 'Hospital / Medical' :
                   role === 'AMBULANCE' ? 'Ambulance' : 'Disaster Management',
        organization: organization || 'Local Emergency Services',
        phoneNumber: val.formatted!,
        location: location || 'Duty Station',
        active: active !== undefined ? Boolean(active) : true,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = dbStore.saveResponder(newResponder);
      res.status(201).json({ success: true, responder: saved });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save responder', details: err.message });
    }
  });

  // 3. PATCH /api/responders/:id - Update responder
  app.patch('/api/responders/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      if (updates.phoneNumber !== undefined) {
        const val = validatePhoneNumber(updates.phoneNumber);
        if (!val.isValid) {
          return res.status(400).json({ error: val.error });
        }
        updates.phoneNumber = val.formatted;
      }

      const updated = dbStore.updateResponder(id, updates);
      if (!updated) {
        return res.status(404).json({ error: `Responder ${id} not found.` });
      }

      res.json({ success: true, responder: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update responder', details: err.message });
    }
  });

  // 4. POST /api/calls/dispatch - Execute 3-responder dispatch
  app.post('/api/calls/dispatch', async (req: Request, res: Response) => {
    try {
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
        desiredOutcomes
      } = req.body;

      if (!incidentId) {
        return res.status(400).json({ error: 'incidentId is required.' });
      }

      // Requirement 3 & 20: Validate exactly 3 responders
      if (!Array.isArray(responderIds) || responderIds.length !== 3) {
        return res.status(400).json({ error: 'Please select exactly 3 responders.' });
      }

      const dispatchMode: 'TEST' | 'LIVE' = mode === 'LIVE' ? 'LIVE' : 'TEST';

      const result = await telephonyManager.dispatchThreeResponders({
        incidentId,
        hotspotId: hotspotId || incidentId,
        responderIds,
        locationName: locationName || `Coordinates [${latitude}, ${longitude}]`,
        latitude: typeof latitude === 'number' ? latitude : 0,
        longitude: typeof longitude === 'number' ? longitude : 0,
        risk: risk || 'CRITICAL',
        severity: severity || 'CRITICAL',
        classification: classification || 'Thermal / Fire Candidate',
        frp: typeof frp === 'number' ? frp : 45.0,
        mode: dispatchMode,
        desiredOutcomes: desiredOutcomes || {}
      });

      res.json({
        success: true,
        dispatchId: result.dispatchId,
        calls: result.calls,
        audit: result.audit,
        message: `Successfully initiated 3 independent emergency calls (${dispatchMode} MODE).`
      });
    } catch (err: any) {
      if (err.code === 'ACTIVE_CALLS_EXIST') {
        return res.status(409).json({
          error: err.message,
          activeCalls: err.activeCalls
        });
      }
      res.status(400).json({ error: err.message || 'Dispatch failed' });
    }
  });

  // 5. GET /api/calls - Fetch all call logs
  app.get('/api/calls', (req: Request, res: Response) => {
    try {
      const calls = dbStore.getCallLogs();
      res.json({ success: true, count: calls.length, calls });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch calls', details: err.message });
    }
  });

  // 6. GET /api/calls/:callId - Fetch specific call detail
  app.get('/api/calls/:callId', (req: Request, res: Response) => {
    try {
      const { callId } = req.params;
      const call = dbStore.getCallLog(callId);
      if (!call) {
        return res.status(404).json({ error: `Call ${callId} not found.` });
      }
      res.json({ success: true, call });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch call', details: err.message });
    }
  });

  // 7. GET /api/calls/incident/:incidentId - Fetch calls for incident
  app.get('/api/calls/incident/:incidentId', (req: Request, res: Response) => {
    try {
      const { incidentId } = req.params;
      const calls = dbStore.getCallLogsForIncident(incidentId);
      res.json({ success: true, count: calls.length, calls });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch incident calls', details: err.message });
    }
  });

  // 8. POST /api/calls/:callId/hangup
  app.post('/api/calls/:callId/hangup', async (req: Request, res: Response) => {
    try {
      const { callId } = req.params;
      const ok = await telephonyManager.hangupCall(callId);
      const updated = dbStore.getCallLog(callId);
      res.json({ success: ok, call: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to hangup call', details: err.message });
    }
  });

  // 9. POST /api/calls/:callId/retry
  app.post('/api/calls/:callId/retry', async (req: Request, res: Response) => {
    try {
      const { callId } = req.params;
      const { desiredOutcome } = req.body;
      const retried = await telephonyManager.retryCall(callId, desiredOutcome);
      res.json({ success: true, call: retried });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to retry call' });
    }
  });

  // 10. GET /api/providers/status
  app.get('/api/providers/status', (req: Request, res: Response) => {
    try {
      const mode = (req.query.mode as string) === 'LIVE' ? 'LIVE' : 'TEST';
      const status = telephonyManager.getProviderStatus(mode);
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get provider status', details: err.message });
    }
  });

  // 11. GET /api/dispatch/audits
  app.get('/api/dispatch/audits', (req: Request, res: Response) => {
    try {
      const audits = dbStore.getAudits();
      res.json({ success: true, count: audits.length, audits });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch dispatch audits', details: err.message });
    }
  });

  // 12. POST /api/responders/test-call/:id - Quick individual test call
  app.post('/api/responders/test-call/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resp = dbStore.getResponderById(id);
      if (!resp) {
        return res.status(404).json({ error: 'Responder not found' });
      }

      const val = validatePhoneNumber(resp.phoneNumber);
      if (!val.isValid) {
        return res.status(400).json({ error: val.error });
      }

      const callId = `TEST-CALL-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const callLog = dbStore.saveCallLog({
        callId,
        dispatchId: `TEST-${Date.now().toString().slice(-4)}`,
        incidentId: 'SYSTEM-TEST-LINE',
        hotspotId: 'SYSTEM-TEST-LINE',
        responderId: resp.id,
        responderName: resp.name,
        role: resp.role,
        phoneNumber: resp.phoneNumber,
        mode: 'TEST',
        provider: 'MockTelephonyProvider',
        providerCallId: 'pending',
        status: 'QUEUED',
        queuedAt: now,
        duration: 0,
        timeline: [
          {
            status: 'QUEUED',
            timestamp: now,
            note: `Operator triggered direct diagnostic line test to ${resp.roleLabel}`
          }
        ],
        location: 'Diagnostic Terminal',
        coordinates: { latitude: 0, longitude: 0 },
        severity: 'LOW',
        classification: 'Line Test',
        createdAt: now,
        updatedAt: now
      });

      const provider = telephonyManager.getProvider('TEST');
      const result = await provider.initiateCall({
        callId,
        phoneNumber: resp.phoneNumber,
        responderName: resp.name,
        role: resp.roleLabel,
        incidentId: 'SYSTEM-TEST-LINE',
        location: 'Diagnostic Terminal',
        coordinates: { latitude: 0, longitude: 0 },
        isTest: true,
        desiredOutcome: 'ANSWERED'
      });

      dbStore.updateCallLog(callId, {
        providerCallId: result.providerCallId,
        status: result.initialStatus,
        initiatedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        callId,
        message: `Diagnostic test call queued to ${resp.roleLabel} (${resp.phoneNumber}).`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. ALL /api/telephony/voice-twiml - Public TwiML voice endpoint
  app.all('/api/telephony/voice-twiml', (req: Request, res: Response) => {
    const message = (req.query.msg as string) || (req.body?.msg as string) || 'Emergency Alert from THERMOS Satellite Industrial Thermal Monitoring. Dispatching units immediately.';
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${message.replace(/[<>&"]/g, '')}</Say><Pause length="1"/><Say>Repeating: ${message.replace(/[<>&"]/g, '')}</Say></Response>`);
  });
}
