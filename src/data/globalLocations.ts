export interface AreaLocation {
  name: string;
  latitude: number;
  longitude: number;
  type: 'Industrial Area' | 'Commercial District' | 'Urban Center' | 'Residential Zone' | 'Port / Logistics';
}

export interface CityDistrict {
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
  areas: AreaLocation[];
}

export interface RegionState {
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
  districts: CityDistrict[];
}

export interface CountryData {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
  regions: RegionState[];
}

export const GLOBAL_COUNTRIES: CountryData[] = [
  {
    code: 'IN',
    name: 'India',
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 5,
    regions: [
      {
        name: 'Maharashtra',
        latitude: 19.7515,
        longitude: 75.7139,
        zoom: 7,
        districts: [
          {
            name: 'Nashik',
            latitude: 19.9975,
            longitude: 73.7898,
            zoom: 12,
            areas: [
              { name: 'Ambad MIDC Industrial Area', latitude: 19.9450, longitude: 73.7380, type: 'Industrial Area' },
              { name: 'Satpur MIDC Manufacturing Zone', latitude: 19.9920, longitude: 73.7340, type: 'Industrial Area' },
              { name: 'Sinnar Special Economic Zone (SEZ)', latitude: 19.8510, longitude: 73.9980, type: 'Industrial Area' },
              { name: 'Panchavati Urban & Commercial Sector', latitude: 20.0120, longitude: 73.7980, type: 'Urban Center' },
              { name: 'CIDCO Residential & Mixed Zone', latitude: 19.9650, longitude: 73.7550, type: 'Residential Zone' }
            ]
          },
          {
            name: 'Mumbai Suburban',
            latitude: 19.0760,
            longitude: 72.8777,
            zoom: 12,
            areas: [
              { name: 'Chembur Petrochemical Corridor', latitude: 19.0142, longitude: 72.8987, type: 'Industrial Area' },
              { name: 'Mahul Oil Terminal & Refining Basin', latitude: 19.0020, longitude: 72.8920, type: 'Industrial Area' },
              { name: 'Trombay Industrial Power Complex', latitude: 18.9950, longitude: 72.9150, type: 'Industrial Area' },
              { name: 'Kurla Commercial & Transit Hub', latitude: 19.0680, longitude: 72.8820, type: 'Commercial District' }
            ]
          },
          {
            name: 'Pune',
            latitude: 18.5204,
            longitude: 73.8567,
            zoom: 12,
            areas: [
              { name: 'Bhosari MIDC Industrial Zone', latitude: 18.6250, longitude: 73.8450, type: 'Industrial Area' },
              { name: 'Chakan Automotive Industrial Hub', latitude: 18.7580, longitude: 73.8580, type: 'Industrial Area' },
              { name: 'Hinjawadi Infotech & Research Park', latitude: 18.5910, longitude: 73.7380, type: 'Commercial District' }
            ]
          }
        ]
      },
      {
        name: 'Gujarat',
        latitude: 22.2587,
        longitude: 71.1924,
        zoom: 7,
        districts: [
          {
            name: 'Jamnagar',
            latitude: 22.4707,
            longitude: 70.0577,
            zoom: 12,
            areas: [
              { name: 'Moti Khavdi Petroleum Refining Megaplex', latitude: 22.3582, longitude: 69.8564, type: 'Industrial Area' },
              { name: 'Sikka Port & Marine Tanker Terminal', latitude: 22.4350, longitude: 69.8220, type: 'Port / Logistics' },
              { name: 'Jamnagar GIDC Phase II', latitude: 22.4850, longitude: 70.0820, type: 'Industrial Area' }
            ]
          },
          {
            name: 'Bharuch / Ankleshwar',
            latitude: 21.6267,
            longitude: 73.0033,
            zoom: 12,
            areas: [
              { name: 'Ankleshwar GIDC Chemical Cluster', latitude: 21.6241, longitude: 73.0125, type: 'Industrial Area' },
              { name: 'Panoli Petrochemical Industrial Estate', latitude: 21.5350, longitude: 72.9750, type: 'Industrial Area' },
              { name: 'Dahej Petroleum & Chemical PCPIR Zone', latitude: 21.7120, longitude: 72.5850, type: 'Industrial Area' }
            ]
          }
        ]
      },
      {
        name: 'Andhra Pradesh',
        latitude: 15.9129,
        longitude: 79.7400,
        zoom: 7,
        districts: [
          {
            name: 'Visakhapatnam',
            latitude: 17.6868,
            longitude: 83.2185,
            zoom: 12,
            areas: [
              { name: 'Mindi Industrial Refining Zone', latitude: 17.6594, longitude: 83.2241, type: 'Industrial Area' },
              { name: 'Gajuwaka Heavy Engineering Belt', latitude: 17.6910, longitude: 83.2120, type: 'Industrial Area' },
              { name: 'Visakhapatnam Port & Bulk Cargo Terminal', latitude: 17.6980, longitude: 83.2980, type: 'Port / Logistics' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    latitude: 37.0902,
    longitude: -95.7129,
    zoom: 4,
    regions: [
      {
        name: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        zoom: 6,
        districts: [
          {
            name: 'Los Angeles County',
            latitude: 34.0522,
            longitude: -118.2437,
            zoom: 11,
            areas: [
              { name: 'El Segundo Refining Basin', latitude: 33.9160, longitude: -118.4160, type: 'Industrial Area' },
              { name: 'Port of Long Beach Terminal Complex', latitude: 33.7540, longitude: -118.2160, type: 'Port / Logistics' },
              { name: 'Torrance Chemical Manufacturing Corridor', latitude: 33.8350, longitude: -118.3400, type: 'Industrial Area' },
              { name: 'Downtown Los Angeles Commercial Core', latitude: 34.0407, longitude: -118.2468, type: 'Urban Center' }
            ]
          },
          {
            name: 'Contra Costa County',
            latitude: 37.9193,
            longitude: -121.9290,
            zoom: 11,
            areas: [
              { name: 'Richmond Refinery Energy Corridor', latitude: 37.9480, longitude: -122.3850, type: 'Industrial Area' },
              { name: 'Martinez Petrochemical Facilities', latitude: 38.0190, longitude: -122.1340, type: 'Industrial Area' }
            ]
          }
        ]
      },
      {
        name: 'Texas',
        latitude: 31.9686,
        longitude: -99.9018,
        zoom: 6,
        districts: [
          {
            name: 'Harris County (Houston)',
            latitude: 29.7604,
            longitude: -95.3698,
            zoom: 11,
            areas: [
              { name: 'Houston Ship Channel Petrochemical Complex', latitude: 29.7420, longitude: -95.0125, type: 'Industrial Area' },
              { name: 'Baytown Hydrocarbon Processing Megaplex', latitude: 29.7450, longitude: -95.0080, type: 'Industrial Area' },
              { name: 'Pasadena Chemical Industrial Corridor', latitude: 29.6910, longitude: -95.2090, type: 'Industrial Area' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    latitude: 36.2048,
    longitude: 138.2529,
    zoom: 5,
    regions: [
      {
        name: 'Tokyo Metropolis',
        latitude: 35.6762,
        longitude: 139.6503,
        zoom: 11,
        districts: [
          {
            name: 'Ota Ward & Tokyo Bay',
            latitude: 35.5614,
            longitude: 139.7161,
            zoom: 12,
            areas: [
              { name: 'Keihin Industrial Zone - Tokyo Sector', latitude: 35.5450, longitude: 139.7600, type: 'Industrial Area' },
              { name: 'Haneda Logistics & Cargo Terminal', latitude: 35.5494, longitude: 139.7798, type: 'Port / Logistics' }
            ]
          },
          {
            name: 'Koto Ward',
            latitude: 35.6728,
            longitude: 139.8174,
            zoom: 12,
            areas: [
              { name: 'Aomi Coastal Shipping & Container Hub', latitude: 35.6200, longitude: 139.7800, type: 'Port / Logistics' },
              { name: 'Shin-Kiba Timber & Heavy Processing Area', latitude: 35.6450, longitude: 139.8250, type: 'Industrial Area' }
            ]
          }
        ]
      },
      {
        name: 'Kanagawa Prefecture',
        latitude: 35.4478,
        longitude: 139.6425,
        zoom: 11,
        districts: [
          {
            name: 'Kawasaki City',
            latitude: 35.5308,
            longitude: 139.7029,
            zoom: 12,
            areas: [
              { name: 'Mizue-cho Chemical & Refining Complex', latitude: 35.5120, longitude: 139.7420, type: 'Industrial Area' },
              { name: 'Ogishima LNG & Thermal Power Basin', latitude: 35.4850, longitude: 139.7250, type: 'Industrial Area' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    latitude: 55.3781,
    longitude: -3.4360,
    zoom: 6,
    regions: [
      {
        name: 'Greater London',
        latitude: 51.5074,
        longitude: -0.1278,
        zoom: 11,
        districts: [
          {
            name: 'London',
            latitude: 51.5074,
            longitude: -0.1278,
            zoom: 12,
            areas: [
              { name: 'Silvertown Docklands & Industrial Basin', latitude: 51.5020, longitude: 0.0220, type: 'Industrial Area' },
              { name: 'Barking & Dagenham Logistics Estate', latitude: 51.5360, longitude: 0.1340, type: 'Port / Logistics' },
              { name: 'City of London Central District', latitude: 51.5155, longitude: -0.0922, type: 'Urban Center' }
            ]
          }
        ]
      },
      {
        name: 'South East England',
        latitude: 51.2787,
        longitude: 0.5217,
        zoom: 9,
        districts: [
          {
            name: 'Southampton / Fawley',
            latitude: 50.8410,
            longitude: -1.3320,
            zoom: 12,
            areas: [
              { name: 'Fawley Petrochemical Megaplex', latitude: 50.8450, longitude: -1.3380, type: 'Industrial Area' },
              { name: 'Southampton Docks Container Port', latitude: 50.9020, longitude: -1.4150, type: 'Port / Logistics' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    latitude: -25.2744,
    longitude: 133.7751,
    zoom: 4,
    regions: [
      {
        name: 'New South Wales',
        latitude: -31.8402,
        longitude: 145.6128,
        zoom: 6,
        districts: [
          {
            name: 'Sydney',
            latitude: -33.8688,
            longitude: 151.2093,
            zoom: 11,
            areas: [
              { name: 'Port Botany Chemical & Fuel Terminal', latitude: -33.9720, longitude: 151.2180, type: 'Port / Logistics' },
              { name: 'Silverwater Industrial Park', latitude: -33.8350, longitude: 151.0500, type: 'Industrial Area' },
              { name: 'Sydney CBD Financial Core', latitude: -33.8688, longitude: 151.2093, type: 'Urban Center' }
            ]
          },
          {
            name: 'Newcastle & Hunter',
            latitude: -32.9283,
            longitude: 151.7817,
            zoom: 11,
            areas: [
              { name: 'Kooragang Island Fertilizer & Coal Port', latitude: -32.8850, longitude: 151.7450, type: 'Industrial Area' },
              { name: 'Tomago Aluminum Smelter Complex', latitude: -32.8250, longitude: 151.7150, type: 'Industrial Area' }
            ]
          }
        ]
      },
      {
        name: 'Western Australia',
        latitude: -27.6728,
        longitude: 121.6283,
        zoom: 5,
        districts: [
          {
            name: 'Pilbara / Karratha',
            latitude: -20.7353,
            longitude: 116.8463,
            zoom: 11,
            areas: [
              { name: 'Burrup Peninsula LNG Processing Basin', latitude: -20.6590, longitude: 116.7115, type: 'Industrial Area' },
              { name: 'Dampier Iron Ore & Gas Shipping Terminal', latitude: -20.6650, longitude: 116.6950, type: 'Port / Logistics' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    latitude: 51.1657,
    longitude: 10.4515,
    zoom: 6,
    regions: [
      {
        name: 'Rhineland-Palatinate',
        latitude: 49.9137,
        longitude: 7.4539,
        zoom: 8,
        districts: [
          {
            name: 'Ludwigshafen',
            latitude: 49.4811,
            longitude: 8.4464,
            zoom: 12,
            areas: [
              { name: 'BASF Chemical Verbund Megaplex', latitude: 49.5020, longitude: 8.4350, type: 'Industrial Area' },
              { name: 'Rheinhafen Inland Port Terminals', latitude: 49.4750, longitude: 8.4550, type: 'Port / Logistics' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'BR',
    name: 'Brazil',
    latitude: -14.2350,
    longitude: -51.9253,
    zoom: 4,
    regions: [
      {
        name: 'São Paulo',
        latitude: -23.5505,
        longitude: -46.6333,
        zoom: 7,
        districts: [
          {
            name: 'Cubatão / Santos',
            latitude: -23.8914,
            longitude: -46.4258,
            zoom: 12,
            areas: [
              { name: 'Cubatão Petrochemical & Metallurgical Belt', latitude: -23.8820, longitude: -46.4250, type: 'Industrial Area' },
              { name: 'Port of Santos Bulk Petrochemical Terminals', latitude: -23.9550, longitude: -46.3050, type: 'Port / Logistics' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    latitude: 23.4241,
    longitude: 53.8478,
    zoom: 7,
    regions: [
      {
        name: 'Abu Dhabi',
        latitude: 24.4539,
        longitude: 54.3773,
        zoom: 9,
        districts: [
          {
            name: 'Al Ruwais',
            latitude: 24.1103,
            longitude: 52.7306,
            zoom: 12,
            areas: [
              { name: 'Ruwais Industrial Petrochemical Megaplex', latitude: 24.1150, longitude: 52.7250, type: 'Industrial Area' },
              { name: 'Ruwais Crude & Gas Export Terminal', latitude: 24.1350, longitude: 52.7480, type: 'Port / Logistics' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    zoom: 11,
    regions: [
      {
        name: 'Southwest District',
        latitude: 1.2850,
        longitude: 103.7050,
        zoom: 12,
        districts: [
          {
            name: 'Jurong Island',
            latitude: 1.2728,
            longitude: 103.6825,
            zoom: 13,
            areas: [
              { name: 'Jurong Island Petrochemical Cluster', latitude: 1.2728, longitude: 103.6825, type: 'Industrial Area' },
              { name: 'Tuas Mega Port & Maritime Industrial Zone', latitude: 1.2650, longitude: 103.6250, type: 'Port / Logistics' }
            ]
          }
        ]
      }
    ]
  }
];

// Helper to find location match from coordinates
export function reverseLookupGlobalHierarchy(lat: number, lon: number): {
  country: string;
  region: string;
  city: string;
  area?: string;
} {
  // Check exact area proximity (< 50km)
  let bestMatch: {
    country: string;
    region: string;
    city: string;
    area?: string;
    dist: number;
  } | null = null;

  for (const country of GLOBAL_COUNTRIES) {
    for (const region of country.regions) {
      for (const district of region.districts) {
        for (const area of district.areas) {
          const d = Math.hypot(lat - area.latitude, lon - area.longitude) * 111.32;
          if (d < 50 && (!bestMatch || d < bestMatch.dist)) {
            bestMatch = {
              country: country.name,
              region: region.name,
              city: district.name,
              area: area.name,
              dist: d
            };
          }
        }
        // Also check district center
        const districtDist = Math.hypot(lat - district.latitude, lon - district.longitude) * 111.32;
        if (districtDist < 80 && (!bestMatch || districtDist < bestMatch.dist)) {
          bestMatch = {
            country: country.name,
            region: region.name,
            city: district.name,
            dist: districtDist
          };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      country: bestMatch.country,
      region: bestMatch.region,
      city: bestMatch.city,
      area: bestMatch.area
    };
  }

  // Broad coordinate fallback
  if (lat > 6 && lat < 38 && lon > 68 && lon < 98) {
    return { country: 'India', region: 'Maharashtra', city: 'Nashik' };
  } else if (lat > 24 && lat < 50 && lon > -125 && lon < -66) {
    return { country: 'United States', region: 'California', city: 'Los Angeles County' };
  } else if (lat > 30 && lat < 46 && lon > 129 && lon < 146) {
    return { country: 'Japan', region: 'Tokyo Metropolis', city: 'Tokyo' };
  } else if (lat > 49 && lat < 61 && lon > -11 && lon < 2) {
    return { country: 'United Kingdom', region: 'Greater London', city: 'London' };
  } else if (lat > -44 && lat < -10 && lon > 112 && lon < 154) {
    return { country: 'Australia', region: 'New South Wales', city: 'Sydney' };
  }

  return {
    country: 'International Coordinates',
    region: 'Geographic Zone',
    city: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
  };
}
