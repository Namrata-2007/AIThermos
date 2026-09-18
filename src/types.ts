export type SatelliteSource = 
  | 'VIIRS_NOAA21_NRT'
  | 'VIIRS_NOAA20_NRT'
  | 'VIIRS_SNPP_NRT'
  | 'MODIS_Terra_NRT'
  | 'MODIS_Aqua_NRT';

export type VerificationStatus = 
  | 'DETECTED'
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'DISPATCHED'
  | 'RESOLVED'
  | 'REJECTED';

export type EventClassification = 
  | 'Other / Unknown Thermal Anomaly'
  | 'Persistent Industrial Thermal Source'
  | 'Industrial Fire'
  | 'Gas Flare'
  | 'Agricultural Burning'
  | 'Wildfire'
  | 'Urban / Residential Fire'
  | 'Mining / Extraction Thermal Event';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type EmergencyMode = 'SIMULATION' | 'AUTHORIZED_INTEGRATION';

export interface VerificationGateway {
  verified: boolean;
  status: VerificationStatus;
  mlConfidence: number;
  mlConfidencePassed: boolean;
  historicalCorroboration: boolean;
  validCoordinates: boolean;
  independentEvidenceCount: number;
  satelliteConfirmed: boolean;
  historicalConfirmed: boolean;
  cameraConfirmed: boolean;
  osmProximityConfirmed: boolean;
  reasonCodes: string[];
  evaluatedAt: string;
}

export interface FireSpreadPolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON format [lng, lat]
  };
  properties: {
    prediction_horizon_minutes: number;
    wind_velocity_kmh: number;
    wind_direction_degrees: number;
    ambient_temp_c: number;
    relative_humidity_pct: number;
    area_sq_km: number;
    downwind_reach_km: number;
    crosswind_spread_km: number;
    generated_at: string;
    model_type: 'Elliptical Wind-Vector Spread (Prototype)';
  };
}

export interface CameraFeed {
  cameraId: string;
  name: string;
  latitude: number;
  longitude: number;
  streamUrl: string;
  isSimulated: boolean;
  source: string;
  firePixelDensity: number;
  fireDetected: boolean;
  hsvThreshold: number;
  lastProcessedFrameTime: string;
  resolution: string;
}

export interface CountryEmergencyRouting {
  countryCode: string;
  countryName: string;
  fireNumber: string;
  ambulanceNumber: string;
  policeNumber: string;
  unifiedEmergency: string;
  disasterControlName: string;
}

export type LandCoverType = 
  | 'Industrial'
  | 'Urban / Residential'
  | 'Forest'
  | 'Agriculture'
  | 'Mining'
  | 'Barren'
  | 'Water Body'
  | 'Other';

export interface ThermalEvent {
  id: string;
  eventId: string;
  latitude: number;
  longitude: number;
  acquisitionDate: string;
  acquisitionTime: string;
  satellite: string;
  instrument: string;
  brightnessTemperature: number; // in Kelvin
  frp: number; // Fire Radiative Power in MW
  confidence: number; // 0 - 100 or nominal/high
  dayNight: 'D' | 'N';
  scan: number;
  track: number;
  dataSource: 'LIVE_FIRMS' | 'HISTORICAL_FIRMS' | 'VALIDATED_BENCHMARK';
  
  // Verification & Safety Gateway State (AI Fire One / SIH 162)
  verificationStatus?: VerificationStatus;
  verificationGateway?: VerificationGateway;
  fireSpreadPrediction?: FireSpreadPolygon;
  nearbyCameras?: CameraFeed[];
  
  // Geographical Hierarchy
  country?: string;
  regionName?: string;
  districtName?: string;
  areaName?: string;
  continent?: string;

  // Enriched GIS & Temporal features
  nearestIndustrialSite?: {
    id: string;
    name: string;
    type: string;
    distanceKm: number;
  };
  landCover: LandCoverType;
  distanceToResidentialKm: number;
  distanceToRoadKm: number;
  distanceToHospitalKm: number;
  distanceToFireStationKm: number;
  distanceToForestKm: number;
  distanceToAgricultureKm: number;
  industrialDensityScore: number; // 0 - 10
  
  // Temporal properties
  persistenceHours: number;
  eventsInLast24h: number;
  eventsInLast7d: number;
  eventsInLast30d: number;
  frpTrendDelta: number; // percentage change vs baseline
  escalationLevel: 'STABLE' | 'MODERATE' | 'RAPID' | 'CRITICAL';
  isRecurringSource: boolean;
  isSpecialEventContext?: boolean; // Festival / Diwali context
  
  // Multi-Pass Historical Observations for Temporal Chart
  historicalObservations?: {
    date: string;
    frp: number;
    brightnessTemp: number;
    label?: string;
  }[];

  // Satellite Verification Metadata & Imagery
  satelliteContext?: {
    platform: string;
    bandName: string;
    resolutionMeters: number;
    falseColorUrl?: string;
    cloudCoverPct?: number;
    overpassType: 'Ascending' | 'Descending';
  };

  // Configurable Population & Infrastructure Exposure Buffers (500m, 1km, 5km, 10km)
  impactZones?: {
    radius500m: { population: number; facilities: number; roads: number };
    radius1km: { population: number; facilities: number; residentialBlocks: number };
    radius5km: { population: number; facilities: number; hospitals: number; fireStations: number };
    radius10km: { population: number; jurisdiction: string };
  };

  // Computed AI & Risk
  classification?: EventClassification;
  classificationConfidence?: number; // 0 - 100
  classificationReasons?: string[];
  itriScore?: number; // 0 - 100
  itriRiskLevel?: RiskLevel;
  populationExposure?: {
    radius1km: number;
    radius3km: number;
    radius5km: number;
    residentialBuildings: number;
    hospitalsCount: number;
    schoolsCount: number;
  };
}

export interface IndustrialSite {
  id: string;
  name: string;
  facilityType: 'Refinery' | 'Chemical' | 'Petrochemical' | 'Steel & Metallurgy' | 'Power Plant' | 'Fertilizer' | 'Storage Terminal' | 'Manufacturing';
  latitude: number;
  longitude: number;
  hazmatTier: 'Tier 1 (Extreme)' | 'Tier 2 (High)' | 'Tier 3 (Medium)';
  source: 'OpenStreetMap' | 'Industrial Directory';
  address: string;
}

export interface FireStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capability: ('Chemical Foam Tender' | 'Industrial High-Volume Pump' | 'Hazmat Containment' | 'Aerial Ladder 54m' | 'Standard Water Tender' | 'Breathing Apparatus Van')[];
  availability: 'Available' | 'Dispatched' | 'Standby';
  fleetSize: number;
  contactNumber: string;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  emergencyCapability: ('Advanced Burn ICU' | 'Level 1 Trauma Center' | 'Toxicology Unit' | 'Hyperbaric Oxygen' | 'General Emergency')[];
  burnBedCapacity: number;
  availableBeds: number;
  contactNumber: string;
}

export interface AmbulanceUnit {
  id: string;
  name: string;
  serviceType: 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)' | 'Hazmat Decontamination EMS' | 'Critical Care Mobile';
  latitude: number;
  longitude: number;
  hospitalAffiliation: string;
  paramedicCrewCount: number;
  availability: 'Available' | 'Dispatched' | 'Standby';
  contactNumber: string;
}

export interface ShapFactor {
  feature: string;
  value: string | number;
  attribution: number; // positive increases probability of classified class
  impactDirection: '++++' | '+++' | '++' | '+' | '-' | '--' | '---';
  description: string;
}

export interface ClassificationResult {
  eventId: string;
  predictedClass: EventClassification;
  confidence: number;
  modelVersion: string;
  classProbabilities: Record<EventClassification, number>;
  shapExplanations: ShapFactor[];
  topDrivers: string[];
}

export interface ItriRiskBreakdown {
  thermalIntensityScore: number; // 25%
  escalationScore: number; // 20%
  populationExposureScore: number; // 20%
  industrialProximityScore: number; // 15%
  persistenceScore: number; // 10%
  infrastructureScore: number; // 10%
  finalItri: number; // 0 - 100
  riskLevel: RiskLevel;
}

export interface ResponseResourceRanking {
  resourceId: string;
  resourceType: 'FIRE_STATION' | 'HOSPITAL';
  name: string;
  distanceKm: number;
  estimatedArrivalMinutes: number | null;
  capabilityScore: number; // 0 - 100
  suitabilityRank: number;
  keyStrengths: string[];
  contactNumber: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isOutsideRadius?: boolean;
}

export interface IncidentReport {
  reportNumber: string;
  generatedAt: string;
  event: ThermalEvent;
  classification: ClassificationResult;
  riskAssessment: ItriRiskBreakdown;
  nearbyResources: {
    fireStations: ResponseResourceRanking[];
    hospitals: ResponseResourceRanking[];
  };
  recommendedActions: string[];
  disasterManagementNotes: string;
}

export interface DispatchSimulation {
  dispatchId: string;
  eventId: string;
  status: 'PENDING' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'CONTAINMENT_IN_PROGRESS';
  dispatchedAt: string;
  assignedFireStations: string[];
  assignedHospitals: string[];
  incidentCommander: string;
  unitsDeployed: {
    unitId: string;
    unitType: string;
    stationName: string;
    status: 'Rolling' | 'On Scene' | 'Standby';
    etaMinutes: number;
  }[];
  evacuationRadiusMeters: number;
  alertBroadcastStatus: 'SENT_TO_DISTRICT_AUTHORITIES' | 'PENDING_APPROVAL';
}

export interface ModelEvaluationMetrics {
  modelName: string;
  evaluatedOn: string;
  totalSamples: number;
  overallAccuracy: number;
  macroF1: number;
  weightedF1: number;
  confusionMatrix: {
    classes: EventClassification[];
    matrix: number[][]; // actual vs predicted
  };
  classMetrics: {
    className: EventClassification;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }[];
  featureImportance: {
    feature: string;
    importance: number;
    category: 'Thermal' | 'Spatial' | 'Temporal' | 'Satellite' | 'Exposure';
  }[];
}

export type ResponderRole = 'FIRE_FIGHTERS' | 'DOCTORS_EMS' | 'POLICE_COMMAND';

export type StandardResponderRole = 
  | 'FIRE_RESCUE' 
  | 'POLICE' 
  | 'HOSPITAL_MEDICAL' 
  | 'AMBULANCE' 
  | 'DISASTER_MANAGEMENT';

export interface Responder {
  id: string;
  name: string;
  role: StandardResponderRole;
  roleLabel: string;
  organization: string;
  phoneNumber: string;
  location?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CallLifecycleStatus = 
  | 'QUEUED' 
  | 'INITIATING' 
  | 'RINGING' 
  | 'ANSWERED' 
  | 'COMPLETED' 
  | 'NO_ANSWER' 
  | 'BUSY' 
  | 'FAILED' 
  | 'CANCELLED';

export interface CallTimelineEntry {
  status: CallLifecycleStatus;
  timestamp: string;
  note: string;
}

export interface CallLog {
  callId: string;
  dispatchId: string;
  incidentId: string;
  hotspotId: string;
  responderId: string;
  responderName: string;
  role: StandardResponderRole;
  phoneNumber: string;
  mode: 'TEST' | 'LIVE';
  provider: 'MockTelephonyProvider' | 'TwilioLiveTelephonyProvider';
  providerCallId: string;
  status: CallLifecycleStatus;
  queuedAt: string;
  initiatedAt?: string;
  ringingAt?: string;
  answeredAt?: string;
  completedAt?: string;
  duration: number; // in seconds
  errorMessage?: string;
  timeline: CallTimelineEntry[];
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  frp?: number;
  severity?: string;
  classification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchAuditRecord {
  dispatchId: string;
  incidentId: string;
  hotspotId: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  initiatedAt: string;
  initiatedBy: string;
  mode: 'TEST' | 'LIVE';
  selectedResponderIds: string[];
  responders: {
    id: string;
    name: string;
    role: string;
    phoneNumber: string;
    callId: string;
    status: CallLifecycleStatus;
  }[];
  finalResults?: string;
}

export interface TelephonyProviderStatus {
  mode: 'TEST' | 'LIVE';
  providerName: string;
  isConfigured: boolean;
  twilioConfigured: boolean;
  twilioPhoneNumber?: string;
  hasAccountSid: boolean;
  error?: string;
}

export type CallConnectionState = 
  | 'QUEUED'
  | 'DIALING'
  | 'RINGING'
  | 'CONNECTED'
  | 'TRANSMITTING_DISPATCH'
  | 'ACKNOWLEDGED'
  | 'FAILED';

export interface EmergencyCallRecipient {
  role: ResponderRole;
  title: string;
  departmentName: string;
  contactNumber: string;
  hotlineShortCode: string; // e.g. "101", "108", "112"
  specializedUnit: string;
  assignedOfficer: string;
  etaMinutes: number;
  connectionState: CallConnectionState;
  fireTypeDirectives: string[];
  speechAudioTranscript: string;
  acknowledgedAt?: string;
  responseFleet: string[];
}

export interface EmergencyCallSession {
  sessionId: string;
  eventId: string;
  detectedFireType: string;
  fireCategory: 'INDUSTRIAL_CHEMICAL_FIRE' | 'WILDFIRE' | 'AGRICULTURAL_FIRE' | 'GAS_FLARE_FIRE' | 'URBAN_INDUSTRIAL_FIRE';
  severity: RiskLevel;
  locationName: string;
  facilityName?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  frp: number;
  brightnessTemperature: number;
  isAutoTriggered: boolean;
  initiatedAt: string;
  overallStatus: 'CALLING_IN_PROGRESS' | 'ALL_ACKNOWLEDGED' | 'COMPLETED';
  channels: {
    fireFighters: EmergencyCallRecipient;
    doctors: EmergencyCallRecipient;
    police: EmergencyCallRecipient;
  };
  evacuationPerimeterMeters: number;
}

export interface PoliceStation {
  id: string;
  name: string;
  division: string;
  latitude: number;
  longitude: number;
  patrolVehicles: number;
  specialSquad: string;
  contactNumber: string;
}

export interface LocationRiskAssessment {
  locationName: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  satelliteSource: string;
  evaluatedAt: string;
  fireDetected: boolean;
  activeHotspotCount: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  headline: string;
  detailedReason: string;
  atmosphericFactors: {
    ambientTempEstC: number;
    relativeHumidityEstPct: number;
    windEstKmh: number;
    vegetationIndexEstimate: string;
    industrialProximityKm?: number;
  };
  satelliteTelemetrySummary: {
    lastOverpassUtc: string;
    radiometricThermalAnomaly: boolean;
    sensorChannelsQueried: string[];
    maxFrpDetected: number;
    maxBtDetected: number;
  };
}

export interface TargetRegion {
  id: string;
  name: string;
  country: string;
  industrialSite: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  isCustom?: boolean;
  riskAssessment?: LocationRiskAssessment;
}

// ==========================================
// EMERGENCY DISPATCH SYSTEM (SIH26162 / MASTER SPEC)
// ==========================================

export type EmergencyServiceType = 'FIRE' | 'MEDICAL' | 'POLICE';

export type DispatchMode = 'TEST' | 'LIVE';

export type DispatchStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'ACCEPTED' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'SIMULATED';

export type IncidentStatus = 
  | 'MONITORING' 
  | 'EVALUATED' 
  | 'CRITICAL' 
  | 'DISPATCH_REQUESTED'
  | 'DISPATCHED' 
  | 'RESOLVED';

export interface IncidentRecord {
  incidentId: string; // e.g. INC-20260918-0001
  hotspotId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  country: string;
  region: string;
  industrialSite: string;
  fireRisk: number; // ITRI score (0 - 100)
  confidence: number;
  FRP: number;
  brightnessTemperature: number;
  satellite: string;
  observationTime: string;
  createdAt: string;
  status: IncidentStatus;
  evidenceValid: boolean;
  distanceToIndustryKm?: number;
}

export interface ServiceDispatchResult {
  service: EmergencyServiceType;
  status: 'SIMULATED' | 'ACCEPTED' | 'COMPLETED' | 'FAILED' | 'RETRY_SUCCESS';
  providerRequestId: string;
  timestamp: string;
  errorMessage?: string;
  details?: string;
}

export interface DispatchRecord {
  dispatchId: string; // e.g. DSP-20260918-0001
  incidentId: string;
  mode: DispatchMode;
  services: EmergencyServiceType[];
  latitude: number;
  longitude: number;
  locationName: string;
  reason: string;
  priority: 'ROUTINE' | 'HIGH' | 'CRITICAL';
  status: DispatchStatus;
  createdAt: string;
  updatedAt: string;
  provider: 'MOCK' | 'AUTHORIZED_LIVE';
  providerRequestId: string;
  errorMessage?: string;
  serviceResults: Partial<Record<EmergencyServiceType, ServiceDispatchResult>>;
  retryCount: number;
  responseTimeMs?: number;
}

export type DispatchAuditEventType = 
  | 'DISPATCH_CREATED'
  | 'DISPATCH_STARTED'
  | 'SERVICE_REQUESTED'
  | 'SERVICE_ACCEPTED'
  | 'SERVICE_FAILED'
  | 'DISPATCH_COMPLETED'
  | 'DISPATCH_CANCELLED'
  | 'DISPATCH_RETRIED';

export interface DispatchAuditEvent {
  eventId: string;
  event: DispatchAuditEventType;
  dispatchId: string;
  incidentId: string;
  mode: DispatchMode;
  userId: string;
  timestamp: string;
  service?: EmergencyServiceType;
  coordinates: {
    lat: number;
    lon: number;
  };
  metadata?: Record<string, any>;
}

export interface EmergencyHealthStatus {
  mode: DispatchMode;
  provider: 'MOCK' | 'AUTHORIZED_LIVE';
  available: boolean;
  liveDispatchEnabled: boolean;
  timestamp?: string;
  activeDispatchesCount?: number;
  totalDispatchesCount?: number;
  statusText?: string;
}

export interface DispatchTestRunResult {
  testNumber: number;
  testName: string;
  expected: string;
  actual: string;
  passed: boolean;
  details: string;
  timestamp: string;
}
