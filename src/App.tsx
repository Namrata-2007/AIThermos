/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ThermalEvent, 
  IndustrialSite, 
  FireStation, 
  Hospital, 
  PoliceStation,
  AmbulanceUnit,
  IncidentReport, 
  DispatchSimulation,
  EmergencyCallSession,
  TargetRegion,
  LocationRiskAssessment
} from './types.ts';
import { Header } from './components/Header.tsx';
import { GisMap } from './components/GisMap.tsx';
import { EventInspector } from './components/EventInspector.tsx';
import { TemporalTimeline } from './components/TemporalTimeline.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { IncidentReportModal } from './components/IncidentReportModal.tsx';
import { DispatchSimulator } from './components/DispatchSimulator.tsx';
import { EmergencyCallModal } from './components/EmergencyCallModal.tsx';
import { EmergencyHotlineCenter } from './components/EmergencyHotlineCenter.tsx';
import { ThreeResponderDispatchModal } from './components/ThreeResponderDispatchModal.tsx';
import { DispatchStatusTrackerModal } from './components/DispatchStatusTrackerModal.tsx';
import { DeveloperDebugPanel } from './components/DeveloperDebugPanel.tsx';
import { TruthfulFireReport } from './components/TruthfulFireReport.tsx';
import { isActualFireEvent } from './services/emergencyCallingService.ts';
import { calculateHaversineDistance } from './services/gisEngine.ts';
import { TARGET_CORRIDORS } from './data/mockGeospatial.ts';
import { 
  Flame, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Activity, 
  FileText, 
  Layers, 
  Radio, 
  AlertTriangle,
  PhoneCall,
  X,
  Volume2
} from 'lucide-react';

export default function App() {
  const [events, setEvents] = useState<ThermalEvent[]>([]);
  const [industrialSites, setIndustrialSites] = useState<IndustrialSite[]>([]);
  const [fireStations, setFireStations] = useState<FireStation[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [ambulanceUnits, setAmbulanceUnits] = useState<AmbulanceUnit[]>([]);
  
  const [selectedEvent, setSelectedEvent] = useState<ThermalEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'history' | 'analytics' | 'reports' | 'hotline'>('map');
  const [selectedRegion, setSelectedRegion] = useState<TargetRegion>(
    TARGET_CORRIDORS.find((c) => c.id === 'ULSAN') || TARGET_CORRIDORS[0]
  );
  const [totalFirmsRecords, setTotalFirmsRecords] = useState<number>(0);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');

  const [activeDispatch, setActiveDispatch] = useState<DispatchSimulation | null>(null);
  const [activeReport, setActiveReport] = useState<IncidentReport | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [reportsList, setReportsList] = useState<IncidentReport[]>([]);

  // Automated Emergency Calling State
  const [emergencyCallSessions, setEmergencyCallSessions] = useState<EmergencyCallSession[]>([]);
  const [activeCallSession, setActiveCallSession] = useState<EmergencyCallSession | null>(null);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [isAutoCallArmed, setIsAutoCallArmed] = useState<boolean>(false);
  const [autoCalledEventIds, setAutoCalledEventIds] = useState<Set<string>>(new Set());
  const [targetEventForThreeDispatch, setTargetEventForThreeDispatch] = useState<ThermalEvent | null>(null);
  const [activeThreeDispatchTracker, setActiveThreeDispatchTracker] = useState<{
    dispatchId: string;
    calls: any[];
    incidentId: string;
    locationName: string;
    mode: 'TEST' | 'LIVE';
  } | null>(null);
  const [actualFireAlertBanner, setActualFireAlertBanner] = useState<{
    event: ThermalEvent;
    session: EmergencyCallSession;
  } | null>(null);
  const [currentRiskAssessment, setCurrentRiskAssessment] = useState<LocationRiskAssessment | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataSourceNote, setDataSourceNote] = useState<string>('Validated NASA FIRMS Benchmark Dataset');
  const [operationalMode, setOperationalMode] = useState<'LIVE' | 'DEMO'>('DEMO');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [liveModeError, setLiveModeError] = useState<string | null>(null);

  // Helper to safely parse JSON responses and avoid HTML doctype errors
  const safeFetchJson = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch (e) {
        console.warn('Failed to parse JSON body:', e);
        return null;
      }
    }
    return null;
  };

  // Initial Data Fetching from Express Backend
  useEffect(() => {
    fetchInitialData();
    fetchEmergencyCalls();
    fetch('/api/system-status')
      .then(async (res) => {
        const data = await safeFetchJson(res);
        if (data?.services) setSystemStatus(data.services);
      })
      .catch((e) => console.error('Failed to load system status:', e));
  }, []);

  const fetchEmergencyCalls = async () => {
    try {
      const res = await fetch('/api/emergency-calls');
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (data?.sessions) setEmergencyCallSessions(data.sessions);
      }
    } catch (e) {
      console.error('Failed to load emergency calls:', e);
    }
  };

  // Fetch Events dynamically filtered for the active target corridor
  const fetchCorridorEvents = async (region: TargetRegion, mode: 'LIVE' | 'DEMO' = operationalMode) => {
    setIsLoading(true);
    setLiveModeError(null);
    try {
      const res = await fetch(
        `/api/firms?mode=${mode}&lat=${region.latitude}&lon=${region.longitude}&radiusKm=${region.radiusKm || 25}&name=${encodeURIComponent(region.name)}`
      );
      const data = await safeFetchJson(res);

      if (!res.ok || !data) {
        if (mode === 'LIVE') {
          setLiveModeError(data?.error || data?.message || `Server returned HTTP ${res.status}. Falling back to cached benchmark stream.`);
        }
        return;
      }

      if (data.status === 'ERROR') {
        if (mode === 'LIVE') {
          setLiveModeError(data.error || 'NASA FIRMS connection encountered a service error.');
        }
      }

      if (data.riskAssessment) {
        setCurrentRiskAssessment(data.riskAssessment);
      }

      const loadedEvents: ThermalEvent[] = data.events || [];
      setEvents(loadedEvents);
      setTotalFirmsRecords(data.totalIngestedCount || (data.events ? data.events.length : 0));
      setLastUpdated(data.lastUpdated || data.timestamp || new Date().toISOString());
      setDataSourceNote(
        data.source === 'LIVE_NASA_FIRMS' ? 'Live Satellite Orbital Stream' : 'Validated Benchmark Feed'
      );

      // Select top event in corridor if available
      if (loadedEvents.length > 0) {
        setSelectedEvent(loadedEvents[0]);
      } else {
        setSelectedEvent(null);
      }
    } catch (err: any) {
      console.error('Failed to refresh NASA FIRMS for corridor:', err);
      if (mode === 'LIVE') {
        setLiveModeError(err.message || 'Network error attempting to contact NASA FIRMS.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRegion = (region: TargetRegion) => {
    setSelectedRegion(region);
    setActualFireAlertBanner(null);
    if (region.riskAssessment) {
      setCurrentRiskAssessment(region.riskAssessment);
    }
    fetchCorridorEvents(region, operationalMode);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Corridor Events
      await fetchCorridorEvents(selectedRegion, operationalMode);

      // 2. Fetch Industrial Sites
      const sitesRes = await fetch('/api/industrial-sites');
      if (sitesRes.ok) {
        const data = await safeFetchJson(sitesRes);
        if (data?.sites) setIndustrialSites(data.sites);
      }

      // 3. Fetch Fire Stations
      const fsRes = await fetch('/api/fire-stations');
      if (fsRes.ok) {
        const data = await safeFetchJson(fsRes);
        if (data?.stations) setFireStations(data.stations);
      }

      // 4. Fetch Hospitals
      const hospRes = await fetch('/api/hospitals');
      if (hospRes.ok) {
        const data = await safeFetchJson(hospRes);
        if (data?.hospitals) setHospitals(data.hospitals);
      }

      // 5. Fetch Police Stations
      const polRes = await fetch('/api/police-stations');
      if (polRes.ok) {
        const data = await safeFetchJson(polRes);
        if (data?.stations) setPoliceStations(data.stations);
      }

      // 6. Fetch Ambulance Units
      const ambRes = await fetch('/api/ambulance-units');
      if (ambRes.ok) {
        const data = await safeFetchJson(ambRes);
        if (data?.ambulanceUnits) setAmbulanceUnits(data.ambulanceUnits);
      }
    } catch (err) {
      console.error('Failed to load initial GIS data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Automated Fire Detection Loop:
  // Prompt operator to confirm 3-responder dispatch when a confirmed fire is detected
  useEffect(() => {
    if (!isAutoCallArmed || events.length === 0) return;

    // Locate uncalled actual fire events
    const detectedFire = events.find(
      (e) => isActualFireEvent(e) && !autoCalledEventIds.has(e.id) && !autoCalledEventIds.has(e.eventId)
    );

    if (detectedFire) {
      // Mark as prompted to prevent loops
      setAutoCalledEventIds((prev) => new Set([...prev, detectedFire.id, detectedFire.eventId]));
      
      // Prompt operator with 3-responder confirmation modal (operator must explicitly authorize dispatch)
      setTargetEventForThreeDispatch(detectedFire);
    }
  }, [events, isAutoCallArmed, autoCalledEventIds]);

  // Trigger Emergency Call (Opens 3-Responder Selection & Explicit Authorization Modal)
  const handleTriggerEmergencyCall = (targetEvent: ThermalEvent) => {
    setTargetEventForThreeDispatch(targetEvent);
  };

  // Acknowledge call receipt for responder
  const handleAcknowledgeCall = async (role: any) => {
    if (!activeCallSession) return;
    try {
      const res = await fetch(`/api/emergency-call/${activeCallSession.sessionId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCallSession(data.session);
        setEmergencyCallSessions((prev) =>
          prev.map((s) => (s.sessionId === data.session.sessionId ? data.session : s))
        );
      }
    } catch (err) {
      console.error('Failed to acknowledge emergency call:', err);
    }
  };

  // Poll NASA FIRMS feed via backend
  const handleRefreshFirms = async (overrideMode?: 'LIVE' | 'DEMO') => {
    const targetMode = overrideMode || operationalMode;
    await fetchCorridorEvents(selectedRegion, targetMode);
  };

  const handleToggleMode = (newMode: 'LIVE' | 'DEMO') => {
    setOperationalMode(newMode);
    fetchCorridorEvents(selectedRegion, newMode);
  };

  // Simulate Dispatch workflow
  const handleSimulateDispatch = async (targetEvent: ThermalEvent) => {
    try {
      const res = await fetch(`/api/events/${targetEvent.id}/dispatch/simulate`, {
        method: 'POST'
      });
      if (res.ok) {
        const simData = await res.json();
        setActiveDispatch(simData);
        setShowDispatchModal(true);
      }
    } catch (err) {
      console.error('Failed to trigger simulated dispatch:', err);
    }
  };

  // Generate Official Incident Report
  const handleGenerateReport = async (targetEvent: ThermalEvent) => {
    try {
      const res = await fetch(`/api/reports/${targetEvent.id}`, {
        method: 'POST'
      });
      if (res.ok) {
        const reportData: IncidentReport = await res.json();
        setActiveReport(reportData);
        setReportsList((prev) => [reportData, ...prev.filter(r => r.reportNumber !== reportData.reportNumber)]);
        setShowReportModal(true);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  // Switch to temporal view for a specific event
  const handleViewTemporal = (targetEvent: ThermalEvent) => {
    setSelectedEvent(targetEvent);
    setActiveTab('history');
  };

  // Tactical ad-hoc point analysis when clicking anywhere on the GIS map (Truthful verification)
  const handleMapClick = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          regionName: `Coordinates [${lat.toFixed(3)}, ${lng.toFixed(3)}]`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.riskAssessment) {
          setCurrentRiskAssessment(data.riskAssessment);
        }
        if (data.fireDetected && data.event) {
          setEvents((prev) => [data.event, ...prev]);
          setSelectedEvent(data.event);
        } else {
          // Accurate, calm report: No active fire at coordinates
          setSelectedEvent(null);
        }
      }
    } catch (err) {
      console.error('Point analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeEventsCount = events.length;
  const criticalEventsCount = events.filter(e => e.itriRiskLevel === 'Critical').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans'] text-slate-100">
      {/* Top Tactical Command Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeEventsCount={activeEventsCount}
        criticalEventsCount={criticalEventsCount}
        activeCallSessionsCount={emergencyCallSessions.filter(s => s.overallStatus === 'CALLING_IN_PROGRESS').length}
        onRefreshFirms={() => handleRefreshFirms()}
        isLoading={isLoading}
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelectRegion}
        onAssessLocation={(assessment) => setCurrentRiskAssessment(assessment)}
        dataSourceNote={dataSourceNote}
        operationalMode={operationalMode}
        onToggleMode={handleToggleMode}
        lastUpdated={lastUpdated}
        systemStatus={systemStatus}
      />

      {/* RULE 35: Live Mode Failure Banner */}
      {liveModeError && (
        <div className="bg-red-950/90 border-b border-red-500/50 px-4 py-2 flex items-center justify-between gap-3 text-xs z-30 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-red-200 font-mono">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-red-300">LIVE MODE ERROR:</span>
            <span>{liveModeError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleMode('DEMO')}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
            >
              Switch to Demo Mode
            </button>
            <button onClick={() => setLiveModeError(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Emergency Active Call Notification Banner */}
      {actualFireAlertBanner && (
        <div className="bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 border-b border-red-500/50 px-4 py-2 flex items-center justify-between gap-3 text-xs z-30 animate-in slide-in-from-top duration-300 shadow-xl shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-full bg-red-600 animate-pulse text-white">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-red-300 uppercase tracking-wider font-mono shrink-0">
              🚨 ACTUAL FIRE CONFIRMED:
            </span>
            <span className="font-bold text-white truncate">
              {actualFireAlertBanner.session.detectedFireType} ({actualFireAlertBanner.session.facilityName || actualFireAlertBanner.session.locationName})
            </span>
            <span className="font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] shrink-0">
              [{actualFireAlertBanner.event.latitude.toFixed(4)}°N, {actualFireAlertBanner.event.longitude.toFixed(4)}°E]
            </span>
            <span className="hidden lg:inline-flex px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[11px] border border-red-500/30 shrink-0">
              Hotline: Fire (101) + Burn ICU (108) + Police (112)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveCallSession(actualFireAlertBanner.session);
                setShowCallModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 cursor-pointer transition-all"
            >
              <Volume2 className="w-3 h-3" />
              <span>View Call Screen</span>
            </button>
            <button
              onClick={() => setActualFireAlertBanner(null)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-hidden relative flex">
        {/* VIEW 1: GIS COMMAND CENTER (Map + Side Panel + Hotspots Ticker) */}
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden">
            {/* Map Area */}
            <div className="flex-1 relative flex flex-col h-full overflow-hidden">
              {/* Floating Truthful Fire Assessment Card on Map */}
              {currentRiskAssessment && (
                <div className="absolute top-3 right-3 max-w-lg z-20 pointer-events-auto">
                  <TruthfulFireReport 
                    assessment={currentRiskAssessment}
                    onDismiss={() => setCurrentRiskAssessment(null)}
                  />
                </div>
              )}

              <GisMap
                events={events}
                industrialSites={industrialSites}
                fireStations={fireStations}
                hospitals={hospitals}
                policeStations={policeStations}
                ambulanceUnits={ambulanceUnits}
                selectedEvent={selectedEvent}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                selectedRegion={selectedRegion}
                activeDispatch={activeDispatch}
                riskFilter={riskFilter}
                setRiskFilter={setRiskFilter}
                classificationFilter={classificationFilter}
                setClassificationFilter={setClassificationFilter}
                onMapClick={handleMapClick}
              />

              {/* Bottom Hotspots Ticker Strip */}
              <div className="h-16 bg-slate-950/95 border-t border-slate-800 flex items-center px-4 gap-3 overflow-x-auto shrink-0 z-20">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Orbital Hotspots:
                </span>
                <div className="flex items-center gap-2">
                  {events.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>No active fire hotspots detected in {selectedRegion.name} ({selectedRegion.radiusKm || 25}km radius).</span>
                      {currentRiskAssessment && (
                        <span className="text-slate-300 font-sans text-xs bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                          Occurrence Risk: <strong className="text-amber-300">{currentRiskAssessment.riskLevel}</strong> — {currentRiskAssessment.detailedReason.slice(0, 85)}...
                        </span>
                      )}
                    </div>
                  ) : (
                    events.map((evt) => {
                      const isSelected = selectedEvent?.id === evt.id;
                      const isCrit = evt.itriRiskLevel === 'Critical';
                      return (
                        <button
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isCrit ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                          <span className="font-semibold">{evt.classification || 'Hotspot'}</span>
                          <span className="font-mono text-amber-400 font-bold">{evt.frp} MW</span>
                          <span className="text-[10px] text-slate-500">ITRI {evt.itriScore}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Tactical Event Inspector Drawer */}
            {selectedEvent ? (
              <div className="w-full lg:w-[420px] xl:w-[460px] h-full shrink-0 border-l border-slate-800">
                <EventInspector
                  event={selectedEvent}
                  onClose={() => setSelectedEvent(null)}
                  onSimulateDispatch={handleSimulateDispatch}
                  onGenerateReport={handleGenerateReport}
                  onViewTemporal={handleViewTemporal}
                  onTriggerEmergencyCall={handleTriggerEmergencyCall}
                  activeCallSession={emergencyCallSessions.find(
                    (s) => s.eventId === selectedEvent.eventId || s.eventId === selectedEvent.id
                  )}
                  isDispatchActive={Boolean(activeDispatch && activeDispatch.eventId === selectedEvent.eventId)}
                  fireStations={fireStations}
                  hospitals={hospitals}
                  policeStations={policeStations}
                  ambulanceUnits={ambulanceUnits}
                />
              </div>
            ) : currentRiskAssessment ? (
              <div className="hidden lg:block w-[360px] xl:w-[400px] h-full shrink-0 border-l border-slate-800 p-4 bg-slate-900/50 overflow-y-auto">
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Location Risk Intelligence
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{currentRiskAssessment.locationName}</h3>
                </div>
                <TruthfulFireReport assessment={currentRiskAssessment} />
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW 2: TEMPORAL PERSISTENCE & HISTORY ENGINE */}
        {activeTab === 'history' && (
          <TemporalTimeline
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            onClose={() => setActiveTab('map')}
          />
        )}

        {/* VIEW 3: AI & ML ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <AnalyticsView events={events} />
        )}

        {/* VIEW 4: INCIDENT REPORTS ARCHIVE */}
        {activeTab === 'reports' && (
          <div className="w-full h-full bg-slate-900 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Official Incident Reports Archive
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated thermal verification documents generated for ERSS, DDMA, and state fire command
                </p>
              </div>

              {selectedEvent && (
                <button
                  onClick={() => handleGenerateReport(selectedEvent)}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  + Generate Report for Current Event
                </button>
              )}
            </div>

            {reportsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">No Incident Reports Generated Yet</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Select any thermal anomaly in the GIS Command Map and click "Generate Report" to generate an official verified intelligence report with PDF, JSON, and CSV exports.
                </p>
                {selectedEvent && (
                  <button
                    onClick={() => handleGenerateReport(selectedEvent)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Generate Report for {selectedEvent.classification} ({selectedEvent.eventId})
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportsList.map((rep) => (
                  <div key={rep.reportNumber} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">{rep.reportNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rep.riskAssessment.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {rep.riskAssessment.riskLevel} Risk
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{rep.classification.predictedClass}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {rep.event.latitude.toFixed(4)}°N, {rep.event.longitude.toFixed(4)}°E (FRP {rep.event.frp} MW)
                      </p>
                      <div className="text-xs text-slate-500 mt-2">
                        Facility: <span className="text-slate-300">{rep.event.nearestIndustrialSite?.name || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(rep.generatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => {
                          setActiveReport(rep);
                          setShowReportModal(true);
                        }}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                      >
                        View & Export
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: AUTOMATED EMERGENCY DISPATCH HOTLINE CENTER */}
        {activeTab === 'hotline' && (
          <EmergencyHotlineCenter
            sessions={emergencyCallSessions}
            onTriggerCallForEvent={handleTriggerEmergencyCall}
            onOpenSessionModal={(session) => {
              setActiveCallSession(session);
              setShowCallModal(true);
            }}
            activeEvents={events}
            isAutoCallArmed={isAutoCallArmed}
            onToggleAutoCallArmed={() => setIsAutoCallArmed((prev) => !prev)}
          />
        )}
      </main>

      {/* MODAL 1: Incident Report Print / Export View */}
      {showReportModal && (
        <IncidentReportModal
          report={activeReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* MODAL 2: Simulated Dispatch Center */}
      {showDispatchModal && selectedEvent && (
        <DispatchSimulator
          event={selectedEvent}
          dispatch={activeDispatch}
          onClose={() => setShowDispatchModal(false)}
          onCancelDispatch={() => {
            setActiveDispatch(null);
            setShowDispatchModal(false);
          }}
        />
      )}

      {/* MODAL 3: Real-Time Multi-Agency Emergency Call HUD (Fire + Doctors + Police) */}
      {showCallModal && activeCallSession && (
        <EmergencyCallModal
          session={activeCallSession}
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          onAcknowledgeCall={handleAcknowledgeCall}
        />
      )}

      {/* MODAL 4: 3-Responder Emergency Dispatch Console (Selection & Human Authorization) */}
      {targetEventForThreeDispatch && (
        <ThreeResponderDispatchModal
          incident={{
            incidentId: targetEventForThreeDispatch.id || targetEventForThreeDispatch.eventId,
            hotspotId: targetEventForThreeDispatch.id,
            locationName: targetEventForThreeDispatch.nearestIndustrialSite?.name || `Industrial Corridor [${targetEventForThreeDispatch.latitude.toFixed(2)}, ${targetEventForThreeDispatch.longitude.toFixed(2)}]`,
            latitude: targetEventForThreeDispatch.latitude,
            longitude: targetEventForThreeDispatch.longitude,
            risk: targetEventForThreeDispatch.itriRiskLevel,
            severity: targetEventForThreeDispatch.escalationLevel || targetEventForThreeDispatch.itriRiskLevel,
            classification: targetEventForThreeDispatch.classification,
            frp: targetEventForThreeDispatch.frp
          }}
          onClose={() => setTargetEventForThreeDispatch(null)}
          onDispatchInitiated={(dispatchId, calls, mode) => {
            const currentEvent = targetEventForThreeDispatch;
            setTargetEventForThreeDispatch(null);
            setActiveThreeDispatchTracker({
              dispatchId,
              calls,
              incidentId: currentEvent.id || currentEvent.eventId,
              locationName: currentEvent.nearestIndustrialSite?.name || 'Designated Industrial Zone',
              mode
            });
          }}
        />
      )}

      {/* MODAL 5: Live 3-Responder Dispatch Status Tracker HUD */}
      {activeThreeDispatchTracker && (
        <DispatchStatusTrackerModal
          dispatchId={activeThreeDispatchTracker.dispatchId}
          initialCalls={activeThreeDispatchTracker.calls}
          incidentId={activeThreeDispatchTracker.incidentId}
          locationName={activeThreeDispatchTracker.locationName}
          mode={activeThreeDispatchTracker.mode}
          onClose={() => setActiveThreeDispatchTracker(null)}
        />
      )}

      {/* DEVELOPER DEBUG PANEL (Real-Time Pipeline Telemetry HUD) */}
      <DeveloperDebugPanel
        selectedRegion={selectedRegion}
        totalFirmsRecords={totalFirmsRecords || events.length}
        filteredRecordsCount={events.length}
        selectedHotspot={selectedEvent}
        operationalMode={operationalMode}
        isStaleDetected={Boolean(
          selectedEvent &&
          calculateHaversineDistance(
            selectedRegion.latitude,
            selectedRegion.longitude,
            selectedEvent.latitude,
            selectedEvent.longitude
          ) > (selectedRegion.radiusKm + 15)
        )}
        onRefreshTelemetry={() => fetchCorridorEvents(selectedRegion, operationalMode)}
      />
    </div>
  );
}
