import React, { useState, useEffect } from 'react';
import { Responder, CallLog, StandardResponderRole } from '../types.ts';
import { 
  PhoneCall, 
  Flame, 
  ShieldAlert, 
  HeartPulse, 
  Truck, 
  AlertTriangle, 
  Check, 
  X, 
  Radio, 
  Loader2, 
  Info, 
  CheckCircle2, 
  MapPin, 
  ExternalLink,
  Volume2
} from 'lucide-react';

interface ThreeResponderDispatchModalProps {
  incident: {
    incidentId: string;
    hotspotId?: string;
    locationName: string;
    latitude: number;
    longitude: number;
    risk?: string;
    severity?: string;
    classification?: string;
    frp?: number;
  };
  onClose: () => void;
  onDispatchInitiated: (dispatchId: string, calls: CallLog[], mode: 'TEST' | 'LIVE') => void;
  onViewActiveCalls?: () => void;
}

export const ThreeResponderDispatchModal: React.FC<ThreeResponderDispatchModalProps> = ({
  incident,
  onClose,
  onDispatchInitiated,
  onViewActiveCalls
}) => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'TEST' | 'LIVE'>('TEST');
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [loadingResponders, setLoadingResponders] = useState<boolean>(true);
  const [existingActiveCalls, setExistingActiveCalls] = useState<CallLog[]>([]);
  const [checkingActiveCalls, setCheckingActiveCalls] = useState<boolean>(true);
  const [confirmStep, setConfirmStep] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Desired outcome test selector for Test Mode (optional demo control)
  const [desiredOutcomes, setDesiredOutcomes] = useState<Record<string, 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED'>>({});

  useEffect(() => {
    // 1. Fetch responders
    const fetchResponders = async () => {
      try {
        setLoadingResponders(true);
        const res = await fetch('/api/responders');
        const data = await res.json();
        if (data.success && Array.isArray(data.responders)) {
          setResponders(data.responders);
          // Default selection: pick first 3 active responders
          const defaultActive = data.responders.filter((r: Responder) => r.active).slice(0, 3).map((r: Responder) => r.id);
          setSelectedIds(defaultActive);
        }
      } catch (err) {
        console.error('Failed to load responders:', err);
      } finally {
        setLoadingResponders(false);
      }
    };

    // 2. Fetch provider status
    const fetchProviderStatus = async () => {
      try {
        const res = await fetch(`/api/providers/status?mode=${mode}`);
        const data = await res.json();
        setProviderStatus(data);
      } catch (err) {
        console.error('Failed to check provider status:', err);
      }
    };

    // 3. Check for existing active calls for this incident
    const checkActiveCalls = async () => {
      try {
        setCheckingActiveCalls(true);
        const res = await fetch(`/api/calls/incident/${incident.incidentId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.calls)) {
          const active = data.calls.filter((c: CallLog) => 
            c.status === 'QUEUED' || 
            c.status === 'INITIATING' || 
            c.status === 'RINGING' || 
            c.status === 'ANSWERED'
          );
          setExistingActiveCalls(active);
        }
      } catch (err) {
        console.error('Failed to check existing incident calls:', err);
      } finally {
        setCheckingActiveCalls(false);
      }
    };

    fetchResponders();
    fetchProviderStatus();
    checkActiveCalls();
  }, [incident.incidentId, mode]);

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

  const getRoleEmoji = (role: StandardResponderRole) => {
    switch (role) {
      case 'FIRE_RESCUE': return '🔥';
      case 'POLICE': return '👮';
      case 'HOSPITAL_MEDICAL': return '🏥';
      case 'AMBULANCE': return '🚑';
      case 'DISASTER_MANAGEMENT': return '🛡';
    }
  };

  const toggleResponderSelection = (id: string) => {
    setErrorMessage(null);
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(rId => rId !== id);
        if (next.length !== 3) {
          setErrorMessage('Please select exactly 3 responders.');
        }
        return next;
      } else {
        if (prev.length >= 3) {
          setErrorMessage('Please select exactly 3 responders.');
          return prev;
        }
        const next = [...prev, id];
        if (next.length !== 3) {
          setErrorMessage('Please select exactly 3 responders.');
        }
        return next;
      }
    });
  };

  const handleOutcomeChange = (responderId: string, outcome: 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED') => {
    setDesiredOutcomes(prev => ({
      ...prev,
      [responderId]: outcome
    }));
  };

  const handleProceedToConfirm = () => {
    setErrorMessage(null);
    if (selectedIds.length !== 3) {
      setErrorMessage('Please select exactly 3 responders.');
      return;
    }
    if (existingActiveCalls.length > 0) {
      setErrorMessage('Active emergency calls already exist for this incident.');
      return;
    }
    if (mode === 'LIVE' && !providerStatus?.twilioConfigured) {
      setErrorMessage('Live calling is not configured. TWILIO credentials are required on server.');
      return;
    }
    setConfirmStep(true);
  };

  const handleExecuteDispatch = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/calls/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incident.incidentId,
          hotspotId: incident.hotspotId || incident.incidentId,
          responderIds: selectedIds,
          locationName: incident.locationName,
          latitude: incident.latitude,
          longitude: incident.longitude,
          risk: incident.risk,
          severity: incident.severity,
          classification: incident.classification,
          frp: incident.frp,
          mode,
          desiredOutcomes: mode === 'TEST' ? desiredOutcomes : {}
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setExistingActiveCalls(data.activeCalls || []);
          throw new Error('Active emergency calls already exist for this incident.');
        }
        throw new Error(data.error || 'Dispatch request failed.');
      }

      // Success
      onDispatchInitiated(data.dispatchId, data.calls, mode);
    } catch (err: any) {
      setErrorMessage(err.message || 'Call initiation failed');
      setConfirmStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: StandardResponderRole) => {
    switch (role) {
      case 'FIRE_RESCUE': return <Flame className="w-5 h-5 text-red-400" />;
      case 'POLICE': return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
      case 'HOSPITAL_MEDICAL': return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'AMBULANCE': return <Truck className="w-5 h-5 text-amber-400" />;
      case 'DISASTER_MANAGEMENT': return <AlertTriangle className="w-5 h-5 text-purple-400" />;
    }
  };

  const selectedRespondersList = responders.filter(r => selectedIds.includes(r.id));
  const isSelectionValid = selectedIds.length === 3;
  const isLiveBlocked = mode === 'LIVE' && !providerStatus?.twilioConfigured;

  return (
    <div id="three-responder-dispatch-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  3-Responder Emergency Dispatch Console
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  mode === 'LIVE' 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {mode === 'LIVE' ? 'LIVE MODE (TWILIO)' : 'TEST MODE (SIMULATION)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Incident: <span className="text-slate-200 font-mono font-bold">{incident.incidentId}</span> • {incident.locationName}
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200 text-xs">
          
          {/* Target Incident Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Hazard Type</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {incident.classification || 'Thermal Anomaly'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">ITRI Risk</span>
              <span className="font-bold text-red-400 font-mono mt-0.5 block">
                {incident.risk || 'Critical'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">FRP Output</span>
              <span className="font-bold text-amber-400 font-mono mt-0.5 block">
                {incident.frp || 45.0} MW
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Coordinates</span>
              <span className="font-mono text-cyan-300 text-[11px] mt-0.5 block">
                {incident.latitude.toFixed(3)}°N, {incident.longitude.toFixed(3)}°E
              </span>
            </div>
          </div>

          {/* Active Call Warning (Duplicate Protection) */}
          {existingActiveCalls.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Active emergency calls already exist for this incident:</span>
                  <div className="mt-1 space-y-0.5 text-[11px] text-amber-300/90 font-mono">
                    {existingActiveCalls.map(c => (
                      <div key={c.callId}>• {c.responderName} ({c.role}): {c.status} ({c.mode} MODE)</div>
                    ))}
                  </div>
                </div>
              </div>
              {onViewActiveCalls && (
                <button
                  type="button"
                  onClick={onViewActiveCalls}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  View Calls
                </button>
              )}
            </div>
          )}

          {/* Mode Switcher: TEST MODE vs LIVE MODE */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Telephony Operation Mode:
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('TEST')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'TEST'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TEST MODE
                </button>
                <button
                  type="button"
                  onClick={() => setMode('LIVE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'LIVE'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  LIVE MODE
                </button>
              </div>
            </div>

            {/* Mode Explanations */}
            {mode === 'TEST' ? (
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-200">
                <span className="font-bold text-cyan-300">TEST CALL — NO REAL PHONE CALL</span>
                <p className="text-[11px] text-cyan-300/80 mt-0.5">
                  Uses MockTelephonyProvider simulating the complete call lifecycle (QUEUED → INITIATING → RINGING → ANSWERED → COMPLETED). No physical phone will ring.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 text-[11px]">
                {providerStatus && !providerStatus.twilioConfigured ? (
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 space-y-1">
                    <div className="font-bold text-red-300 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>LIVE CALLING NOT CONFIGURED</span>
                    </div>
                    <p className="text-red-300/90 text-[11px]">
                      Configure the telephony provider credentials on the backend before making real calls. (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER required).
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200">
                    <span className="font-bold text-rose-300">LIVE CALL (TWILIO CARRIER READY)</span>
                    <p className="text-rose-300/80 text-[11px] mt-0.5">
                      Physical telephones of the 3 selected responders will ring with an automated emergency voice alert broadcast.
                    </p>
                    <p className="text-amber-300/80 text-[10px] mt-1 font-mono">
                      ℹ️ Twilio Free Trial note: On trial accounts, recipient numbers must be verified in your Twilio Console (Phone Numbers &gt; Verified Caller IDs). Upgraded accounts can call any number.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 1: SELECT 3 OF 5 RESPONDERS */}
          {!confirmStep ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    SELECT 3 RESPONDERS
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    There are 5 configured responders. Exactly 3 must be selected to dispatch.
                  </p>
                </div>

                {/* Selection Counter Badge */}
                <div className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold border ${
                  selectedIds.length === 3 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {selectedIds.length === 3 ? '✓ 3 / 3 Selected' : `${selectedIds.length} / 3 Selected`}
                </div>
              </div>

              {/* Requirement: Prompt if not exactly 3 */}
              {selectedIds.length !== 3 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">Please select exactly 3 responders.</span>
                </div>
              )}

              {/* Error Notice */}
              {errorMessage && errorMessage !== 'Please select exactly 3 responders.' && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Responders Selection Cards */}
              {loadingResponders ? (
                <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading responders...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {responders.map((resp) => {
                    const isSelected = selectedIds.includes(resp.id);
                    const outcome = desiredOutcomes[resp.id] || 'ANSWERED';

                    return (
                      <div
                        key={resp.id}
                        id={`select-responder-${resp.id}`}
                        onClick={() => toggleResponderSelection(resp.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-500/70 shadow-lg shadow-cyan-950/40'
                            : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Custom Checkbox */}
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected 
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold' 
                              : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="text-xl select-none">
                            {getRoleEmoji(resp.role)}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{resp.roleLabel}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-normal">
                                ({resp.organization})
                              </span>
                            </div>
                            <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                              {formatDisplayPhone(resp.phoneNumber)}
                            </div>
                          </div>
                        </div>

                        {/* Test Mode Simulation Outcome Selector (if selected & test mode) */}
                        {isSelected && mode === 'TEST' && (
                          <div 
                            className="flex items-center gap-1.5 sm:self-center bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-slate-400 font-mono">Test Outcome:</span>
                            <select
                              value={outcome}
                              onChange={(e) => handleOutcomeChange(resp.id, e.target.value as any)}
                              className="bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 focus:outline-none cursor-pointer"
                            >
                              <option value="ANSWERED">ANSWERED</option>
                              <option value="NO_ANSWER">NO ANSWER</option>
                              <option value="BUSY">BUSY</option>
                              <option value="FAILED">FAILED</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: OPERATOR DISPATCH CONFIRMATION */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    🚨 EMERGENCY RESPONSE DISPATCH
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                    Review incident parameters and verified responder contacts below before releasing outbound emergency telephony dispatches.
                  </p>
                </div>
              </div>

              {/* Exact Section 9 Confirmation Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400 uppercase text-[10px]">Incident:</span>
                  <span className="font-bold text-white text-sm">{incident.incidentId}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400 uppercase text-[10px]">Location:</span>
                  <span className="font-bold text-slate-200 text-right">{incident.locationName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400 uppercase text-[10px]">Coordinates:</span>
                  <span className="font-bold text-cyan-300">{incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px]">Risk:</span>
                  <span className="font-bold text-red-400">{incident.risk || 'CRITICAL'} ({incident.classification || 'Thermal Anomaly'})</span>
                </div>
              </div>

              {/* Selected Responders List */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                  Selected Responders:
                </span>
                {selectedRespondersList.map((resp) => (
                  <div key={resp.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xl select-none">
                        {getRoleEmoji(resp.role)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {resp.roleLabel}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {resp.name} • {resp.organization}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {formatDisplayPhone(resp.phoneNumber)}
                      </span>
                      {mode === 'TEST' && (
                        <span className="block text-[9px] font-mono text-cyan-400">
                          Simulated: {desiredOutcomes[resp.id] || 'ANSWERED'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirmation Question */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <p className="text-xs font-bold text-amber-300">
                  Are you sure you want to initiate 3 emergency calls?
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={confirmStep ? () => setConfirmStep(false) : onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {confirmStep ? 'CANCEL' : 'CANCEL'}
          </button>

          {!confirmStep ? (
            <button
              id="proceed-to-confirm-dispatch-btn"
              type="button"
              onClick={handleProceedToConfirm}
              disabled={!isSelectionValid || isLiveBlocked || existingActiveCalls.length > 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                !isSelectionValid || isLiveBlocked || existingActiveCalls.length > 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-600/30'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>CALL 3 RESPONDERS</span>
            </button>
          ) : (
            <button
              id="execute-confirmed-dispatch-btn"
              type="button"
              onClick={handleExecuteDispatch}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/40 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating 3 Emergency Calls...</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                  <span>CONFIRM & CALL 3 RESPONDERS</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
