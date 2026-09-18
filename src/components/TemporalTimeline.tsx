import React, { useState } from 'react';
import { ThermalEvent } from '../types.ts';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

interface TemporalTimelineProps {
  events: ThermalEvent[];
  selectedEvent: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent) => void;
  onClose: () => void;
}

export const TemporalTimeline: React.FC<TemporalTimelineProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onClose
}) => {
  const activeEvent = selectedEvent || events[0];
  const [sliderIndex, setSliderIndex] = useState<number>(6); // 0 to 6 (T-6 to T0)

  // Generate historical passes data for chart
  const timeSeriesData = [
    { pass: 'T-6 Days', date: 'Sep 10', frp: Math.max(8, activeEvent.frp * 0.12), bt: 308, baseline: 15, status: 'Baseline' },
    { pass: 'T-5 Days', date: 'Sep 11', frp: Math.max(10, activeEvent.frp * 0.15), bt: 310, baseline: 15, status: 'Baseline' },
    { pass: 'T-4 Days', date: 'Sep 12', frp: Math.max(9, activeEvent.frp * 0.14), bt: 309, baseline: 15, status: 'Baseline' },
    { pass: 'T-3 Days', date: 'Sep 13', frp: Math.max(12, activeEvent.frp * 0.20), bt: 312, baseline: 15, status: 'Normal Op' },
    { pass: 'T-2 Days', date: 'Sep 14', frp: Math.max(15, activeEvent.frp * 0.32), bt: 319, baseline: 15, status: 'Elevated' },
    { pass: 'T-24 Hrs', date: 'Sep 15', frp: Math.max(28, activeEvent.frp * 0.55), bt: 335, baseline: 15, status: 'Thermal Spike' },
    { pass: 'T0 (Now)', date: 'Sep 16', frp: activeEvent.frp, bt: activeEvent.brightnessTemperature, baseline: 15, status: activeEvent.escalationLevel }
  ];

  const currentScrubPoint = timeSeriesData[sliderIndex];

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/40">
              TEMPORAL ENGINE v2.4
            </span>
            <span className="text-xs text-slate-400">Section 16 Multi-Pass Analysis</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Thermal History & Temporal Persistence Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detecting sudden thermal escalation vs multi-day industrial persistence and festival anomalies
          </p>
        </div>

        {/* Event selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Event:</span>
          <select
            value={activeEvent.id}
            onChange={(e) => {
              const found = events.find(ev => ev.id === e.target.value);
              if (found) onSelectEvent(found);
            }}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.classification} ({ev.frp} MW, {ev.acquisitionDate})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Event Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Behavioral Verdict</span>
          <span className={`text-base font-extrabold block mt-0.5 ${
            activeEvent.escalationLevel === 'CRITICAL' ? 'text-red-400' :
            activeEvent.isRecurringSource ? 'text-cyan-400' : 'text-amber-400'
          }`}>
            {activeEvent.escalationLevel === 'CRITICAL' ? 'CRITICAL ESCALATION' :
             activeEvent.isRecurringSource ? 'PERSISTENT THERMAL SOURCE' : 'EPHEMERAL ANOMALY'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {activeEvent.persistenceHours > 24 ? `${(activeEvent.persistenceHours / 24).toFixed(0)} days continuous history` : `${activeEvent.persistenceHours} hrs active`}
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">FRP Growth Velocity</span>
          <span className={`text-base font-extrabold block mt-0.5 ${activeEvent.frpTrendDelta > 50 ? 'text-red-400' : 'text-slate-200'}`}>
            {activeEvent.frpTrendDelta > 0 ? '+' : ''}{activeEvent.frpTrendDelta}%
          </span>
          <span className="text-[11px] text-slate-500">vs 7-day orbital rolling baseline</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Satellite Overpass Matches</span>
          <span className="text-base font-extrabold text-white block mt-0.5">
            {activeEvent.eventsInLast7d} <span className="text-xs font-normal text-slate-400">in last 7 days</span>
          </span>
          <span className="text-[11px] text-slate-500">{activeEvent.eventsInLast30d} passes in 30 days</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Context Guard</span>
          <span className="text-base font-extrabold text-white block mt-0.5">
            {activeEvent.isSpecialEventContext ? 'Festival / Non-Industrial' : 'Industrial Operational'}
          </span>
          <span className="text-[11px] text-slate-500">
            {activeEvent.isSpecialEventContext ? 'Pyrotechnic anomaly filtered' : 'Standard facility zone'}
          </span>
        </div>
      </div>

      {/* Interactive Time Slider / Orbital Passes Scrubbing */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Orbital Overpass Time-Slider</span>
          </div>
          <div className="text-xs font-mono text-amber-400">
            Current Position: <span className="font-bold">{currentScrubPoint.pass} ({currentScrubPoint.date})</span>
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="0"
          max="6"
          step="1"
          value={sliderIndex}
          onChange={(e) => setSliderIndex(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />

        <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
          {timeSeriesData.map((pt, idx) => (
            <button
              key={idx}
              onClick={() => setSliderIndex(idx)}
              className={`hover:text-amber-400 transition-colors ${idx === sliderIndex ? 'text-amber-400 font-bold' : ''}`}
            >
              {pt.pass}
            </button>
          ))}
        </div>

        {/* Current Scrubbing Point Telemetry */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-2 rounded bg-slate-900">
            <span className="text-slate-400 text-[10px] block">Observed FRP at Step</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{currentScrubPoint.frp.toFixed(1)} MW</span>
          </div>
          <div className="p-2 rounded bg-slate-900">
            <span className="text-slate-400 text-[10px] block">Brightness Temp</span>
            <span className="font-mono font-bold text-orange-400 text-sm">{currentScrubPoint.bt.toFixed(1)} K</span>
          </div>
          <div className="p-2 rounded bg-slate-900">
            <span className="text-slate-400 text-[10px] block">Thermal Status</span>
            <span className="font-mono font-bold text-slate-200 text-sm">{currentScrubPoint.status}</span>
          </div>
        </div>
      </div>

      {/* FRP vs Normal Industrial Baseline Time Series Chart */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-orange-400" />
            Fire Radiative Power (MW) vs Normal Industrial Baseline
          </span>
          <span className="text-[11px] text-slate-400 font-mono">VIIRS / MODIS Calibrated</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="pass" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit=" MW" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <ReferenceLine y={15} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Normal Baseline (15 MW)', fill: '#60a5fa', fontSize: 10 }} />
              <Line 
                type="monotone" 
                dataKey="frp" 
                stroke="#f97316" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#f97316' }} 
                activeDot={{ r: 8, stroke: '#ffffff' }}
                name="Observed FRP (MW)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
