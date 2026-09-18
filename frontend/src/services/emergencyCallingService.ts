import { 
  ThermalEvent, 
  EmergencyCallSession, 
  EmergencyCallRecipient, 
  FireStation, 
  Hospital, 
  PoliceStation 
} from '../types.ts';
import { 
  FIRE_STATIONS, 
  HOSPITALS, 
  POLICE_STATIONS 
} from '../data/mockGeospatial.ts';
import { 
  calculateHaversineDistance, 
  rankFireStationsForEvent, 
  rankHospitalsForEvent 
} from './gisEngine.ts';

/**
 * Checks if a thermal event constitutes an actual confirmed fire hazard requiring immediate emergency response.
 * Strictly requires ALL 4 criteria:
 * 1. risk > 85
 * 2. high thermal anomaly (FRP >= 95 MW or BT >= 360 K)
 * 3. industrial site nearby (distance <= 2.0 km)
 * 4. multiple observations (eventsInLast24h >= 2 or persistenceHours >= 2.0)
 */
export interface EmergencyConfirmationResult {
  isConfirmed: boolean;
  statusText: string;
  reasons: string[];
  missingCriteria: string[];
}

export function checkEmergencyConfirmation(event: ThermalEvent | null): EmergencyConfirmationResult {
  if (!event) {
    return {
      isConfirmed: false,
      statusText: 'Thermal anomaly detected. Further verification required.',
      reasons: [],
      missingCriteria: ['No event data available']
    };
  }

  // Strict Condition 1: risk > 85
  const risk = event.itriScore ?? 0;
  const isRiskPassed = risk > 85;

  // Strict Condition 2: high thermal anomaly (FRP >= 95 MW or Brightness Temp >= 360 K)
  const isThermalPassed = (event.frp ?? 0) >= 95 || (event.brightnessTemperature ?? 0) >= 360;

  // Strict Condition 3: industrial site nearby (distance <= 2.0 km)
  const distToIndustry = event.nearestIndustrialSite?.distanceKm ?? 999;
  const isIndustryPassed = distToIndustry <= 2.0;

  // Strict Condition 4: multiple observations (eventsInLast24h >= 2 or persistenceHours >= 2.0)
  const observations = event.eventsInLast24h ?? 0;
  const persistence = event.persistenceHours ?? 0;
  const isMultipleObsPassed = observations >= 2 || persistence >= 2.0;

  const reasons: string[] = [];
  const missingCriteria: string[] = [];

  if (isRiskPassed) {
    reasons.push(`ITRI composite hazard score ${risk}/100 exceeds critical threshold (>85)`);
  } else {
    missingCriteria.push(`ITRI score ${risk}/100 below critical threshold (>85)`);
  }

  if (isThermalPassed) {
    reasons.push(`High thermal radiative power (${event.frp} MW) & brightness (${event.brightnessTemperature} K)`);
  } else {
    missingCriteria.push(`Thermal signature (FRP: ${event.frp} MW, BT: ${event.brightnessTemperature} K) sub-critical`);
  }

  if (isIndustryPassed) {
    reasons.push(`High-hazard industrial site within ${distToIndustry.toFixed(2)} km (${event.nearestIndustrialSite?.name})`);
  } else {
    missingCriteria.push(`No critical industrial asset within 2.0 km perimeter (nearest: ${distToIndustry.toFixed(2)} km)`);
  }

  if (isMultipleObsPassed) {
    reasons.push(`Multiple satellite overpass observations confirmed (${observations} passes in 24h, ${persistence}h persistence)`);
  } else {
    missingCriteria.push(`Single isolated pass with insufficient temporal persistence (<2h)`);
  }

  const isConfirmed = isRiskPassed && isThermalPassed && isIndustryPassed && isMultipleObsPassed;

  return {
    isConfirmed,
    statusText: isConfirmed 
      ? 'ACTUAL FIRE CONFIRMED' 
      : 'Thermal anomaly detected. Further verification required.',
    reasons,
    missingCriteria
  };
}

export function isActualFireEvent(event: ThermalEvent): boolean {
  return checkEmergencyConfirmation(event).isConfirmed;
}

/**
 * Finds the nearest police station for an event location.
 */
export function findNearestPoliceStation(lat: number, lon: number, stations: typeof POLICE_STATIONS = POLICE_STATIONS) {
  if (!stations.length) return null;
  let nearest = stations[0];
  let minDist = calculateHaversineDistance(lat, lon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < stations.length; i++) {
    const d = calculateHaversineDistance(lat, lon, stations[i].latitude, stations[i].longitude);
    if (d < minDist) {
      minDist = d;
      nearest = stations[i];
    }
  }

  return {
    ...nearest,
    distanceKm: minDist
  };
}

/**
 * Generates an end-to-end multi-agency Emergency Call Session directly tailored to the type of fire.
 */
export function createEmergencyCallSession(
  event: ThermalEvent, 
  isAutoTriggered: boolean = false
): EmergencyCallSession {
  const rankedFire = rankFireStationsForEvent(event, FIRE_STATIONS);
  const rankedHosp = rankHospitalsForEvent(event, HOSPITALS);
  const nearestPolice = findNearestPoliceStation(event.latitude, event.longitude, POLICE_STATIONS) || POLICE_STATIONS[0];

  const primaryFire = rankedFire[0] || {
    name: 'District Central Fire Station',
    contactNumber: '+91-22-2522-1011',
    distanceKm: 2.1,
    estimatedArrivalMinutes: 5
  };

  const primaryHosp = rankedHosp[0] || {
    name: 'District Civil & Trauma Hospital',
    contactNumber: '+91-22-2559-8200',
    distanceKm: 3.5,
    estimatedArrivalMinutes: 8
  };

  const primaryPolice = nearestPolice;

  // Determine Fire Category and tailored directives
  let category: EmergencyCallSession['fireCategory'] = 'INDUSTRIAL_CHEMICAL_FIRE';
  let detectedFireType = 'Hazardous Industrial Chemical Blaze';
  let evacMeters = 1500;

  if (event.classification === 'Wildfire' || event.landCover === 'Forest') {
    category = 'WILDFIRE';
    detectedFireType = 'Forest & Wildland Canopy Blaze';
    evacMeters = 2000;
  } else if (event.classification === 'Agricultural Burning' || event.landCover === 'Agriculture') {
    category = 'AGRICULTURAL_FIRE';
    detectedFireType = 'Heavy Agricultural Crop Stubble Fire';
    evacMeters = 800;
  } else if (event.classification === 'Gas Flare' || event.nearestIndustrialSite?.type.includes('Refinery')) {
    category = 'GAS_FLARE_FIRE';
    detectedFireType = 'Pressurized Gas / Hydrocarbon Flare Anomaly';
    evacMeters = 1800;
  } else {
    category = 'INDUSTRIAL_CHEMICAL_FIRE';
    detectedFireType = 'Catastrophic Industrial Petrochemical Fire';
    evacMeters = 1500;
  }

  const facilityDesc = event.nearestIndustrialSite 
    ? `${event.nearestIndustrialSite.name} (${event.nearestIndustrialSite.type})`
    : `Coordinates ${event.latitude.toFixed(4)}N, ${event.longitude.toFixed(4)}E`;

  // 1. FIRE-FIGHTERS CHANNEL (Tailored to fire type)
  let fireDirectives: string[] = [];
  let fireSpecializedUnit = '';
  let fireSpeechScript = '';
  let fireFleet: string[] = [];

  if (category === 'INDUSTRIAL_CHEMICAL_FIRE') {
    fireSpecializedUnit = 'Industrial Hazmat & Heavy Chemical Foam Strike Team';
    fireDirectives = [
      'Turn out 12,000L Class B Alcohol-Resistant AFFF Foam Tenders immediately.',
      'Deploy water cooling curtains on neighboring pressurized solvent and hydrocarbon tanks.',
      'Initiate remote monitor nozzles to counter high thermal radiation (FRP ' + event.frp + ' MW).',
      'Enforce Level-A hazardous chemical vapor protective suits for first-in crew.'
    ];
    fireFleet = ['Foam Tender FT-01 (12,000L)', 'Hazmat Van HM-02', '54m Hydraulic Turntable Ladder', 'High-Volume Deluge Bowsers'];
    fireSpeechScript = `Priority One Red Alert to Industrial Fire Command! High-intensity chemical industrial fire detected by satellite at ${facilityDesc}. Radiative power is ${event.frp} megawatts. Turn out Class B chemical foam tenders and establish cooling curtains immediately!`;
  } else if (category === 'WILDFIRE') {
    fireSpecializedUnit = 'Wildland Fire Protection & Forest Response Wing';
    fireDirectives = [
      'Deploy 4x4 heavy all-terrain brush trucks and rapid water tenders.',
      'Establish defensive bulldozer firebreaks along prevailing wind corridors.',
      'Request aerial water-bombing liaison via State Disaster Control.',
      'Protect nearby residential boundaries and critical power transmission lines.'
    ];
    fireFleet = ['Wildland Brush Tender WB-1', 'Portable Pump Unit P-4', 'Forest Firebreak Crew 03'];
    fireSpeechScript = `Emergency Alert to Forest Fire Services! Rapidly advancing wildfire detected at ${facilityDesc}. FRP is ${event.frp} megawatts. Mobilize brush tenders and cut defensive firebreaks along downwind vectors immediately!`;
  } else if (category === 'AGRICULTURAL_FIRE') {
    fireSpecializedUnit = 'Taluka Rural Fire Brigade & Fast Water Bowser';
    fireDirectives = [
      'Deploy rapid water mist tenders to contain agricultural perimeter spread.',
      'Coordinate with village disaster volunteers to isolate adjacent dry crop fields.',
      'Monitor smoke drift across adjacent state highways and expressways.'
    ];
    fireFleet = ['Rural Water Bowser RB-01', 'Quick Response Mist Vehicle QRV-2'];
    fireSpeechScript = `Rural Fire Brigade Alert! Uncontrolled crop fire spreading at ${facilityDesc}. FRP is ${event.frp} megawatts. Deploy water bowsers to prevent spread to adjacent farms and roads.`;
  } else {
    fireSpecializedUnit = 'Refinery Emergency Response & Gas Safety Squad';
    fireDirectives = [
      'Deploy Dry Chemical Powder (DCP) tenders and high-expansion foam.',
      'Initiate remote gas shutoff valve procedures with facility refinery control room.',
      'Set up unmanned deluge monitors around gas manifold perimeter.'
    ];
    fireFleet = ['DCP Tender DCP-01', 'High-Expansion Foam Unit HX-3', 'Gas Vapor Monitoring Van'];
    fireSpeechScript = `Urgent Alert to Refinery Fire Service! Hydrocarbon gas anomaly detected at ${facilityDesc}. FRP is ${event.frp} megawatts. Deploy Dry Chemical Powder and verify isolation valve shutdown immediately!`;
  }

  // 2. DOCTORS / MEDICAL EMS CHANNEL (Tailored to fire type)
  let docDirectives: string[] = [];
  let docSpecializedUnit = '';
  let docSpeechScript = '';
  let docFleet: string[] = [];

  if (category === 'INDUSTRIAL_CHEMICAL_FIRE' || category === 'GAS_FLARE_FIRE') {
    docSpecializedUnit = 'Advanced Burn ICU & Chemical Toxicology Disaster Ward';
    docDirectives = [
      'Reserve 15 specialized Burn ICU beds and high-flow oxygen ventilators.',
      'Mobilize Cyanide Antidote Kits (Hydroxocobalamin) & Hydrogen Sulfide therapy protocols.',
      'Dispatch 4 Advanced Life Support (ALS) Ambulances equipped with burn dressing kits.',
      'Establish on-site emergency triage post at designated safe upwind staging gate.'
    ];
    docFleet = ['ALS Ambulance-108 (Paramedic 1)', 'ALS Ambulance-108 (Paramedic 2)', 'Mobile ICU Burn Van'];
    docSpeechScript = `Urgent Mass-Casualty Alert to Hospital Burn ICU and Trauma Command! High-hazard chemical fire at ${facilityDesc}. Prepare Burn ICU for severe thermal and toxic smoke injuries. Cyanide and smoke inhalation antidotes required. Dispatch ALS ambulances!`;
  } else if (category === 'WILDFIRE') {
    docSpecializedUnit = 'Mobile Respiratory Emergency Clinic & Trauma Response';
    docDirectives = [
      'Prepare emergency nebulizers, bronchodilators, and portable oxygen concentrators.',
      'Triage for acute carbon monoxide poisoning and smoke inhalation asphyxia.',
      'Deploy mobile medical van to forest boundary civilian evacuation assembly point.'
    ];
    docFleet = ['108 Mobile Clinic Van', 'Emergency Oxygen Supply Vehicle'];
    docSpeechScript = `Medical Emergency Alert to Hospital Trauma Unit. Wildfire plume spreading near ${facilityDesc}. Prepare respiratory emergency beds and mobilize smoke inhalation treatments immediately.`;
  } else {
    docSpecializedUnit = 'District Civil Hospital Emergency & Respiratory Triage Ward';
    docDirectives = [
      'Prepare aerosol therapy and pediatric respiratory triage support.',
      'Mobilize 2 local ambulances for elderly and vulnerable residents downwind.'
    ];
    docFleet = ['108 District Ambulance 04'];
    docSpeechScript = `Medical Alert to Community Hospital. Agricultural blaze smoke plume near ${facilityDesc}. Stand by for respiratory inhalation cases.`;
  }

  // 3. POLICE / LAW ENFORCEMENT CHANNEL (Tailored to fire type)
  let policeDirectives: string[] = [];
  let policeSpecializedUnit = '';
  let policeSpeechScript = '';
  let policeFleet: string[] = [];

  if (category === 'INDUSTRIAL_CHEMICAL_FIRE' || category === 'GAS_FLARE_FIRE') {
    policeSpecializedUnit = 'Industrial Zone DCP Command & Hazmat Cordon Force';
    policeDirectives = [
      `Establish immediate ${evacMeters}m perimeter roadblock and enforce zero unauthorized entry.`,
      'Activate Green Corridor along arterial highway for unhindered transit of fire tenders and ambulances.',
      'Broadcast loudspeaker evacuation orders for civilian settlements downwind of toxic smoke plume.',
      'Coordinate emergency plant shutdown evacuation with facility industrial security.'
    ];
    policeFleet = ['PCR Van Alpha-1', 'PCR Van Alpha-2', 'Traffic Green-Corridor Patrol 07', 'Evacuation Bus 01'];
    policeSpeechScript = `Police Priority One Emergency Dispatch! Major chemical fire emergency at ${facilityDesc}. Establish an immediate ${evacMeters} meter evacuation cordon. Clear a Green Corridor for fire brigade and ambulances immediately!`;
  } else if (category === 'WILDFIRE') {
    policeSpecializedUnit = 'Rural Highway Police & Forest Boundary Evacuation Squad';
    policeDirectives = [
      'Close forest approach roads and divert civilian highway traffic.',
      'Evacuate eco-tourism zones, forest resorts, and rural settlements within 2km.',
      'Deploy emergency sirens and megaphone patrol vehicles.'
    ];
    policeFleet = ['Highway Patrol HP-04', 'Rural Evacuation Unit R-2'];
    policeSpeechScript = `Police Emergency Alert! Wildfire threatening road corridors near ${facilityDesc}. Block access roads and initiate perimeter evacuation immediately.`;
  } else {
    policeSpecializedUnit = 'Rural Thana Beat Police & Traffic Safety Squad';
    policeDirectives = [
      'Deploy traffic speed warning signs due to dense crop smoke across highways.',
      'Inform local Gram Panchayat leaders of smoke hazard.'
    ];
    policeFleet = ['Police Patrol Van 03'];
    policeSpeechScript = `Police Advisory Alert. Agricultural smoke affecting roadways near ${facilityDesc}. Manage highway traffic flow and verify containment.`;
  }

  const sessionId = `EMG-CALL-${Date.now().toString().slice(-6)}-${event.id.slice(-3)}`;

  return {
    sessionId,
    eventId: event.eventId,
    detectedFireType,
    fireCategory: category,
    severity: event.itriRiskLevel || 'Critical',
    locationName: `${event.latitude.toFixed(4)}°N, ${event.longitude.toFixed(4)}°E`,
    facilityName: event.nearestIndustrialSite?.name,
    coordinates: {
      latitude: event.latitude,
      longitude: event.longitude
    },
    frp: event.frp,
    brightnessTemperature: event.brightnessTemperature,
    isAutoTriggered,
    initiatedAt: new Date().toISOString(),
    overallStatus: 'CALLING_IN_PROGRESS',
    evacuationPerimeterMeters: evacMeters,
    channels: {
      fireFighters: {
        role: 'FIRE_FIGHTERS',
        title: 'Fire & Rescue Command',
        departmentName: primaryFire.name,
        contactNumber: primaryFire.contactNumber,
        hotlineShortCode: '101 (Fire)',
        specializedUnit: fireSpecializedUnit,
        assignedOfficer: 'Chief Fire Officer M. Kulkarni',
        etaMinutes: primaryFire.estimatedArrivalMinutes || 5,
        connectionState: 'DIALING',
        fireTypeDirectives: fireDirectives,
        speechAudioTranscript: fireSpeechScript,
        responseFleet: fireFleet
      },
      doctors: {
        role: 'DOCTORS_EMS',
        title: 'Medical & Burn ICU Services',
        departmentName: primaryHosp.name,
        contactNumber: primaryHosp.contactNumber,
        hotlineShortCode: '108 (Ambulance/EMS)',
        specializedUnit: docSpecializedUnit,
        assignedOfficer: 'Dr. S. Nair (Chief Trauma & Burn Registrar)',
        etaMinutes: primaryHosp.estimatedArrivalMinutes || 8,
        connectionState: 'DIALING',
        fireTypeDirectives: docDirectives,
        speechAudioTranscript: docSpeechScript,
        responseFleet: docFleet
      },
      police: {
        role: 'POLICE_COMMAND',
        title: 'Police & Evacuation Command',
        departmentName: primaryPolice.name,
        contactNumber: primaryPolice.contactNumber,
        hotlineShortCode: '112 (National Emergency)',
        specializedUnit: policeSpecializedUnit,
        assignedOfficer: 'DCP V. Patil (Command Control)',
        etaMinutes: 4,
        connectionState: 'DIALING',
        fireTypeDirectives: policeDirectives,
        speechAudioTranscript: policeSpeechScript,
        responseFleet: policeFleet
      }
    }
  };
}

/**
 * Audio Synthesizer: Play an authentic two-tone emergency dispatch radio chime using Web Audio API
 */
export function playEmergencyAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Tone 1: 880 Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: 587.33 Hz (D5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.18);
    gain2.gain.setValueAtTime(0.001, ctx.currentTime);
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.65);
  } catch (e) {
    console.warn('Web Audio chime playback not available:', e);
  }
}

/**
 * Text-To-Speech: Reads the voice dispatch transmission aloud using browser SpeechSynthesis
 */
export function speakDispatchAudio(
  text: string, 
  onStart?: () => void, 
  onEnd?: () => void
): void {
  try {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Cancel any prior speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en-US'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis playback error:', err);
  }
}

/**
 * Stops any active speech synthesis audio
 */
export function stopDispatchAudio(): void {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore error
  }
}
