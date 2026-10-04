/**
 * Local TreeSHAP Feature Attribution Waterfall Chart (Perfusion3D Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3 } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import type { TargetVessel } from '../../types/clinical';

export const ShapWaterfall: React.FC = () => {
  const { analysis, activeVesselFocus, setVesselFocus } = usePatientStore();
  const [selectedTarget, setSelectedTarget] = useState<TargetVessel>('LAD');

  // Sync internal selected target with 3D camera focus if a vessel is active
  React.useEffect(() => {
    if (activeVesselFocus === 'vessel_LAD') setSelectedTarget('LAD');
    else if (activeVesselFocus === 'vessel_LCX') setSelectedTarget('LCX');
    else if (activeVesselFocus === 'vessel_RCA') setSelectedTarget('RCA');
    else if (activeVesselFocus === 'default') setSelectedTarget('CAD');
  }, [activeVesselFocus]);

  const explanations = analysis?.explanations;
  const currentExp = explanations ? explanations[selectedTarget.toLowerCase()] : null;

  if (!currentExp) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-80 flex flex-col items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Computing TreeSHAP local attributions...</span>
      </div>
    );
  }

  // Calculate maximum absolute SHAP value for scaling bars proportionately
  const maxAbsShap = Math.max(
    ...currentExp.top_features.map((f) => Math.abs(f.shap_value)),
    0.05
  );

  const targetsList: TargetVessel[] = ['CAD', 'LAD', 'LCX', 'RCA'];

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full select-none">
      {/* Header & Target Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white tracking-tight uppercase font-mono">
              Explainable AI // TreeSHAP Local Drivers
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Key physiological factor contributions for {currentExp.display_name}
          </p>
        </div>

        {/* Target Tabs */}
        <div className="flex items-center gap-1 bg-surface-2/80 p-1 rounded-xl border border-slate-700/50">
          {targetsList.map((t) => {
            const isTabActive = selectedTarget === t;
            return (
              <button
                key={t}
                onClick={() => {
                  setSelectedTarget(t);
                  const nodeMap: Record<TargetVessel, string> = {
                    CAD: 'default',
                    LAD: 'vessel_LAD',
                    LCX: 'vessel_LCX',
                    RCA: 'vessel_RCA',
                  };
                  setVesselFocus(nodeMap[t]);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  isTabActive
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Baseline vs Predicted Risk Header */}
      <div className="grid grid-cols-2 gap-3 my-3 p-3 rounded-xl bg-surface-2/60 border border-slate-800 font-mono text-xs">
        <div>
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
            Population Baseline (&phi;₀)
          </span>
          <div className="text-base font-bold text-slate-200 mt-0.5">
            {(currentExp.base_value * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
            Patient Predicted Risk
          </span>
          <div className="text-base font-bold text-cyan-400 mt-0.5 flex items-center gap-1">
            <span>{(currentExp.predicted_probability * 100).toFixed(1)}%</span>
            {currentExp.predicted_probability > currentExp.base_value ? (
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* Clean Executive Horizontal Divergent Bar Chart */}
      <div className="space-y-2.5 overflow-y-auto pr-2 flex-1 max-h-[380px] custom-scrollbar">
        {currentExp.top_features.map((item, idx) => {
          const isRiskElevating = item.impact === 'INCREASES_RISK';
          const barWidthPercent = Math.min(100, (Math.abs(item.shap_value) / maxAbsShap) * 100);

          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-surface-2/40 hover:bg-surface-2/80 border border-slate-800/80 transition-all text-xs"
            >
              {/* Feature Title & Observed Clinical Value */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 text-xs truncate pr-2">
                  {item.clinical_label}
                </span>
                <span className="text-slate-400 font-mono shrink-0 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  Value: <strong className="text-slate-200">{item.feature_value}</strong>
                </span>
              </div>

              {/* Horizontal Divergent Bar with Center Zero-Axis */}
              <div className="flex items-center gap-1.5 h-5 bg-slate-950/80 rounded-lg p-1 border border-slate-800/70">
                {/* Left Side: Risk Decreasing (Protective) */}
                <div className="flex-1 flex justify-end items-center h-full">
                  {!isRiskElevating && (
                    <div
                      className="h-3 rounded-l-full bg-slate-500 transition-all duration-300 shadow-sm"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  )}
                </div>

                {/* Center Zero-Axis Line */}
                <div className="w-0.5 h-full bg-slate-600 shrink-0" />

                {/* Right Side: Risk Increasing (Elevating) */}
                <div className="flex-1 flex justify-start items-center h-full">
                  {isRiskElevating && (
                    <div
                      className="h-3 rounded-r-full bg-blue-600 transition-all duration-300 shadow-sm"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  )}
                </div>

                {/* Fixed Monospace Absolute Impact Value Tag on Far Right */}
                <div className="w-14 text-right shrink-0">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isRiskElevating ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {item.shap_value > 0
                      ? `+${item.shap_value.toFixed(3)}`
                      : item.shap_value.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divergence Legend Footer */}
      <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-[10px] text-slate-300">Protective (&minus;)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-[10px] text-slate-300">Elevates Risk (+)</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500">TreeSHAP Additive Sum</span>
      </div>
    </div>
  );
};
