import { GoogleGenAI } from '@google/genai';
import { EvidencePacket } from './evidencePacket.ts';
import { logger } from '../../utils/logger.ts';

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export interface AiEvidenceAnalysisResult {
  packetId: string;
  classification: 'THERMAL_ANOMALY' | 'FIRE_CANDIDATE' | 'HIGH_CONFIDENCE_CANDIDATE' | 'CONFIRMED_BY_EXTERNAL_EVIDENCE';
  confidenceScore: number;
  executiveSummary: string;
  radiometricInterpretation: string;
  uncertaintyFactors: string[];
  operationalRecommendation: string;
  sourceAttribution: string;
}

export async function analyzeEvidenceWithAI(packet: EvidencePacket): Promise<AiEvidenceAnalysisResult> {
  const ai = getAI();
  const t = packet.verifiedTelemetry;
  const g = packet.gisContext;

  // Fallback heuristic explanation if Gemini API Key is not configured
  const fallbackResult: AiEvidenceAnalysisResult = {
    packetId: packet.packetId,
    classification: packet.preliminaryClassification,
    confidenceScore: t.confidenceScore,
    executiveSummary: `Thermal anomaly detected by ${t.satellite} (${t.instrument}) displaying ${t.frpMw.toFixed(1)} MW radiative power and brightness temperature of ${t.brightnessTemperatureK.toFixed(1)} K.`,
    radiometricInterpretation: `Radiometric heat emission exceeds standard background threshold. Location is ${g.nearestIndustrialFacility ? `${g.nearestIndustrialFacility.distanceKm.toFixed(1)} km from ${g.nearestIndustrialFacility.name}` : 'in monitored sector'}.`,
    uncertaintyFactors: [
      'Sub-pixel cloud cover or atmospheric attenuation can influence radiometric brightness temperature.',
      'Industrial flares can exhibit elevated FRP without uncontrolled structural combustion.',
      t.isDemoObservation ? 'Observation originates from simulated demonstration stream.' : 'Operational satellite observation.'
    ],
    operationalRecommendation: packet.preliminaryClassification === 'HIGH_CONFIDENCE_CANDIDATE' 
      ? 'Immediate ground-truth verification and automated 3-agency emergency call dispatch recommended.'
      : 'Maintain sensor surveillance over next orbital revisit pass.',
    sourceAttribution: `${t.satellite} / ${t.instrument} (${t.sourceProvider})`
  };

  if (!ai) {
    return fallbackResult;
  }

  try {
    const prompt = `
You are the AI Thermal Evidence Analyst for THERMOS, an industrial thermal intelligence and emergency response system.
Analyze the following VERIFIED EVIDENCE PACKET.

STRICT ACCURACY RULES:
1. NEVER invent coordinates, timestamps, FRP, brightness temperature, satellite name, or instrument.
2. Rely ONLY on the verified data in the packet below.
3. Thermal anomaly is NOT automatically a confirmed fire.
4. Classify the event into exactly one of:
   - THERMAL_ANOMALY (unusual heat, could be industrial process)
   - FIRE_CANDIDATE (elevated heat, likely open combustion)
   - HIGH_CONFIDENCE_CANDIDATE (very high FRP and brightness temp near high-risk facility)
   - CONFIRMED_BY_EXTERNAL_EVIDENCE (corroborated by external ground/civil report)

VERIFIED EVIDENCE PACKET:
${JSON.stringify(packet, null, 2)}

Respond with a JSON object matching this exact schema:
{
  "classification": "THERMAL_ANOMALY" | "FIRE_CANDIDATE" | "HIGH_CONFIDENCE_CANDIDATE" | "CONFIRMED_BY_EXTERNAL_EVIDENCE",
  "confidenceScore": number (between 50 and 100),
  "executiveSummary": "Concise 1-2 sentence operator summary using exact numbers from packet",
  "radiometricInterpretation": "Technical assessment of the FRP and BT values",
  "uncertaintyFactors": ["Array of 2-3 genuine physical uncertainties (e.g. sensor resolution, solar glint, process flare)"],
  "operationalRecommendation": "Actionable tactical guidance for dispatchers",
  "sourceAttribution": "Exact satellite and instrument name"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return {
        packetId: packet.packetId,
        classification: parsed.classification || packet.preliminaryClassification,
        confidenceScore: parsed.confidenceScore || t.confidenceScore,
        executiveSummary: parsed.executiveSummary || fallbackResult.executiveSummary,
        radiometricInterpretation: parsed.radiometricInterpretation || fallbackResult.radiometricInterpretation,
        uncertaintyFactors: parsed.uncertaintyFactors || fallbackResult.uncertaintyFactors,
        operationalRecommendation: parsed.operationalRecommendation || fallbackResult.operationalRecommendation,
        sourceAttribution: parsed.sourceAttribution || fallbackResult.sourceAttribution
      };
    }
  } catch (err: any) {
    logger.error('Gemini API call error during evidence analysis:', err.message);
  }

  return fallbackResult;
}
