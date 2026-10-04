/**
 * Shared Color Scale Legend for 3D Vessel Probability Shading
 * Task 4.2 / Task A2: Standardized risk bands: Low (<= 40%), Moderate (41-70%), High (> 70%)
 */

import React from 'react';
import { RISK_BANDS, RISK_LEVELS } from '../../config/riskBands';

export const ColorScaleLegend: React.FC = () => {
  return (
    <div className="p-3 rounded-lg border border-[var(--border,#E3E6EB)] bg-[var(--surface,#F7F8FA)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
      <span className="text-[var(--text-muted,#5B6472)] font-medium text-[11px] uppercase tracking-wider">
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
              <span className="text-[var(--text,#111827)] font-medium">
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
