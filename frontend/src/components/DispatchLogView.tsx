import React, { useState, useEffect } from 'react';
import { 
  DispatchRecord, 
  DispatchAuditEvent, 
  DispatchMode, 
  EmergencyServiceType 
} from '../types.ts';
import { 
  fetchAllDispatches, 
  fetchDispatchDetails, 
  retryEmergencyDispatch, 
  cancelEmergencyDispatch,
  fetchEmergencyHealth
} from '../services/emergencyDispatchEngine.ts';
import { 
  Truck, 
  RotateCcw, 
  XCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Radio, 
  Filter, 
  RefreshCw, 
  Flame, 
  HeartPulse, 
  ShieldAlert,
  ChevronRight,
  History
} from 'lucide-react';

interface DispatchLogViewProps {
  initialSelectedDispatchId?: string;
  onClose?: () => void;
  onFocusCoordinates?: (lat: number, lon: number) => void;
}

export const DispatchLogView: React.FC<DispatchLogViewProps> = ({
  initialSelectedDispatchId,
  onClose,
  onFocusCoordinates
}) => {
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(initialSelectedDispatchId || null);
  const [auditEvents, setAuditEvents] = useState<DispatchAuditEvent[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAllDispatches({
        mode: filterMode,
        status: filterStatus
      });
      setDispatches(res.dispatches);
      if (!activeDispatchId && res.dispatches.length > 0) {
        setActiveDispatchId(res.dispatches[0].dispatchId);
      }
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMode, filterStatus]);

  // Load audit trail when active dispatch changes
  useEffect(() => {
    if (!activeDispatchId) return;
    let isMounted = true;
    setLoadingAudit(true);

    fetchDispatchDetails(activeDispatchId)
      .then((data) => {
        if (isMounted) {
          setAuditEvents(data.auditEvents);
          setLoadingAudit(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load audit events:', err);
        if (isMounted) setLoadingAudit(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeDispatchId]);

  const handleRetry = async (dispatchId: string) => {
    try {
      setActionMessage(`Retrying failed services for ${dispatchId}...`);
      const updated = await retryEmergencyDispatch(dispatchId);
      setDispatches((prev) => prev.map((d) => d.dispatchId === updated.dispatchId ? updated : d));
      setActionMessage(`Retry successful for ${dispatchId}. Status: ${updated.status}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Retry failed: ${err.message}`);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleCancel = async (dispatchId: string) => {
    try {
      setActionMessage(`Cancelling dispatch ${dispatchId}...`);
      const updated = await cancelEmergencyDispatch(dispatchId, 'Manual operator cancellation');
      setDispatches((prev) => prev.map((d) => d.dispatchId === updated.dispatchId ? updated : d));
      setActionMessage(`Dispatch ${dispatchId} cancelled.`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Cancellation failed: ${err.message}`);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const selectedDispatch = dispatches.find((d) => d.dispatchId === activeDispatchId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[88vh]">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
            <Truck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans']">
                EMERGENCY DISPATCH LOGS & AUDIT TRAIL
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                ACTIVE MONITOR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Immutable historical records of all simulated and authorized emergency transmissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-mono">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
          </span>

          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            {['ALL', 'TEST', 'LIVE'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  filterMode === mode
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            {['ALL', 'SIMULATED', 'COMPLETED', 'FAILED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  filterStatus === st
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Showing <span className="text-white font-bold">{dispatches.length}</span> recorded dispatches
        </div>
      </div>

      {/* Action Notification Strip */}
      {actionMessage && (
        <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-500/40 text-amber-200 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Split View: Left List, Right Audit Detail */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left: Dispatches List (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-900/50">
          {dispatches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p>No dispatch records found matching criteria.</p>
            </div>
          ) : (
            dispatches.map((d) => {
              const isSelected = d.dispatchId === activeDispatchId;
              const isSimulated = d.status === 'SIMULATED';
              const isFailed = d.status === 'FAILED';

              return (
                <div
                  key={d.dispatchId}
                  onClick={() => setActiveDispatchId(d.dispatchId)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/30'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-cyan-300">
                        {d.dispatchId}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        d.mode === 'TEST'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-red-950 text-red-300 border border-red-800/60'
                      }`}>
                        {d.mode}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      isSimulated
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : (isFailed
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700')
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs truncate">
                    {d.locationName}
                  </div>

                  <div className="text-[11px] font-mono text-amber-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    {d.latitude.toFixed(4)}°N, {d.longitude.toFixed(4)}°E
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {d.services.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                    <span>{d.responseTimeMs ? `${d.responseTimeMs}ms` : '1.1s'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Dispatch Audit Trail & Operations (7 cols) */}
        <div className="lg:col-span-7 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950/40">
          {selectedDispatch ? (
            <div className="space-y-4 text-xs">
              
              {/* Header Info */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px]">Dispatch Reference:</span>
                    <h3 className="font-mono text-base font-extrabold text-white">
                      {selectedDispatch.dispatchId}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Incident ID:</span>
                    <div className="font-mono text-cyan-300 font-bold">
                      {selectedDispatch.incidentId}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-slate-300 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500">Location:</span> {selectedDispatch.locationName}
                  </div>
                  <div>
                    <span className="text-slate-500">Coordinates:</span> {selectedDispatch.latitude.toFixed(4)}°N, {selectedDispatch.longitude.toFixed(4)}°E
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span> {new Date(selectedDispatch.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-slate-500">Provider:</span> {selectedDispatch.provider} ({selectedDispatch.mode})
                  </div>
                </div>

                {onFocusCoordinates && (
                  <button
                    onClick={() => onFocusCoordinates(selectedDispatch.latitude, selectedDispatch.longitude)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Fly to Coordinates on GIS Map</span>
                  </button>
                )}
              </div>

              {/* Service By Service Telemetry */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider font-mono">
                  Dispatched Emergency Services
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedDispatch.services.map((service) => {
                    const result = selectedDispatch.serviceResults[service];
                    const isOk = result && (result.status === 'SIMULATED' || result.status === 'COMPLETED' || result.status === 'RETRY_SUCCESS');

                    return (
                      <div key={service} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1">
                            {service === 'FIRE' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                            {service === 'MEDICAL' && <HeartPulse className="w-3.5 h-3.5 text-rose-400" />}
                            {service === 'POLICE' && <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />}
                            {service}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                            isOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {result?.status || 'PENDING'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          Req: {result?.providerRequestId || 'None'}
                        </div>
                        {result?.errorMessage && (
                          <div className="text-[10px] text-red-400 font-mono">
                            {result.errorMessage}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Strip */}
              <div className="flex items-center gap-2 pt-1">
                {selectedDispatch.status === 'FAILED' && (
                  <button
                    onClick={() => handleRetry(selectedDispatch.dispatchId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Failed Services</span>
                  </button>
                )}

                {selectedDispatch.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancel(selectedDispatch.dispatchId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-200 font-bold text-xs border border-slate-700 hover:border-red-600 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Dispatch</span>
                  </button>
                )}
              </div>

              {/* Immutable Audit Trail List (PART 13) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs font-mono">
                      IMMUTABLE AUDIT TRAIL
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {auditEvents.length} Events Recorded
                  </span>
                </div>

                {loadingAudit ? (
                  <div className="py-4 text-center text-slate-500 text-xs font-mono animate-pulse">
                    Loading audit trail from secure ledger...
                  </div>
                ) : auditEvents.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs font-mono">
                    No audit records logged yet.
                  </div>
                ) : (
                  <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {auditEvents.map((evt, idx) => (
                      <div key={evt.eventId || idx} className="relative pl-7 text-xs">
                        <div className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500 -translate-x-1 border border-slate-950"></div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-mono text-cyan-300 text-[11px]">
                            {evt.event} {evt.service ? `(${evt.service})` : ''}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Operator: {evt.userId} | Coordinates: {evt.coordinates.lat.toFixed(4)}, {evt.coordinates.lon.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select a dispatch from the left panel to inspect full telemetry and immutable audit trail.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
