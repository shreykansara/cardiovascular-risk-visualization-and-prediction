import React from 'react';
import type { TargetPrediction } from '../../types/clinical';
import { RiskLabel } from '../ui/RiskLabel';
import { Bar } from '../ui/Bar';
import { Trace } from '../ui/Trace';

interface VesselCardProps {
  vesselKey: 'lad' | 'lcx' | 'rca';
  vesselCode: string; // "LAD", "LCX", "RCA"
  fullName: string; // "Left anterior descending", etc.
  prediction?: TargetPrediction;
  isSelected: boolean;
  onSelect: () => void;
  animationIndex?: number;
}

export const VesselCard: React.FC<VesselCardProps> = ({
  vesselCode,
  fullName,
  prediction,
  isSelected,
  onSelect,
  animationIndex = 2,
}) => {
  const prob = prediction?.probability ?? 0;
  const probFormatted = `${(prob * 100).toFixed(1)}%`;

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
      className={`row ${isSelected ? 'selected' : ''}`}
      style={{
        padding: '10px 12px',
        borderLeft: isSelected ? '3px solid var(--acc)' : '3px solid transparent',
        backgroundColor: isSelected ? 'var(--hov)' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 120ms, border-color 120ms',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--hov)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Row top line */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: vessel key in 600 weight + full name in 12px --mut + Trace at 64x14 */}
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {vesselCode}
          </span>
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--mut)',
            }}
          >
            {fullName}
          </span>
          <Trace
            width={64}
            height={14}
            style={{
              opacity: isSelected ? 1 : 0,
              transition: 'opacity 120ms',
              marginLeft: '4px',
            }}
          />
        </div>

        {/* Right: probability in mono 20px with one decimal and "%" + RiskLabel */}
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: 'var(--fm)',
              fontSize: '20px',
              fontWeight: 500,
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {probFormatted}
          </span>
          <RiskLabel probability={prob} />
        </div>
      </div>

      {/* Below: Bar with fill (animation --i 2, 3, 4) and two band markers */}
      <Bar
        value={prob}
        variant="probability"
        animationIndex={animationIndex}
      />
    </div>
  );
};

export default VesselCard;
