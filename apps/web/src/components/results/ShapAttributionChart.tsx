/**
 * TreeSHAP Feature Attribution Horizontal Bar Chart (Task 4.7)
 * Displays top 8 contributing features for selected vessel target,
 * with distinct positive (risk increasing) and negative (risk decreasing) colors,
 * and shows each feature's actual patient measurement.
 */

import React from 'react';
import type { VesselExplanation } from '../../types/clinical';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface ShapAttributionChartProps {
  explanation?: VesselExplanation;
  targetName: string;
}

export const ShapAttributionChart: React.FC<ShapAttributionChartProps> = ({
  explanation,
  targetName,
}) => {
  if (!explanation || !explanation.top_features || explanation.top_features.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-slate-400 text-xs">
        No SHAP attribution data available for {targetName}.
      </div>
    );
  }

  // Take top 8 features
  const top8 = explanation.top_features.slice(0, 8);
  const maxAbs = Math.max(...top8.map((f) => Math.abs(f.shap_value)), 0.01);

  return (
    <div className="flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Key Feature Attributions (TreeSHAP)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {targetName} Target
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Baseline log-odds: {explanation.base_value?.toFixed(3) ?? '0.000'} | Calibrated impact vectors
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Increases Risk (+)</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
            <span>Decreases Risk (-)</span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart (Task 4.7) */}
      <div className="flex flex-col gap-2.5 mt-1">
        {top8.map((feat, idx) => {
          const isIncrease = feat.impact === 'INCREASES_RISK' || feat.shap_value > 0;
          const barPct = Math.min(100, Math.max(8, (Math.abs(feat.shap_value) / maxAbs) * 100));

          return (
            <div
              key={feat.feature_name || idx}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04] flex flex-col gap-1.5 hover:border-white/[0.1] transition-all"
            >
              {/* Feature Title & Patient Value */}
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-medium text-slate-200 truncate">
                  {feat.clinical_label || feat.feature_name}
                </span>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="text-slate-400">
                    Patient value:{' '}
                    <strong className="text-slate-100">
                      {String(feat.feature_value || '')}
                    </strong>
                  </span>
                  <span
                    className={`font-semibold ${
                      isIncrease ? 'text-rose-400' : 'text-cyan-400'
                    }`}
                  >
                    {isIncrease ? '+' : ''}
                    {feat.shap_value.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Proportional Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex items-center">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isIncrease
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  }`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShapAttributionChart;
