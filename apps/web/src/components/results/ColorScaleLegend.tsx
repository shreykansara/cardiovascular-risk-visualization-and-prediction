/**
 * Shared Color Scale Legend for 3D Vessel Probability Shading
 * Task 4.2: Visible legend showing probability ranges and clinical tiers.
 */

import React from 'react';

export const ColorScaleLegend: React.FC = () => {
  return (
    <div className="glass-card p-3 rounded-xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
      <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
        Predicted Stenosis Probability:
      </span>

      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        {/* Optimal / Patent */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
          <span className="text-slate-200">Patent (&le; 40%)</span>
        </div>

        {/* Borderline / Moderate */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
          <span className="text-slate-200">Borderline (40 – 70%)</span>
        </div>

        {/* Critical Ischemia */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0" />
          <span className="text-slate-200">Critical (&gt; 70%)</span>
        </div>
      </div>
    </div>
  );
};

export default ColorScaleLegend;
