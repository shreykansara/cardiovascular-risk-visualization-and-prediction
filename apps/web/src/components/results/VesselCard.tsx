import React from 'react';
import type { TargetPrediction } from '../../types/clinical';
import { RiskLabel } from '../ui/RiskLabel';
import { riskLabel } from '../../config/riskBands';

interface VesselCardProps {
  vesselKey: 'lad' | 'lcx' | 'rca';
  fullName: string;
  prediction?: TargetPrediction;
  isSelected: boolean;
  onSelect: () => void;
}

export const VesselCard: React.FC<VesselCardProps> = ({
  fullName,
  prediction,
  isSelected,
  onSelect,
}) => {
  const prob = prediction?.probability ?? 0;
  const probPct = Math.round(prob * 100);
  const band = riskLabel(prob);

  let barColor = 'bg-risk-low';
  if (band === 'Moderate') {
    barColor = 'bg-risk-moderate';
  } else if (band === 'High') {
    barColor = 'bg-risk-high';
  }

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      className={`w-full py-2.5 px-3 rounded cursor-pointer select-none transition-colors border-l-2 ${
        isSelected
          ? 'border-l-accent bg-accent-subtle'
          : 'border-l-transparent hover:bg-panel'
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[14px] leading-[22px] font-medium text-text">
          {fullName}
        </span>

        <div className="flex items-center gap-4">
          <span className="text-[24px] leading-[32px] font-semibold text-text tabular-nums">
            {probPct}%
          </span>
          <RiskLabel band={band} />
        </div>
      </div>

      {/* 4px flat bar beneath */}
      <div className="w-full h-1 bg-border rounded overflow-hidden">
        <div
          className={`h-full ${barColor}`}
          style={{ width: `${Math.min(Math.max(probPct, 2), 100)}%` }}
        />
      </div>
    </div>
  );
};

export default VesselCard;
