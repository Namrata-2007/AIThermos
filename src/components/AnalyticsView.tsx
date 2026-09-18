import React from 'react';
import { ThermalEvent, ModelEvaluationMetrics } from '../types.ts';
import { THERMOS_ML_EVALUATION_METRICS } from '../services/mlEngine.ts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  ShieldAlert, 
  Cpu, 
  CheckCircle, 
  Activity, 
  Database,
  Flame,
  Users
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

interface AnalyticsViewProps {
  events: ThermalEvent[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ events }) => {
  const metrics = THERMOS_ML_EVALUATION_METRICS;

  // Real computed stats from current ingested events
  const totalEvents = events.length;
  const industrialFires = events.filter(e => e.classification === 'Industrial Fire').length;
  const persistentSources = events.filter(e => e.classification === 'Persistent Industrial Thermal Source' || e.isRecurringSource).length;
  const criticalRisk = events.filter(e => e.itriRiskLevel === 'Critical').length;
  const totalPopExposed = events.reduce((acc, e) => acc + (e.populationExposure?.radius3km || 0), 0);

  // Classification breakdown
  const classificationCounts: Record<string, number> = {};
  events.forEach((e) => {
    const cls = e.classification || 'Other';
    classificationCounts[cls] = (classificationCounts[cls] || 0) + 1;
  });
  const classificationData = Object.entries(classificationCounts).map(([name, count]) => ({
    name,
    count
  }));

  // Risk distribution
  const riskCounts = [
    { name: 'Critical (75-100)', count: events.filter(e => e.itriRiskLevel === 'Critical').length, color: '#ef4444' },
    { name: 'High (50-74)', count: events.filter(e => e.itriRiskLevel === 'High').length, color: '#f97316' },
    { name: 'Moderate (25-49)', count: events.filter(e => e.itriRiskLevel === 'Moderate').length, color: '#eab308' },
    { name: 'Low (0-24)', count: events.filter(e => e.itriRiskLevel === 'Low').length, color: '#22c55e' }
  ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#3b82f6', '#8b5cf6'];

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/40">
            VALIDATED BENCHMARK EVALUATION
          </span>
          <span className="text-xs text-slate-400">Section 14 & 35 Transparency Report</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          Analytics & AI Classification Model Benchmarks
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Stratified evaluation across NASA FIRMS active detections, Sentinel-2 spectral indices, and PostGIS industrial geometries
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Active Events</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{totalEvents}</span>
          <span className="text-[11px] text-slate-500">Real-time VIIRS/MODIS passes</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Industrial Fires</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{industrialFires}</span>
          <span className="text-[11px] text-red-500/80">Confirmed industrial hazards</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Persistent Sources</span>
          <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">{persistentSources}</span>
          <span className="text-[11px] text-slate-500">Refinery flares & furnaces</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Critical ITRI Events</span>
          <span className="text-2xl font-black font-mono text-orange-400 mt-1 block">{criticalRisk}</span>
          <span className="text-[11px] text-orange-500/80">Emergency triage required</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-400 block">Population in 3km Zone</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
            {totalPopExposed.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">Exposure estimate</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Events by Classification Bar Chart */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-200 block">
            Active Detections by AI Classification
          </span>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classificationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]}>
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-200 block">
            ITRI Risk Tier Distribution (0–100)
          </span>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskCounts}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {riskCounts.map((entry, index) => (
                    <Cell key={`cell-risk-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ML Model Evaluation Section (Actual Stratified Benchmark) */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">{metrics.modelName}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tested on {metrics.totalSamples} geographically separated FIRMS/S2 validation points
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              <span className="text-slate-400">Accuracy: </span>
              <span className="font-bold text-emerald-400">{metrics.overallAccuracy}%</span>
            </div>
            <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              <span className="text-slate-400">Macro F1: </span>
              <span className="font-bold text-cyan-400">{metrics.macroF1}%</span>
            </div>
            <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              <span className="text-slate-400">Weighted F1: </span>
              <span className="font-bold text-purple-400">{metrics.weightedF1}%</span>
            </div>
          </div>
        </div>

        {/* Confusion Matrix Table */}
        <div>
          <span className="text-xs font-bold text-slate-300 block mb-2">
            Confusion Matrix (Rows: Ground Truth Label | Columns: Predicted Label)
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <th className="p-2 text-left">Ground Truth</th>
                  {metrics.confusionMatrix.classes.map((cls, idx) => (
                    <th key={idx} className="p-2 text-center text-[10px] max-w-[80px] truncate" title={cls}>
                      {cls.slice(0, 10)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.confusionMatrix.matrix.map((row, rowIdx) => {
                  const actualClass = metrics.confusionMatrix.classes[rowIdx];
                  return (
                    <tr key={rowIdx} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                      <td className="p-2 font-semibold text-slate-200 whitespace-nowrap">
                        {actualClass}
                      </td>
                      {row.map((val, colIdx) => {
                        const isDiagonal = rowIdx === colIdx;
                        return (
                          <td 
                            key={colIdx} 
                            className={`p-2 text-center font-bold ${isDiagonal ? 'bg-emerald-500/10 text-emerald-400' : val > 0 ? 'text-amber-400/80' : 'text-slate-600'}`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Importance Table */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-300 block mb-2">
            Global Feature Importance (Gini Impurity / Gain)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {metrics.featureImportance.map((feat, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">{feat.feature}</span>
                  <span className="text-[10px] text-slate-400 block">Category: {feat.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400">{(feat.importance * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
