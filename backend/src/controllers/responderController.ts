import { Request, Response } from 'express';
import { unifiedStore } from '../services/store.ts';
import { validatePhoneNumber } from '../utils/phoneValidator.ts';
import { telephonyManager } from '../services/telephony/index.ts';

export async function getResponders(req: Request, res: Response) {
  try {
    const responders = await unifiedStore.getResponders();
    res.json({
      success: true,
      count: responders.length,
      responders
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve responders', details: err.message });
  }
}

export async function createResponder(req: Request, res: Response) {
  try {
    const { id, name, role, organization, phoneNumber, location, active, notes } = req.body;

    const val = validatePhoneNumber(phoneNumber);
    if (!val.isValid) {
      return res.status(400).json({ error: val.error });
    }

    const newResponder = {
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

    const saved = await unifiedStore.saveResponder(newResponder);
    res.status(201).json({ success: true, responder: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save responder', details: err.message });
  }
}

export async function updateResponder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await unifiedStore.getResponderById(id);
    if (!existing) {
      return res.status(404).json({ error: `Responder ${id} not found.` });
    }

    const { name, role, organization, phoneNumber, location, active, notes } = req.body;

    let formattedPhone = existing.phoneNumber;
    if (phoneNumber && phoneNumber !== existing.phoneNumber) {
      const val = validatePhoneNumber(phoneNumber);
      if (!val.isValid) {
        return res.status(400).json({ error: val.error });
      }
      formattedPhone = val.formatted!;
    }

    const updated = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      role: role !== undefined ? role : existing.role,
      roleLabel: role === 'FIRE_RESCUE' ? 'Fire & Rescue' :
                 role === 'POLICE' ? 'Police' :
                 role === 'HOSPITAL_MEDICAL' ? 'Hospital / Medical' :
                 role === 'AMBULANCE' ? 'Ambulance' :
                 role === 'DISASTER_MANAGEMENT' ? 'Disaster Management' : existing.roleLabel,
      organization: organization !== undefined ? organization : existing.organization,
      phoneNumber: formattedPhone,
      location: location !== undefined ? location : existing.location,
      active: active !== undefined ? Boolean(active) : existing.active,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: new Date().toISOString()
    };

    const saved = await unifiedStore.saveResponder(updated);
    res.json({ success: true, responder: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update responder', details: err.message });
  }
}

export async function testCallResponder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const resp = await unifiedStore.getResponderById(id);
    if (!resp) {
      return res.status(404).json({ error: 'Responder not found' });
    }

    const callId = `TEST-CALL-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    await unifiedStore.saveCallLog({
      callId,
      dispatchId: `DSP-TEST-${Date.now().toString().slice(-4)}`,
      incidentId: 'SYSTEM-TEST-LINE',
      responderId: resp.id,
      responderName: resp.name,
      role: resp.role,
      phoneNumber: resp.phoneNumber,
      mode: 'TEST',
      provider: 'MockTelephonyProvider',
      status: 'QUEUED',
      queuedAt: now,
      duration: 0,
      timeline: [{
        status: 'QUEUED',
        timestamp: now,
        note: `TEST CALL / NO REAL PHONE CALL: Line diagnostic test initiated for ${resp.name} (${resp.phoneNumber})`
      }],
      location: 'System Diagnostic Terminal',
      coordinates: { latitude: 18.5204, longitude: 73.8567 },
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
      coordinates: { latitude: 18.5204, longitude: 73.8567 },
      isTest: true,
      desiredOutcome: 'ANSWERED'
    });

    res.json({
      success: true,
      callId,
      message: `TEST CALL: Diagnostic test queued to ${resp.roleLabel} (${resp.phoneNumber}).`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
