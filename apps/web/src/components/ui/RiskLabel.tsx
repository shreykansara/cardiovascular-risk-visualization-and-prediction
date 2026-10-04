import React from 'react';
import { riskLabel, RiskBand } from '@/config/riskBands';

export interface RiskLabelProps {
  band?: RiskBand | string;
  probability?: number;
  className?: string;
}

export const RiskLabel: React.FC<RiskLabelProps> = ({
  band,
  probability,
  className = '',
}) => {
  const resolvedBand: RiskBand = (band && (band === 'Low' || band === 'Moderate' || band === 'High'))
    ? (band as RiskBand)
    : probability !== undefined
    ? riskLabel(probability)
    : 'Low';

  let dotColor = 'bg-risk-low';
  if (resolvedBand === 'Moderate') {
    dotColor = 'bg-risk-moderate';
  } else if (resolvedBand === 'High') {
    dotColor = 'bg-risk-high';
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
      <span className="text-[14px] leading-[20px] font-medium text-text">
        {resolvedBand}
      </span>
    </div>
  );
};
