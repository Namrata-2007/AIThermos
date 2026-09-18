import { ThermalEvent, ItriRiskBreakdown, RiskLevel } from '../types.ts';

/**
 * Computes the Industrial Thermal Risk Index (ITRI: 0-100) using multi-factor weighting.
 * Factors:
 * 1. Thermal Intensity (25%)
 * 2. Escalation (20%)
 * 3. Population Exposure (20%)
 * 4. Industrial Proximity (15%)
 * 5. Persistence (10%)
 * 6. Critical Infrastructure (10%)
 */
export function calculateItriRisk(event: ThermalEvent): ItriRiskBreakdown {
  // 1. Thermal Intensity Score (0 - 100) -> 25% weight
  // Based on FRP (MW) and Brightness Temperature (Kelvin)
  // Baseline ambient is ~300K, extreme flares/fires reach 380K+
  const btScore = Math.min(100, Math.max(0, ((event.brightnessTemperature - 300) / 90) * 100));
  const frpScore = Math.min(100, (event.frp / 200) * 100);
  const thermalIntensityScore = Math.round(0.4 * btScore + 0.6 * frpScore);

  // 2. Escalation Score (0 - 100) -> 20% weight
  let escalationScore = 15;
  if (event.escalationLevel === 'CRITICAL') {
    escalationScore = 95;
  } else if (event.escalationLevel === 'RAPID') {
    escalationScore = 75;
  } else if (event.escalationLevel === 'MODERATE') {
    escalationScore = 45;
  } else {
    // STABLE
    if (event.frpTrendDelta > 50) escalationScore = 60;
    else if (event.frpTrendDelta > 20) escalationScore = 35;
    else escalationScore = 10;
  }

  // 3. Population Exposure Score (0 - 100) -> 20% weight
  const pop1k = event.populationExposure?.radius1km || 0;
  const pop5k = event.populationExposure?.radius5km || 0;
  let populationScore = 0;
  if (pop1k > 20000) populationScore += 60;
  else if (pop1k > 5000) populationScore += 40;
  else if (pop1k > 500) populationScore += 20;

  if (pop5k > 200000) populationScore += 40;
  else if (pop5k > 50000) populationScore += 25;
  else if (pop5k > 10000) populationScore += 15;
  const populationExposureScore = Math.min(100, populationScore);

  // 4. Industrial Proximity Score (0 - 100) -> 15% weight
  const distToIndustrial = event.nearestIndustrialSite?.distanceKm ?? 10;
  let industrialProximityScore = 0;
  if (distToIndustrial < 0.5) industrialProximityScore = 100;
  else if (distToIndustrial < 1.5) industrialProximityScore = 85;
  else if (distToIndustrial < 3.0) industrialProximityScore = 60;
  else if (distToIndustrial < 6.0) industrialProximityScore = 30;
  else industrialProximityScore = 10;

  // 5. Persistence Score (0 - 100) -> 10% weight
  // For sudden fires, low persistence + high escalation = severe hazard.
  // For steady gas flares, high persistence + low escalation = operational baseline.
  let persistenceScore = 0;
  if (event.persistenceHours > 24) persistenceScore = 40;
  else if (event.persistenceHours > 6) persistenceScore = 60;
  else if (event.persistenceHours > 1) persistenceScore = 80; // Active developing fire
  else persistenceScore = 30;

  // 6. Critical Infrastructure Exposure (0 - 100) -> 10% weight
  let infrastructureScore = 0;
  if (event.distanceToRoadKm < 0.3) infrastructureScore += 35;
  else if (event.distanceToRoadKm < 1.0) infrastructureScore += 20;

  if (event.distanceToHospitalKm < 2.0) infrastructureScore += 35;
  else if (event.distanceToHospitalKm < 5.0) infrastructureScore += 20;

  if ((event.populationExposure?.schoolsCount || 0) > 5) infrastructureScore += 30;
  else if ((event.populationExposure?.schoolsCount || 0) > 0) infrastructureScore += 15;
  infrastructureScore = Math.min(100, infrastructureScore);

  // Weighted Sum Calculation:
  // Thermal intensity: 25%
  // Escalation: 20%
  // Population exposure: 20%
  // Industrial proximity: 15%
  // Persistence: 10%
  // Infrastructure: 10%
  const finalItri = Math.max(0, Math.min(100, Math.round(
    0.25 * thermalIntensityScore +
    0.20 * escalationScore +
    0.20 * populationExposureScore +
    0.15 * industrialProximityScore +
    0.10 * persistenceScore +
    0.10 * infrastructureScore
  )));

  // Strict User Specification Section 7:
  // 0–30: LOW
  // 31–60: MEDIUM / MODERATE
  // 61–80: HIGH
  // 81–100: CRITICAL
  let riskLevel: RiskLevel = 'Low';
  if (finalItri >= 81) riskLevel = 'Critical';
  else if (finalItri >= 61) riskLevel = 'High';
  else if (finalItri >= 31) riskLevel = 'Moderate';
  else riskLevel = 'Low';

  return {
    thermalIntensityScore,
    escalationScore,
    populationExposureScore,
    industrialProximityScore,
    persistenceScore,
    infrastructureScore,
    finalItri,
    riskLevel
  };
}
