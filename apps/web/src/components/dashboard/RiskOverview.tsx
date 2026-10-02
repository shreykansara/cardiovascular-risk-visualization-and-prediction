/**
 * Vessel Risk Matrix Overview (AuraCor DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Flame, HeartPulse, LocateFixed } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import type { RiskTier, TargetPrediction } from '../../types/clinical';

export const RiskOverview: React.FC = () => {
  const { analysis, activeVesselFocus, setVesselFocus } = usePatientStore();
  const predictions = analysis?.predictions;

  if (!predictions) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card h-28 animate-pulse p-4 rounded-xl" />
        ))}
      </div>
    );
  }

  const items: { key: string; pred: TargetPrediction; nodeName: string; desc: string }[] = [
    {
      key: 'cad',
      pred: predictions.overall_cad,
      nodeName: 'default',
      desc: 'Overall CAD Status',
    },
    {
      key: 'lad',
      pred: predictions.vessels.lad,
      nodeName: 'vessel_LAD',
      desc: 'Anterior Myocardium & Apex',
    },
    {
      key: 'lcx',
      pred: predictions.vessels.lcx,
      nodeName: 'vessel_LCX',
      desc: 'Lateral & Posterolateral LV',
    },
    {
      key: 'rca',
      pred: predictions.vessels.rca,
      nodeName: 'vessel_RCA',
      desc: 'Right Ventricle & Inferior Wall',
    },
  ];

  const getTierBadge = (tier: RiskTier) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 animate-pulse">
            <Flame className="w-3 h-3" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> HIGH
          </span>
        );
      case 'BORDERLINE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            BORDERLINE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> OPTIMAL
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 p-3 md:p-4 select-none">
      {items.map(({ key, pred, nodeName, desc }) => {
        const isFocused = activeVesselFocus === nodeName;
        const probPercent = (pred.probability * 100).toFixed(1);
        const thresholdPercent = (pred.optimal_threshold * 100).toFixed(0);

        return (
          <div
            key={key}
            onClick={() => setVesselFocus(nodeName)}
            className={`glass-card p-4 rounded-xl cursor-pointer relative overflow-hidden transition-all duration-200 ${
              isFocused
                ? 'border-cyan-500/80 shadow-glow-cyan bg-slate-800/90'
                : 'hover:border-slate-600'
            }`}
          >
            {/* Top Bar: Target & Tier Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: pred.color_hex }}
                  />
                  {pred.target}
                </span>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{desc}</p>
              </div>
              {getTierBadge(pred.risk_tier)}
            </div>

            {/* Probability Percentage */}
            <div className="flex items-baseline justify-between my-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {probPercent}
                <span className="text-sm text-slate-400 font-normal">%</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Cutoff: <span className="text-slate-200">{thresholdPercent}%</span>
              </span>
            </div>

            {/* Calibrated Risk Track */}
            <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
              {/* Decision threshold indicator tick */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10"
                style={{ left: `${pred.optimal_threshold * 100}%` }}
                title={`Clinical Cutoff: ${thresholdPercent}%`}
              />
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, pred.probability * 100)}%`,
                  backgroundColor: pred.color_hex,
                  boxShadow: `0 0 10px ${pred.color_hex}80`,
                }}
              />
            </div>

            {/* Bottom Actions: View in 3D */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
              <span className="flex items-center gap-1">
                {pred.stenosis_suspected ? (
                  <span className="text-rose-400 font-medium font-mono text-[10px]">STENOSIS DETECTED</span>
                ) : (
                  <span className="text-emerald-400 font-medium font-mono text-[10px]">PATENT / NORMAL</span>
                )}
              </span>
              <button
                type="button"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                <span>Inspect</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
