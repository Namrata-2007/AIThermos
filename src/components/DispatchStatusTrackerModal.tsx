import React, { useState, useEffect } from 'react';
import { CallLog, CallLifecycleStatus, StandardResponderRole } from '../types.ts';
import { 
  PhoneCall, 
  Flame, 
  ShieldAlert, 
  HeartPulse, 
  Truck, 
  AlertTriangle, 
  PhoneOff, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  X, 
  Radio,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface DispatchStatusTrackerModalProps {
  dispatchId: string;
  initialCalls?: CallLog[];
  incidentId?: string;
  locationName?: string;
  mode?: 'TEST' | 'LIVE';
  onClose: () => void;
  onCallUpdated?: () => void;
}

export const DispatchStatusTrackerModal: React.FC<DispatchStatusTrackerModalProps> = ({
  dispatchId,
  initialCalls = [],
  incidentId,
  locationName,
  mode = 'TEST',
  onClose,
  onCallUpdated
}) => {
  const [calls, setCalls] = useState<CallLog[]>(initialCalls);
  const [loading, setLoading] = useState<boolean>(initialCalls.length === 0);
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});
  const [isHangingUp, setIsHangingUp] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [isBroadcastingAudio, setIsBroadcastingAudio] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll for status updates every 1.5 seconds while any call is still in progress
  useEffect(() => {
    let intervalId: any = null;

    const fetchLatestCalls = async () => {
      try {
        const res = await fetch('/api/calls');
        const data = await res.json();
        if (data.success && Array.isArray(data.calls)) {
          // Filter by dispatchId or incidentId
          const matching = data.calls.filter((c: CallLog) => 
            c.dispatchId === dispatchId || (incidentId && c.incidentId === incidentId)
          );
          if (matching.length > 0) {
            setCalls(matching);
            if (onCallUpdated) onCallUpdated();
          }
        }
      } catch (err) {
        console.error('Error fetching latest call statuses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCalls();
    intervalId = setInterval(fetchLatestCalls, 1500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [dispatchId, incidentId]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDisplayPhone = (phone: string): string => {
    const clean = phone.replace(/[\s\-()]/g, '');
    if (clean.startsWith('+91') && clean.length === 13) {
      return `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`;
    }
    if (clean.startsWith('+') && clean.length > 6) {
      return clean.replace(/(\+\d{2,3})(\d{5})(\d+)/, '$1 $2 $3');
    }
    return phone;
  };

  const getRoleEmoji = (role: string) => {
    if (role.includes('FIRE')) return '🔥';
    if (role.includes('POLICE')) return '👮';
    if (role.includes('HOSPITAL')) return '🏥';
    if (role.includes('AMBULANCE')) return '🚑';
    return '🛡';
  };

  const allCallsFinished = calls.length > 0 && calls.every(c => 
    c.status === 'COMPLETED' || c.status === 'FAILED' || c.status === 'NO_ANSWER' || c.status === 'BUSY'
  );

  const hasFailedCalls = calls.some(c => 
    c.status === 'FAILED' || c.status === 'NO_ANSWER' || c.status === 'BUSY'
  );

  const handleRetryAllFailed = async () => {
    const failedCalls = calls.filter(c => 
      c.status === 'FAILED' || c.status === 'NO_ANSWER' || c.status === 'BUSY'
    );
    for (const call of failedCalls) {
      await handleRetry(call.callId);
    }
  };

  const handleHangup = async (callId: string) => {
    setIsHangingUp(callId);
    try {
      const res = await fetch(`/api/calls/${callId}/hangup`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.call) {
        setCalls(prev => prev.map(c => c.callId === callId ? data.call : c));
      }
    } catch (err: any) {
      setErrorMessage(`Failed to terminate call: ${err.message}`);
    } finally {
      setIsHangingUp(null);
    }
  };

  const handleRetry = async (callId: string) => {
    setIsRetrying(callId);
    try {
      const res = await fetch(`/api/calls/${callId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredOutcome: 'ANSWERED' })
      });
      const data = await res.json();
      if (data.success && data.call) {
        setCalls(prev => prev.map(c => c.callId === callId ? data.call : c));
      }
    } catch (err: any) {
      setErrorMessage(`Retry failed: ${err.message}`);
    } finally {
      setIsRetrying(null);
    }
  };

  const toggleTimeline = (callId: string) => {
    setExpandedTimelines(prev => ({ ...prev, [callId]: !prev[callId] }));
  };

  // Text-to-speech demonstration for the emergency radio dispatch audio
  const handlePlayVoiceBroadcast = () => {
    if (isBroadcastingAudio) {
      window.speechSynthesis?.cancel();
      setIsBroadcastingAudio(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      setErrorMessage('Browser does not support Web Speech API.');
      return;
    }

    const firstCall = calls[0];
    const loc = locationName || firstCall?.location || 'Designated industrial corridor';
    const text = `Priority Emergency Alert from THERMOS Satellite Industrial Thermal Monitoring. Confirmed thermal hazard detected at ${loc}. Automated tri-agency dispatch alert to Fire and Rescue, Police, and Medical Trauma Command. Response units acknowledge immediately.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsBroadcastingAudio(false);
    utterance.onerror = () => setIsBroadcastingAudio(false);

    setIsBroadcastingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const getRoleIcon = (role: string) => {
    if (role.includes('FIRE')) return <Flame className="w-5 h-5 text-red-400" />;
    if (role.includes('POLICE')) return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
    if (role.includes('HOSPITAL')) return <HeartPulse className="w-5 h-5 text-emerald-400" />;
    if (role.includes('AMBULANCE')) return <Truck className="w-5 h-5 text-amber-400" />;
    return <AlertTriangle className="w-5 h-5 text-purple-400" />;
  };

  const getStatusBadge = (status: CallLifecycleStatus) => {
    switch (status) {
      case 'QUEUED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">QUEUED</span>;
      case 'INITIATING':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse">INITIATING</span>;
      case 'RINGING':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">RINGING...</span>;
      case 'ANSWERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">ANSWERED (LIVE)</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">COMPLETED</span>;
      case 'NO_ANSWER':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">NO ANSWER</span>;
      case 'BUSY':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-600/20 text-amber-300 border border-amber-600/40">LINE BUSY</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">FAILED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">CANCELLED</span>;
    }
  };

  const steps: CallLifecycleStatus[] = ['QUEUED', 'INITIATING', 'RINGING', 'ANSWERED', 'COMPLETED'];

  const getStepIndex = (status: CallLifecycleStatus) => {
    if (status === 'QUEUED') return 0;
    if (status === 'INITIATING') return 1;
    if (status === 'RINGING') return 2;
    if (status === 'ANSWERED') return 3;
    if (status === 'COMPLETED') return 4;
    return -1; // Failed, busy, no answer
  };

  const allCompleted = calls.length > 0 && calls.every(c => 
    c.status === 'COMPLETED' || c.status === 'FAILED' || c.status === 'NO_ANSWER' || c.status === 'BUSY' || c.status === 'CANCELLED'
  );

  return (
    <div id="dispatch-status-tracker-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              allCompleted 
                ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' 
                : 'bg-red-600/20 text-red-400 border-red-500/30'
            }`}>
              <PhoneCall className={`w-6 h-6 ${!allCompleted ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {allCompleted ? 'CALL SUMMARY' : 'CALL STATUS'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border ${
                  mode === 'LIVE'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {mode === 'LIVE' ? 'LIVE CALL (TWILIO)' : 'TEST CALL — NO REAL PHONE CALL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Dispatch ID: <strong className="text-white">{dispatchId}</strong></span>
                <span>•</span>
                <span>Incident: <strong className="text-cyan-400">{incidentId || calls[0]?.incidentId}</strong></span>
                <span>•</span>
                <span>{locationName || calls[0]?.location}</span>
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

        {/* Audio Dispatch Controls & Live Banner */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Radio className={`w-4 h-4 ${!allCompleted ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-300">
              {allCompleted 
                ? 'All 3 responder calls have finished processing.' 
                : '3 independent telephony calls are actively bridging across carriers.'}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePlayVoiceBroadcast}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isBroadcastingAudio
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            {isBroadcastingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isBroadcastingAudio ? 'Stop Voice Broadcast' : '🔊 Hear Audio Dispatch'}</span>
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body: 3 Independent Responder Call Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Connecting to telephony providers...</span>
            </div>
          ) : calls.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">
              No call records found for this dispatch session.
            </div>
          ) : (
            calls.map((call, index) => {
              const curStepIdx = getStepIndex(call.status);
              const isTerminalFailure = call.status === 'FAILED' || call.status === 'BUSY' || call.status === 'NO_ANSWER';
              const isCallActive = call.status === 'INITIATING' || call.status === 'RINGING' || call.status === 'ANSWERED';
              const isTimelineOpen = Boolean(expandedTimelines[call.callId]);

              return (
                <div 
                  key={call.callId}
                  id={`call-session-${call.callId}`}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl select-none">
                        {getRoleEmoji(call.role)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {call.responderName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({call.role})
                          </span>
                        </div>
                        <div className="text-xs font-mono text-amber-300 font-bold mt-0.5">
                          {formatDisplayPhone(call.phoneNumber)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Call ID: {call.callId}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(call.status)}
                      </div>
                      <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                        <span className="text-slate-500 uppercase text-[10px]">DURATION:</span>
                        <span className="font-bold text-white">{formatDuration(call.duration || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Stepper: QUEUED -> INITIATING -> RINGING -> ANSWERED -> COMPLETED */}
                  {!isTerminalFailure ? (
                    <div className="py-2">
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {steps.map((step, sIdx) => {
                          const isPassed = curStepIdx > sIdx;
                          const isCurrent = curStepIdx === sIdx;

                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                                isPassed 
                                  ? 'bg-emerald-500 text-slate-950' 
                                  : isCurrent 
                                    ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 animate-pulse' 
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}>
                                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : sIdx + 1}
                              </div>
                              <span className={`text-[9px] font-mono uppercase mt-1 ${
                                isCurrent ? 'text-cyan-300 font-bold' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Visual connecting line */}
                      <div className="relative -mt-6 mx-6 h-0.5 bg-slate-800 -z-0">
                        <div 
                          className="h-full bg-cyan-500 transition-all duration-500" 
                          style={{ width: `${Math.max(0, (curStepIdx / (steps.length - 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Terminal Failure Banner */
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                          <span className="font-bold">Call Terminated: {call.status}</span>
                          <p className="text-[11px] text-red-300/80 mt-0.5 font-mono">
                            {call.errorMessage || 'No carrier response from remote responder terminal.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar for this Call */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTimeline(call.callId)}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isTimelineOpen ? 'Hide' : 'View'} Timeline ({call.timeline?.length || 0} events)</span>
                      {isTimelineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      {isCallActive && (
                        <button
                          type="button"
                          onClick={() => handleHangup(call.callId)}
                          disabled={isHangingUp === call.callId}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                        >
                          <PhoneOff className="w-3 h-3" />
                          <span>Hangup</span>
                        </button>
                      )}

                      {isTerminalFailure && (
                        <button
                          type="button"
                          onClick={() => handleRetry(call.callId)}
                          disabled={isRetrying === call.callId}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                        >
                          {isRetrying === call.callId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          <span>Retry Line</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Chronological Timeline */}
                  {isTimelineOpen && call.timeline && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block">
                        Chronological Event Log:
                      </span>
                      {call.timeline.map((item, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-2 text-slate-300">
                          <span className="text-cyan-400 shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="font-bold text-slate-200">[{item.status}]</span>
                          <span className="text-slate-400">{item.note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-400">
            Carrier Status: <strong className="text-cyan-300">{mode === 'LIVE' ? 'Twilio Carrier Outbound' : 'Mock Telephony Daemon (Test Mode)'}</strong>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {hasFailedCalls && allCompleted && (
              <button
                type="button"
                onClick={handleRetryAllFailed}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-600/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY FAILED CALLS</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cyan-900/60 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition-colors cursor-pointer"
            >
              VIEW CALL LOGS
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
