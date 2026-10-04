import React from 'react';
import { RISK_BANDS } from '../../config/riskBands';

export const ColorScaleLegend: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-between gap-4 py-2 px-3 border-t border-border text-[12px] leading-[16px] text-text-muted bg-panel rounded-b">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-risk-low" />
        <span className="text-text font-medium">Low</span>
        <span>({RISK_BANDS.Low.rangeDisplay})</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-risk-moderate" />
        <span className="text-text font-medium">Moderate</span>
        <span>({RISK_BANDS.Moderate.rangeDisplay})</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-risk-high" />
        <span className="text-text font-medium">High</span>
        <span>({RISK_BANDS.High.rangeDisplay})</span>
      </div>
    </div>
  );
};

export default ColorScaleLegend;
