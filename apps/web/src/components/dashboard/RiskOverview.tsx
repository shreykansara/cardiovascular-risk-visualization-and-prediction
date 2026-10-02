/**
 * Vessel Risk Matrix Overview (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Flame, LocateFixed } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import type { RiskTier, TargetPrediction } from '../../types/clinical';

export const RiskOverview: React.FC = () => {
  const { analysis, activeVesselFocus, setVesselFocus } = usePatientStore();
  const predictions = analysis?.predictions;

  if (!predictions) {
    return (
      <div className="grid grid-cols-2 gap-2.5 p-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card h-32 animate-pulse p-4 rounded-xl" />
        ))}
      </div>
    );
  }

  const items: {
    key: string;
    pred: TargetPrediction;
    nodeName: string;
    shortLabel: string;
    desc: string;
  }[] = [
    {
      key: 'cad',
      pred: predictions.overall_cad,
      nodeName: 'default',
      shortLabel: 'Overall CAD',
      desc: 'Multivessel Coronary Disease',
    },
    {
      key: 'lad',
      pred: predictions.vessels.lad,
      nodeName: 'vessel_LAD',
      shortLabel: 'LAD Artery',
      desc: 'Anterior Myocardium & Apex',
    },
    {
      key: 'lcx',
      pred: predictions.vessels.lcx,
      nodeName: 'vessel_LCX',
      shortLabel: 'LCX Artery',
      desc: 'Lateral & Posterolateral LV',
    },
    {
      key: 'rca',
      pred: predictions.vessels.rca,
      nodeName: 'vessel_RCA',
      shortLabel: 'RCA Artery',
      desc: 'Right Ventricle & Inferior Wall',
    },
  ];

  const getTierBadge = (tier: RiskTier) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 shrink-0">
            <Flame className="w-2.5 h-2.5" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 shrink-0">
            <AlertCircle className="w-2.5 h-2.5" /> HIGH
          </span>
        );
      case 'BORDERLINE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
            BORDERLINE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5" /> OPTIMAL
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 p-3 select-none">
      {items.map(({ key, pred, nodeName, shortLabel, desc }) => {
        const isFocused = activeVesselFocus === nodeName;
        const probPercent = (pred.probability * 100).toFixed(1);
        const thresholdPercent = (pred.optimal_threshold * 100).toFixed(0);

        return (
          <div
            key={key}
            onClick={() => setVesselFocus(nodeName)}
            className={`glass-card p-3 rounded-xl cursor-pointer relative overflow-hidden transition-all duration-200 flex flex-col justify-between ${
              isFocused
                ? 'border-cyan-500/90 shadow-glow-cyan bg-slate-800/90 ring-1 ring-cyan-500/40'
                : 'hover:border-slate-600 bg-surface-2/60'
            }`}
          >
            {/* Top Row: Vessel short code badge + Full anatomical label + Risk Tier Badge */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 border border-slate-700/80 text-cyan-300 shrink-0">
                  {pred.target}
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate" title={desc}>
                  {shortLabel}
                </span>
              </div>
              {getTierBadge(pred.risk_tier)}
            </div>

            {/* Middle Row: Large probability percentage and Cutoff stacked vertically */}
            <div className="my-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-bold text-white tracking-tight">
                  {probPercent}
                </span>
                <span className="text-xs font-mono text-slate-400 font-medium">%</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="text-slate-500">Cutoff:</span>
                <span className="text-slate-300 font-semibold">{thresholdPercent}%</span>
              </div>
            </div>

            {/* Dedicated Progress Bar with Visible Vertical Cutoff Tick */}
            <div className="relative w-full h-2 rounded-full bg-slate-950 border border-slate-800/90 my-2 overflow-hidden">
              {/* Vertical Tick for Decision Cutoff */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-sm z-10 -ml-0.5 opacity-90"
                style={{ left: `${pred.optimal_threshold * 100}%` }}
                title={`Decision Threshold Cutoff: ${thresholdPercent}%`}
              />
              {/* Risk Bar Fill */}
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, pred.probability * 100)}%`,
                  backgroundColor: pred.color_hex,
                  boxShadow: `0 0 8px ${pred.color_hex}60`,
                }}
              />
            </div>

            {/* Bottom Row: Clinical Status Indicator & Styled Focus Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] font-bold tracking-tight">
                {pred.stenosis_suspected ? (
                  <span className="text-rose-400">STENOSIS</span>
                ) : (
                  <span className="text-emerald-400">PATENT</span>
                )}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setVesselFocus(isFocused ? 'default' : nodeName);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 transition-all ${
                  isFocused
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700/60'
                }`}
              >
                <LocateFixed className="w-2.5 h-2.5" />
                <span>{isFocused ? 'Active' : 'Focus Artery'}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
