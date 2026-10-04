/**
 * Shared Color Scale Legend for 3D Vessel Probability Shading
 * Task 4.2 / Task A2 / Phase C: Standardized clinical risk bands with design tokens
 */

import React from 'react';
import { RISK_BANDS, RISK_LEVELS } from '../../config/riskBands';

export const ColorScaleLegend: React.FC = () => {
  return (
    <div className="p-2.5 px-3 rounded-md border border-[#283548] bg-[#131a26]/95 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-numbers select-none shadow-sm">
      <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
        Predicted Stenosis Probability:
      </span>

      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        {RISK_LEVELS.map((level) => {
          const band = RISK_BANDS[level];
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: band.colorHex }}
              />
              <span className="text-slate-200 font-medium">
                {band.label} ({band.rangeDisplay})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ColorScaleLegend;
