import React from 'react';
import { ThermalEvent, IncidentReport } from '../types.ts';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Flame, 
  ShieldAlert, 
  Building2, 
  Truck, 
  Users,
  Copy,
  Check
} from 'lucide-react';

interface IncidentReportModalProps {
  report: IncidentReport | null;
  onClose: () => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  report,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!report) return null;

  const event = report.event;
  const classification = report.classification;
  const risk = report.riskAssessment;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.reportNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCsv = () => {
    const headers = ['ReportID', 'EventID', 'Date', 'Time', 'Lat', 'Lon', 'Satellite', 'FRP_MW', 'BT_K', 'Classification', 'Confidence_Pct', 'ITRI_Score', 'Risk_Level', 'Population_3km', 'Nearest_Industrial_Facility'];
    const row = [
      report.reportNumber,
      event.eventId,
      event.acquisitionDate,
      event.acquisitionTime,
      event.latitude,
      event.longitude,
      event.satellite,
      event.frp,
      event.brightnessTemperature,
      `"${classification.predictedClass}"`,
      classification.confidence,
      risk.finalItri,
      risk.riskLevel,
      event.populationExposure?.radius3km || 0,
      `"${event.nearestIndustrialSite?.name || 'N/A'}"`
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `${report.reportNumber}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyText = () => {
    const text = `THERMOS INCIDENT DISPATCH REPORT\nReport: ${report.reportNumber}\nEvent: ${event.eventId} (${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)})\nClassification: ${classification.predictedClass} (${classification.confidence}% conf)\nITRI Risk: ${risk.riskLevel} (${risk.finalItri}/100)\nFRP: ${event.frp} MW | BT: ${event.brightnessTemperature} K\nNearest Facility: ${event.nearestIndustrialSite?.name || 'N/A'}\n3km Population Exposure: ${event.populationExposure?.radius3km || 0}\nDispatched Units: ${report.nearbyResources.fireStations[0]?.name || 'Fire Unit'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">THERMOS Official Incident Report</h3>
              <p className="text-[11px] font-mono text-slate-400">{report.reportNumber}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-mono ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-incident-report" className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                GOVERNMENT OF INDIA • DISASTER MANAGEMENT PROTOCOL
              </div>
              <h1 className="text-xl font-black text-white tracking-tight mt-0.5">
                THERMAL ANOMALY VERIFICATION & EMERGENCY INCIDENT INTELLIGENCE
              </h1>
              <p className="text-xs text-slate-400">
                Generated via THERMOS Satellite AI Platform (SIH26162) for ERSS & DDMA Decision Support
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs">
              <div className="text-slate-400">TIMESTAMP:</div>
              <div className="font-bold text-white">{new Date(report.generatedAt).toUTCString()}</div>
              <div className="text-emerald-400 font-semibold mt-0.5">VERIFIED SATELLITE DISPATCH</div>
            </div>
          </div>

          {/* Core Incident Telemetry Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">TARGET COORDINATES</span>
              <span className="font-mono font-bold text-white text-xs block mt-1">
                {event.latitude.toFixed(4)}°N, {event.longitude.toFixed(4)}°E
              </span>
              <span className="text-[10px] text-slate-500 font-mono">WGS-84 Ingest</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">AI CLASSIFICATION</span>
              <span className="font-bold text-orange-400 text-xs block mt-1">
                {classification.predictedClass}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{classification.confidence}% ML Confidence</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">RADIATIVE INTENSITY</span>
              <span className="font-mono font-bold text-amber-400 text-xs block mt-1">
                {event.frp} MW (FRP)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{event.brightnessTemperature} K (BT)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">ITRI RISK LEVEL</span>
              <span className="font-mono font-bold text-red-400 text-xs block mt-1">
                {risk.riskLevel} ({risk.finalItri}/100)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{event.escalationLevel} Escalation</span>
            </div>
          </div>

          {/* Section: Industrial Context & Nearby Assets */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Primary Industrial Facility at Risk:
            </h4>
            {event.nearestIndustrialSite ? (
              <div className="text-xs space-y-1">
                <div className="font-bold text-cyan-300">{event.nearestIndustrialSite.name}</div>
                <div className="text-slate-400">
                  Facility Type: <span className="text-slate-200">{event.nearestIndustrialSite.type}</span> | 
                  Distance from Anomaly: <span className="font-mono text-amber-400 font-bold">{event.nearestIndustrialSite.distanceKm} km</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">No major hazardous industrial site within 5km radius.</div>
            )}
          </div>

          {/* Section: Population Exposure Estimation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              Population Exposure & Civil Vulnerability:
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2 rounded bg-red-950/20 border border-red-500/20">
                <div className="text-[10px] text-red-400">1km Immediate Danger</div>
                <div className="font-mono font-bold text-white text-base">{(event.populationExposure?.radius1km || 0).toLocaleString()}</div>
              </div>
              <div className="p-2 rounded bg-orange-950/20 border border-orange-500/20">
                <div className="text-[10px] text-orange-400">3km Plume Inhalation Zone</div>
                <div className="font-mono font-bold text-white text-base">{(event.populationExposure?.radius3km || 0).toLocaleString()}</div>
              </div>
              <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20">
                <div className="text-[10px] text-amber-400">5km Outer Boundary</div>
                <div className="font-mono font-bold text-white text-base">{(event.populationExposure?.radius5km || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Section: Recommended Response Resources */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              Prioritized Emergency Response Deployment:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-blue-300 block">Designated Primary Fire Station</span>
                <div className="font-semibold text-white mt-1">{report.nearbyResources.fireStations[0]?.name || 'HQ Station'}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Distance: {report.nearbyResources.fireStations[0]?.distanceKm} km | ETA ~{report.nearbyResources.fireStations[0]?.estimatedArrivalMinutes} mins
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">Specialized: Chemical Foam & Hazmat Support</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-300 block">Designated Burn & Trauma Facility</span>
                <div className="font-semibold text-white mt-1">{report.nearbyResources.hospitals[0]?.name || 'District Hospital'}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Distance: {report.nearbyResources.hospitals[0]?.distanceKm} km | ETA ~{report.nearbyResources.hospitals[0]?.estimatedArrivalMinutes} mins
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">Equipped: Level 1 Trauma & Burn ICU</div>
              </div>
            </div>
          </div>

          {/* Section: Recommended Incident Commander Directives */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Automated Standard Operating Directives:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {report.recommendedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
