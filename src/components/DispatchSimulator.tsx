import React, { useState, useEffect } from 'react';
import { ThermalEvent, DispatchSimulation } from '../types.ts';
import { 
  Truck, 
  Radio, 
  ShieldAlert, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Users, 
  MapPin, 
  Flame,
  AlertCircle
} from 'lucide-react';

interface DispatchSimulatorProps {
  event: ThermalEvent;
  dispatch: DispatchSimulation | null;
  onClose: () => void;
  onCancelDispatch: () => void;
}

export const DispatchSimulator: React.FC<DispatchSimulatorProps> = ({
  event,
  dispatch,
  onClose,
  onCancelDispatch
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!dispatch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40 animate-pulse">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Emergency Response Dispatch Simulator</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/40">
                  UNITS ROLLING
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">Dispatch ID: {dispatch.dispatchId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Incident Telemetry Banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-400">Target Hotspot:</div>
              <div className="font-bold text-white text-sm">{event.classification}</div>
              <div className="font-mono text-[11px] text-cyan-400 mt-0.5">
                {event.latitude.toFixed(4)}°N, {event.longitude.toFixed(4)}°E (FRP {event.frp} MW)
              </div>
            </div>

            <div className="text-right">
              <div className="text-slate-400">Elapsed Since Alert:</div>
              <div className="font-mono font-extrabold text-amber-400 text-base">
                +{Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">Telemetry Connected</div>
            </div>
          </div>

          {/* Commander & Containment Perimeter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Assigned Incident Commander</span>
              <span className="font-bold text-slate-200 mt-0.5 block">{dispatch.incidentCommander}</span>
              <span className="text-[10px] text-slate-500">ERSS Special Industrial Fire Wing</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Recommended Evacuation Buffer</span>
              <span className="font-bold text-red-400 mt-0.5 block font-mono">{dispatch.evacuationRadiusMeters} meters</span>
              <span className="text-[10px] text-slate-500">Tier-1 Industrial Hazmat Protocol</span>
            </div>
          </div>

          {/* Units In Motion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                Deployed First-Response Fleet ({dispatch.unitsDeployed.length} Units)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Live GPS Polling</span>
            </div>

            <div className="space-y-2">
              {dispatch.unitsDeployed.map((unit) => {
                const remainingMinutes = Math.max(1, unit.etaMinutes - Math.floor(secondsElapsed / 30));
                return (
                  <div key={unit.unitId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          {unit.unitId}
                        </span>
                        <span className="font-semibold text-white">{unit.unitType}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Home Station: <span className="text-slate-300">{unit.stationName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        {unit.status}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ETA ~{remainingMinutes} mins
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Authorities Broadcast confirmation */}
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-start gap-2.5 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Emergency Alert Broadcast</span>
              <p className="text-emerald-400/80 mt-0.5">
                Automated advisory dispatched to District Disaster Management Authority (DDMA), State Fire Control Room, and Pollution Control Board.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onCancelDispatch}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            End Simulation
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Monitor on Tactical Map
          </button>
        </div>
      </div>
    </div>
  );
};
