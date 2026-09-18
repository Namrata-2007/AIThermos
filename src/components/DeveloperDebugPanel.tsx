import React, { useState } from 'react';
import { TargetRegion, ThermalEvent } from '../types.ts';
import { 
  Bug, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Flame, 
  Radio, 
  ShieldCheck, 
  AlertTriangle, 
  Layers,
  Cpu,
  RefreshCw,
  ExternalLink,
  Truck,
  CheckCircle2,
  XCircle,
  Play
} from 'lucide-react';
import { checkEmergencyConfirmation } from '../services/emergencyCallingService.ts';

interface DeveloperDebugPanelProps {
  selectedRegion: TargetRegion;
  totalFirmsRecords: number;
  filteredRecordsCount: number;
  selectedHotspot: ThermalEvent | null;
  operationalMode: 'DEMO' | 'LIVE';
  dispatchMode?: 'TEST' | 'LIVE';
  isStaleDetected: boolean;
  onRefreshTelemetry?: () => void;
}

export const DeveloperDebugPanel: React.FC<DeveloperDebugPanelProps> = ({
  selectedRegion,
  totalFirmsRecords,
  filteredRecordsCount,
  selectedHotspot,
  operationalMode,
  dispatchMode = 'TEST',
  isStaleDetected,
  onRefreshTelemetry
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [testSummary, setTestSummary] = useState<string | null>(null);

  const emergencyCheck = checkEmergencyConfirmation(selectedHotspot);

  const handleRunVerificationSuite = async () => {
    setRunningTests(true);
    setTestSummary(null);
    try {
      const res = await fetch('/api/emergency/test-runner', { method: 'POST' });
      const data = await res.json();
      if (data.results) {
        setTestResults(data.results);
        setTestSummary(`${data.summary.passed}/${data.summary.total} Passed in ${data.summary.durationMs}ms`);
      }
    } catch (e) {
      setTestSummary('Test execution failed to connect.');
    } finally {
      setRunningTests(false);
    }
  };

  return (
    <div 
      id="thermos-dev-debug-panel"
      className="fixed bottom-4 left-4 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-md text-xs font-mono transition-all duration-200"
    >
      {/* Panel Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 cursor-pointer select-none rounded-t-xl hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <Bug className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200 tracking-wide text-[11px] uppercase">
            THERMOS Developer Debug HUD
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isStaleDetected && (
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/40 animate-pulse">
              STALE
            </span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {operationalMode}
          </span>
          <button className="text-slate-400 hover:text-white">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Stale Data Warning Banner */}
          {isStaleDetected && (
            <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-red-300">⚠️ Stale data detected!</strong>
                <span>Hotspot telemetry did not update for the selected region. Check coordinate filters.</span>
              </div>
            </div>
          )}

          {/* 1. Selected Region (Single Source of Truth) */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <MapPin className="w-3 h-3 text-cyan-400" />
                Selected Region (SSOT)
              </span>
              <span className="text-[10px] text-cyan-400 font-bold">{selectedRegion.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Name:</span>
                <span className="text-slate-200 truncate block font-sans font-medium">{selectedRegion.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Country:</span>
                <span className="text-slate-200 block">{selectedRegion.country}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Site:</span>
                <span className="text-slate-200 truncate block font-sans font-medium" title={selectedRegion.industrialSite}>
                  {selectedRegion.industrialSite}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Radius:</span>
                <span className="text-cyan-300 font-bold">{selectedRegion.radiusKm} km</span>
              </div>
              <div className="col-span-2 pt-0.5">
                <span className="text-slate-500 block text-[10px]">Target Coordinates:</span>
                <span className="text-amber-300">
                  {selectedRegion.latitude.toFixed(4)}°N, {selectedRegion.longitude.toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>

          {/* 2. FIRMS Pipeline Ingestion Stats */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Layers className="w-3 h-3 text-blue-400" />
                FIRMS Telemetry Ingestion
              </span>
              {onRefreshTelemetry && (
                <button 
                  onClick={onRefreshTelemetry}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Fetch
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">FIRMS Ingested:</span>
                <span className="text-lg font-bold text-slate-200">{totalFirmsRecords}</span>
                <span className="text-[9px] text-slate-500 block">Total Database</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Filtered ({selectedRegion.radiusKm}km):</span>
                <span className={`text-lg font-bold ${filteredRecordsCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {filteredRecordsCount}
                </span>
                <span className="text-[9px] text-slate-500 block">Corridor Hotspots</span>
              </div>
            </div>
          </div>

          {/* 3. Selected Hotspot Telemetry */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Flame className="w-3 h-3 text-red-400" />
                Selected Hotspot Telemetry
              </span>
              <span className="text-[10px] text-slate-400">
                {selectedHotspot ? selectedHotspot.id : 'None'}
              </span>
            </div>

            {selectedHotspot ? (
              <div className="space-y-1.5 text-[11px]">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Coordinates:</span>
                    <span className="text-cyan-300 font-bold">
                      {selectedHotspot.latitude.toFixed(4)}°, {selectedHotspot.longitude.toFixed(4)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Satellite:</span>
                    <span className="text-slate-200">{selectedHotspot.satellite} ({selectedHotspot.instrument})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">FRP:</span>
                    <span className="text-red-400 font-bold">{selectedHotspot.frp.toFixed(1)} MW</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Brightness Temp:</span>
                    <span className="text-amber-300 font-bold">{selectedHotspot.brightnessTemperature.toFixed(1)} K</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Confidence:</span>
                    <span className="text-emerald-400 font-bold">{selectedHotspot.confidence}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Overpass Time:</span>
                    <span className="text-slate-300">{selectedHotspot.acquisitionTime} UTC</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">Classification:</span>
                  <span className="text-slate-200 font-sans font-medium">{selectedHotspot.classification}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-slate-500 text-[11px] italic">
                No hotspot selected in this corridor.
              </div>
            )}
          </div>

          {/* 4. Emergency Gate Check (Strict 4-Criteria Validation) */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                Emergency Confirmation Check
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                emergencyCheck.isConfirmed 
                  ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {emergencyCheck.isConfirmed ? 'ACTUAL FIRE' : 'MONITORING'}
              </span>
            </div>

            <div className="text-[10px] space-y-1 text-slate-400">
              <div className="flex items-center justify-between">
                <span>1. Risk &gt; 85:</span>
                <span className={(selectedHotspot?.itriScore ?? 0) > 85 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {selectedHotspot?.itriScore ?? 0} / 100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. High Anomaly (&gt;95MW/360K):</span>
                <span className={((selectedHotspot?.frp ?? 0) >= 95 || (selectedHotspot?.brightnessTemperature ?? 0) >= 360) ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {selectedHotspot?.frp.toFixed(1) ?? 0} MW ({selectedHotspot?.brightnessTemperature.toFixed(0) ?? 0}K)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Industrial Site &le; 2.0km:</span>
                <span className={(selectedHotspot?.nearestIndustrialSite?.distanceKm ?? 999) <= 2.0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {selectedHotspot?.nearestIndustrialSite?.distanceKm !== undefined ? `${selectedHotspot.nearestIndustrialSite.distanceKm.toFixed(2)} km` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>4. Multiple Passes (&ge;2):</span>
                <span className={((selectedHotspot?.eventsInLast24h ?? 0) >= 2 || (selectedHotspot?.persistenceHours ?? 0) >= 2) ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {selectedHotspot?.eventsInLast24h ?? 1} passes ({selectedHotspot?.persistenceHours ?? 0}h)
                </span>
              </div>
            </div>
          </div>

          {/* 5. Emergency Dispatch Architecture Telemetry & 10-Point Test Suite */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Truck className="w-3 h-3 text-red-400" />
                Dispatch Architecture Telemetry
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                dispatchMode === 'TEST'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-red-950 text-red-300 border-red-500/40'
              }`}>
                {dispatchMode === 'TEST' ? 'MOCK_PROVIDER (TEST)' : 'LIVE_PROVIDER'}
              </span>
            </div>

            <div className="text-[10px] space-y-1 text-slate-400">
              <div className="flex items-center justify-between">
                <span>Dispatch Mode:</span>
                <span className={dispatchMode === 'TEST' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {dispatchMode === 'TEST' ? 'TEST (Simulated Only)' : 'LIVE (Strict Guardrails)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Location Guardrail:</span>
                <span className="text-emerald-400 font-bold">110m Enforced</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Civic Call Guard:</span>
                <span className="text-emerald-400 font-bold">Never Contacts 101/112</span>
              </div>
            </div>

            {/* Run 10 Automated Verification Tests */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={handleRunVerificationSuite}
                disabled={runningTests}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Play className={`w-3 h-3 text-cyan-400 ${runningTests ? 'animate-spin' : ''}`} />
                <span>{runningTests ? 'Running 10 Automated Tests...' : 'Run 10 Dispatch Verification Tests'}</span>
              </button>

              {testSummary && (
                <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-200">
                    <span>Suite Result:</span>
                    <span className="text-emerald-400">{testSummary}</span>
                  </div>
                  {testResults && (
                    <div className="space-y-1 max-h-32 overflow-y-auto pt-1 border-t border-slate-800">
                      {testResults.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-400 truncate max-w-[200px]" title={t.name}>{t.name}</span>
                          <span className={t.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {t.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
