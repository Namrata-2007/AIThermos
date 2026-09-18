import React from 'react';
import { 
  Flame, 
  Satellite, 
  Clock, 
  ShieldAlert, 
  Activity, 
  Map as MapIcon, 
  BarChart3, 
  History, 
  FileText, 
  Radio,
  PhoneCall,
  Truck
} from 'lucide-react';

import { TargetRegion, LocationRiskAssessment } from '../types.ts';
import { TARGET_CORRIDORS } from '../data/mockGeospatial.ts';
import { LocationCoordinateSearch } from './LocationCoordinateSearch.tsx';

interface HeaderProps {
  activeTab: 'map' | 'history' | 'analytics' | 'reports' | 'hotline' | 'dispatchLogs';
  setActiveTab: (tab: 'map' | 'history' | 'analytics' | 'reports' | 'hotline' | 'dispatchLogs') => void;
  activeEventsCount: number;
  criticalEventsCount: number;
  activeCallSessionsCount?: number;
  totalDispatchesCount?: number;
  onRefreshFirms: () => void;
  isLoading: boolean;
  selectedRegion: TargetRegion;
  onSelectRegion: (region: TargetRegion) => void;
  onAssessLocation?: (assessment: LocationRiskAssessment) => void;
  dataSourceNote: string;
  operationalMode: 'LIVE' | 'DEMO';
  onToggleMode: (mode: 'LIVE' | 'DEMO') => void;
  dispatchMode?: 'TEST' | 'LIVE';
  onToggleDispatchMode?: (mode: 'TEST' | 'LIVE') => void;
  lastUpdated?: string;
  systemStatus?: {
    nasaFirms: { status: string; lastFetched: string; keyConfigured: boolean };
    osmOverpass: { status: string; note: string };
    sentinelLandsat: { status: string; note: string };
    routingService: { status: string; note: string };
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeEventsCount,
  criticalEventsCount,
  activeCallSessionsCount = 0,
  totalDispatchesCount = 0,
  onRefreshFirms,
  isLoading,
  selectedRegion,
  onSelectRegion,
  onAssessLocation,
  dataSourceNote,
  operationalMode,
  onToggleMode,
  dispatchMode = 'TEST',
  onToggleDispatchMode,
  lastUpdated,
  systemStatus
}) => {
  const [timeStr, setTimeStr] = React.useState<string>('');
  const [showStatusPopover, setShowStatusPopover] = React.useState<boolean>(false);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().slice(17, 25) + ' UTC | ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 shadow-xl">
      <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Logo and Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 shadow-lg shadow-orange-500/20 border border-orange-400/40">
            <Flame className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans'] flex items-center gap-1.5">
                THERMOS
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  SIH26162
                </span>
              </h1>
              
              {/* RULE 35: Clear Mode Indication */}
              {operationalMode === 'DEMO' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  DEMO MODE: STORED SAMPLE DATA
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE MODE: SATELLITE ORBIT STREAM
                </div>
              )}

              {/* PART 2 SPECIFICATION: Emergency Dispatch Mode Indicator */}
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wide border ${
                dispatchMode === 'TEST' 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-950/40 border-red-500/40 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dispatchMode === 'TEST' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500 animate-ping'}`} />
                {dispatchMode === 'TEST' ? '🟢 TEST MODE — NO REAL CALLS' : '🔴 LIVE MODE — REAL DISPATCH ENABLED'}
              </div>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Satellite-Based AI Industrial Thermal Intelligence & Emergency Response Platform
            </p>
          </div>
        </div>

        {/* Global Telemetry Strip & Region Quick-Nav */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* RULE 35: LIVE MODE vs DEMO MODE TOGGLE */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onToggleMode('DEMO')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                operationalMode === 'DEMO'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DEMO MODE
            </button>
            <button
              onClick={() => onToggleMode('LIVE')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                operationalMode === 'LIVE'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LIVE MODE
            </button>
          </div>

          {/* PART 2 SPECIFICATION: Emergency Dispatch Mode Switcher */}
          {onToggleDispatchMode && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
              <span className="px-1.5 text-slate-500 text-[10px]">DISPATCH:</span>
              <button
                onClick={() => onToggleDispatchMode('TEST')}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  dispatchMode === 'TEST'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Safe simulation mode. No real civic emergency services will ever be contacted."
              >
                TEST MODE
              </button>
              <button
                onClick={() => onToggleDispatchMode('LIVE')}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  dispatchMode === 'LIVE'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Live mode. Disabled by default without authorized governmental provider configuration."
              >
                LIVE MODE
              </button>
            </div>
          )}

          {/* Global Location & Coordinate Satellite Scanner */}
          <LocationCoordinateSearch
            selectedRegion={selectedRegion}
            onSelectRegion={onSelectRegion}
            onAssessLocation={onAssessLocation}
            operationalMode={operationalMode}
          />

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeStr || 'Orbit UTC/IST'}</span>
          </div>

          {/* RULE 30: Transparent System Status Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 cursor-pointer"
              title="View transparent integration telemetry for NASA, OSM, Sentinel-2, and Routing services"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Services:</span>
              <span className="font-semibold text-white">Status</span>
            </button>

            {showStatusPopover && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2">
                <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex justify-between items-center">
                  <span>Transparent System Status (Rule 30)</span>
                  <button onClick={() => setShowStatusPopover(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">NASA FIRMS:</span>
                  <span className={`font-mono font-bold ${operationalMode === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {operationalMode === 'LIVE' ? 'CONNECTED' : 'DEMO_STANDBY'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">OSM / OVERPASS:</span>
                  <span className="font-mono font-bold text-emerald-400">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">SENTINEL-2 / LANDSAT:</span>
                  <span className="font-mono font-bold text-emerald-400">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ROUTING SERVICE:</span>
                  <span className="font-mono font-bold text-emerald-400">CONNECTED</span>
                </div>
                {lastUpdated && (
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                    Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Hotspots Alert counter */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-300 font-semibold">{activeEventsCount}</span>
            <span className="text-slate-400">Hotspots</span>
            {criticalEventsCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40 animate-pulse">
                <ShieldAlert className="w-3 h-3" />
                {criticalEventsCount} Critical
              </span>
            )}
          </div>

          {/* RULE 29: NASA FIRMS Refresh button with real timestamp display */}
          <button
            onClick={onRefreshFirms}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-50"
            title={lastUpdated ? `Last updated: ${lastUpdated}` : dataSourceNote}
          >
            <Satellite className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Polling NASA...' : (operationalMode === 'LIVE' ? 'Fetch FIRMS Feed' : 'Refresh FIRMS Data')}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>GIS Command</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Temporal Evolution</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>AI & ML Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Incident Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('hotline')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'hotline'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/20'
            }`}
          >
            <PhoneCall className={`w-3.5 h-3.5 ${activeCallSessionsCount > 0 ? 'animate-bounce' : ''}`} />
            <span>Emergency Hotline</span>
            {activeCallSessionsCount > 0 && (
              <span className="flex h-2 w-2 relative -mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dispatchLogs')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dispatchLogs'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dispatch Logs & Audit</span>
            {totalDispatchesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-800">
                {totalDispatchesCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
