import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Satellite, 
  Compass, 
  ChevronDown, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Sliders
} from 'lucide-react';
import { TargetRegion, LocationRiskAssessment } from '../types.ts';
import { TARGET_CORRIDORS } from '../data/mockGeospatial.ts';

interface GeocodeResult {
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  country: string;
  type?: string;
}

interface LocationCoordinateSearchProps {
  selectedRegion: TargetRegion;
  onSelectRegion: (region: TargetRegion) => void;
  onAssessLocation?: (assessment: LocationRiskAssessment) => void;
  operationalMode: 'LIVE' | 'DEMO';
}

export const LocationCoordinateSearch: React.FC<LocationCoordinateSearchProps> = ({
  selectedRegion,
  onSelectRegion,
  onAssessLocation,
  operationalMode
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isManualCoordMode, setIsManualCoordMode] = useState(false);

  // Manual Coordinate inputs
  const [manualLat, setManualLat] = useState(selectedRegion.latitude.toString());
  const [manualLon, setManualLon] = useState(selectedRegion.longitude.toString());
  const [manualRadius, setManualRadius] = useState((selectedRegion.radiusKm || 25).toString());
  const [manualName, setManualName] = useState(selectedRegion.name || 'Custom Target Location');
  const [coordError, setCoordError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update manual fields when selectedRegion changes
  useEffect(() => {
    setManualLat(selectedRegion.latitude.toFixed(4));
    setManualLon(selectedRegion.longitude.toFixed(4));
    setManualRadius((selectedRegion.radiusKm || 25).toString());
    setManualName(selectedRegion.name);
  }, [selectedRegion]);

  // Debounced search for place names or coordinates
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setCoordError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/location/geocode?query=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Geocode request failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectResult = async (item: GeocodeResult) => {
    setShowDropdown(false);
    setQuery('');

    const newRegion: TargetRegion = {
      id: `CUSTOM_${Date.now()}`,
      name: item.shortName || item.name,
      country: item.country || 'Global',
      industrialSite: `${item.shortName} Area`,
      latitude: item.latitude,
      longitude: item.longitude,
      radiusKm: parseInt(manualRadius, 10) || 25,
      isCustom: true
    };

    onSelectRegion(newRegion);
    await checkSatelliteForCoords(item.latitude, item.longitude, parseInt(manualRadius, 10) || 25, item.shortName);
  };

  const checkSatelliteForCoords = async (lat: number, lon: number, radiusKm: number, name: string) => {
    try {
      const res = await fetch(
        `/api/satellite/check-location?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}&name=${encodeURIComponent(name)}&mode=${operationalMode}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.assessment && onAssessLocation) {
          onAssessLocation(data.assessment);
        }
      }
    } catch (err) {
      console.error('Failed to query satellite assessment:', err);
    }
  };

  const handleApplyManualCoordinates = async () => {
    setCoordError(null);
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    const radius = parseFloat(manualRadius) || 25;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setCoordError('Latitude must be a valid number between -90 and 90');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setCoordError('Longitude must be a valid number between -180 and 180');
      return;
    }

    const locName = manualName.trim() || `Coordinates [${lat.toFixed(3)}, ${lon.toFixed(3)}]`;

    const customRegion: TargetRegion = {
      id: `COORD_${Date.now()}`,
      name: locName,
      country: 'Custom Geographic Point',
      industrialSite: `${locName} Sector`,
      latitude: lat,
      longitude: lon,
      radiusKm: radius,
      isCustom: true
    };

    setIsManualCoordMode(false);
    onSelectRegion(customRegion);
    await checkSatelliteForCoords(lat, lon, radius, locName);
  };

  // Quick HTML5 Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setCoordError('Geolocation is not supported by your browser');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsSearching(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setManualLat(lat.toFixed(4));
        setManualLon(lon.toFixed(4));
        setManualName('My Current Location');

        const geoRegion: TargetRegion = {
          id: `GPS_${Date.now()}`,
          name: 'My Current Location',
          country: 'Local Device Position',
          industrialSite: 'Local Proximity Area',
          latitude: lat,
          longitude: lon,
          radiusKm: 25,
          isCustom: true
        };

        onSelectRegion(geoRegion);
        await checkSatelliteForCoords(lat, lon, 25, 'My Current Location');
      },
      (err) => {
        setIsSearching(false);
        setCoordError(`Unable to retrieve location: ${err.message}`);
      }
    );
  };

  return (
    <div ref={searchContainerRef} className="relative flex items-center gap-1.5 z-30">
      {/* Main Search Input / Selector Container */}
      <div className="flex items-center bg-slate-950/90 border border-slate-700/80 rounded-lg p-1 shadow-sm">
        {/* Search Icon / Indicator */}
        <div className="pl-2 pr-1.5 text-cyan-400">
          <Satellite className="w-3.5 h-3.5" />
        </div>

        {/* Text Input for place name or coordinate query */}
        <input
          id="global-location-search-input"
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          placeholder={`${selectedRegion.name} (Type city, region or lat, lon)...`}
          className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-[180px] sm:w-[260px] md:w-[320px] px-1 py-1 font-medium"
        />

        {/* Clear query button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowDropdown(false);
            }}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Coordinate Modal / Popover Toggle */}
        <button
          onClick={() => setIsManualCoordMode(!isManualCoordMode)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
            isManualCoordMode || selectedRegion.isCustom
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Enter exact latitude and longitude coordinates"
        >
          <Compass className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Coordinates</span>
        </button>

        {/* Current Location GPS Button */}
        <button
          onClick={handleUseCurrentLocation}
          className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
          title="Use my device's current coordinates"
        >
          <Navigation className="w-3 h-3" />
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute left-0 top-full mt-1.5 w-[360px] sm:w-[440px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800 flex items-center justify-between">
            <span>Select Location or Coordinates</span>
            <span className="text-cyan-400 font-mono">{results.length} found</span>
          </div>

          <div className="mt-1 space-y-1">
            {results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(item)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-start gap-2.5 cursor-pointer text-xs group"
              >
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate flex items-center gap-1.5">
                    <span>{item.shortName || item.name}</span>
                    {item.country && (
                      <span className="text-[10px] text-slate-400 font-normal">({item.country})</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.name}</p>
                  <p className="text-[10px] text-cyan-400/80 font-mono mt-0.5">
                    Lat: {item.latitude.toFixed(4)}°N, Lon: {item.longitude.toFixed(4)}°E
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Coordinate Entry Popover */}
      {isManualCoordMode && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl p-4 z-50 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Target Coordinates Scanner</span>
            </div>
            <button 
              onClick={() => setIsManualCoordMode(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
            Enter any global latitude and longitude to verify satellite active fire radiometry and compute truthful occurrence risk.
          </p>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Location Name / Sector Identifier:
              </label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Athens Perimeter, Alberta Sector, Custom Site"
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Latitude (-90 to +90):
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="e.g. 37.9838"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Longitude (-180 to +180):
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  placeholder="e.g. 23.7275"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Search Radius (km):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={manualRadius}
                  onChange={(e) => setManualRadius(e.target.value)}
                  className="flex-1 accent-cyan-500 cursor-pointer"
                />
                <span className="font-mono text-cyan-300 font-bold w-12 text-right">
                  {manualRadius} km
                </span>
              </div>
            </div>

            {coordError && (
              <div className="p-2 rounded bg-red-950/60 border border-red-800 text-red-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{coordError}</span>
              </div>
            )}

            {/* Quick Demo Corridors Presets */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">
                Quick Industrial Corridor Presets:
              </span>
              <div className="flex flex-wrap gap-1">
                {TARGET_CORRIDORS.slice(0, 5).map((corridor) => (
                  <button
                    key={corridor.id}
                    onClick={() => {
                      setManualLat(corridor.latitude.toString());
                      setManualLon(corridor.longitude.toString());
                      setManualName(corridor.name);
                      setManualRadius((corridor.radiusKm || 25).toString());
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition-colors"
                  >
                    {corridor.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsManualCoordMode(false)}
                className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyManualCoordinates}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Satellite className="w-3.5 h-3.5" />
                Scan Satellite Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
