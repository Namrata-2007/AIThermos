import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  ThermalEvent, 
  IndustrialSite, 
  FireStation, 
  Hospital, 
  PoliceStation,
  AmbulanceUnit,
  RiskLevel, 
  EventClassification,
  DispatchSimulation,
  TargetRegion
} from '../types.ts';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Navigation2, 
  AlertTriangle, 
  Maximize2
} from 'lucide-react';

interface GisMapProps {
  events: ThermalEvent[];
  industrialSites: IndustrialSite[];
  fireStations: FireStation[];
  hospitals: Hospital[];
  policeStations?: PoliceStation[];
  ambulanceUnits?: AmbulanceUnit[];
  selectedEvent: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent) => void;
  selectedRegion: TargetRegion | string;
  activeDispatch: DispatchSimulation | null;
  riskFilter: string;
  setRiskFilter: (risk: string) => void;
  classificationFilter: string;
  setClassificationFilter: (cls: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export const GisMap: React.FC<GisMapProps> = ({
  events,
  industrialSites,
  fireStations,
  hospitals,
  policeStations = [],
  ambulanceUnits = [],
  selectedEvent,
  onSelectEvent,
  selectedRegion,
  activeDispatch,
  riskFilter,
  setRiskFilter,
  classificationFilter,
  setClassificationFilter,
  onMapClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const industrialLayerRef = useRef<L.LayerGroup | null>(null);
  const emergencyLayerRef = useRef<L.LayerGroup | null>(null);
  const riskRingsLayerRef = useRef<L.LayerGroup | null>(null);
  const dispatchRouteLayerRef = useRef<L.LayerGroup | null>(null);
  const basemapGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer visibility toggles
  const [showHotspots, setShowHotspots] = React.useState(true);
  const [showIndustrial, setShowIndustrial] = React.useState(true);
  const [showEmergency, setShowEmergency] = React.useState(true);
  const [showRiskRings, setShowRiskRings] = React.useState(true);
  const [basemap, setBasemap] = React.useState<'dark' | 'satellite' | 'osm'>('dark');

  // Helper to load clean, watermark-free basemap tiles
  const applyBasemapTiles = (type: 'dark' | 'satellite' | 'osm', group: L.LayerGroup) => {
    group.clearLayers();

    if (type === 'dark') {
      // Esri World Dark Gray Canvas: completely free, fast CDN, zero watermarks
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 16, attribution: 'Esri, HERE, Garmin, © OpenStreetMap' }
      );
      const labels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 16 }
      );
      base.addTo(group);
      labels.addTo(group);
    } else if (type === 'satellite') {
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18, attribution: 'Esri, Maxar, Earthstar Geographics' }
      );
      const labels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18 }
      );
      sat.addTo(group);
      labels.addTo(group);
    } else if (type === 'osm') {
      const street = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18, attribution: 'Esri, HERE, Garmin, USGS' }
      );
      street.addTo(group);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered initially over Western India industrial corridor (Mumbai / Gujarat)
    const map = L.map(mapContainerRef.current, {
      center: [19.0142, 72.8987],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Basemap Layer Group (Watermark-free)
    const basemapGroup = L.layerGroup().addTo(map);
    basemapGroupRef.current = basemapGroup;
    applyBasemapTiles('dark', basemapGroup);

    // Zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initialize Layer Groups
    hotspotsLayerRef.current = L.layerGroup().addTo(map);
    industrialLayerRef.current = L.layerGroup().addTo(map);
    emergencyLayerRef.current = L.layerGroup().addTo(map);
    riskRingsLayerRef.current = L.layerGroup().addTo(map);
    dispatchRouteLayerRef.current = L.layerGroup().addTo(map);

    // Map click handler for ad-hoc point inspection
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    if (basemapGroupRef.current) {
      applyBasemapTiles(basemap, basemapGroupRef.current);
    }
  }, [basemap]);

  // Handle Region Flying (Global Worldwide Support)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (typeof selectedRegion === 'object' && selectedRegion !== null) {
      map.flyTo([selectedRegion.latitude, selectedRegion.longitude], 12, { duration: 1.5 });
      return;
    }

    if (selectedRegion === 'ALL') {
      map.flyTo([22.0, 15.0], 3, { duration: 1.8 });
    } else if (selectedRegion === 'NORTH_AMERICA') {
      map.flyTo([29.7420, -95.0125], 11, { duration: 1.5 });
    } else if (selectedRegion === 'EUROPE') {
      map.flyTo([51.8850, 4.3860], 12, { duration: 1.5 });
    } else if (selectedRegion === 'MIDDLE_EAST') {
      map.flyTo([25.9080, 51.5280], 12, { duration: 1.5 });
    } else if (selectedRegion === 'SOUTHEAST_ASIA') {
      map.flyTo([1.2728, 103.6825], 13, { duration: 1.5 });
    } else if (selectedRegion === 'EAST_ASIA') {
      map.flyTo([35.4980, 129.3450], 12, { duration: 1.5 });
    } else if (selectedRegion === 'SOUTH_AMERICA') {
      map.flyTo([-23.8820, -46.4250], 12, { duration: 1.5 });
    } else if (selectedRegion === 'AUSTRALIA') {
      map.flyTo([-20.6590, 116.7115], 10, { duration: 1.5 });
    } else if (selectedRegion === 'AFRICA') {
      map.flyTo([-26.5420, 29.1780], 12, { duration: 1.5 });
    } else if (selectedRegion === 'MUMBAI') {
      map.flyTo([19.0142, 72.8987], 13, { duration: 1.5 });
    } else if (selectedRegion === 'JAMNAGAR') {
      map.flyTo([22.3582, 69.8564], 12, { duration: 1.5 });
    } else if (selectedRegion === 'ANKLESHWAR') {
      map.flyTo([21.6241, 73.0125], 13, { duration: 1.5 });
    } else if (selectedRegion === 'VIZAG') {
      map.flyTo([17.6594, 83.2241], 12, { duration: 1.5 });
    }
  }, [selectedRegion]);

  // Handle Selected Event centering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedEvent) return;

    map.flyTo([selectedEvent.latitude, selectedEvent.longitude], 14, {
      duration: 1.2
    });
  }, [selectedEvent]);

  // Render Map Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Hotspots Layer
    if (hotspotsLayerRef.current) {
      hotspotsLayerRef.current.clearLayers();

      if (showHotspots) {
        // Filter events
        const filtered = events.filter((e) => {
          const matchRisk = riskFilter === 'ALL' || e.itriRiskLevel === riskFilter;
          const matchCls = classificationFilter === 'ALL' || e.classification === classificationFilter;
          return matchRisk && matchCls;
        });

        filtered.forEach((evt) => {
          const isSelected = selectedEvent?.id === evt.id;
          const isCritical = evt.itriRiskLevel === 'Critical';
          const isHigh = evt.itriRiskLevel === 'High';

          let color = '#22c55e'; // Low
          let pingColor = 'bg-emerald-500';
          if (isCritical) {
            color = '#ef4444';
            pingColor = 'bg-red-500';
          } else if (isHigh) {
            color = '#f97316';
            pingColor = 'bg-orange-500';
          } else if (evt.itriRiskLevel === 'Moderate') {
            color = '#eab308';
            pingColor = 'bg-amber-500';
          }

          // Custom HTML Marker with radar pulse
          const iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer group">
              ${(isCritical || isSelected) ? `
                <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full ${pingColor} opacity-70"></span>
                <span class="absolute inline-flex h-12 w-12 rounded-full border border-red-500/50 animate-pulse"></span>
              ` : ''}
              <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-950 border-2 ${isSelected ? 'border-white scale-125' : 'border-current'} shadow-lg transition-transform" style="color: ${color}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold text-slate-200 pointer-events-none shadow">
                ${evt.frp.toFixed(0)} MW
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-hotspot-pin',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const marker = L.marker([evt.latitude, evt.longitude], { icon: customIcon });
          marker.on('click', () => {
            onSelectEvent(evt);
          });

          marker.bindTooltip(`
            <div class="font-sans text-xs">
              <div class="font-bold text-slate-100">${evt.classification || 'Thermal Anomaly'}</div>
              <div class="text-slate-300">FRP: <span class="font-mono font-bold text-amber-400">${evt.frp} MW</span> | BT: ${evt.brightnessTemperature} K</div>
              <div class="text-slate-400">ITRI Risk: <span class="font-bold" style="color: ${color}">${evt.itriRiskLevel} (${evt.itriScore}/100)</span></div>
              <div class="text-slate-400 text-[10px] mt-0.5">${evt.satellite} / ${evt.instrument}</div>
            </div>
          `, { className: 'leaflet-tactical-tooltip', direction: 'top', offset: [0, -14] });

          marker.addTo(hotspotsLayerRef.current!);
        });
      }
    }

    // 2. Industrial Sites Layer
    if (industrialLayerRef.current) {
      industrialLayerRef.current.clearLayers();

      if (showIndustrial) {
        industrialSites.forEach((site) => {
          const iconHtml = `
            <div class="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-950 border border-cyan-400/80 shadow-md text-cyan-300 cursor-pointer hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M2 22h20V8l-6 4V8l-6 4V4H2v18zm4-12h2v2H6v-2zm0 4h2v2H6v-2zm0 4h2v2H6v-2zm6-4h2v2h-2v-2zm0 4h2v2h-2v-2zm6 0h2v2h-2v-2z"/>
              </svg>
            </div>
          `;

          const siteIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-industrial-pin',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = L.marker([site.latitude, site.longitude], { icon: siteIcon });
          marker.bindTooltip(`
            <div class="font-sans text-xs">
              <div class="font-bold text-cyan-300">${site.name}</div>
              <div class="text-slate-300">Type: ${site.facilityType}</div>
              <div class="text-red-400 font-semibold">${site.hazmatTier}</div>
            </div>
          `, { className: 'leaflet-tactical-tooltip', direction: 'top' });

          marker.addTo(industrialLayerRef.current!);
        });
      }
    }

    // 3. Emergency Resources Layer (Fire Stations & Hospitals)
    if (emergencyLayerRef.current) {
      emergencyLayerRef.current.clearLayers();

      if (showEmergency) {
        // Fire stations
        fireStations.forEach((fs) => {
          const iconHtml = `
            <div class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-950 border border-blue-400 shadow-md text-blue-300 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 15c-2.76 0-5-2.24-5-5s5-6.5 5-6.5 5 3.74 5 6.5-2.24 5-5 5z"/>
              </svg>
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-fs-pin',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = L.marker([fs.latitude, fs.longitude], { icon });
          marker.bindTooltip(`
            <div class="font-sans text-xs">
              <div class="font-bold text-blue-300">${fs.name}</div>
              <div class="text-slate-300">Capabilities: ${fs.capability.slice(0, 2).join(', ')}</div>
              <div class="text-emerald-400 font-mono">Status: ${fs.availability}</div>
            </div>
          `, { className: 'leaflet-tactical-tooltip', direction: 'top' });

          marker.addTo(emergencyLayerRef.current!);
        });

        // Hospitals
        hospitals.forEach((hosp) => {
          const iconHtml = `
            <div class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950 border border-emerald-400 shadow-md text-emerald-300 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
              </svg>
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-hosp-pin',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = L.marker([hosp.latitude, hosp.longitude], { icon });
          marker.bindTooltip(`
            <div class="font-sans text-xs">
              <div class="font-bold text-emerald-300">${hosp.name}</div>
              <div class="text-slate-300">Burn ICU Beds: ${hosp.burnBedCapacity} (Avail: ${hosp.availableBeds})</div>
            </div>
          `, { className: 'leaflet-tactical-tooltip', direction: 'top' });

          marker.addTo(emergencyLayerRef.current!);
        });

        // Police Stations
        policeStations.forEach((pol) => {
          const iconHtml = `
            <div class="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-950 border border-indigo-400 shadow-md text-indigo-300 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-pol-pin',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = L.marker([pol.latitude, pol.longitude], { icon });
          marker.bindTooltip(`
            <div class="font-sans text-xs">
              <div class="font-bold text-indigo-300">${pol.name}</div>
              <div class="text-slate-300">${pol.division}</div>
              <div class="text-indigo-400 font-mono text-[10px]">Patrols: ${pol.patrolVehicles} | ${pol.specialSquad}</div>
            </div>
          `, { className: 'leaflet-tactical-tooltip', direction: 'top' });

          marker.addTo(emergencyLayerRef.current!);
        });

        // Ambulance Units
        ambulanceUnits.forEach((amb) => {
          const iconHtml = `
            <div class="flex items-center justify-center w-6 h-6 rounded-full bg-amber-950 border border-amber-400 shadow-md text-amber-300 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
              </svg>
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-amb-pin',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = L.marker([amb.latitude, amb.longitude], { icon });
          marker.bindTooltip(`
            <div class="font-sans text-xs">
              <div class="font-bold text-amber-300">${amb.name}</div>
              <div class="text-slate-300">${amb.serviceType}</div>
              <div class="text-emerald-400 font-mono text-[10px]">Crew: ${amb.paramedicCrewCount} Paramedics | ${amb.availability}</div>
            </div>
          `, { className: 'leaflet-tactical-tooltip', direction: 'top' });

          marker.addTo(emergencyLayerRef.current!);
        });
      }
    }

    // 4. Risk Impact Zone Rings around Selected Event
    if (riskRingsLayerRef.current) {
      riskRingsLayerRef.current.clearLayers();

      if (showRiskRings && selectedEvent) {
        const center: L.LatLngTuple = [selectedEvent.latitude, selectedEvent.longitude];

        // 1km Immediate Evacuation Zone (Red)
        L.circle(center, {
          radius: 1000,
          color: '#ef4444',
          weight: 2,
          opacity: 0.8,
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          dashArray: '4, 4'
        }).bindTooltip('<span class="font-mono text-[10px] text-red-400">1km Evacuation Perimeter</span>', { permanent: false }).addTo(riskRingsLayerRef.current!);

        // 3km Toxic Gas / Thermal Buffer Zone (Orange)
        L.circle(center, {
          radius: 3000,
          color: '#f97316',
          weight: 1.5,
          opacity: 0.6,
          fillColor: '#f97316',
          fillOpacity: 0.08,
          dashArray: '6, 6'
        }).bindTooltip('<span class="font-mono text-[10px] text-orange-400">3km Hazardous Plume Buffer</span>', { permanent: false }).addTo(riskRingsLayerRef.current!);

        // 5km Regional DDMA Alert Zone (Yellow)
        L.circle(center, {
          radius: 5000,
          color: '#eab308',
          weight: 1,
          opacity: 0.4,
          fillColor: '#eab308',
          fillOpacity: 0.03
        }).addTo(riskRingsLayerRef.current!);
      }
    }

    // 5. Active Dispatch Route Polyline
    if (dispatchRouteLayerRef.current) {
      dispatchRouteLayerRef.current.clearLayers();

      if (activeDispatch && selectedEvent) {
        // Find responding station coordinates
        const station = fireStations.find(fs => activeDispatch.assignedFireStations.includes(fs.name)) || fireStations[0];
        if (station) {
          const latlngs: L.LatLngTuple[] = [
            [station.latitude, station.longitude],
            [(station.latitude + selectedEvent.latitude) / 2 + 0.003, (station.longitude + selectedEvent.longitude) / 2 - 0.002],
            [selectedEvent.latitude, selectedEvent.longitude]
          ];

          const routeLine = L.polyline(latlngs, {
            color: '#38bdf8',
            weight: 4,
            opacity: 0.9,
            dashArray: '8, 8',
            className: 'animate-pulse'
          });

          routeLine.bindTooltip(`
            <div class="font-mono text-xs text-sky-400 font-bold">
              DISPATCH ROUTE: ${station.name} → INCIDENT (ETA ~${station.fleetSize > 0 ? '7' : '12'}m)
            </div>
          `, { permanent: true, direction: 'center' });

          routeLine.addTo(dispatchRouteLayerRef.current!);
        }
      }
    }
  }, [
    events, 
    industrialSites, 
    fireStations, 
    hospitals, 
    selectedEvent, 
    showHotspots, 
    showIndustrial, 
    showEmergency, 
    showRiskRings, 
    riskFilter, 
    classificationFilter,
    activeDispatch
  ]);

  return (
    <div className="relative w-full h-full min-h-[550px] bg-slate-950 overflow-hidden flex flex-col">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Floating Tactical Map Controls Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-xs sm:max-w-sm">
        {/* Layer Visibility & Basemap Selector */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              GIS Layers & Basemap
            </span>
            <span className="font-mono text-[10px] text-slate-400">EPSG:3857 / WGS84</span>
          </div>

          {/* Basemap switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setBasemap('dark')}
              className={`py-1 rounded font-medium transition-colors ${basemap === 'dark' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Tactical Dark
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`py-1 rounded font-medium transition-colors ${basemap === 'satellite' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Satellite S2
            </button>
            <button
              onClick={() => setBasemap('osm')}
              className={`py-1 rounded font-medium transition-colors ${basemap === 'osm' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              OpenStreet
            </button>
          </div>

          {/* Layer toggles */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors ${
                showHotspots ? 'bg-red-950/40 border-red-500/40 text-red-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                FIRMS Hotspots
              </span>
              {showHotspots ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setShowIndustrial(!showIndustrial)}
              className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors ${
                showIndustrial ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Industrial Sites
              </span>
              {showIndustrial ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setShowEmergency(!showEmergency)}
              className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors ${
                showEmergency ? 'bg-blue-950/40 border-blue-500/40 text-blue-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Fire & Hospitals
              </span>
              {showEmergency ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setShowRiskRings(!showRiskRings)}
              className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors ${
                showRiskRings ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                1-5km Buffers
              </span>
              {showRiskRings ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Risk Filter:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-1.5 py-0.5 text-[11px]"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="Critical">Critical (75-100)</option>
                <option value="High">High (50-74)</option>
                <option value="Moderate">Moderate (25-49)</option>
                <option value="Low">Low (0-24)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Classification:</span>
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] max-w-[150px] truncate"
              >
                <option value="ALL">All Categories</option>
                <option value="Industrial Fire">Industrial Fire</option>
                <option value="Persistent Industrial Thermal Source">Persistent Thermal</option>
                <option value="Gas Flare">Gas Flare</option>
                <option value="Agricultural Burning">Agri Burning</option>
                <option value="Wildfire">Wildfire</option>
                <option value="Urban / Residential Fire">Urban Fire</option>
                <option value="Mining / Extraction Thermal Event">Mining / Extraction</option>
                <option value="Other / Unknown Thermal Anomaly">Other / Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Simulation Status Alert Banner */}
        {activeDispatch && (
          <div className="bg-sky-950/90 border border-sky-500/50 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs text-sky-200 animate-pulse">
            <div className="flex items-center gap-2 font-bold text-sky-300">
              <Navigation2 className="w-4 h-4 text-sky-400 animate-spin" />
              SIMULATED DISPATCH ACTIVE
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              Incident {activeDispatch.eventId}: Units rolling from {activeDispatch.assignedFireStations[0]}. Evacuation buffer: {activeDispatch.evacuationRadiusMeters}m.
            </div>
          </div>
        )}
      </div>

      {/* Map Legend on Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl px-3 py-2 shadow-2xl text-[11px] hidden sm:flex items-center gap-4 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30"></span>
          <span>Critical Fire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Moderate / Flare</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Industrial Site</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
          <span>Fire Station</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Burn ICU Hospital</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
          <span>Police Cordon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>ALS Ambulance</span>
        </div>
      </div>
    </div>
  );
};
