/**
 * AI Satellite Remote Sensing Evidence Validator
 * Enforces strict anti-hallucination rules:
 * - AI uses ONLY provided telemetry data.
 * - If evidence is insufficient, states: "Insufficient evidence for industrial fire confirmation."
 * - Never invents fire, explosion, or petrochemical accident without proof.
 */

export interface ThermalEvidenceInput {
  lat: number;
  lon: number;
  frp: number;
  brightness: number;
  confidence: number;
  satellite: string;
  nearbyIndustry?: string | null;
  distanceKm?: number | null;
  timestamp: string;
  observationsCount?: number;
  persistenceHours?: number;
}

export interface AIEvidenceVerdict {
  status: 'VERIFIED_FIRE' | 'INSUFFICIENT_EVIDENCE' | 'BASELINE_ANOMALY';
  statement: string;
  evidenceGroundedFactors: string[];
  evidenceUsed?: string[];
  missingEvidence: string[];
  evaluatedAt: string;
  usedGemini: boolean;
  passesThresholds?: boolean;
}

export type AIEvidenceEvaluation = AIEvidenceVerdict;

/**
 * Deterministic Zero-Hallucination Evidence Evaluator
 */
export function evaluateThermalEvidenceStrictly(rawInput: ThermalEvidenceInput | any): AIEvidenceVerdict {
  const input: ThermalEvidenceInput = {
    lat: rawInput.lat ?? rawInput.latitude ?? 0,
    lon: rawInput.lon ?? rawInput.longitude ?? 0,
    frp: rawInput.frp ?? 0,
    brightness: rawInput.brightness ?? rawInput.brightnessTemperature ?? 300,
    confidence: rawInput.confidence ?? 50,
    satellite: rawInput.satellite ?? 'VIIRS',
    nearbyIndustry: rawInput.nearbyIndustry ?? rawInput.nearestIndustrialSite?.name ?? null,
    distanceKm: rawInput.distanceKm ?? rawInput.nearestIndustrialSite?.distanceKm ?? null,
    timestamp: rawInput.timestamp ?? new Date().toISOString(),
    observationsCount: rawInput.observationsCount ?? rawInput.temporalObservations?.length ?? 1,
    persistenceHours: rawInput.persistenceHours ?? 1
  };

  const missingEvidence: string[] = [];
  const groundedFactors: string[] = [];

  // Criterion A: Thermal threshold
  if (input.frp >= 95 || input.brightness >= 360) {
    groundedFactors.push(`Radiative emission (${input.frp.toFixed(1)} MW) / brightness (${input.brightness.toFixed(1)} K) exceeds operational furnace thresholds.`);
  } else {
    missingEvidence.push(`Radiative power (${input.frp.toFixed(1)} MW) and temperature (${input.brightness.toFixed(1)} K) remain in sub-critical regime.`);
  }

  // Criterion B: High detection confidence
  if (input.confidence >= 80) {
    groundedFactors.push(`Orbital sensor confidence validated at ${input.confidence}% by ${input.satellite}.`);
  } else {
    missingEvidence.push(`Sensor confidence (${input.confidence}%) is below robust certainty threshold (80%).`);
  }

  // Criterion C: Proximity to industrial infrastructure
  if (input.nearbyIndustry && (input.distanceKm ?? 999) <= 2.0) {
    groundedFactors.push(`Spatial co-location confirmed within ${input.distanceKm?.toFixed(2)} km of ${input.nearbyIndustry}.`);
  } else {
    missingEvidence.push(`No verified industrial facility within 2.0 km corridor.`);
  }

  // Criterion D: Multi-temporal corroboration
  if ((input.observationsCount ?? 1) >= 2 || (input.persistenceHours ?? 0) >= 2.0) {
    groundedFactors.push(`Temporal persistence observed across multiple passes (${input.observationsCount ?? 1} passes, ${input.persistenceHours ?? 0}h).`);
  } else {
    missingEvidence.push(`Single isolated pass; lacking multi-orbit temporal persistence.`);
  }

  const isEvidenceSufficient = missingEvidence.length === 0;

  let statement = '';
  let status: AIEvidenceVerdict['status'] = 'INSUFFICIENT_EVIDENCE';

  if (isEvidenceSufficient) {
    status = 'VERIFIED_FIRE';
    statement = `Thermal anomaly verified at ${input.lat.toFixed(4)}°N, ${input.lon.toFixed(4)}°E within ${input.distanceKm?.toFixed(2)} km of ${input.nearbyIndustry}. Radiative power ${input.frp.toFixed(1)} MW and brightness temperature ${input.brightness.toFixed(1)} K captured by ${input.satellite} at ${input.timestamp} UTC with ${input.confidence}% confidence confirm active anomalous combustion exceeding facility baseline.`;
  } else if (input.frp < 50 && (input.distanceKm ?? 999) > 3.0) {
    status = 'BASELINE_ANOMALY';
    statement = `Insufficient evidence for industrial fire confirmation. Satellite thermal detection at ${input.lat.toFixed(4)}°N, ${input.lon.toFixed(4)}°E (FRP ${input.frp.toFixed(1)} MW, ${input.brightness.toFixed(1)} K) does not correlate with critical industrial hazard boundaries.`;
  } else {
    status = 'INSUFFICIENT_EVIDENCE';
    statement = `Insufficient evidence for industrial fire confirmation. Satellite thermal anomaly detected at ${input.lat.toFixed(4)}°N, ${input.lon.toFixed(4)}°E with FRP ${input.frp.toFixed(1)} MW and brightness ${input.brightness.toFixed(1)} K; telemetry parameters remain within sub-critical or ambiguous thresholds. Multi-spectral ground corroboration required.`;
  }

  return {
    status,
    statement,
    evidenceGroundedFactors: groundedFactors,
    evidenceUsed: groundedFactors,
    missingEvidence,
    evaluatedAt: new Date().toISOString(),
    usedGemini: false,
    passesThresholds: isEvidenceSufficient
  };
}

/**
 * Request server-side AI evaluation with strict grounding
 */
export async function requestAIEvidenceExplanation(input: ThermalEvidenceInput): Promise<AIEvidenceVerdict> {
  try {
    const res = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.statement) {
        return {
          status: data.status || 'INSUFFICIENT_EVIDENCE',
          statement: data.statement,
          evidenceGroundedFactors: data.evidenceGroundedFactors || [],
          missingEvidence: data.missingEvidence || [],
          evaluatedAt: data.evaluatedAt || new Date().toISOString(),
          usedGemini: Boolean(data.usedGemini)
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI explain route unavailable, falling back to strict deterministic validator:', err);
  }

  return evaluateThermalEvidenceStrictly(input);
}
