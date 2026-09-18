import React from 'react';
import { 
  ShieldCheck, 
  Flame, 
  AlertTriangle, 
  Satellite, 
  Compass, 
  Thermometer, 
  Wind, 
  Droplets, 
  Info,
  CheckCircle2,
  X
} from 'lucide-react';
import { LocationRiskAssessment } from '../types.ts';

interface TruthfulFireReportProps {
  assessment: LocationRiskAssessment | null;
  onDismiss?: () => void;
  onInspectCoordinates?: () => void;
  isCompact?: boolean;
}

export const TruthfulFireReport: React.FC<TruthfulFireReportProps> = ({
  assessment,
  onDismiss,
  onInspectCoordinates,
  isCompact = false
}) => {
  if (!assessment) return null;

  const isFire = assessment.fireDetected;
  const riskLevel = assessment.riskLevel;

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  if (isCompact) {
    return (
      <div 
        id="truthful-fire-report-compact"
        className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-lg transition-all ${
          isFire 
            ? 'bg-red-950/70 border-red-700/60 text-red-100' 
            : riskLevel === 'MODERATE'
              ? 'bg-slate-900/90 border-amber-500/40 text-slate-200'
              : 'bg-slate-900/90 border-emerald-500/40 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isFire ? (
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 shrink-0 animate-pulse">
              <Flame className="w-4 h-4" />
            </div>
          ) : (
            <div className={`p-1.5 rounded-lg shrink-0 ${
              riskLevel === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white truncate max-w-[180px]">
                {assessment.locationName}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getRiskBadgeColor(riskLevel)}`}>
                {isFire ? 'ACTIVE FIRE DETECTED' : `${riskLevel} OCCURRENCE RISK`}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate max-w-[340px] sm:max-w-[480px]">
              {assessment.detailedReason}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      id="truthful-fire-report-card"
      className={`rounded-xl border p-4 shadow-xl text-xs transition-all ${
        isFire 
          ? 'bg-red-950/80 border-red-700 text-red-100' 
          : 'bg-slate-900/95 border-slate-800 text-slate-200 backdrop-blur-md'
      }`}
    >
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-start gap-3">
          {isFire ? (
            <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 shrink-0 animate-pulse">
              <Flame className="w-6 h-6" />
            </div>
          ) : (
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              riskLevel === 'MODERATE' 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-cyan-400" />
                {assessment.locationName}
              </h3>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border uppercase tracking-wider ${getRiskBadgeColor(riskLevel)}`}>
                {isFire ? '🚨 Active Satellite Fire' : `🛡️ ${riskLevel} Occurrence Risk`}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
              <Compass className="w-3 h-3 text-slate-500" />
              {assessment.latitude.toFixed(4)}°N, {assessment.longitude.toFixed(4)}°E (Radius: {assessment.radiusKm} km)
            </p>
          </div>
        </div>

        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss report"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Status Headline & Specific Factual Reason */}
      <div className="my-3 space-y-2">
        <div className="flex items-center gap-2">
          {isFire ? (
            <span className="text-red-400 font-bold text-xs flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {assessment.headline}
            </span>
          ) : (
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {assessment.headline}
            </span>
          )}
        </div>

        {/* Detailed Truthful Reason Box */}
        <div className={`p-3 rounded-lg border leading-relaxed text-xs ${
          isFire
            ? 'bg-red-900/30 border-red-700/50 text-red-200'
            : riskLevel === 'MODERATE'
              ? 'bg-amber-950/20 border-amber-600/30 text-slate-300'
              : 'bg-emerald-950/20 border-emerald-600/30 text-slate-300'
        }`}>
          <div className="flex items-start gap-2">
            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${
              isFire ? 'text-red-400' : riskLevel === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <div>
              <span className="font-semibold text-white block mb-0.5">
                {isFire ? 'Radiometric Satellite Confirmation:' : 'Evidence-Based Occurrence Assessment:'}
              </span>
              <span>{assessment.detailedReason}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Satellite Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[10px]">Overpass Sensors:</span>
          <span className="font-semibold text-cyan-300 truncate block">VIIRS / Meteosat-11</span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[10px] flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-amber-400" />
            Ambient Ground:
          </span>
          <span className="font-semibold text-slate-200">
            {assessment.atmosphericFactors.ambientTempEstC.toFixed(1)}°C
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[10px] flex items-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            Relative Humidity:
          </span>
          <span className="font-semibold text-slate-200">
            {assessment.atmosphericFactors.relativeHumidityEstPct}%
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[10px] flex items-center gap-1">
            <Wind className="w-3 h-3 text-indigo-400" />
            Max Rad. Power:
          </span>
          <span className={`font-semibold ${isFire ? 'text-red-400' : 'text-slate-400'}`}>
            {assessment.satelliteTelemetrySummary.maxFrpDetected > 0 
              ? `${assessment.satelliteTelemetrySummary.maxFrpDetected.toFixed(1)} MW` 
              : '0.0 MW (Baseline)'}
          </span>
        </div>
      </div>

      {onInspectCoordinates && (
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onInspectCoordinates}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Satellite className="w-3.5 h-3.5" />
            Center Satellite View on Coordinates
          </button>
        </div>
      )}
    </div>
  );
};
