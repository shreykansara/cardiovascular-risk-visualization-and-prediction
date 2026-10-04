/**
 * TreeSHAP Feature Attribution Horizontal Bar Chart (Task 4.7, Phase C)
 * Displays top 8 contributing features for selected vessel target,
 * with clean clinical blue (risk increasing) and neutral gray (risk decreasing) bars.
 */

import React from 'react';
import type { VesselExplanation } from '../../types/clinical';

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
      <div className="p-6 rounded-md bg-[#131a26] border border-[#283548] text-center text-slate-400 text-xs">
        No SHAP attribution data available for {targetName}.
      </div>
    );
  }

  // Take top 8 features
  const top8 = explanation.top_features.slice(0, 8);
  const maxAbs = Math.max(...top8.map((f) => Math.abs(f.shap_value)), 0.01);

  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-md bg-[#131a26] border border-[#283548]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#283548] pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Key Feature Attributions (TreeSHAP)</span>
            <span className="text-[11px] font-mono-numbers px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
              {targetName} Target
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono-numbers mt-0.5">
            Baseline log-odds: {explanation.base_value?.toFixed(3) ?? '0.000'} | Calibrated impact vectors
          </p>
        </div>

        {/* Legend: Clinical Blue (+) and Neutral Gray (-) */}
        <div className="flex items-center gap-3 text-[11px] font-mono-numbers shrink-0">
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            <span>Increases Risk (+)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
            <span>Decreases Risk (-)</span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="flex flex-col gap-2 mt-1">
        {top8.map((feat, idx) => {
          const isIncrease = feat.impact === 'INCREASES_RISK' || feat.shap_value > 0;
          const barPct = Math.min(100, Math.max(8, (Math.abs(feat.shap_value) / maxAbs) * 100));

          return (
            <div
              key={feat.feature_name || idx}
              className="p-2.5 rounded bg-[#0b0f17] border border-[#283548] flex flex-col gap-1.5 hover:border-[#384961] transition-colors"
            >
              {/* Feature Title & Patient Value */}
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-medium text-slate-200 truncate">
                  {feat.clinical_label || feat.feature_name}
                </span>

                <div className="flex items-center gap-2 shrink-0 font-mono-numbers text-[11px]">
                  <span className="text-slate-400">
                    Patient value:{' '}
                    <strong className="text-slate-100">
                      {String(feat.feature_value || '')}
                    </strong>
                  </span>
                  <span
                    className={`font-semibold ${
                      isIncrease ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  >
                    {isIncrease ? '+' : ''}
                    {feat.shap_value.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Clean Solid Proportional Bar */}
              <div className="w-full bg-[#1c2637] h-2 rounded-full overflow-hidden flex items-center">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isIncrease ? 'bg-blue-600' : 'bg-slate-500'
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
