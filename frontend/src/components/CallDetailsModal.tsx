import React, { useState } from 'react';
import { CallLog } from '../types.ts';
import { 
  PhoneCall, 
  X, 
  Clock, 
  MapPin, 
  Flame, 
  ShieldAlert, 
  HeartPulse, 
  Truck, 
  AlertTriangle, 
  Volume2, 
  RotateCcw,
  CheckCircle2,
  FileText,
  Loader2
} from 'lucide-react';

interface CallDetailsModalProps {
  call: CallLog;
  onClose: () => void;
  onRetryCall?: (callId: string) => void;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({
  call,
  onClose,
  onRetryCall
}) => {
  const [retrying, setRetrying] = useState<boolean>(false);

  const handleRetry = async () => {
    if (!onRetryCall) return;
    setRetrying(true);
    try {
      await onRetryCall(call.callId);
      onClose();
    } finally {
      setRetrying(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.includes('FIRE')) return <Flame className="w-5 h-5 text-red-400" />;
    if (role.includes('POLICE')) return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
    if (role.includes('HOSPITAL')) return <HeartPulse className="w-5 h-5 text-emerald-400" />;
    if (role.includes('AMBULANCE')) return <Truck className="w-5 h-5 text-amber-400" />;
    return <AlertTriangle className="w-5 h-5 text-purple-400" />;
  };

  const isFailed = call.status === 'FAILED' || call.status === 'NO_ANSWER' || call.status === 'BUSY';

  return (
    <div id="call-details-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Emergency Call Record Detail
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  call.mode === 'LIVE' 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {call.mode} CALL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Call ID: <strong className="text-white">{call.callId}</strong> • Dispatch: {call.dispatchId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          
          {/* Top Key Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Responder Role</span>
              <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                {getRoleIcon(call.role)}
                {call.role}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Target Phone</span>
              <span className="font-bold text-amber-400 mt-0.5 block">
                {call.phoneNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Current Status</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                {call.status}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Telephony Provider</span>
              <span className="text-slate-200 mt-0.5 block">
                {call.provider}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Provider Call ID</span>
              <span className="text-slate-400 text-[11px] mt-0.5 block truncate" title={call.providerCallId}>
                {call.providerCallId}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Call Duration</span>
              <span className="text-slate-200 mt-0.5 block">
                {call.duration > 0 ? `${call.duration} seconds` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Incident Association */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Associated Incident & Location:
            </span>
            <div className="text-white font-bold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Incident {call.incidentId} • {call.location}</span>
            </div>
            {call.coordinates && (
              <div className="text-[11px] font-mono text-slate-400">
                Coordinates: {call.coordinates.latitude.toFixed(4)}°N, {call.coordinates.longitude.toFixed(4)}°E • Hazard: {call.classification || 'Thermal Anomaly'}
              </div>
            )}
          </div>

          {/* Timestamps Breakdown */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Telephony Timing Breakdown:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Queued:</span>
                <span className="text-slate-200">{call.queuedAt ? new Date(call.queuedAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Initiated:</span>
                <span className="text-slate-200">{call.initiatedAt ? new Date(call.initiatedAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ringing:</span>
                <span className="text-slate-200">{call.ringingAt ? new Date(call.ringingAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Answered:</span>
                <span className="text-emerald-400 font-bold">{call.answeredAt ? new Date(call.answeredAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Voice Dispatch Audio Message Script */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Outbound Telephony Audio Message Transcript</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono italic leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              "Emergency Alert from THERMOS Satellite Industrial Thermal Monitoring. A confirmed {call.classification || 'high-hazard fire'} has been detected at {call.location}. Coordinates: {call.coordinates?.latitude.toFixed(4) || '35.5042'}°N, {call.coordinates?.longitude.toFixed(4) || '129.3585'}°E. Radiative Power: {call.frp || 45} MW. This is an official automated tri-agency dispatch alert. Dispatch response units immediately."
            </p>
          </div>

          {/* Chronological Event Log */}
          {call.timeline && call.timeline.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Chronological Audit Events:
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                {call.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-cyan-400 shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-bold text-white">[{item.status}]</span>
                    <span className="text-slate-300">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failure reason if any */}
          {call.errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs">
              <strong>Carrier Diagnostic Message: </strong>
              <span className="font-mono">{call.errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>

          {isFailed && onRetryCall && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all cursor-pointer"
            >
              {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span>Retry Call</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
