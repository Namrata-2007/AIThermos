import { Request, Response } from 'express';
import { buildEvidencePacket } from '../services/ai/evidencePacket.ts';
import { analyzeEvidenceWithAI } from '../services/ai/geminiService.ts';
import { satelliteManager } from '../services/satellite/index.ts';

export async function explainThermalEvent(req: Request, res: Response) {
  try {
    const { event, eventId, latitude, longitude, frp, brightnessTemperature, confidence, satellite } = req.body;

    let observationData: any = event;
    if (!observationData && latitude !== undefined && longitude !== undefined) {
      observationData = {
        observationId: eventId || `OBS-${Date.now().toString().slice(-4)}`,
        satellite: satellite || 'METEOSAT-11',
        instrument: 'SEVIRI',
        timestamp: new Date().toISOString(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        frp: Number(frp) || 45.0,
        brightnessTemperature: Number(brightnessTemperature) || 340.0,
        confidence: Number(confidence) || 85,
        source: 'THERMOS_BACKEND_TELEMETRY',
        isDemo: false
      };
    }

    if (!observationData) {
      // Pick first observation from active provider
      const provider = satelliteManager.getProvider();
      const obs = await provider.getObservations();
      observationData = obs[0];
    }

    const packet = buildEvidencePacket(observationData);
    const analysis = await analyzeEvidenceWithAI(packet);

    res.json({
      success: true,
      packet,
      analysis,
      explanation: `${analysis.executiveSummary} ${analysis.radiometricInterpretation} Recommendation: ${analysis.operationalRecommendation}`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
}

export async function analyzeEvidencePacket(req: Request, res: Response) {
  try {
    const { packet } = req.body;
    if (!packet) {
      return res.status(400).json({ error: 'Evidence packet is required.' });
    }

    const analysis = await analyzeEvidenceWithAI(packet);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
}
