import React, { useState, useEffect } from 'react';
import { 
  ThermalEvent, 
  EmergencyCallSession, 
  CallLog, 
  DispatchAuditRecord, 
  Responder 
} from '../types.ts';
import { 
  PhoneCall, 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  Radio, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Building2, 
  Truck, 
  PhoneForwarded, 
  ExternalLink,
  RotateCcw,
  Search,
  Eye,
  EyeOff,
  Filter,
  Users,
  ShieldCheck,
  FileText,
  Loader2
} from 'lucide-react';
import { FIRE_STATIONS, HOSPITALS, POLICE_STATIONS } from '../data/mockGeospatial.ts';
import { ResponderConfigPanel } from './ResponderConfigPanel.tsx';
import { ThreeResponderDispatchModal } from './ThreeResponderDispatchModal.tsx';
import { DispatchStatusTrackerModal } from './DispatchStatusTrackerModal.tsx';
import { CallDetailsModal } from './CallDetailsModal.tsx';

interface EmergencyHotlineCenterProps {
  sessions: EmergencyCallSession[];
  onTriggerCallForEvent: (event: ThermalEvent, isAuto?: boolean) => void;
  onOpenSessionModal: (session: EmergencyCallSession) => void;
  activeEvents: ThermalEvent[];
  isAutoCallArmed: boolean;
  onToggleAutoCallArmed: () => void;
}

export const EmergencyHotlineCenter: React.FC<EmergencyHotlineCenterProps> = ({
  sessions,
  onTriggerCallForEvent,
  onOpenSessionModal,
  activeEvents,
  isAutoCallArmed,
  onToggleAutoCallArmed
}) => {
  // Navigation / Filter State
  const [activeSubTab, setActiveSubTab] = useState<'DISPATCH' | 'CONFIG' | 'LOGS' | 'AUDIT'>('DISPATCH');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maskPhones, setMaskPhones] = useState<boolean>(false);

  // Data from backend
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [audits, setAudits] = useState<DispatchAuditRecord[]>([]);
  const [loadingCalls, setLoadingCalls] = useState<boolean>(false);
  const [responders, setResponders] = useState<Responder[]>([]);

  // Modal States
  const [targetIncidentForDispatch, setTargetIncidentForDispatch] = useState<any | null>(null);
  const [activeDispatchTracker, setActiveDispatchTracker] = useState<{
    dispatchId: string;
    calls: CallLog[];
    incidentId: string;
    locationName: string;
    mode: 'TEST' | 'LIVE';
  } | null>(null);
  const [selectedCallDetail, setSelectedCallDetail] = useState<CallLog | null>(null);

  // Poll call logs from /api/calls and audits from /api/dispatch/audits
  const fetchCallLogsAndAudits = async () => {
    try {
      const [callsRes, auditsRes] = await Promise.all([
        fetch('/api/calls'),
        fetch('/api/dispatch/audits')
      ]);

      const callsData = await callsRes.json();
      if (callsData.success && Array.isArray(callsData.calls)) {
        setCallLogs(callsData.calls);
      }

      const auditsData = await auditsRes.json();
      if (auditsData.success && Array.isArray(auditsData.audits)) {
        setAudits(auditsData.audits);
      }
    } catch (err) {
      console.error('Error fetching call records:', err);
    }
  };

  useEffect(() => {
    setLoadingCalls(true);
    fetchCallLogsAndAudits().finally(() => setLoadingCalls(false));

    // Poll every 3 seconds so logs remain synchronized with ongoing calls
    const interval = setInterval(fetchCallLogsAndAudits, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter call logs
  const filteredCallLogs = callLogs.filter(call => {
    if (filterMode !== 'ALL' && call.mode !== filterMode) return false;
    if (filterStatus !== 'ALL' && call.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        call.callId.toLowerCase().includes(q) ||
        call.incidentId.toLowerCase().includes(q) ||
        call.responderName.toLowerCase().includes(q) ||
        call.role.toLowerCase().includes(q) ||
        call.phoneNumber.includes(q) ||
        (call.location && call.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Find candidate thermal/fire events
  const detectedHotspots = activeEvents.filter(e => 
    e.classification === 'Industrial Fire' || 
    e.classification === 'Wildfire' || 
    e.classification === 'Agricultural Burning' ||
    e.classification === 'Gas Flare' ||
    (e.itriRiskLevel === 'Critical') ||
    (e.frp > 35)
  );

  const handleOpenDispatchModal = (event: ThermalEvent) => {
    setTargetIncidentForDispatch({
      incidentId: event.id || event.eventId || `INC-${event.acquisitionDate.replace(/-/g, '')}-${event.id.slice(-4)}`,
      hotspotId: event.id,
      locationName: event.nearestIndustrialSite?.name || `Cluster near [${event.latitude.toFixed(2)}, ${event.longitude.toFixed(2)}]`,
      latitude: event.latitude,
      longitude: event.longitude,
      risk: event.itriRiskLevel,
      severity: event.escalationLevel || event.itriRiskLevel,
      classification: event.classification || 'Thermal Anomaly Candidate',
      frp: event.frp
    });
  };

  const handleDispatchInitiated = (dispatchId: string, calls: CallLog[], mode: 'TEST' | 'LIVE') => {
    const target = targetIncidentForDispatch;
    setTargetIncidentForDispatch(null);
    setActiveDispatchTracker({
      dispatchId,
      calls,
      incidentId: target?.incidentId || calls[0]?.incidentId || 'INC-UNKNOWN',
      locationName: target?.locationName || calls[0]?.location || 'Disaster Corridor',
      mode
    });
    fetchCallLogsAndAudits();
  };

  const handleRetryFromLog = async (callId: string) => {
    try {
      const res = await fetch(`/api/calls/${callId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredOutcome: 'ANSWERED' })
      });
      const data = await res.json();
      if (data.success && data.call) {
        setCallLogs(prev => prev.map(c => c.callId === callId ? data.call : c));
        fetchCallLogsAndAudits();
      }
    } catch (err) {
      console.error('Failed to retry call:', err);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (!maskPhones) return phone;
    if (phone.length <= 6) return phone;
    const prefix = phone.slice(0, 4);
    const suffix = phone.slice(-2);
    const masked = '*'.repeat(phone.length - 6);
    return `${prefix}${masked}${suffix}`;
  };

  return (
    <div id="emergency-hotline-center" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Hero Header & Multi-Service System Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-600/30 border border-red-400/40">
              <PhoneCall className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  3-Responder Emergency Dispatch Command & Telephony Console
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
                  SIH26162 UPGRADE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Configure 5 authorized emergency agencies with user-editable phone numbers. For any detected thermal hazard or industrial fire candidate, select exactly 3 responders and initiate independent telephony calls with complete lifecycle tracking (<strong className="text-cyan-300 font-mono">QUEUED → INITIATING → RINGING → ANSWERED → COMPLETED</strong>).
              </p>
            </div>
          </div>

          {/* Sub-Tabs Nav / Mode Indicator */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveSubTab('DISPATCH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'DISPATCH' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚨 Active Hotspots
            </button>
            <button
              onClick={() => setActiveSubTab('CONFIG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'CONFIG' 
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚙️ 5 Responders
            </button>
            <button
              onClick={() => setActiveSubTab('LOGS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'LOGS' 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📞 Call Logs ({callLogs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('AUDIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'AUDIT' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Audit Trail ({audits.length})
            </button>
          </div>
        </div>

        {/* Safety & Protocol Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>No Hardcoded Numbers:</strong> Operator customizes 5 real test/duty lines.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>Strict 3-Selection:</strong> Operator picks exactly 3 responders per incident.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Independent Calls:</strong> Failures in one line do not block remaining responders.</span>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: RESPONDER CONFIGURATION (5 AGENCIES) */}
      {activeSubTab === 'CONFIG' && (
        <ResponderConfigPanel onRespondersUpdated={(r) => setResponders(r)} />
      )}

      {/* SUB-VIEW 2: ACTIVE DISPATCH / HOTSPOTS VIEW */}
      {activeSubTab === 'DISPATCH' && (
        <div className="space-y-6">
          
          {/* Quick Responder Config preview banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Configured 5 Emergency Responders
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Fire & Rescue, Police, Hospital/Medical, Ambulance, and Disaster Management are armed for dispatch.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('CONFIG')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-colors shrink-0"
            >
              Edit Numbers & Contacts →
            </button>
          </div>

          {/* Detected Thermal & Fire Candidate Hotspots Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Detected Thermal & Fire Candidate Hotspots
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                  {detectedHotspots.length} Active Targets
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Click any hotspot to select 3 responders and launch independent telephony calls
              </span>
            </div>

            {/* Hotspots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {detectedHotspots.map(evt => {
                const isCritical = evt.itriRiskLevel === 'Critical';
                const isActualConfirmed = evt.classification === 'Industrial Fire' || evt.classification === 'Wildfire';

                return (
                  <div 
                    key={evt.id} 
                    id={`hotspot-dispatch-card-${evt.id}`}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition-all flex flex-col justify-between space-y-3 shadow-lg group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          isActualConfirmed 
                            ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {isActualConfirmed ? 'CONFIRMED FIRE' : 'HIGH-RISK THERMAL CANDIDATE'} • ITRI {evt.itriScore}/100
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          FRP {evt.frp} MW
                        </span>
                      </div>

                      <div className="mt-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {evt.nearestIndustrialSite?.name || `Thermal Target ${evt.eventId}`}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {evt.latitude.toFixed(4)}°N, {evt.longitude.toFixed(4)}°E
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Classification: <strong className="text-slate-200">{evt.classification || 'Industrial Hotspot'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Satellite: <span className="text-slate-300">{evt.satellite}</span>
                      </div>

                      <button
                        id={`call-3-responders-btn-${evt.id}`}
                        onClick={() => handleOpenDispatchModal(evt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call 3 Responders Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Access to Call Logs Table */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing recent incident calls. View the complete registry under the Call Logs tab.
            </span>
            <button
              onClick={() => setActiveSubTab('LOGS')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>View All {callLogs.length} Emergency Call Records</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: EMERGENCY CALL RECORDS & RESPONSE LOGS TABLE */}
      {(activeSubTab === 'LOGS' || activeSubTab === 'DISPATCH') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Emergency Call Records & Response Logs
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {filteredCallLogs.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Persistent audit log of all 3-responder telephony sessions with timestamps, durations, and carrier notes
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Privacy Mask Toggle */}
              <button
                onClick={() => setMaskPhones(prev => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                  maskPhones 
                    ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Mask phone numbers for display privacy"
              >
                {maskPhones ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{maskPhones ? 'Masked' : 'Unmasked'}</span>
              </button>

              {/* Mode Filter */}
              <select
                value={filterMode}
                onChange={e => setFilterMode(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Modes</option>
                <option value="TEST">TEST MODE</option>
                <option value="LIVE">LIVE MODE</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="QUEUED">QUEUED</option>
                <option value="INITIATING">INITIATING</option>
                <option value="RINGING">RINGING</option>
                <option value="ANSWERED">ANSWERED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="NO_ANSWER">NO ANSWER</option>
                <option value="BUSY">BUSY</option>
                <option value="FAILED">FAILED</option>
              </select>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search call ID, responder..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Call Logs Table */}
          {loadingCalls && callLogs.length === 0 ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Loading call logs...</span>
            </div>
          ) : filteredCallLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <Radio className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-400">No emergency call records found</div>
              <p className="text-xs text-slate-500">
                Trigger a dispatch from the Active Hotspots above or click "Test Line" in the 5 Responders panel.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-[11px] text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Call ID</th>
                    <th className="py-2.5 px-3">Incident / Hotspot</th>
                    <th className="py-2.5 px-3">Responder</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Phone Number</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Started</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredCallLogs.map(call => {
                    const isFailed = call.status === 'FAILED' || call.status === 'BUSY' || call.status === 'NO_ANSWER';
                    const isAnswered = call.status === 'ANSWERED';

                    return (
                      <tr key={call.callId} className="hover:bg-slate-950/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-cyan-300 whitespace-nowrap">
                          {call.callId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          <span className="font-bold text-white block">{call.incidentId}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[140px] block" title={call.location}>
                            {call.location}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-medium text-white whitespace-nowrap">
                          {call.responderName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[11px] text-slate-400">{call.role}</span>
                        </td>
                        <td className="py-2.5 px-3 text-amber-300 font-bold whitespace-nowrap">
                          {maskPhoneNumber(call.phoneNumber)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            call.mode === 'LIVE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {call.mode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            call.status === 'COMPLETED' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                            call.status === 'ANSWERED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            call.status === 'RINGING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                            call.status === 'INITIATING' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse' :
                            isFailed ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {call.queuedAt ? new Date(call.queuedAt).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {call.duration > 0 ? `${call.duration}s` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              type="button"
                              onClick={() => setSelectedCallDetail(call)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Details
                            </button>

                            {isFailed && (
                              <button
                                type="button"
                                onClick={() => handleRetryFromLog(call.callId)}
                                className="px-2.5 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                title="Retry Call"
                              >
                                Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 4: AUDIT TRAIL */}
      {activeSubTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Dispatch Operations Audit Trail
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  {audits.length} Dispatches Recorded
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Immutable records documenting Who, When, Incident, 3 Responders, Phone Numbers, and Final Call Results
              </p>
            </div>
          </div>

          {audits.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">
              No dispatch audits logged yet. Dispatches will be permanently recorded here.
            </div>
          ) : (
            <div className="space-y-3">
              {audits.map((audit) => (
                <div key={audit.dispatchId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Dispatch: {audit.dispatchId}</span>
                      <span className="text-cyan-400">Incident: {audit.incidentId}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        audit.mode === 'LIVE' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {audit.mode}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(audit.initiatedAt).toUTCString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Location:</span>
                      <span className="text-white">{audit.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Operator Authority:</span>
                      <span className="text-slate-200">{audit.initiatedBy}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-slate-500 text-[10px] block mb-1">Dispatched 3 Responders:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {audit.responders.map((r, i) => (
                        <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                          <div className="font-bold text-white">{r.role}</div>
                          <div className="text-amber-400 font-mono font-bold mt-0.5">{r.phoneNumber}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Call: {r.callId}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: 3-Responder Dispatch Selector & Confirmation */}
      {targetIncidentForDispatch && (
        <ThreeResponderDispatchModal
          incident={targetIncidentForDispatch}
          onClose={() => setTargetIncidentForDispatch(null)}
          onDispatchInitiated={handleDispatchInitiated}
          onViewActiveCalls={() => {
            setTargetIncidentForDispatch(null);
            setActiveSubTab('LOGS');
          }}
        />
      )}

      {/* MODAL 2: Live Dispatch Status Tracker HUD */}
      {activeDispatchTracker && (
        <DispatchStatusTrackerModal
          dispatchId={activeDispatchTracker.dispatchId}
          initialCalls={activeDispatchTracker.calls}
          incidentId={activeDispatchTracker.incidentId}
          locationName={activeDispatchTracker.locationName}
          mode={activeDispatchTracker.mode}
          onClose={() => setActiveDispatchTracker(null)}
          onCallUpdated={fetchCallLogsAndAudits}
        />
      )}

      {/* MODAL 3: Detailed Call Record Modal */}
      {selectedCallDetail && (
        <CallDetailsModal
          call={selectedCallDetail}
          onClose={() => setSelectedCallDetail(null)}
          onRetryCall={handleRetryFromLog}
        />
      )}

    </div>
  );
};
