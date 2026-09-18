import { IndustrialSite, FireStation, Hospital, ThermalEvent, AmbulanceUnit, PoliceStation, TargetRegion } from '../types.ts';

export const TARGET_CORRIDORS: TargetRegion[] = [
  {
    id: 'ULSAN',
    name: 'East Asia (Ulsan Petrochemical Hub)',
    country: 'South Korea',
    industrialSite: 'SK Energy Ulsan Complex',
    latitude: 35.5030,
    longitude: 129.3560,
    radiusKm: 25
  },
  {
    id: 'JAMNAGAR',
    name: 'India (Jamnagar Mega-Refinery)',
    country: 'India',
    industrialSite: 'Reliance Jamnagar Petrochemical Refinery Complex',
    latitude: 22.3591,
    longitude: 69.8558,
    radiusKm: 25
  },
  {
    id: 'TEXAS',
    name: 'North America (Texas / Houston Ship Channel)',
    country: 'United States',
    industrialSite: 'ExxonMobil Baytown Complex',
    latitude: 29.7420,
    longitude: -95.0125,
    radiusKm: 25
  },
  {
    id: 'ROTTERDAM',
    name: 'Europe (Rotterdam / Pernis Port)',
    country: 'Netherlands',
    industrialSite: 'Shell Pernis Refinery & Chemical Hub',
    latitude: 51.8845,
    longitude: 4.3872,
    radiusKm: 25
  },
  {
    id: 'MUMBAI',
    name: 'India (Mumbai Chembur / Mahul)',
    country: 'India',
    industrialSite: 'Bharat Petroleum (BPCL) Refinery Mumbai',
    latitude: 19.0178,
    longitude: 72.8985,
    radiusKm: 25
  },
  {
    id: 'MIDDLE_EAST',
    name: 'Middle East (Ras Laffan Gas Megaplex)',
    country: 'Qatar',
    industrialSite: 'QatarEnergy LNG Ras Laffan Mega-Train',
    latitude: 25.9080,
    longitude: 51.5280,
    radiusKm: 25
  },
  {
    id: 'SOUTHEAST_ASIA',
    name: 'Southeast Asia (Singapore Jurong Island)',
    country: 'Singapore',
    industrialSite: 'ExxonMobil Jurong Island Petrochemical Complex',
    latitude: 1.2644,
    longitude: 103.7170,
    radiusKm: 20
  },
  {
    id: 'SOUTH_AMERICA',
    name: 'South America (Cubatão Industrial Valley)',
    country: 'Brazil',
    industrialSite: 'Petrobras RPBC Refinery Cubatão',
    latitude: -23.8950,
    longitude: -46.4250,
    radiusKm: 25
  },
  {
    id: 'AUSTRALIA',
    name: 'Australia (Pilbara & Kwinana Basin)',
    country: 'Australia',
    industrialSite: 'Kwinana Industrial Area & BP Terminal',
    latitude: -32.2280,
    longitude: 115.7720,
    radiusKm: 30
  },
  {
    id: 'AFRICA',
    name: 'Africa (Secunda Synfuels Complex)',
    country: 'South Africa',
    industrialSite: 'Sasol Secunda Synfuels Coal-to-Liquid Hub',
    latitude: -26.5250,
    longitude: 29.1750,
    radiusKm: 30
  },
  {
    id: 'ANKLESHWAR',
    name: 'India (Ankleshwar Chemical Estate)',
    country: 'India',
    industrialSite: 'Ankleshwar GIDC Mega Chemical Estate',
    latitude: 21.6264,
    longitude: 73.0031,
    radiusKm: 20
  },
  {
    id: 'VIZAG',
    name: 'India (Visakhapatnam Corridor)',
    country: 'India',
    industrialSite: 'HPCL Visakh Refinery & Petrochemical Terminal',
    latitude: 17.6868,
    longitude: 83.2185,
    radiusKm: 25
  }
];

export const INDUSTRIAL_SITES: IndustrialSite[] = [
  // ================= NORTH AMERICA =================
  {
    id: 'IND-USA-01',
    name: 'ExxonMobil Baytown Complex',
    facilityType: 'Petrochemical',
    latitude: 29.7420,
    longitude: -95.0125,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: '5000 Bayway Dr, Baytown, TX 77520, United States'
  },
  {
    id: 'IND-USA-02',
    name: 'Valero Texas City Refinery',
    facilityType: 'Refinery',
    latitude: 29.3810,
    longitude: -94.9215,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: '1301 Loop 197 S, Texas City, TX 77590, United States'
  },

  // ================= EUROPE =================
  {
    id: 'IND-EUR-01',
    name: 'Shell Pernis Refinery & Chemical Hub',
    facilityType: 'Refinery',
    latitude: 51.8845,
    longitude: 4.3872,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Vondelingenweg 601, 3196 KK Rotterdam, Netherlands'
  },
  {
    id: 'IND-EUR-02',
    name: 'BP Europoort Petrochemical Terminal',
    facilityType: 'Petrochemical',
    latitude: 51.9420,
    longitude: 4.1480,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'D’Arcyweg 76, 3198 NA Europoort Rotterdam, Netherlands'
  },

  // ================= MIDDLE EAST =================
  {
    id: 'IND-MEA-01',
    name: 'QatarEnergy LNG Ras Laffan Mega-Train',
    facilityType: 'Petrochemical',
    latitude: 25.9080,
    longitude: 51.5280,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Ras Laffan Industrial City, Al Shamal, Qatar'
  },
  {
    id: 'IND-MEA-02',
    name: 'Pearl GTL Gas-to-Liquids Complex',
    facilityType: 'Refinery',
    latitude: 25.9220,
    longitude: 51.5510,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Ras Laffan East Industrial Zone, Qatar'
  },

  // ================= SOUTHEAST ASIA =================
  {
    id: 'IND-SGP-01',
    name: 'ExxonMobil Jurong Aromatics & Chemical Plant',
    facilityType: 'Chemical',
    latitude: 1.2725,
    longitude: 103.6820,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: '100 Jurong Island Highway, Singapore 627888'
  },
  {
    id: 'IND-SGP-02',
    name: 'Shell Chemicals Pulau Bukom Energy Hub',
    facilityType: 'Refinery',
    latitude: 1.2350,
    longitude: 103.7680,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Pulau Bukom Industrial Island, Singapore 900000'
  },

  // ================= EAST ASIA =================
  {
    id: 'IND-KOR-01',
    name: 'SK Energy Ulsan Complex',
    facilityType: 'Refinery',
    latitude: 35.4980,
    longitude: 129.3450,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: '268 Gongdan-ro, Nam-gu, Ulsan, South Korea'
  },

  // ================= SOUTH AMERICA =================
  {
    id: 'IND-BRA-01',
    name: 'Refinaria Presidente Bernardes (RPBC Petrobras)',
    facilityType: 'Refinery',
    latitude: -23.8820,
    longitude: -46.4250,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Praça Cel. Fernando Prestes, Cubatão - SP, Brazil'
  },

  // ================= AUSTRALIA =================
  {
    id: 'IND-AUS-01',
    name: 'BP Kwinana Industrial Energy Hub',
    facilityType: 'Storage Terminal',
    latitude: -32.2280,
    longitude: 115.7650,
    hazmatTier: 'Tier 2 (High)',
    source: 'OpenStreetMap',
    address: 'Mason Rd, Kwinana Beach WA 6167, Australia'
  },
  {
    id: 'IND-AUS-02',
    name: 'Pilbara Mining & Smelting Operations',
    facilityType: 'Steel & Metallurgy',
    latitude: -20.6580,
    longitude: 116.7120,
    hazmatTier: 'Tier 2 (High)',
    source: 'OpenStreetMap',
    address: 'Burrup Peninsula, Dampier WA 6713, Australia'
  },

  // ================= AFRICA =================
  {
    id: 'IND-ZAF-01',
    name: 'Sasol Secunda Synthetic Fuels Complex',
    facilityType: 'Chemical',
    latitude: -26.5420,
    longitude: 29.1780,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'PDP Kruger St, Secunda, Mpumalanga 2302, South Africa'
  },

  // ================= INDIA =================
  {
    id: 'IND-MUM-01',
    name: 'Bharat Petroleum (BPCL) Refinery Mumbai',
    facilityType: 'Refinery',
    latitude: 19.0142,
    longitude: 72.8987,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Mahul Road, Chembur, Mumbai, Maharashtra 400074'
  },
  {
    id: 'IND-MUM-02',
    name: 'Hindustan Petroleum (HPCL) Mumbai Refinery',
    facilityType: 'Refinery',
    latitude: 19.0068,
    longitude: 72.8924,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'B.D. Patil Marg, Mahul, Mumbai 400074'
  },
  {
    id: 'IND-JAM-01',
    name: 'Reliance Jamnagar Petrochemical Refinery Complex',
    facilityType: 'Petrochemical',
    latitude: 22.3582,
    longitude: 69.8564,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Moti Khavdi, Jamnagar, Gujarat 361142'
  },
  {
    id: 'IND-ANK-01',
    name: 'Ankleshwar GIDC Specialty Chemical Complex',
    facilityType: 'Chemical',
    latitude: 21.6241,
    longitude: 73.0125,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'GIDC Industrial Estate, Ankleshwar, Bharuch, Gujarat 393002'
  },
  {
    id: 'IND-VIZ-01',
    name: 'Visakhapatnam Steel Plant (Rashtriya Ispat Nigam)',
    facilityType: 'Steel & Metallurgy',
    latitude: 17.6321,
    longitude: 83.1812,
    hazmatTier: 'Tier 1 (Extreme)',
    source: 'OpenStreetMap',
    address: 'Ukkunagaram, Visakhapatnam, Andhra Pradesh 530031'
  }
];

export const FIRE_STATIONS: FireStation[] = [
  // USA - Houston Area
  {
    id: 'FS-USA-01',
    name: 'Texas City Industrial Fire Command Station 1',
    latitude: 29.3890,
    longitude: -94.9120,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Hazmat Containment', 'Breathing Apparatus Van'],
    availability: 'Available',
    fleetSize: 14,
    contactNumber: '+1-409-643-5700'
  },
  {
    id: 'FS-USA-02',
    name: 'Baytown Fire Department Station 1',
    latitude: 29.7340,
    longitude: -94.9780,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Aerial Ladder 54m'],
    availability: 'Available',
    fleetSize: 10,
    contactNumber: '+1-281-422-2311'
  },

  // Europe - Rotterdam Port
  {
    id: 'FS-EUR-01',
    name: 'Havenbrandweer Rotterdam (Port Fire Command)',
    latitude: 51.8920,
    longitude: 4.3650,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Hazmat Containment'],
    availability: 'Available',
    fleetSize: 16,
    contactNumber: '+31-10-446-8900'
  },
  {
    id: 'FS-EUR-02',
    name: 'Brandweer Rozenburg Industriele Eenheid',
    latitude: 51.9050,
    longitude: 4.2510,
    capability: ['Chemical Foam Tender', 'Aerial Ladder 54m', 'Breathing Apparatus Van'],
    availability: 'Available',
    fleetSize: 8,
    contactNumber: '+31-181-213-400'
  },

  // Middle East - Qatar
  {
    id: 'FS-MEA-01',
    name: 'Ras Laffan Industrial City Emergency Response Brigade',
    latitude: 25.9120,
    longitude: 51.5340,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Hazmat Containment'],
    availability: 'Available',
    fleetSize: 18,
    contactNumber: '+974-4013-1111'
  },

  // Singapore - Jurong Island
  {
    id: 'FS-SGP-01',
    name: 'SCDF Jurong Island Fire Station (Singapore Civil Defence)',
    latitude: 1.2680,
    longitude: 103.6910,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Hazmat Containment'],
    availability: 'Available',
    fleetSize: 15,
    contactNumber: '+65-6861-0995'
  },

  // South Korea - Ulsan
  {
    id: 'FS-KOR-01',
    name: 'Ulsan Nambu Industrial Fire Station',
    latitude: 35.5020,
    longitude: 129.3380,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Aerial Ladder 54m'],
    availability: 'Available',
    fleetSize: 12,
    contactNumber: '+82-52-279-0119'
  },

  // Brazil - Cubatão
  {
    id: 'FS-BRA-01',
    name: 'Corpo de Bombeiros - Posto Cubatão Petroquímica',
    latitude: -23.8760,
    longitude: -46.4180,
    capability: ['Chemical Foam Tender', 'Hazmat Containment', 'Industrial High-Volume Pump'],
    availability: 'Available',
    fleetSize: 9,
    contactNumber: '+55-13-3361-1930'
  },

  // Australia - Kwinana
  {
    id: 'FS-AUS-01',
    name: 'DFES Kwinana Industrial Fire Station',
    latitude: -32.2350,
    longitude: 115.7720,
    capability: ['Chemical Foam Tender', 'Hazmat Containment', 'Breathing Apparatus Van'],
    availability: 'Available',
    fleetSize: 8,
    contactNumber: '+61-8-9419-1222'
  },

  // South Africa - Secunda
  {
    id: 'FS-ZAF-01',
    name: 'Sasol Secunda Emergency & Fire Rescue Service',
    latitude: -26.5380,
    longitude: 29.1820,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Hazmat Containment'],
    availability: 'Available',
    fleetSize: 11,
    contactNumber: '+27-17-610-2222'
  },

  // India
  {
    id: 'FS-MUM-01',
    name: 'Chembur Fire Command Station',
    latitude: 19.0491,
    longitude: 72.8942,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Aerial Ladder 54m', 'Breathing Apparatus Van'],
    availability: 'Available',
    fleetSize: 8,
    contactNumber: '+91-22-2522-1011'
  },
  {
    id: 'FS-MUM-02',
    name: 'Mahul Petrochemical Dedicated Fire Service',
    latitude: 19.0124,
    longitude: 72.8998,
    capability: ['Chemical Foam Tender', 'Hazmat Containment', 'Industrial High-Volume Pump'],
    availability: 'Available',
    fleetSize: 12,
    contactNumber: '+91-22-2554-4411'
  },
  {
    id: 'FS-JAM-01',
    name: 'Jamnagar Emergency Response & Fire Services',
    latitude: 22.4707,
    longitude: 70.0577,
    capability: ['Chemical Foam Tender', 'Industrial High-Volume Pump', 'Hazmat Containment'],
    availability: 'Available',
    fleetSize: 10,
    contactNumber: '+91-288-2550101'
  },
  {
    id: 'FS-ANK-01',
    name: 'Disaster Prevention & Management Centre (DPMC) Ankleshwar',
    latitude: 21.6310,
    longitude: 73.0084,
    capability: ['Chemical Foam Tender', 'Hazmat Containment', 'Breathing Apparatus Van'],
    availability: 'Available',
    fleetSize: 9,
    contactNumber: '+91-2646-221234'
  },
  {
    id: 'FS-VIZ-01',
    name: 'Visakhapatnam Industrial Corridor Fire Station',
    latitude: 17.6950,
    longitude: 83.2480,
    capability: ['Chemical Foam Tender', 'Hazmat Containment', 'Industrial High-Volume Pump'],
    availability: 'Available',
    fleetSize: 7,
    contactNumber: '+91-891-2565101'
  }
];

export const HOSPITALS: Hospital[] = [
  // USA - Houston
  {
    id: 'HOSP-USA-01',
    name: 'Memorial Hermann-TMC John S. Dunn Burn Center',
    latitude: 29.7125,
    longitude: -95.3980,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit', 'Hyperbaric Oxygen'],
    burnBedCapacity: 45,
    availableBeds: 19,
    contactNumber: '+1-713-704-4000'
  },
  {
    id: 'HOSP-USA-02',
    name: 'UTMB Health Galveston Level 1 Trauma & Blocker Burn Unit',
    latitude: 29.3105,
    longitude: -94.7745,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 38,
    availableBeds: 14,
    contactNumber: '+1-409-772-1011'
  },

  // Europe - Rotterdam
  {
    id: 'HOSP-EUR-01',
    name: 'Maasstad Ziekenhuis Brandwondencentrum (National Burn Centre)',
    latitude: 51.8790,
    longitude: 4.5310,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 30,
    availableBeds: 12,
    contactNumber: '+31-10-291-1911'
  },

  // Middle East - Qatar
  {
    id: 'HOSP-MEA-01',
    name: 'Ras Laffan General Hospital Burn & Specialized Care',
    latitude: 25.8850,
    longitude: 51.5120,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 25,
    availableBeds: 15,
    contactNumber: '+974-4025-5555'
  },

  // Singapore
  {
    id: 'HOSP-SGP-01',
    name: 'Singapore General Hospital (SGH) National Burns Centre',
    latitude: 1.2790,
    longitude: 103.8340,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit', 'Hyperbaric Oxygen'],
    burnBedCapacity: 40,
    availableBeds: 18,
    contactNumber: '+65-6222-3322'
  },

  // South Korea - Ulsan
  {
    id: 'HOSP-KOR-01',
    name: 'Ulsan University Hospital Regional Trauma & Burn Center',
    latitude: 35.5180,
    longitude: 129.4290,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 32,
    availableBeds: 11,
    contactNumber: '+82-52-250-7000'
  },

  // Brazil - Santos/Cubatão
  {
    id: 'HOSP-BRA-01',
    name: 'Hospital Samaritano & Centro de Queimados Santos',
    latitude: -23.9540,
    longitude: -46.3310,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center'],
    burnBedCapacity: 20,
    availableBeds: 8,
    contactNumber: '+55-13-3202-6000'
  },

  // Australia - Perth/Kwinana
  {
    id: 'HOSP-AUS-01',
    name: 'Fiona Stanley Hospital State Adult Burns Unit',
    latitude: -32.0680,
    longitude: 115.8450,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit', 'Hyperbaric Oxygen'],
    burnBedCapacity: 28,
    availableBeds: 13,
    contactNumber: '+61-8-6152-2222'
  },

  // South Africa - Secunda
  {
    id: 'HOSP-ZAF-01',
    name: 'Mediclinic Highveld Industrial Emergency Unit',
    latitude: -26.5120,
    longitude: 29.1620,
    emergencyCapability: ['Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 16,
    availableBeds: 7,
    contactNumber: '+27-17-686-3000'
  },

  // India
  {
    id: 'HOSP-MUM-01',
    name: 'BARC Hospital & Specialized Medical Center',
    latitude: 19.0381,
    longitude: 72.9189,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 35,
    availableBeds: 18,
    contactNumber: '+91-22-2559-8200'
  },
  {
    id: 'HOSP-MUM-02',
    name: 'KEM Hospital & National Burn Centre Network',
    latitude: 19.0028,
    longitude: 72.8424,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit', 'Hyperbaric Oxygen'],
    burnBedCapacity: 60,
    availableBeds: 24,
    contactNumber: '+91-22-2410-7000'
  },
  {
    id: 'HOSP-JAM-01',
    name: 'MP Shah Government Hospital Jamnagar',
    latitude: 22.4682,
    longitude: 70.0621,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 40,
    availableBeds: 16,
    contactNumber: '+91-288-2553000'
  },
  {
    id: 'HOSP-ANK-01',
    name: 'Sanjeevani Hospital & Industrial Trauma Unit',
    latitude: 21.6288,
    longitude: 73.0182,
    emergencyCapability: ['Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 20,
    availableBeds: 9,
    contactNumber: '+91-2646-245600'
  },
  {
    id: 'HOSP-VIZ-01',
    name: 'King George Hospital (KGH) Trauma Center',
    latitude: 17.7088,
    longitude: 83.3032,
    emergencyCapability: ['Advanced Burn ICU', 'Level 1 Trauma Center', 'Toxicology Unit'],
    burnBedCapacity: 45,
    availableBeds: 22,
    contactNumber: '+91-891-2564891'
  }
];

export const POLICE_STATIONS: PoliceStation[] = [
  // USA - Houston Area
  {
    id: 'POL-USA-01',
    name: 'Harris County Sheriff District 3 Industrial Command',
    division: 'Harris County Patrol & Hazmat Perimeter Unit',
    latitude: 29.7480,
    longitude: -95.0350,
    patrolVehicles: 24,
    specialSquad: 'Highway Emergency Cordon & Toxic Vapor Intercept',
    contactNumber: '+1-713-221-6000'
  },
  {
    id: 'POL-USA-02',
    name: 'Texas City Police Department',
    division: 'Industrial Security & Emergency Management Division',
    latitude: 29.3920,
    longitude: -94.9080,
    patrolVehicles: 18,
    specialSquad: 'Port & Refinery Green Corridor Clearers',
    contactNumber: '+1-409-643-5720'
  },

  // Europe - Rotterdam Port
  {
    id: 'POL-EUR-01',
    name: 'Zeehavenpolitie Rotterdam (Port Police Command)',
    division: 'Eenheid Rotterdam - Zeehaven & Industrie',
    latitude: 51.8980,
    longitude: 4.3420,
    patrolVehicles: 20,
    specialSquad: 'CBRN Perimeter Containment & Industrial Cordon',
    contactNumber: '+31-900-8844'
  },

  // Middle East - Qatar
  {
    id: 'POL-MEA-01',
    name: 'Al Shamal Security Directorate - Ras Laffan Division',
    division: 'Ministry of Interior Critical Energy Infrastructure Force',
    latitude: 25.9010,
    longitude: 51.5210,
    patrolVehicles: 22,
    specialSquad: 'National Critical Asset Protection Command',
    contactNumber: '+974-234-7000'
  },

  // Singapore
  {
    id: 'POL-SGP-01',
    name: 'Jurong Police Division Headquarters (SPF)',
    division: 'Singapore Police Force Island Sector',
    latitude: 1.3410,
    longitude: 103.7050,
    patrolVehicles: 28,
    specialSquad: 'Chemical Defense Evacuation Escort Unit',
    contactNumber: '+65-6791-0000'
  },

  // South Korea - Ulsan
  {
    id: 'POL-KOR-01',
    name: 'Ulsan Southern Police Station',
    division: 'Industrial Complex Special Traffic & Safety Div',
    latitude: 35.5340,
    longitude: 129.3180,
    patrolVehicles: 19,
    specialSquad: 'Petrochemical Evacuation Corridor Taskforce',
    contactNumber: '+82-52-208-0112'
  },

  // Brazil - Cubatão
  {
    id: 'POL-BRA-01',
    name: 'Polícia Militar do Estado de São Paulo - 1º Pelotão Cubatão',
    division: 'Polícia Rodoviária & Industrial Anchieta',
    latitude: -23.8910,
    longitude: -46.4290,
    patrolVehicles: 12,
    specialSquad: 'Controle de Tráfego de Emergência e Evacuação',
    contactNumber: '+55-13-3361-2200'
  },

  // Australia - Kwinana
  {
    id: 'POL-AUS-01',
    name: 'WA Police Force Kwinana Station',
    division: 'South Metropolitan District',
    latitude: -32.2410,
    longitude: 115.7890,
    patrolVehicles: 15,
    specialSquad: 'Emergency Road Closure & Evacuation Unit',
    contactNumber: '+61-8-9419-9000'
  },

  // South Africa - Secunda
  {
    id: 'POL-ZAF-01',
    name: 'Secunda SAPS Police Station',
    division: 'Mpumalanga Provincial Industrial Safety',
    latitude: -26.5180,
    longitude: 29.1740,
    patrolVehicles: 14,
    specialSquad: 'Rapid Public Evacuation Response Group',
    contactNumber: '+27-17-624-2000'
  },

  // India
  {
    id: 'POL-MUM-01',
    name: 'Chembur Police Division & Traffic Control Command',
    division: 'Zone VI Mumbai Police',
    latitude: 19.0520,
    longitude: 72.8980,
    patrolVehicles: 16,
    specialSquad: 'Green Corridor & Industrial Evacuation Squad',
    contactNumber: '+91-22-2522-1100'
  },
  {
    id: 'POL-MUM-02',
    name: 'Trombay & Mahul Coastal Industrial Police Station',
    division: 'Zone VI Special Hazardous Asset Protection',
    latitude: 19.0145,
    longitude: 72.9050,
    patrolVehicles: 12,
    specialSquad: 'Refinery Perimeter Cordon & Hazmat Traffic Divert',
    contactNumber: '+91-22-2554-1020'
  },
  {
    id: 'POL-JAM-01',
    name: 'Jamnagar Industrial Zone Police Command Center',
    division: 'Jamnagar City Division Police',
    latitude: 22.4715,
    longitude: 70.0610,
    patrolVehicles: 14,
    specialSquad: 'Refinery Highway Traffic Corridor Clearers',
    contactNumber: '+91-288-2550100'
  },
  {
    id: 'POL-ANK-01',
    name: 'Ankleshwar GIDC Industrial Police Station',
    division: 'Bharuch District Police',
    latitude: 21.6295,
    longitude: 73.0110,
    patrolVehicles: 10,
    specialSquad: 'Chemical Cluster Evacuation & Siren Deployment Force',
    contactNumber: '+91-2646-246100'
  },
  {
    id: 'POL-VIZ-01',
    name: 'Visakhapatnam Harbor & Industrial Police Station',
    division: 'Visakhapatnam City Police South Sub-Division',
    latitude: 17.6920,
    longitude: 83.2510,
    patrolVehicles: 11,
    specialSquad: 'Port & Refinery Emergency Cordon Squad',
    contactNumber: '+91-891-2562100'
  }
];

export const AMBULANCE_UNITS: AmbulanceUnit[] = [
  // USA
  {
    id: 'AMB-USA-01',
    name: 'Harris County ESD 5 Mobile Intensive Care Unit',
    serviceType: 'Advanced Life Support (ALS)',
    latitude: 29.7410,
    longitude: -95.0210,
    hospitalAffiliation: 'Memorial Hermann-TMC',
    paramedicCrewCount: 4,
    availability: 'Available',
    contactNumber: '+1-713-453-7300'
  },
  {
    id: 'AMB-USA-02',
    name: 'Galveston County Hazmat Decon EMS Unit 12',
    serviceType: 'Hazmat Decontamination EMS',
    latitude: 29.3850,
    longitude: -94.9180,
    hospitalAffiliation: 'UTMB Health Galveston',
    paramedicCrewCount: 6,
    availability: 'Available',
    contactNumber: '+1-409-765-3500'
  },

  // Europe
  {
    id: 'AMB-EUR-01',
    name: 'Ambulancezorg Rotterdam-Rijnmond Post Pernis',
    serviceType: 'Advanced Life Support (ALS)',
    latitude: 51.8880,
    longitude: 4.3910,
    hospitalAffiliation: 'Maasstad Ziekenhuis',
    paramedicCrewCount: 4,
    availability: 'Available',
    contactNumber: '+31-10-446-8800'
  },

  // Middle East
  {
    id: 'AMB-MEA-01',
    name: 'Hamad Medical Corporation (HMC) Industrial EMS Sector',
    serviceType: 'Critical Care Mobile',
    latitude: 25.8990,
    longitude: 51.5190,
    hospitalAffiliation: 'Ras Laffan General Hospital',
    paramedicCrewCount: 5,
    availability: 'Available',
    contactNumber: '+974-999'
  },

  // Singapore
  {
    id: 'AMB-SGP-01',
    name: 'SCDF Dedicated Chemical Triage Ambulance Unit 41',
    serviceType: 'Hazmat Decontamination EMS',
    latitude: 1.2710,
    longitude: 103.6880,
    hospitalAffiliation: 'Singapore General Hospital (SGH)',
    paramedicCrewCount: 4,
    availability: 'Available',
    contactNumber: '+65-995'
  },

  // South Korea
  {
    id: 'AMB-KOR-01',
    name: 'Ulsan 119 Special Rescue Emergency Medical Team',
    serviceType: 'Advanced Life Support (ALS)',
    latitude: 35.5050,
    longitude: 129.3410,
    hospitalAffiliation: 'Ulsan University Hospital',
    paramedicCrewCount: 4,
    availability: 'Available',
    contactNumber: '+82-119'
  },

  // Brazil
  {
    id: 'AMB-BRA-01',
    name: 'SAMU 192 Regional Baixada Santista - Posto Cubatão',
    serviceType: 'Advanced Life Support (ALS)',
    latitude: -23.8810,
    longitude: -46.4220,
    hospitalAffiliation: 'Hospital Samaritano Santos',
    paramedicCrewCount: 3,
    availability: 'Available',
    contactNumber: '+55-192'
  },

  // Australia
  {
    id: 'AMB-AUS-01',
    name: 'St John Ambulance WA - Kwinana Industrial Sub-centre',
    serviceType: 'Advanced Life Support (ALS)',
    latitude: -32.2310,
    longitude: 115.7760,
    hospitalAffiliation: 'Fiona Stanley Hospital',
    paramedicCrewCount: 4,
    availability: 'Available',
    contactNumber: '+61-000'
  },

  // South Africa
  {
    id: 'AMB-ZAF-01',
    name: 'ER24 EMS Secunda Base Industrial Response',
    serviceType: 'Advanced Life Support (ALS)',
    latitude: -26.5350,
    longitude: 29.1790,
    hospitalAffiliation: 'Mediclinic Highveld',
    paramedicCrewCount: 3,
    availability: 'Available',
    contactNumber: '+27-84-124'
  },

  // India
  {
    id: 'AMB-MUM-01',
    name: 'Mumbai 108 Industrial ALS Emergency Ambulance Fleet',
    serviceType: 'Advanced Life Support (ALS)',
    latitude: 19.0480,
    longitude: 72.8960,
    hospitalAffiliation: 'BARC Hospital',
    paramedicCrewCount: 3,
    availability: 'Available',
    contactNumber: '+91-108'
  },
  {
    id: 'AMB-JAM-01',
    name: 'Jamnagar Petrochemical Corridor Trauma Ambulance',
    serviceType: 'Hazmat Decontamination EMS',
    latitude: 22.4690,
    longitude: 70.0590,
    hospitalAffiliation: 'MP Shah Government Hospital',
    paramedicCrewCount: 4,
    availability: 'Available',
    contactNumber: '+91-108'
  }
];

export const INITIAL_THERMAL_EVENTS: ThermalEvent[] = [
  // ================= 1. NORTH AMERICA: HOUSTON PETROCHEMICAL CORRIDOR =================
  {
    id: 'evt-firms-global-hou-01',
    eventId: 'FIRMS-VIIRS-20260916-1402-HOU-01',
    country: 'United States',
    regionName: 'Texas (Houston Ship Channel / Baytown)',
    continent: 'North America',
    latitude: 29.7425,
    longitude: -95.0120,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '14:02:18',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 388.4,
    frp: 265.0, // Critical high-intensity fire
    confidence: 99,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 1.8,
    distanceToRoadKm: 0.2,
    distanceToHospitalKm: 4.2,
    distanceToFireStationKm: 0.8,
    distanceToForestKm: 25.0,
    distanceToAgricultureKm: 18.0,
    industrialDensityScore: 9.8,
    persistenceHours: 3.5,
    eventsInLast24h: 5,
    eventsInLast7d: 6,
    eventsInLast30d: 7,
    frpTrendDelta: +240.0,
    escalationLevel: 'CRITICAL',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 96,
    classificationReasons: [
      'Thermal intensity (265.0 MW) exceeds operational baseline by +240%',
      'Direct footprint inside high-hazard ExxonMobil Baytown petrochemical corridor',
      'Rapid thermal expansion detected across consecutive daytime VIIRS passes'
    ],
    itriScore: 93,
    itriRiskLevel: 'Critical',
    populationExposure: {
      radius1km: 8400,
      radius3km: 56000,
      radius5km: 185000,
      residentialBuildings: 2100,
      hospitalsCount: 2,
      schoolsCount: 8
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 28.0, brightnessTemp: 322.1, label: 'Nominal baseline furnace' },
      { date: '2026-09-11', frp: 29.5, brightnessTemp: 323.0, label: 'Stable operations' },
      { date: '2026-09-12', frp: 27.8, brightnessTemp: 321.8, label: 'Stable operations' },
      { date: '2026-09-13', frp: 31.0, brightnessTemp: 324.5, label: 'Stable operations' },
      { date: '2026-09-14', frp: 45.2, brightnessTemp: 334.0, label: 'Pre-ignition thermal drift' },
      { date: '2026-09-15', frp: 98.4, brightnessTemp: 358.2, label: 'Thermal intensification' },
      { date: '2026-09-16', frp: 265.0, brightnessTemp: 388.4, label: 'CRITICAL FIRE DETECTED' }
    ],
    satelliteContext: {
      platform: 'Suomi-NPP / NOAA-21 Joint Constellation',
      bandName: 'VIIRS I4 (3.74 μm Mid-IR) + M13 (4.05 μm Thermal)',
      resolutionMeters: 375,
      cloudCoverPct: 4.2,
      overpassType: 'Ascending'
    },
    impactZones: {
      radius500m: { population: 420, facilities: 4, roads: 2 },
      radius1km: { population: 8400, facilities: 12, residentialBlocks: 45 },
      radius5km: { population: 185000, facilities: 38, hospitals: 2, fireStations: 3 },
      radius10km: { population: 480000, jurisdiction: 'Harris County & Chambers County Emergency District' }
    }
  },

  // ================= 2. EUROPE: PORT OF ROTTERDAM CHEMICAL HUB =================
  {
    id: 'evt-firms-global-rot-01',
    eventId: 'FIRMS-VIIRS-20260916-0945-ROT-01',
    country: 'Netherlands',
    regionName: 'South Holland (Port of Rotterdam / Pernis)',
    continent: 'Europe',
    latitude: 51.8850,
    longitude: 4.3860,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '09:45:10',
    satellite: 'NOAA-20',
    instrument: 'VIIRS',
    brightnessTemperature: 379.2,
    frp: 188.5,
    confidence: 97,
    dayNight: 'D',
    scan: 0.36,
    track: 0.34,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 2.1,
    distanceToRoadKm: 0.3,
    distanceToHospitalKm: 3.8,
    distanceToFireStationKm: 1.2,
    distanceToForestKm: 12.0,
    distanceToAgricultureKm: 14.0,
    industrialDensityScore: 9.6,
    persistenceHours: 2.1,
    eventsInLast24h: 3,
    eventsInLast7d: 4,
    eventsInLast30d: 5,
    frpTrendDelta: +195.0,
    escalationLevel: 'CRITICAL',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 95,
    classificationReasons: [
      'Sudden +195% radiative spike over Shell Pernis catalytic cracking unit',
      'High brightness temperature (379.2 K) confirms hydrocarbon flame front',
      'Rapid dispatch recommendation required for Port Hazmat team'
    ],
    itriScore: 89,
    itriRiskLevel: 'Critical',
    populationExposure: {
      radius1km: 4200,
      radius3km: 42000,
      radius5km: 165000,
      residentialBuildings: 1250,
      hospitalsCount: 1,
      schoolsCount: 6
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 22.0, brightnessTemp: 318.0, label: 'Normal operations' },
      { date: '2026-09-11', frp: 23.4, brightnessTemp: 319.1, label: 'Normal operations' },
      { date: '2026-09-12', frp: 21.8, brightnessTemp: 317.5, label: 'Normal operations' },
      { date: '2026-09-13', frp: 25.0, brightnessTemp: 320.2, label: 'Normal operations' },
      { date: '2026-09-14', frp: 38.0, brightnessTemp: 329.4, label: 'Elevated flaring' },
      { date: '2026-09-15', frp: 72.0, brightnessTemp: 346.0, label: 'Process anomaly' },
      { date: '2026-09-16', frp: 188.5, brightnessTemp: 379.2, label: 'MAJOR INDUSTRIAL FIRE' }
    ],
    satelliteContext: {
      platform: 'Sentinel-2 MSI / VIIRS Joint Feed',
      bandName: 'SWIR Band 12 (2.19 μm) + Thermal Infrared',
      resolutionMeters: 20,
      cloudCoverPct: 2.1,
      overpassType: 'Descending'
    },
    impactZones: {
      radius500m: { population: 210, facilities: 6, roads: 3 },
      radius1km: { population: 4200, facilities: 16, residentialBlocks: 28 },
      radius5km: { population: 165000, facilities: 44, hospitals: 1, fireStations: 2 },
      radius10km: { population: 650000, jurisdiction: 'Veiligheidsregio Rotterdam-Rijnmond (VRR)' }
    }
  },

  // ================= 3. MIDDLE EAST: RAS LAFFAN LNG MEGAPLEX =================
  {
    id: 'evt-firms-global-qtr-01',
    eventId: 'FIRMS-VIIRS-20260916-1120-QTR-01',
    country: 'Qatar',
    regionName: 'Al Shamal (Ras Laffan Industrial City)',
    continent: 'Middle East',
    latitude: 25.9085,
    longitude: 51.5285,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '11:20:44',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 356.4,
    frp: 78.2,
    confidence: 94,
    dayNight: 'D',
    scan: 0.40,
    track: 0.38,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 6.2,
    distanceToRoadKm: 0.5,
    distanceToHospitalKm: 8.5,
    distanceToFireStationKm: 1.5,
    distanceToForestKm: 55.0,
    distanceToAgricultureKm: 28.0,
    industrialDensityScore: 9.9,
    persistenceHours: 4320.0, // Semi-permanent operational flare
    eventsInLast24h: 12,
    eventsInLast7d: 84,
    eventsInLast30d: 360,
    frpTrendDelta: +1.4,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Gas Flare',
    classificationConfidence: 98,
    classificationReasons: [
      'Multi-month continuous spatial recurrence at QatarEnergy LNG flare coordinates',
      'Stable baseline FRP (+1.4% delta) characteristic of controlled burn-off',
      'Sufficient standoff distance from residential communities (>6 km)'
    ],
    itriScore: 36,
    itriRiskLevel: 'Moderate',
    populationExposure: {
      radius1km: 650,
      radius3km: 3200,
      radius5km: 11000,
      residentialBuildings: 40,
      hospitalsCount: 0,
      schoolsCount: 0
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 76.5, brightnessTemp: 355.0, label: 'Controlled flare' },
      { date: '2026-09-11', frp: 77.0, brightnessTemp: 355.4, label: 'Controlled flare' },
      { date: '2026-09-12', frp: 79.1, brightnessTemp: 356.8, label: 'Controlled flare' },
      { date: '2026-09-13', frp: 76.8, brightnessTemp: 355.1, label: 'Controlled flare' },
      { date: '2026-09-14', frp: 78.0, brightnessTemp: 356.0, label: 'Controlled flare' },
      { date: '2026-09-15', frp: 77.5, brightnessTemp: 355.8, label: 'Controlled flare' },
      { date: '2026-09-16', frp: 78.2, brightnessTemp: 356.4, label: 'Stable operations' }
    ],
    satelliteContext: {
      platform: 'VIIRS NOAA-21 High Resolution NRT',
      bandName: 'M13 Mid-Wave Infrared (MWIR)',
      resolutionMeters: 375,
      cloudCoverPct: 0.1,
      overpassType: 'Ascending'
    },
    impactZones: {
      radius500m: { population: 80, facilities: 3, roads: 1 },
      radius1km: { population: 650, facilities: 8, residentialBlocks: 4 },
      radius5km: { population: 11000, facilities: 22, hospitals: 0, fireStations: 1 },
      radius10km: { population: 38000, jurisdiction: 'Ras Laffan Industrial City Security Command' }
    }
  },

  // ================= 4. SOUTHEAST ASIA: SINGAPORE JURONG ISLAND =================
  {
    id: 'evt-firms-global-sgp-01',
    eventId: 'FIRMS-VIIRS-20260916-0810-SGP-01',
    country: 'Singapore',
    regionName: 'South-West (Jurong Island Petrochemical Hub)',
    continent: 'Southeast Asia',
    latitude: 1.2728,
    longitude: 103.6825,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '08:10:22',
    satellite: 'Suomi-NPP',
    instrument: 'VIIRS',
    brightnessTemperature: 374.8,
    frp: 148.0,
    confidence: 96,
    dayNight: 'D',
    scan: 0.39,
    track: 0.35,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 3.5,
    distanceToRoadKm: 0.15,
    distanceToHospitalKm: 7.2,
    distanceToFireStationKm: 0.9,
    distanceToForestKm: 8.0,
    distanceToAgricultureKm: 18.0,
    industrialDensityScore: 9.8,
    persistenceHours: 1.8,
    eventsInLast24h: 2,
    eventsInLast7d: 3,
    eventsInLast30d: 4,
    frpTrendDelta: +178.0,
    escalationLevel: 'RAPID',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 94,
    classificationReasons: [
      'Violent combustion anomaly registered at ExxonMobil Jurong aromatics unit',
      'Rapid thermal doubling (+178%) over short temporal delta',
      'Immediate chemical foam mobilization dispatched via SCDF Jurong Island Station'
    ],
    itriScore: 87,
    itriRiskLevel: 'Critical',
    populationExposure: {
      radius1km: 1800,
      radius3km: 18000,
      radius5km: 95000,
      residentialBuildings: 320,
      hospitalsCount: 0,
      schoolsCount: 2
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 18.2, brightnessTemp: 315.0, label: 'Ambient operations' },
      { date: '2026-09-11', frp: 19.0, brightnessTemp: 315.8, label: 'Ambient operations' },
      { date: '2026-09-12', frp: 18.5, brightnessTemp: 315.2, label: 'Ambient operations' },
      { date: '2026-09-13', frp: 21.0, brightnessTemp: 317.0, label: 'Ambient operations' },
      { date: '2026-09-14', frp: 35.0, brightnessTemp: 328.0, label: 'Elevated temperature' },
      { date: '2026-09-15', frp: 62.0, brightnessTemp: 342.0, label: 'Thermal warning' },
      { date: '2026-09-16', frp: 148.0, brightnessTemp: 374.8, label: 'ACTIVE INDUSTRIAL FIRE' }
    ],
    satelliteContext: {
      platform: 'Suomi-NPP VIIRS NRT',
      bandName: 'I4/M13 Dual-Band Infrared',
      resolutionMeters: 375,
      cloudCoverPct: 8.5,
      overpassType: 'Descending'
    },
    impactZones: {
      radius500m: { population: 280, facilities: 7, roads: 2 },
      radius1km: { population: 1800, facilities: 18, residentialBlocks: 0 },
      radius5km: { population: 95000, facilities: 52, hospitals: 0, fireStations: 2 },
      radius10km: { population: 420000, jurisdiction: 'Singapore Civil Defence Force (SCDF) 4th Division' }
    }
  },

  // ================= 5. AUSTRALIA: PILBARA EXTRACTION / SMELTING =================
  {
    id: 'evt-firms-global-aus-01',
    eventId: 'FIRMS-VIIRS-20260916-0415-AUS-01',
    country: 'Australia',
    regionName: 'Western Australia (Pilbara / Dampier Basin)',
    continent: 'Australia',
    latitude: -20.6590,
    longitude: 116.7115,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '04:15:30',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 344.0,
    frp: 54.0,
    confidence: 89,
    dayNight: 'N',
    scan: 0.42,
    track: 0.38,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Mining',
    distanceToResidentialKm: 14.5,
    distanceToRoadKm: 1.8,
    distanceToHospitalKm: 28.0,
    distanceToFireStationKm: 16.0,
    distanceToForestKm: 42.0,
    distanceToAgricultureKm: 95.0,
    industrialDensityScore: 6.5,
    persistenceHours: 840.0,
    eventsInLast24h: 3,
    eventsInLast7d: 21,
    eventsInLast30d: 90,
    frpTrendDelta: +0.8,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Mining / Extraction Thermal Event',
    classificationConfidence: 93,
    classificationReasons: [
      'Consistent spatial alignment with Dampier mineral processing and smelting furnaces',
      'Very low population risk due to 14.5 km standoff from urban areas',
      'Stable radiative emission consistent with ore roasting and mineral processing'
    ],
    itriScore: 28,
    itriRiskLevel: 'Low',
    populationExposure: {
      radius1km: 45,
      radius3km: 180,
      radius5km: 620,
      residentialBuildings: 5,
      hospitalsCount: 0,
      schoolsCount: 0
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 53.0, brightnessTemp: 343.2, label: 'Smelting baseline' },
      { date: '2026-09-11', frp: 54.2, brightnessTemp: 344.1, label: 'Smelting baseline' },
      { date: '2026-09-12', frp: 53.8, brightnessTemp: 343.9, label: 'Smelting baseline' },
      { date: '2026-09-13', frp: 55.1, brightnessTemp: 344.8, label: 'Smelting baseline' },
      { date: '2026-09-14', frp: 54.0, brightnessTemp: 344.0, label: 'Smelting baseline' },
      { date: '2026-09-15', frp: 53.5, brightnessTemp: 343.7, label: 'Smelting baseline' },
      { date: '2026-09-16', frp: 54.0, brightnessTemp: 344.0, label: 'Smelting baseline' }
    ],
    satelliteContext: {
      platform: 'VIIRS NOAA-21 Nighttime Observation',
      bandName: 'Day/Night Band (DNB) + M13 Thermal',
      resolutionMeters: 750,
      cloudCoverPct: 0.0,
      overpassType: 'Ascending'
    },
    impactZones: {
      radius500m: { population: 15, facilities: 2, roads: 1 },
      radius1km: { population: 45, facilities: 4, residentialBlocks: 0 },
      radius5km: { population: 620, facilities: 9, hospitals: 0, fireStations: 0 },
      radius10km: { population: 4500, jurisdiction: 'Shire of Karratha & DFES Pilbara Command' }
    }
  },

  // ================= 6. SOUTH AMERICA: BRAZIL CUBATÃO PETROCHEMICAL COMPLEX =================
  {
    id: 'evt-firms-global-bra-01',
    eventId: 'FIRMS-VIIRS-20260916-1630-BRA-01',
    country: 'Brazil',
    regionName: 'São Paulo (Cubatão Industrial Valley)',
    continent: 'South America',
    latitude: -23.8825,
    longitude: -46.4245,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '16:30:15',
    satellite: 'NOAA-20',
    instrument: 'VIIRS',
    brightnessTemperature: 368.2,
    frp: 112.4,
    confidence: 93,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 1.9,
    distanceToRoadKm: 0.25,
    distanceToHospitalKm: 4.8,
    distanceToFireStationKm: 1.1,
    distanceToForestKm: 4.5,
    distanceToAgricultureKm: 22.0,
    industrialDensityScore: 9.4,
    persistenceHours: 4.2,
    eventsInLast24h: 3,
    eventsInLast7d: 4,
    eventsInLast30d: 5,
    frpTrendDelta: +135.0,
    escalationLevel: 'RAPID',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 91,
    classificationReasons: [
      'Escalation registered at Petrobras RPBC catalytic reforming process unit',
      'Direct thermal exposure to mountainous windward air basin',
      'Local civil defense notification initiated'
    ],
    itriScore: 84,
    itriRiskLevel: 'Critical',
    populationExposure: {
      radius1km: 6800,
      radius3km: 52000,
      radius5km: 145000,
      residentialBuildings: 1850,
      hospitalsCount: 1,
      schoolsCount: 7
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 26.0, brightnessTemp: 320.0, label: 'Base operations' },
      { date: '2026-09-11', frp: 27.2, brightnessTemp: 321.2, label: 'Base operations' },
      { date: '2026-09-12', frp: 25.8, brightnessTemp: 319.8, label: 'Base operations' },
      { date: '2026-09-13', frp: 32.0, brightnessTemp: 325.0, label: 'Minor venting' },
      { date: '2026-09-14', frp: 48.0, brightnessTemp: 335.0, label: 'Temperature rise' },
      { date: '2026-09-15', frp: 75.0, brightnessTemp: 350.0, label: 'Hazard warning' },
      { date: '2026-09-16', frp: 112.4, brightnessTemp: 368.2, label: 'INDUSTRIAL FIRE CONFIRMED' }
    ],
    satelliteContext: {
      platform: 'VIIRS NOAA-20 NRT',
      bandName: 'I4 Thermal Band',
      resolutionMeters: 375,
      cloudCoverPct: 12.0,
      overpassType: 'Ascending'
    },
    impactZones: {
      radius500m: { population: 410, facilities: 5, roads: 2 },
      radius1km: { population: 6800, facilities: 14, residentialBlocks: 32 },
      radius5km: { population: 145000, facilities: 38, hospitals: 1, fireStations: 2 },
      radius10km: { population: 460000, jurisdiction: 'Defesa Civil do Estado de São Paulo' }
    }
  },

  // ================= 7. INDIA: MUMBAI CHEMBUR REFINERY BELT =================
  {
    id: 'evt-firms-2026-001',
    eventId: 'FIRMS-VIIRS-20260916-1014-MUM-01',
    country: 'India',
    regionName: 'Maharashtra (Mumbai Chembur / Mahul Corridor)',
    continent: 'Asia',
    latitude: 19.0135,
    longitude: 72.8992,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '10:14:22',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 384.6,
    frp: 218.4,
    confidence: 98,
    dayNight: 'D',
    scan: 0.39,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 1.4,
    distanceToRoadKm: 0.2,
    distanceToHospitalKm: 3.1,
    distanceToFireStationKm: 0.45,
    distanceToForestKm: 18.2,
    distanceToAgricultureKm: 24.5,
    industrialDensityScore: 9.4,
    persistenceHours: 2.8,
    eventsInLast24h: 4,
    eventsInLast7d: 5,
    eventsInLast30d: 6,
    frpTrendDelta: +185.0,
    escalationLevel: 'CRITICAL',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 94,
    classificationReasons: [
      'Major chemical storage tank fire signature inside BPCL Mahul refinery perimeter',
      'Radiative power (218.4 MW) exceeds refinery operational envelope by +185%',
      'High-density urban population exposure within 3km downwind plume'
    ],
    itriScore: 91,
    itriRiskLevel: 'Critical',
    populationExposure: {
      radius1km: 18400,
      radius3km: 112000,
      radius5km: 420000,
      residentialBuildings: 3200,
      hospitalsCount: 2,
      schoolsCount: 11
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 25.0, brightnessTemp: 321.0, label: 'Base operations' },
      { date: '2026-09-11', frp: 26.5, brightnessTemp: 322.2, label: 'Base operations' },
      { date: '2026-09-12', frp: 24.8, brightnessTemp: 320.5, label: 'Base operations' },
      { date: '2026-09-13', frp: 28.0, brightnessTemp: 323.0, label: 'Base operations' },
      { date: '2026-09-14', frp: 42.0, brightnessTemp: 332.0, label: 'Thermal surge' },
      { date: '2026-09-15', frp: 85.0, brightnessTemp: 352.0, label: 'Incident onset' },
      { date: '2026-09-16', frp: 218.4, brightnessTemp: 384.6, label: 'CRITICAL MAJOR CHEMICAL FIRE' }
    ],
    satelliteContext: {
      platform: 'VIIRS NOAA-21 Joint Constellation',
      bandName: 'I4 (3.74 μm) High Resolution',
      resolutionMeters: 375,
      cloudCoverPct: 3.5,
      overpassType: 'Ascending'
    },
    impactZones: {
      radius500m: { population: 920, facilities: 8, roads: 3 },
      radius1km: { population: 18400, facilities: 24, residentialBlocks: 65 },
      radius5km: { population: 420000, facilities: 68, hospitals: 2, fireStations: 3 },
      radius10km: { population: 1450000, jurisdiction: 'Brihanmumbai Municipal Corporation (BMC) Disaster Management' }
    }
  },

  // ================= 8. INDIA: GUJARAT JAMNAGAR MEGA-REFINERY =================
  {
    id: 'evt-firms-2026-002',
    eventId: 'FIRMS-VIIRS-20260916-0842-JAM-01',
    country: 'India',
    regionName: 'Gujarat (Jamnagar Refinery Complex)',
    continent: 'Asia',
    latitude: 22.3591,
    longitude: 69.8558,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '08:42:10',
    satellite: 'Suomi-NPP',
    instrument: 'VIIRS',
    brightnessTemperature: 351.2,
    frp: 74.8,
    confidence: 92,
    dayNight: 'D',
    scan: 0.41,
    track: 0.38,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 4.8,
    distanceToRoadKm: 0.8,
    distanceToHospitalKm: 21.0,
    distanceToFireStationKm: 18.5,
    distanceToForestKm: 34.0,
    distanceToAgricultureKm: 8.5,
    industrialDensityScore: 9.8,
    persistenceHours: 720.0,
    eventsInLast24h: 8,
    eventsInLast7d: 56,
    eventsInLast30d: 240,
    frpTrendDelta: +2.1,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Gas Flare',
    classificationConfidence: 96,
    classificationReasons: [
      'Multi-week spatial recurrence over licensed refinery elevated flare stack',
      'Stable thermal emission without spatial migration',
      'Controlled process burn-off within safety perimeter'
    ],
    itriScore: 38,
    itriRiskLevel: 'Moderate',
    populationExposure: {
      radius1km: 1200,
      radius3km: 9800,
      radius5km: 24000,
      residentialBuildings: 180,
      hospitalsCount: 0,
      schoolsCount: 1
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 73.0, brightnessTemp: 350.5, label: 'Continuous flare' },
      { date: '2026-09-11', frp: 74.2, brightnessTemp: 351.0, label: 'Continuous flare' },
      { date: '2026-09-12', frp: 73.5, brightnessTemp: 350.8, label: 'Continuous flare' },
      { date: '2026-09-13', frp: 75.0, brightnessTemp: 351.5, label: 'Continuous flare' },
      { date: '2026-09-14', frp: 74.0, brightnessTemp: 351.0, label: 'Continuous flare' },
      { date: '2026-09-15', frp: 74.5, brightnessTemp: 351.1, label: 'Continuous flare' },
      { date: '2026-09-16', frp: 74.8, brightnessTemp: 351.2, label: 'Continuous flare' }
    ],
    satelliteContext: {
      platform: 'Suomi-NPP VIIRS',
      bandName: 'M13 Mid-IR Band',
      resolutionMeters: 750,
      cloudCoverPct: 0.5,
      overpassType: 'Descending'
    },
    impactZones: {
      radius500m: { population: 80, facilities: 4, roads: 1 },
      radius1km: { population: 1200, facilities: 12, residentialBlocks: 10 },
      radius5km: { population: 24000, facilities: 30, hospitals: 0, fireStations: 1 },
      radius10km: { population: 92000, jurisdiction: 'Jamnagar District Disaster Management Authority' }
    }
  },

  // ================= 9. AGRICULTURAL BURNING EXAMPLE (PUNJAB HARVEST BELT) =================
  {
    id: 'evt-firms-2026-005',
    eventId: 'FIRMS-VIIRS-20260915-1845-PUN-01',
    country: 'India',
    regionName: 'Punjab (Sangrur Agricultural Belt)',
    continent: 'Asia',
    latitude: 30.3421,
    longitude: 75.8214,
    acquisitionDate: '2026-09-15',
    acquisitionTime: '18:45:12',
    satellite: 'NOAA-20',
    instrument: 'VIIRS',
    brightnessTemperature: 326.4,
    frp: 32.1,
    confidence: 84,
    dayNight: 'N',
    scan: 0.45,
    track: 0.40,
    dataSource: 'HISTORICAL_FIRMS',
    landCover: 'Agriculture',
    distanceToResidentialKm: 3.4,
    distanceToRoadKm: 1.2,
    distanceToHospitalKm: 14.5,
    distanceToFireStationKm: 12.0,
    distanceToForestKm: 45.0,
    distanceToAgricultureKm: 0.05,
    industrialDensityScore: 0.2,
    persistenceHours: 1.2,
    eventsInLast24h: 1,
    eventsInLast7d: 2,
    eventsInLast30d: 3,
    frpTrendDelta: 0.0,
    escalationLevel: 'STABLE',
    isRecurringSource: false,
    classification: 'Agricultural Burning',
    classificationConfidence: 97,
    classificationReasons: [
      'Situated in intensive agricultural cropland with negative NDBI',
      'Transient low-intensity thermal footprint matching paddy stubble residue burning',
      'No critical industrial or refinery infrastructure within 15 km'
    ],
    itriScore: 21,
    itriRiskLevel: 'Low',
    populationExposure: {
      radius1km: 420,
      radius3km: 2800,
      radius5km: 9200,
      residentialBuildings: 65,
      hospitalsCount: 0,
      schoolsCount: 0
    },
    historicalObservations: [
      { date: '2026-09-13', frp: 0, brightnessTemp: 298.0, label: 'Unburned field' },
      { date: '2026-09-14', frp: 0, brightnessTemp: 299.1, label: 'Unburned field' },
      { date: '2026-09-15', frp: 32.1, brightnessTemp: 326.4, label: 'Crop residue stubble fire' },
      { date: '2026-09-16', frp: 8.0, brightnessTemp: 308.0, label: 'Smoldering / Extinguished' }
    ],
    satelliteContext: {
      platform: 'VIIRS NOAA-20 Nighttime',
      bandName: 'Day/Night Band',
      resolutionMeters: 375,
      cloudCoverPct: 0.0,
      overpassType: 'Ascending'
    },
    impactZones: {
      radius500m: { population: 25, facilities: 0, roads: 1 },
      radius1km: { population: 420, facilities: 0, residentialBlocks: 4 },
      radius5km: { population: 9200, facilities: 1, hospitals: 0, fireStations: 0 },
      radius10km: { population: 45000, jurisdiction: 'Sangrur District Agricultural & Fire Command' }
    }
  },

  // ================= 10. WILDFIRE EXAMPLE (WESTERN GHATS / FOREST) =================
  {
    id: 'evt-firms-2026-007',
    eventId: 'FIRMS-VIIRS-20260916-0915-WGF-01',
    country: 'India',
    regionName: 'Karnataka (Western Ghats Forest Zone)',
    continent: 'Asia',
    latitude: 14.2810,
    longitude: 74.8920,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '09:15:33',
    satellite: 'Suomi-NPP',
    instrument: 'VIIRS',
    brightnessTemperature: 348.0,
    frp: 92.4,
    confidence: 89,
    dayNight: 'D',
    scan: 0.42,
    track: 0.38,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Forest',
    distanceToResidentialKm: 8.5,
    distanceToRoadKm: 3.2,
    distanceToHospitalKm: 26.0,
    distanceToFireStationKm: 22.5,
    distanceToForestKm: 0.02,
    distanceToAgricultureKm: 11.0,
    industrialDensityScore: 0.0,
    persistenceHours: 18.0,
    eventsInLast24h: 3,
    eventsInLast7d: 5,
    eventsInLast30d: 5,
    frpTrendDelta: +42.0,
    escalationLevel: 'MODERATE',
    isRecurringSource: false,
    classification: 'Wildfire',
    classificationConfidence: 95,
    classificationReasons: [
      'Dense forest canopy land cover confirmed by Sentinel-2 NDVI',
      'Multi-kilometer thermal perimeter expansion indicating brush fire',
      'Absence of industrial facilities in 20 km zone'
    ],
    itriScore: 35,
    itriRiskLevel: 'Moderate',
    populationExposure: {
      radius1km: 45,
      radius3km: 350,
      radius5km: 1800,
      residentialBuildings: 8,
      hospitalsCount: 0,
      schoolsCount: 0
    },
    historicalObservations: [
      { date: '2026-09-14', frp: 12.0, brightnessTemp: 312.0, label: 'Ignition point' },
      { date: '2026-09-15', frp: 45.0, brightnessTemp: 330.5, label: 'Perimeter expansion' },
      { date: '2026-09-16', frp: 92.4, brightnessTemp: 348.0, label: 'Active spreading wildfire' }
    ],
    satelliteContext: {
      platform: 'Suomi-NPP VIIRS High Resolution',
      bandName: 'I4 (3.74 μm) Mid-IR',
      resolutionMeters: 375,
      cloudCoverPct: 5.0,
      overpassType: 'Descending'
    },
    impactZones: {
      radius500m: { population: 0, facilities: 0, roads: 0 },
      radius1km: { population: 45, facilities: 0, residentialBlocks: 0 },
      radius5km: { population: 1800, facilities: 1, hospitals: 0, fireStations: 0 },
      radius10km: { population: 12000, jurisdiction: 'Forest Department & State Disaster Management' }
    }
  },

  // ================= 11. EAST ASIA: SOUTH KOREA ULSAN PETROCHEMICAL HUB =================
  {
    id: 'evt-firms-ulsan-01',
    eventId: 'FIRMS-VIIRS-20260916-1215-ULS-01',
    country: 'South Korea',
    regionName: 'Ulsan Metropolitan City (Nam-gu Petrochemical Belt)',
    continent: 'Asia',
    latitude: 35.5042,
    longitude: 129.3585,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '12:15:32',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 364.5,
    frp: 98.6,
    confidence: 96,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 2.1,
    distanceToRoadKm: 0.3,
    distanceToHospitalKm: 3.5,
    distanceToFireStationKm: 0.9,
    distanceToForestKm: 18.0,
    distanceToAgricultureKm: 14.0,
    industrialDensityScore: 9.7,
    persistenceHours: 3.2,
    eventsInLast24h: 3,
    eventsInLast7d: 4,
    eventsInLast30d: 5,
    frpTrendDelta: +180.0,
    escalationLevel: 'RAPID',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 94,
    classificationReasons: [
      'Thermal intensity (98.6 MW) exceeds operational baseline by +180%',
      'Direct footprint inside SK Energy Ulsan Petrochemical Complex',
      'Rapid thermal expansion detected across consecutive daytime VIIRS passes'
    ],
    itriScore: 88,
    itriRiskLevel: 'Critical',
    nearestIndustrialSite: {
      id: 'IND-KOR-01',
      name: 'SK Energy Ulsan Complex',
      type: 'Refinery',
      distanceKm: 0.35
    },
    populationExposure: {
      radius1km: 6200,
      radius3km: 48000,
      radius5km: 165000,
      residentialBuildings: 1420,
      hospitalsCount: 2,
      schoolsCount: 6
    },
    historicalObservations: [
      { date: '2026-09-10', frp: 22.0, brightnessTemp: 320.1, label: 'Nominal furnace' },
      { date: '2026-09-11', frp: 24.5, brightnessTemp: 321.0, label: 'Stable operations' },
      { date: '2026-09-12', frp: 23.8, brightnessTemp: 320.8, label: 'Stable operations' },
      { date: '2026-09-13', frp: 28.0, brightnessTemp: 324.5, label: 'Stable operations' },
      { date: '2026-09-14', frp: 41.2, brightnessTemp: 334.0, label: 'Thermal drift' },
      { date: '2026-09-15', frp: 62.4, brightnessTemp: 348.2, label: 'Escalation' },
      { date: '2026-09-16', frp: 98.6, brightnessTemp: 364.5, label: 'CRITICAL INDUSTRIAL FIRE' }
    ],
    satelliteContext: {
      platform: 'Suomi-NPP / NOAA-21 Joint Constellation',
      bandName: 'VIIRS I4 (3.74 μm Mid-IR) + M13 (4.05 μm Thermal)',
      resolutionMeters: 375,
      cloudCoverPct: 3.8,
      overpassType: 'Ascending'
    },
    impactZones: {
      radius500m: { population: 280, facilities: 4, roads: 2 },
      radius1km: { population: 6200, facilities: 10, residentialBlocks: 32 },
      radius5km: { population: 165000, facilities: 28, hospitals: 2, fireStations: 2 },
      radius10km: { population: 420000, jurisdiction: 'Ulsan Metropolitan Fire & Disaster Management' }
    }
  },
  {
    id: 'evt-firms-ulsan-02',
    eventId: 'FIRMS-VIIRS-20260916-1215-ULS-02',
    country: 'South Korea',
    regionName: 'Ulsan Onsan Chemical Industrial Estate',
    continent: 'Asia',
    latitude: 35.4380,
    longitude: 129.3450,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '12:15:32',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 341.2,
    frp: 38.5,
    confidence: 91,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 3.5,
    distanceToRoadKm: 0.4,
    distanceToHospitalKm: 8.2,
    distanceToFireStationKm: 2.1,
    distanceToForestKm: 12.0,
    distanceToAgricultureKm: 15.0,
    industrialDensityScore: 8.8,
    persistenceHours: 24.0,
    eventsInLast24h: 1,
    eventsInLast7d: 6,
    eventsInLast30d: 26,
    frpTrendDelta: +2.0,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Gas Flare',
    classificationConfidence: 92,
    itriScore: 58,
    itriRiskLevel: 'Moderate',
    nearestIndustrialSite: {
      id: 'IND-KOR-01',
      name: 'SK Energy Ulsan Complex',
      type: 'Refinery',
      distanceKm: 7.4
    }
  },
  {
    id: 'evt-firms-ulsan-03',
    eventId: 'FIRMS-VIIRS-20260916-0340-ULS-03',
    country: 'South Korea',
    regionName: 'Ulsan Port Petrochemical Terminal',
    continent: 'Asia',
    latitude: 35.4920,
    longitude: 129.3820,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '03:40:18',
    satellite: 'Suomi-NPP',
    instrument: 'VIIRS',
    brightnessTemperature: 322.0,
    frp: 14.2,
    confidence: 84,
    dayNight: 'N',
    scan: 0.4,
    track: 0.38,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 4.2,
    distanceToRoadKm: 0.6,
    distanceToHospitalKm: 6.8,
    distanceToFireStationKm: 3.0,
    distanceToForestKm: 20.0,
    distanceToAgricultureKm: 18.0,
    industrialDensityScore: 7.5,
    persistenceHours: 1.5,
    eventsInLast24h: 1,
    eventsInLast7d: 2,
    eventsInLast30d: 3,
    frpTrendDelta: -5.0,
    escalationLevel: 'STABLE',
    isRecurringSource: false,
    classification: 'Other / Unknown Thermal Anomaly',
    classificationConfidence: 81,
    itriScore: 32,
    itriRiskLevel: 'Low',
    nearestIndustrialSite: {
      id: 'IND-KOR-01',
      name: 'SK Energy Ulsan Complex',
      type: 'Refinery',
      distanceKm: 2.8
    }
  },

  // ================= 12. INDIA: JAMNAGAR SECONDARY HOTSPOTS =================
  {
    id: 'evt-firms-jam-02',
    eventId: 'FIRMS-VIIRS-20260916-0842-JAM-02',
    country: 'India',
    regionName: 'Gujarat (Reliance Jamnagar Complex North Coker)',
    continent: 'Asia',
    latitude: 22.3680,
    longitude: 69.8640,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '08:42:15',
    satellite: 'Suomi-NPP',
    instrument: 'VIIRS',
    brightnessTemperature: 334.8,
    frp: 31.4,
    confidence: 89,
    dayNight: 'D',
    scan: 0.39,
    track: 0.37,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 4.8,
    distanceToRoadKm: 0.4,
    distanceToHospitalKm: 14.0,
    distanceToFireStationKm: 2.4,
    distanceToForestKm: 32.0,
    distanceToAgricultureKm: 6.0,
    industrialDensityScore: 9.2,
    persistenceHours: 18.0,
    eventsInLast24h: 1,
    eventsInLast7d: 5,
    eventsInLast30d: 20,
    frpTrendDelta: +1.5,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Persistent Industrial Thermal Source',
    classificationConfidence: 91,
    itriScore: 54,
    itriRiskLevel: 'Moderate',
    nearestIndustrialSite: {
      id: 'IND-JAM-01',
      name: 'Reliance Jamnagar Petrochemical Refinery Complex',
      type: 'Refinery',
      distanceKm: 1.2
    }
  },
  {
    id: 'evt-firms-jam-03',
    eventId: 'FIRMS-VIIRS-20260916-0842-JAM-03',
    country: 'India',
    regionName: 'Gujarat (Jamnagar West Petrochemical Buffer)',
    continent: 'Asia',
    latitude: 22.3450,
    longitude: 69.8420,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '08:42:15',
    satellite: 'Suomi-NPP',
    instrument: 'VIIRS',
    brightnessTemperature: 326.5,
    frp: 18.2,
    confidence: 82,
    dayNight: 'D',
    scan: 0.4,
    track: 0.38,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 5.2,
    distanceToRoadKm: 0.8,
    distanceToHospitalKm: 16.0,
    distanceToFireStationKm: 3.5,
    distanceToForestKm: 30.0,
    distanceToAgricultureKm: 5.5,
    industrialDensityScore: 8.1,
    persistenceHours: 2.0,
    eventsInLast24h: 1,
    eventsInLast7d: 2,
    eventsInLast30d: 4,
    frpTrendDelta: -2.0,
    escalationLevel: 'STABLE',
    isRecurringSource: false,
    classification: 'Other / Unknown Thermal Anomaly',
    classificationConfidence: 80,
    itriScore: 28,
    itriRiskLevel: 'Low',
    nearestIndustrialSite: {
      id: 'IND-JAM-01',
      name: 'Reliance Jamnagar Petrochemical Refinery Complex',
      type: 'Refinery',
      distanceKm: 2.1
    }
  },

  // ================= 13. NORTH AMERICA: TEXAS SECONDARY HOTSPOTS =================
  {
    id: 'evt-firms-hou-02',
    eventId: 'FIRMS-VIIRS-20260916-1402-HOU-02',
    country: 'United States',
    regionName: 'Texas (Baytown Petrochemical Flare Line)',
    continent: 'North America',
    latitude: 29.7510,
    longitude: -95.0250,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '14:02:18',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 345.0,
    frp: 48.6,
    confidence: 92,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 2.4,
    distanceToRoadKm: 0.3,
    distanceToHospitalKm: 4.5,
    distanceToFireStationKm: 1.5,
    distanceToForestKm: 24.0,
    distanceToAgricultureKm: 19.0,
    industrialDensityScore: 9.5,
    persistenceHours: 12.0,
    eventsInLast24h: 1,
    eventsInLast7d: 4,
    eventsInLast30d: 15,
    frpTrendDelta: +4.0,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Gas Flare',
    classificationConfidence: 93,
    itriScore: 65,
    itriRiskLevel: 'Moderate',
    nearestIndustrialSite: {
      id: 'IND-USA-01',
      name: 'ExxonMobil Baytown Complex',
      type: 'Petrochemical',
      distanceKm: 1.6
    }
  },
  {
    id: 'evt-firms-hou-03',
    eventId: 'FIRMS-VIIRS-20260916-1402-HOU-03',
    country: 'United States',
    regionName: 'Texas (Houston Ship Channel South Dock)',
    continent: 'North America',
    latitude: 29.7280,
    longitude: -95.0010,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '14:02:18',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 330.1,
    frp: 22.4,
    confidence: 86,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 3.1,
    distanceToRoadKm: 0.5,
    distanceToHospitalKm: 5.2,
    distanceToFireStationKm: 2.0,
    distanceToForestKm: 25.0,
    distanceToAgricultureKm: 20.0,
    industrialDensityScore: 9.0,
    persistenceHours: 3.0,
    eventsInLast24h: 1,
    eventsInLast7d: 2,
    eventsInLast30d: 5,
    frpTrendDelta: 0.0,
    escalationLevel: 'STABLE',
    isRecurringSource: false,
    classification: 'Persistent Industrial Thermal Source',
    classificationConfidence: 87,
    itriScore: 42,
    itriRiskLevel: 'Moderate',
    nearestIndustrialSite: {
      id: 'IND-USA-01',
      name: 'ExxonMobil Baytown Complex',
      type: 'Petrochemical',
      distanceKm: 2.0
    }
  },

  // ================= 14. EUROPE: ROTTERDAM SECONDARY HOTSPOT =================
  {
    id: 'evt-firms-rot-02',
    eventId: 'FIRMS-VIIRS-20260916-0945-ROT-02',
    country: 'Netherlands',
    regionName: 'South Holland (Botlek Chemical Corridor)',
    continent: 'Europe',
    latitude: 51.8920,
    longitude: 4.3980,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '09:45:10',
    satellite: 'NOAA-20',
    instrument: 'VIIRS',
    brightnessTemperature: 342.6,
    frp: 41.2,
    confidence: 90,
    dayNight: 'D',
    scan: 0.36,
    track: 0.34,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 2.8,
    distanceToRoadKm: 0.4,
    distanceToHospitalKm: 4.2,
    distanceToFireStationKm: 1.8,
    distanceToForestKm: 14.0,
    distanceToAgricultureKm: 16.0,
    industrialDensityScore: 9.3,
    persistenceHours: 14.0,
    eventsInLast24h: 1,
    eventsInLast7d: 3,
    eventsInLast30d: 12,
    frpTrendDelta: +3.0,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Gas Flare',
    classificationConfidence: 91,
    itriScore: 61,
    itriRiskLevel: 'Moderate',
    nearestIndustrialSite: {
      id: 'IND-NLD-01',
      name: 'Shell Pernis Refinery & Chemical Hub',
      type: 'Refinery',
      distanceKm: 1.1
    }
  },

  // ================= 15. INDIA: MUMBAI SECONDARY HOTSPOT =================
  {
    id: 'evt-firms-mum-02',
    eventId: 'FIRMS-VIIRS-20260916-1014-MUM-02',
    country: 'India',
    regionName: 'Maharashtra (Chembur RCF Fertilizer Flare)',
    continent: 'Asia',
    latitude: 19.0210,
    longitude: 72.9080,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '10:14:22',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 338.4,
    frp: 35.8,
    confidence: 88,
    dayNight: 'D',
    scan: 0.37,
    track: 0.35,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 1.2,
    distanceToRoadKm: 0.2,
    distanceToHospitalKm: 2.5,
    distanceToFireStationKm: 1.4,
    distanceToForestKm: 14.0,
    distanceToAgricultureKm: 25.0,
    industrialDensityScore: 9.6,
    persistenceHours: 20.0,
    eventsInLast24h: 1,
    eventsInLast7d: 5,
    eventsInLast30d: 18,
    frpTrendDelta: +1.0,
    escalationLevel: 'STABLE',
    isRecurringSource: true,
    classification: 'Gas Flare',
    classificationConfidence: 90,
    itriScore: 59,
    itriRiskLevel: 'Moderate',
    nearestIndustrialSite: {
      id: 'IND-MUM-01',
      name: 'Bharat Petroleum (BPCL) Refinery Mumbai',
      type: 'Refinery',
      distanceKm: 1.2
    }
  },

  // ================= 16. INDIA: ANKLESHWAR GIDC MEGA CHEMICAL ESTATE =================
  {
    id: 'evt-firms-ank-01',
    eventId: 'FIRMS-VIIRS-20260916-1105-ANK-01',
    country: 'India',
    regionName: 'Gujarat (Ankleshwar GIDC Chemical Cluster)',
    continent: 'Asia',
    latitude: 21.6264,
    longitude: 73.0031,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '11:05:40',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 356.2,
    frp: 82.4,
    confidence: 94,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 2.0,
    distanceToRoadKm: 0.2,
    distanceToHospitalKm: 3.2,
    distanceToFireStationKm: 0.8,
    distanceToForestKm: 22.0,
    distanceToAgricultureKm: 4.5,
    industrialDensityScore: 9.5,
    persistenceHours: 2.5,
    eventsInLast24h: 2,
    eventsInLast7d: 3,
    eventsInLast30d: 4,
    frpTrendDelta: +110.0,
    escalationLevel: 'RAPID',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 92,
    itriScore: 82,
    itriRiskLevel: 'High',
    nearestIndustrialSite: {
      id: 'IND-ANK-01',
      name: 'Ankleshwar GIDC Mega Chemical Estate',
      type: 'Chemical Plant',
      distanceKm: 0.4
    }
  },

  // ================= 17. INDIA: VISAKHAPATNAM CORRIDOR =================
  {
    id: 'evt-firms-viz-01',
    eventId: 'FIRMS-VIIRS-20260916-0722-VIZ-01',
    country: 'India',
    regionName: 'Andhra Pradesh (Visakhapatnam HPCL Coastal Refinery)',
    continent: 'Asia',
    latitude: 17.6868,
    longitude: 83.2185,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '07:22:15',
    satellite: 'Suomi-NPP',
    instrument: 'VIIRS',
    brightnessTemperature: 361.0,
    frp: 91.5,
    confidence: 95,
    dayNight: 'D',
    scan: 0.37,
    track: 0.35,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 2.5,
    distanceToRoadKm: 0.3,
    distanceToHospitalKm: 4.0,
    distanceToFireStationKm: 1.1,
    distanceToForestKm: 15.0,
    distanceToAgricultureKm: 12.0,
    industrialDensityScore: 9.4,
    persistenceHours: 3.0,
    eventsInLast24h: 2,
    eventsInLast7d: 3,
    eventsInLast30d: 4,
    frpTrendDelta: +135.0,
    escalationLevel: 'RAPID',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 93,
    itriScore: 85,
    itriRiskLevel: 'High',
    nearestIndustrialSite: {
      id: 'IND-VIZ-01',
      name: 'HPCL Visakh Refinery & Petrochemical Terminal',
      type: 'Refinery',
      distanceKm: 0.3
    }
  },

  // ================= 18. AFRICA: SECUNDA SYNFUELS COMPLEX =================
  {
    id: 'evt-firms-afr-01',
    eventId: 'FIRMS-VIIRS-20260916-1310-SEC-01',
    country: 'South Africa',
    regionName: 'Mpumalanga (Sasol Secunda Synfuels Hub)',
    continent: 'Africa',
    latitude: -26.5250,
    longitude: 29.1750,
    acquisitionDate: '2026-09-16',
    acquisitionTime: '13:10:05',
    satellite: 'NOAA-21',
    instrument: 'VIIRS',
    brightnessTemperature: 369.5,
    frp: 118.0,
    confidence: 96,
    dayNight: 'D',
    scan: 0.38,
    track: 0.36,
    dataSource: 'LIVE_FIRMS',
    landCover: 'Industrial',
    distanceToResidentialKm: 3.2,
    distanceToRoadKm: 0.4,
    distanceToHospitalKm: 6.5,
    distanceToFireStationKm: 1.5,
    distanceToForestKm: 35.0,
    distanceToAgricultureKm: 8.0,
    industrialDensityScore: 9.6,
    persistenceHours: 4.0,
    eventsInLast24h: 3,
    eventsInLast7d: 5,
    eventsInLast30d: 6,
    frpTrendDelta: +160.0,
    escalationLevel: 'CRITICAL',
    isRecurringSource: false,
    classification: 'Industrial Fire',
    classificationConfidence: 94,
    itriScore: 89,
    itriRiskLevel: 'Critical',
    nearestIndustrialSite: {
      id: 'IND-AFR-01',
      name: 'Sasol Secunda Synfuels Coal-to-Liquid Hub',
      type: 'Chemical Plant',
      distanceKm: 0.2
    }
  }
];
